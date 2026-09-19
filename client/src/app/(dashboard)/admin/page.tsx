'use client';

import React, { useState } from 'react';
import Navigation from '../../../components/Navigation';
import { 
  ShieldCheck, Key, MessageSquareText, Activity, 
  Server, Database, Plus, RefreshCw, Edit2, Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'keys' | 'prompts' | 'health'>('keys');

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Header Profile Bar */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-error">System Administrator</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Admin Portal</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Manage AI API Keys, Prompt Templates, and System Health.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
          <button 
            onClick={() => setActiveTab('keys')}
            className={activeTab === 'keys' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Key size={16} /> API Key Pool
          </button>
          <button 
            onClick={() => setActiveTab('prompts')}
            className={activeTab === 'prompts' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <MessageSquareText size={16} /> Prompt Templates
          </button>
          <button 
            onClick={() => setActiveTab('health')}
            className={activeTab === 'health' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Activity size={16} /> System Health
          </button>
        </div>

        {/* TAB 1: API KEY POOL */}
        {activeTab === 'keys' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>AI API Key Pool Management</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The system automatically rotates keys to avoid Rate Limit (429).</p>
              </div>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add New Key
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Provider</th>
                    <th style={{ padding: '12px 16px' }}>Key Mask</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Usage Count</th>
                    <th style={{ padding: '12px 16px' }}>Last Used</th>
                    <th style={{ padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { provider: 'Google Gemini', mask: 'AIzaSyB...9KjA', status: 'Active', statusColor: 'var(--accent-success)', usage: '4,521', last: '2 mins ago' },
                    { provider: 'Google Gemini', mask: 'AIzaSyX...2MwQ', status: 'Rate Limited (Cooldown)', statusColor: 'var(--accent-error)', usage: '1,200', last: '15 mins ago' },
                    { provider: 'OpenAI GPT-4o', mask: 'sk-proj...7T3A', status: 'Active', statusColor: 'var(--accent-success)', usage: '8,922', last: 'Just now' },
                    { provider: 'Anthropic Claude', mask: 'sk-ant...9Lq1', status: 'Disabled', statusColor: 'var(--text-muted)', usage: '0', last: 'Never' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{row.provider}</td>
                      <td style={{ padding: '16px', fontFamily: 'monospace' }}>{row.mask}</td>
                      <td style={{ padding: '16px', color: row.statusColor }}>{row.status}</td>
                      <td style={{ padding: '16px' }}>{row.usage} reqs</td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{row.last}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROMPT TEMPLATES */}
        {activeTab === 'prompts' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>System Prompt Templates</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage prompts used for AI grading and Socratic tutoring.</p>
              </div>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Create Template
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Template 1 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Architecture Code Review</h4>
                  <span className="badge badge-info">v2.1</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  "You are a senior software architect grading a student's project. Focus on SOLID principles, layer separation, and clean code. Return response in Markdown."
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button>
                  <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#f43f5e' }}>Deactivate</button>
                </div>
              </div>

              {/* Template 2 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Socratic AI Tutor Chat</h4>
                  <span className="badge badge-info">v1.0</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  "You are a teaching assistant. NEVER give the student direct code answers. Instead, ask leading questions to guide them to find the bug themselves."
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit</button>
                  <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#f43f5e' }}>Deactivate</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HEALTH */}
        {activeTab === 'health' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>System Health & Metrics</h3>
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <RefreshCw size={16} /> Refresh Metrics
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Server size={32} color="#34d399" />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>API Server</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>UP (99.9%)</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <Database size={32} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Database (PostgreSQL)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>Connected</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(167, 139, 250, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                <Activity size={32} color="#a78bfa" />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Docker Sandbox</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a78bfa' }}>3 Containers Running</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
              {`[INFO] 2026-09-19T09:12:34Z GET /api/health - 200 OK (5ms)
[INFO] 2026-09-19T09:12:40Z POST /api/submissions - Queueing Sandbox task...
[INFO] 2026-09-19T09:12:42Z DockerSandbox - Task docker_sandbox_c891 completed in 142ms.
[WARN] 2026-09-19T09:15:00Z AI_API - Key AIzaSyX...2MwQ rate limited. Switching to fallback key.`}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
