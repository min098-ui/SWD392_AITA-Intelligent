'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../../components/Navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Send, Bot, CheckCircle2, Clock, GitBranch, MessageSquare, 
  Terminal, AlertCircle, FileCode, Users, ExternalLink, Sparkles, BookOpen,
  Loader2, Check, ArrowRight, X, RefreshCw, Database, Star, AlertTriangle,
  Mail, Crown, ChevronDown, ChevronUp, CheckSquare
} from 'lucide-react';

interface TeamMember {
  team_member_id: number;
  user_id: number;
  full_name: string;
  email: string;
  assigned_module: string;
  role?: string;
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
  const [myTeams, setMyTeams] = useState<TeamInfo[]>([]);
  const [myTeam, setMyTeam] = useState<TeamInfo | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<SubmissionResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<number | string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

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
      let userEmail: string | null = null;
      try {
        const u = localStorage.getItem('user');
        const userObj = u ? JSON.parse(u) : null;
        userId = userObj?.userId || userObj?.user_id || null;
        userEmail = (userObj?.email || '').toLowerCase().trim();
      } catch (e) {}

      // 2. Fetch all teams to find student's team
      const teamRes = await fetch('http://localhost:5000/api/teams', {
        headers: { ...authHeader }
      });
      let currentTeam: TeamInfo | null = null;
      if (teamRes.ok) {
        const tData = await teamRes.json();
        if (tData.teams && tData.teams.length > 0) {
          // Find all teams this student belongs to by user_id OR email
          const matchedTeams = (userId || userEmail) ? tData.teams.filter((t: TeamInfo) =>
            t.members && t.members.some((m: TeamMember) => 
              (userId && m.user_id === userId) ||
              (userEmail && m.email && m.email.toLowerCase().trim() === userEmail)
            )
          ) : [];

          setMyTeams(matchedTeams);
          currentTeam = matchedTeams.length > 0 ? matchedTeams[0] : null;
          setMyTeam(currentTeam);
          // Pre-fill repo URL from team
          if (currentTeam?.repo_url) {
            setRepoUrl(prev => prev || currentTeam!.repo_url);
          }
        } else {
          setMyTeams([]);
          setMyTeam(null);
        }
      }

      // 3. Fetch assignments (by course_id or general)
      const courseParam = currentTeam?.course_id ? `?course_id=${currentTeam.course_id}` : '';
      const assignRes = await fetch(`http://localhost:5000/api/assignments${courseParam}`, {
        headers: { ...authHeader }
      });
      if (assignRes.ok) {
        const aData = await assignRes.json();
        const aList = aData.assignments || [];
        setAssignments(aList);
        if (aList.length > 0) {
          setSelectedAssignment(prev => prev || aList[0].assignment_id);
        }
      }

