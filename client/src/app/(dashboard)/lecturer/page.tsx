'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../../components/Navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Users, BookOpen, GitBranch, Settings, CheckCircle2, 
  AlertTriangle, Filter, Search, ShieldCheck, Download, FolderOpen, Plus, 
  Link as LinkIcon, Edit3, RotateCw, Loader2, Sparkles, Terminal, X, Check
} from 'lucide-react';

interface SubmissionItem {
  id: number;
  team: string;
  repo: string;
  commit: string;
  status: string;
  statusColor: string;
  grade: number;
  aiScore: string;
  time: string;
  sandboxOutput: string;
  aiFeedback: string;
  overrideNote: string;
}

interface CourseItem {
  course_id: number;
  course_code: string;
  course_name: string;
  semester: string;
  lecturer_id: number;
  lecturer_name?: string;
  lecturer_email?: string;
}

interface TeamMemberItem {
  team_member_id: number;
  user_id: number;
  full_name: string;
  email: string;
  assigned_module: string;
}

interface TeamItem {
  team_id: number;
  team_name: string;
  repo_url: string;
  course_id: number;
  course_code?: string;
  course_name?: string;
  semester?: string;
  lecturer_name?: string;
  members: TeamMemberItem[];
}

interface StudentUser {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function LecturerDashboard() {
  const { lang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'overview' | 'config' | 'analytics' | 'peer'>('overview');

  // Real Database Data State
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal 1: Create Course State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseSemester, setCourseSemester] = useState('FA26');
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Modal 2: Create Team State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCourseId, setTeamCourseId] = useState<number | string>('');
  const [teamRepoUrl, setTeamRepoUrl] = useState('');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Modal 3: Assign Student to Team State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetTeam, setTargetTeam] = useState<TeamItem | null>(null);
  const [assignUserId, setAssignUserId] = useState<number | string>('');
  const [assignModule, setAssignModule] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Modal 4: Create Assignment State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState('10');
  const [assignmentCourseId, setAssignmentCourseId] = useState<number | string>('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([
    {
      id: 1,
      team: 'Group 4 (AITA)',
      repo: 'https://github.com/aita-project/aita-intelligent.git',
      commit: '7a9f4c28e9b1',
      status: 'Passed (10/10)',
      statusColor: 'var(--accent-success)',
      grade: 9.5,
      aiScore: 'A',
      time: '2026-09-27 10:15',
      sandboxOutput: `[Docker Runner v2.4] Initializing container from image: aita-sandbox:node18-slim\nMounting repository from git SHA: 7a9f4c28e9b1\nRunning 10 test cases against rubric rules...\n✔ TC1: Valid Authentication (42ms)\n✔ TC2: Boundary Array Index Check (68ms)\n✔ TC3: Hidden Edge Case [SQL/Payload Sanitation] (85ms)\n------------------------------------------------\nAll 10/10 test cases passed. Sandbox execution time: 195ms.`,
      aiFeedback: `🤖 Phân tích AI (Gemini 1.5 Pro): Sinh viên áp dụng đúng kiến trúc phân lớp Clean Architecture, mã nguồn có docstring đầy đủ. Xử lý timeout và kết nối cơ sở dữ liệu đạt chuẩn. Gợi ý thêm: Cần tăng độ bao phủ kiểm thử đơn vị cho hàm tính toán token.`,
      overrideNote: ''
    },
    {
      id: 2,
      team: 'Group 1',
      repo: 'https://github.com/student-team/group1.git',
      commit: 'a12b3c4d5e',
      status: 'Passed (10/10)',
      statusColor: 'var(--accent-success)',
      grade: 9.0,
      aiScore: 'A-',
      time: '2026-09-27 09:30',
      sandboxOutput: `[Docker Runner] All 10 test cases passed. Execution time: 240ms.`,
      aiFeedback: `🤖 Phân tích AI: Code sạch, tách biệt module tốt. Các hàm xử lý lỗi rõ ràng.`,
      overrideNote: ''
    },
    {
      id: 3,
      team: 'Group 3',
      repo: 'https://github.com/student-team/group3.git',
      commit: 'e5f6g7h8i9',
      status: 'Passed (9/10)',
      statusColor: 'var(--accent-success)',
      grade: 8.5,
      aiScore: 'B+',
      time: '2026-09-26 21:00',
      sandboxOutput: `[Docker Runner] 9/10 test cases passed. 1 test case exceeded timeout threshold (150ms).`,
      aiFeedback: `🤖 Phân tích AI: Có vòng lặp lồng O(N^2) ở module tính ma trận, cần tối ưu sang Two Pointers.`,
      overrideNote: ''
    },
    {
      id: 4,
      team: 'Group 2',
      repo: 'https://github.com/student-team/group2.git',
      commit: '9988776655',
      status: 'Failed (3/10)',
      statusColor: 'var(--accent-error)',
      grade: 3.5,
      aiScore: 'C',
      time: '2026-09-26 18:45',
      sandboxOutput: `[Docker Runner] Lỗi biên dịch TypeScript: Cannot find module '../config/db'. 7/10 test cases failed.`,
      aiFeedback: `🤖 Phân tích AI: Code thiếu file config kết nối database dẫn tới crash container.`,
      overrideNote: ''
    },
  ]);

  // Modal chấm bài / xem chi tiết
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [editingGrade, setEditingGrade] = useState<number>(0);
  const [editingNote, setEditingNote] = useState<string>('');
  const [isRegrading, setIsRegrading] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  // Helper để lấy token hoặc tự động cấp token hợp lệ
  const getToken = async (): Promise<string> => {
    let token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      try {
        const u = localStorage.getItem('user');
        const userObj = u ? JSON.parse(u) : null;
        const email = userObj?.email || 'giangnv@fe.edu.vn';
        const loginRes = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName: userObj?.fullName || 'Dr. Nguyen Van Giang', role: 'LECTURER' })
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

  // Fetch real database records from Backend
  const fetchData = async () => {
    try {
      setLoadingData(true);
      const token = await getToken();
      const authHeader: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Fetch courses
      const courseRes = await fetch('http://localhost:5000/api/courses', {
        headers: { ...authHeader }
      });
      if (courseRes.ok) {
        const cData = await courseRes.json();
        if (cData.courses) {
          setCourses(cData.courses);
          if (cData.courses.length > 0 && !teamCourseId) {
            setTeamCourseId(cData.courses[0].course_id);
          }
        }
      }

      // 2. Fetch teams
      const teamRes = await fetch('http://localhost:5000/api/teams', {
        headers: { ...authHeader }
      });
      if (teamRes.ok) {
        const tData = await teamRes.json();
        if (tData.teams) {
          setTeams(tData.teams);
        }
      }

      // 3. Fetch students
      const studentRes = await fetch('http://localhost:5000/api/auth/users?role=STUDENT', {
        headers: { ...authHeader }
      });
      if (studentRes.ok) {
        const sData = await studentRes.json();
        if (sData.users) {
          setStudents(sData.users);
          if (sData.users.length > 0 && !assignUserId) {
            setAssignUserId(sData.users[0].user_id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching live database records:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        setCurrentUser(JSON.parse(u));
      }
    } catch (e) {}
    fetchData();
  }, []);

  // Handler: Tạo Học phần mới
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!courseCode.trim() || !courseName.trim() || !courseSemester.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập đầy đủ thông tin học phần!' : 'Please fill in all course fields!');
      return;
    }
    setSubmittingCourse(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_code: courseCode.trim().toUpperCase(),
          course_name: courseName.trim(),
          semester: courseSemester.trim().toUpperCase(),
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Tạo học phần ${courseCode.toUpperCase()} thành công!` : `Course ${courseCode.toUpperCase()} created successfully!`);
        setShowCourseModal(false);
        setCourseCode('');
        setCourseName('');
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi tạo học phần');
      }
    } catch (err) {
      console.error(err);
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  // Handler: Tạo Nhóm sinh viên mới
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!teamName.trim() || !teamCourseId || !teamRepoUrl.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập đầy đủ tên nhóm, học phần và đường dẫn GitHub!' : 'Please fill in team name, course, and repo URL!');
      return;
    }
    setSubmittingTeam(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_name: teamName.trim(),
          course_id: Number(teamCourseId),
          repo_url: teamRepoUrl.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Tạo nhóm "${teamName}" thành công!` : `Team "${teamName}" created successfully!`);
        setShowTeamModal(false);
        setTeamName('');
        setTeamRepoUrl('');
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi tạo nhóm');
      }
    } catch (err) {
      console.error(err);
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingTeam(false);
    }
  };

  // Handler: Gán Sinh viên & Phân công Module
  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!targetTeam || !assignUserId || !assignModule.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng chọn sinh viên và nhập phân hệ module phụ trách!' : 'Please select a student and enter module responsibility!');
      return;
    }
    setSubmittingAssign(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/teams/${targetTeam.team_id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: Number(assignUserId),
          assigned_module: assignModule.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Đã phân công sinh viên vào nhóm ${targetTeam.team_name}!` : `Student assigned to ${targetTeam.team_name}!`);
        setShowAssignModal(false);
        setAssignModule('');
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi gán sinh viên vào nhóm');
      }
    } catch (err) {
      console.error(err);
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handler: Tạo Assignment mới
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!assignmentTitle.trim() || !assignmentDeadline || !assignmentCourseId) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập đầy đủ tiêu đề, học phần và hạn nộp!' : 'Please fill in title, course, and deadline!');
      return;
    }
    setSubmittingAssignment(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          course_id: Number(assignmentCourseId),
          title: assignmentTitle.trim(),
          description: assignmentDesc.trim(),
          deadline: new Date(assignmentDeadline).toISOString(),
          max_score: parseFloat(assignmentMaxScore) || 10.0,
          rubrics: []
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Tạo bài tập "${assignmentTitle}" thành công!` : `Assignment "${assignmentTitle}" created!`);
        setShowAssignmentModal(false);
        setAssignmentTitle('');
        setAssignmentDesc('');
        setAssignmentDeadline('');
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi tạo bài tập');
      }
    } catch (err) {
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const openGradingModal = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setEditingGrade(sub.grade);
    setEditingNote(sub.overrideNote || '');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          grade: Number(editingGrade),
          overrideNote: editingNote,
          status: editingGrade >= 5 ? 'Passed (Graded)' : 'Failed (Graded)',
          statusColor: editingGrade >= 5 ? 'var(--accent-success)' : 'var(--accent-error)'
        };
      }
      return s;
    }));

    setSuccessToast(lang === 'vi' ? 'Đã lưu điểm và nhận xét của giảng viên thành công!' : 'Grade override saved successfully!');
    setSelectedSub(null);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleRerunGrading = () => {
    if (!selectedSub) return;
    setIsRegrading(true);
    setTimeout(() => {
      setIsRegrading(false);
      setSubmissions(prev => prev.map(s => {
        if (s.id === selectedSub.id) {
          return {
            ...s,
            status: 'Passed (10/10)',
            statusColor: 'var(--accent-success)',
            grade: 9.8,
            aiScore: 'A+',
            sandboxOutput: `[Docker Runner v2.4] RE-EVALUATION COMPLETE\nAll 10 rubric test cases executed successfully.\nExit Code: 0 (PASSED)\nExecution Time: 138ms.`
          };
        }
        return s;
      }));
      setSuccessToast(lang === 'vi' ? 'Đã kích hoạt lại Docker Sandbox và AI chấm bài thành công!' : 'Docker Sandbox re-grading completed!');
      setSelectedSub(null);
      setTimeout(() => setSuccessToast(''), 3500);
    }, 1500);
  };

  return (
    <>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Toast thông báo */}
        {successToast && (
          <div style={{
            position: 'fixed',
            top: '85px',
            right: '25px',
            zIndex: 100,
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            <Check size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Header Profile Bar */}
        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-success">{lang === 'vi' ? 'Giảng viên' : 'Lecturer'}</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {currentUser?.fullName || (lang === 'vi' ? 'TS. Nguyễn Văn Giảng Viên' : 'Dr. Nguyen Van GiaoVien')}
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                ({currentUser?.email || 'lecturer@fe.edu.vn'})
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {lang === 'vi' ? 'Quản lý học phần:' : 'Managing Course:'} <strong style={{ color: '#fff' }}>SWD392 - Software Architecture &amp; Design</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowCourseModal(true)}>
              <BookOpen size={16} /> {lang === 'vi' ? 'Thêm Học Phần' : 'New Course'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => { if(courses.length > 0) setAssignmentCourseId(courses[0].course_id); setShowAssignmentModal(true); }}>
              <Plus size={16} /> {lang === 'vi' ? 'Thêm Bài Tập' : 'New Assignment'}
            </button>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowTeamModal(true)}>
              <Plus size={16} /> {lang === 'vi' ? 'Tạo Nhóm Mới' : 'New Team'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => alert(lang === 'vi' ? 'Đã xuất file điểm CSV thành công!' : 'Grades exported successfully!')}>
              <Download size={16} /> {lang === 'vi' ? 'Xuất CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Users size={16} /> {lang === 'vi' ? 'Quản lý bài nộp & Chấm điểm' : 'Submissions & Grading'}
          </button>
          <button 
            onClick={() => setActiveTab('teams')}
            className={activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <FolderOpen size={16} /> {lang === 'vi' ? 'Quản lý nhóm (Teams)' : 'Team Management'}
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <Settings size={16} /> {lang === 'vi' ? 'Cấu hình Rubric & Test Cases' : 'Rubric & Test Cases'}
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <GitBranch size={16} /> {lang === 'vi' ? 'Radar phát hiện Free-Rider' : 'Git Free-Rider Radar'}
          </button>
          <button 
            onClick={() => setActiveTab('peer')}
            className={activeTab === 'peer' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
          >
            <ShieldCheck size={16} /> {lang === 'vi' ? 'Tổng kết Đánh giá chéo' : 'Peer Audit Summary'}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & CHẤM ĐIỂM (F10) */}
        {activeTab === 'overview' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {lang === 'vi' ? 'Danh sách bài nộp đồ án: Milestone 1' : 'Recent Submissions: Milestone 1'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Giảng viên theo dõi trạng thái chấm tự động Docker Sandbox, AI đánh giá và có thể chấm ghi đè trực tiếp.' : 'Monitor automated sandbox execution, AI code reviews, and perform manual score overrides.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder={lang === 'vi' ? 'Tìm nhóm hoặc sinh viên...' : 'Search team...'} style={{ padding: '8px 10px 8px 32px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }} />
                </div>
                <button className="btn-secondary" style={{ padding: '8px 12px' }}><Filter size={16} /> {lang === 'vi' ? 'Lọc' : 'Filter'}</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Nhóm' : 'Team'}</th>
                    <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Kho lưu trữ Git' : 'Repository'}</th>
                    <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Docker Sandbox' : 'Sandbox Status'}</th>
                    <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Điểm số (Thang 10)' : 'Grade (10)'}</th>
                    <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Xếp hạng AI' : 'AI Quality'}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>{lang === 'vi' ? 'Hành động' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px' }}>
                        <strong>{row.team}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.time}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <a href={row.repo} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LinkIcon size={13} /> {row.repo.replace('https://github.com/', '')}
                        </a>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SHA: {row.commit}</code>
                      </td>
                      <td style={{ padding: '16px', color: row.statusColor }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {row.status.includes('Passed') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                          {row.status}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700, color: row.grade >= 8 ? '#34d399' : (row.grade >= 5 ? '#f59e0b' : '#f43f5e') }}>
                        {row.grade.toFixed(1)} / 10
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>{row.aiScore}</span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => openGradingModal(row)}
                          className="btn-primary" 
                          style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
                        >
                          <Edit3 size={14} /> {lang === 'vi' ? 'Chấm bài & Chi tiết' : 'Review & Grade'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL CHẤM BÀI / XEM CHI TIẾT (UC-10) */}
        {selectedSub && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}>
              {/* Header Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <span className="badge badge-info" style={{ marginBottom: '6px' }}>{selectedSub.team}</span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                    {lang === 'vi' ? 'Hội đồng Chấm Điểm & Phân Tích Bài Nộp' : 'Submission Evaluation & Grading'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Git Commit: <code>{selectedSub.commit}</code> • {selectedSub.time}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSub(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Docker Sandbox Execution Output */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  <Terminal size={16} color="#60a5fa" />
                  {lang === 'vi' ? 'Nhật ký thực thi Docker Sandbox (Isolated Container):' : 'Docker Sandbox Output Logs:'}
                </label>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: '#93c5fd',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}>
                  {selectedSub.sandboxOutput}
                </pre>
              </div>

              {/* AI Feedback */}
              <div style={{ marginBottom: '1.4rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Sparkles size={16} /> {lang === 'vi' ? 'Đánh giá tự động từ AI (Gemini / OpenAI):' : 'AI Qualitative Review:'}
                </span>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {selectedSub.aiFeedback}
                </p>
              </div>

              {/* Form Ghi đè điểm của Giảng viên (Manual Score Override - UC-10 ALT-1) */}
              <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Điểm số giảng viên chấm (0 - 10):' : 'Instructor Score (0 - 10):'}
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={editingGrade}
                      onChange={e => setEditingGrade(parseFloat(e.target.value) || 0)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Nhận xét ghi chú của giảng viên:' : 'Instructor Feedback / Note:'}
                    </label>
                    <input 
                      type="text"
                      placeholder={lang === 'vi' ? 'Nhập nhận xét gửi sinh viên...' : 'Enter feedback for student...'}
                      value={editingNote}
                      onChange={e => setEditingNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Nút hành động */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button 
                    type="button"
                    disabled={isRegrading}
                    onClick={handleRerunGrading}
                    className="btn-secondary"
                    style={{ gap: '8px', fontSize: '0.85rem' }}
                  >
                    {isRegrading ? <Loader2 size={16} className="animate-spin" /> : <RotateCw size={16} />}
                    <span>{lang === 'vi' ? 'Chạy lại Docker Sandbox' : 'Re-run Sandbox Grading'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedSub(null)}
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {lang === 'vi' ? 'Đóng' : 'Cancel'}
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      style={{ fontSize: '0.85rem', gap: '6px' }}
                    >
                      <Check size={16} />
                      <span>{lang === 'vi' ? 'Lưu điểm đã chấm' : 'Save Grade'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 0: TEAM MANAGEMENT (F09) */}
        {activeTab === 'teams' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {lang === 'vi' ? 'Quản lý Nhóm Sinh viên & Phân công Module' : 'Teams & Module Allocation'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Dữ liệu trực tiếp từ PostgreSQL (`teams` và `team_members`). Phân công module cụ thể cho từng sinh viên để chống Free-Rider.' : 'Live records from PostgreSQL. Assign module responsibilities to prevent free-riding.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => setShowCourseModal(true)}>
                  <BookOpen size={15} /> {lang === 'vi' ? '+ Học Phần' : '+ Course'}
                </button>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowTeamModal(true)}>
                  <Plus size={16} /> {lang === 'vi' ? 'Tạo Nhóm Mới' : 'Create New Team'}
                </button>
              </div>
            </div>

            {loadingData && teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <p>{lang === 'vi' ? 'Đang tải danh sách nhóm từ cơ sở dữ liệu...' : 'Loading teams from PostgreSQL...'}</p>
              </div>
            ) : teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                  {lang === 'vi' ? 'Chưa có nhóm nào được tạo' : 'No teams created yet'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                  {lang === 'vi' ? 'Bắt đầu bằng cách tạo nhóm sinh viên đầu tiên cho học phần của bạn.' : 'Get started by creating the first team for your course.'}
                </p>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={() => setShowTeamModal(true)}>
                  <Plus size={16} /> {lang === 'vi' ? 'Tạo Nhóm Ngay' : 'Create Team Now'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {teams.map((team) => (
                  <div key={team.team_id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{team.course_code || 'SWD392'}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{team.semester || 'FA26'}</span>
                        </div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{team.team_name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#34d399' }}>
                          ● {team.members?.length || 0} {lang === 'vi' ? 'Thành viên' : 'Members'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Git Repository URL:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          readOnly 
                          value={team.repo_url} 
                          style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.82rem' }} 
                        />
                        <a 
                          href={team.repo_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-secondary" 
                          style={{ padding: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center' }}
                        >
                          <LinkIcon size={14} color="#60a5fa" />
                        </a>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {lang === 'vi' ? 'Thành viên & Phân hệ module phụ trách:' : 'Members & Assigned Modules:'}
                      </label>
                      {team.members && team.members.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {team.members.map((m) => (
                            <li key={m.team_member_id || m.user_id} style={{ fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div>
                                <strong style={{ color: '#f8fafc' }}>{m.full_name}</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</span>
                              </div>
                              <span className="badge badge-info" style={{ fontSize: '0.72rem', maxWidth: '180px', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {m.assigned_module}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                          {lang === 'vi' ? 'Chưa có sinh viên nào. Hãy gán thành viên bằng nút bên dưới.' : 'No students assigned yet. Click button below to assign.'}
                        </p>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        setTargetTeam(team);
                        setShowAssignModal(true);
                        if (students.length > 0 && !assignUserId) setAssignUserId(students[0].user_id);
                      }}
                      className="btn-secondary" 
                      style={{ width: '100%', marginTop: '1.2rem', justifyContent: 'center', fontSize: '0.85rem', borderStyle: 'dashed' }}
                    >
                      <Plus size={14} /> {lang === 'vi' ? 'Gán sinh viên & Phân hệ module' : 'Assign Student & Module'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIG RUBRICS & TEST CASES (F07 & F08) */}
        {activeTab === 'config' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                {lang === 'vi' ? 'Cấu hình bài tập & Docker Sandbox' : 'Create / Edit Assignment'}
              </h3>
              <form onSubmit={e => { e.preventDefault(); alert(lang === 'vi' ? 'Đã lưu cấu hình bài tập!' : 'Assignment saved!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tiêu đề bài tập (*)' : 'Assignment Title (*)'}
                  </label>
                  <input type="text" defaultValue="Milestone 1: Backend API & Auth" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Dockerfile môi trường Sandbox chấm tự động' : 'Docker Sandbox Environment (Dockerfile)'}
                  </label>
                  <textarea rows={4} defaultValue={'FROM node:18-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install\nCMD ["npm", "test"]'} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Ràng buộc đánh giá' : 'Evaluation Constraints'}
                  </label>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><input type="checkbox" defaultChecked /> Timeout 2000ms</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><input type="checkbox" defaultChecked /> AI Architecture Review</label>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px', justifyContent: 'center' }}>
                  {lang === 'vi' ? 'Lưu cấu hình bài tập' : 'Save Assignment Configurations'}
                </button>
              </form>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {lang === 'vi' ? 'Bộ Test Cases & Rubric' : 'Test Cases & Rubric'}
                </h3>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  + {lang === 'vi' ? 'Thêm Test Case' : 'Add Test Case'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>TC1: Valid Authentication (3.0 pts)</strong>
                    <span className="badge badge-info">{lang === 'vi' ? 'Công khai cho SV' : 'Visible to Student'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Input: POST /login {`{ email, password }`} | Expected: 200 OK + JWT</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px dashed #f43f5e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>TC2: SQL Injection &amp; Rate-Limit Test (3.0 pts)</strong>
                    <span className="badge badge-error">{lang === 'vi' ? 'Ẩn (Hidden Test)' : 'Hidden Test Case'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Input: username: ' OR 1=1 -- | Expected: 401 Unauthorized (Chống rò rỉ)</div>
                </div>

                <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#c084fc' }}>TC3: AI Clean Architecture Review (4.0 pts)</strong>
                    <span className="badge badge-success">AI Socratic Evaluator</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phân tích AST, mô hình 3 lớp, chống hardcoded secrets</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GIT ANALYTICS & FREE-RIDER RADAR (F11) */}
        {activeTab === 'analytics' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#f43f5e" /> {lang === 'vi' ? 'Radar phát hiện Free-Rider (Anti Free-Riding Analytics)' : 'Free-Rider Detection Radar'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {lang === 'vi' 
                ? 'Hệ thống tự động đồng bộ Git log từ repository GitHub của các nhóm, tính toán dòng code (LOC) và số lượt Commit. Thành viên có đóng góp < 15% so với mức trung bình của nhóm sẽ được gắn cảnh báo Free-Rider.'
                : 'The system automatically scans GitHub repositories, aggregating Lines of Code (LOC) and Commit Counts. Members with < 15% contribution relative to their team average are flagged.'}
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Sinh viên' : 'Student Name'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Nhóm' : 'Team'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Lượt Commits' : 'Commits'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Số dòng thêm/xóa (LOC)' : 'LOC Added/Deleted'}</th>
                  <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Trạng thái đánh giá' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(244, 63, 94, 0.05)' }}>
                  <td style={{ padding: '16px' }}><strong>Hoang E</strong> (QE190149)</td>
                  <td style={{ padding: '16px' }}>Group 4</td>
                  <td style={{ padding: '16px' }}>2</td>
                  <td style={{ padding: '16px' }}><span style={{ color: '#34d399' }}>+120</span> / <span style={{ color: '#f43f5e' }}>-10</span></td>
                  <td style={{ padding: '16px' }}><span className="badge badge-error">⚠️ {lang === 'vi' ? 'Cảnh báo Free-Rider (<15%)' : 'Free-Rider Warning'}</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}><strong>Nguyen B</strong> (QE180099)</td>
                  <td style={{ padding: '16px' }}>Group 2</td>
                  <td style={{ padding: '16px' }}>5</td>
                  <td style={{ padding: '16px' }}><span style={{ color: '#34d399' }}>+450</span> / <span style={{ color: '#f43f5e' }}>-230</span></td>
                  <td style={{ padding: '16px' }}><span className="badge badge-info">{lang === 'vi' ? 'Đóng góp trung bình' : 'Medium Activity'}</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}><strong>Le Nguyen Anh Mai</strong> (QE190151)</td>
                  <td style={{ padding: '16px' }}>Group 4</td>
                  <td style={{ padding: '16px' }}>42</td>
                  <td style={{ padding: '16px' }}><span style={{ color: '#34d399' }}>+1,245</span> / <span style={{ color: '#f43f5e' }}>-400</span></td>
                  <td style={{ padding: '16px' }}><span className="badge badge-success">⭐ {lang === 'vi' ? 'Đóng góp xuất sắc (Top 1)' : 'Top Contributor'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: PEER AUDIT SUMMARY (F12) */}
        {activeTab === 'peer' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#34d399" /> {lang === 'vi' ? 'Báo cáo Đánh giá chéo sinh viên (Peer Audit Round 1)' : 'Peer Audit Summary (Round 1)'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Group 4 Card */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>Group 4 (AITA)</strong>
                  <span className="badge badge-success">100% {lang === 'vi' ? 'Đã hoàn thành' : 'Submitted'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Le Nguyen Anh Mai</span>
                    <strong style={{ color: '#34d399' }}>9.8 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Nguyen Tuong Vy</span>
                    <strong style={{ color: '#34d399' }}>9.2 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Nguyen Quoc Thanh Phong</span>
                    <strong style={{ color: '#34d399' }}>8.9 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Do Tran Dang Khoa</span>
                    <strong style={{ color: '#34d399' }}>8.8 / 10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Dinh Gia Huy</span>
                    <strong style={{ color: '#f43f5e' }}>4.2 / 10</strong>
                  </div>
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} onClick={() => alert('Chi tiết nhận xét: Mai và Vy làm việc tích cực, Huy ít tham gia họp nhóm.')}>
                  {lang === 'vi' ? 'Xem chi tiết nhận xét bí mật' : 'View Confidential Comments'}
                </button>
              </div>

              {/* Group 2 Card */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>Group 2</strong>
                  <span className="badge badge-error">3/5 {lang === 'vi' ? 'Đã nộp' : 'Submitted'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', opacity: 0.7 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Đang chờ các thành viên còn lại hoàn tất đánh giá trước khi tính điểm trung bình.' : 'Waiting for all members to complete evaluation before calculating final score.'}
                  </p>
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} onClick={() => alert(lang === 'vi' ? 'Đã gửi email nhắc nhở tới sinh viên chưa nộp!' : 'Reminder email sent!')}>
                  {lang === 'vi' ? 'Gửi email nhắc nhở nộp' : 'Send Reminder Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: TẠO HỌC PHẦN MỚI (CREATE COURSE) */}
        {showCourseModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {lang === 'vi' ? 'Tạo Học Phần Mới' : 'Create New Course'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Thêm môn học mới vào hệ thống PostgreSQL' : 'Add course to PostgreSQL database'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowCourseModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mã môn học (Course Code):' : 'Course Code:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SWD392, PRJ301, EXE201"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên môn học (Course Name):' : 'Course Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Software Architecture & Design Project"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Học kỳ (Semester):' : 'Semester:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: FA26, SP26, SU26"
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button type="button" onClick={() => setShowCourseModal(false)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingCourse} className="btn-primary" style={{ fontSize: '0.85rem', gap: '8px' }}>
                    {submittingCourse ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{lang === 'vi' ? 'Lưu Học Phần' : 'Save Course'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: TẠO NHÓM SINH VIÊN MỚI (CREATE TEAM) */}
        {showTeamModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {lang === 'vi' ? 'Tạo Nhóm Sinh Viên Mới' : 'Create New Student Team'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Khởi tạo nhóm đồ án và liên kết kho lưu trữ GitHub' : 'Register project team and link GitHub repository'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowTeamModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên nhóm đồ án:' : 'Team Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Group 4 - AITA Intelligent"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Chọn học phần áp dụng:' : 'Select Course:'}
                  </label>
                  <select
                    value={teamCourseId}
                    onChange={(e) => setTeamCourseId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  >
                    {courses.map((c) => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code} - {c.course_name} ({c.semester})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Đường dẫn GitHub Repository URL:' : 'GitHub Repository URL:'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/organization/repo.git"
                      value={teamRepoUrl}
                      onChange={(e) => setTeamRepoUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-color)',
                        color: '#60a5fa',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button type="button" onClick={() => setShowTeamModal(false)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingTeam} className="btn-primary" style={{ fontSize: '0.85rem', gap: '8px' }}>
                    {submittingTeam ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{lang === 'vi' ? 'Tạo Nhóm' : 'Create Team'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: GÁN SINH VIÊN & PHÂN CÔNG MODULE (ASSIGN STUDENT) */}
        {showAssignModal && targetTeam && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {lang === 'vi' ? `Gán Sinh Viên vào ${targetTeam.team_name}` : `Assign Student to ${targetTeam.team_name}`}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Chỉ định phân hệ module phụ trách để hệ thống chấm điểm và chống Free-Rider' : 'Designate assigned module responsibility for anti-freerider analytics'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAssignModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAssignMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Chọn sinh viên:' : 'Select Student:'}
                  </label>
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  >
                    {students.map((st) => (
                      <option key={st.user_id} value={st.user_id}>
                        {st.full_name} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Phân hệ / Module phân công phụ trách:' : 'Assigned Module Responsibility:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Software Architecture & Core Auth"
                    value={assignModule}
                    onChange={(e) => setAssignModule(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      marginBottom: '8px'
                    }}
                  />

                  {/* Gợi ý phân hệ nhanh */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      {lang === 'vi' ? 'Gợi ý nhanh:' : 'Quick tags:'}
                    </span>
                    {[
                      'Software Architecture & Core Auth',
                      'Docker Sandbox Runner',
                      'AI Tutor & Prompt Engineering',
                      'Git Analytics & Free-Rider Radar',
                      'Rubric & Test Cases Engine',
                      'Peer Audit & Review System'
                    ].map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setAssignModule(mod)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          color: '#93c5fd',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingAssign} className="btn-primary" style={{ fontSize: '0.85rem', gap: '8px' }}>
                    {submittingAssign ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{lang === 'vi' ? 'Xác Nhận Phân Công' : 'Confirm Assignment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: TẠO BÀI TẬP MỚI (CREATE ASSIGNMENT) */}
        {showAssignmentModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200, padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%', maxWidth: '580px',
              padding: '2rem', borderRadius: '20px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
                    <Plus size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#c084fc' }} />
                    {lang === 'vi' ? 'Tạo Bài Tập / Đồ Án Mới' : 'Create New Assignment'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Thêm bài tập mới vào hệ thống cho sinh viên nộp bài' : 'Create an assignment that students can submit to'}
                  </p>
                </div>
                <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> {modalError}
                </div>
              )}

              <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Học phần liên kết:' : 'Course:'}
                  </label>
                  <select
                    value={assignmentCourseId}
                    onChange={(e) => setAssignmentCourseId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                  >
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tiêu đề bài tập (*)' : 'Assignment Title (*)'}
                  </label>
                  <input
                    type="text" required
                    placeholder={lang === 'vi' ? 'VD: Milestone 2: Docker Sandbox & Grading Queue' : 'e.g.: Milestone 2: Docker Sandbox Integration'}
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mô tả yêu cầu:' : 'Description:'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={lang === 'vi' ? 'Mô tả chi tiết yêu cầu bài tập...' : 'Describe the assignment requirements...'}
                    value={assignmentDesc}
                    onChange={(e) => setAssignmentDesc(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Hạn nộp bài (*)' : 'Deadline (*)'}
                    </label>
                    <input
                      type="datetime-local" required
                      value={assignmentDeadline}
                      onChange={(e) => setAssignmentDeadline(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Điểm tối đa:' : 'Max Score:'}
                    </label>
                    <input
                      type="number" min="1" max="100"
                      value={assignmentMaxScore}
                      onChange={(e) => setAssignmentMaxScore(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button type="button" onClick={() => setShowAssignmentModal(false)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingAssignment} className="btn-primary" style={{ fontSize: '0.85rem', gap: '8px' }}>
                    {submittingAssignment ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{lang === 'vi' ? 'Tạo Bài Tập' : 'Create Assignment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
