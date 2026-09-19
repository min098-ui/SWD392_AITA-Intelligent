'use client';

import React, { useState } from 'react';
import Navigation from '../../../components/Navigation';
import { 
  Send, Bot, CheckCircle2, Clock, GitBranch, MessageSquare, 
  Terminal, AlertCircle, FileCode, Users, ExternalLink, Sparkles, BookOpen
} from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'courses' | 'submit' | 'results' | 'chat' | 'peer' | 'analytics'>('courses');
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: 'Hello! I am your AI Teaching Assistant (AITA). Your submission has just completed grading in Docker Sandbox with a score of 9.5/10. Would you like me to analyze any specific piece of code or suggest runtime optimizations?'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { sender: 'STUDENT', text: userText }]);
    setInputMsg('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        {
          sender: 'AI',
          text: `💡 **AI Tutor Feedback:** Regarding your question "${userText}":\nIn the matrix calculation routine, you are currently using nested loops with $O(N^2)$ complexity. If input dimensions scale up, consider using Two Pointers or Hash Map indexing to reduce complexity to $O(N)$!`
        }
      ]);
    }, 800);
  };

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Header Profile Bar */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-info">Student</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Le Nguyen Anh Mai</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>(mai.lna.qe190151@fpt.edu.vn)</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Course: <strong style={{ color: '#fff' }}>SWD392 - FA26</strong> • Team: <strong style={{ color: '#fff' }}>Group 4 (AITA Project)</strong>
            </p>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '8px 16px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'block' }}>Assigned Module</span>
            <strong style={{ fontSize: '0.92rem', color: '#60a5fa' }}>Architecture, Auth &amp; Course Core</strong>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('courses')}
            className={activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <BookOpen size={16} /> My Courses &amp; Deadlines
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <CheckCircle2 size={16} /> Grading Results &amp; AI Feedback
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Bot size={16} /> AI Tutor (Socratic Chat)
          </button>
          <button 
            onClick={() => setActiveTab('submit')}
            className={activeTab === 'submit' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <FileCode size={16} /> New Submission
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <GitBranch size={16} /> Git Analytics
          </button>
          <button 
            onClick={() => setActiveTab('peer')}
            className={activeTab === 'peer' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Users size={16} /> Peer Audit
          </button>
        </div>

        {/* TAB 0: COURSES */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#38bdf8" /> Enrolled Courses
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Course Card */}
              <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #38bdf8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '8px' }}>SWD392</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Software Architecture and Design</h4>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Lecturer: Dr. Nguyen Van GiaoVien
                </p>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Due in 2 days
                    </span>
                  </div>
                  <h5 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Milestone 1: Backend API &amp; Sandbox Runner</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Implement authentication, Docker sandbox environment, and core database schema.
                  </p>
                  <button onClick={() => setActiveTab('submit')} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}>
                    Go to Submission
                  </button>
                </div>
              </div>

              {/* Course Card 2 */}
              <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #a78bfa', opacity: 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge" style={{ marginBottom: '8px', background: 'rgba(167, 139, 250, 0.2)', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.4)' }}>PRJ301</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Java Web Application Development</h4>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Lecturer: Dr. Tran Thi B
                </p>
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No upcoming deadlines
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: RESULTS */}
        {activeTab === 'results' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Left: Detailed test cases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Milestone 1: Backend API &amp; Sandbox Runner</h3>
                  <span className="badge badge-success">GRADED • 9.5 / 10</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <span>Commit: <code style={{ color: '#38bdf8' }}>7a9f4c2...</code></span>
                  <span>Sandbox: <code style={{ color: '#a78bfa' }}>docker_sandbox_c891</code></span>
                  <span>Execution Time: <strong>142ms</strong></span>
                </div>

                {/* Rubric Rules Result List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Rule 1 */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Test Case 1: Standard Input Evaluation</span>
                      <span className="badge badge-success">PASSED • 3.0 / 3.0</span>
                    </div>
                    <div className="code-box" style={{ fontSize: '0.8rem', margin: '8px 0' }}>
                      Input: matrix = [[1, 2], [3, 4]] <br />
                      Expected: 10 | Actual: 10 (Execution time: 42ms)
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Test Case 2: Boundary / Edge Case (Hidden Test)</span>
                      <span className="badge badge-success">PASSED • 3.0 / 3.0</span>
                    </div>
                    <div className="code-box" style={{ fontSize: '0.8rem', margin: '8px 0', color: 'var(--text-muted)' }}>
                      [Hidden Test Case] Student successfully passed all 5/5 secret boundary test cases.
                    </div>
                  </div>

                  {/* Rule 3 - AI Analysis */}
                  <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}>
                        <Sparkles size={16} /> Clean Code &amp; Architecture Review by AI
                      </span>
                      <span className="badge badge-success">3.5 / 4.0</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '8px', lineHeight: 1.6 }}>
                      🤖 <strong>AI Feedback:</strong> The team properly implemented a clean 3-tier architecture with clear layer separation. 
                      Functions have intuitive naming and exceptions are handled systematically. 
                      Minor improvement: Move JWT secret configuration to environment variables rather than having hardcoded fallbacks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick actions & Peer audit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Repository Information</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '6px' }}>Repo URL:</p>
                  <code style={{ color: '#60a5fa', wordBreak: 'break-all' }}>
                    https://github.com/aita-project/aita-intelligent.git
                  </code>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Peer Audit</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Audit Round 1 is open. Please review and evaluate contributions for the other 4 team members.
                  </p>
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    Open Peer Audit Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI TUTOR CHAT */}
        {activeTab === 'chat' && (
          <div className="glass-card" style={{ height: '620px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} color="#fff" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>AITA Coding Assistant (Socratic Tutor)</h4>
                  <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● Online • Context linked to Submission #1</span>
                </div>
              </div>
              <span className="badge badge-info">Gemini 1.5 Pro / GPT-4o</span>
            </div>

            {/* Chat messages list */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((m, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'STUDENT' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: m.sender === 'STUDENT' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: m.sender === 'STUDENT' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.75rem', color: m.sender === 'STUDENT' ? '#93c5fd' : '#c084fc', marginBottom: '4px' }}>
                    {m.sender === 'STUDENT' ? 'You' : '🤖 AITA Tutor'}
                  </strong>
                  {m.text}
                </div>
              ))}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="text"
                placeholder="Ask a question about test case failures or code optimization..."
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn-primary">
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SUBMISSION FORM */}
        {activeTab === 'submit' && (
          <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Submit Assignment on behalf of Team</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Upon submission, the system automatically launches a Docker Sandbox container to compile and run the test suite, 
              while AI analyzes code quality and returns results within 1-2 minutes.
            </p>

            <form onSubmit={e => { e.preventDefault(); alert('Submission created and queued in Docker Sandbox successfully!'); setActiveTab('results'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>Git Repository / Artifact URL (*)</label>
                <input 
                  type="text" 
                  defaultValue="https://github.com/aita-project/aita-intelligent.git"
                  required
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>Git Commit Hash (*)</label>
                <input 
                  type="text" 
                  defaultValue="7a9f4c28e9b11029c0d3817f"
                  required
                  placeholder="e.g.: 7a9f4c28e9b11029c0d3817f"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
                Confirm Submission &amp; Run Docker Sandbox
              </button>
            </form>
          </div>
        )}
        {/* TAB 4: GIT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={20} color="#38bdf8" /> Team Git Contribution Report
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Commits</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#38bdf8' }}>42</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Lines of Code (LOC)</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa' }}>1,245</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Team Ranking</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399' }}>#2 / 5</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Team Contribution Overview</h4>
              {/* Mock Bar Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { name: 'Nguyen Van A', loc: 1450, color: '#38bdf8' },
                  { name: 'Le Nguyen Anh Mai', loc: 1245, color: '#34d399' },
                  { name: 'Tran Thi C', loc: 1100, color: '#a78bfa' },
                  { name: 'Pham Van D', loc: 950, color: '#fbbf24' },
                  { name: 'Hoang E', loc: 120, color: '#f43f5e', alert: true },
                ].map((member, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '150px', fontSize: '0.9rem', color: member.alert ? '#f43f5e' : 'var(--text-main)' }}>
                      {member.name} {member.name === 'Le Nguyen Anh Mai' && '(You)'}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${(member.loc / 1500) * 100}%`, background: member.color, height: '100%' }} />
                    </div>
                    <div style={{ width: '60px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {member.loc}
                    </div>
                    {member.alert && (
                      <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>Free-Rider Warning</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PEER AUDIT */}
        {activeTab === 'peer' && (
          <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#f472b6" /> Peer Audit Evaluation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
              Evaluate your teammates based on their contribution, communication, and code quality. 
              Your evaluation is strictly confidential and will only be seen by the lecturer.
            </p>

            <form onSubmit={e => { e.preventDefault(); alert('Peer Audit submitted successfully!'); setActiveTab('results'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '8px', fontWeight: 600 }}>Select Teammate</label>
                <select style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}>
                  <option value="">-- Choose a member to evaluate --</option>
                  <option value="1">Nguyen Van A</option>
                  <option value="2">Tran Thi C</option>
                  <option value="3">Pham Van D</option>
                  <option value="4">Hoang E</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '8px', fontWeight: 600 }}>Contribution Score (1-10)</label>
                <input type="number" min="1" max="10" placeholder="e.g. 8" required style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '8px', fontWeight: 600 }}>Constructive Feedback</label>
                <textarea rows={4} placeholder="Describe their strengths and areas for improvement..." required style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '12px', justifyContent: 'center', marginTop: '1rem' }}>
                Submit Evaluation
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