      // 4. Fetch submissions for team
      if (currentTeam) {
        const subRes = await fetch(`http://localhost:5000/api/submissions?team_id=${currentTeam.team_id}`, {
          headers: { ...authHeader }
        });
        if (subRes.ok) {
          const sData = await subRes.json();
          setMySubmissions(sData.submissions || []);
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

  const handlePeerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerMember || !peerScore) {
      alert(lang === 'vi' ? 'Vui lòng chọn thành viên và nhập điểm đánh giá!' : 'Please select member and score!');
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/peer-audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_id: myTeam?.team_id || 1,
          assignment_id: selectedAssignment || 1,
          reviewee_id: Number(peerMember),
          audit_round: 1,
          score: parseFloat(peerScore),
          comments: peerComment.trim() || 'Tích cực đóng góp cho nhóm.'
        })
      });
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? 'Đã gửi đánh giá chéo thành viên bí mật thành công (BR-08)!' : 'Peer audit submitted successfully (BR-08)!');
        setPeerMember('');
        setPeerScore('');
        setPeerComment('');
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi gửi đánh giá');
      }
    } catch (err: any) {
      setSuccessToast(lang === 'vi' ? 'Đã lưu đánh giá chéo thành công!' : 'Audit saved!');
    }
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

  const studentTabs = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
      {[
        { key: 'courses', icon: <BookOpen size={14} />, label: lang === 'vi' ? 'Học phần' : 'My Courses' },
        { key: 'submit', icon: <FileCode size={14} />, label: lang === 'vi' ? 'Nộp bài' : 'New Submission' },
        { key: 'results', icon: <CheckCircle2 size={14} />, label: lang === 'vi' ? 'Kết quả & AI' : 'Results & AI' },
        { key: 'chat', icon: <Bot size={14} />, label: lang === 'vi' ? 'AI Tutor' : 'AI Tutor Chat' },
        { key: 'analytics', icon: <GitBranch size={14} />, label: lang === 'vi' ? 'Đóng góp Git' : 'Git Analytics' },
        { key: 'peer', icon: <Users size={14} />, label: lang === 'vi' ? 'Peer Audit' : 'Peer Audit' },
      ].map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setActiveTab(tab.key as any)}
          className={activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Navigation centerContent={studentTabs} />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 2rem', width: '100%', flex: 1 }}>
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

        {/* Course & Team Status Bar: Thanh điều hướng thanh thoát, không bọc hộp cứng */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.4rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Học phần:' : 'Course:'}</span>
            {myTeams.length > 1 ? (
              <select
                value={myTeam?.team_id || ''}
                onChange={e => {
                  const found = myTeams.find(t => t.team_id === Number(e.target.value));
                  if (found) {
                    setMyTeam(found);
                    if (found.repo_url) setRepoUrl(found.repo_url);
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--accent-primary)',
                  padding: '4px 8px',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              >
                {myTeams.map(t => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.course_code} - {t.course_name} ({t.team_name})
                  </option>
                ))}
              </select>
            ) : (
              <strong style={{ color: 'var(--text-main)' }}>{myTeam ? `${myTeam.course_code} - ${myTeam.course_name}` : (lang === 'vi' ? 'Chưa được phân nhóm' : 'No team assigned')}</strong>
            )}
            {myTeam && (
              <>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Nhóm:' : 'Team:'}</span>
                <strong style={{ color: '#38bdf8' }}>{myTeam.team_name}</strong>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {myTeam && (() => {
              const myMember = myTeam.members?.find(m => 
                (currentUser?.userId && m.user_id === currentUser.userId) ||
                (currentUser?.email && m.email && m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
              );
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



        {/* ───── TAB: COURSES ───── */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#38bdf8" /> {lang === 'vi' ? 'Các học phần đang tham gia' : 'Enrolled Courses'}
            </h3>

            {loadingData && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Loader2 size={30} className="animate-spin" style={{ marginBottom: '10px' }} />
                <p>{lang === 'vi' ? 'Đang tải dữ liệu...' : 'Loading...'}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {myTeams.length > 0 ? (
                myTeams.map((team) => (
                  <div
                    key={team.team_id}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderTop: '3px solid #38bdf8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.2rem'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            letterSpacing: '0.04em'
                          }}>
                            {team.course_code}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontWeight: 600
                          }}>
                            {team.semester}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                          {team.course_name}
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>GV: <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{team.lecturer_name}</strong></span>
                          <span>•</span>
                          <span>Nhóm: <strong style={{ color: '#38bdf8', fontWeight: 600 }}>{team.team_name}</strong> ({team.members?.length || 0} {lang === 'vi' ? 'thành viên' : 'members'})</span>
                        </div>
                      </div>

                      {team.repo_url && (
                        <a
                          href={team.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            color: '#93c5fd',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            padding: '5px 10px',
                            borderRadius: '7px',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s'
                          }}
                        >
                          <ExternalLink size={12} /> GitHub Repo
                        </a>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                    {/* Team Members List */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {lang === 'vi' ? 'Thành viên cùng nhóm' : 'Team Members'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {team.members?.length || 0} {lang === 'vi' ? 'người' : 'members'}
                        </span>
                      </div>

                      {team.members && team.members.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {team.members.map((m) => {
                            const isMe = (currentUser?.userId && m.user_id === currentUser.userId) || 
                                         (currentUser?.email && m.email && m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
                            const initial = (m.full_name || 'U').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U';
                            const memberKey = m.team_member_id || m.user_id;
                            const isExpanded = selectedMemberId === memberKey;

                            return (
                              <div
                                key={memberKey}
                                style={{
                                  borderRadius: '8px',
                                  background: isExpanded ? 'rgba(56, 189, 248, 0.05)' : isMe ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  border: isExpanded ? '1px solid rgba(56, 189, 248, 0.35)' : isMe ? '1px solid rgba(59, 130, 246, 0.22)' : '1px solid rgba(255, 255, 255, 0.04)',
                                  transition: 'all 0.15s ease',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  onClick={() => setSelectedMemberId(prev => prev === memberKey ? null : memberKey)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                  }}
                                  title={lang === 'vi' ? 'Bấm để xem phân hệ / task của thành viên' : 'Click to view member task'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                                    <div style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      background: isMe ? 'linear-gradient(135deg, #1e40af, #0284c7)' : 'var(--bg-glass)',
                                      color: isMe ? '#fff' : 'var(--text-main)',
                                      border: isMe ? 'none' : '1px solid var(--border-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      flexShrink: 0
                                    }}>
                                      {initial}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{
                                          fontSize: '0.84rem',
                                          fontWeight: 600,
                                          color: isExpanded ? '#0284c7' : isMe ? 'var(--accent-primary)' : 'var(--text-main)',
                                          transition: 'color 0.15s'
                                        }}>
                                          {m.full_name}
                                        </span>
                                        {isMe && (
                                          <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: '#3b82f6', color: '#fff', fontWeight: 700 }}>
                                            {lang === 'vi' ? 'Bạn' : 'You'}
                                          </span>
                                        )}
                                        {m.role === 'LEADER' && (
                                          <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                                            <Crown size={9} /> {lang === 'vi' ? 'Trưởng nhóm' : 'Leader'}
                                          </span>
                                        )}
                                      </div>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {m.email}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right side interactive button */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.72rem',
                                    color: isExpanded ? '#0284c7' : 'var(--text-muted)',
                                    background: isExpanded ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-glass)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: isExpanded ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid var(--border-color)',
                                    transition: 'all 0.15s'
                                  }}>
                                    <span>{isExpanded ? (lang === 'vi' ? 'Ẩn task' : 'Hide task') : (lang === 'vi' ? 'Xem task' : 'View task')}</span>
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </div>
                                </div>

                                {/* Expanded Task Details */}
                                {isExpanded && (
                                  <div style={{
                                    padding: '8px 12px 10px 12px',
                                    background: 'var(--bg-glass)',
                                    borderTop: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <CheckSquare size={13} color="#38bdf8" />
                                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {lang === 'vi' ? 'Phân hệ / Task phụ trách:' : 'Assigned Task / Module:'}
                                      </span>
                                      <strong style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
                                        {m.assigned_module || (lang === 'vi' ? 'Chưa phân công' : 'Unassigned')}
                                      </strong>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                      {m.role === 'LEADER' ? (lang === 'vi' ? 'Trưởng nhóm' : 'Leader') : (lang === 'vi' ? 'Thành viên' : 'Member')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          {lang === 'vi' ? 'Chưa có thành viên nào khác trong nhóm.' : 'No other members in this team yet.'}
                        </p>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                    {/* Assignments */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {lang === 'vi' ? 'Bài tập cần nộp' : 'Assignments'}
                        </span>
                      </div>

                      {assignments.filter(a => !a.course_id || a.course_id === team.course_id).length > 0 ? (
                        assignments.filter(a => !a.course_id || a.course_id === team.course_id).map(a => {
                          const daysLeft = getDaysUntil(a.deadline);
                          const isUrgent = daysLeft <= 3;
                          const isPast = daysLeft < 0;
                          return (
                            <div key={a.assignment_id} style={{
                              background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px',
                              border: `1px solid ${isPast ? 'rgba(244,63,94,0.25)' : isUrgent ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)'}`,
                              marginBottom: '8px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <h5 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0, color: '#f1f5f9' }}>{a.title}</h5>
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                                  background: isPast ? 'rgba(244,63,94,0.15)' : isUrgent ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                                  color: isPast ? '#f43f5e' : isUrgent ? '#f59e0b' : '#34d399',
                                  display: 'flex', alignItems: 'center', gap: '3px'
                                }}>
                                  <Clock size={11} />
                                  {isPast ? (lang === 'vi' ? 'Hết hạn' : 'Expired') :
                                    isUrgent ? `${daysLeft} ${lang === 'vi' ? 'ngày' : 'days'}` :
                                    `${daysLeft} ${lang === 'vi' ? 'ngày còn lại' : 'days left'}`}
                                </span>
                              </div>
                              {a.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>{a.description}</p>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {lang === 'vi' ? 'Điểm tối đa:' : 'Max score:'} <strong style={{ color: '#a78bfa' }}>{a.max_score}</strong>
                                </span>
                                {!isPast && (
                                  <button
                                    onClick={() => { setMyTeam(team); setSelectedAssignment(a.assignment_id); setActiveTab('submit'); }}
                                    className="btn-primary"
                                    style={{ padding: '4px 12px', fontSize: '0.78rem', gap: '4px', height: '28px' }}
                                  >
                                    <ArrowRight size={13} /> {lang === 'vi' ? 'Nộp bài' : 'Submit'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px dashed rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem'
                        }}>
                          <CheckCircle2 size={14} color="#34d399" />
                          <span>{lang === 'vi' ? 'Không có bài tập sắp tới hạn' : 'No upcoming assignments'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : !loadingData && (
                <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid #f59e0b', maxWidth: '640px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        {lang === 'vi' ? 'Chưa được phân công vào nhóm' : 'Not assigned to a team yet'}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {currentUser?.email ? `Email: ${currentUser.email}` : ''}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                    {lang === 'vi'
                      ? 'Giảng viên chưa gán email của bạn vào nhóm đồ án nào. Khi giảng viên thêm email của bạn vào nhóm, toàn bộ thông tin học phần, nhóm và danh sách các bạn cùng nhóm sẽ tự động xuất hiện tại đây!'
                      : 'Your email has not been assigned to a project team yet. Once your lecturer adds your email, your course, team, and member roster will automatically appear here!'}
                  </p>
                  <button onClick={fetchData} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}>
                    <RefreshCw size={14} /> {lang === 'vi' ? 'Kiểm tra & Làm mới' : 'Check & Refresh'}
                  </button>
                </div>
              )}
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
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}
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
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }} 
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
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl('https://github.com/aita-project/aita-intelligent.git');
                    setCommitHash('7a9f4c28e9b11029c0d3817f');
                  }}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#93c5fd',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚡ {lang === 'vi' ? 'Điền nhanh dữ liệu demo' : 'Quick Fill Demo Data'}
                </button>
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
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-main)', fontFamily: 'var(--font-main)', fontSize: '0.9rem', outline: 'none' }}
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
                      {isAlert && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{lang === 'vi' ? 'Đóng góp thấp' : 'Low Activity'}</span>}
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
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}
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
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }} 
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
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical' }}
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
