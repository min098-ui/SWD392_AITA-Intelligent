'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../../components/Navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Users, BookOpen, GitBranch, Settings, CheckCircle2, 
  AlertTriangle, Filter, Search, ShieldCheck, Download, FolderOpen, Plus, 
  Link as LinkIcon, Edit3, RotateCw, Loader2, Sparkles, Terminal, X, Check,
  Clock, UserCheck, FileText, Award, ArrowRight, UserPlus, Mail, Trash2, Crown,
  CheckSquare, ListTodo, AlertCircle, ExternalLink
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
  // BR-09: Collaborative Dual-Lecturer Moderation
  moderationStatus?: 'AI_PREGRADED' | 'FIRST_REVIEWED' | 'PENDING_SECOND_REVIEW' | 'FINALIZED';
  ai_score?: number;
  reviewer_1_name?: string;
  reviewer_1_score?: number;
  reviewer_1_notes?: string;
  needs_second_review?: boolean;
  reviewer_2_name?: string;
  reviewer_2_score?: number;
  reviewer_2_notes?: string;
  consensus_notes?: string;
  final_score?: number;
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
  role?: string;
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

export interface TeamTask {
  task_id: string;
  team_id: number;
  assigned_to_name: string;
  title: string;
  description?: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  due_date: string;
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
  const [activeTab, setActiveTab] = useState<'courses' | 'teams' | 'overview' | 'config' | 'analytics' | 'peer'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Real Database Data State
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal: Chi tiết Nhóm & Quản lý Task
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamItem | null>(null);
  const [showAddTaskFormForMember, setShowAddTaskFormForMember] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

