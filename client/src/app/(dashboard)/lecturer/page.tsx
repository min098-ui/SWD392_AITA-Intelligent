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
              <span className="badge badge-success">Giảng Viên</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>TS. Nguyễn Văn Giang</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>(giangnv@fe.edu.vn)</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Phụ trách lớp: <strong style={{ color: '#fff' }}>SWD392 - K18/K19 (Kỳ FA26)</strong> • Tổng số: <strong style={{ color: '#fff' }}>8 Nhóm đồ án</strong>
            </p>
          </div>

          <button className="btn-primary" onClick={() => alert('Mở popup tạo bài tập mới')}>
            <PlusCircle size={16} /> Tạo Bài Tập &amp; Cấu Hình Rubric Mới
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
          <button 
            onClick={() => setActiveTab('git')}
            className={activeTab === 'git' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <BarChart3 size={16} /> Đóng Góp Git &amp; Chống Free-rider
          </button>
          <button 
            onClick={() => setActiveTab('submissions')}
            className={activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <CheckCircle2 size={16} /> Giám Sát Bài Nộp &amp; Chấm Sandbox
          </button>
          <button 
            onClick={() => setActiveTab('rubric')}
            className={activeTab === 'rubric' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Code2 size={16} /> Cấu Hình Test Cases Ẩn/Hiện
          </button>
        </div>

        {/* TAB 1: GIT ANALYTICS & ANTI-FREE-RIDER */}
        {activeTab === 'git' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Bảng Phân Tích Đóng Góp Thành Viên (Nhóm 4 - AITA Project)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Dữ liệu đồng bộ tự động qua GitHub REST API dựa trên Commit Author</p>
                </div>
                <span className="badge badge-info">Độ đồng đều: 96% (Tốt)</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 10px' }}>Thành viên</th>
                      <th style={{ padding: '12px 10px' }}>MSSV</th>
                      <th style={{ padding: '12px 10px' }}>Module phụ trách</th>
                      <th style={{ padding: '12px 10px' }}>Số commit</th>
                      <th style={{ padding: '12px 10px' }}>Dòng thêm (+)</th>
                      <th style={{ padding: '12px 10px' }}>Dòng xóa (-)</th>
                      <th style={{ padding: '12px 10px' }}>Đánh giá</th>
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
                          <span className="badge badge-success">Tích cực</span>
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
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Danh Sách Bài Nộp Chờ Duyệt Điểm</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '1rem' }}>Group 4 - AITA Project</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Milestone 1: Backend API &amp; Sandbox Runner</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="badge badge-success">Docker Sandbox: PASS</span>
                <span className="badge badge-info">AI Điểm: 9.5</span>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Xem Chi Tiết</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUBRIC CONFIG */}
        {activeTab === 'rubric' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Quản Lý Tiêu Chí Rubric (Ẩn/Hiện Test Cases)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Giảng viên có thể gắn cờ <code>is_hidden = true</code> đối với các test case đặc biệt nhằm kiểm thử tư duy sinh viên mà không làm lộ trước đề bài.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>TC-01: Standard Input Evaluation</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>(Trọng số: 30% - Điểm tối đa: 3.0)</span>
                </div>
                <span className="badge badge-info"><Eye size={12} /> Công khai (Public)</span>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>TC-02: Boundary &amp; Memory Limit Stress Test</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>(Trọng số: 30% - Điểm tối đa: 3.0)</span>
                </div>
                <span className="badge badge-warning"><EyeOff size={12} /> Ẩn với sinh viên (Hidden)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
