import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';

const router = Router();

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
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper: Key Rotation Logic (NFR-REL-02)
async function getNextActiveApiKey(): Promise<{ id: number; provider: string; key: string } | null> {
  const result = await pool.query(
    `SELECT ai_api_key_id, provider, key_value_encrypted, status, usage_count 
     FROM ai_api_keys 
     WHERE status = 'ACTIVE' 
     ORDER BY usage_count ASC LIMIT 1`
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { id: row.ai_api_key_id, provider: row.provider, key: row.key_value_encrypted };
}

// POST /api/ai-tutor/:submissionId/chat - Send query to AI Tutor
router.post('/:submissionId/chat', authenticateJWT, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId;
  const user = req.user!;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get active API Key & Prompt Template
    let activeKey = await getNextActiveApiKey();
    const promptRes = await client.query(
      `SELECT prompt_template_id, template_content FROM prompt_templates WHERE purpose = 'TutorChat' LIMIT 1`
    );
    const promptId = promptRes.rows[0]?.prompt_template_id || null;

    // 2. Save Student message
    const studentMsgRes = await client.query(
      `INSERT INTO tutor_chat_messages (user_id, submission_id, prompt_template_id, ai_api_key_id, sender_type, content)
       VALUES ($1, $2, $3, $4, 'STUDENT', $5) RETURNING *`,
      [user.userId, submissionId, promptId, activeKey?.id || null, content]
    );

    // 3. AI Socratic Response Generation (Simulated intelligent tutor engine)
    const aiResponseText = `Chào bạn! Mình là Trợ giảng AI (AITA).
Đối với câu hỏi của bạn: "${content}"
💡 **Gợi ý hướng xử lý:**
1. Hãy kiểm tra lại trường hợp biên (edge cases), đặc biệt là khi mảng đầu vào rỗng hoặc giá trị âm.
2. Đảm bảo cấu trúc dữ liệu của bạn có độ phức tạp thời gian O(N) hoặc O(N log N) để không bị timeout trong Docker Sandbox.
3. Thử in debug console.log hoặc print() tại các bước biến đổi dữ liệu để kiểm tra kết quả trung gian nhé!`;

    // 4. Save AI Response
    const aiMsgRes = await client.query(
      `INSERT INTO tutor_chat_messages (user_id, submission_id, prompt_template_id, ai_api_key_id, sender_type, content)
       VALUES ($1, $2, $3, $4, 'AI', $5) RETURNING *`,
      [user.userId, submissionId, promptId, activeKey?.id || null, aiResponseText]
    );

    // 5. Update Key Usage Count & Rotation metric
    if (activeKey) {
      await client.query(
        `UPDATE ai_api_keys SET usage_count = usage_count + 1 WHERE ai_api_key_id = $1`,
        [activeKey.id]
      );
    }

    await client.query('COMMIT');

    return res.json({
      student_message: studentMsgRes.rows[0],
      ai_message: aiMsgRes.rows[0],
      key_info: { provider: activeKey?.provider || 'Mock-AI', rotated: false },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in AI Tutor chat:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Admin: GET /api/ai-tutor/keys - Manage API Key Pool
router.get('/admin/keys', authenticateJWT, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM ai_api_keys ORDER BY ai_api_key_id ASC');
    return res.json({ keys: result.rows });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: GET /api/ai-tutor/prompts - Manage Prompt Templates
router.get('/admin/prompts', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM prompt_templates ORDER BY prompt_template_id ASC');
    return res.json({ prompts: result.rows });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