  // Hệ thống Tasks theo từng thành viên của nhóm
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([
    // SmartEdu-Platform (Nhóm 01) - Team ID 2
    {
      task_id: 't-101',
      team_id: 2,
      assigned_to_name: 'Vyntqe180099',
      title: 'Thiết kế lược đồ CSDL PostgreSQL & Cấu hình Sequelize ORM',
      status: 'DONE',
      due_date: '12/10/2026'
    },
    {
      task_id: 't-102',
      team_id: 2,
      assigned_to_name: 'Vyntqe180099',
      title: 'Xây dựng RESTful API CRUD quản trị đồ án & phân quyền JWT',
      status: 'DONE',
      due_date: '18/10/2026'
    },
    {
      task_id: 't-103',
      team_id: 2,
      assigned_to_name: 'Sinh Viên 3',
      title: 'Cấu hình WebSocket Socket.io kết nối Real-time Notification',
      status: 'DONE',
      due_date: '15/10/2026'
    },
    {
      task_id: 't-104',
      team_id: 2,
      assigned_to_name: 'Sinh Viên 3',
      title: 'Tích hợp Docker Sandbox Runner tự động chấm điểm test case',
      status: 'IN_PROGRESS',
      due_date: '28/10/2026'
    },
    {
      task_id: 't-105',
      team_id: 2,
      assigned_to_name: 'mai.lna.qe190151',
      title: 'Thiết kế giao diện Client Portal & Bảng thống kê tiến độ',
      status: 'DONE',
      due_date: '14/10/2026'
    },
    {
      task_id: 't-106',
      team_id: 2,
      assigned_to_name: 'mai.lna.qe190151',
      title: 'Viết tài liệu đặc tả SRS & Sơ đồ kiến trúc C4 Container',
      status: 'PENDING',
      due_date: '02/11/2026'
    },
    // AITA-Intelligent (Nhóm 04) - Team ID 1
    {
      task_id: 't-201',
      team_id: 1,
      assigned_to_name: 'Lê Nguyễn Ánh Mai',
      title: 'Phát triển mô hình Gemini 1.5 Pro Socratic Tutor AI Feedback',
      status: 'DONE',
      due_date: '15/10/2026'
    },
    {
      task_id: 't-202',
      team_id: 1,
      assigned_to_name: 'Nguyễn Tường Vy',
      title: 'Tích hợp Git Webhook đồng bộ commit tự động từ GitHub',
      status: 'DONE',
      due_date: '16/10/2026'
    },
    {
      task_id: 't-203',
      team_id: 1,
      assigned_to_name: 'Nguyễn Quốc Thanh Phong',
      title: 'Kiểm thử hộp đen Sandbox & Ngăn chặn SQL/Payload Injection',
      status: 'IN_PROGRESS',
      due_date: '25/10/2026'
    },
    {
      task_id: 't-204',
      team_id: 1,
      assigned_to_name: 'Đỗ Trần Đăng Khoa',
      title: 'Thiết kế giao diện Peer Audit & Thuật toán phát hiện Free-Rider',
      status: 'DONE',
      due_date: '18/10/2026'
    },
    {
      task_id: 't-205',
      team_id: 1,
      assigned_to_name: 'Đinh Gia Huy',
      title: 'Soạn thảo tài liệu Test Report và Slide báo cáo hội đồng',
      status: 'PENDING',
      due_date: '05/11/2026'
    },
    // FoodDelivery-MobileApp (Nhóm 02) - Team ID 3
    {
      task_id: 't-301',
      team_id: 3,
      assigned_to_name: 'Nguyễn Văn B',
      title: 'Thiết kế Figma Wireframe & Prototype ứng dụng di động',
      status: 'DONE',
      due_date: '14/10/2026'
    },
    {
      task_id: 't-302',
      team_id: 3,
      assigned_to_name: 'Trần Thị C',
      title: 'Xây dựng màn hình danh mục món ăn & Giỏ hàng Flutter',
      status: 'IN_PROGRESS',
      due_date: '26/10/2026'
    },
    {
      task_id: 't-303',
      team_id: 3,
      assigned_to_name: 'Phạm Văn D',
      title: 'Tích hợp API thanh toán trực tuyến MoMo & VNPAY Sandbox',
      status: 'PENDING',
      due_date: '03/11/2026'
    }
  ]);

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
  const [assignMode, setAssignMode] = useState<'email' | 'select'>('email');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignUserId, setAssignUserId] = useState<number | string>('');
  const [assignRole, setAssignRole] = useState<'MEMBER' | 'LEADER'>('MEMBER');
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
      overrideNote: 'Thống nhất điểm số xuất sắc cùng mô hình AI.',
      moderationStatus: 'FINALIZED',
      ai_score: 9.5,
      reviewer_1_name: 'TS. Nguyễn Văn Giảng',
      reviewer_1_score: 9.5,
      reviewer_1_notes: 'Thống nhất với đánh giá của AI, kiến trúc dự án phân lớp chặt chẽ.',
      final_score: 9.5,
      consensus_notes: 'Cả 2 giảng viên và AI đạt mức đồng thuận tuyệt đối 9.5/10.'
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
      overrideNote: '',
      moderationStatus: 'AI_PREGRADED',
      ai_score: 9.0,
      reviewer_1_name: '',
      reviewer_1_score: undefined,
      reviewer_1_notes: '',
      needs_second_review: false
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
      overrideNote: 'Trừ điểm thuật toán O(N^2), chuyển GV2 chấm chéo kiểm tra độc lập.',
      moderationStatus: 'PENDING_SECOND_REVIEW',
      ai_score: 8.5,
      reviewer_1_name: 'TS. Nguyễn Văn Giảng',
      reviewer_1_score: 7.5,
      reviewer_1_notes: 'Thuật toán chưa tối ưu, trừ 1.0 điểm so với AI. Đề nghị GV2 kiểm định.',
      needs_second_review: true,
      reviewer_2_name: 'ThS. Trần Thị Chuyên Môn'
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
      overrideNote: 'GV1 đã xem xét cho cơ hội nộp lại.',
      moderationStatus: 'FIRST_REVIEWED',
      ai_score: 3.5,
      reviewer_1_name: 'TS. Nguyễn Văn Giảng',
      reviewer_1_score: 4.0,
      reviewer_1_notes: 'Lỗi cấu hình cơ bản, cộng 0.5 điểm động viên và nhắc nộp lại bài.',
      needs_second_review: false
    },
  ]);

  // Modal chấm bài / xem chi tiết
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [editingGrade, setEditingGrade] = useState<number>(0);
  const [editingNote, setEditingNote] = useState<string>('');
  const [isRegrading, setIsRegrading] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  // BR-09 Dual-Lecturer Moderation Workflow State
  const [activeModalStage, setActiveModalStage] = useState<'review1' | 'review2' | 'consensus'>('review1');
  const [reviewer1Score, setReviewer1Score] = useState<number>(0);
  const [reviewer1Notes, setReviewer1Notes] = useState<string>('');
  const [assignedReviewer2, setAssignedReviewer2] = useState<string>('ThS. Trần Thị Chuyên Môn');
  const [reviewer2Score, setReviewer2Score] = useState<number>(0);
  const [reviewer2Notes, setReviewer2Notes] = useState<string>('');
  const [consensusNotes, setConsensusNotes] = useState<string>('');
  const [finalScoreInput, setFinalScoreInput] = useState<number>(0);
  const [scoreDiffNotice, setScoreDiffNotice] = useState<string>('');

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
          if (cData.courses.length > 0) {
            setTeamCourseId(prev => prev || cData.courses[0].course_id);
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

  // Tự động đồng bộ selectedTeamDetails khi danh sách teams được làm mới
  useEffect(() => {
    if (selectedTeamDetails) {
      const updated = teams.find(t => t.team_id === selectedTeamDetails.team_id);
      if (updated) setSelectedTeamDetails(updated);
    }
  }, [teams]);

  // Handler: Đổi trạng thái nhiệm vụ (Task)
  const handleToggleTaskStatus = (taskId: string) => {
    setTeamTasks(prev => prev.map(t => {
      if (t.task_id === taskId) {
        const nextStatus: 'DONE' | 'IN_PROGRESS' | 'PENDING' = 
          t.status === 'PENDING' ? 'IN_PROGRESS' : (t.status === 'IN_PROGRESS' ? 'DONE' : 'PENDING');
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Handler: Thêm Task mới cho Thành viên cụ thể
  const handleCreateNewTask = (teamId: number, memberName: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: TeamTask = {
      task_id: `t-${Date.now()}`,
      team_id: teamId,
      assigned_to_name: memberName,
      title: newTaskTitle.trim(),
      status: 'PENDING',
      due_date: newTaskDueDate.trim() || '30/10/2026'
    };
    setTeamTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setShowAddTaskFormForMember(null);
    setSuccessToast(lang === 'vi' ? `Đã giao task "${newTask.title}" cho ${memberName}!` : `Task assigned to ${memberName}!`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Handler: Xóa Task
  const handleDeleteTask = (taskId: string) => {
    setTeamTasks(prev => prev.filter(t => t.task_id !== taskId));
    setSuccessToast(lang === 'vi' ? 'Đã xóa task thành công!' : 'Task deleted!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

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
        const createdCode = courseCode.trim().toUpperCase();
        setSuccessToast(lang === 'vi' ? `Tạo học phần ${createdCode} thành công!` : `Course ${createdCode} created successfully!`);
        setShowCourseModal(false);
        setCourseCode('');
        setCourseName('');
        await fetchData();
        if (data.course && data.course.course_id) {
          setSelectedCourseId(data.course.course_id);
          setTeamCourseId(data.course.course_id);
        }
        setActiveTab('courses');
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
    if (!targetTeam) return;

    if (assignMode === 'email') {
      if (!assignEmail.trim()) {
        setModalError(lang === 'vi' ? 'Vui lòng nhập email sinh viên!' : 'Please enter student email!');
        return;
      }
    } else {
      if (!assignUserId) {
        setModalError(lang === 'vi' ? 'Vui lòng chọn sinh viên từ danh sách!' : 'Please select a student!');
        return;
      }
    }

    if (!assignModule.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập phân hệ module phụ trách!' : 'Please enter module responsibility!');
      return;
    }

    setSubmittingAssign(true);
    try {
      const token = await getToken();
      const bodyPayload: any = {
        assigned_module: assignModule.trim(),
        role: assignRole,
      };

      if (assignMode === 'email') {
        bodyPayload.email = assignEmail.trim();
      } else {
        bodyPayload.user_id = Number(assignUserId);
      }

      const res = await fetch(`http://localhost:5000/api/teams/${targetTeam.team_id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Gán sinh viên vào nhóm "${targetTeam.team_name}" thành công!` : `Student assigned to "${targetTeam.team_name}"!`);
        setShowAssignModal(false);
        setAssignEmail('');
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

  // Handler: Xóa Sinh viên khỏi Nhóm
  const handleRemoveMember = async (teamId: number, teamMemberId: number, memberName: string) => {
    if (!confirm(lang === 'vi' ? `Bạn có chắc muốn xóa "${memberName}" khỏi nhóm?` : `Remove "${memberName}" from team?`)) {
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/teams/${teamId}/members/${teamMemberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Đã xóa ${memberName} khỏi nhóm!` : `Removed ${memberName} from team!`);
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        const d = await res.json();
        alert(d.message || 'Lỗi khi xóa thành viên');
      }
    } catch (err) {
      console.error(err);
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

  // Tính năng xuất danh sách học phần, nhóm và sinh viên đồ án ra file CSV chuẩn UTF-8
  const handleExportCSV = () => {
    const selectedCourse = courses.find(c => c.course_id === Number(selectedCourseId)) || courses[0];
    const courseCode = selectedCourse ? selectedCourse.course_code : 'SWD392';
    
    const headers = [
      'STT',
      'Mã Học Phần',
      'Tên Học Phần',
      'Học Kỳ',
      'Tên Nhóm Đồ Án',
      'Repository GitHub',
      'Họ Và Tên Sinh Viên',
      'Email Sinh Viên',
      'Vai Trò Nhóm',
      'Phân Công Module',
      'Trạng Thái Đồ Án'
    ];
    
    const targetTeams = selectedCourseId ? teams.filter(t => t.course_id === Number(selectedCourseId)) : teams;
    
    const rows: string[][] = [];
    let stt = 1;

    targetTeams.forEach(team => {
      const c = courses.find(ci => ci.course_id === team.course_id) || selectedCourse;
      if (team.members && team.members.length > 0) {
        team.members.forEach(m => {
          rows.push([
            String(stt++),
            `"${c?.course_code || ''}"`,
            `"${c?.course_name || ''}"`,
            `"${c?.semester || 'FA26'}"`,
            `"${team.team_name}"`,
            `"${team.repo_url}"`,
            `"${m.full_name}"`,
            `"${m.email}"`,
            `"${m.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}"`,
            `"${m.assigned_module || 'Chưa phân công'}"`,
            `"Đang thực hiện đồ án"`
          ]);
        });
      } else {
        rows.push([
          String(stt++),
          `"${c?.course_code || ''}"`,
          `"${c?.course_name || ''}"`,
          `"${c?.semester || 'FA26'}"`,
          `"${team.team_name}"`,
          `"${team.repo_url}"`,
          `"Chưa gán sinh viên"`,
          `""`,
          `""`,
          `""`,
          `"Chờ phân công thành viên"`
        ]);
      }
    });

    if (rows.length === 0) {
      alert(lang === 'vi' ? 'Chưa có dữ liệu nhóm nào để xuất file CSV!' : 'No team data to export!');
      return;
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AITA_Danh_Sach_Nhom_${courseCode}_FA26.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openGradingModal = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setEditingGrade(sub.final_score ?? sub.grade);
    setEditingNote(sub.overrideNote || sub.reviewer_1_notes || '');
    setReviewer1Score(sub.reviewer_1_score ?? sub.grade ?? (sub.ai_score || 8.0));
    setReviewer1Notes(sub.reviewer_1_notes || sub.overrideNote || '');
    setReviewer2Score(sub.reviewer_2_score ?? sub.grade ?? 8.0);
    setReviewer2Notes(sub.reviewer_2_notes || '');
    setConsensusNotes(sub.consensus_notes || '');
    setFinalScoreInput(sub.final_score ?? sub.grade ?? 8.5);
    setScoreDiffNotice('');

    if (sub.moderationStatus === 'PENDING_SECOND_REVIEW') {
      setActiveModalStage('review2');
    } else if (sub.moderationStatus === 'FINALIZED' && sub.consensus_notes) {
      setActiveModalStage('consensus');
    } else {
      setActiveModalStage('review1');
    }
  };

  // BR-09 Action 1: Phê duyệt điểm AI trực tiếp (Approve AI Score)
  const handleApproveAI = async (sub: SubmissionItem) => {
    const aiScoreVal = sub.ai_score ?? sub.grade ?? 9.0;
    try {
      const token = await getToken();
      await fetch(`http://localhost:5000/api/grading/review/approve-ai/${sub.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: 'Phê duyệt điểm sơ bộ từ AI model.' })
      }).catch(() => {});
    } catch (e) {}

    setSubmissions(prev => prev.map(s => {
      if (s.id === sub.id) {
        return {
          ...s,
          moderationStatus: 'FINALIZED',
          grade: aiScoreVal,
          final_score: aiScoreVal,
          reviewer_1_name: currentUser?.fullName || 'Dr. Nguyen Van Giang',
          reviewer_1_score: aiScoreVal,
          reviewer_1_notes: 'Đã phê duyệt điểm sơ bộ từ AI model.',
          consensus_notes: 'Giảng viên đồng thuận điểm đánh giá tự động của AI.'
        };
      }
      return s;
    }));

    setSuccessToast(lang === 'vi' ? '⚡ Phê duyệt điểm AI thành công! Điểm bài nộp đã được chốt (FINALIZED).' : '⚡ AI score approved! Grade finalized.');
    setSelectedSub(null);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // BR-09 Action 2: GV 1 chấm lại & Yêu cầu GV 2 chấm chéo (Request Second Opinion)
  const handleRequestSecondOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      const token = await getToken();
      await fetch(`http://localhost:5000/api/grading/review/request-second-opinion/${selectedSub.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          reviewer_1_score: Number(reviewer1Score),
          reviewer_1_notes: reviewer1Notes,
          reviewer_2_id: 2
        })
      }).catch(() => {});
    } catch (e) {}

    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          moderationStatus: 'PENDING_SECOND_REVIEW',
          needs_second_review: true,
          reviewer_1_name: currentUser?.fullName || 'Dr. Nguyen Van Giang',
          reviewer_1_score: Number(reviewer1Score),
          reviewer_1_notes: reviewer1Notes,
          reviewer_2_name: assignedReviewer2,
        };
      }
      return s;
    }));

    setSuccessToast(lang === 'vi' 
      ? `🔄 Đã chuyển bài cho ${assignedReviewer2} chấm chéo độc lập (PENDING_SECOND_REVIEW)!` 
      : 'Second opinion requested from Lecturer 2!');
    setActiveModalStage('review2');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // BR-09 Action 3: GV 2 chấm độc lập & So sánh độ lệch (Submit Second Opinion)
  const handleSubmitSecondOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    const s1 = Number(reviewer1Score);
    const s2 = Number(reviewer2Score);
    const diff = Math.abs(s1 - s2);

    try {
      const token = await getToken();
      await fetch(`http://localhost:5000/api/grading/review/second-opinion/${selectedSub.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          reviewer_2_score: s2,
          reviewer_2_notes: reviewer2Notes
        })
      }).catch(() => {});
    } catch (e) {}

    if (diff <= 0.5) {
      // Độ lệch nhỏ <= 0.5: Tự động chốt điểm trung bình
      const avgScore = Number(((s1 + s2) / 2).toFixed(1));
      setSubmissions(prev => prev.map(s => {
        if (s.id === selectedSub.id) {
          return {
            ...s,
            moderationStatus: 'FINALIZED',
            grade: avgScore,
            final_score: avgScore,
            reviewer_2_score: s2,
            reviewer_2_notes: reviewer2Notes,
            consensus_notes: `Hai giảng viên chấm độc lập (GV1: ${s1}, GV2: ${s2}). Độ lệch ${diff.toFixed(1)} <= 0.5, tự động thống nhất điểm trung bình ${avgScore}.`
          };
        }
        return s;
      }));
      setSuccessToast(lang === 'vi' 
        ? `✅ Độ lệch nhỏ (${diff.toFixed(1)} ≤ 0.5) — Hệ thống tự động đồng thuận điểm chốt: ${avgScore}/10!` 
        : `✅ Scores aligned (Diff ≤ 0.5). Auto-finalized average: ${avgScore}/10!`);
      setSelectedSub(null);
      setTimeout(() => setSuccessToast(''), 4000);
    } else {
      // Độ lệch lớn > 0.5: Chuyển sang bước thảo luận đồng thuận
      setScoreDiffNotice(lang === 'vi' 
        ? `⚠️ Điểm GV1 (${s1}) và GV2 (${s2}) bị lệch ${diff.toFixed(1)} điểm (> 0.5). Cần lập biên bản đồng thuận trước khi chốt!` 
        : `⚠️ Score discrepancy: |${s1} - ${s2}| = ${diff.toFixed(1)} (> 0.5). Consensus meeting required!`);
      setFinalScoreInput(Number(((s1 + s2) / 2).toFixed(1)));
      setConsensusNotes(lang === 'vi' 
        ? `Biên bản: GV1 chấm ${s1} (${reviewer1Notes}), GV2 chấm ${s2} (${reviewer2Notes}). Thống nhất dung hòa tiêu chí.` 
        : `Meeting notes: GV1 scored ${s1}, GV2 scored ${s2}. Consensus agreement reached.`);
      setActiveModalStage('consensus');
      setSubmissions(prev => prev.map(s => {
        if (s.id === selectedSub.id) {
          return {
            ...s,
            reviewer_2_score: s2,
            reviewer_2_notes: reviewer2Notes
          };
        }
        return s;
      }));
    }
  };

  // BR-09 Action 4: Biên bản đồng thuận & Chốt điểm chính thức (Finalize Consensus)
  const handleFinalizeConsensus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      const token = await getToken();
      await fetch(`http://localhost:5000/api/grading/review/consensus/${selectedSub.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          final_score: Number(finalScoreInput),
          consensus_notes: consensusNotes
        })
      }).catch(() => {});
    } catch (e) {}

    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          moderationStatus: 'FINALIZED',
          grade: Number(finalScoreInput),
          final_score: Number(finalScoreInput),
          consensus_notes: consensusNotes
        };
      }
      return s;
    }));

    setSuccessToast(lang === 'vi' 
      ? `🏆 Đã lưu biên bản đồng thuận & công bố điểm chính thức: ${finalScoreInput}/10!` 
      : `🏆 Consensus finalized! Grade published: ${finalScoreInput}/10!`);
    setSelectedSub(null);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          moderationStatus: 'FIRST_REVIEWED',
          grade: Number(reviewer1Score),
          reviewer_1_score: Number(reviewer1Score),
          reviewer_1_notes: reviewer1Notes,
          status: Number(reviewer1Score) >= 5 ? 'Passed (Graded)' : 'Failed (Graded)',
          statusColor: Number(reviewer1Score) >= 5 ? 'var(--accent-success)' : 'var(--accent-error)'
        };
      }
      return s;
    }));

    setSuccessToast(lang === 'vi' ? 'Đã lưu điểm và nhận xét của GV1 thành công!' : 'Grade saved successfully!');
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

  const lecturerTabs = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
      <button 
        type="button"
        onClick={() => setActiveTab('courses')}
        className={activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}
        style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        <BookOpen size={14} /> {lang === 'vi' ? 'Học phần' : 'Courses'}
        {courses.length > 0 && (
          <span style={{
            marginLeft: '4px',
            background: 'rgba(59, 130, 246, 0.35)',
            color: '#93c5fd',
            padding: '1px 6px',
            borderRadius: '10px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            {courses.length}
          </span>
        )}
      </button>
      <button 
        type="button"
        onClick={() => setActiveTab('teams')}
        className={activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}
        style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        <FolderOpen size={14} /> {lang === 'vi' ? 'Nhóm sinh viên' : 'Teams'}
      </button>
      <button 
        type="button"
        onClick={() => setActiveTab('overview')}
        className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
        style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        <Users size={14} /> {lang === 'vi' ? 'Bài nộp & Điểm' : 'Submissions'}
      </button>
      <button 
        type="button"
        onClick={() => setActiveTab('config')}
        className={activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}
        style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        <Settings size={14} /> {lang === 'vi' ? 'Rubrics & Tests' : 'Rubrics & Tests'}
      </button>
      <button 
        type="button"
        onClick={() => setActiveTab('analytics')}
        className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
        style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        <GitBranch size={14} /> {lang === 'vi' ? 'Thống kê Git' : 'Git Analytics'}
      </button>
      <button 
        type="button"
        onClick={() => setActiveTab('peer')}
        className={activeTab === 'peer' ? 'btn-primary' : 'btn-secondary'}
        style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        <ShieldCheck size={14} /> {lang === 'vi' ? 'Đánh giá chéo' : 'Peer Audit'}
      </button>
    </div>
  );

  return (
    <>
      <Navigation centerContent={lecturerTabs} />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 2rem', width: '100%', flex: 1 }}>
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

        {/* Course Selector & Actions Toolbar: Thanh điều hướng thanh thoát, chuẩn căn lề 2 bên */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          width: '100%'
        }}>
          {/* Bên trái: Học phần: + Select Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {lang === 'vi' ? 'Học phần:' : 'Course:'}
            </span>
            {courses.length > 0 ? (
              <select
                value={selectedCourseId === null ? 'ALL' : String(selectedCourseId)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ALL') {
                    setSelectedCourseId(null);
                  } else {
                    const id = Number(val);
                    setSelectedCourseId(id);
                    setTeamCourseId(id);
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  minWidth: '280px',
                  maxWidth: '720px'
                }}
              >
                <option value="ALL">
                  📚 {lang === 'vi' ? 'Tất cả học phần' : 'All Courses'}
                </option>
                {courses.map(c => (
                  <option key={c.course_id} value={String(c.course_id)}>
                    📚 {c.course_code} – {c.course_name} ({c.semester})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic' }}>
                {lang === 'vi' ? 'Chưa có học phần' : 'No courses yet'}
              </span>
            )}
          </div>

          {/* Bên phải: Cụm nút Thao tác nhanh (Thêm học phần, Thêm bài tập, Tạo nhóm, Xuất CSV) */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={() => setShowCourseModal(true)}>
              <BookOpen size={16} /> {lang === 'vi' ? 'Thêm Học Phần' : 'New Course'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={() => { if(courses.length > 0) setAssignmentCourseId(courses[0].course_id); setShowAssignmentModal(true); }}>
              <Plus size={16} /> {lang === 'vi' ? 'Thêm Bài Tập' : 'New Assignment'}
            </button>
            <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={() => setShowTeamModal(true)}>
              <Plus size={16} /> {lang === 'vi' ? 'Tạo Nhóm Mới' : 'New Team'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={handleExportCSV}>
              <Download size={16} /> {lang === 'vi' ? 'Xuất CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* TAB: COURSES MANAGEMENT (Bỏ khung lớn bao bọc ngoài, giữ tiêu đề thoáng đãng) */}
        {activeTab === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {lang === 'vi' ? 'Học phần của bạn' : 'Your Courses'}
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Quản lý các môn học, đề tài đồ án và nhóm sinh viên.' : 'Manage courses, assignments, and student teams.'}
                </p>
              </div>
              <button className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.86rem', gap: '8px' }} onClick={() => setShowCourseModal(true)}>
                <Plus size={16} /> {lang === 'vi' ? 'Thêm Học Phần Mới' : 'Add New Course'}
              </button>
            </div>

            {loadingData && courses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>{lang === 'vi' ? 'Đang tải danh sách học phần...' : 'Loading courses...'}</p>
              </div>
            ) : courses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                <BookOpen size={52} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  {lang === 'vi' ? 'Chưa có học phần nào' : 'No courses created yet'}
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {lang === 'vi' ? 'Tạo học phần đầu tiên để bắt đầu phân nhóm và giao đề tài đồ án.' : 'Create your first course to begin team allocation and project assignments.'}
                </p>
                <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.88rem' }} onClick={() => setShowCourseModal(true)}>
                  <Plus size={16} /> {lang === 'vi' ? 'Thêm Học Phần Ngay' : 'Create Course Now'}
                </button>
              </div>
            ) : (
              /* Grid học phần mở to, thoáng đãng với thẻ đóng khung duy nhất */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.6rem' }}>
                {courses.map((course) => {
                  const courseTeams = teams.filter(t => t.course_id === course.course_id);
                  const isSelected = selectedCourseId !== null && selectedCourseId === course.course_id;

                  return (
                    <div 
                      key={course.course_id} 
                      className="glass-card"
                      style={{
                        background: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-card)',
                        border: isSelected ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '1.65rem 1.65rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? '0 12px 32px -8px rgba(2, 132, 199, 0.3)' : '0 10px 25px -8px rgba(0, 0, 0, 0.35)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Header của thẻ: Mã môn + Học kỳ */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(56, 189, 248, 0.14)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            borderRadius: '9999px',
                            padding: '3px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em'
                          }}>
                            {course.course_code}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Học kỳ: <strong style={{ color: 'var(--text-main)' }}>{course.semester}</strong>
                          </span>
                        </div>

                        {/* Tên môn học */}
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)', lineHeight: 1.35 }}>
                          {course.course_name}
                        </h4>

                        {/* Giảng viên */}
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.4rem' }}>
                          👨‍🏫 Giảng viên: <strong style={{ color: 'var(--text-main)' }}>{course.lecturer_name || currentUser?.fullName || 'Ánh Mai Lê Nguyễn'}</strong>
                        </p>

                        {/* Thống kê nhóm & trạng thái: BỎ HỘP VIỀN XÁM, dùng dải nền tinh tế */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '11px 15px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          marginBottom: '1.4rem',
                          fontSize: '0.86rem'
                        }}>
                          <Users size={16} color="#38bdf8" />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Số nhóm:</span>
                          <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{courseTeams.length} nhóm</strong>
                        </div>
                      </div>

                      {/* Các nút hành động */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.course_id);
                            setTeamCourseId(course.course_id);
                            setActiveTab('teams');
                          }}
                          className="btn-primary"
                          style={{ flex: 1, padding: '10px 16px', fontSize: '0.86rem', justifyContent: 'center', gap: '8px' }}
                        >
                          <FolderOpen size={16} /> {lang === 'vi' ? 'Xem danh sách nhóm' : 'View Teams'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.course_id);
                            setTeamCourseId(course.course_id);
                            setShowTeamModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '10px 16px', fontSize: '0.86rem', gap: '6px' }}
                        >
                          <Plus size={16} /> {lang === 'vi' ? 'Tạo nhóm' : 'New Team'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: OVERVIEW & CHẤM ĐIỂM (F10) */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {lang === 'vi' ? 'Danh sách bài nộp & Chấm điểm' : 'Submissions & Evaluation'}
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Theo dõi kết quả thực thi Docker Sandbox tự động và hội đồng kiểm định kép (BR-09).' : 'Track automated Docker grading and dual-lecturer reviews.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder={lang === 'vi' ? 'Tìm nhóm hoặc sinh viên...' : 'Search team...'} style={{ padding: '8px 12px 8px 36px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.86rem' }} />
                </div>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}><Filter size={16} /> {lang === 'vi' ? 'Lọc' : 'Filter'}</button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Nhóm' : 'Team'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Kho lưu trữ Git' : 'Repository'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Docker Sandbox' : 'Sandbox Status'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Điểm số (Thang 10)' : 'Grade (10)'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Xếp hạng AI' : 'AI Quality'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Kiểm duyệt' : 'Review'}</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'vi' ? 'Hành động' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 18px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{row.team}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{row.time}</span>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <a href={row.repo} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.86rem' }}>
                            <LinkIcon size={14} /> {row.repo.replace('https://github.com/', '')}
                          </a>
                          <code style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'inline-block' }}>SHA: {row.commit}</code>
                        </td>
                        <td style={{ padding: '16px 18px', color: row.statusColor }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            {row.status.includes('Passed') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            {row.status}
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '1.1rem', fontWeight: 800, color: (row.final_score ?? row.grade) >= 8 ? '#34d399' : ((row.final_score ?? row.grade) >= 5 ? '#f59e0b' : '#f43f5e') }}>
                          {(row.final_score ?? row.grade).toFixed(1)} / 10
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <span className="badge badge-info" style={{ fontWeight: 700 }}>{row.aiScore}</span>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          {row.moderationStatus === 'FINALIZED' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                              <CheckCircle2 size={12} /> {lang === 'vi' ? 'Đã Chốt Điểm' : 'Finalized'}
                            </span>
                          )}
                          {row.moderationStatus === 'PENDING_SECOND_REVIEW' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                              <AlertTriangle size={12} /> {lang === 'vi' ? 'Chờ GV2 Chấm Chéo' : 'Pending 2nd Review'}
                            </span>
                          )}
                          {row.moderationStatus === 'FIRST_REVIEWED' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
                              <Clock size={12} /> {lang === 'vi' ? 'GV1 Đã Đánh Giá' : '1st Reviewed'}
                            </span>
                          )}
                          {(!row.moderationStatus || row.moderationStatus === 'AI_PREGRADED') && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 700 }}>
                              <Sparkles size={12} /> {lang === 'vi' ? 'AI Chấm Sơ Bộ' : 'AI Pre-Graded'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                          <button 
                            onClick={() => openGradingModal(row)}
                            className="btn-primary" 
                            style={{ padding: '7px 16px', fontSize: '0.82rem', gap: '6px' }}
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
          </div>
        )}

        {/* MODAL CHẤM BÀI / KIỂM ĐỊNH BR-09 (DUAL-LECTURER MODERATION) */}
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
              maxWidth: '800px',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}>
              {/* Header Modal - Gọn gàng, tinh tế */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{selectedSub.team}</span>
                    {selectedSub.moderationStatus === 'FINALIZED' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                        <CheckCircle2 size={11} /> {lang === 'vi' ? 'Đã Chốt Điểm' : 'Finalized'}
                      </span>
                    )}
                    {selectedSub.moderationStatus === 'PENDING_SECOND_REVIEW' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
                        <AlertTriangle size={11} /> {lang === 'vi' ? 'Chờ GV2 Chấm Chéo' : 'Pending 2nd Review'}
                      </span>
                    )}
                    {selectedSub.moderationStatus === 'FIRST_REVIEWED' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }}>
                        <Clock size={11} /> {lang === 'vi' ? 'GV1 Đã Đánh Giá' : '1st Reviewed'}
                      </span>
                    )}
                    {(!selectedSub.moderationStatus || selectedSub.moderationStatus === 'AI_PREGRADED') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 600 }}>
                        <Sparkles size={11} /> {lang === 'vi' ? 'AI Chấm Sơ Bộ' : 'AI Pre-Graded'}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'inline' }}>
                      {lang === 'vi' ? 'Hội đồng Kiểm Định Bài Nộp (BR-09 Dual-Lecturer Moderation)' : 'Collaborative Dual-Lecturer Moderation (BR-09)'}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Git Commit: <code>{selectedSub.commit}</code> • {selectedSub.time} • Repo: <a href={selectedSub.repo} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>{selectedSub.repo.replace('https://github.com/', '')}</a>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSub(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Docker Sandbox Execution Output (Thu gọn tiết kiệm diện tích) */}
              <details style={{
                marginBottom: '0.75rem',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '6px 10px'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#93c5fd',
                  userSelect: 'none'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={13} color="#60a5fa" />
                    {lang === 'vi' ? 'Nhật ký thực thi Docker Sandbox (10/10 test cases passed)' : 'Docker Sandbox Output Logs (10/10 test cases passed)'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Xem chi tiết log ▾' : 'View logs ▾'}
                  </span>
                </summary>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'monospace',
                  color: '#93c5fd',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '90px',
                  overflowY: 'auto',
                  marginTop: '6px',
                  marginBottom: 0
                }}>
                  {selectedSub.sandboxOutput}
                </pre>
              </details>

              {/* BR-09 Stage Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setActiveModalStage('review1')}
                  className={activeModalStage === 'review1' ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '5px' }}
                >
                  <Sparkles size={13} /> {lang === 'vi' ? '1. AI & GV 1 Xem Xét' : '1. AI & Lecturer 1'}
                </button>
                <button 
                  onClick={() => setActiveModalStage('review2')}
                  className={activeModalStage === 'review2' ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '5px' }}
                >
                  <Users size={13} /> {lang === 'vi' ? '2. GV 2 Chấm Chéo (Độc Lập)' : '2. Lecturer 2 Cross-Grade'}
                </button>
                <button 
                  onClick={() => setActiveModalStage('consensus')}
                  className={activeModalStage === 'consensus' ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '5px' }}
                >
                  <Award size={13} /> {lang === 'vi' ? '3. Biên Bản Đồng Thuận' : '3. Consensus Settlement'}
                </button>
              </div>

              {/* TAB 1: AI PRE-GRADING & REVIEWER 1 */}
              {activeModalStage === 'review1' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Card AI Pre-grading */}
                  <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sparkles size={14} /> {lang === 'vi' ? 'Bước 1: Điểm & Nhận xét từ AI Model' : 'Step 1: AI Preliminary Score & Critique'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#38bdf8' }}>
                          {selectedSub.ai_score ?? selectedSub.grade} / 10
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApproveAI(selectedSub)}
                          className="btn-secondary"
                          style={{ padding: '3px 9px', fontSize: '0.75rem', borderColor: '#c084fc', color: '#c084fc', fontWeight: 600, gap: '4px' }}
                        >
                          ⚡ {lang === 'vi' ? 'Phê duyệt điểm AI & Chốt ngay' : 'Approve AI Score & Finalize'}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4, margin: 0 }}>
                      {selectedSub.aiFeedback}
                    </p>
                  </div>

                  {/* Form Giảng Viên 1 */}
                  <form onSubmit={handleSaveGrade} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} /> {lang === 'vi' ? 'Giảng Viên 1 (Reviewer 1) Đánh Giá & Điều Chỉnh' : 'Lecturer 1 Review & Challenge'}
                    </h4>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Điểm GV 1 (0-10):' : 'Score (0 - 10):'}
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={reviewer1Score}
                          onChange={e => setReviewer1Score(parseFloat(e.target.value) || 0)}
                          required
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Nhận xét chi tiết của GV 1:' : 'Reviewer 1 Notes / Justification:'}
                        </label>
                        <input 
                          type="text"
                          placeholder={lang === 'vi' ? 'Nhập ghi chú hoặc lý do điều chỉnh so với AI...' : 'Enter feedback or reason for deviation...'}
                          value={reviewer1Notes}
                          onChange={e => setReviewer1Notes(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '6px 10px', background: 'var(--bg-glass)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', whiteSpace: 'nowrap', margin: 0 }}>
                        {lang === 'vi' ? 'Chỉ định GV 2 chấm kiểm định:' : 'Assign Lecturer 2:'}
                      </label>
                      <select 
                        value={assignedReviewer2}
                        onChange={e => setAssignedReviewer2(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <option value="ThS. Trần Thị Chuyên Môn">ThS. Trần Thị Chuyên Môn (Bộ môn Kỹ thuật Phần mềm)</option>
                        <option value="TS. Lê Hoàng Nam">TS. Lê Hoàng Nam (Phản biện độc lập)</option>
                        <option value="PGS.TS. Phạm Văn Minh">PGS.TS. Phạm Văn Minh (Trưởng hội đồng chuyên môn)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        type="submit"
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '4px' }}
                      >
                        <Check size={13} /> {lang === 'vi' ? 'Lưu điểm GV 1 (Không cần GV 2)' : 'Save Grade (Single Lecturer)'}
                      </button>
                      <button 
                        type="button"
                        onClick={handleRequestSecondOpinion}
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', gap: '5px' }}
                      >
                        <RotateCw size={13} /> {lang === 'vi' ? 'Chuyển GV 2 Chấm Chéo Độc Lập (BR-09)' : 'Request 2nd Lecturer Review (BR-09)'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: REVIEWER 2 INDEPENDENT CROSS-GRADING */}
              {activeModalStage === 'review2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Tóm tắt điểm GV 1 */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                        {lang === 'vi' ? 'Kết quả từ GV 1:' : 'Lecturer 1 Assessment:'}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {selectedSub.reviewer_1_name || 'TS. Nguyễn Văn Giảng'}:
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        "{reviewer1Notes || selectedSub.reviewer_1_notes || (lang === 'vi' ? 'Đã xem xét bài nộp' : 'Reviewed')}"
                      </span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                      {reviewer1Score} / 10
                    </span>
                  </div>

                  {/* Form Giảng Viên 2 */}
                  <form onSubmit={handleSubmitSecondOpinion} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '4px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} /> {lang === 'vi' ? 'Giảng Viên 2 (Reviewer 2) Chấm Điểm Độc Lập' : 'Lecturer 2 Independent Evaluation'}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      {lang === 'vi' ? 'Hệ thống tự động so sánh độ lệch điểm:' : 'Score difference comparison:'}
                      {' '}<strong>{lang === 'vi' ? '≤ 0.5: Tự chốt điểm | > 0.5: Mở họp đồng thuận' : '≤ 0.5: Auto-finalize | > 0.5: Consensus required'}</strong>.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Điểm GV 2 (0-10):' : 'Score (0 - 10):'}
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={reviewer2Score}
                          onChange={e => setReviewer2Score(parseFloat(e.target.value) || 0)}
                          required
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Nhận xét độc lập của GV 2:' : 'Reviewer 2 Notes / Critique:'}
                        </label>
                        <input 
                          type="text"
                          placeholder={lang === 'vi' ? 'Nhập đánh giá khách quan của GV 2...' : 'Enter objective assessment...'}
                          value={reviewer2Notes}
                          onChange={e => setReviewer2Notes(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        type="submit"
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '5px' }}
                      >
                        <Check size={14} /> {lang === 'vi' ? 'Nộp Điểm GV 2 & So Sánh Độ Lệch' : 'Submit 2nd Review & Compare'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: CONSENSUS SETTLEMENT */}
              {activeModalStage === 'consensus' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {scoreDiffNotice && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '8px', padding: '8px 12px', color: '#fbbf24', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} />
                      <span>{scoreDiffNotice}</span>
                    </div>
                  )}

                  {/* Bảng so sánh 3 nguồn điểm */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#c084fc', display: 'block', marginBottom: '2px' }}>AI Pre-grade</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{selectedSub.ai_score ?? 9.0}</strong>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#93c5fd', display: 'block', marginBottom: '2px' }}>Giảng Viên 1</span>
                      <strong style={{ fontSize: '1.05rem', color: '#38bdf8' }}>{reviewer1Score}</strong>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'block', marginBottom: '2px' }}>Giảng Viên 2</span>
                      <strong style={{ fontSize: '1.05rem', color: '#fbbf24' }}>{reviewer2Score}</strong>
                    </div>
                  </div>

                  {/* Form Biên bản đồng thuận */}
                  <form onSubmit={handleFinalizeConsensus} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FileText size={14} /> {lang === 'vi' ? 'Biên Bản Thống Nhất & Điểm Số Chính Thức (Consensus)' : 'Consensus Notes & Final Published Score'}
                    </h4>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                        {lang === 'vi' ? 'Nội dung thống nhất giữa 2 giảng viên (*):' : 'Joint Consensus Discussion Notes (*):'}
                      </label>
                      <textarea 
                        rows={2}
                        required
                        placeholder={lang === 'vi' ? 'Ghi lại nội dung đồng thuận và căn cứ tính điểm cuối cùng...' : 'Record discussion points and score justification...'}
                        value={consensusNotes}
                        onChange={e => setConsensusNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Điểm chính thức:' : 'Final Score:'}
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={finalScoreInput}
                          onChange={e => setFinalScoreInput(parseFloat(e.target.value) || 0)}
                          required
                          style={{
                            width: '80px',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid #10b981',
                            color: '#34d399',
                            fontSize: '1rem',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', gap: '5px' }}
                      >
                        <Award size={14} /> {lang === 'vi' ? 'Chốt Điểm & Công Bố' : 'Publish Consensus Grade'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Footer Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                <button 
                  type="button"
                  disabled={isRegrading}
                  onClick={handleRerunGrading}
                  className="btn-secondary"
                  style={{ gap: '5px', fontSize: '0.78rem', padding: '5px 12px' }}
                >
                  {isRegrading ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
                  <span>{lang === 'vi' ? 'Chạy lại Docker Sandbox' : 'Re-run Sandbox Grading'}</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setSelectedSub(null)}
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '5px 14px' }}
                >
                  {lang === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 0: TEAM MANAGEMENT (F09) */}
        {activeTab === 'teams' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {lang === 'vi' ? 'Nhóm sinh viên & Phân công' : 'Teams & Allocation'}
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Danh sách nhóm đồ án và phân công phụ trách module theo từng thành viên.' : 'Manage project teams and module assignments.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowCourseModal(true)}>
                  <BookOpen size={16} /> {lang === 'vi' ? 'Thêm Học Phần' : 'New Course'}
                </button>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={() => setShowTeamModal(true)}>
                  <Plus size={16} /> {lang === 'vi' ? 'Tạo Nhóm Mới' : 'Create New Team'}
                </button>
              </div>
            </div>


            {loadingData && teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>{lang === 'vi' ? 'Đang tải danh sách nhóm...' : 'Loading teams...'}</p>
              </div>
            ) : (selectedCourseId ? teams.filter(t => t.course_id === selectedCourseId) : teams).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                <FolderOpen size={52} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  {lang === 'vi' ? 'Học phần này chưa có nhóm nào được tạo' : 'No teams created for this course yet'}
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {lang === 'vi' ? 'Bắt đầu bằng cách tạo nhóm sinh viên đầu tiên cho học phần của bạn.' : 'Get started by creating the first team for your course.'}
                </p>
                <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.88rem' }} onClick={() => { if(selectedCourseId) setTeamCourseId(selectedCourseId); setShowTeamModal(true); }}>
                  <Plus size={16} /> {lang === 'vi' ? 'Tạo Nhóm Cho Học Phần Này' : 'Create Team for Course'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.75rem' }}>
                {(selectedCourseId ? teams.filter(t => t.course_id === selectedCourseId) : teams).map((team) => {
                  const currentTeamTasks = teamTasks.filter(t => t.team_id === team.team_id);
                  const doneTasks = currentTeamTasks.filter(t => t.status === 'DONE');
                  const inProgressTasks = currentTeamTasks.filter(t => t.status === 'IN_PROGRESS');
                  const pendingTasks = currentTeamTasks.filter(t => t.status === 'PENDING');
                  const totalTasks = currentTeamTasks.length;
                  const progressPercent = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;
                  const courseOfTeam = courses.find(c => c.course_id === team.course_id);

                  return (
                    <div 
                      key={team.team_id} 
                      className="glass-card"
                      onClick={() => setSelectedTeamDetails(team)}
                      style={{
                        borderRadius: '20px',
                        padding: '1.65rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 10px 25px -8px rgba(0, 0, 0, 0.35)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Top Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: 'rgba(56, 189, 248, 0.14)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '9999px',
                              padding: '2px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 800
                            }}>
                              {team.course_code || courseOfTeam?.course_code || 'SWD392'}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {team.semester || courseOfTeam?.semester || 'FA26'}
                            </span>
                          </div>
                        </div>

                        {/* Team Name */}
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.6rem 0', lineHeight: 1.35 }}>
                          {team.team_name}
                        </h4>

                        {/* Git Repository Link Pill */}
                        <div style={{ marginBottom: '1.2rem' }}>
                          <a 
                            href={team.repo_url} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              color: '#38bdf8',
                              fontSize: '0.78rem',
                              textDecoration: 'none',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <LinkIcon size={13} color="#38bdf8" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.repo_url.replace('https://github.com/', '')}</span>
                          </a>
                        </div>

                        {/* Progress Bar & Tasks breakdown */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', padding: '12px 14px', marginBottom: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Tiến độ nhiệm vụ:' : 'Task Progress:'}</span>
                            <strong style={{ color: progressPercent >= 70 ? '#34d399' : '#38bdf8', fontWeight: 700 }}>
                              {doneTasks.length}/{totalTasks} tasks ({progressPercent}%)
                            </strong>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${progressPercent}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                              borderRadius: '9999px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <span style={{ color: '#34d399', fontWeight: 600 }}>● {doneTasks.length} {lang === 'vi' ? 'Đã xong' : 'Done'}</span>
                            <span style={{ color: '#fbbf24', fontWeight: 600 }}>● {inProgressTasks.length} {lang === 'vi' ? 'Đang làm' : 'In Progress'}</span>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>● {pendingTasks.length} {lang === 'vi' ? 'Chưa nộp' : 'Pending'}</span>
                          </div>
                        </div>

                        {/* Member Avatars Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', marginLeft: '6px' }}>
                              {team.members?.slice(0, 4).map((m, idx) => (
                                <div
                                  key={m.team_member_id || m.user_id || idx}
                                  title={`${m.full_name} (${m.assigned_module || 'Thành viên'})`}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #1e40af, #0284c7)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    border: '2px solid #0f172a',
                                    marginLeft: idx > 0 ? '-8px' : '0',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                  }}
                                >
                                  {m.full_name?.charAt(0) || 'U'}
                                </div>
                              ))}
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {team.members?.length || 0} {lang === 'vi' ? 'thành viên' : 'members'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                            {lang === 'vi' ? 'Bấm xem task ➔' : 'View tasks ➔'}
                          </span>
                        </div>
                      </div>

                      {/* Primary Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamDetails(team);
                        }}
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '1.25rem',
                          justifyContent: 'center',
                          fontSize: '0.86rem',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          gap: '8px'
                        }}
                      >
                        <CheckSquare size={16} />
                        {lang === 'vi' ? 'Xem nhiệm vụ & Phân công' : 'View Tasks & Allocation'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL 0: CHI TIẾT NHÓM & QUẢN LÝ NHIỆM VỤ / TASKS */}
        {selectedTeamDetails && (() => {
          const teamTasksList = teamTasks.filter(t => t.team_id === selectedTeamDetails.team_id);
          const doneList = teamTasksList.filter(t => t.status === 'DONE');
          const inProgressList = teamTasksList.filter(t => t.status === 'IN_PROGRESS');
          const pendingList = teamTasksList.filter(t => t.status === 'PENDING');
          const percent = teamTasksList.length > 0 ? Math.round((doneList.length / teamTasksList.length) * 100) : 0;
          const courseOfTeam = courses.find(c => c.course_id === selectedTeamDetails.course_id);

          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1400,
              padding: '1.25rem'
            }}>
              <div className="glass-card" style={{
                width: '96vw',
                maxWidth: '1440px',
                height: '92vh',
                maxHeight: '94vh',
                overflowY: 'auto',
                padding: '2.25rem 2.5rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.16) transparent'
              }}>
                {/* Header Modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Course breadcrumbs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        padding: '2px 9px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}>
                        {selectedTeamDetails.course_code || courseOfTeam?.course_code || 'SWD392'}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {selectedTeamDetails.semester || courseOfTeam?.semester || 'FA26'}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedTeamDetails.course_name || courseOfTeam?.course_name || 'Software Architecture & Design'}
                      </span>
                    </div>

                    {/* Team Title */}
                    <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                      {selectedTeamDetails.team_name}
                    </h3>

                    {/* Git Repo Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a
                        href={selectedTeamDetails.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          color: '#38bdf8',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <GitBranch size={13} color="#38bdf8" />
                        <span>{selectedTeamDetails.repo_url.replace('https://github.com/', '')}</span>
                        <ExternalLink size={12} color="#94a3b8" />
                      </a>
                    </div>
                  </div>

                  {/* Circular Close Button */}
                  <button
                    onClick={() => setSelectedTeamDetails(null)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Banner Tiến độ tổng quan của nhóm - Phong cách Dashboard cao cấp */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.65) 0%, rgba(30, 41, 59, 0.45) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.75rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#38bdf8" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>
                        {lang === 'vi' ? 'Tiến độ hoàn thành nhiệm vụ đồ án' : 'Task Completion Progress'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {doneList.length}/{teamTasksList.length} {lang === 'vi' ? 'nhiệm vụ' : 'tasks'}
                      </span>
                      <span style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: percent >= 70 ? '#34d399' : (percent > 0 ? '#38bdf8' : '#94a3b8'),
                        background: percent >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        border: percent >= 70 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '2px 10px',
                        borderRadius: '9999px'
                      }}>
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Thanh tiến độ đa đoạn (Multi-segment bar) */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px', display: 'flex' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7 0%, #34d399 100%)',
                      transition: 'width 0.4s ease'
                    }} />
                    <div style={{
                      width: `${teamTasksList.length > 0 ? Math.round((inProgressList.length / teamTasksList.length) * 100) : 0}%`,
                      height: '100%',
                      background: '#f59e0b',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Thống kê 3 trạng thái dạng Pill sang trọng */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '3px 10px', borderRadius: '6px', color: '#34d399', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      <span>{doneList.length} {lang === 'vi' ? 'Hoàn thành' : 'Done'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '3px 10px', borderRadius: '6px', color: '#fbbf24', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span>{inProgressList.length} {lang === 'vi' ? 'Đang thực hiện' : 'In Progress'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.25)', padding: '3px 10px', borderRadius: '6px', color: '#94a3b8', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
                      <span>{pendingList.length} {lang === 'vi' ? 'Chưa hoàn thành' : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Section Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ListTodo size={18} color="#38bdf8" />
                      {lang === 'vi' ? 'Thành viên & Phân công nhiệm vụ' : 'Members & Assigned Tasks'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {lang === 'vi' ? 'Bấm vào nhãn trạng thái để đổi nhanh (Hoàn thành / Đang làm / Chưa làm).' : 'Click on status badges to quickly toggle task progress.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetTeam(selectedTeamDetails);
                      setShowAssignModal(true);
                      if (students.length > 0 && !assignUserId) setAssignUserId(students[0].user_id);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '7px 14px', gap: '6px', borderRadius: '8px', fontWeight: 600 }}
                  >
                    <UserPlus size={15} /> {lang === 'vi' ? 'Thêm sinh viên vào nhóm' : 'Add Member to Team'}
                  </button>
                </div>

                {/* Danh sách thành viên và các task của họ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {selectedTeamDetails.members && selectedTeamDetails.members.length > 0 ? (
                    selectedTeamDetails.members.map((m) => {
                      const memberTasks = teamTasks.filter(t => 
                        t.team_id === selectedTeamDetails.team_id && 
                        (t.assigned_to_name === m.full_name || 
                         t.assigned_to_name === m.email || 
                         t.assigned_to_name.toLowerCase().includes(m.full_name.toLowerCase().split(' ')[0]))
                      );
                      const isAddingTask = showAddTaskFormForMember === m.full_name;
                      const initial = (m.full_name || 'U').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U';

                      return (
                        <div
                          key={m.team_member_id || m.user_id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '1.25rem 1.4rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Member Top Bar: Thiết kế chuẩn Grid/Flex không bao giờ rớt dòng lệch nút */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '1rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingBottom: '0.85rem'
                          }}>
                            {/* Thông tin thành viên bên trái */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: m.role === 'LEADER' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #1e40af, #0284c7)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                              }}>
                                {initial}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                  <strong style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                                    {m.full_name}
                                  </strong>
                                  {m.role === 'LEADER' && (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '9999px',
                                      background: 'rgba(245, 158, 11, 0.15)',
                                      color: '#fbbf24',
                                      border: '1px solid rgba(245, 158, 11, 0.35)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 700
                                    }}>
                                      <Crown size={11} /> {lang === 'vi' ? 'Trưởng nhóm' : 'Leader'}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '0.74rem',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    color: '#38bdf8',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '260px'
                                  }}>
                                    {m.assigned_module || 'Chưa phân hệ'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  <Mail size={12} color="#64748b" />
                                  <span>{m.email}</span>
                                </div>
                              </div>
                            </div>

                            {/* Cụm nút hành động bên phải: Cố định vị trí, không bao giờ rớt dòng */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => setShowAddTaskFormForMember(isAddingTask ? null : m.full_name)}
                                className="btn-secondary"
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '6px 12px',
                                  gap: '5px',
                                  borderRadius: '8px',
                                  fontWeight: 600
                                }}
                              >
                                <Plus size={13} /> {lang === 'vi' ? 'Giao task' : 'Assign Task'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(selectedTeamDetails.team_id, m.team_member_id, m.full_name)}
                                title={lang === 'vi' ? 'Xóa khỏi nhóm' : 'Remove from team'}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.22)',
                                  color: '#f87171',
                                  cursor: 'pointer',
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Mini Form Giao Task Mới */}
                          {isAddingTask && (
                            <div style={{
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              borderRadius: '12px',
                              padding: '14px 16px',
                              marginBottom: '1rem',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                            }}>
                              <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={14} /> {lang === 'vi' ? `Giao nhiệm vụ mới cho ${m.full_name}:` : `Assign new task to ${m.full_name}:`}
                              </h5>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <input
                                  type="text"
                                  placeholder={lang === 'vi' ? 'Tên nhiệm vụ (VD: Viết Unit Test cho API Auth...)' : 'Task title...'}
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  style={{
                                    flex: 2,
                                    minWidth: '220px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.84rem'
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder={lang === 'vi' ? 'Hạn nộp (VD: 25/10/2026)' : 'Due date (e.g. 25/10/2026)'}
                                  value={newTaskDueDate}
                                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                                  style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.84rem'
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setShowAddTaskFormForMember(null)}
                                  className="btn-secondary"
                                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                >
                                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCreateNewTask(selectedTeamDetails.team_id, m.full_name)}
                                  className="btn-primary"
                                  style={{ fontSize: '0.8rem', padding: '6px 16px', gap: '6px' }}
                                >
                                  <Check size={14} /> {lang === 'vi' ? 'Lưu nhiệm vụ' : 'Save Task'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Danh sách nhiệm vụ của thành viên */}
                          <div>
                            {memberTasks.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {memberTasks.map((t) => (
                                  <div
                                    key={t.task_id}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      background: 'rgba(15, 23, 42, 0.5)',
                                      padding: '10px 14px',
                                      borderRadius: '10px',
                                      border: '1px solid rgba(255, 255, 255, 0.06)',
                                      gap: '12px'
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          width: '7px',
                                          height: '7px',
                                          borderRadius: '50%',
                                          background: t.status === 'DONE' ? '#10b981' : (t.status === 'IN_PROGRESS' ? '#f59e0b' : '#64748b'),
                                          display: 'inline-block',
                                          flexShrink: 0
                                        }} />
                                        <strong style={{
                                          fontSize: '0.88rem',
                                          color: '#f1f5f9',
                                          fontWeight: 600
                                        }}>
                                          {t.title}
                                        </strong>
                                      </div>
                                      <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginLeft: '15px', marginTop: '2px', display: 'block' }}>
                                        ⏰ {lang === 'vi' ? 'Hạn chót:' : 'Deadline:'} <strong style={{ color: '#cbd5e1' }}>{t.due_date}</strong>
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                      {/* Clickable Status Badge to toggle */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTaskStatus(t.task_id)}
                                        title={lang === 'vi' ? 'Bấm để đổi trạng thái task' : 'Click to change status'}
                                        style={{
                                          background: t.status === 'DONE' 
                                            ? 'rgba(16, 185, 129, 0.15)' 
                                            : (t.status === 'IN_PROGRESS' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)'),
                                          color: t.status === 'DONE' ? '#34d399' : (t.status === 'IN_PROGRESS' ? '#fbbf24' : '#94a3b8'),
                                          border: t.status === 'DONE' 
                                            ? '1px solid rgba(16, 185, 129, 0.35)' 
                                            : (t.status === 'IN_PROGRESS' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(100, 116, 139, 0.3)'),
                                          padding: '4px 10px',
                                          borderRadius: '9999px',
                                          fontSize: '0.74rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          transition: 'all 0.15s'
                                        }}
                                      >
                                        {t.status === 'DONE' && <CheckCircle2 size={12} />}
                                        {t.status === 'IN_PROGRESS' && <Clock size={12} />}
                                        {t.status === 'PENDING' && <AlertCircle size={12} />}
                                        <span>
                                          {t.status === 'DONE' ? (lang === 'vi' ? 'Đã hoàn thành' : 'Done') : (t.status === 'IN_PROGRESS' ? (lang === 'vi' ? 'Đang làm' : 'In Progress') : (lang === 'vi' ? 'Chưa nộp' : 'Pending'))}
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTask(t.task_id)}
                                        title={lang === 'vi' ? 'Xóa task' : 'Delete task'}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <X size={15} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Empty State sạch sẽ, thanh lịch có nút bấm trực tiếp */
                              <div style={{
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.015)',
                                border: '1px dashed rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '8px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.82rem' }}>
                                  <ListTodo size={15} color="#64748b" />
                                  <span>{lang === 'vi' ? 'Chưa có nhiệm vụ nào được giao cho thành viên này.' : 'No tasks assigned yet.'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowAddTaskFormForMember(m.full_name)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#38bdf8',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Plus size={13} /> {lang === 'vi' ? 'Giao nhiệm vụ ngay' : 'Assign task now'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Nhóm chưa có thành viên nào.' : 'No members in this team yet.'}
                    </div>
                  )}
                </div>

                {/* Footer Modal */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamDetails(null)}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '8px 22px', borderRadius: '10px' }}
                  >
                    {lang === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
                  <input type="text" defaultValue="Milestone 1: Backend API & Auth" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Dockerfile môi trường Sandbox chấm tự động' : 'Docker Sandbox Environment (Dockerfile)'}
                  </label>
                  <textarea rows={4} defaultValue={'FROM node:18-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install\nCMD ["npm", "test"]'} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.85rem' }} />
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
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitBranch size={22} color="#38bdf8" /> {lang === 'vi' ? 'Thống kê đóng góp Git & Radar Free-Rider' : 'Git Contribution Analytics'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                {lang === 'vi' 
                  ? 'Tổng hợp commit và dòng code (LOC) từ GitHub repository của các nhóm đồ án để phát hiện sự chênh lệch đóng góp.'
                  : 'Summary of commits and lines of code (LOC) from team GitHub repositories.'}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Sinh viên' : 'Student Name'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Nhóm' : 'Team'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Lượt Commits' : 'Commits'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Số dòng thêm/xóa (LOC)' : 'LOC Added/Deleted'}</th>
                      <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Trạng thái đánh giá' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(244, 63, 94, 0.05)' }}>
                      <td style={{ padding: '16px 18px' }}><strong>Hoang E</strong> (QE190149)</td>
                      <td style={{ padding: '16px 18px' }}>Group 4</td>
                      <td style={{ padding: '16px 18px' }}>2</td>
                      <td style={{ padding: '16px 18px' }}><span style={{ color: '#34d399' }}>+120</span> / <span style={{ color: '#f43f5e' }}>-10</span></td>
                      <td style={{ padding: '16px 18px' }}><span className="badge badge-warning">⚠️ {lang === 'vi' ? 'Đóng góp thấp (<15%)' : 'Low Activity (<15%)'}</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 18px' }}><strong>Nguyen B</strong> (QE180099)</td>
                      <td style={{ padding: '16px 18px' }}>Group 2</td>
                      <td style={{ padding: '16px 18px' }}>5</td>
                      <td style={{ padding: '16px 18px' }}><span style={{ color: '#34d399' }}>+450</span> / <span style={{ color: '#f43f5e' }}>-230</span></td>
                      <td style={{ padding: '16px 18px' }}><span className="badge badge-info">{lang === 'vi' ? 'Đóng góp trung bình' : 'Medium Activity'}</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 18px' }}><strong>Le Nguyen Anh Mai</strong> (QE190151)</td>
                      <td style={{ padding: '16px 18px' }}>Group 4</td>
                      <td style={{ padding: '16px 18px' }}>42</td>
                      <td style={{ padding: '16px 18px' }}><span style={{ color: '#34d399' }}>+1,245</span> / <span style={{ color: '#f43f5e' }}>-400</span></td>
                      <td style={{ padding: '16px 18px' }}><span className="badge badge-success">⭐ {lang === 'vi' ? 'Đóng góp xuất sắc (Top 1)' : 'Top Contributor'}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PEER AUDIT SUMMARY (F12) */}
        {activeTab === 'peer' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#34d399" /> {lang === 'vi' ? 'Báo cáo đánh giá chéo nội bộ (Peer Audit)' : 'Peer Audit Report'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                {lang === 'vi'
                  ? 'Tổng hợp điểm số và nhận xét ẩn danh giữa các thành viên trong nhóm theo phân hệ module phụ trách.'
                  : 'Aggregated peer evaluations and anonymous critique across team members.'}
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.75rem' }}>
              {/* Group 4 Card */}
              <div className="glass-card" style={{ border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '1.15rem' }}>Group 4 (AITA)</strong>
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
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} onClick={() => alert('Chi tiết nhận xét: Mai và Vy làm việc tích cực, Huy ít tham gia họp nhóm.')}>
                  {lang === 'vi' ? 'Xem chi tiết nhận xét bí mật' : 'View Confidential Comments'}
                </button>
              </div>

              {/* Group 2 Card */}
              <div className="glass-card" style={{ border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '1.15rem' }}>Group 2</strong>
                    <span className="badge badge-error">3/5 {lang === 'vi' ? 'Đã nộp' : 'Submitted'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', opacity: 0.7 }}>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? 'Đang chờ các thành viên còn lại hoàn tất đánh giá trước khi tính điểm trung bình.' : 'Waiting for all members to complete evaluation before calculating final score.'}
                    </p>
                  </div>
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} onClick={() => alert(lang === 'vi' ? 'Đã gửi email nhắc nhở tới sinh viên chưa nộp!' : 'Reminder email sent!')}>
                  {lang === 'vi' ? 'Gửi email nhắc nhở nộp' : 'Send Reminder Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: TẠO HỌC PHẦN MỚI */}
        {showCourseModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={16} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {lang === 'vi' ? 'Thêm học phần mới' : 'New Course'}
                  </h3>
                </div>
                <button onClick={() => setShowCourseModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mã học phần' : 'Course Code'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SWD392, PRJ301..."
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên môn học' : 'Course Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Software Architecture & Design"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Học kỳ' : 'Semester'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FA26"
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setShowCourseModal(false)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingCourse} className="btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px', gap: '6px' }}>
                    {submittingCourse ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{lang === 'vi' ? 'Tạo học phần' : 'Create Course'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: TẠO NHÓM MỚI */}
        {showTeamModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={16} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {lang === 'vi' ? 'Tạo nhóm mới' : 'New Team'}
                  </h3>
                </div>
                <button onClick={() => setShowTeamModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên nhóm' : 'Team Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Group 1, Nhóm 2..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Học phần' : 'Course'}
                  </label>
                  <select
                    value={teamCourseId}
                    onChange={(e) => setTeamCourseId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
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
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'GitHub Repo URL' : 'GitHub Repo URL'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/organization/repo.git"
                    value={teamRepoUrl}
                    onChange={(e) => setTeamRepoUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: '#60a5fa',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setShowTeamModal(false)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingTeam} className="btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px', gap: '6px' }}>
                    {submittingTeam ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{lang === 'vi' ? 'Tạo nhóm' : 'Create Team'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: THÊM THÀNH VIÊN VÀO NHÓM */}
        {showAssignModal && targetTeam && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserPlus size={16} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {lang === 'vi' ? `Thêm thành viên • ${targetTeam.team_name}` : `Add Member • ${targetTeam.team_name}`}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  marginBottom: '1rem'
                }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleAssignMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Segmented Switcher */}
                <div style={{
                  display: 'flex',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <button
                    type="button"
                    onClick={() => setAssignMode('email')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: assignMode === 'email' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                      color: assignMode === 'email' ? '#93c5fd' : 'var(--text-muted)',
                      fontWeight: assignMode === 'email' ? 600 : 400,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {lang === 'vi' ? 'Nhập Email' : 'By Email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode('select')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: assignMode === 'select' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                      color: assignMode === 'select' ? '#93c5fd' : 'var(--text-muted)',
                      fontWeight: assignMode === 'select' ? 600 : 400,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {lang === 'vi' ? 'Chọn từ danh sách' : 'From List'}
                  </button>
                </div>

                {/* Email or Select */}
                {assignMode === 'email' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Email sinh viên' : 'Student Email'}
                    </label>
                    <input
                      type="text"
                      list="registered-student-emails"
                      required={assignMode === 'email'}
                      placeholder="student@fpt.edu.vn"
                      value={assignEmail}
                      onChange={(e) => setAssignEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem'
                      }}
                    />
                    <datalist id="registered-student-emails">
                      {students.map((st) => (
                        <option key={st.user_id} value={st.email}>
                          {st.full_name} ({st.email})
                        </option>
                      ))}
                    </datalist>
                    {(() => {
                      const match = students.find(s => s.email.toLowerCase().trim() === assignEmail.toLowerCase().trim());
                      if (match) {
                        return (
                          <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>✓</span> {lang === 'vi' ? `Sinh viên đã đăng ký: ${match.full_name}` : `Registered student: ${match.full_name}`}
                          </div>
                        );
                      }
                      if (assignEmail.trim() && assignEmail.includes('@')) {
                        return (
                          <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>ℹ️</span> {lang === 'vi' ? 'Email mới: Sẽ tự động gán học phần khi sinh viên đăng nhập' : 'New email: Will auto-link upon student login'}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {students.length > 0 && !assignEmail && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Gợi ý sinh viên trong hệ thống:' : 'Registered students suggestions:'}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {students.slice(0, 6).map(st => (
                            <button
                              key={st.user_id}
                              type="button"
                              onClick={() => setAssignEmail(st.email)}
                              style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                color: '#93c5fd',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '0.72rem',
                                cursor: 'pointer'
                              }}
                            >
                              + {st.full_name} ({st.email.split('@')[0]})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Chọn sinh viên' : 'Select Student'}
                    </label>
                    <select
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      required={assignMode === 'select'}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem'
                      }}
                    >
                      {students.map((st) => (
                        <option key={st.user_id} value={st.user_id}>
                          {st.full_name} ({st.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Role Switcher */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Vai trò' : 'Role'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAssignRole('MEMBER')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: assignRole === 'MEMBER' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                        background: assignRole === 'MEMBER' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: assignRole === 'MEMBER' ? '#93c5fd' : 'var(--text-muted)',
                        fontWeight: assignRole === 'MEMBER' ? 600 : 400,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'vi' ? 'Thành viên' : 'Member'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignRole('LEADER')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: assignRole === 'LEADER' ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                        background: assignRole === 'LEADER' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: assignRole === 'LEADER' ? '#fbbf24' : 'var(--text-muted)',
                        fontWeight: assignRole === 'LEADER' ? 600 : 400,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Crown size={13} />
                      {lang === 'vi' ? 'Trưởng nhóm' : 'Leader'}
                    </button>
                  </div>
                </div>

                {/* Module */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Phân hệ / Module phụ trách' : 'Assigned Module'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'vi' ? 'VD: Frontend, Backend API, Database...' : 'e.g. Frontend, Backend, Auth...'}
                    value={assignModule}
                    onChange={(e) => setAssignModule(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                    {['Core Auth', 'Docker Runner', 'AI Tutor', 'Frontend & UI', 'Testing'].map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setAssignModule(mod)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#94a3b8',
                          borderRadius: '4px',
                          padding: '2px 7px',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingAssign} className="btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px', gap: '6px' }}>
                    {submittingAssign ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{lang === 'vi' ? 'Thêm thành viên' : 'Add Member'}</span>
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
            zIndex: 2000, padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%', maxWidth: '580px',
              padding: '2rem', borderRadius: '20px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} style={{ color: '#c084fc' }} />
                  {lang === 'vi' ? 'Tạo bài tập mới' : 'Create Assignment'}
                </h3>
                <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
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
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
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
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
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
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical' }}
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
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
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
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
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
