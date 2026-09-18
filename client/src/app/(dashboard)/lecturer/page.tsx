'use client';

import React, { useState } from 'react';
import Navigation from '../../../components/Navigation';
import { 
  PlusCircle, GitCommit, Users, CheckCircle2, ShieldAlert, 
  Layers, Code2, Eye, EyeOff, BarChart3, TrendingUp
} from 'lucide-react';

export default function LecturerDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'git' | 'rubric'>('git');

  // Sample commit data from Group 4 members
  const memberStats = [
    { name: 'Lê Nguyễn Ánh Mai', mssv: 'QE190151', module: 'Architecture & Core Auth', commits: 24, added: 1420, deleted: 310, status: 'Active' },
    { name: 'Đỗ Trần Đăng Khoa', mssv: 'QE190122', module: 'Docker Sandbox & Autograding', commits: 21, added: 1180, deleted: 190, status: 'Active' },
    { name: 'Nguyễn Quốc Thanh Phong', mssv: 'QE190030', module: 'AI Engine & Key Rotation', commits: 19, added: 980, deleted: 140, status: 'Active' },
    { name: 'Đinh Gia Huy', mssv: 'QE190149', module: 'Database Schema & Peer Audit', commits: 18, added: 890, deleted: 120, status: 'Active' },
    { name: 'Nguyễn Tường Vy', mssv: 'QE180099', module: 'Frontend UI/UX & QA Testing', commits: 22, added: 1350, deleted: 260, status: 'Active' },
  ];

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Header Profile */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-success">Lecturer</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Dr. Nguyen Van Giang</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>(giangnv@fe.edu.vn)</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Assigned Course: <strong style={{ color: '#fff' }}>SWD392 - K18/K19 (Term FA26)</strong> • Total: <strong style={{ color: '#fff' }}>8 Project Teams</strong>
            </p>
          </div>

          <button className="btn-primary" onClick={() => alert('Open create new assignment modal')}>
            <PlusCircle size={16} /> Create Assignment &amp; Configure Rubrics
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
          <button 
            onClick={() => setActiveTab('git')}
            className={activeTab === 'git' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <BarChart3 size={16} /> Git Contributions &amp; Anti-Free-Rider
          </button>
          <button 
            onClick={() => setActiveTab('submissions')}
            className={activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <CheckCircle2 size={16} /> Submission Monitor &amp; Sandbox Grading
          </button>
          <button 
            onClick={() => setActiveTab('rubric')}
            className={activeTab === 'rubric' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Code2 size={16} /> Public / Hidden Test Cases Config
          </button>
        </div>

        {/* TAB 1: GIT ANALYTICS & ANTI-FREE-RIDER */}
        {activeTab === 'git' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Member Contribution Analytics (Group 4 - AITA Project)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data automatically synchronized via GitHub REST API based on Commit Author</p>
                </div>
                <span className="badge badge-info">Distribution Score: 96% (Good)</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 10px' }}>Member</th>
                      <th style={{ padding: '12px 10px' }}>Student ID</th>
                      <th style={{ padding: '12px 10px' }}>Assigned Module</th>
                      <th style={{ padding: '12px 10px' }}>Commits</th>
                      <th style={{ padding: '12px 10px' }}>Lines Added (+)</th>
                      <th style={{ padding: '12px 10px' }}>Lines Deleted (-)</th>
                      <th style={{ padding: '12px 10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberStats.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 10px', fontWeight: 600, color: '#fff' }}>{m.name}</td>
                        <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{m.mssv}</td>
                        <td style={{ padding: '14px 10px' }}>
                          <span style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {m.module}
                          </span>
                        </td>
                        <td style={{ padding: '14px 10px' }}><strong>{m.commits}</strong> commits</td>
                        <td style={{ padding: '14px 10px', color: '#34d399' }}>+{m.added}</td>
                        <td style={{ padding: '14px 10px', color: '#f43f5e' }}>-{m.deleted}</td>
                        <td style={{ padding: '14px 10px' }}>
                          <span className="badge badge-success">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Pending Submission Approvals</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '1rem' }}>Group 4 - AITA Project</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Milestone 1: Backend API &amp; Sandbox Runner</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="badge badge-success">Docker Sandbox: PASS</span>
                <span className="badge badge-info">AI Score: 9.5</span>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>View Details</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUBRIC CONFIG */}
        {activeTab === 'rubric' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Rubric Criteria Management (Hidden / Public Test Cases)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Lecturers can set <code>is_hidden = true</code> for edge cases to evaluate student problem-solving without leaking test specs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>TC-01: Standard Input Evaluation</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>(Weight: 30% - Max Score: 3.0)</span>
                </div>
                <span className="badge badge-info"><Eye size={12} /> Public</span>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>TC-02: Boundary &amp; Memory Limit Stress Test</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>(Weight: 30% - Max Score: 3.0)</span>
                </div>
                <span className="badge badge-warning"><EyeOff size={12} /> Hidden from students</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
