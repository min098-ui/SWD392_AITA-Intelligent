'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../../components/Navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Send, Bot, CheckCircle2, Clock, GitBranch, MessageSquare, 
  Terminal, AlertCircle, FileCode, Users, ExternalLink, Sparkles, BookOpen,
  Loader2, Check, ArrowRight, X, RefreshCw, Database, Star, AlertTriangle,
  Mail, Crown, ChevronDown, ChevronUp, CheckSquare, Play, User
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
  submission_type?: string;
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
  score?: number;
  final_score?: number;
  submitter_name?: string;
  submitter_email?: string;
}

export default function StudentDashboard() {
  const { lang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'submit' | 'results' | 'chat' | 'peer' | 'analytics'>('courses');
  
  // Live DB data
  const [myTeams, setMyTeams] = useState<TeamInfo[]>([]);
  const [myTeam, setMyTeam] = useState<TeamInfo | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<SubmissionResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<number | string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const [repoUrl, setRepoUrl] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python'>('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [successToast, setSuccessToast] = useState('');

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
        ? 'Xin chào! Mình là Trợ lý AI Giảng dạy AITA (Socratic Tutor). Bạn có câu hỏi nào về kiến trúc phần mềm, thuật toán Clean Code hay thắc mắc về đồ án không? Hãy hỏi mình nhé!'
        : 'Hello! I am your AI Teaching Assistant (AITA). Do you have any questions about software architecture, algorithms, or clean code? Feel free to ask!'
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
        const email = userObj?.email || 'lenguyenlinhnhi2110@gmail.com';
        const loginRes = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName: userObj?.fullName || 'Lê Nguyễn Ánh Mai', role: 'STUDENT' })
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

      // 2. Fetch all teams & all assignments concurrently
      const [teamRes, assignRes] = await Promise.all([
        fetch('http://localhost:5000/api/teams', { headers: { ...authHeader } }),
        fetch('http://localhost:5000/api/assignments', { headers: { ...authHeader } })
      ]);

      let aList: Assignment[] = [];
      if (assignRes.ok) {
        const aData = await assignRes.json();
        aList = aData.assignments || [];
        setAssignments(aList);
      }

      let currentTeam: TeamInfo | null = null;
      let matchedTeams: TeamInfo[] = [];
      let initialFilter = 'ALL';
      if (teamRes.ok) {
        const tData = await teamRes.json();
        if (tData.teams && tData.teams.length > 0) {
          // Find all teams this student belongs to by user_id OR email (tự động bỏ qua dấu chấm giữa các định dạng email sinh viên)
          const normalizeEmail = (e?: string) => (e || '').toLowerCase().trim().replace(/\\./g, '');
          matchedTeams = (userId || userEmail) ? tData.teams.filter((t: TeamInfo) =>
            t.members && t.members.some((m: TeamMember) => 
              (userId && m.user_id === userId) ||
              (userEmail && m.email && (m.email.toLowerCase().trim() === userEmail || normalizeEmail(m.email) === normalizeEmail(userEmail)))
            )
          ) : [];

          setMyTeams(matchedTeams);

          // Check if student previously selected a team/filter in localStorage
          const savedFilter = typeof window !== 'undefined' ? localStorage.getItem('aita_student_selected_team_id') : null;
          if (savedFilter && (savedFilter === 'ALL' || matchedTeams.some((t: TeamInfo) => String(t.team_id) === savedFilter))) {
            initialFilter = savedFilter;
          }
          setSelectedFilter(initialFilter);

          if (initialFilter !== 'ALL') {
            currentTeam = matchedTeams.find((t: TeamInfo) => String(t.team_id) === initialFilter) || matchedTeams[0];
          } else {
            currentTeam = matchedTeams[0] || null;
          }

          setMyTeam(currentTeam);
          if (currentTeam?.repo_url) {
            setRepoUrl(prev => prev || currentTeam!.repo_url);
          }
        } else {
          setMyTeams([]);
          setMyTeam(null);
        }
      }

      // Auto select assignment
      const teamAssigns = (currentTeam && initialFilter !== 'ALL')
        ? aList.filter(a => !a.course_id || a.course_id === currentTeam!.course_id)
        : aList;
      if (teamAssigns.length > 0) {
        setSelectedAssignment(String(teamAssigns[0].assignment_id));
      } else if (aList.length > 0) {
        setSelectedAssignment(String(aList[0].assignment_id));
      } else {
        setSelectedAssignment('');
      }

      // 4. Fetch all submissions for student's teams
      if (matchedTeams.length > 0) {
        try {
          const subPromises = matchedTeams.map(t =>
            fetch(`http://localhost:5000/api/submissions?team_id=${t.team_id}`, {
              headers: { ...authHeader }
            }).then(r => r.ok ? r.json() : { submissions: [] })
          );
          const results = await Promise.all(subPromises);
          const allSubs: SubmissionResult[] = [];
          results.forEach(r => {
            if (r.submissions && Array.isArray(r.submissions)) {
              allSubs.push(...r.submissions);
            }
          });
          allSubs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
          setMySubmissions(allSubs);
        } catch (subErr) {
          console.error('Error fetching submissions for all teams:', subErr);
        }
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Helper to fetch submissions for all teams or a specific team
  const fetchSubmissionsForTeam = async (teamId?: number | 'ALL', teamsList?: TeamInfo[]) => {
    try {
      const token = await getToken();
      const authHeader: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      const activeList = teamsList || myTeams;

      if (!teamId || teamId === 'ALL') {
        if (activeList.length === 0) {
          setMySubmissions([]);
          return;
        }
        const subPromises = activeList.map(t =>
          fetch(`http://localhost:5000/api/submissions?team_id=${t.team_id}`, {
            headers: { ...authHeader }
          }).then(r => r.ok ? r.json() : { submissions: [] })
        );
        const results = await Promise.all(subPromises);
        const allSubs: SubmissionResult[] = [];
        results.forEach(r => {
          if (r.submissions && Array.isArray(r.submissions)) {
            allSubs.push(...r.submissions);
          }
        });
        allSubs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        setMySubmissions(allSubs);
      } else {
        const subRes = await fetch(`http://localhost:5000/api/submissions?team_id=${teamId}`, {
          headers: { ...authHeader }
        });
        if (subRes.ok) {
          const sData = await subRes.json();
          setMySubmissions(sData.submissions || []);
        }
      }
    } catch (e) {
      console.error('Error fetching submissions for team:', e);
    }
  };

  // Switch active course/team filter (ALL or specific team_id)
  const handleFilterChange = (filterVal: string, targetAssignId?: string | number) => {
    setSelectedFilter(filterVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aita_student_selected_team_id', filterVal);
    }

    if (filterVal === 'ALL') {
      if (myTeams.length > 0) {
        setMyTeam(myTeams[0]);
        if (myTeams[0].repo_url) setRepoUrl(myTeams[0].repo_url);
      }
      if (targetAssignId) {
        setSelectedAssignment(String(targetAssignId));
      } else if (assignments.length > 0) {
        setSelectedAssignment(String(assignments[0].assignment_id));
      }
      fetchSubmissionsForTeam('ALL');
    } else {
      const found = myTeams.find(t => String(t.team_id) === filterVal);
      if (found) {
        setMyTeam(found);
        if (found.repo_url) setRepoUrl(found.repo_url);
        if (targetAssignId) {
          setSelectedAssignment(String(targetAssignId));
        } else {
          const teamAssigns = assignments.filter(a => !a.course_id || a.course_id === found.course_id);
          if (teamAssigns.length > 0) {
            setSelectedAssignment(String(teamAssigns[0].assignment_id));
          } else {
            setSelectedAssignment('');
          }
        }
        fetchSubmissionsForTeam(found.team_id);
      }
    }
  };

  const handleSelectTeam = (teamId: number, targetAssignId?: string | number) => {
    handleFilterChange(String(teamId), targetAssignId);
  };

  const currentFilterTeam = selectedFilter === 'ALL'
    ? myTeam
    : (myTeams.find(t => String(t.team_id) === selectedFilter) || myTeam);

  const displayedTeams = selectedFilter === 'ALL'
    ? myTeams
    : myTeams.filter(t => String(t.team_id) === selectedFilter);

  const relevantAssignments = selectedFilter === 'ALL'
    ? assignments.filter(a => myTeams.some(t => !a.course_id || a.course_id === t.course_id))
    : assignments.filter(a => {
        const targetTeam = myTeams.find(t => String(t.team_id) === selectedFilter);
        return targetTeam ? (!a.course_id || a.course_id === targetTeam.course_id) : true;
      });

  const displayedSubmissions = selectedFilter === 'ALL'
    ? mySubmissions
    : mySubmissions.filter(s => String(s.team_id) === selectedFilter);

  const targetAnalyticsTeam = selectedFilter === 'ALL'
    ? (myTeam || myTeams[0])
    : (myTeams.find(t => String(t.team_id) === selectedFilter) || myTeam || myTeams[0]);

  const targetPeerTeam = selectedFilter === 'ALL'
    ? (myTeam || myTeams[0])
    : (myTeams.find(t => String(t.team_id) === selectedFilter) || myTeam || myTeams[0]);

  // Sync selected assignment with current course/team
  useEffect(() => {
    if (relevantAssignments.length > 0) {
      const hasMatch = relevantAssignments.some(a => String(a.assignment_id) === String(selectedAssignment));
      if (!selectedAssignment || !hasMatch) {
        const nextAssign = relevantAssignments[0];
        setSelectedAssignment(String(nextAssign.assignment_id));
        if (selectedFilter === 'ALL' && nextAssign.course_id) {
          const matchT = myTeams.find(t => t.course_id === nextAssign.course_id);
          if (matchT) {
            setMyTeam(matchT);
            if (matchT.repo_url) setRepoUrl(matchT.repo_url);
          }
        }
      }
    } else {
      setSelectedAssignment('');
    }
  }, [selectedFilter, assignments, relevantAssignments]);

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
    const currentAssign = assignments.find(a => String(a.assignment_id) === String(selectedAssignment));
    const activeSubmitTeam = (currentAssign && currentAssign.course_id)
      ? (myTeams.find(t => t.course_id === currentAssign.course_id) || myTeam || myTeams[0])
      : (myTeam || myTeams[0]);

    if (!selectedAssignment || !activeSubmitTeam) {
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
          team_id: activeSubmitTeam.team_id,
          artifact_url: repoUrl.trim(),
          git_commit_hash: commitHash.trim(),
          code_content: codeContent.trim(),
          language: selectedLanguage
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
          team_id: targetPeerTeam?.team_id || 1,
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
  const teammates = targetPeerTeam?.members?.filter(m => m.user_id !== currentUser?.userId) || [];

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
            {myTeams.length > 0 ? (
              <select
                value={selectedFilter}
                onChange={e => handleFilterChange(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  padding: '6px 14px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '280px',
                  maxWidth: '720px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                }}
              >
                <option value="ALL">
                  📚 {lang === 'vi' ? 'Tất cả học phần' : 'All Courses'}
                </option>
                {myTeams.map(t => (
                  <option key={t.team_id} value={String(t.team_id)}>
                    📚 {t.course_code} – {t.course_name} ({t.semester || 'FA26'})
                  </option>
                ))}
              </select>
            ) : (
              <strong style={{ color: 'var(--text-main)' }}>{myTeam ? `${myTeam.course_code} - ${myTeam.course_name}` : (lang === 'vi' ? 'Chưa được phân nhóm' : 'No team assigned')}</strong>
            )}
            {selectedFilter === 'ALL' ? (
              myTeams.length > 0 && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }}>•</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Nhóm:' : 'Team:'}</span>
                  <strong style={{ color: '#38bdf8' }}>{lang === 'vi' ? `Tất cả (${myTeams.length} nhóm)` : `All (${myTeams.length} teams)`}</strong>
                </>
              )
            ) : currentFilterTeam ? (
              <>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Nhóm:' : 'Team:'}</span>
                <strong style={{ color: '#38bdf8' }}>{currentFilterTeam.team_name}</strong>
              </>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedFilter !== 'ALL' && currentFilterTeam && (() => {
              const myMember = currentFilterTeam.members?.find(m => 
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
            {selectedFilter === 'ALL' && myTeams.length > 0 && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '8px 16px', borderRadius: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block' }}>
                  {lang === 'vi' ? 'Chế độ xem' : 'View Mode'}
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#60a5fa' }}>
                  {lang === 'vi' ? `Tổng hợp ${myTeams.length} môn học` : `All ${myTeams.length} Courses`}
                </strong>
              </div>
            )}
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
          <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {loadingData && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <Loader2 size={26} className="animate-spin" style={{ marginBottom: '8px', color: '#38bdf8' }} />
                <p style={{ fontSize: '0.85rem' }}>{lang === 'vi' ? 'Đang đồng bộ dữ liệu học phần...' : 'Loading course data...'}</p>
              </div>
            )}

            {displayedTeams.length > 0 ? (
              displayedTeams.map((team) => (
                <div
                  key={team.team_id}
                  style={{
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.7), 0 0 30px -10px rgba(56, 189, 248, 0.1)',
                    backdropFilter: 'blur(16px)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {/* Ambient background glow accent */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-60px',
                      right: '-60px',
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, transparent 70%)',
                      pointerEvents: 'none',
                      filter: 'blur(30px)'
                    }}
                  />

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                      <div 
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
                          flexShrink: 0
                        }}
                      >
                        <BookOpen size={19} color="#38bdf8" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span 
                            style={{ 
                              background: 'rgba(56, 189, 248, 0.12)', 
                              color: '#38bdf8', 
                              border: '1px solid rgba(56, 189, 248, 0.3)', 
                              padding: '2px 8px', 
                              borderRadius: '999px', 
                              fontSize: '0.72rem', 
                              fontWeight: 700
                            }}
                          >
                            {team.course_code}
                          </span>
                          <span 
                            style={{ 
                              background: 'rgba(16, 185, 129, 0.12)', 
                              color: '#34d399', 
                              border: '1px solid rgba(16, 185, 129, 0.3)', 
                              padding: '2px 8px', 
                              borderRadius: '999px', 
                              fontSize: '0.72rem', 
                              fontWeight: 700
                            }}
                          >
                            {team.semester}
                          </span>
                          <span 
                            style={{ 
                              background: 'rgba(99, 102, 241, 0.12)', 
                              color: '#a5b4fc', 
                              border: '1px solid rgba(99, 102, 241, 0.3)', 
                              padding: '2px 8px', 
                              borderRadius: '999px', 
                              fontSize: '0.72rem', 
                              fontWeight: 700
                            }}
                          >
                            {team.team_name}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 2px 0', letterSpacing: '-0.2px', color: '#f8fafc' }}>
                          {team.course_name}
                        </h3>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{lang === 'vi' ? 'GV:' : 'Lecturer:'} <strong style={{ color: '#f1f5f9', fontWeight: 600 }}>{team.lecturer_name}</strong></span>
                          <span>•</span>
                          <span>{team.members?.length || 0} {lang === 'vi' ? 'thành viên' : 'members'}</span>
                        </div>
                      </div>
                    </div>

                    {team.repo_url && (
                      <a
                        href={team.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.1))',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>GitHub Repo</span>
                      </a>
                    )}
                  </div>

                  {/* Quick Highlight Stats Row - Compact */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                        <Users size={14} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Nhóm đồ án' : 'Team Name'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.team_name}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', flexShrink: 0 }}>
                        <BookOpen size={14} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Giảng viên' : 'Instructor'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.lecturer_name}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
                        <FileCode size={14} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Bài tập' : 'Assignments'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {assignments.filter(a => !a.course_id || a.course_id === team.course_id).length} {lang === 'vi' ? 'bài tập' : 'milestones'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', position: 'relative', zIndex: 1 }} />

                  {/* Team Members */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#38bdf8" />
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {lang === 'vi' ? 'Thành viên cùng nhóm' : 'Team Members'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontWeight: 600
                      }}>
                        {team.members?.length || 0} {lang === 'vi' ? 'người' : 'members'}
                      </span>
                    </div>

                    {team.members && team.members.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px' }}>
                        {[...team.members]
                          .sort((a, b) => {
                            if (a.role === 'LEADER' && b.role !== 'LEADER') return -1;
                            if (b.role === 'LEADER' && a.role !== 'LEADER') return 1;
                            return 0;
                          })
                          .map((m) => {
                          const isMe = (currentUser?.userId && m.user_id === currentUser.userId) || 
                                       (currentUser?.email && m.email && m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
                          const initial = (m.full_name || 'U').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U';
                          const memberKey = m.team_member_id || m.user_id;
                          const isExpanded = selectedMemberId === memberKey;

                          let memberTasksList: any[] = [];
                          try {
                            const savedTasks = localStorage.getItem('aita_lecturer_team_tasks');
                            if (savedTasks) {
                              const parsed = JSON.parse(savedTasks);
                              if (Array.isArray(parsed)) {
                                memberTasksList = parsed.filter((t: any) => 
                                  (t.team_id === team.team_id || team.team_name?.includes('Group 4') || team.team_name?.includes('AITA')) &&
                                  (t.assigned_to_name === m.full_name || 
                                   t.assigned_to_name === m.email || 
                                   m.full_name?.toLowerCase().includes(t.assigned_to_name?.toLowerCase()) ||
                                   t.assigned_to_name?.toLowerCase().includes(m.full_name?.toLowerCase()))
                                );
                              }
                            }
                          } catch (e) {}

                          return (
                            <div
                              key={memberKey}
                              style={{
                                borderRadius: '10px',
                                background: isMe ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                border: isMe ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'all 0.15s ease',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                onClick={() => setSelectedMemberId(prev => prev === memberKey ? null : memberKey)}
                                style={{
                                  padding: '7px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                  <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: isMe ? 'linear-gradient(135deg, #1e40af, #0284c7)' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
                                    color: '#fff',
                                    border: isMe ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                                      <span style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: isMe ? '#38bdf8' : '#f8fafc',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {m.full_name}
                                      </span>
                                      {isMe && (
                                        <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: '3px', background: '#3b82f6', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                                          {lang === 'vi' ? 'Bạn' : 'You'}
                                        </span>
                                      )}
                                      {m.role === 'LEADER' && (
                                        <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600, flexShrink: 0 }}>
                                          <Crown size={8} /> {lang === 'vi' ? 'Trưởng nhóm' : 'Leader'}
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {m.email}
                                    </span>
                                  </div>
                                </div>

                                {/* Right side interactive button */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.66rem',
                                  fontWeight: 600,
                                  color: isExpanded ? '#38bdf8' : '#94a3b8',
                                  background: isExpanded ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                  border: `1px solid ${isExpanded ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                                  padding: '3px 6px',
                                  borderRadius: '5px',
                                  flexShrink: 0
                                }}>
                                  <span>{lang === 'vi' ? 'Xem phân hệ' : 'View Module'}</span>
                                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </div>
                              </div>

                              {/* Accordion content */}
                              {isExpanded && (
                                <div style={{
                                  padding: '8px 10px',
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '0.72rem' }}>
                                    <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Phân hệ phụ trách:' : 'Assigned Module:'}</span>
                                    <span style={{
                                      fontWeight: 600,
                                      color: '#38bdf8',
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(56, 189, 248, 0.25)'
                                    }}>
                                      {m.assigned_module || (lang === 'vi' ? 'Chưa phân công' : 'Unassigned')}
                                    </span>
                                  </div>

                                  {memberTasksList.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                                      <span style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                                        {lang === 'vi' ? 'Nhiệm vụ đồ án được giao:' : 'Assigned Tasks:'}
                                      </span>
                                      {memberTasksList.map((t: any) => (
                                        <div
                                          key={t.task_id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '6px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: '4px 8px',
                                            borderRadius: '5px',
                                            fontSize: '0.72rem'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                                            <span style={{
                                              width: '5px',
                                              height: '5px',
                                              borderRadius: '50%',
                                              background: t.status === 'DONE' ? '#10b981' : (t.status === 'IN_PROGRESS' ? '#f59e0b' : '#64748b'),
                                              flexShrink: 0
                                            }} />
                                            <span style={{ color: '#f1f5f9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {t.title}
                                            </span>
                                          </div>
                                          <span style={{
                                            fontSize: '0.64rem',
                                            fontWeight: 700,
                                            padding: '1px 5px',
                                            borderRadius: '3px',
                                            flexShrink: 0,
                                            color: t.status === 'DONE' ? '#34d399' : (t.status === 'IN_PROGRESS' ? '#fbbf24' : '#94a3b8'),
                                            background: t.status === 'DONE' ? 'rgba(16, 185, 129, 0.15)' : (t.status === 'IN_PROGRESS' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)')
                                          }}>
                                            {t.status === 'DONE' ? (lang === 'vi' ? 'Xong' : 'Done') : (t.status === 'IN_PROGRESS' ? (lang === 'vi' ? 'Đang làm' : 'Doing') : (lang === 'vi' ? 'Chưa' : 'Todo'))}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                        {lang === 'vi' ? 'Chưa có thành viên nào khác trong nhóm.' : 'No other members in this team yet.'}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', position: 'relative', zIndex: 1 }} />

                  {/* Assignments */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCode size={14} color="#38bdf8" />
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {lang === 'vi' ? 'Bài tập cần nộp' : 'Assignments'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {assignments.filter(a => !a.course_id || a.course_id === team.course_id).length > 0 ? (
                        assignments.filter(a => !a.course_id || a.course_id === team.course_id).map(a => {
                          const daysLeft = getDaysUntil(a.deadline);
                          const isUrgent = daysLeft <= 3;
                          const isPast = daysLeft < 0;
                          return (
                            <div 
                              key={a.assignment_id} 
                              style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: `1px solid ${isPast ? 'rgba(244,63,94,0.22)' : isUrgent ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '10px',
                                padding: '10px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <h5 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                    {a.title}
                                  </h5>
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '999px',
                                    background: a.submission_type === 'TEAM' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                    color: a.submission_type === 'TEAM' ? '#c084fc' : '#38bdf8',
                                    border: `1px solid ${a.submission_type === 'TEAM' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                                  }}>
                                    {a.submission_type === 'TEAM' ? (lang === 'vi' ? 'Nhóm đồ án' : 'Team') : (lang === 'vi' ? 'Cá nhân' : 'Individual')}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    background: isPast ? 'rgba(244,63,94,0.15)' : isUrgent ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                                    color: isPast ? '#f43f5e' : isUrgent ? '#f59e0b' : '#34d399',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}>
                                    <Clock size={11} />
                                    {isPast ? (lang === 'vi' ? 'Hết hạn' : 'Expired') :
                                      isUrgent ? `${daysLeft} ${lang === 'vi' ? 'ngày' : 'days'}` :
                                      `${daysLeft} ${lang === 'vi' ? 'ngày còn lại' : 'days left'}`}
                                  </span>
                                </div>
                              </div>

                              {a.description && (
                                <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                                  {a.description}
                                </p>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  {lang === 'vi' ? 'Thang điểm:' : 'Max:'} <strong style={{ color: '#38bdf8' }}>{a.max_score} điểm</strong>
                                </span>

                                {!isPast && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectTeam(team.team_id, a.assignment_id);
                                      setActiveTab('submit');
                                    }}
                                    className="btn-primary"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.75rem',
                                      gap: '5px',
                                      height: '26px',
                                      borderRadius: '6px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <span>{lang === 'vi' ? 'Nộp bài ngay' : 'Submit Now'}</span>
                                    <ArrowRight size={11} />
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
                          gap: '6px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px dashed rgba(255, 255, 255, 0.08)',
                          color: '#94a3b8',
                          fontSize: '0.78rem'
                        }}>
                          <CheckCircle2 size={14} color="#34d399" />
                          <span>{lang === 'vi' ? 'Không có bài tập sắp tới hạn' : 'No upcoming assignments'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : !loadingData && (
              <div 
                className="glass-card" 
                style={{ 
                  padding: '2rem', 
                  borderRadius: '16px',
                  borderTop: '4px solid #f59e0b', 
                  maxWidth: '600px', 
                  margin: '0 auto', 
                  textAlign: 'center',
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Users size={24} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  {lang === 'vi' ? 'Chưa được phân công vào nhóm' : 'Not assigned to a team yet'}
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.5, maxWidth: '460px', margin: '0 auto 1.25rem' }}>
                  {lang === 'vi'
                    ? 'Giảng viên chưa gán email của bạn vào nhóm đồ án nào. Khi giảng viên thêm email của bạn vào nhóm, toàn bộ thông tin học phần, nhóm và danh sách các bạn cùng nhóm sẽ tự động xuất hiện tại đây!'
                    : 'Your email has not been assigned to a project team yet. Once your lecturer adds your email, your course, team, and member roster will automatically appear here!'}
                </p>
                <button onClick={fetchData} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px', margin: '0 auto', display: 'inline-flex' }}>
                  <RefreshCw size={14} /> {lang === 'vi' ? 'Kiểm tra & Làm mới' : 'Check & Refresh'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ───── TAB: SUBMISSION FORM ───── */}
        {activeTab === 'submit' && (
          !myTeam ? (
            <div 
              className="glass-card" 
              style={{ 
                maxWidth: '680px', 
                margin: '2rem auto', 
                padding: '2.5rem 2rem', 
                textAlign: 'center', 
                borderTop: '4px solid #f59e0b',
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  color: '#fbbf24', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.25rem' 
                }}
              >
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.6rem', color: '#f8fafc' }}>
                {lang === 'vi' ? 'Bạn chưa được phân công vào nhóm đồ án' : 'Not assigned to a project team yet'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                {lang === 'vi'
                  ? 'Chức năng nộp bài đồ án và chấm Docker Sandbox yêu cầu sinh viên phải trực thuộc một nhóm đồ án hợp lệ. Giảng viên chưa gán tài khoản của bạn vào nhóm nào. Vui lòng liên hệ Giảng viên để được phân nhóm trước khi nộp bài.'
                  : 'Submitting assignments and running Docker Sandbox grading requires membership in a project team. Please contact your instructor to be added to a team.'}
              </p>
              <button 
                onClick={fetchData} 
                className="btn-primary" 
                style={{ padding: '9px 20px', fontSize: '0.86rem', gap: '8px', margin: '0 auto', display: 'inline-flex' }}
              >
                <RefreshCw size={15} /> {lang === 'vi' ? 'Kiểm tra & Làm mới' : 'Check & Refresh'}
              </button>
            </div>
          ) : (
            <div 
              style={{ 
                maxWidth: '860px', 
                margin: '0 auto', 
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                borderRadius: '20px',
                padding: '2rem 2.25rem',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Ambient background glow accent */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-80px',
                  right: '-80px',
                  width: '260px',
                  height: '260px',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  filter: 'blur(30px)'
                }}
              />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div 
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
                      flexShrink: 0
                    }}
                  >
                    <FileCode size={24} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: '#f8fafc' }}>
                        {lang === 'vi' ? 'Nộp bài đồ án' : 'Submit Assignment'}
                      </h3>
                      <span 
                        style={{ 
                          background: 'rgba(56, 189, 248, 0.12)', 
                          color: '#38bdf8', 
                          border: '1px solid rgba(56, 189, 248, 0.28)', 
                          padding: '3px 10px', 
                          borderRadius: '999px', 
                          fontSize: '0.78rem', 
                          fontWeight: 700,
                          letterSpacing: '0.2px'
                        }}
                      >
                        {myTeam.team_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Fill Button */}
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl(myTeam?.repo_url || 'https://github.com/min098-ui/SWD392_AITA-Intelligent.git');
                    setCommitHash('7a9f4c28e9b1');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.12)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.22))';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>⚡</span>
                  <span>{lang === 'vi' ? 'Điền nhanh' : 'Quick Fill'}</span>
                </button>
              </div>

              <form onSubmit={handleSubmitArtifact} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                {/* Assignment selector */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                    <BookOpen size={15} color="#38bdf8" />
                    <span>{lang === 'vi' ? 'Bài tập cần nộp' : 'Assignment'}</span>
                    <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedAssignment}
                      onChange={e => setSelectedAssignment(e.target.value)}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '11px 14px', 
                        background: 'rgba(15, 23, 42, 0.8)', 
                        border: '1px solid rgba(255, 255, 255, 0.12)', 
                        borderRadius: '10px', 
                        color: '#f8fafc', 
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#38bdf8'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                    >
                      {relevantAssignments.length > 0 ? relevantAssignments.map((a, idx) => (
                        <option key={a.assignment_id} value={a.assignment_id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                          #{idx + 1} - {a.title} ({a.submission_type === 'TEAM' ? (lang === 'vi' ? 'Nhóm đồ án' : 'Team') : (lang === 'vi' ? 'Cá nhân' : 'Individual')})
                        </option>
                      )) : (
                        <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>-- {lang === 'vi' ? 'Chưa có bài tập cho môn này' : 'No assignments available for this course'} --</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Git Repo and Commit SHA side-by-side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                      <GitBranch size={15} color="#a78bfa" />
                      <span>{lang === 'vi' ? 'Đường dẫn Git Repository' : 'Git Repository URL'}</span>
                      <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={repoUrl}
                      onChange={e => setRepoUrl(e.target.value)}
                      required
                      placeholder="https://github.com/username/repo.git"
                      style={{ 
                        width: '100%', 
                        padding: '11px 14px', 
                        background: 'rgba(15, 23, 42, 0.8)', 
                        border: '1px solid rgba(255, 255, 255, 0.12)', 
                        borderRadius: '10px', 
                        color: '#e2e8f0', 
                        fontSize: '0.86rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                      }} 
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#a78bfa';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.2)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                      <Terminal size={15} color="#34d399" />
                      <span>{lang === 'vi' ? 'Mã Commit SHA' : 'Git Commit Hash'}</span>
                      <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={commitHash}
                      onChange={e => setCommitHash(e.target.value)}
                      required
                      placeholder="e.g.: 7a9f4c28e9b1"
                      style={{ 
                        width: '100%', 
                        padding: '11px 14px', 
                        background: 'rgba(15, 23, 42, 0.8)', 
                        border: '1px solid rgba(255, 255, 255, 0.12)', 
                        borderRadius: '10px', 
                        color: '#34d399', 
                        fontSize: '0.86rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                      }} 
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#34d399';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52, 211, 153, 0.2)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
                      }}
                    />
                  </div>
                </div>

                {/* IDE Code Window Container */}
                <div 
                  style={{ 
                    borderRadius: '14px', 
                    border: '1px solid rgba(255, 255, 255, 0.14)', 
                    background: '#090d16',
                    overflow: 'hidden',
                    boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/* IDE Window Header */}
                  <div 
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    {/* Left: Window controls & active tab */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* macOS traffic dots */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                      </div>

                      {/* Language Switcher Buttons */}
                      <div style={{ display: 'flex', gap: '3px', background: 'rgba(0, 0, 0, 0.5)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLanguage('javascript')}
                          style={{
                            padding: '3px 9px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedLanguage === 'javascript' ? '#f59e0b' : 'transparent',
                            color: selectedLanguage === 'javascript' ? '#000' : '#94a3b8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>🟨 JS (Node.js)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLanguage('python')}
                          style={{
                            padding: '3px 9px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedLanguage === 'python' ? '#38bdf8' : 'transparent',
                            color: selectedLanguage === 'python' ? '#000' : '#94a3b8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>🐍 Python 3</span>
                        </button>
                      </div>

                      {/* Active tab */}
                      <div 
                        style={{ 
                          background: selectedLanguage === 'python' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)', 
                          border: `1px solid ${selectedLanguage === 'python' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ background: selectedLanguage === 'python' ? '#38bdf8' : '#f59e0b', color: '#000', fontWeight: 800, fontSize: '0.62rem', padding: '1px 4px', borderRadius: '3px' }}>
                          {selectedLanguage === 'python' ? 'PY' : 'JS'}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: '#f1f5f9', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                          {selectedLanguage === 'python' ? 'main.py' : 'main.js'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions / Info (Clean - No sample code) */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {codeContent && (
                        <button
                          type="button"
                          onClick={() => setCodeContent('')}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title={lang === 'vi' ? 'Xóa nội dung code' : 'Clear editor'}
                        >
                          ✕ {lang === 'vi' ? 'Xóa code' : 'Clear'}
                        </button>
                      )}
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                        {selectedLanguage === 'python' ? 'Python 3.11' : 'Node.js 20'}
                      </span>
                    </div>
                  </div>

                  {/* Code Textarea */}
                  <textarea
                    rows={7}
                    value={codeContent}
                    onChange={e => setCodeContent(e.target.value)}
                    required
                    placeholder={
                      selectedLanguage === 'python'
                        ? (lang === 'vi' ? '# Viết hoặc dán mã nguồn Python 3 tại đây (chạy trên Docker Sandbox)...' : '# Write or paste Python 3 source code here...')
                        : (lang === 'vi' ? '// Viết hoặc dán mã nguồn JavaScript tại đây (chạy trên Docker Sandbox)...' : '// Write or paste JavaScript source code here...')
                    }
                    className="code-editor-textarea"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: '#090d16',
                      border: 'none',
                      outline: 'none',
                      color: selectedLanguage === 'python' ? '#38bdf8' : '#fbbf24',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.86rem',
                      lineHeight: '1.6',
                      display: 'block',
                      resize: 'vertical'
                    }}
                  />

                  {/* IDE Bottom Status Bar */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '6px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      fontFamily: 'var(--font-mono, monospace)',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                      <span>{selectedLanguage === "python" ? "Python 3.11 Sandbox" : "Node.js 20 Sandbox"}</span>
                      <span style={{ color: '#475569' }}>|</span>
                      <span>Docker Container (Isolated)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>Watchdog: 5.0s</span>
                      <span style={{ color: '#475569' }}>•</span>
                      <span>RAM: 128MB</span>
                      <span style={{ color: '#475569' }}>•</span>
                      <span>UTF-8</span>
                    </div>
                  </div>
                </div>

                {/* Progress step during execution */}
                {isSubmitting && (
                  <div 
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)', 
                      border: '1px solid rgba(56, 189, 248, 0.4)', 
                      borderRadius: '12px', 
                      padding: '14px 18px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      color: '#93c5fd', 
                      fontSize: '0.88rem',
                      boxShadow: '0 0 25px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <Loader2 size={20} className="animate-spin" color="#38bdf8" />
                    <div style={{ fontWeight: 500 }}>
                      {submitStep === 1 && (lang === 'vi' ? '1. Đang khởi tạo Docker Sandbox container cô lập an toàn...' : '1. Initializing isolated Docker Sandbox container...')}
                      {submitStep === 2 && (lang === 'vi' ? '2. Đang biên dịch mã nguồn và chạy test case tự động...' : '2. Compiling code and executing test cases...')}
                      {submitStep === 3 && (lang === 'vi' ? '3. AI đang phân tích kiến trúc Clean Code và sinh nhận xét...' : '3. AI is evaluating code quality and generating feedback...')}
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {submitError && (
                  <div 
                    style={{ 
                      background: 'rgba(244, 63, 94, 0.12)', 
                      border: '1px solid rgba(244, 63, 94, 0.35)', 
                      borderRadius: '10px', 
                      padding: '12px 16px', 
                      color: '#fda4af', 
                      fontSize: '0.86rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px' 
                    }}
                  >
                    <AlertTriangle size={18} color="#f43f5e" /> 
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit CTA Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting || relevantAssignments.length === 0}
                  style={{
                    background: isSubmitting || relevantAssignments.length === 0
                      ? 'rgba(30, 41, 59, 0.7)'
                      : 'linear-gradient(135deg, #1e40af 0%, #0284c7 45%, #0ea5e9 80%, #38bdf8 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    boxShadow: isSubmitting || relevantAssignments.length === 0
                      ? 'none'
                      : '0 10px 30px -5px rgba(2, 132, 199, 0.5), 0 0 20px rgba(56, 189, 248, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    letterSpacing: '0.2px',
                    cursor: isSubmitting || relevantAssignments.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '0.5rem',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: (isSubmitting || relevantAssignments.length === 0) ? 0.6 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting && relevantAssignments.length > 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 14px 35px -5px rgba(2, 132, 199, 0.65), 0 0 25px rgba(56, 189, 248, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting && relevantAssignments.length > 0) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(2, 132, 199, 0.5), 0 0 20px rgba(56, 189, 248, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{lang === 'vi' ? 'Đang thực thi Docker Sandbox & AI...' : 'Executing Docker Sandbox & AI...'}</span>
                    </>
                  ) : relevantAssignments.length === 0 ? (
                    <span>{lang === 'vi' ? 'Chưa có bài tập nào cho học phần này' : 'No assignments for this course yet'}</span>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>{lang === 'vi' ? 'Xác nhận Nộp bài & Kích hoạt Docker Sandbox' : 'Confirm Submission & Run Docker Sandbox'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )
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
            {displayedSubmissions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displayedSubmissions.map((sub) => (
                  <div key={sub.submission_id} className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${getStatusColor(sub.status)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{sub.assignment_title || 'Assignment #' + sub.assignment_id}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>Commit: <code style={{ color: '#60a5fa' }}>{sub.git_commit_hash?.slice(0, 12)}</code></span>
                          <span>{lang === 'vi' ? 'Nộp lúc:' : 'Submitted:'} {new Date(sub.submitted_at).toLocaleString('vi-VN')}</span>
                          {sub.submitter_name && (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '5px', 
                              background: 'rgba(167, 139, 250, 0.12)', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              border: '1px solid rgba(167, 139, 250, 0.3)',
                              color: '#c4b5fd',
                              fontSize: '0.78rem'
                            }}>
                              <User size={12} color="#a78bfa" />
                              <span>{lang === 'vi' ? 'Người nộp:' : 'Submitted by:'} <strong style={{ color: '#e9d5ff' }}>{sub.submitter_name}</strong></span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(sub.score != null || sub.final_score != null) && (
                          <span style={{
                            padding: '4px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800,
                            background: Number(sub.final_score ?? sub.score) >= 8 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: Number(sub.final_score ?? sub.score) >= 8 ? '#34d399' : '#fbbf24',
                            border: `1px solid ${Number(sub.final_score ?? sub.score) >= 8 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}>
                            ★ {Number(sub.final_score ?? sub.score).toFixed(1)} / 10
                          </span>
                        )}
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
              <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                  {lang === 'vi' ? 'Chưa có bài nộp nào' : 'No submissions yet'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                  {!myTeam
                    ? (lang === 'vi' 
                        ? 'Bạn chưa được phân công vào nhóm đồ án nào. Sau khi được giảng viên gán vào nhóm và nộp bài, kết quả chấm Docker Sandbox sẽ hiển thị tại đây!'
                        : 'You are not assigned to any project team yet. Submissions and grading will appear here once assigned.')
                    : (lang === 'vi' 
                        ? 'Nhóm của bạn chưa nộp bài tập nào. Sau khi nộp bài tại tab "Nộp bài", hệ thống Docker Sandbox sẽ tự động chấm điểm và hiển thị kết quả kiểm thử tại đây!'
                        : 'Your team has not submitted any assignments yet. Once submitted, Docker Sandbox test execution and AI feedback will appear here!')}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('submit')}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.88rem', margin: '0 auto' }}
                >
                  <ArrowRight size={15} /> {lang === 'vi' ? 'Đi đến trang Nộp bài' : 'Go to Submission Page'}
                </button>
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
          !myTeam ? (
            <div 
              className="glass-card" 
              style={{ 
                maxWidth: '680px', 
                margin: '2rem auto', 
                padding: '2.5rem 2rem', 
                textAlign: 'center', 
                borderTop: '4px solid #f59e0b',
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  color: '#fbbf24', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.25rem' 
                }}
              >
                <GitBranch size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.6rem', color: '#f8fafc' }}>
                {lang === 'vi' ? 'Bạn chưa được phân công vào nhóm đồ án' : 'Not assigned to a project team yet'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto' }}>
                {lang === 'vi'
                  ? 'Chức năng thống kê đóng góp Git (LOC, Commits) chỉ khả dụng khi bạn đã được phân công vào một nhóm đồ án.'
                  : 'Git contribution analytics are only available once you are assigned to a project team.'}
              </p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={20} color="#38bdf8" /> {lang === 'vi' ? `Báo cáo Đóng góp Git - ${targetAnalyticsTeam.team_name}` : `Team Git Contribution - ${targetAnalyticsTeam.team_name}`}
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
                  {(myTeam.members || []).map((member, idx) => {
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
          )
        )}

        {/* ───── TAB: PEER AUDIT ───── */}
        {activeTab === 'peer' && (
          !myTeam ? (
            <div 
              className="glass-card" 
              style={{ 
                maxWidth: '680px', 
                margin: '2rem auto', 
                padding: '2.5rem 2rem', 
                textAlign: 'center', 
                borderTop: '4px solid #f59e0b',
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  color: '#fbbf24', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.25rem' 
                }}
              >
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.6rem', color: '#f8fafc' }}>
                {lang === 'vi' ? 'Bạn chưa được phân công vào nhóm đồ án' : 'Not assigned to a project team yet'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto' }}>
                {lang === 'vi'
                  ? 'Chức năng đánh giá chéo thành viên (Peer Audit) chỉ khả dụng khi bạn đã được phân công vào một nhóm đồ án.'
                  : 'Peer audit evaluation is only available once you are assigned to a project team.'}
              </p>
            </div>
          ) : (
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
                      <option value="" disabled>{lang === 'vi' ? 'Không có thành viên khác trong nhóm' : 'No other teammates in team'}</option>
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
          )
        )}
      </div>
    </>
  );
}
