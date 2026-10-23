import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';
import { aiTutorService } from './ai-tutor.service';
import { encryptApiKey, CryptoService } from './crypto.service';

const router = Router();

// =============================================================================
// 1. TUTOR CHAT SESSIONS & MESSAGING (Socratic AI Tutor Engine)
// =============================================================================

// POST /api/ai-tutor/sessions - Create a new chat session
router.post('/sessions', authenticateJWT, async (req: Request, res: Response) => {
  const user = req.user!;
  const { submission_id, assignment_id, session_title } = req.body;

  try {
    const title = session_title || 'Phiên trợ giảng Socratic AI';
    const result = await pool.query(
      `INSERT INTO tutor_chat_sessions (user_id, submission_id, assignment_id, session_title)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.userId, submission_id || null, assignment_id || null, title]
    );

    return res.status(201).json({
      message: 'Chat session created successfully',
      session: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// GET /api/ai-tutor/sessions/:sessionId/messages - Get message history of a session
router.get('/sessions/:sessionId/messages', authenticateJWT, async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  try {
    const result = await pool.query(
      `SELECT m.*, u.full_name as student_name
       FROM tutor_chat_messages m
       LEFT JOIN users u ON m.user_id = u.user_id
       WHERE m.session_id = $1
       ORDER BY m.created_at ASC`,
      [sessionId]
    );
    return res.json({ messages: result.rows });
  } catch (error: any) {
    console.error('Error fetching session messages:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /api/ai-tutor/sessions/:sessionId/chat - Send Socratic query within a session
router.post('/sessions/:sessionId/chat', authenticateJWT, async (req: Request, res: Response) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  const user = req.user!;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch session details if any
    const sessionRes = await client.query(
      `SELECT * FROM tutor_chat_sessions WHERE session_id = $1`,
      [sessionId]
    );
    const session = sessionRes.rows[0];

    // Call Socratic AI engine with key rotation on HTTP 429
    const socraticResult = await aiTutorService.generateSocraticResponse(content, {
      submissionId: session?.submission_id,
    });

    // 1. Record student message
    const studentMsgRes = await client.query(
      `INSERT INTO tutor_chat_messages 
       (session_id, user_id, submission_id, prompt_template_id, ai_api_key_id, sender_type, content)
       VALUES ($1, $2, $3, $4, $5, 'STUDENT', $6) 
       RETURNING *`,
      [
        sessionId,
        user.userId,
        session?.submission_id || null,
        socraticResult.promptTemplateId || null,
        socraticResult.keyInfo?.id || null,
        content,
      ]
    );

    // 2. Record AI response
    const aiMsgRes = await client.query(
      `INSERT INTO tutor_chat_messages 
       (session_id, user_id, submission_id, prompt_template_id, ai_api_key_id, sender_type, content)
       VALUES ($1, $2, $3, $4, $5, 'AI', $6) 
       RETURNING *`,
      [
        sessionId,
        user.userId,
        session?.submission_id || null,
        socraticResult.promptTemplateId || null,
        socraticResult.keyInfo?.id || null,
        socraticResult.aiResponseText,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      student_message: studentMsgRes.rows[0],
      ai_message: aiMsgRes.rows[0],
      key_info: socraticResult.keyInfo,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error in AI Tutor session chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    client.release();
  }
});

// =============================================================================
// 2. ADMIN KEY POOL MANAGEMENT (BR-02 AES-256 & BR-04 Key Rotation)
// =============================================================================

// GET /api/ai-tutor/admin/keys - View Key Pool status & usage counts
router.get('/admin/keys', authenticateJWT, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ai_api_key_id, provider, status, usage_count, rotated_at, created_at, key_value_encrypted
       FROM ai_api_keys 
       ORDER BY ai_api_key_id ASC`
    );

    const sanitizedKeys = result.rows.map((row) => ({
      ai_api_key_id: row.ai_api_key_id,
      provider: row.provider,
      status: row.status,
      usage_count: row.usage_count,
      rotated_at: row.rotated_at,
      created_at: row.created_at,
      is_encrypted: CryptoService.isEncrypted(row.key_value_encrypted),
      preview: CryptoService.maskApiKey(row.key_value_encrypted),
    }));

    return res.json({ keys: sanitizedKeys });
  } catch (err: any) {
    console.error('Error fetching keys:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// POST /api/ai-tutor/admin/keys - Add new API Key to pool (AES-256 Encrypted)
router.post('/admin/keys', authenticateJWT, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { provider, api_key } = req.body;

  if (!provider || !api_key) {
    return res.status(400).json({ message: 'provider and api_key are required' });
  }

  try {
    // BR-02: Encrypt API Key before saving into Database
    const encryptedKey = encryptApiKey(api_key);

    const result = await pool.query(
      `INSERT INTO ai_api_keys (provider, key_value_encrypted, api_key_encrypted, status, usage_count)
       VALUES ($1, $2, $2, 'ACTIVE', 0)
       RETURNING ai_api_key_id, provider, status, usage_count, created_at`,
      [provider, encryptedKey]
    );

    return res.status(201).json({
      message: 'API Key added and encrypted with AES-256 successfully',
      key: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error adding API key:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// PATCH /api/ai-tutor/admin/keys/:id/status - Manually update key status
router.patch('/admin/keys/:id/status', authenticateJWT, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const keyId = parseInt(req.params.id, 10);
  const { status } = req.body;

  const validStatuses = ['ACTIVE', 'INACTIVE', 'RATE_LIMITED', 'EXHAUSTED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE ai_api_keys 
       SET status = $1, rotated_at = NOW() 
       WHERE ai_api_key_id = $2 
       RETURNING ai_api_key_id, provider, status, usage_count, rotated_at`,
      [status, keyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Key not found' });
    }

    return res.json({
      message: 'Key status updated successfully',
      key: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error updating key status:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// =============================================================================
// 3. PROMPT TEMPLATE VERSIONING (BR-05)
// =============================================================================

// GET /api/ai-tutor/admin/prompts - List prompt templates
router.get('/admin/prompts', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const purpose = req.query.purpose as string;

  try {
    let query = 'SELECT * FROM prompt_templates';
    const params: any[] = [];
    if (purpose) {
      query += ' WHERE purpose = $1';
      params.push(purpose);
    }
    query += ' ORDER BY prompt_template_id ASC';

    const result = await pool.query(query, params);
    return res.json({ prompts: result.rows });
  } catch (err: any) {
    console.error('Error fetching prompts:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// POST /api/ai-tutor/admin/prompts - Create new version of prompt template (BR-05)
router.post('/admin/prompts', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const { name, purpose, template_content, system_prompt, version, temperature } = req.body;

  if (!name || !purpose || !template_content) {
    return res.status(400).json({ message: 'name, purpose, and template_content are required' });
  }

  try {
    const templateVersion = version || 'v1.0';
    const tempValue = temperature !== undefined ? parseFloat(temperature) : 0.2;

    const result = await pool.query(
      `INSERT INTO prompt_templates (name, purpose, template_content, system_prompt, version, temperature, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [name, purpose, template_content, system_prompt || null, templateVersion, tempValue]
    );

    return res.status(201).json({
      message: 'New prompt template version created successfully',
      prompt: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error adding prompt template:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// =============================================================================
// 4. BACKWARDS COMPATIBLE SUBMISSION-BASED CHAT ENDPOINTS
// =============================================================================

// GET /api/ai-tutor/:submissionId/messages - Get chat history for a submission
router.get('/:submissionId/messages', authenticateJWT, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId;

  try {
    const result = await pool.query(
      `SELECT m.*, u.full_name as student_name
       FROM tutor_chat_messages m
       LEFT JOIN users u ON m.user_id = u.user_id
       WHERE m.submission_id = $1
       ORDER BY m.created_at ASC`,
      [submissionId]
    );
    return res.json({ messages: result.rows });
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /api/ai-tutor/:submissionId/chat - Send query to AI Tutor for a submission
router.post('/:submissionId/chat', authenticateJWT, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId;
  const user = req.user!;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Call Socratic AI engine with key rotation
    const socraticResult = await aiTutorService.generateSocraticResponse(content, {
      submissionId: parseInt(submissionId, 10),
    });

    // 1. Save Student message
    const studentMsgRes = await client.query(
      `INSERT INTO tutor_chat_messages 
       (user_id, submission_id, prompt_template_id, ai_api_key_id, sender_type, content)
       VALUES ($1, $2, $3, $4, 'STUDENT', $5) 
       RETURNING *`,
      [
        user.userId,
        submissionId,
        socraticResult.promptTemplateId || null,
        socraticResult.keyInfo?.id || null,
        content,
      ]
    );

    // 2. Save AI Response
    const aiMsgRes = await client.query(
      `INSERT INTO tutor_chat_messages 
       (user_id, submission_id, prompt_template_id, ai_api_key_id, sender_type, content)
       VALUES ($1, $2, $3, $4, 'AI', $5) 
       RETURNING *`,
      [
        user.userId,
        submissionId,
        socraticResult.promptTemplateId || null,
        socraticResult.keyInfo?.id || null,
        socraticResult.aiResponseText,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      student_message: studentMsgRes.rows[0],
      ai_message: aiMsgRes.rows[0],
      key_info: socraticResult.keyInfo,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error in AI Tutor chat:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    client.release();
  }
});

export default router;
