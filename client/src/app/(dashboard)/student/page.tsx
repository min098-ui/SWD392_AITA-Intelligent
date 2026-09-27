'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../../components/Navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Send, Bot, CheckCircle2, Clock, GitBranch, MessageSquare, 
  Terminal, AlertCircle, FileCode, Users, ExternalLink, Sparkles, BookOpen,
  Loader2, Check, ArrowRight, X, RefreshCw, Database, Star, AlertTriangle
} from 'lucide-react';

interface TeamMember {
  team_member_id: number;
  user_id: number;
  full_name: string;
  email: string;
  assigned_module: string;
}

interface TeamInfo {
  team_id: number;
  team_name: string;
  repo_url: string;
  course_id: number;
  course_code: string;
  course_name: string;
  semester: string;
  lecturer_name: string;
  members: TeamMember[];
}

interface Assignment {
  assignment_id: number;
  course_id: number;
  title: string;
  description: string;
  deadline: string;
  max_score: number;
}

interface SubmissionResult {
  submission_id: number;
  assignment_id: number;
  team_id: number;
  artifact_url: string;
  git_commit_hash: string;
  submitted_at: string;
  status: string;
  assignment_title?: string;
  team_name?: string;
  grading_status?: string;
}

export default function StudentDashboard() {
  const { lang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'submit' | 'results' | 'chat' | 'peer' | 'analytics'>('courses');
  
  // Live DB data
  const [myTeam, setMyTeam] = useState<TeamInfo | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<SubmissionResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<number | string>('');

  // Submission form state
  const [repoUrl, setRepoUrl] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Results state (fallback mock)
  const [latestSubmission] = useState({
    title: 'Milestone 1: Backend API & Sandbox Runner',
    commit: '7a9f4c28e9b1',
    containerId: 'docker_sandbox_c891',
    timeMs: '142ms',
    score: '9.5 / 10',
    status: 'GRADED',
    tc1: { name: 'TC1: Standard Input Evaluation', score: '3.0 / 3.0', status: 'PASSED', output: 'Input: matrix = [[1, 2], [3, 4]] | Expected: 10 | Actual: 10 (42ms)' },
    tc2: { name: 'TC2: Boundary / Edge Case (Hidden Test)', score: '3.0 / 3.0', status: 'PASSED', output: '[Hidden Test Case] Student successfully passed all 5/5 secret boundary test cases.' },
    tc3: { name: 'TC3: Clean Code & Architecture Review by AI', score: '3.5 / 4.0', status: 'PASSED', output: 'The team properly implemented a clean 3-tier architecture with clear layer separation. Minor improvement: Move JWT secret configuration to environment variables rather than hardcoded fallbacks.' }
  });

  // Peer audit form state
  const [peerMember, setPeerMember] = useState('');
  const [peerScore, setPeerScore] = useState('');
  const [peerComment, setPeerComment] = useState('');

  // Chat state
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: lang === 'vi' 
        ? 'Xin chào! Mình là Trợ lý AI Giảng dạy AITA (Socratic Tutor). Bài nộp của bạn vừa hoàn thành chấm tự động trong Docker Sandbox với số điểm 9.5/10. Bạn có muốn mình phân tích đoạn code nào hoặc gợi ý tối ưu thuật toán không?'
        : 'Hello! I am your AI Teaching Assistant (AITA). Your submission has just completed grading in Docker Sandbox with a score of 9.5/10. Would you like me to analyze any specific piece of code or suggest runtime optimizations?'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // ─── Helper: get token ───────────────────────────────────────────────────
  const getToken = async (): Promise<string> => {
    let token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      try {
        const u = localStorage.getItem('user');
        const userObj = u ? JSON.parse(u) : null;
        const email = userObj?.email || 'student1@fpt.edu.vn';
        const loginRes = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName: userObj?.fullName || 'Sinh Viên 1', role: 'STUDENT' })
        });
        if (loginRes.ok) {
          const lData = await loginRes.json();
          token = lData.token;
          if (token) localStorage.setItem('token', token);
          if (!u && lData.user) localStorage.setItem('user', JSON.stringify(lData.user));
        }
      } catch (e) {
        console.error('Auto auth error:', e);
      }
    }
    return token || '';
  };

  // ─── Fetch live data ─────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const token = await getToken();
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Get current user info to find their team
      let userId: number | null = null;
      try {
        const u = localStorage.getItem('user');
        const userObj = u ? JSON.parse(u) : null;
        userId = userObj?.userId || userObj?.user_id || null;
      } catch (e) {}

      // 2. Fetch all teams to find student's team
      const teamRes = await fetch('http://localhost:5000/api/teams', {
        headers: { ...authHeader }
      });
      if (teamRes.ok) {
        const tData = await teamRes.json();
        if (tData.teams && userId) {
          // Find team this student belongs to
          const myT = tData.teams.find((t: TeamInfo) =>
            t.members && t.members.some((m: TeamMember) => m.user_id === userId)
          );
          if (myT) {
            setMyTeam(myT);
            // Pre-fill repo URL from team
            if (myT.repo_url && !repoUrl) setRepoUrl(myT.repo_url);

            // 3. Fetch assignments for that course
            const assignRes = await fetch(`http://localhost:5000/api/assignments?course_id=${myT.course_id}`, {
              headers: { ...authHeader }
            });
            if (assignRes.ok) {
              const aData = await assignRes.json();
              const aList = aData.assignments || [];
              setAssignments(aList);
              if (aList.length > 0 && !selectedAssignment) {
                setSelectedAssignment(aList[0].assignment_id);
              }
            }

            // 4. Fetch submissions for team
            const subRes = await fetch(`http://localhost:5000/api/submissions?team_id=${myT.team_id}`, {
              headers: { ...authHeader }
            });
            if (subRes.ok) {
              const sData = await subRes.json();
              setMySubmissions(sData.submissions || []);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) setCurrentUser(JSON.parse(u));
    } catch (e) {}
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          text: lang === 'vi'
            ? `💡 **Phản hồi từ AI Tutor:** Về thắc mắc "${userText}":\nTrong hàm xử lý tính toán, bạn đang sử dụng 2 vòng lặp lồng nhau với độ phức tạp O(N²). Khi khối lượng kiểm thử tăng cao, bạn nên cân nhắc chuyển sang kỹ thuật Two Pointers hoặc Bảng băm (Hash Map) để giảm độ phức tạp xuống còn O(N) nhé!`
            : `💡 **AI Tutor Feedback:** Regarding your question "${userText}":\nIn the matrix calculation routine, you are currently using nested loops with O(N²) complexity. Consider using Two Pointers or Hash Map indexing to reduce complexity to O(N)!`
        }
      ]);
    }, 800);
  };

  const handleSubmitArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!repoUrl || !commitHash) {
      setSubmitError(lang === 'vi' ? 'Vui lòng nhập URL repo và commit hash!' : 'Please enter repo URL and commit hash!');
      return;
    }
    if (!selectedAssignment || !myTeam) {
      setSubmitError(lang === 'vi' ? 'Không tìm thấy nhóm hoặc bài tập của bạn trong hệ thống!' : 'No team or assignment found!');
      return;
    }

    setIsSubmitting(true);
    setSubmitStep(1);
    setTimeout(() => setSubmitStep(2), 700);
    setTimeout(() => setSubmitStep(3), 1400);

    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignment_id: Number(selectedAssignment),
          team_id: myTeam.team_id,
          artifact_url: repoUrl.trim(),
          git_commit_hash: commitHash.trim()
        })
      });

      const data = await res.json();

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitStep(0);
        if (res.ok) {
          setSuccessToast(lang === 'vi' ? 'Nộp bài và xếp hàng chờ chấm Docker Sandbox thành công!' : 'Submission queued for Docker Sandbox grading!');
          setActiveTab('results');
          fetchData();
          setTimeout(() => setSuccessToast(''), 3500);
        } else {
          setSubmitError(data.message || 'Lỗi khi nộp bài');
        }
      }, 2200);
    } catch (err) {
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitStep(0);
        setSubmitError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend server!');
      }, 2200);
    }
  };

  const handlePeerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast(lang === 'vi' ? 'Đã gửi đánh giá chéo thành viên bí mật thành công!' : 'Peer audit submitted successfully!');
    setPeerMember('');
    setPeerScore('');
    setPeerComment('');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // ─── Days until deadline ─────────────────────────────────────────────────
  const getDaysUntil = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED': return '#34d399';
      case 'GRADING': case 'PROCESSING': return '#f59e0b';
      case 'QUEUED': return '#60a5fa';
      case 'FAILED': return '#f43f5e';
      default: return 'var(--text-muted)';
    }
  };

  // Non-self teammates
  const teammates = myTeam?.members?.filter(m => m.user_id !== currentUser?.userId) || [];

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Toast */}
        {successToast && (
          <div style={{
            position: 'fixed', top: '85px', right: '25px', zIndex: 100,
            background: 'rgba(59, 130, 246, 0.95)', color: '#fff',
            padding: '12px 20px', borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontWeight: 600, fontSize: '0.9rem'
          }}>
            <Check size={18} /><span>{successToast}</span>
          </div>
        )}

        {/* Header Profile Bar */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-info">{lang === 'vi' ? 'Sinh viên' : 'Student'}</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {currentUser?.fullName || 'Le Nguyen Anh Mai'}
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                ({currentUser?.email || 'student1@fpt.edu.vn'})
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {lang === 'vi' ? 'Học phần:' : 'Course:'} <strong style={{ color: '#fff' }}>{myTeam ? `${myTeam.course_code} - ${myTeam.course_name}` : 'SWD392 - Software Architecture & Design'}</strong>
              {' • '}
              {lang === 'vi' ? 'Nhóm:' : 'Team:'} <strong style={{ color: '#fff' }}>{myTeam?.team_name || 'Group 4 (AITA Project)'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {myTeam && (() => {
              const myMember = myTeam.members?.find(m => m.user_id === currentUser?.userId);
              return myMember ? (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)',
                  padding: '8px 16px', borderRadius: '10px'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'block' }}>
                    {lang === 'vi' ? 'Phân hệ phụ trách' : 'Assigned Module'}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#60a5fa' }}>{myMember.assigned_module}</strong>
                </div>
              ) : null;
            })()}
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
            >
              {loadingData ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {lang === 'vi' ? 'Làm mới' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
          {[
            { key: 'courses', icon: <BookOpen size={16} />, label: lang === 'vi' ? 'Học phần & Hạn nộp' : 'My Courses' },
            { key: 'submit', icon: <FileCode size={16} />, label: lang === 'vi' ? 'Nộp bài (Docker Sandbox)' : 'New Submission' },
            { key: 'results', icon: <CheckCircle2 size={16} />, label: lang === 'vi' ? 'Kết quả & AI Phản hồi' : 'Results & AI Feedback' },
            { key: 'chat', icon: <Bot size={16} />, label: lang === 'vi' ? 'AI Tutor (Socratic)' : 'AI Tutor Chat' },
            { key: 'analytics', icon: <GitBranch size={16} />, label: lang === 'vi' ? 'Đóng góp Git' : 'Git Analytics' },
            { key: 'peer', icon: <Users size={16} />, label: lang === 'vi' ? 'Peer Audit' : 'Peer Audit' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.9rem', padding: '8px 16px' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ───── TAB: COURSES ───── */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#38bdf8" /> {lang === 'vi' ? 'Các học phần đang tham gia' : 'Enrolled Courses'}
            </h3>

            {loadingData && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Loader2 size={30} className="animate-spin" style={{ marginBottom: '10px' }} />
                <p>{lang === 'vi' ? 'Đang tải dữ liệu từ PostgreSQL...' : 'Loading from PostgreSQL...'}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {myTeam ? (
                <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #38bdf8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div>
                      <span className="badge badge-info" style={{ marginBottom: '8px' }}>{myTeam.course_code}</span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{myTeam.course_name}</h4>
                    </div>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      {myTeam.semester}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'vi' ? 'Giảng viên:' : 'Lecturer:'} <strong style={{ color: '#e2e8f0' }}>{myTeam.lecturer_name}</strong>
                  </p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> {lang === 'vi' ? 'Nhóm của bạn:' : 'Your team:'} <strong style={{ color: '#e2e8f0' }}>{myTeam.team_name}</strong> ({myTeam.members?.length || 0} {lang === 'vi' ? 'thành viên' : 'members'})
                  </p>

                  {/* Assignments */}
                  {assignments.length > 0 ? assignments.map(a => {
                    const daysLeft = getDaysUntil(a.deadline);
                    const isUrgent = daysLeft <= 3;
                    const isPast = daysLeft < 0;
                    return (
                      <div key={a.assignment_id} style={{
                        background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px',
                        border: `1px solid ${isPast ? 'rgba(244,63,94,0.3)' : isUrgent ? 'rgba(245,158,11,0.3)' : 'rgba(56,189,248,0.2)'}`,
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{a.title}</h5>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                            background: isPast ? 'rgba(244,63,94,0.2)' : isUrgent ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)',
                            color: isPast ? '#f43f5e' : isUrgent ? '#f59e0b' : '#34d399',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            <Clock size={12} />
                            {isPast ? (lang === 'vi' ? 'Đã hết hạn' : 'Expired') :
                              isUrgent ? `${daysLeft} ${lang === 'vi' ? 'ngày' : 'days'}` :
                              `${daysLeft} ${lang === 'vi' ? 'ngày còn lại' : 'days left'}`}
                          </span>
                        </div>
                        {a.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>{a.description}</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                            {lang === 'vi' ? 'Điểm tối đa:' : 'Max score:'} <strong>{a.max_score}</strong>
                          </span>
                          {!isPast && (
                            <button
                              onClick={() => { setSelectedAssignment(a.assignment_id); setActiveTab('submit'); }}
                              className="btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
                            >
                              <ArrowRight size={14} /> {lang === 'vi' ? 'Nộp bài' : 'Submit'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {lang === 'vi' ? 'Không có bài tập sắp tới hạn' : 'No upcoming assignments'}
                    </div>
                  )}
                </div>
              ) : !loadingData && (
                <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #38bdf8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Database size={18} color="#38bdf8" />
                    <strong>{lang === 'vi' ? 'Chưa được xếp nhóm' : 'Not yet in a team'}</strong>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {lang === 'vi'
                      ? 'Bạn chưa được giảng viên xếp vào nhóm nào. Vui lòng liên hệ giảng viên để được phân công nhóm và module phụ trách.'
                      : 'You have not been assigned to a team yet. Please contact your lecturer to be assigned a team and module.'}
                  </p>
                </div>
              )}

              {/* Static: additional course card */}
              <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #a78bfa', opacity: 0.85 }}>
                <span className="badge" style={{ marginBottom: '8px', background: 'rgba(167, 139, 250, 0.2)', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.4)' }}>PRJ301</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Java Web Application Development</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {lang === 'vi' ? 'Giảng viên:' : 'Lecturer:'} Dr. Tran Thi B
                </p>
                <div style={{ textAlign: 'center', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {lang === 'vi' ? 'Không có bài tập sắp tới hạn' : 'No upcoming deadlines'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───── TAB: SUBMISSION FORM ───── */}
        {activeTab === 'submit' && (
          <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {lang === 'vi' ? `Nộp bài đồ án (${myTeam?.team_name || 'Nhóm của bạn'})` : `Submit Assignment (${myTeam?.team_name || 'Your Team'})`}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.8rem', lineHeight: 1.5 }}>
              {lang === 'vi'
                ? 'Hệ thống AITA sẽ tự động kéo mã nguồn từ SHA commit, khởi động Docker Sandbox Container cô lập an toàn để biên dịch và chạy kiểm thử tự động, kết hợp AI Gemini đánh giá chất lượng kiến trúc.'
                : 'AITA automatically clones code from your commit SHA, spins up an isolated Docker Sandbox container to run test suites, and evaluates code quality with AI.'}
            </p>

            <form onSubmit={handleSubmitArtifact} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {/* Assignment selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  {lang === 'vi' ? 'Bài tập cần nộp (*)' : 'Assignment (*)'} 
                  {assignments.length > 0 && <span style={{ color: '#34d399', marginLeft: '8px', fontSize: '0.8rem' }}>● Live DB</span>}
                </label>
                <select
                  value={selectedAssignment}
                  onChange={e => setSelectedAssignment(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                >
                  {assignments.length > 0 ? assignments.map(a => (
                    <option key={a.assignment_id} value={a.assignment_id}>{a.title}</option>
                  )) : (
                    <option value="">-- {lang === 'vi' ? 'Không có bài tập' : 'No assignments available'} --</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  {lang === 'vi' ? 'Đường dẫn Git Repository / Artifact URL (*)' : 'Git Repository / Artifact URL (*)'}
                </label>
                <input 
                  type="text" 
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  required
                  placeholder="https://github.com/username/repo.git"
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  {lang === 'vi' ? 'Mã Git Commit Hash (SHA) (*)' : 'Git Commit Hash (*)'}
                </label>
                <input 
                  type="text" 
                  value={commitHash}
                  onChange={e => setCommitHash(e.target.value)}
                  required
                  placeholder="e.g.: 7a9f4c28e9b11029c0d3817f"
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} 
                />
              </div>

              {isSubmitting && (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', color: '#93c5fd', fontSize: '0.88rem' }}>
                  <Loader2 size={20} className="animate-spin" color="#60a5fa" />
                  <div>
                    {submitStep === 1 && (lang === 'vi' ? '1. Đang khởi tạo Docker Sandbox container cô lập an toàn...' : '1. Initializing isolated Docker Sandbox container...')}
                    {submitStep === 2 && (lang === 'vi' ? '2. Đang biên dịch mã nguồn và chạy test case tự động...' : '2. Compiling code and executing test cases...')}
                    {submitStep === 3 && (lang === 'vi' ? '3. AI đang phân tích kiến trúc Clean Code và sinh nhận xét...' : '3. AI is evaluating code quality and generating feedback...')}
                  </div>
                </div>
              )}

              {submitError && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fda4af', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> {submitError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary" 
                style={{ padding: '14px', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.95rem' }}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /><span>{lang === 'vi' ? 'Đang thực thi Docker Sandbox & AI...' : 'Executing Docker Sandbox & AI...'}</span></>
                ) : (
                  <span>{lang === 'vi' ? 'Xác nhận Nộp bài & Kích hoạt Docker Sandbox' : 'Confirm Submission & Run Docker Sandbox'}</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ───── TAB: RESULTS ───── */}
        {activeTab === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#34d399" /> {lang === 'vi' ? 'Lịch sử bài nộp & Kết quả chấm' : 'Submission History & Results'}
              </h3>
              <button onClick={fetchData} disabled={loadingData} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.82rem', gap: '6px' }}>
                {loadingData ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {lang === 'vi' ? 'Làm mới' : 'Refresh'}
              </button>
            </div>

            {/* Live submissions from DB */}
            {mySubmissions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mySubmissions.map((sub) => (
                  <div key={sub.submission_id} className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${getStatusColor(sub.status)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{sub.assignment_title || 'Assignment #' + sub.assignment_id}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                          <span>Commit: <code style={{ color: '#60a5fa' }}>{sub.git_commit_hash?.slice(0, 12)}</code></span>
                          <span>{lang === 'vi' ? 'Nộp lúc:' : 'Submitted:'} {new Date(sub.submitted_at).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                          background: `${getStatusColor(sub.status)}20`,
                          color: getStatusColor(sub.status),
                          border: `1px solid ${getStatusColor(sub.status)}50`
                        }}>
                          {sub.status}
                        </span>
                        {sub.grading_status && (
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            Grading: {sub.grading_status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink size={13} />
                      <a href={sub.artifact_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        {sub.artifact_url?.replace('https://github.com/', '')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Mock result card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="glass-card" style={{ padding: '1.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{latestSubmission.title}</h3>
                      <span className="badge badge-success">{latestSubmission.status} • {latestSubmission.score}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      <span>Commit SHA: <code style={{ color: '#38bdf8' }}>{latestSubmission.commit}</code></span>
                      <span>Sandbox ID: <code style={{ color: '#a78bfa' }}>{latestSubmission.containerId}</code></span>
                      <span>{lang === 'vi' ? 'Thời gian chạy:' : 'Exec Time:'} <strong>{latestSubmission.timeMs}</strong></span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[latestSubmission.tc1, latestSubmission.tc2].map((tc, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tc.name}</span>
                            <span className="badge badge-success">{tc.status} • {tc.score}</span>
                          </div>
                          <div className="code-box" style={{ fontSize: '0.8rem', margin: '8px 0', color: 'var(--text-muted)' }}>{tc.output}</div>
                        </div>
                      ))}
                      <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}>
                            <Sparkles size={16} /> {latestSubmission.tc3.name}
                          </span>
                          <span className="badge badge-success">{latestSubmission.tc3.score}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '8px', lineHeight: 1.6 }}>
                          🤖 <strong>AI Feedback:</strong> {latestSubmission.tc3.output}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                      {lang === 'vi' ? 'Kho lưu trữ Git' : 'Repository Info'}
                    </h4>
                    <code style={{ color: '#60a5fa', wordBreak: 'break-all', fontSize: '0.82rem' }}>
                      {myTeam?.repo_url || 'https://github.com/aita-project/aita-intelligent.git'}
                    </code>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <button onClick={() => setActiveTab('chat')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <Bot size={16} /> {lang === 'vi' ? 'Hỏi AI Tutor' : 'Ask AI Tutor'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───── TAB: AI TUTOR CHAT ───── */}
        {activeTab === 'chat' && (
          <div className="glass-card" style={{ height: '620px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} color="#fff" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>AITA Coding Assistant (Socratic Tutor)</h4>
                  <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● Online • Context linked to your latest submission</span>
                </div>
              </div>
              <span className="badge badge-info">Gemini 1.5 Pro / GPT-4o</span>
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((m, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'STUDENT' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: m.sender === 'STUDENT' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: m.sender === 'STUDENT' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '12px 16px', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.75rem', color: m.sender === 'STUDENT' ? '#93c5fd' : '#c084fc', marginBottom: '4px' }}>
                    {m.sender === 'STUDENT' ? (lang === 'vi' ? 'Bạn' : 'You') : '🤖 AITA Tutor'}
                  </strong>
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="text"
                placeholder={lang === 'vi' ? 'Đặt câu hỏi về kết quả kiểm thử, lỗi logic hoặc cách tối ưu thuật toán...' : 'Ask about test failures, bugs, or optimization...'}
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontFamily: 'var(--font-main)', fontSize: '0.9rem', outline: 'none' }}
              />
              <button type="submit" className="btn-primary">
                <Send size={16} /> {lang === 'vi' ? 'Gửi' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {/* ───── TAB: GIT ANALYTICS ───── */}
        {activeTab === 'analytics' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={20} color="#38bdf8" /> {lang === 'vi' ? `Báo cáo Đóng góp Git - ${myTeam?.team_name || 'Nhóm 4'}` : `Team Git Contribution - ${myTeam?.team_name || 'Team 4'}`}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {[
                { label: lang === 'vi' ? 'Lượt commit của bạn' : 'Your Commits', value: '42', color: '#38bdf8' },
                { label: lang === 'vi' ? 'Dòng code thêm (LOC)' : 'Your LOC Added', value: '1,245', color: '#a78bfa' },
                { label: lang === 'vi' ? 'Xếp hạng nhóm' : 'Team Ranking', value: '#1 / 5', color: '#34d399' },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                {lang === 'vi' ? 'Biểu đồ phân phối đóng góp (LOC):' : 'Contribution Distribution (LOC):'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(myTeam?.members || [
                  { user_id: 3, full_name: 'Sinh Viên 1', assigned_module: 'Architecture & Auth', email: '' } as any
                ]).map((member, idx) => {
                  const colors = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f43f5e'];
                  const locValues = [1245, 1100, 950, 850, 120];
                  const loc = locValues[idx] || 200;
                  const isYou = member.user_id === currentUser?.userId;
                  const isAlert = loc < 200;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '200px', fontSize: '0.88rem', color: isAlert ? '#f43f5e' : 'var(--text-main)' }}>
                        {member.full_name} {isYou && `(${lang === 'vi' ? 'Bạn' : 'You'})`}
                      </div>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${(loc / 1300) * 100}%`, background: colors[idx % colors.length], height: '100%', borderRadius: '6px' }} />
                      </div>
                      <div style={{ width: '80px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>{loc.toLocaleString()} LOC</div>
                      {isAlert && <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>{lang === 'vi' ? 'Cảnh báo Free-Rider' : 'Free-Rider Warning'}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ───── TAB: PEER AUDIT ───── */}
        {activeTab === 'peer' && (
          <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#f472b6" /> {lang === 'vi' ? 'Đánh giá chéo thành viên nhóm (Peer Audit)' : 'Peer Audit Evaluation'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              {lang === 'vi'
                ? 'Đánh giá đóng góp của các thành viên trong nhóm về thái độ, chất lượng mã nguồn và mức độ hoàn thành nhiệm vụ. Bảng đánh giá hoàn toàn bảo mật và chỉ giảng viên mới có thể xem.'
                : 'Evaluate your teammates on contribution, code quality, and attitude. Your evaluation is strictly confidential.'}
            </p>

            <form onSubmit={handlePeerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '8px', fontWeight: 600 }}>
                  {lang === 'vi' ? 'Chọn thành viên cần đánh giá (*)' : 'Select Teammate (*)'}
                  {teammates.length > 0 && <span style={{ color: '#34d399', marginLeft: '8px', fontSize: '0.8rem' }}>● Live DB</span>}
                </label>
                <select 
                  value={peerMember}
                  onChange={e => setPeerMember(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">-- {lang === 'vi' ? 'Chọn thành viên' : 'Choose a teammate'} --</option>
                  {teammates.length > 0 ? teammates.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.email})</option>
                  )) : (
                    <>
                      <option value="1">Nguyen Tuong Vy (QE180099)</option>
                      <option value="2">Nguyen Quoc Thanh Phong (QE190030)</option>
                      <option value="3">Do Tran Dang Khoa (QE190122)</option>
                      <option value="4">Dinh Gia Huy (QE190149)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '8px', fontWeight: 600 }}>
                  {lang === 'vi' ? 'Điểm đánh giá đóng góp (1 - 10) (*)' : 'Contribution Score (1-10) (*)'}
                </label>
                <input 
                  type="number" min="1" max="10" value={peerScore}
                  onChange={e => setPeerScore(e.target.value)}
                  placeholder="e.g. 9" required 
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '8px', fontWeight: 600 }}>
                  {lang === 'vi' ? 'Nhận xét chi tiết (Gửi riêng cho Giảng viên) (*)' : 'Constructive Feedback (*)'}
                </label>
                <textarea 
                  rows={4} value={peerComment} onChange={e => setPeerComment(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nêu rõ điểm mạnh, tinh thần trách nhiệm và phần việc bạn ấy đã đóng góp...' : 'Describe their strengths and areas for improvement...'} 
                  required 
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '12px', justifyContent: 'center' }}>
                {lang === 'vi' ? 'Gửi đánh giá bảo mật' : 'Submit Evaluation'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
