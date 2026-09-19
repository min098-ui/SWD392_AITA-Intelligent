'use client';

import React, { useState } from 'react';
import Navigation from '../../../components/Navigation';
import { 
  Users, BookOpen, GitBranch, Settings, CheckCircle2, 
  AlertTriangle, Filter, Search, ShieldCheck, Download, FolderOpen, Plus, Link as LinkIcon
} from 'lucide-react';

export default function LecturerDashboard() {
  const [activeTab, setActiveTab] = useState<'teams' | 'overview' | 'config' | 'analytics' | 'peer'>('teams');

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Header Profile Bar */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-success">Lecturer</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Dr. Nguyen Van GiaoVien</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Managing Course: <strong style={{ color: '#fff' }}>SWD392 - Software Architecture & Design</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Download size={16} /> Export Grades
            </button>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              + New Assignment
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('teams')}
            className={activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <FolderOpen size={16} /> Team Management
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Users size={16} /> Class Overview
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Settings size={16} /> Rubric & Test Cases
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <GitBranch size={16} /> Git Free-Rider Radar
          </button>
          <button 
            onClick={() => setActiveTab('peer')}
            className={activeTab === 'peer' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <ShieldCheck size={16} /> Peer Audit Summary
          </button>
        </div>

        {/* TAB 0: TEAM MANAGEMENT */}
        {activeTab === 'teams' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Course: SWD392 Teams</h3>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Create New Team
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {/* Group 1 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>Group 4 (AITA)</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5 Members</span>
                  </div>
                  <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit Details</button>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Git Repository URL:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" defaultValue="https://github.com/aita-project/aita-intelligent.git" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.85rem' }} />
                    <button className="btn-secondary" style={{ padding: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}><LinkIcon size={14} color="#60a5fa" /></button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Members:</label>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Le Nguyen Anh Mai</span> <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Leader</span>
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Nguyen Van A</span> 
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tran Thi C</span> 
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pham Van D</span> 
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Hoang E</span> 
                    </li>
                  </ul>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', fontSize: '0.85rem', borderStyle: 'dashed' }}>
                    + Assign Student
                  </button>
                </div>
              </div>

              {/* Group 2 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>Group 2</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>4 Members</span>
                  </div>
                  <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Edit Details</button>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Git Repository URL:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Pending submission..." style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px dashed #f43f5e', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Members:</label>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Nguyen B</span> <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Leader</span>
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Le Van F</span> 
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tran G</span> 
                    </li>
                    <li style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ngo H</span> 
                    </li>
                  </ul>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', fontSize: '0.85rem', borderStyle: 'dashed' }}>
                    + Assign Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Recent Submissions: Milestone 1</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Search team or student..." style={{ padding: '8px 10px 8px 32px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }} />
                </div>
                <button className="btn-secondary" style={{ padding: '8px 12px' }}><Filter size={16} /> Filter</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Team</th>
                    <th style={{ padding: '12px 16px' }}>Repository</th>
                    <th style={{ padding: '12px 16px' }}>Sandbox Status</th>
                    <th style={{ padding: '12px 16px' }}>Grade (10)</th>
                    <th style={{ padding: '12px 16px' }}>AI Quality Score</th>
                    <th style={{ padding: '12px 16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { team: 'Group 1', repo: 'github.com/.../group1', status: 'Passed (10/10)', statusColor: 'var(--accent-success)', grade: '9.0', aiScore: 'A-' },
                    { team: 'Group 2', repo: 'github.com/.../g2', status: 'Failed (3/10)', statusColor: 'var(--accent-error)', grade: '3.5', aiScore: 'C' },
                    { team: 'Group 3', repo: 'github.com/.../g3', status: 'Passed (10/10)', statusColor: 'var(--accent-success)', grade: '8.5', aiScore: 'B+' },
                    { team: 'Group 4', repo: 'github.com/.../aita', status: 'Passed (10/10)', statusColor: 'var(--accent-success)', grade: '9.5', aiScore: 'A' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px' }}><strong>{row.team}</strong></td>
                      <td style={{ padding: '16px', color: '#60a5fa' }}>{row.repo}</td>
                      <td style={{ padding: '16px', color: row.statusColor }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {row.status.includes('Passed') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                          {row.status}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{row.grade}</td>
                      <td style={{ padding: '16px' }}>{row.aiScore}</td>
                      <td style={{ padding: '16px' }}>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Review Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CONFIG */}
        {activeTab === 'config' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Create / Edit Assignment</h3>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>Assignment Title</label>
                  <input type="text" defaultValue="Milestone 1: API & Auth" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>Docker Environment Setup (Dockerfile Content)</label>
                  <textarea rows={4} defaultValue="FROM node:18-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install\n..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>Rubric Constraints</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><input type="checkbox" defaultChecked /> Strict Timeout (2000ms)</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><input type="checkbox" defaultChecked /> AI Architecture Review</label>
                  </div>
                </div>
                <button type="button" className="btn-primary" style={{ padding: '10px', justifyContent: 'center' }}>Save Assignment Configurations</button>
              </form>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Test Cases</h3>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>+ Add Test Case</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>TC1: Valid Authentication</strong>
                    <span className="badge badge-info">Visible to Student</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Input: POST /login {`{...}`} | Expected: 200 OK + JWT</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px dashed #f43f5e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>TC2: SQL Injection Attack (Edge)</strong>
                    <span className="badge badge-error">Hidden from Student</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Input: username: ' OR 1=1 -- | Expected: 401 Unauthorized</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GIT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#f43f5e" /> Free-Rider Detection Radar
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              The system automatically scans all GitHub repositories, aggregating Lines of Code (LOC) and Commit Counts. Members with &lt; 15% contribution relative to their team average are flagged.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Student Name</th>
                  <th style={{ padding: '12px 16px' }}>Team</th>
                  <th style={{ padding: '12px 16px' }}>Commits</th>
                  <th style={{ padding: '12px 16px' }}>LOC Added/Deleted</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(244, 63, 94, 0.05)' }}>
                  <td style={{ padding: '16px' }}><strong>Hoang E</strong></td>
                  <td style={{ padding: '16px' }}>Group 4</td>
                  <td style={{ padding: '16px' }}>2</td>
                  <td style={{ padding: '16px' }}><span style={{ color: '#34d399' }}>+120</span> / <span style={{ color: '#f43f5e' }}>-10</span></td>
                  <td style={{ padding: '16px' }}><span className="badge badge-error">⚠️ Free-Rider Warning</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}><strong>Nguyen B</strong></td>
                  <td style={{ padding: '16px' }}>Group 2</td>
                  <td style={{ padding: '16px' }}>5</td>
                  <td style={{ padding: '16px' }}><span style={{ color: '#34d399' }}>+450</span> / <span style={{ color: '#f43f5e' }}>-230</span></td>
                  <td style={{ padding: '16px' }}><span className="badge badge-info">Low Activity</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}><strong>Le Nguyen Anh Mai</strong></td>
                  <td style={{ padding: '16px' }}>Group 4</td>
                  <td style={{ padding: '16px' }}>42</td>
                  <td style={{ padding: '16px' }}><span style={{ color: '#34d399' }}>+1,245</span> / <span style={{ color: '#f43f5e' }}>-400</span></td>
                  <td style={{ padding: '16px' }}><span className="badge badge-success">Top Contributor</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: PEER AUDIT SUMMARY */}
        {activeTab === 'peer' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#34d399" /> Peer Audit Summary (Round 1)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Group Card */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>Group 4 (AITA)</strong>
                  <span className="badge badge-success">100% Submitted</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Le Nguyen Anh Mai</span>
                    <strong style={{ color: '#34d399' }}>9.8 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Nguyen Van A</span>
                    <strong style={{ color: '#34d399' }}>9.0 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Tran Thi C</span>
                    <strong style={{ color: '#34d399' }}>8.5 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Hoang E</span>
                    <strong style={{ color: '#f43f5e' }}>4.2 / 10</strong>
                  </div>
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>View Detailed Comments</button>
              </div>

              {/* Group Card 2 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>Group 2</strong>
                  <span className="badge badge-error">3/5 Submitted</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', opacity: 0.7 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting for all members to complete evaluation before calculating final score.</p>
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>Send Reminder Email</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
