'use client';

import React, { useState } from 'react';
import Navigation from '../../../components/Navigation';
import { 
  ShieldCheck, Key, RefreshCw, Layers, CheckCircle2, 
  AlertTriangle, FileText, PlusCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'keys' | 'prompts' | 'users'>('keys');

  const [apiKeys, setApiKeys] = useState([
    { id: 1, provider: 'Google Gemini (gemini-1.5-pro)', status: 'ACTIVE', usage: 142, rotated_at: 'Today 10:15', key: 'enc_gemini_api_key_****89a' },
    { id: 2, provider: 'OpenAI (gpt-4o)', status: 'ACTIVE', usage: 89, rotated_at: 'Yesterday 18:30', key: 'enc_openai_api_key_****b42' },
    { id: 3, provider: 'Google Gemini Backup', status: 'RATE_LIMITED', usage: 500, rotated_at: '2 hours ago', key: 'enc_gemini_backup_****11c' },
  ]);

  const handleRotateKey = (id: number) => {
    alert(`Activated key rotation (Rotate Key #${id}) and switched to next active key!`);
  };

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Header Profile */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-danger">System Admin</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>System Administrator</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>(admin@fpt.edu.vn)</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Management Scope: <strong style={{ color: '#fff' }}>AI Infrastructure, Key Pool Management, Prompt Templates &amp; Accounts</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-success">AI Pool Health: 99.8%</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
          <button 
            onClick={() => setActiveTab('keys')}
            className={activeTab === 'keys' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Key size={16} /> AI Key Pool &amp; Rotation Management
          </button>
          <button 
            onClick={() => setActiveTab('prompts')}
            className={activeTab === 'prompts' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <FileText size={16} /> Prompt Templates Versioning
          </button>
        </div>

        {/* TAB 1: AI KEYS POOL */}
        {activeTab === 'keys' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>AI API Key Pool (Key Pool Management)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Complies with NFR-REL-02: Automatic key failover &amp; rotation on Rate Limit (HTTP 429) or quota exhaustion.
                </p>
              </div>
              <button className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                <PlusCircle size={15} /> Add New Key
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {apiKeys.map(k => (
                <div key={k.id} style={{
                  padding: '1.2rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '1rem', color: '#fff' }}>{k.provider}</strong>
                      <span className={k.status === 'ACTIVE' ? 'badge badge-success' : 'badge badge-warning'}>
                        {k.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem' }}>
                      <span>Encrypted Key: <code>{k.key}</code></span>
                      <span>Requests: <strong>{k.usage}</strong></span>
                      <span>Last Rotated: {k.rotated_at}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRotateKey(k.id)}
                    className="btn-secondary" 
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    <RefreshCw size={14} /> Rotate this Key
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PROMPT TEMPLATES */}
        {activeTab === 'prompts' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Prompt Templates Version Control (NFR-MAI-02)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Each prompt is strictly versioned to ensure reproducibility and explainability during grading.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>Code Grading Feedback Prompt</strong>
                  <span className="badge badge-info">Version: v1.0</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Purpose: Grade submissions and generate detailed qualitative feedback</p>
                <div className="code-box" style={{ fontSize: '0.78rem' }}>
                  Evaluate the student submission for assignment {"{{assignment_title}}"}. Rubric: {"{{criterion}}"}. Expected: {"{{expected_output}}"}. Provide constructive review and complexity analysis.
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>Interactive AI Tutor Chat Prompt</strong>
                  <span className="badge badge-info">Version: v1.0</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Purpose: Support students via the Socratic method without giving direct solutions</p>
                <div className="code-box" style={{ fontSize: '0.78rem' }}>
                  You are AITA, a friendly and knowledgeable AI coding tutor. Guide the student using the Socratic method without giving out direct solutions.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
