'use client';

import React, { useState } from 'react';
import Navigation from '../../../components/Navigation';
import { 
  Send, Bot, CheckCircle2, Clock, GitBranch, MessageSquare, 
  Terminal, AlertCircle, FileCode, Users, ExternalLink, Sparkles
} from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'submit' | 'results' | 'chat' | 'peer'>('results');
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: 'Chào bạn! Mình là Trợ giảng AI (AITA). Bài nộp của bạn vừa hoàn thành chấm trong Docker Sandbox đạt 9.5/10. Bạn có cần mình phân tích đoạn code nào hoặc tối ưu thời gian chạy không?'
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
          text: `💡 **Phản hồi từ AI Tutor:** Về thắc mắc "${userText}" của bạn:\nTrong hàm xử lý ma trận, bạn đang sử dụng 2 vòng lặp lồng nhau $O(N^2)$. Nếu mảng kích thước lớn, bạn có thể cân nhắc dùng kỹ thuật Hai con trỏ (Two Pointers) hoặc Hash Map để giảm xuống $O(N)$ nhé!`
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
              <span className="badge badge-info">Sinh Viên</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Lê Nguyễn Ánh Mai</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>(mai.lna.qe190151@fpt.edu.vn)</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Môn học: <strong style={{ color: '#fff' }}>SWD392 - FA26</strong> • Nhóm: <strong style={{ color: '#fff' }}>Group 4 (AITA Project)</strong>
            </p>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '8px 16px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'block' }}>Module phụ trách (Assigned Module)</span>
            <strong style={{ fontSize: '0.92rem', color: '#60a5fa' }}>Architecture, Auth &amp; Course Core</strong>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
          <button 
            onClick={() => setActiveTab('results')}
            className={activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <CheckCircle2 size={16} /> Kết Quả Chấm Điểm &amp; Feedback AI
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Bot size={16} /> Trợ Giảng AI (Tutor Chat)
          </button>
          <button 
            onClick={() => setActiveTab('submit')}
            className={activeTab === 'submit' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <FileCode size={16} /> Nộp Bài Mới
          </button>
        </div>

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
                  <span>Thời gian chạy: <strong>142ms</strong></span>
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
                      [Hidden Test Case] Sinh viên vượt qua toàn bộ 5/5 test case kiểm thử biên bí mật.
                    </div>
                  </div>

                  {/* Rule 3 - AI Analysis */}
                  <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}>
                        <Sparkles size={16} /> Đánh giá Clean Code &amp; Kiến trúc bằng AI
                      </span>
                      <span className="badge badge-success">3.5 / 4.0</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '8px', lineHeight: 1.6 }}>
                      🤖 <strong>AI Feedback:</strong> Nhóm đã áp dụng tốt mô hình 3 lớp phân tách rõ ràng. 
                      Các hàm xử lý có đặt tên biến rõ ràng, xử lý exception đầy đủ. 
                      Điểm trừ nhỏ: Module xác thực JWT có thể chuyển cấu hình Secret Key ra biến môi trường thay vì để hardcode fallback.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick actions & Peer audit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Thông tin Repository</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '6px' }}>Repo URL:</p>
                  <code style={{ color: '#60a5fa', wordBreak: 'break-all' }}>
                    https://github.com/aita-project/aita-intelligent.git
                  </code>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Đánh giá chéo (Peer Audit)</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Vòng 1 (Audit Round 1) đã mở. Vui lòng chấm điểm đóng góp cho 4 thành viên còn lại trong nhóm.
                  </p>
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    Mở Bảng Chấm Peer Audit
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
                  <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● Online • Đang gắn ngữ cảnh Bài nộp #1</span>
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
                    {m.sender === 'STUDENT' ? 'Bạn' : '🤖 Trợ Giảng AITA'}
                  </strong>
                  {m.text}
                </div>
              ))}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="text"
                placeholder="Đặt câu hỏi về lỗi test case hoặc cách tối ưu code..."
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
                <Send size={16} /> Gửi
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SUBMISSION FORM */}
        {activeTab === 'submit' && (
          <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nộp Bài Tập Đại Diện Nhóm</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Sau khi bấm nộp, hệ thống sẽ tự động khởi chạy Docker Sandbox để biên dịch và chạy bộ test cases, 
              đồng thời AI sẽ phân tích chất lượng code và trả về kết quả trong vòng 1-2 phút.
            </p>

            <form onSubmit={e => { e.preventDefault(); alert('Đã tạo submission và đưa vào Docker Sandbox queue thành công!'); setActiveTab('results'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>Đường dẫn Artifact / Repository Git (*)</label>
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
                  placeholder="Ví dụ: 7a9f4c28e9b11029c0d3817f"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
                Xác Nhận Nộp Bài &amp; Chạy Docker Sandbox
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
