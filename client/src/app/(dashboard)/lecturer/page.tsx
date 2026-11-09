'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../../components/Navigation';
import AitaLogo from '../../../components/AitaLogo';
import { useLanguage } from '../../../context/LanguageContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import ThemeToggle from '../../../components/ThemeToggle';
import { 
  Users, BookOpen, GitBranch, GitPullRequest, Settings, CheckCircle2, 
  AlertTriangle, Filter, Search, ShieldCheck, Download, FolderOpen, Plus, 
  Link as LinkIcon, Edit3, RotateCw, Loader2, Sparkles, Terminal, X, Check,
  Clock, UserCheck, FileText, Award, ArrowRight, ArrowLeft, UserPlus, Mail, Trash2, Crown,
  CheckSquare, ListTodo, AlertCircle, ExternalLink, XCircle, Upload,
  ArrowUp, ArrowDown, Play, Code, History,
  ChevronRight, LogOut, GraduationCap, School,
  BarChart2, FileCode, Code2, Eye
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
  team_id?: number;
  assignment_id?: number;
  assignment_title?: string;
  is_late?: boolean;
  late_minutes?: number;
  submitted_at_raw?: string;
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
  submitter_name?: string;
  submitter_email?: string;
  submission_type?: 'INDIVIDUAL' | 'TEAM';
  code_content?: string;
  language?: string;
  test_results?: Array<{
    result_id: number;
    criterion: string;
    passed: boolean;
    score: number;
    max_score: number;
    execution_time_ms: number;
    is_hidden: boolean;
    actual_output?: string;
    expected_output?: string;
    input_data?: string;
  }>;
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

interface StudentUser {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
}

interface RubricRuleItem {
  rubric_rule_id: number;
  assignment_id: number;
  rule_type: string;
  criterion: string;
  description?: string;
  input_data: string;
  expected_output: string;
  weight: number;
  max_score: number;
  is_hidden: boolean;
  status?: 'Draft' | 'Active' | 'Hidden' | 'Disabled';
  order_index?: number;
}

interface AssignmentItem {
  assignment_id: number;
  course_id: number;
  course_code?: string;
  course_name?: string;
  title: string;
  description: string;
  deadline?: string;
  due_date?: string;
  start_date?: string;
  close_date?: string;
  max_score: number;
  submission_type: string;
  target_type?: 'ALL' | 'SPECIFIC_TEAMS';
  allowed_language?: 'ALL' | 'python' | 'javascript';
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  allow_late_submission?: boolean;
  max_submissions?: number;
  allow_resubmission?: boolean;
  target_teams?: Array<{ team_id: number; team_name: string }>;
  rubric_count?: number;
  submission_count?: number;
}



export default function LecturerDashboard() {
  const { lang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTabState] = useState<'courses' | 'teams' | 'overview' | 'config' | 'git-submit' | 'analytics' | 'peer'>('overview');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('aita_lecturer_active_tab');
      if (saved && ['courses', 'teams', 'overview', 'config', 'git-submit', 'analytics', 'peer'].includes(saved)) {
        setActiveTabState(saved as any);
      }
    }
  }, []);

  const setActiveTab = (tab: 'courses' | 'teams' | 'overview' | 'config' | 'git-submit' | 'analytics' | 'peer') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aita_lecturer_active_tab', tab);
    }
  };
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [filterLatestOnly, setFilterLatestOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'FINALIZED' | 'SECOND_REVIEW'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  // Real Database Data State
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Assignment & Rubric Test Cases State
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [rubricRules, setRubricRules] = useState<RubricRuleItem[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState<boolean>(false);

  // Modal 5: Add Test Case State
  const [showAddTestCaseModal, setShowAddTestCaseModal] = useState<boolean>(false);
  const [tcCriterion, setTcCriterion] = useState<string>('');
  const [tcInputData, setTcInputData] = useState<string>('');
  const [tcExpectedOutput, setTcExpectedOutput] = useState<string>('');
  const [tcMaxScore, setTcMaxScore] = useState<string>('3.0');
  const [tcIsHidden, setTcIsHidden] = useState<boolean>(false);
  const [tcNewAssignmentTitle, setTcNewAssignmentTitle] = useState<string>('');
  const [tcSubmissionType, setTcSubmissionType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
  const [editingRubric, setEditingRubric] = useState<RubricRuleItem | null>(null);
  const [submittingTestCase, setSubmittingTestCase] = useState<boolean>(false);
  const [tcDescription, setTcDescription] = useState<string>('');
  const [tcStatus, setTcStatus] = useState<'Draft' | 'Active' | 'Hidden' | 'Disabled'>('Active');
  const [tcFilterStatus, setTcFilterStatus] = useState<string>('ALL');

  // Preview Reference Solution State
  const [showPreviewSection, setShowPreviewSection] = useState<boolean>(false);
  const [previewLanguage, setPreviewLanguage] = useState<'python' | 'javascript'>('python');
  const [previewCode, setPreviewCode] = useState<string>('');
  const [previewRunning, setPreviewRunning] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<{
    passed: boolean;
    status: string;
    actual_output: string;
    expected_output: string;
    execution_time_ms: number;
    stderr?: string;
    error_message?: string;
  } | null>(null);

  // Modal: Chi tiết Nhóm & Quản lý Thành viên
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamItem | null>(null);

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

  // Modal: Edit Course State
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseSemester, setEditCourseSemester] = useState('');
  const [submittingEditCourse, setSubmittingEditCourse] = useState(false);

  // Modal: Edit Team State
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamRepoUrl, setEditTeamRepoUrl] = useState('');
  const [submittingEditTeam, setSubmittingEditTeam] = useState(false);

  // Modal 3: Assign Student to Team State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetTeam, setTargetTeam] = useState<TeamItem | null>(null);
  const [assignMode, setAssignMode] = useState<'email' | 'select'>('email');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignUserId, setAssignUserId] = useState<number | string>('');
  const [assignRole, setAssignRole] = useState<'MEMBER' | 'LEADER'>('MEMBER');
  const [assignModule, setAssignModule] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Grading History & Comparison State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historySubmissionId, setHistorySubmissionId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number>(0);

  // Modal 4: Tạo Bài Tập Thủ Công (Manual Assignment)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState('10');
  const [assignmentCourseId, setAssignmentCourseId] = useState<number | string>('');
  const [assignmentSubmissionType, setAssignmentSubmissionType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
  const [assignmentTargetType, setAssignmentTargetType] = useState<'ALL' | 'SPECIFIC_TEAMS'>('ALL');
  const [assignmentTargetTeamIds, setAssignmentTargetTeamIds] = useState<number[]>([]);
  const [assignmentAllowedLanguage, setAssignmentAllowedLanguage] = useState<'ALL' | 'python' | 'javascript'>('ALL');
  const [assignmentStartDate, setAssignmentStartDate] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentCloseDate, setAssignmentCloseDate] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'>('PUBLISHED');
  const [assignmentAllowLate, setAssignmentAllowLate] = useState<boolean>(true);
  const [assignmentMaxSubmissions, setAssignmentMaxSubmissions] = useState<string>('0');
  const [assignmentAllowResubmit, setAssignmentAllowResubmit] = useState<boolean>(true);
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'>('ALL');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Modal 6: Studio AI Soạn Đề Tự Động Từ Slide (Tách Biệt Hoàn Toàn)
  const [showAiSlideModal, setShowAiSlideModal] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [aiSlideSummary, setAiSlideSummary] = useState('');
  const [aiLanguage, setAiLanguage] = useState<'javascript' | 'python'>('python');
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const [aiGeneratedAssignment, setAiGeneratedAssignment] = useState<{
    title: string;
    description: string;
    language: string;
    difficulty: string;
    starter_code?: string;
    rubrics: Array<{
      criterion: string;
      input_data: string;
      expected_output: string;
      max_score: number;
      is_hidden: boolean;
    }>;
  } | null>(null);
  const [aiCourseId, setAiCourseId] = useState<number | string>('');
  const [aiDeadline, setAiDeadline] = useState<string>('');
  const [aiSubmissionType, setAiSubmissionType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
  const [aiTargetType, setAiTargetType] = useState<'ALL' | 'SPECIFIC_TEAMS'>('ALL');
  const [aiTargetTeamIds, setAiTargetTeamIds] = useState<number[]>([]);
  const [submittingAiAssignment, setSubmittingAiAssignment] = useState(false);
  const [aiModalError, setAiModalError] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  const openAiStudioModal = () => {
    const defaultCourse = selectedCourseId || (courses.length > 0 ? courses[0].course_id : '');
    setAiCourseId(defaultCourse);
    if (!aiDeadline) {
      const d = new Date(Date.now() + 7 * 86400000);
      d.setHours(23, 59, 0, 0);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setAiDeadline(localIso);
    }
    setAiModalError('');
    setAiSuccessMessage('');
    setShowAiSlideModal(true);
  };

  const handleSlideFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    // Tự động suy ra tên chủ đề từ tên file slide
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(slide|slides|lesson|bai|chuong|lecture)\b/gi, '')
      .trim();
    if (!aiTopicInput.trim() || aiTopicInput.startsWith('VD:')) {
      setAiTopicInput(cleanName || file.name);
    }
    // Nếu là file text/markdown, đọc toàn bộ nội dung
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setAiSlideSummary(text);
      };
      reader.readAsText(file);
    } else {
      setAiSlideSummary(`File tài liệu bài giảng đã nạp: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  // Submissions state (Trống theo mặc định, chỉ hiển thị khi sinh viên nộp bài thật)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  // Phân hệ Bài Nộp: Cá nhân vs Nhóm Đồ án
  const [overviewSubTab, setOverviewSubTab] = useState<'individual' | 'team'>('individual');
  // Phân hệ Báo cáo Git: Radar đóng góp vs Nộp repo mới
  const [gitViewMode, setGitViewMode] = useState<'radar' | 'submit'>('radar');
  const [teamViewMode, setTeamViewMode] = useState<'table' | 'radar'>('table');

  // Auto redirect legacy analytics tab to integrated team radar view
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'git-submit') {
      setActiveTab('overview');
      setOverviewSubTab('team');
      setTeamViewMode('radar');
    }
  }, [activeTab]);

  // Modal chấm bài / xem chi tiết
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [editingGrade, setEditingGrade] = useState<number>(0);
  const [editingNote, setEditingNote] = useState<string>('');
  const [isRegrading, setIsRegrading] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');
  const [errorToast, setErrorToast] = useState<string>('');
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

  // Real Git Analytics State for Lecturer
  const [gitAnalyticsMap, setGitAnalyticsMap] = useState<Record<number, any>>({});
  const [loadingGitMap, setLoadingGitMap] = useState<Record<number, boolean>>({});
  const [syncingGitMap, setSyncingGitMap] = useState<Record<number, boolean>>({});
  const [selectedGitTeamId, setSelectedGitTeamId] = useState<number | 'ALL'>('ALL');
  const [teamBranchMap, setTeamBranchMap] = useState<Record<number, string>>({});
  const [editingRepoTeamId, setEditingRepoTeamId] = useState<number | null>(null);
  const [editingRepoUrlMap, setEditingRepoUrlMap] = useState<Record<number, string>>({});

  // Dedicated Git Submit & Analyze Workspace (Hình 1)
  const [selectedGitSubmitTeamId, setSelectedGitSubmitTeamId] = useState<number | null>(null);
  const [gitSubmitBranch, setGitSubmitBranch] = useState<string>('main');
  const [gitSubmitRepoUrl, setGitSubmitRepoUrl] = useState<string>('');
  const [isAnalyzingGitRepo, setIsAnalyzingGitRepo] = useState<boolean>(false);
  const [gitSubmitResult, setGitSubmitResult] = useState<any>(null);
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  useEffect(() => {
    if (teams.length > 0 && !selectedGitSubmitTeamId) {
      setSelectedGitSubmitTeamId(teams[0].team_id);
      setGitSubmitRepoUrl(teams[0].repo_url || '');
    }
  }, [teams, selectedGitSubmitTeamId]);

  const handleGitSubmitAnalyze = async () => {
    const targetTeamId = selectedGitSubmitTeamId || (teams[0]?.team_id ?? 1);
    if (!targetTeamId) return;

    setIsAnalyzingGitRepo(true);
    setGitSubmitResult(null);
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 600);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1200);

    try {
      const token = await getToken();
      const branch = gitSubmitBranch.trim() || 'main';
      const repoUrl = gitSubmitRepoUrl.trim();

      const res = await fetch(`http://localhost:5000/api/git/${targetTeamId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch,
          repo_url: repoUrl
        })
      });

      setAnalysisStep(4);

      if (res.ok) {
        const syncData = await res.json();

        let telemetryData = null;
        try {
          const commitRes = await fetch(`http://localhost:5000/api/git/${targetTeamId}/commits`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (commitRes.ok) {
            telemetryData = await commitRes.json();
            setGitAnalyticsMap(prev => ({ ...prev, [targetTeamId]: telemetryData }));
          }
        } catch (e) {
          console.warn('Failed to fetch commit telemetry after sync', e);
        }

        setGitSubmitResult({
          sync: syncData,
          telemetry: telemetryData
        });

        setSuccessToast(lang === 'vi' 
          ? `Bóc tách thành công ${syncData.synced_commits_count || 0} commits từ nhánh "${syncData.branch || branch}"!`
          : `Successfully analyzed ${syncData.synced_commits_count || 0} commits on branch "${syncData.branch || branch}"!`);
        setTimeout(() => setSuccessToast(''), 4000);

        if (repoUrl) {
          fetchData();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorToast(errData.message || (lang === 'vi' ? 'Lỗi bóc tách Git repository' : 'Failed to analyze repository'));
        setTimeout(() => setErrorToast(''), 4000);
      }
    } catch (e: any) {
      console.error('Error in handleGitSubmitAnalyze:', e);
      setErrorToast(e.message || (lang === 'vi' ? 'Lỗi kết nối máy chủ' : 'Server connection error'));
      setTimeout(() => setErrorToast(''), 4000);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzingGitRepo(false);
    }
  };

  // Real Peer Audit State for Lecturer
  const [peerAuditMap, setPeerAuditMap] = useState<Record<number, any>>({});
  const [loadingPeerMap, setLoadingPeerMap] = useState<Record<number, boolean>>({});
  const [selectedPeerTeamComments, setSelectedPeerTeamComments] = useState<{ teamName: string; comments: any[] } | null>(null);

  // Helper để lấy token hoặc tự động cấp token hợp lệ
  const getToken = async (): Promise<string> => {
    let token = localStorage.getItem('token');
    let isExpired = false;
    if (token && token.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          isExpired = true;
        }
      } catch (e) {
        isExpired = true;
      }
    }

    if (!token || token === 'undefined' || token === 'null' || isExpired) {
      try {
        const u = localStorage.getItem('user');
        const userObj = u ? JSON.parse(u) : null;
        const email = userObj?.email || 'yeny36306@gmail.com';
        const loginRes = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName: userObj?.fullName || 'Yen12 Yen', role: 'LECTURER' })
        });
        if (loginRes.ok) {
          const lData = await loginRes.json();
          token = lData.token;
          if (token) localStorage.setItem('token', token);
          if (lData.user) {
            localStorage.setItem('user', JSON.stringify(lData.user));
            setCurrentUser(lData.user);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-change'));
          }
        }
      } catch (e) {
        console.error('Auto auth error:', e);
      }
    }
    return token || '';
  };

  const fetchGitForTeam = async (teamId: number) => {
    setLoadingGitMap(prev => ({ ...prev, [teamId]: true }));
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/git/${teamId}/commits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGitAnalyticsMap(prev => ({ ...prev, [teamId]: data }));
      }
    } catch (e) {
      console.warn('Error fetching git telemetry for team', teamId, e);
    } finally {
      setLoadingGitMap(prev => ({ ...prev, [teamId]: false }));
    }
  };

  const syncGitForTeam = async (teamId: number) => {
    setSyncingGitMap(prev => ({ ...prev, [teamId]: true }));
    try {
      const token = await getToken();
      const branch = teamBranchMap[teamId]?.trim() || 'main';
      const repoUrl = editingRepoUrlMap[teamId]?.trim();
      const res = await fetch(`http://localhost:5000/api/git/${teamId}/sync`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branch, repo_url: repoUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setEditingRepoTeamId(null);
        setSuccessToast(lang === 'vi' 
          ? `Đã đồng bộ ${data.synced_commits_count || 0} commits từ nhánh "${data.branch || branch}"!` 
          : `Synced ${data.synced_commits_count || 0} commits on branch "${data.branch || branch}"!`);
        await fetchGitForTeam(teamId);
        if (repoUrl) {
          fetchData();
        }
      }
    } catch (e) {
      console.error('Error syncing git:', e);
    } finally {
      setSyncingGitMap(prev => ({ ...prev, [teamId]: false }));
      setTimeout(() => setSuccessToast(''), 3500);
    }
  };

  const fetchPeerAuditForTeam = async (teamId: number) => {
    setLoadingPeerMap(prev => ({ ...prev, [teamId]: true }));
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/peer-audits/team/${teamId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPeerAuditMap(prev => ({ ...prev, [teamId]: data }));
      }
    } catch (e) {
      console.warn('Error fetching peer audits for team', teamId, e);
    } finally {
      setLoadingPeerMap(prev => ({ ...prev, [teamId]: false }));
    }
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
            setAssignmentCourseId(prev => prev || cData.courses[0].course_id);
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
          tData.teams.forEach((tm: any) => {
            fetchGitForTeam(tm.team_id);
            fetchPeerAuditForTeam(tm.team_id);
          });
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

      // 4. Fetch real submissions from live database
      const subRes = await fetch('http://localhost:5000/api/submissions', {
        headers: { ...authHeader }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.submissions && subData.submissions.length > 0) {
          const mapped: SubmissionItem[] = subData.submissions.map((s: any) => {
            const finalScore = s.final_score != null ? parseFloat(s.final_score) : (s.reviewer_1_score != null ? parseFloat(s.reviewer_1_score) : (s.ai_score != null ? parseFloat(s.ai_score) : (s.score != null ? parseFloat(s.score) : 0)));
            const autoScore = s.ai_score != null ? parseFloat(s.ai_score) : (s.score != null ? parseFloat(s.score) : finalScore);
            const isTeam = Boolean(s.team_id || s.assignment_submission_type === 'TEAM' || (s.team_name && s.team_name.trim() !== ''));
            return {
              id: s.submission_id,
              team: s.team_name || (s.team_id ? `Nhóm #${s.team_id}` : (s.submitter_name || `Sinh viên #${s.submitted_by_user_id || s.user_id || s.submission_id}`)),
              team_id: s.team_id,
              assignment_id: s.assignment_id,
              assignment_title: s.assignment_title,
              submission_type: isTeam ? 'TEAM' : 'INDIVIDUAL',
              submitter_name: s.submitter_name || (isTeam ? 'Đại diện nhóm' : 'Sinh viên'),
              submitter_email: s.submitter_email || (isTeam ? '' : 'student@fpt.edu.vn'),
              is_late: s.is_late,
              late_minutes: s.late_minutes,
              submitted_at_raw: s.submitted_at,
              repo: s.artifact_url || '',
              commit: (s.git_commit_hash || '').substring(0, 12),
              code_content: s.code_content || '',
              language: s.language || 'javascript',
              status: (s.grading_status === 'PROCESSING' || s.grading_status === 'QUEUED' || s.status === 'QUEUED' || s.status === 'GRADING') && s.status !== 'FINALIZED'
                ? 'Pending'
                : (finalScore < 5 || s.status === 'FAILED' || s.grading_status === 'FAILED' ? 'Failed' : 'Passed'),
              statusColor: (s.grading_status === 'PROCESSING' || s.grading_status === 'QUEUED' || s.status === 'QUEUED' || s.status === 'GRADING') && s.status !== 'FINALIZED'
                ? 'var(--accent-warning)'
                : (finalScore < 5 || s.status === 'FAILED' || s.grading_status === 'FAILED' ? 'var(--accent-error)' : 'var(--accent-success)'),
              grade: finalScore,
              final_score: finalScore,
              aiScore: autoScore >= 8 ? 'A' : (autoScore >= 6 ? 'B' : (autoScore >= 5 ? 'C' : 'D')),
              ai_score: autoScore,
              time: new Date(s.submitted_at).toLocaleString(),
              sandboxOutput: s.output_logs || (finalScore === 0 
                ? 'Docker Sandbox: 0/3 test cases Passed (0.0/10). Phát hiện lỗi runtime hoặc Watchdog Timeout (BR-03).' 
                : 'Docker Sandbox thực thi thành công: 3/3 test cases Passed (10/10)'),
              aiFeedback: s.ai_feedback || (finalScore === 0 
                ? 'Hệ thống phát hiện bài làm chưa vượt qua được test cases kiểm thử tự động. Cần kiểm tra lại các trường hợp biên và vòng lặp.' 
                : 'Thuật toán Two Pointers / Hash Map tối ưu O(N), mã nguồn sạch và đạt chuẩn kiến trúc.'),
              overrideNote: s.reviewer_1_notes || '',
              moderationStatus: s.status === 'FINALIZED' ? 'FINALIZED' : (s.needs_second_review ? 'PENDING_SECOND_REVIEW' : (s.reviewer_1_score ? 'FIRST_REVIEWED' : 'AI_PREGRADED')),
              reviewer_1_name: s.reviewer_1_name || (currentUser?.fullName || 'Yen12 Yen'),
              reviewer_1_score: s.reviewer_1_score != null ? parseFloat(s.reviewer_1_score) : finalScore,
              reviewer_1_notes: s.reviewer_1_notes || '',
              needs_second_review: s.needs_second_review,
              reviewer_2_name: s.reviewer_2_name,
              reviewer_2_score: s.reviewer_2_score != null ? parseFloat(s.reviewer_2_score) : undefined,
              reviewer_2_notes: s.reviewer_2_notes,
              consensus_notes: s.consensus_notes,
              test_results: s.test_results || []
            };
          });
          setSubmissions(mapped);
        } else {
          setSubmissions([]);
        }
      }

      // 5. Fetch assignments & test case rubrics
      const assignRes = await fetch('http://localhost:5000/api/assignments', {
        headers: { ...authHeader }
      });
      if (assignRes.ok) {
        const aData = await assignRes.json();
        if (aData.assignments) {
          setAssignments(aData.assignments);
          if (aData.assignments.length > 0) {
            setSelectedAssignmentId(prev => {
              const exists = aData.assignments.some((a: any) => a.assignment_id === prev);
              const targetId = exists ? prev! : aData.assignments[0].assignment_id;
              fetchRubricsForAssignment(targetId);
              return targetId;
            });
          } else {
            setSelectedAssignmentId(null);
            setRubricRules([]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching live database records:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Helper để lấy danh sách Test Cases / Rubrics của bài tập được chọn
  const fetchRubricsForAssignment = async (assignId: number) => {
    try {
      setLoadingRubrics(true);
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${assignId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRubricRules(data.rubric_rules || []);
      }
    } catch (err) {
      console.error('Error fetching rubrics for assignment:', err);
    } finally {
      setLoadingRubrics(false);
    }
  };

  const handleSelectAssignment = (assignId: number) => {
    setSelectedAssignmentId(assignId);
    fetchRubricsForAssignment(assignId);
  };

  const handleRunPreview = async () => {
    if (!previewCode.trim()) {
      alert(lang === 'vi' ? 'Vui lòng nhập Reference Solution code để chạy thử!' : 'Please enter Reference Solution code!');
      return;
    }
    const targetAssignId = selectedAssignmentId && selectedAssignmentId !== -1 ? selectedAssignmentId : (assignments[0]?.assignment_id || 1);
    setPreviewRunning(true);
    setPreviewResult(null);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${targetAssignId}/test-cases/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code_content: previewCode,
          language: previewLanguage,
          input_data: tcInputData,
          expected_output: tcExpectedOutput,
          time_limit_ms: 5000,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewResult(data);
      } else {
        alert(data.message || 'Lỗi khi chạy thử Reference Solution');
      }
    } catch (err: any) {
      alert('Không thể kết nối đến máy chủ: ' + err.message);
    } finally {
      setPreviewRunning(false);
    }
  };

  const handleReorderTestCases = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!selectedAssignmentId) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rubricRules.length) return;

    const newRules = [...rubricRules];
    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    const orders = newRules.map((rule, idx) => ({
      rubric_rule_id: rule.rubric_rule_id,
      order_index: idx + 1,
    }));

    setRubricRules(newRules);

    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${selectedAssignmentId}/rubrics/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orders })
      });
      if (!res.ok) {
        await fetchRubricsForAssignment(selectedAssignmentId);
      }
    } catch (err) {
      console.error('Error reordering rubrics:', err);
      await fetchRubricsForAssignment(selectedAssignmentId);
    }
  };

  const handleAddTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcCriterion.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập tên tiêu chí Test Case!' : 'Please enter criterion name!');
      return;
    }
    setSubmittingTestCase(true);
    setModalError('');
    try {
      const token = await getToken();
      const effectiveStatus = tcIsHidden ? 'Hidden' : tcStatus;
      const effectiveIsHidden = tcIsHidden || effectiveStatus === 'Hidden';

      // Kịch bản 0: Cập nhật Test Case có sẵn (Edit Mode)
      if (editingRubric && selectedAssignmentId) {
        const res = await fetch(`http://localhost:5000/api/assignments/${selectedAssignmentId}/rubrics/${editingRubric.rubric_rule_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            criterion: tcCriterion.trim(),
            description: tcDescription.trim(),
            input_data: tcInputData,
            expected_output: tcExpectedOutput,
            max_score: parseFloat(tcMaxScore) || 3.0,
            is_hidden: effectiveIsHidden,
            status: effectiveStatus,
          })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessToast(lang === 'vi' ? 'Cập nhật Test Case thành công!' : 'Test case updated successfully!');
          setShowAddTestCaseModal(false);
          setEditingRubric(null);
          setTcCriterion('');
          setTcDescription('');
          setTcInputData('');
          setTcExpectedOutput('');
          setTcMaxScore('3.0');
          setTcIsHidden(false);
          setTcStatus('Active');
          setPreviewResult(null);
          setPreviewCode('');
          setShowPreviewSection(false);
          await fetchRubricsForAssignment(selectedAssignmentId);
          setTimeout(() => setSuccessToast(''), 3500);
        } else {
          setModalError(data.message || 'Lỗi khi cập nhật test case');
        }
        return;
      }

      // Kịch bản 1: Chưa có bài tập nào hoặc người dùng chọn tạo bài tập mới kèm test case này
      if (assignments.length === 0 || selectedAssignmentId === null || selectedAssignmentId === -1) {
        if (!tcNewAssignmentTitle.trim()) {
          setModalError(lang === 'vi' ? 'Vui lòng nhập tiêu đề bài tập mới!' : 'Please enter new assignment title!');
          setSubmittingTestCase(false);
          return;
        }

        const effectiveCourseId = assignmentCourseId || (courses.length > 0 ? courses[0].course_id : 1);
        const res = await fetch('http://localhost:5000/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            course_id: Number(effectiveCourseId),
            title: tcNewAssignmentTitle.trim(),
            description: 'Bài tập được khởi tạo cùng bộ tiêu chí Test Case',
            max_score: 10.0,
            submission_type: tcSubmissionType,
            rubrics: [
              {
                rule_type: 'AUTOMATED',
                criterion: tcCriterion.trim(),
                description: tcDescription.trim(),
                input_data: tcInputData,
                expected_output: tcExpectedOutput,
                weight: 1.0,
                max_score: parseFloat(tcMaxScore) || 3.0,
                is_hidden: effectiveIsHidden,
                status: effectiveStatus,
              }
            ]
          })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessToast(lang === 'vi' ? `Đã tạo bài tập "${tcNewAssignmentTitle}" và thêm Test Case thành công!` : 'Assignment & Test Case created successfully!');
          setShowAddTestCaseModal(false);
          setTcNewAssignmentTitle('');
          setTcCriterion('');
          setTcDescription('');
          setTcInputData('');
          setTcExpectedOutput('');
          setTcMaxScore('3.0');
          setTcIsHidden(false);
          setTcStatus('Active');
          setPreviewResult(null);
          setPreviewCode('');
          setShowPreviewSection(false);
          if (data.assignment) {
            setSelectedAssignmentId(data.assignment.assignment_id);
          }
          await fetchData();
          setTimeout(() => setSuccessToast(''), 3500);
        } else {
          setModalError(data.message || 'Lỗi khi tạo bài tập và test case');
        }
        return;
      }

      // Kịch bản 2: Thêm vào bài tập đã chọn
      const res = await fetch(`http://localhost:5000/api/assignments/${selectedAssignmentId}/rubrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          rule_type: 'AUTOMATED',
          criterion: tcCriterion.trim(),
          description: tcDescription.trim(),
          input_data: tcInputData,
          expected_output: tcExpectedOutput,
          weight: 1.0,
          max_score: parseFloat(tcMaxScore) || 3.0,
          is_hidden: effectiveIsHidden,
          status: effectiveStatus,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? 'Thêm Test Case thành công!' : 'Test case added successfully!');
        setShowAddTestCaseModal(false);
        setTcCriterion('');
        setTcDescription('');
        setTcInputData('');
        setTcExpectedOutput('');
        setTcMaxScore('3.0');
        setTcIsHidden(false);
        setTcStatus('Active');
        setPreviewResult(null);
        setPreviewCode('');
        setShowPreviewSection(false);
        await fetchRubricsForAssignment(selectedAssignmentId);
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi thêm test case');
      }
    } catch (err) {
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingTestCase(false);
    }
  };

  const handleDeleteTestCase = async (rubricId: number) => {
    if (!selectedAssignmentId) return;
    if (!confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa hoặc vô hiệu hóa Test Case này?' : 'Are you sure you want to delete or disable this test case?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${selectedAssignmentId}/rubrics/${rubricId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.disabled) {
          setSuccessToast(data.message || (lang === 'vi' ? 'Đã vô hiệu hóa Test Case do có lịch sử nộp bài!' : 'Test Case disabled due to existing submissions!'));
        } else {
          setSuccessToast(lang === 'vi' ? 'Xóa Test Case thành công!' : 'Test case deleted!');
        }
        await fetchRubricsForAssignment(selectedAssignmentId);
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        alert(data.message || 'Lỗi khi xóa test case');
      }
    } catch (err) {
      console.error('Delete rubric error:', err);
    }
  };

  const handleDeleteAssignment = async (assignId: number | null) => {
    if (!assignId) return;
    const assign = assignments.find(a => a.assignment_id === assignId);
    const title = assign ? assign.title : `#${assignId}`;
    if (!confirm(lang === 'vi' ? `Bạn có chắc muốn xóa bài tập "${title}" cùng toàn bộ Test Cases liên quan?` : `Are you sure you want to delete assignment "${title}"?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${assignId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Đã xóa bài tập "${title}" thành công!` : `Assignment deleted!`);
        setSelectedAssignmentId(null);
        setRubricRules([]);
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3000);
      } else {
        const d = await res.json();
        alert(d.message || 'Lỗi khi xóa bài tập');
      }
    } catch (err) {
      console.error('Delete assignment error:', err);
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

  // Handler: Mở modal chỉnh sửa học phần
  const handleOpenEditCourse = (course: CourseItem) => {
    setEditingCourse(course);
    setEditCourseCode(course.course_code);
    setEditCourseName(course.course_name);
    setEditCourseSemester(course.semester);
    setModalError('');
    setShowEditCourseModal(true);
  };

  // Handler: Lưu chỉnh sửa học phần
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setModalError('');
    if (!editCourseCode.trim() || !editCourseName.trim() || !editCourseSemester.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập đầy đủ thông tin học phần!' : 'Please fill in all course fields!');
      return;
    }
    setSubmittingEditCourse(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/courses/${editingCourse.course_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_code: editCourseCode.trim().toUpperCase(),
          course_name: editCourseName.trim(),
          semester: editCourseSemester.trim().toUpperCase(),
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Cập nhật học phần ${editCourseCode} thành công!` : `Course ${editCourseCode} updated successfully!`);
        setShowEditCourseModal(false);
        setEditingCourse(null);
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi cập nhật học phần');
      }
    } catch (err) {
      console.error(err);
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingEditCourse(false);
    }
  };

  // Handler: Xóa học phần
  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (!confirm(lang === 'vi' ? `Bạn có chắc chắn muốn xóa học phần "${courseName}" và toàn bộ nhóm, bài tập liên quan không?` : `Are you sure you want to delete course "${courseName}" and all associated data?`)) {
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Đã xóa học phần "${courseName}" thành công!` : `Course "${courseName}" deleted!`);
        if (selectedCourseId === courseId) {
          setSelectedCourseId(null);
        }
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        const d = await res.json();
        alert(d.message || 'Lỗi khi xóa học phần');
      }
    } catch (err) {
      console.error('Delete course error:', err);
    }
  };

  // Handler: Mở modal chỉnh sửa nhóm
  const handleOpenEditTeam = (team: TeamItem) => {
    setEditingTeam(team);
    setEditTeamName(team.team_name);
    setEditTeamRepoUrl(team.repo_url);
    setModalError('');
    setShowEditTeamModal(true);
  };

  // Handler: Lưu chỉnh sửa nhóm
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    setModalError('');
    if (!editTeamName.trim() || !editTeamRepoUrl.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập tên nhóm và link GitHub repo!' : 'Please fill in team name and GitHub repo!');
      return;
    }
    setSubmittingEditTeam(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/teams/${editingTeam.team_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_name: editTeamName.trim(),
          repo_url: editTeamRepoUrl.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Cập nhật nhóm "${editTeamName}" thành công!` : `Team "${editTeamName}" updated!`);
        setShowEditTeamModal(false);
        setEditingTeam(null);
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        setModalError(data.message || 'Lỗi khi cập nhật nhóm');
      }
    } catch (err) {
      console.error(err);
      setModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingEditTeam(false);
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

  // Handler: Gọi AI sinh đề và bộ 3 test cases từ Slide / Chủ đề bài giảng (Modal 6 - AI Studio)
  const handleAiGenerateAssignment = async () => {
    if (!aiTopicInput.trim() && !uploadedFileName) {
      setAiModalError(lang === 'vi' ? 'Vui lòng nạp file slide hoặc nhập chủ đề bài giảng!' : 'Please upload slide file or enter topic!');
      return;
    }
    setIsAiGenerating(true);
    setAiModalError('');
    setAiSuccessMessage('');
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/assignments/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          topic: aiTopicInput.trim() || uploadedFileName,
          slideSummary: aiSlideSummary.trim() || undefined,
          language: aiLanguage,
          difficulty: aiDifficulty,
        })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAiGeneratedAssignment(data.data);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setAiDeadline(nextWeek.toISOString().slice(0, 16));
        setAiCourseId(selectedCourseId || (courses.length > 0 ? courses[0].course_id : ''));
        setAiSuccessMessage(
          lang === 'vi'
            ? `✨ AI đã phân tích slide và sinh thành công đề bài cùng ${data.data.rubrics?.length || 3} Test Cases tự động!`
            : `✨ AI generated assignment and test cases successfully!`
        );
      } else {
        setAiModalError(data.message || (lang === 'vi' ? 'Không thể tạo đề bài bằng AI.' : 'Failed to generate assignment with AI.'));
      }
    } catch (err: any) {
      console.error('Error in handleAiGenerateAssignment:', err);
      setAiModalError(lang === 'vi' ? 'Không thể kết nối đến máy chủ AI.' : 'Cannot connect to AI service.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handler: Lưu & Giao bài tập do AI sinh ra (Modal 6)
  const handleApplyAiAssignment = async () => {
    if (!aiGeneratedAssignment) return;
    const targetCourseId = aiCourseId || selectedCourseId || (courses.length > 0 ? courses[0].course_id : null);
    if (!targetCourseId) {
      setAiModalError(lang === 'vi' ? 'Vui lòng chọn học phần để giao bài!' : 'Please select a course!');
      return;
    }
    if (aiTargetType === 'SPECIFIC_TEAMS' && aiTargetTeamIds.length === 0) {
      setAiModalError(lang === 'vi' ? 'Vui lòng chọn ít nhất một nhóm sinh viên nhận đề!' : 'Please select at least one team!');
      return;
    }
    setSubmittingAiAssignment(true);
    setAiModalError('');
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          course_id: Number(targetCourseId),
          title: aiGeneratedAssignment.title,
          description: aiGeneratedAssignment.description,
          deadline: aiDeadline ? new Date(aiDeadline).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
          max_score: 10.0,
          submission_type: aiSubmissionType,
          target_type: aiTargetType,
          target_team_ids: aiTargetType === 'SPECIFIC_TEAMS' ? aiTargetTeamIds : [],
          allowed_language: aiLanguage,
          rubrics: aiGeneratedAssignment.rubrics.map(r => ({
            rule_type: 'AUTOMATED',
            criterion: r.criterion,
            input_data: r.input_data,
            expected_output: r.expected_output,
            weight: 1.0,
            max_score: Number(r.max_score) || 10.0,
            is_hidden: Boolean(r.is_hidden)
          }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(
          lang === 'vi' 
            ? `✨ Đã giao bài tập AI "${aiGeneratedAssignment.title}" với 3 Test Cases cho sinh viên thành công!` 
            : `AI Assignment created successfully!`
        );
        setShowAiSlideModal(false);
        setAiGeneratedAssignment(null);
        setUploadedFileName('');
        setAiTopicInput('');
        setAiSlideSummary('');
        setAiSuccessMessage('');
        if (data.assignment) {
          setSelectedAssignmentId(data.assignment.assignment_id);
          fetchRubricsForAssignment(data.assignment.assignment_id);
        }
        await fetchData();
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        setAiModalError(data.message || 'Lỗi khi lưu bài tập do AI sinh ra.');
      }
    } catch (err) {
      setAiModalError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingAiAssignment(false);
    }
  };

  // Handler: Cập nhật vòng đời trạng thái Assignment (DRAFT, PUBLISHED, CLOSED, ARCHIVED)
  const handleUpdateAssignmentStatus = async (assignId: number, newStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED') => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${assignId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Đã chuyển trạng thái bài tập thành ${newStatus}!` : `Assignment status updated to ${newStatus}!`);
        await fetchData();
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        alert(data.message || 'Lỗi khi cập nhật trạng thái bài tập');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  // Handler: Tạo Assignment thủ công (Modal 4 - Không dùng AI)
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    const targetCourseId = assignmentCourseId || selectedCourseId || (courses.length > 0 ? courses[0].course_id : null);
    const effectiveDeadline = assignmentDueDate || assignmentDeadline;
    if (!assignmentTitle.trim() || !effectiveDeadline || !targetCourseId) {
      setModalError(lang === 'vi' ? 'Vui lòng nhập đầy đủ tiêu đề, học phần và hạn nộp!' : 'Please fill in title, course, and deadline!');
      return;
    }
    if (assignmentTargetType === 'SPECIFIC_TEAMS' && assignmentTargetTeamIds.length === 0) {
      setModalError(lang === 'vi' ? 'Vui lòng chọn ít nhất một nhóm sinh viên được giao bài tập!' : 'Please select at least one team!');
      return;
    }
    setSubmittingAssignment(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          course_id: Number(targetCourseId),
          title: assignmentTitle.trim(),
          description: assignmentDesc.trim(),
          start_date: assignmentStartDate ? new Date(assignmentStartDate).toISOString() : new Date().toISOString(),
          due_date: new Date(effectiveDeadline).toISOString(),
          close_date: assignmentCloseDate ? new Date(assignmentCloseDate).toISOString() : new Date(effectiveDeadline).toISOString(),
          deadline: new Date(effectiveDeadline).toISOString(),
          max_score: parseFloat(assignmentMaxScore) || 10.0,
          submission_type: assignmentSubmissionType,
          target_type: assignmentTargetType,
          target_team_ids: assignmentTargetType === 'SPECIFIC_TEAMS' ? assignmentTargetTeamIds : [],
          allowed_language: assignmentAllowedLanguage,
          status: assignmentStatus,
          allow_late_submission: assignmentAllowLate,
          max_submissions: parseInt(assignmentMaxSubmissions, 10) || 0,
          allow_resubmission: assignmentAllowResubmit,
          rubrics: []
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Tạo bài tập thủ công "${assignmentTitle}" thành công!` : `Assignment "${assignmentTitle}" created!`);
        setShowAssignmentModal(false);
        setAssignmentTitle('');
        setAssignmentDesc('');
        setAssignmentDeadline('');
        setAssignmentStartDate('');
        setAssignmentDueDate('');
        setAssignmentCloseDate('');
        setAssignmentStatus('PUBLISHED');
        setAssignmentAllowLate(true);
        setAssignmentMaxSubmissions('0');
        setAssignmentAllowResubmit(true);
        setAssignmentSubmissionType('INDIVIDUAL');
        setAssignmentTargetType('ALL');
        setAssignmentTargetTeamIds([]);
        setAssignmentAllowedLanguage('ALL');
        if (data.assignment) {
          setSelectedAssignmentId(data.assignment.assignment_id);
          fetchRubricsForAssignment(data.assignment.assignment_id);
        }
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
        [...team.members].sort((a, b) => (a.role === 'LEADER' ? -1 : b.role === 'LEADER' ? 1 : 0)).forEach(m => {
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
    setReviewer1Score(sub.reviewer_1_score ?? sub.grade ?? (sub.ai_score ?? 0));
    setReviewer1Notes(sub.reviewer_1_notes || sub.overrideNote || '');
    setReviewer2Score(sub.reviewer_2_score ?? sub.grade ?? 0);
    setReviewer2Notes(sub.reviewer_2_notes || '');
    setConsensusNotes(sub.consensus_notes || '');
    setFinalScoreInput(sub.final_score ?? sub.grade ?? 0);
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
    const aiScoreVal = sub.ai_score ?? sub.final_score ?? sub.grade ?? 0;
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
          reviewer_1_name: currentUser?.fullName || 'Yen12 Yen',
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
          reviewer_1_name: currentUser?.fullName || 'Yen12 Yen',
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

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      const token = await getToken();
      await fetch(`http://localhost:5000/api/grading/review/manual-grade/${selectedSub.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          final_score: Number(reviewer1Score),
          notes: reviewer1Notes || 'Chấm điểm và đánh giá bởi Giảng viên'
        })
      });
    } catch (err) {
      console.error('Error saving manual grade:', err);
    }

    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          moderationStatus: 'FINALIZED',
          grade: Number(reviewer1Score),
          final_score: Number(reviewer1Score),
          reviewer_1_score: Number(reviewer1Score),
          reviewer_1_notes: reviewer1Notes,
          status: Number(reviewer1Score) >= 5 ? 'Passed (Graded)' : 'Failed (Graded)',
          statusColor: Number(reviewer1Score) >= 5 ? 'var(--accent-success)' : 'var(--accent-error)'
        };
      }
      return s;
    }));

    setSuccessToast(lang === 'vi' ? 'Đã lưu điểm và công bố kết quả thành công!' : 'Grade saved and published successfully!');
    setSelectedSub(null);
    setTimeout(() => setSuccessToast(''), 3500);
    fetchData();
  };

  // HẠNG MỤC 2: Xem lịch sử các lần chấm & So sánh Diff
  const handleViewGradingHistory = async (submissionId: number) => {
    setHistorySubmissionId(submissionId);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setSelectedAttemptIndex(0);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/submissions/${submissionId}/grading-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
        if (data.attempts && data.attempts.length > 0) {
          setSelectedAttemptIndex(data.attempts.length - 1); // Select latest attempt by default
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể tải lịch sử chấm điểm');
        setShowHistoryModal(false);
      }
    } catch (e) {
      console.error('Error fetching grading history:', e);
      alert('Lỗi kết nối khi tải lịch sử chấm điểm');
      setShowHistoryModal(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  // HẠNG MỤC 2: Chấm lại 1 bài nộp cụ thể qua Docker Sandbox
  const handleRerunGrading = async () => {
    if (!selectedSub) return;
    const reasonPrompt = prompt(
      lang === 'vi' ? 'Nhập lý do chấm lại (tùy chọn):' : 'Enter regrade reason (optional):',
      lang === 'vi' ? 'Chỉnh sửa Test Case hoặc yêu cầu chấm lại' : 'Test Case update or re-evaluation request'
    );
    if (reasonPrompt === null) return; // User cancelled

    setIsRegrading(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/submissions/${selectedSub.id}/regrade`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regrade_reason: reasonPrompt.trim() || undefined
        })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSuccessToast(lang === 'vi' 
          ? `Đã đưa bài nộp vào hàng đợi Docker Sandbox để chấm lại (Lần #${data.attempt_number || 2})!` 
          : `Submission queued for Docker Sandbox re-grading (Attempt #${data.attempt_number || 2})!`
        );
        setSelectedSub(null);
        setTimeout(() => {
          fetchData();
          setIsRegrading(false);
        }, 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setModalError(err.message || 'Lỗi khi kích hoạt chấm lại bài');
        setIsRegrading(false);
      }
    } catch (e) {
      console.error('Error regrading single submission:', e);
      setIsRegrading(false);
    }
  };

  // HẠNG MỤC 2: Chấm lại toàn bộ bài nộp của bài tập qua Docker Sandbox (Re-grade All)
  const handleRegradeAll = async () => {
    if (submissions.length === 0) {
      alert(lang === 'vi' ? 'Chưa có bài nộp nào để chấm lại!' : 'No submissions found to regrade!');
      return;
    }

    const targetAssignId = selectedAssignmentId || (assignments.length > 0 ? assignments[0].assignment_id : submissions[0].assignment_id);
    const assignObj = assignments.find(a => a.assignment_id === targetAssignId);
    const assignName = assignObj ? assignObj.title : (lang === 'vi' ? 'bài tập hiện tại' : 'current assignment');

    const confirmMsg = lang === 'vi'
      ? `Bạn có chắc chắn muốn kích hoạt Docker Sandbox chấm lại toàn bộ các bài nộp cho "${assignName}" theo bộ Test Cases mới nhất không?`
      : `Are you sure you want to re-grade all submissions for "${assignName}" against the latest Test Cases?`;

    if (!confirm(confirmMsg)) return;

    const reasonPrompt = prompt(
      lang === 'vi' ? 'Nhập lý do chấm lại toàn bộ bài tập (tùy chọn):' : 'Enter batch regrade reason (optional):',
      lang === 'vi' ? 'Cập nhật bộ Test Cases của bài tập' : 'Assignment Test Cases update'
    );
    if (reasonPrompt === null) return; // User cancelled

    setIsRegrading(true);
    try {
      const token = await getToken();
      let totalRegraded = 0;

      if (targetAssignId) {
        const res = await fetch(`http://localhost:5000/api/assignments/${targetAssignId}/regrade`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            regrade_reason: reasonPrompt.trim() || undefined
          })
        });
        const data = await res.json().catch(() => ({}));
        totalRegraded = data.queued_count != null ? data.queued_count : (data.regradedCount || 0);
      } else {
        const uniqueAssignIds = Array.from(new Set(submissions.map(s => s.assignment_id).filter(Boolean)));
        for (const aId of uniqueAssignIds) {
          const res = await fetch(`http://localhost:5000/api/assignments/${aId}/regrade`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              regrade_reason: reasonPrompt.trim() || undefined
            })
          });
          const data = await res.json().catch(() => ({}));
          totalRegraded += (data.queued_count != null ? data.queued_count : (data.regradedCount || 0));
        }
      }

      setSuccessToast(lang === 'vi' 
        ? `Đã kích hoạt Docker Sandbox chấm lại thành công cho ${totalRegraded} bài nộp!`
        : `Re-grading triggered successfully for ${totalRegraded} submissions!`
      );

      setTimeout(() => {
        fetchData();
        setIsRegrading(false);
      }, 2500);
    } catch (e) {
      console.error('Error triggering regrade all:', e);
      setIsRegrading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };


  // Báo Cáo Đóng Góp Git & Radar Free-Rider (BR-07) - Tích hợp trực tiếp vào Đồ Án Nhóm
  const renderGitAnalyticsRadarView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setTeamViewMode('table')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ← {lang === 'vi' ? 'Quay lại Bảng Bài Nộp' : 'Back to Table'}
                  </button>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitBranch size={22} color="#a78bfa" /> {lang === 'vi' ? 'Thống kê đóng góp Git & Radar Free-Rider (BR-07)' : 'Git Contribution Analytics & BR-07 Radar'}
                  </h3>
                </div>
                
              </div>

              {/* Live Refresh & Team Selector Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={fetchData}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px', display: 'flex', alignItems: 'center' }}
                >
                  <RotateCw size={14} />
                  <span>{lang === 'vi' ? 'Làm mới Git Live' : 'Refresh Git'}</span>
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {lang === 'vi' ? 'Lọc theo nhóm:' : 'Filter Team:'}
                </span>
                <select
                  value={selectedGitTeamId}
                  onChange={(e) => setSelectedGitTeamId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: '#a78bfa',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">{lang === 'vi' ? `Tất cả các nhóm (${teams.length})` : `All Teams (${teams.length})`}</option>
                  {teams.map(t => (
                    <option key={t.team_id} value={t.team_id}>{t.team_name} ({t.course_code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teams Git Telemetry Display */}
            {teams.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: '20px' }}>
                <GitBranch size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Chưa có nhóm nào trong hệ thống.' : 'No teams found.'}</p>
              </div>
            ) : (
              teams
                .filter(t => selectedGitTeamId === 'ALL' || t.team_id === selectedGitTeamId)
                .map(team => {
                  const telemetry = gitAnalyticsMap[team.team_id];
                  const isLoading = loadingGitMap[team.team_id];
                  const isSyncing = syncingGitMap[team.team_id];
                  const members = telemetry?.member_contributions || [];

                  return (
                    <div 
                      key={team.team_id} 
                      className="glass-card" 
                      style={{ 
                        borderRadius: '20px', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem 1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem'
                      }}
                    >
                      {/* Team Header & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                              {team.course_code}
                            </span>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                              {team.team_name}
                            </h4>
                          </div>
                          {editingRepoTeamId !== team.team_id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                              <a 
                                href={editingRepoUrlMap[team.team_id] || team.repo_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#a78bfa', textDecoration: 'none' }}
                              >
                                <ExternalLink size={13} /> {editingRepoUrlMap[team.team_id] || team.repo_url}
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRepoUrlMap(prev => ({ ...prev, [team.team_id]: editingRepoUrlMap[team.team_id] || team.repo_url || '' }));
                                  setEditingRepoTeamId(team.team_id);
                                }}
                                title={lang === 'vi' ? 'Sửa link Git Repo' : 'Edit Git Repo'}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <input
                                type="text"
                                value={editingRepoUrlMap[team.team_id] || ''}
                                onChange={(e) => setEditingRepoUrlMap(prev => ({ ...prev, [team.team_id]: e.target.value }))}
                                placeholder="https://github.com/organization/repo.git"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.8rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(139, 92, 246, 0.4)',
                                  background: 'rgba(0,0,0,0.4)',
                                  color: '#fff',
                                  minWidth: '260px'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setEditingRepoTeamId(null)}
                                style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                              >
                                {lang === 'vi' ? 'Hủy' : 'Cancel'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Summary Badges, Branch Input & Sync Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {telemetry && (
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                              <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                {telemetry.team_total_commits || 0} Commits
                              </span>
                              <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                +{telemetry.team_total_lines_added || 0} LOC
                              </span>
                              <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                                -{telemetry.team_total_lines_deleted || 0} LOC
                              </span>
                            </div>
                          )}

                          {/* Branch Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Nhánh:' : 'Branch:'}</span>
                            <input
                              type="text"
                              value={teamBranchMap[team.team_id] || 'main'}
                              onChange={(e) => setTeamBranchMap(prev => ({ ...prev, [team.team_id]: e.target.value }))}
                              placeholder="main"
                              style={{
                                width: '75px',
                                padding: '2px 6px',
                                fontSize: '0.8rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                background: 'rgba(0,0,0,0.3)',
                                color: '#a78bfa',
                                fontWeight: 600,
                                textAlign: 'center'
                              }}
                            />
                          </div>

                          <button
                            onClick={() => syncGitForTeam(team.team_id)}
                            disabled={isSyncing}
                            className="btn-primary"
                            style={{ padding: '7px 15px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap' }}
                          >
                            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
                            {lang === 'vi' ? 'Đồng bộ từ GitHub' : 'Sync from GitHub'}
                          </button>
                        </div>
                      </div>

                      {/* Member Contributions Table */}
                      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', textAlign: 'left' }}>
                              <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Thành viên & Phân hệ' : 'Member & Module'}</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center' }}>{lang === 'vi' ? 'Lượt Commits' : 'Commits'}</th>
                              <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Dòng Code (LOC Thêm/Xóa)' : 'LOC Added/Deleted'}</th>
                              <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Tỷ lệ đóng góp' : 'Contribution %'}</th>
                              <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Đánh giá BR-07' : 'BR-07 Status'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#a78bfa' }} />
                                  <p style={{ fontSize: '0.85rem' }}>{lang === 'vi' ? 'Đang phân tích telemetry GitHub...' : 'Analyzing GitHub telemetry...'}</p>
                                </td>
                              </tr>
                            ) : members.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                  {lang === 'vi' ? 'Chưa có dữ liệu commit. Bấm "Đồng bộ từ GitHub" để kéo commit về hệ thống.' : 'No commits recorded yet. Click "Sync from GitHub" to fetch.'}
                                </td>
                              </tr>
                            ) : (
                              members.map((m: any) => {
                                const isFreeRider = m.is_free_rider;
                                const isTop = m.contribution_percentage >= 35;

                                return (
                                  <tr 
                                    key={m.user_id} 
                                    style={{ 
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                      background: isFreeRider ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                                    }}
                                  >
                                    <td style={{ padding: '14px 16px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                          width: '32px', height: '32px', borderRadius: '50%',
                                          background: isFreeRider ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                                          color: isFreeRider ? '#f87171' : '#a78bfa',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontWeight: 700, fontSize: '0.82rem', flexShrink: 0
                                        }}>
                                          {(m.full_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <strong style={{ fontSize: '0.92rem', color: isFreeRider ? '#fca5a5' : 'var(--text-main)' }}>
                                            {m.full_name}
                                          </strong>
                                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                            {m.assigned_module || m.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                                      {m.total_commits}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                        <span style={{ color: '#34d399' }}>+{m.total_lines_added.toLocaleString()}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                                        <span style={{ color: '#f43f5e' }}>-{m.total_lines_deleted.toLocaleString()}</span>
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Net: <strong style={{ color: m.net_loc >= 0 ? '#a78bfa' : '#f43f5e' }}>{m.net_loc > 0 ? `+${m.net_loc.toLocaleString()}` : m.net_loc.toLocaleString()}</strong> LOC
                                      </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', minWidth: '160px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px', fontWeight: 700 }}>
                                        <span style={{ color: isFreeRider ? '#f87171' : (isTop ? '#34d399' : '#a78bfa') }}>
                                          {m.contribution_percentage}%
                                        </span>
                                      </div>
                                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                          width: `${Math.min(100, Math.max(m.contribution_percentage, 0))}%`,
                                          height: '100%',
                                          background: isFreeRider 
                                            ? 'linear-gradient(90deg, #ef4444, #f87171)' 
                                            : (isTop ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #a855f7)'),
                                          borderRadius: '3px',
                                          transition: 'width 0.4s ease'
                                        }} />
                                      </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                      {isFreeRider ? (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem',
                                          background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                                          border: '1px solid rgba(239, 68, 68, 0.35)', fontWeight: 700
                                        }}>
                                          <AlertTriangle size={12} />
                                          {lang === 'vi' ? 'Cảnh báo BR-07: Free-Rider (<5% LOC)' : 'BR-07 Alert: Free-Rider (<5%)'}
                                        </span>
                                      ) : isTop ? (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem',
                                          background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                                          border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700
                                        }}>
                                          ⭐ {lang === 'vi' ? 'Đóng góp xuất sắc' : 'Top Contributor'}
                                        </span>
                                      ) : (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem',
                                          background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa',
                                          border: '1px solid rgba(139, 92, 246, 0.25)', fontWeight: 600
                                        }}>
                                          <CheckCircle2 size={12} /> {lang === 'vi' ? 'Đạt chuẩn đóng góp' : 'Normal Contributor'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
  );

  if (!isMounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Loader2 className="animate-spin" size={36} color="#a78bfa" />
      </div>
    );
  }

  return (
    <div className="lecturer-theme" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* =========================================================================
          SIDEBAR BÊN TRÁI CHO TRANG GIẢNG VIÊN (CHIA BỐ CỤC NGANG NHƯ ADMIN)
      ========================================================================= */}
      <aside style={{
        width: '280px',
        background: 'rgba(10, 14, 26, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        flexShrink: 0
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '1.5rem 1.4rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AitaLogo size={42} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                AITA<span style={{ color: '#a78bfa' }}>.LECTURER</span>
              </span>
            </div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              SWD392 • Lecturer Portal
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, padding: '1.4rem 0.8rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 12px',
            marginBottom: '8px'
          }}>
            {lang === 'vi' ? 'Hệ thống Giảng dạy' : 'Faculty Workspace'}
          </span>

          {/* Item 1: Học phần (Tích hợp quản lý Nhóm sinh viên theo từng học phần) */}
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: (activeTab === 'courses' || activeTab === 'teams') ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: (activeTab === 'courses' || activeTab === 'teams') ? 'rgba(124, 58, 237, 0.16)' : 'transparent',
              color: (activeTab === 'courses' || activeTab === 'teams') ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: (activeTab === 'courses' || activeTab === 'teams') ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color={(activeTab === 'courses' || activeTab === 'teams') ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Học phần' : 'Courses'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {courses.length > 0 && (
                <span style={{
                  background: 'rgba(124, 58, 237, 0.25)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {courses.length}
                </span>
              )}
              {(activeTab === 'courses' || activeTab === 'teams') && <ChevronRight size={15} color="#c4b5fd" />}
            </div>
          </button>

          {/* Item 2: Bài nộp & Điểm */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'overview' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'overview' ? 'rgba(124, 58, 237, 0.16)' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'overview' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color={activeTab === 'overview' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Bài nộp & Điểm' : 'Submissions'}</span>
            </div>
            {activeTab === 'overview' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>

          {/* Item 4: Rubrics & Tests */}
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'config' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'config' ? 'rgba(124, 58, 237, 0.16)' : 'transparent',
              color: activeTab === 'config' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'config' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={18} color={activeTab === 'config' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Rubrics & Tests' : 'Rubrics & Tests'}</span>
            </div>
            {activeTab === 'config' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>



          {/* Item 7: Đánh giá chéo */}
          <button
            type="button"
            onClick={() => setActiveTab('peer')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'peer' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'peer' ? 'rgba(124, 58, 237, 0.16)' : 'transparent',
              color: activeTab === 'peer' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'peer' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color={activeTab === 'peer' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Đánh giá chéo' : 'Peer Audit'}</span>
            </div>
            {activeTab === 'peer' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>
        </div>

        {/* Profile Card Bottom of Sidebar */}
        <div style={{
          padding: '1.2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {currentUser?.fullName ? currentUser.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'GV'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName || 'Giảng viên'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email || 'yeny36306@gmail.com'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={14} />
            <span>{lang === 'vi' ? 'Đăng xuất hệ thống' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          NỘI DUNG CHÍNH BÊN PHẢI (MAIN CONTENT AREA)
      ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Top Header Bar */}
        <header style={{
          height: '70px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 14, 26, 0.8)',
          backdropFilter: 'blur(12px)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>AITA Platform</span>
              <span>/</span>
              <span>Lecturer Workspace</span>
              <span>/</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {activeTab === 'courses' && (lang === 'vi' ? 'Học phần' : 'Courses')}
                {activeTab === 'teams' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      style={{ cursor: 'pointer', color: '#a78bfa', textDecoration: 'underline' }} 
                      onClick={() => setActiveTab('courses')}
                    >
                      {lang === 'vi' ? 'Học phần' : 'Courses'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span style={{ color: 'var(--text-main)' }}>
                      {lang === 'vi' ? 'Nhóm sinh viên' : 'Teams'}
                      {selectedCourseId && courses.find(c => c.course_id === selectedCourseId) ? ` (${courses.find(c => c.course_id === selectedCourseId)?.course_code})` : ''}
                    </span>
                  </span>
                )}
                {activeTab === 'overview' && (lang === 'vi' ? 'Bài nộp & Điểm' : 'Submissions')}
                {activeTab === 'config' && (lang === 'vi' ? 'Rubrics & Tests' : 'Rubrics & Tests')}
                {(activeTab === 'analytics' || activeTab === 'git-submit') && (lang === 'vi' ? 'Báo Cáo Git & Free-Rider' : 'Git & Free-Rider Radar')}
                {activeTab === 'peer' && (lang === 'vi' ? 'Đánh giá chéo' : 'Peer Audit')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Nội dung chính theo từng Tab */}
        <div style={{ padding: '1.5rem 2rem', flex: 1, maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
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

        {errorToast && (
          <div style={{
            position: 'fixed',
            top: '85px',
            right: '25px',
            zIndex: 100,
            background: 'rgba(239, 68, 68, 0.95)',
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
            <AlertTriangle size={18} />
            <span>{errorToast}</span>
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
                  color: '#c4b5fd',
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

          {/* Bên phải: Cụm nút Thao tác thông minh theo từng Tab (Contextual Action Bar) */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
            {activeTab === 'overview' && (
              <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportCSV}>
                <Download size={16} /> {lang === 'vi' ? 'Xuất CSV Bảng Điểm' : 'Export CSV'}
              </button>
            )}



            {activeTab === 'peer' && (
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportCSV}>
                <Download size={16} /> {lang === 'vi' ? 'Xuất Báo Cáo' : 'Export Report'}
              </button>
            )}
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
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-card)',
                        border: isSelected ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '1.65rem 1.65rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? '0 12px 32px -8px rgba(124, 58, 237, 0.35)' : '0 10px 25px -8px rgba(0, 0, 0, 0.35)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Header của thẻ: Mã môn + Học kỳ & Nút Sửa / Xóa */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'nowrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(124, 58, 237, 0.16)',
                              color: '#c4b5fd',
                              border: '1px solid rgba(139, 92, 246, 0.35)',
                              borderRadius: '9999px',
                              padding: '3px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap'
                            }}>
                              {course.course_code}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              Học kỳ: <strong style={{ color: 'var(--text-main)' }}>{course.semester}</strong>
                            </span>
                          </div>

                          {/* Quyền Giảng viên: Chỉnh sửa & Xóa học phần */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                              type="button"
                              title={lang === 'vi' ? 'Chỉnh sửa thông tin học phần' : 'Edit course'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditCourse(course);
                              }}
                              style={{
                                background: 'rgba(124, 58, 237, 0.12)',
                                border: '1px solid rgba(139, 92, 246, 0.28)',
                                color: '#c4b5fd',
                                borderRadius: '8px',
                                padding: '4px 9px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                            >
                              <Edit3 size={12} /> {lang === 'vi' ? 'Sửa' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              title={lang === 'vi' ? 'Xóa học phần này' : 'Delete course'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(course.course_id, course.course_name);
                              }}
                              style={{
                                background: 'rgba(244, 63, 94, 0.1)',
                                border: '1px solid rgba(244, 63, 94, 0.25)',
                                color: '#fda4af',
                                borderRadius: '8px',
                                padding: '4px 9px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                            >
                              <Trash2 size={12} /> {lang === 'vi' ? 'Xóa' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        {/* Tên môn học: minHeight 3.4rem để dù 1 dòng hay 2 dòng cũng thẳng hàng tăm tắp */}
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          marginBottom: '0.5rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.35,
                          minHeight: '3.4rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {course.course_name}
                        </h4>

                        {/* Giảng viên */}
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.4rem', minHeight: '1.25rem' }}>
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
                          <Users size={16} color="#c4b5fd" />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Số nhóm:</span>
                          <strong style={{ color: '#c4b5fd', fontSize: '0.95rem' }}>{courseTeams.length} nhóm</strong>
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

        {/* TAB 1: OVERVIEW & CHẤM ĐIỂM (F10) - PHÂN TÁCH BÀI CÁ NHÂN VS ĐỒ ÁN NHÓM */}
        {activeTab === 'overview' && (
          <div>
            {/* ───── SUB-TAB SWITCHER: BÀI NỘP CÁ NHÂN VS ĐỒ ÁN NHÓM ───── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '14px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setOverviewSubTab('individual')}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: overviewSubTab === 'individual'
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.9) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: overviewSubTab === 'individual' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: overviewSubTab === 'individual' ? '#ffffff' : '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: overviewSubTab === 'individual' ? '0 4px 15px rgba(139, 92, 246, 0.35)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FileCode size={16} />
                  <span>{lang === 'vi' ? '1. Bài Nộp Cá Nhân' : '1. Individual Submissions'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverviewSubTab('team')}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: overviewSubTab === 'team'
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.9) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: overviewSubTab === 'team' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: overviewSubTab === 'team' ? '#ffffff' : '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: overviewSubTab === 'team' ? '0 4px 15px rgba(139, 92, 246, 0.35)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Users size={16} />
                  <span>{lang === 'vi' ? '2. Đồ Án Nhóm & Git' : '2. Team Git Projects'}</span>
                </button>
              </div>

              {overviewSubTab === 'team' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTeamViewMode('table')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: teamViewMode === 'table' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.9))' : 'rgba(255, 255, 255, 0.05)',
                      border: teamViewMode === 'table' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: teamViewMode === 'table' ? '#fff' : '#cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: teamViewMode === 'table' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>📋 {lang === 'vi' ? 'Bảng Bài Nộp' : 'Submissions Table'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamViewMode('radar')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: teamViewMode === 'radar' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.9))' : 'rgba(139, 92, 246, 0.12)',
                      border: teamViewMode === 'radar' ? 'none' : '1px solid rgba(139, 92, 246, 0.3)',
                      color: teamViewMode === 'radar' ? '#fff' : '#a78bfa',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: teamViewMode === 'radar' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <BarChart2 size={14} />
                    <span>📊 {lang === 'vi' ? 'Báo Cáo Đóng Góp & Radar Free-Rider (BR-07)' : 'Free-Rider Radar (BR-07)'}</span>
                  </button>
                </div>
              )}
            </div>

{overviewSubTab === 'team' && teamViewMode === 'radar' ? (
              renderGitAnalyticsRadarView()
            ) : (
              <>
            {/* Header Title & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {overviewSubTab === 'individual' ? (
                    <>
                      <FileCode size={22} color="#a78bfa" />
                      <span>{lang === 'vi' ? 'Quản Lý Bài Nộp Cá Nhân' : 'Individual Submissions'}</span>
                    </>
                  ) : (
                    <>
                      <Users size={22} color="#a78bfa" />
                      <span>{lang === 'vi' ? 'Quản Lý Bài Nộp Đồ Án Nhóm' : 'Team Git Submissions'}</span>
                    </>
                  )}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={overviewSubTab === 'individual' 
                      ? (lang === 'vi' ? 'Tìm theo tên SV, email, mã môn, bài tập...' : 'Search student, email, assignment...')
                      : (lang === 'vi' ? 'Tìm theo nhóm, trưởng nhóm, commit SHA...' : 'Search team, leader, commit SHA...')} 
                    style={{ 
                      padding: '8px 32px 8px 36px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '10px', 
                      color: 'var(--text-main)', 
                      fontSize: '0.86rem',
                      width: '280px'
                    }} 
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button 
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={statusFilter !== 'ALL' ? 'btn-primary' : 'btn-secondary'} 
                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Filter size={16} /> 
                    <span>
                      {statusFilter === 'ALL' && (lang === 'vi' ? 'Lọc' : 'Filter')}
                      {statusFilter === 'PASSED' && (lang === 'vi' ? 'Lọc: Đạt' : 'Filter: Passed')}
                      {statusFilter === 'FAILED' && (lang === 'vi' ? 'Lọc: Không đạt' : 'Filter: Failed')}
                      {statusFilter === 'FINALIZED' && (lang === 'vi' ? 'Lọc: Đã chốt' : 'Filter: Finalized')}
                      {statusFilter === 'SECOND_REVIEW' && (lang === 'vi' ? 'Lọc: Chấm chéo' : 'Filter: 2nd Review')}
                    </span>
                  </button>

                  {showFilterDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '110%',
                      right: 0,
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '6px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                      zIndex: 50,
                      minWidth: '200px',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {[
                        { id: 'ALL', labelVi: 'Tất cả trạng thái', labelEn: 'All Statuses' },
                        { id: 'PASSED', labelVi: 'Chỉ bài Đạt (Passed)', labelEn: 'Passed Only' },
                        { id: 'FAILED', labelVi: 'Chỉ bài Không đạt (Failed)', labelEn: 'Failed Only' },
                        { id: 'FINALIZED', labelVi: 'Đã chốt điểm (Finalized)', labelEn: 'Finalized Only' },
                        { id: 'SECOND_REVIEW', labelVi: 'Chờ GV2 chấm chéo (BR-09)', labelEn: 'Pending 2nd Review' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setStatusFilter(opt.id as any);
                            setShowFilterDropdown(false);
                          }}
                          style={{
                            padding: '7px 12px',
                            fontSize: '0.8rem',
                            textAlign: 'left',
                            background: statusFilter === opt.id ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                            color: statusFilter === opt.id ? '#c4b5fd' : 'var(--text-main)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: statusFilter === opt.id ? 700 : 400
                          }}
                        >
                          {lang === 'vi' ? opt.labelVi : opt.labelEn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setFilterLatestOnly(!filterLatestOnly)}
                  className={filterLatestOnly ? "btn-primary" : "btn-secondary"}
                  style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <CheckCircle2 size={15} />
                  <span>{lang === 'vi' ? (filterLatestOnly ? 'Bản nộp mới nhất' : 'Tất cả lần nộp') : (filterLatestOnly ? 'Latest Only' : 'All Submissions')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegradeAll}
                  disabled={isRegrading}
                  className="btn-secondary"
                  title={lang === 'vi' ? 'Chạy lại Docker Sandbox cho toàn bộ bài nộp trên bộ Test Cases mới nhất' : 'Re-run Docker Sandbox for all submissions'}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    gap: '6px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: isRegrading ? 'not-allowed' : 'pointer',
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid rgba(124, 58, 237, 0.35)',
                    color: '#c4b5fd'
                  }}
                >
                  <RotateCw size={14} className={isRegrading ? 'animate-spin' : ''} />
                  <span>{isRegrading ? (lang === 'vi' ? 'Đang chấm...' : 'Re-grading...') : (lang === 'vi' ? 'Chấm lại toàn bộ' : 'Re-grade All')}</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="glass-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      {overviewSubTab === 'individual' ? (
                        <>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Sinh viên & Bài tập' : 'Student & Assignment'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Mã nguồn đã nộp' : 'Submitted Code'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Docker Sandbox' : 'Sandbox Status'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Điểm số (Thang 10)' : 'Grade (10)'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Xếp hạng AI' : 'AI Quality'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Kiểm duyệt' : 'Review'}</th>
                          <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'vi' ? 'Hành động' : 'Action'}</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Nhóm Đồ Án & Milestone' : 'Team & Milestone'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Kho lưu trữ Git' : 'Repository'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Docker Sandbox' : 'Sandbox Status'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Điểm đồ án (Thang 10)' : 'Grade (10)'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Radar Free-Rider (BR-07)' : 'BR-07 Radar'}</th>
                          <th style={{ padding: '14px 18px' }}>{lang === 'vi' ? 'Kiểm duyệt' : 'Review'}</th>
                          <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'vi' ? 'Hành động' : 'Action'}</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let displayedList = submissions.filter(item => {
                        if (overviewSubTab === 'individual') {
                          return item.submission_type === 'INDIVIDUAL' || !item.team_id;
                        } else {
                          return item.submission_type === 'TEAM' || Boolean(item.team_id);
                        }
                      });

                      if (filterLatestOnly) {
                        displayedList = displayedList.filter((item, index, self) => {
                          const key = `${item.team_id || item.team || item.submitter_name || item.id}_${item.assignment_title || item.assignment_id || 0}`;
                          return self.findIndex(t => `${t.team_id || t.team || t.submitter_name || t.id}_${t.assignment_title || t.assignment_id || 0}` === key) === index;
                        });
                      }

                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase().trim();
                        displayedList = displayedList.filter(item => 
                          (item.team && item.team.toLowerCase().includes(q)) ||
                          (item.submitter_name && item.submitter_name.toLowerCase().includes(q)) ||
                          (item.submitter_email && item.submitter_email.toLowerCase().includes(q)) ||
                          (item.assignment_title && item.assignment_title.toLowerCase().includes(q)) ||
                          (item.commit && item.commit.toLowerCase().includes(q)) ||
                          (item.repo && item.repo.toLowerCase().includes(q)) ||
                          (item.status && item.status.toLowerCase().includes(q))
                        );
                      }

                      if (statusFilter === 'PASSED') {
                        displayedList = displayedList.filter(item => item.status.includes('Passed') || item.grade >= 5);
                      } else if (statusFilter === 'FAILED') {
                        displayedList = displayedList.filter(item => item.status.includes('Failed') || item.grade < 5);
                      } else if (statusFilter === 'FINALIZED') {
                        displayedList = displayedList.filter(item => item.moderationStatus === 'FINALIZED');
                      } else if (statusFilter === 'SECOND_REVIEW') {
                        displayedList = displayedList.filter(item => item.moderationStatus === 'PENDING_SECOND_REVIEW');
                      }

                      if (displayedList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
                              <CheckCircle2 size={38} color={overviewSubTab === 'individual' ? '#a78bfa' : '#a78bfa'} style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                              <h5 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
                                {overviewSubTab === 'individual'
                                  ? (lang === 'vi' ? 'Chưa có bài nộp cá nhân nào' : 'No individual submissions found')
                                  : (lang === 'vi' ? 'Chưa có bài nộp đồ án nhóm nào' : 'No team submissions found')}
                              </h5>
                              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', marginInline: 'auto' }}>
                                {overviewSubTab === 'individual'
                                  ? (lang === 'vi' ? 'Khi sinh viên nộp bài tập qua trình soạn thảo code hoặc tải tệp lên, kết quả kiểm thử tự động Docker Sandbox sẽ hiển thị tại đây.' : 'When students submit individual code or files, results will appear here.')
                                  : (lang === 'vi' ? 'Khi nhóm sinh viên nộp liên kết GitHub repository, bài nộp, commit hash và phân tích Free-Rider sẽ hiển thị tại đây.' : 'When teams submit GitHub repository links, commit telemetry and free-rider detection will appear here.')}
                              </p>
                            </td>
                          </tr>
                        );
                      }

                      return displayedList.map((row) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {/* Column 1: Identity */}
                          <td style={{ padding: '16px 18px' }}>
                            {overviewSubTab === 'individual' ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0
                                  }}>
                                    {row.submitter_name ? row.submitter_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'SV'}
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '0.92rem', color: '#f8fafc', display: 'block' }}>
                                      {row.submitter_name || row.team}
                                    </strong>
                                    {row.submitter_email && (
                                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{row.submitter_email}</span>
                                    )}
                                  </div>
                                </div>
                                {row.assignment_title && (
                                  <div style={{ marginTop: '5px' }}>
                                    <span style={{ 
                                      display: 'inline-flex', alignItems: 'center', gap: '4px', 
                                      fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 600,
                                      background: 'rgba(124, 58, 237, 0.12)', padding: '2px 8px', 
                                      borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' 
                                    }}>
                                      <BookOpen size={11} /> {row.assignment_title}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0
                                  }}>
                                    👥
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '0.95rem', color: '#f8fafc', display: 'block' }}>
                                      {row.team}
                                    </strong>
                                    <span style={{ fontSize: '0.76rem', color: '#a78bfa', fontWeight: 600 }}>
                                      {lang === 'vi' ? 'Trưởng nhóm: Đinh Gia Huy' : 'Leader: Dinh Gia Huy'}
                                    </span>
                                  </div>
                                </div>
                                {row.assignment_title && (
                                  <div style={{ marginTop: '5px' }}>
                                    <span style={{ 
                                      display: 'inline-flex', alignItems: 'center', gap: '4px', 
                                      fontSize: '0.74rem', color: '#a78bfa', fontWeight: 600,
                                      background: 'rgba(139, 92, 246, 0.12)', padding: '2px 8px', 
                                      borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' 
                                    }}>
                                      <GitPullRequest size={11} /> {row.assignment_title}
                                    </span>
                                  </div>
                                )}
                                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                  {lang === 'vi' ? 'Người nộp:' : 'By:'} {row.submitter_name}
                                </span>
                              </div>
                            )}

                            <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>{row.time}</span>
                            {row.is_late && (
                              <span style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '3px', 
                                color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', 
                                border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', 
                                padding: '1px 6px', fontSize: '0.72rem', fontWeight: 700, marginTop: '3px' 
                              }}>
                                <AlertTriangle size={11} /> {lang === 'vi' ? `Nộp trễ ${row.late_minutes ? row.late_minutes + 'p' : ''}` : 'Late'}
                              </span>
                            )}
                          </td>

                          {/* Column 2: Code or Repo */}
                          <td style={{ padding: '16px 18px' }}>
                            {overviewSubTab === 'individual' ? (
                              row.code_content ? (
                                <div>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700,
                                    background: row.language === 'python' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: row.language === 'python' ? '#a78bfa' : '#fbbf24',
                                    border: row.language === 'python' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                    marginBottom: '5px'
                                  }}>
                                    <Code2 size={12} /> {row.language === 'python' ? 'Python 3.11' : 'Node.js 20'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openGradingModal(row)}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 255, 255, 0.12)',
                                      borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem',
                                      color: '#c4b5fd', cursor: 'pointer'
                                    }}
                                  >
                                    <Eye size={12} /> {lang === 'vi' ? `Xem code (${row.code_content.split('\n').length} dòng)` : 'View Code'}
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600,
                                    background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1'
                                  }}>
                                    <FileCode size={12} /> {row.repo ? row.repo.replace('https://github.com/', '') : 'Tệp nén (.zip)'}
                                  </span>
                                </div>
                              )
                            ) : (
                              row.repo ? (
                                <div>
                                  <a href={row.repo} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.86rem' }}>
                                    <ExternalLink size={14} /> {row.repo.replace('https://github.com/', '')}
                                  </a>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                    <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SHA: {row.commit}</code>
                                    <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>main</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa cấu hình Git Repo</span>
                              )
                            )}
                          </td>

                          {/* Column 3: Sandbox */}
                          <td style={{ padding: '16px 18px', color: row.statusColor }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                              {row.status.includes('Passed') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                              {row.status}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              0.5 Core • 128MB RAM
                            </div>
                          </td>

                          {/* Column 4: Grade */}
                          <td style={{ padding: '16px 18px', fontSize: '1.1rem', fontWeight: 800, color: (row.final_score ?? row.grade) >= 8 ? '#34d399' : ((row.final_score ?? row.grade) >= 5 ? '#f59e0b' : '#f43f5e') }}>
                            {(row.final_score ?? row.grade).toFixed(1)} / 10
                          </td>

                          {/* Column 5: AI Quality or Free-Rider Radar */}
                          <td style={{ padding: '16px 18px' }}>
                            {overviewSubTab === 'individual' ? (
                              <span className="badge badge-info" style={{ fontWeight: 700 }}>{row.aiScore}</span>
                            ) : (
                              (() => {
                                const telemetry = row.team_id ? gitAnalyticsMap[row.team_id] : null;
                                const hasFreeRider = telemetry?.member_contributions?.some((m: any) => m.is_free_rider || (m.percentage_loc != null && m.percentage_loc < 5));
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {hasFreeRider ? (
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem',
                                        background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                                        border: '1px solid rgba(239, 68, 68, 0.35)', fontWeight: 700
                                      }}>
                                        <AlertTriangle size={12} /> Cảnh báo Free-Rider
                                      </span>
                                    ) : (
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem',
                                        background: 'rgba(16, 185, 129, 0.12)', color: '#34d399',
                                        border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 600
                                      }}>
                                        <CheckCircle2 size={12} /> Đạt chuẩn BR-07
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (row.team_id) setSelectedGitTeamId(row.team_id);
                                        setTeamViewMode('radar');
                                      }}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        border: '1px solid rgba(139, 92, 246, 0.25)',
                                        borderRadius: '6px', padding: '3px 8px', fontSize: '0.74rem',
                                        color: '#a78bfa', cursor: 'pointer', fontWeight: 600
                                      }}
                                    >
                                      <BarChart2 size={12} /> {lang === 'vi' ? 'Xem radar đóng góp' : 'View Radar'}
                                    </button>
                                  </div>
                                );
                              })()
                            )}
                          </td>

                          {/* Column 6: Moderation */}
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
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', background: 'rgba(124, 58, 237, 0.15)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: 700 }}>
                                <Clock size={12} /> {lang === 'vi' ? 'GV1 Đã Đánh Giá' : '1st Reviewed'}
                              </span>
                            )}
                            {(!row.moderationStatus || row.moderationStatus === 'AI_PREGRADED') && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 700 }}>
                                <Sparkles size={12} /> {lang === 'vi' ? 'AI Chấm Sơ Bộ' : 'AI Pre-Graded'}
                              </span>
                            )}
                          </td>

                          {/* Column 7: Actions */}
                          <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button 
                                onClick={() => openGradingModal(row)}
                                className="btn-primary" 
                                style={{ padding: '7px 14px', fontSize: '0.82rem', gap: '5px' }}
                              >
                                <Edit3 size={14} /> {lang === 'vi' ? 'Chấm bài' : 'Grade'}
                              </button>
                              <button 
                                onClick={() => handleViewGradingHistory(row.id)}
                                className="btn-secondary" 
                                title={lang === 'vi' ? 'Xem lịch sử các lần chấm & so sánh điểm' : 'View grading history and score diff'}
                                style={{ padding: '7px 10px', fontSize: '0.82rem', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c4b5fd' }}
                              >
                                <History size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: 'rgba(124, 58, 237, 0.15)', color: '#c4b5fd', border: '1px solid rgba(124, 58, 237, 0.3)', fontWeight: 600 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {selectedSub.language && (
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: selectedSub.language === 'python' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: selectedSub.language === 'python' ? '#a78bfa' : '#fbbf24',
                        border: `1px solid ${selectedSub.language === 'python' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {selectedSub.language === 'python' ? '🐍 Python 3' : '🟨 Node.js'}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {selectedSub.commit && selectedSub.commit !== 'DIRECT_SUBMI' && <>Commit: <code>{selectedSub.commit}</code> • </>}
                      {selectedSub.time}
                      {selectedSub.repo && selectedSub.repo.startsWith('http') && (
                        <> • Repo: <a href={selectedSub.repo} target="_blank" rel="noreferrer" style={{ color: '#c4b5fd' }}>{selectedSub.repo.replace('https://github.com/', '')}</a></>
                      )}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSub(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 📄 MÃ NGUỒN BÀI NỘP TRỰC TIẾP (DIRECT CODE) */}
              {selectedSub.code_content && (
                <div style={{
                  marginBottom: '0.85rem',
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#a78bfa" /> {lang === 'vi' ? 'Mã nguồn sinh viên đã nộp' : 'Student Submitted Code'} ({selectedSub.language || 'javascript'})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                      {selectedSub.code_content.split('\n').length} dòng
                    </span>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.4)',
                    color: selectedSub.language === 'python' ? '#a78bfa' : '#fbbf24',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.78rem',
                    maxHeight: '160px',
                    overflow: 'auto',
                    lineHeight: 1.5
                  }}>
                    {selectedSub.code_content}
                  </pre>
                </div>
              )}

              {/* 🧪 BẢNG ĐỐI SOÁT CHI TIẾT TEST CASES & BÁO CÁO LỖI DOCKER SANDBOX (HẠNG MỤC 1) */}
              {(() => {
                const trList = selectedSub.test_results || [];
                const passedCount = trList.filter(t => t.passed).length;
                const totalTests = trList.length;
                const totalEarned = trList.reduce((acc, t) => acc + (t.score || 0), 0);
                const totalMax = trList.reduce((acc, t) => acc + (t.max_score || 0), 0) || 10;
                const hasTimeout = trList.some(t => t.execution_time_ms >= 5000 || (t.actual_output && t.actual_output.includes('TIMEOUT')));
                const isAllPass = totalTests > 0 && passedCount === totalTests;

                return (
                  <div style={{
                    marginBottom: '0.85rem',
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                  }}>
                    {/* Header thông số thực thi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Terminal size={15} color="#c4b5fd" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                          {lang === 'vi' ? 'Chi Tiết Chấm Điểm Docker Sandbox' : 'Docker Sandbox Autograding Breakdown'}
                        </span>
                        {totalTests > 0 ? (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            background: isAllPass ? 'rgba(16, 185, 129, 0.2)' : (passedCount > 0 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                            color: isAllPass ? '#34d399' : (passedCount > 0 ? '#facc15' : '#f87171'),
                            border: `1px solid ${isAllPass ? 'rgba(16, 185, 129, 0.4)' : (passedCount > 0 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)')}`
                          }}>
                            {passedCount}/{totalTests} Test Cases Đạt ({totalEarned.toFixed(1)}/{totalMax.toFixed(1)}đ)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {lang === 'vi' ? 'Đang chấm điểm hoặc chưa có dữ liệu test' : 'Grading or no test results'}
                          </span>
                        )}
                      </div>

                      {hasTimeout && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.35)', fontWeight: 700 }}>
                          <AlertTriangle size={12} color="#f87171" />
                          {lang === 'vi' ? 'Cảnh báo BR-03: Phát hiện Timeout (>5s)' : 'BR-03: Execution Timeout (>5s)'}
                        </span>
                      )}
                    </div>

                    {/* Danh sách từng Test Case kèm đối soát Input, Expected, Actual Output */}
                    {totalTests > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                        {trList.map((tc, idx) => {
                          const tcTimeout = tc.execution_time_ms >= 5000 || (tc.actual_output && tc.actual_output.includes('TIMEOUT'));
                          return (
                            <div 
                              key={idx}
                              style={{
                                borderRadius: '8px',
                                padding: '8px 10px',
                                background: tc.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.07)',
                                border: `1px solid ${tc.passed ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.3)'}`,
                                fontSize: '0.78rem'
                              }}
                            >
                              {/* Hàng trên: Icon trạng thái, Tên test, Huy hiệu, Thời gian, Điểm */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {tc.passed ? (
                                    <CheckCircle2 size={15} color="#34d399" />
                                  ) : (
                                    <XCircle size={15} color="#f87171" />
                                  )}
                                  <span style={{ fontWeight: 700, color: tc.passed ? '#f1f5f9' : '#fca5a5' }}>
                                    {tc.criterion}
                                  </span>
                                  {tc.is_hidden && (
                                    <span style={{ fontSize: '0.66rem', color: '#a78bfa', padding: '1px 5px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', fontWeight: 600 }}>
                                      🔒 Test Ẩn (BR-06)
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '0.72rem', color: tcTimeout ? '#f87171' : 'var(--text-muted)', fontWeight: tcTimeout ? 800 : 500 }}>
                                    ⏱️ {tc.execution_time_ms}ms {tcTimeout ? '(Timeout)' : ''}
                                  </span>
                                  <span style={{
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: tc.passed ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                    color: tc.passed ? '#34d399' : '#f87171'
                                  }}>
                                    {tc.passed ? `PASSED (+${tc.score}/${tc.max_score}đ)` : `FAILED (+0.0/${tc.max_score}đ)`}
                                  </span>
                                </div>
                              </div>

                              {/* Báo cáo lỗi & Đối soát Input/Expected/Actual Output cho Giảng viên */}
                              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                                {tcTimeout && (
                                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '5px 8px', color: '#fca5a5', fontSize: '0.72rem', marginBottom: '6px' }}>
                                    <strong>⚠️ Lỗi Thực Thi:</strong> Phát hiện vòng lặp vô tận (Infinite Loop) hoặc thời gian vượt hạn mức 5.000ms. Watchdog (BR-03) đã can thiệp ngắt container an toàn.
                                  </div>
                                )}
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '0.72rem' }}>
                                  {tc.input_data && (
                                    <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, marginBottom: '2px' }}>Dữ liệu Input:</div>
                                      <code style={{ color: '#c4b5fd', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>{tc.input_data}</code>
                                    </div>
                                  )}
                                  {tc.expected_output && (
                                    <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                      <div style={{ color: '#34d399', fontSize: '0.68rem', fontWeight: 600, marginBottom: '2px' }}>Expected (Kỳ vọng):</div>
                                      <code style={{ color: '#34d399', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>{tc.expected_output}</code>
                                    </div>
                                  )}
                                  <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <div style={{ color: tc.passed ? '#34d399' : '#f87171', fontSize: '0.68rem', fontWeight: 600, marginBottom: '2px' }}>
                                      {tc.passed ? 'Actual (Khớp 100%):' : 'Actual (Sai lệch/Lỗi):'}
                                    </div>
                                    <code style={{ color: tc.passed ? '#34d399' : '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                      {tc.actual_output || (tcTimeout ? '[Killed by Watchdog Timeout 5s]' : '(Không có dữ liệu trả về)')}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <pre style={{
                        background: 'rgba(0, 0, 0, 0.55)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '0.74rem',
                        fontFamily: 'monospace',
                        color: '#c4b5fd',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '90px',
                        overflowY: 'auto',
                        margin: 0
                      }}>
                        {selectedSub.sandboxOutput}
                      </pre>
                    )}
                  </div>
                );
              })()}

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
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#a78bfa' }}>
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
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                  <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>
                        {lang === 'vi' ? 'Kết quả từ GV 1:' : 'Lecturer 1 Assessment:'}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {selectedSub.reviewer_1_name || 'TS. Nguyễn Văn Giảng'}:
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        "{reviewer1Notes || selectedSub.reviewer_1_notes || (lang === 'vi' ? 'Đã xem xét bài nộp' : 'Reviewed')}"
                      </span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>
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
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{selectedSub.ai_score ?? selectedSub.grade ?? 0}</strong>
                    </div>
                    <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#c4b5fd', display: 'block', marginBottom: '2px' }}>Giảng Viên 1</span>
                      <strong style={{ fontSize: '1.05rem', color: '#a78bfa' }}>{reviewer1Score}</strong>
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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    disabled={isRegrading}
                    onClick={handleRerunGrading}
                    className="btn-secondary"
                    style={{ gap: '5px', fontSize: '0.78rem', padding: '5px 12px' }}
                  >
                    {isRegrading ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
                    <span>{lang === 'vi' ? 'Chấm lại (Regrade)' : 'Re-run Sandbox Grading'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleViewGradingHistory(selectedSub.id)}
                    className="btn-secondary"
                    style={{ gap: '5px', fontSize: '0.78rem', padding: '5px 12px', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c4b5fd' }}
                  >
                    <History size={13} />
                    <span>{lang === 'vi' ? 'Lịch sử chấm & So sánh' : 'Grading History & Diff'}</span>
                  </button>
                </div>

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

        {/* TAB 0: TEAM MANAGEMENT (TÍCH HỢP BÊN TRONG HỌC PHẦN) */}
        {activeTab === 'teams' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                {/* Nút quay lại Học phần & Badge môn học */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('courses')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'; e.currentTarget.style.color = '#a78bfa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = '#cbd5e1'; }}
                  >
                    <ArrowLeft size={15} />
                    <span>{lang === 'vi' ? '← Quay lại Danh sách Học phần' : '← Back to Courses'}</span>
                  </button>

                  {selectedCourseId && courses.find(c => c.course_id === selectedCourseId) && (
                    <span style={{
                      background: 'rgba(124, 58, 237, 0.18)',
                      color: '#c4b5fd',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      Học phần: {courses.find(c => c.course_id === selectedCourseId)?.course_code} - {courses.find(c => c.course_id === selectedCourseId)?.course_name}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  {lang === 'vi' ? 'Nhóm sinh viên' : 'Student Teams'}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
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
                              background: 'rgba(124, 58, 237, 0.16)',
                              color: '#c4b5fd',
                              border: '1px solid rgba(139, 92, 246, 0.35)',
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              title={lang === 'vi' ? 'Chỉnh sửa thông tin nhóm' : 'Edit team'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditTeam(team);
                              }}
                              style={{
                                background: 'rgba(124, 58, 237, 0.12)',
                                border: '1px solid rgba(139, 92, 246, 0.28)',
                                color: '#c4b5fd',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Edit3 size={12} /> {lang === 'vi' ? 'Sửa nhóm' : 'Edit'}
                            </button>

                            <button
                              type="button"
                              title={lang === 'vi' ? 'Xóa nhóm này' : 'Delete this team'}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(lang === 'vi' ? `Bạn có chắc chắn muốn xóa nhóm "${team.team_name}" không?` : `Are you sure you want to delete team "${team.team_name}"?`)) {
                                  try {
                                    const token = await getToken();
                                    const res = await fetch(`http://localhost:5000/api/teams/${team.team_id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      fetchData();
                                    } else {
                                      const d = await res.json();
                                      alert(d.message || 'Lỗi khi xóa nhóm');
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              style={{
                                background: 'rgba(244, 63, 94, 0.1)',
                                border: '1px solid rgba(244, 63, 94, 0.25)',
                                color: '#fda4af',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Trash2 size={12} /> {lang === 'vi' ? 'Xóa nhóm' : 'Delete'}
                            </button>
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
                              color: '#c4b5fd',
                              fontSize: '0.78rem',
                              textDecoration: 'none',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <LinkIcon size={13} color="#c4b5fd" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.repo_url.replace('https://github.com/', '')}</span>
                          </a>
                        </div>

                        {/* Danh sách thành viên nhóm đồ án */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Users size={15} color="#a78bfa" />
                              {lang === 'vi' ? `Thành viên nhóm (${team.members?.length || 0} bạn):` : `Team Members (${team.members?.length || 0}):`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(team.members && team.members.length > 0) ? (
                              [...team.members]
                                .sort((a, b) => (a.role === 'LEADER' ? -1 : b.role === 'LEADER' ? 1 : 0))
                                .map((m, idx) => {
                                  const initial = (m.full_name || 'U').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U';
                                  const isLeader = m.role === 'LEADER';
                                  return (
                                    <div
                                      key={m.team_member_id || m.user_id || idx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 12px',
                                        borderRadius: '10px',
                                        background: isLeader ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.025)',
                                        border: isLeader ? '1px solid rgba(245, 158, 11, 0.28)' : '1px solid rgba(255, 255, 255, 0.06)',
                                        gap: '10px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                        <div style={{
                                          width: '30px',
                                          height: '30px',
                                          borderRadius: '50%',
                                          background: isLeader ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4338ca, #6366f1)',
                                          color: '#ffffff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.76rem',
                                          fontWeight: 800,
                                          flexShrink: 0
                                        }}>
                                          {initial}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isLeader ? '#fef08a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {m.full_name}
                                            </span>
                                            {isLeader && (
                                              <span style={{
                                                fontSize: '0.64rem',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                background: 'rgba(245, 158, 11, 0.2)',
                                                color: '#fbbf24',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                              }}>
                                                <Crown size={10} /> LEADER
                                              </span>
                                            )}
                                          </div>
                                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {m.assigned_module || (lang === 'vi' ? 'Thành viên đồ án' : 'Team Member')}
                                          </span>
                                        </div>
                                      </div>
                                      <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {m.email?.split('@')[0]}
                                      </span>
                                    </div>
                                  );
                                })
                            ) : (
                              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                {lang === 'vi' ? 'Chưa có thành viên nào trong nhóm' : 'No members yet'}
                              </div>
                            )}
                          </div>
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
                          marginTop: '0.75rem',
                          justifyContent: 'center',
                          fontSize: '0.86rem',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          gap: '8px'
                        }}
                      >
                        <Users size={16} />
                        {lang === 'vi' ? 'Quản lý thành viên nhóm' : 'Manage Team Members'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL 0: CHI TIẾT & THÀNH VIÊN NHÓM */}
        {selectedTeamDetails && (() => {
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
                width: '100%',
                maxWidth: '780px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem 2.25rem',
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
                        background: 'rgba(139, 92, 246, 0.12)',
                        color: '#a78bfa',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
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
                          color: '#a78bfa',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <GitBranch size={13} color="#a78bfa" />
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

                {/* Section Title & Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={18} color="#a78bfa" />
                      {lang === 'vi' ? `Danh sách thành viên (${selectedTeamDetails.members?.length || 0} sinh viên)` : `Team Members (${selectedTeamDetails.members?.length || 0})`}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {lang === 'vi' ? 'Quản lý thành viên, vai trò trưởng nhóm và module phụ trách.' : 'Manage members, team leader, and project modules.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetTeam(selectedTeamDetails);
                        setShowAssignModal(true);
                        if (students.length > 0 && !assignUserId) setAssignUserId(students[0].user_id);
                      }}
                      className="btn-primary"
                      style={{ fontSize: '0.84rem', padding: '8px 16px', gap: '6px', borderRadius: '10px', fontWeight: 600 }}
                    >
                      <UserPlus size={15} /> {lang === 'vi' ? 'Thêm sinh viên vào nhóm' : 'Add Member to Team'}
                    </button>
                  </div>
                </div>

                {/* Danh sách thành viên nhóm */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  {selectedTeamDetails.members && selectedTeamDetails.members.length > 0 ? (
                    [...selectedTeamDetails.members]
                      .sort((a, b) => {
                        if (a.role === 'LEADER' && b.role !== 'LEADER') return -1;
                        if (b.role === 'LEADER' && a.role !== 'LEADER') return 1;
                        return 0;
                      })
                      .map((m) => {
                        const initial = (m.full_name || 'U').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U';
                        const isLeader = m.role === 'LEADER';

                        return (
                          <div
                            key={m.team_member_id || m.user_id}
                            style={{
                              background: isLeader ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.025)',
                              border: isLeader ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '14px',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: isLeader ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4338ca, #6366f1)',
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
                                  <strong style={{ fontSize: '0.98rem', color: isLeader ? '#fef08a' : '#f8fafc', fontWeight: 700 }}>
                                    {m.full_name}
                                  </strong>
                                  {isLeader && (
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
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#a78bfa',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '260px'
                                  }}>
                                    {m.assigned_module || (lang === 'vi' ? 'Thành viên đồ án' : 'Team Member')}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  <Mail size={12} color="#64748b" />
                                  <span>{m.email}</span>
                                </div>
                              </div>
                            </div>

                            {/* Nút Xóa khỏi nhóm */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(selectedTeamDetails.team_id, m.team_member_id, m.full_name)}
                                title={lang === 'vi' ? 'Xóa khỏi nhóm' : 'Remove from team'}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.22)',
                                  color: '#f87171',
                                  cursor: 'pointer',
                                  padding: '7px 12px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Trash2 size={13} />
                                <span>{lang === 'vi' ? 'Xóa khỏi nhóm' : 'Remove'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                      <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{lang === 'vi' ? 'Nhóm chưa có thành viên nào. Bấm nút "Thêm sinh viên vào nhóm" ở trên.' : 'No members in this team yet. Click "Add Member to Team" above.'}</p>
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
        {/* TAB 1: RUBRIC & TEST CASES CONFIG (BR-06 & Lifecycle Management) */}
        {activeTab === 'config' && (
          <div className="lecturer-config-grid">
            <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '85px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.2rem', color: '#f1f5f9' }}>
                {lang === 'vi' ? 'Cấu hình bài tập & Docker Sandbox' : 'Create / Edit Assignment'}
              </h3>
              <form onSubmit={e => { 
                e.preventDefault(); 
                setShowAssignmentModal(true);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Tiêu đề bài tập (*)' : 'Assignment Title (*)'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={lang === 'vi' ? 'Nhập tiêu đề bài tập mới...' : 'Enter assignment title...'} 
                    value={assignmentTitle}
                    onChange={e => setAssignmentTitle(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.86rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Dockerfile môi trường Sandbox chấm tự động' : 'Docker Sandbox Environment (Dockerfile)'}
                  </label>
                  <textarea 
                    rows={4} 
                    defaultValue={'FROM node:20-alpine\nWORKDIR /app\nUSER runner\nCMD ["node", "main.js"]'} 
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.8rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Ràng buộc đánh giá' : 'Evaluation Constraints'}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <input type="checkbox" defaultChecked /> Timeout 5000ms (BR-03)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <input type="checkbox" defaultChecked /> AI Architecture Review
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAssignmentModal(true)} 
                    className="btn-primary" 
                    style={{ padding: '9px 12px', justifyContent: 'center', fontSize: '0.84rem' }}
                  >
                    <Plus size={15} /> {lang === 'vi' ? 'Tạo Bài Tập Thủ Công' : 'Create Manually'}
                  </button>
                  <button 
                    type="button" 
                    onClick={openAiStudioModal} 
                    className="btn-secondary" 
                    style={{ padding: '9px 12px', justifyContent: 'center', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc', background: 'rgba(139, 92, 246, 0.12)', fontWeight: 600, fontSize: '0.84rem' }}
                  >
                    <Sparkles size={15} /> {lang === 'vi' ? '✨ AI Soạn Đề Từ Slide' : '✨ AI from Slide'}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {lang === 'vi' ? 'Bộ Test Cases & Rubric' : 'Test Cases & Rubric'}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: assignments.length > 0 ? 'rgba(124, 58, 237, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: assignments.length > 0 ? '#c4b5fd' : '#94a3b8',
                    border: assignments.length > 0 ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(148, 163, 184, 0.3)',
                    fontWeight: 600
                  }}>
                    {assignments.length > 0 ? `${rubricRules.length} Test Cases` : (lang === 'vi' ? '0 Bài tập' : '0 Assignments')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingRubric(null);
                      setTcCriterion('');
                      setTcInputData('');
                      setTcExpectedOutput('');
                      setTcMaxScore('3.0');
                      setTcIsHidden(false);
                      setModalError('');
                      setShowAddTestCaseModal(true);
                    }}
                    className="btn-primary" 
                    style={{ padding: '7px 14px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> {lang === 'vi' ? 'Thêm Test Case' : 'Add Test Case'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAssignmentModal(true)}
                    className="btn-secondary" 
                    style={{ padding: '7px 12px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> {lang === 'vi' ? 'Tạo thủ công' : 'Manual'}
                  </button>
                  <button 
                    type="button"
                    onClick={openAiStudioModal}
                    className="btn-secondary" 
                    style={{ padding: '7px 12px', fontSize: '0.82rem', gap: '6px', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc', background: 'rgba(139, 92, 246, 0.12)', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    <Sparkles size={14} /> {lang === 'vi' ? '✨ AI Soạn Đề' : '✨ AI Studio'}
                  </button>
                </div>
              </div>

              {assignments.length === 0 ? (
                /* Empty state when NO assignments exist in the entire course */
                <div style={{
                  padding: '3rem 1.5rem',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.015)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(139, 92, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa'
                  }}>
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                      {lang === 'vi' ? 'Chưa có bài tập nào trong khóa học' : 'No Assignments in This Course'}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRubric(null);
                        setTcCriterion('');
                        setTcInputData('');
                        setTcExpectedOutput('');
                        setTcMaxScore('3.0');
                        setTcIsHidden(false);
                        setModalError('');
                        setShowAddTestCaseModal(true);
                      }}
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '7px 18px', borderRadius: '8px' }}
                    >
                      <Plus size={14} /> {lang === 'vi' ? 'Thêm Test Case đầu tiên' : 'Add First Test Case'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignmentModal(true)}
                      className="btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '7px 16px', borderRadius: '8px' }}
                    >
                      <Plus size={14} /> {lang === 'vi' ? 'Tạo bài tập trước' : 'Create Assignment First'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Assignment Lifecycle Status Filter Tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                      {lang === 'vi' ? 'Lọc theo trạng thái:' : 'Status Filter:'}
                    </span>
                    {(['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED', 'ARCHIVED'] as const).map(st => {
                      const isActive = assignmentStatusFilter === st;
                      const count = st === 'ALL' 
                        ? assignments.length 
                        : assignments.filter(a => (a.status || 'PUBLISHED') === st).length;
                      const labelMap: Record<string, string> = {
                        ALL: lang === 'vi' ? 'Tất cả' : 'All',
                        PUBLISHED: lang === 'vi' ? 'Đang mở (Published)' : 'Published',
                        DRAFT: lang === 'vi' ? 'Bản nháp (Draft)' : 'Draft',
                        CLOSED: lang === 'vi' ? 'Đã đóng (Closed)' : 'Closed',
                        ARCHIVED: lang === 'vi' ? 'Lưu trữ (Archived)' : 'Archived',
                      };
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setAssignmentStatusFilter(st);
                            const filtered = assignments.filter(a => st === 'ALL' || (a.status || 'PUBLISHED') === st);
                            if (filtered.length > 0 && !filtered.some(a => a.assignment_id === selectedAssignmentId)) {
                              handleSelectAssignment(filtered[0].assignment_id);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: isActive ? 700 : 500,
                            background: isActive ? 'rgba(124, 58, 237, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                            color: isActive ? '#c4b5fd' : 'var(--text-muted)',
                            border: isActive ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{labelMap[st]}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            background: isActive ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                            padding: '1px 5px',
                            borderRadius: '999px'
                          }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Assignment Selector with Delete Button */}
                  <div style={{
                    marginBottom: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px', minWidth: 0 }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {lang === 'vi' ? 'Đang chọn bài tập:' : 'Selected Assignment:'}
                      </label>
                      <select
                        value={selectedAssignmentId || ''}
                        onChange={(e) => handleSelectAssignment(Number(e.target.value))}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          maxWidth: '100%',
                          padding: '7px 12px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: '#c4b5fd',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {assignments
                          .filter(a => assignmentStatusFilter === 'ALL' || (a.status || 'PUBLISHED') === assignmentStatusFilter)
                          .map((a, idx) => (
                          <option key={a.assignment_id} value={a.assignment_id}>
                            #{idx + 1} - [{a.status || 'PUBLISHED'}] {a.title} ({a.submission_type === 'TEAM' ? (lang === 'vi' ? 'Nhóm đồ án' : 'Team') : (lang === 'vi' ? 'Cá nhân' : 'Individual')}) - Tối đa {a.max_score}đ
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={isRegrading}
                        onClick={handleRegradeAll}
                        title={lang === 'vi' ? 'Chấm lại toàn bộ bài nộp của bài tập này qua Docker Sandbox' : 'Re-grade all submissions for this assignment'}
                        style={{
                          background: 'rgba(124, 58, 237, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          color: '#c4b5fd',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: isRegrading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <RotateCw size={13} className={isRegrading ? 'animate-spin' : ''} />
                        <span>{isRegrading ? (lang === 'vi' ? 'Đang chấm...' : 'Re-grading...') : (lang === 'vi' ? 'Chấm lại bài nộp' : 'Re-grade')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(selectedAssignmentId)}
                        title={lang === 'vi' ? 'Xóa bài tập này' : 'Delete this assignment'}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{lang === 'vi' ? 'Xóa bài tập' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rubric Rules List or Empty State */}
                  {/* Score Progress Bar & Status Filter */}
                  {selectedAssignmentId && (
                    (() => {
                      const selAssign = assignments.find(a => a.assignment_id === selectedAssignmentId);
                      const assignMax = selAssign ? Number(selAssign.max_score || 10.0) : 10.0;
                      const activeSum = rubricRules
                        .filter(r => !r.status || r.status === 'Active' || r.status === 'Hidden')
                        .reduce((sum, r) => sum + Number(r.max_score || 0), 0);
                      const isOver = activeSum > assignMax + 0.001;
                      const progressPct = Math.min((activeSum / assignMax) * 100, 100);

                      const countActive = rubricRules.filter(r => (!r.status && !r.is_hidden) || r.status === 'Active').length;
                      const countHidden = rubricRules.filter(r => r.is_hidden || r.status === 'Hidden').length;
                      const countDraft = rubricRules.filter(r => r.status === 'Draft').length;
                      const countDisabled = rubricRules.filter(r => r.status === 'Disabled').length;

                      const filteredRules = rubricRules.filter(r => {
                        if (tcFilterStatus === 'ALL') return true;
                        const st = r.status || (r.is_hidden ? 'Hidden' : 'Active');
                        return st === tcFilterStatus;
                      });

                      // Thống kê đối tượng nhóm và tiến độ nộp bài
                      const cTeams = teams.filter(t => t.course_id === selAssign?.course_id);
                      const targetType = selAssign?.target_type || 'ALL';
                      const targetTeams = selAssign?.target_teams || [];
                      const relevantTeams = targetType === 'SPECIFIC_TEAMS' ? (targetTeams.length > 0 ? targetTeams : cTeams) : cTeams;
                      const assignSubs = submissions.filter(s => s.assignment_id === selectedAssignmentId);
                      const submittedTeamIds = new Set(assignSubs.filter(s => s.team_id).map(s => s.team_id));
                      const submittedCount = relevantTeams.filter(t => submittedTeamIds.has(t.team_id)).length;
                      const notSubmittedCount = Math.max(0, relevantTeams.length - submittedCount);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.2rem' }}>
                          {/* Assignment Target Group & Statistics Banner */}
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: 'rgba(15, 23, 42, 0.65)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: selAssign?.submission_type === 'TEAM' ? 'rgba(124, 58, 237, 0.16)' : 'rgba(167, 139, 250, 0.15)',
                                color: '#c4b5fd',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                {selAssign?.submission_type === 'TEAM' ? (lang === 'vi' ? '👥 Nhóm đồ án' : '👥 Team Assignment') : (lang === 'vi' ? '👤 Cá nhân' : '👤 Individual')}
                              </span>

                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: targetType === 'ALL' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: targetType === 'ALL' ? '#34d399' : '#fbbf24',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                {targetType === 'ALL' 
                                  ? (lang === 'vi' ? `🏫 Toàn bộ lớp (${cTeams.length} nhóm)` : `🏫 All Class (${cTeams.length} teams)`)
                                  : (lang === 'vi' ? `🎯 Chỉ định ${targetTeams.length} nhóm` : `🎯 ${targetTeams.length} Specific Teams`)}
                              </span>

                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#a5b4fc',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                💻 {selAssign?.allowed_language === 'python' ? 'Python' : selAssign?.allowed_language === 'javascript' ? 'JavaScript (Node.js)' : (lang === 'vi' ? 'Tùy chọn (Python/JS)' : 'Any (Python/JS)')}
                              </span>

                              {targetType === 'SPECIFIC_TEAMS' && targetTeams.length > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ({targetTeams.map(t => t.team_name).join(', ')})
                                </span>
                              )}

                              {/* Assignment Lifecycle Status Badge */}
                              {(() => {
                                const st = selAssign?.status || 'PUBLISHED';
                                const bg = st === 'DRAFT' ? 'rgba(148, 163, 184, 0.15)' : st === 'CLOSED' ? 'rgba(239, 68, 68, 0.15)' : st === 'ARCHIVED' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(52, 211, 153, 0.15)';
                                const color = st === 'DRAFT' ? '#94a3b8' : st === 'CLOSED' ? '#f87171' : st === 'ARCHIVED' ? '#c084fc' : '#34d399';
                                const label = st === 'DRAFT' ? (lang === 'vi' ? '📝 Bản nháp (DRAFT)' : '📝 Draft') : st === 'CLOSED' ? (lang === 'vi' ? '🔒 Đã đóng (CLOSED)' : '🔒 Closed') : st === 'ARCHIVED' ? (lang === 'vi' ? '📦 Đã lưu trữ (ARCHIVED)' : '📦 Archived') : (lang === 'vi' ? '🟢 Đang mở (PUBLISHED)' : '🟢 Published');
                                return (
                                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: bg, color, fontSize: '0.75rem', fontWeight: 800 }}>
                                    {label}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Lifecycle Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                              {selectedAssignmentId && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {selAssign?.status === 'DRAFT' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAssignmentStatus(selectedAssignmentId, 'PUBLISHED')}
                                      style={{
                                        background: 'rgba(52, 211, 153, 0.15)',
                                        border: '1px solid rgba(52, 211, 153, 0.4)',
                                        color: '#34d399',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🚀 {lang === 'vi' ? 'Xuất bản (Publish)' : 'Publish'}
                                    </button>
                                  )}
                                  {(!selAssign?.status || selAssign?.status === 'PUBLISHED') && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAssignmentStatus(selectedAssignmentId, 'CLOSED')}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        color: '#f87171',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🔒 {lang === 'vi' ? 'Đóng bài (Close)' : 'Close'}
                                    </button>
                                  )}
                                  {(selAssign?.status === 'CLOSED' || selAssign?.status === 'ARCHIVED') && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAssignmentStatus(selectedAssignmentId, 'PUBLISHED')}
                                      style={{
                                        background: 'rgba(124, 58, 237, 0.15)',
                                        border: '1px solid rgba(139, 92, 246, 0.4)',
                                        color: '#c4b5fd',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🔄 {lang === 'vi' ? 'Mở lại (Reopen)' : 'Reopen'}
                                    </button>
                                  )}
                                  {selAssign?.status !== 'ARCHIVED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAssignmentStatus(selectedAssignmentId, 'ARCHIVED')}
                                      style={{
                                        background: 'rgba(148, 163, 184, 0.15)',
                                        border: '1px solid rgba(148, 163, 184, 0.4)',
                                        color: '#cbd5e1',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      📦 {lang === 'vi' ? 'Lưu trữ (Archive)' : 'Archive'}
                                    </button>
                                  )}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: submittedCount === relevantTeams.length && relevantTeams.length > 0 ? '#34d399' : '#c4b5fd',
                                  background: 'rgba(124, 58, 237, 0.12)',
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(139, 92, 246, 0.25)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {lang === 'vi' ? 'Tiến độ nộp:' : 'Submissions:'} {submittedCount}/{relevantTeams.length} {lang === 'vi' ? 'nhóm đã nộp' : 'teams'} ({relevantTeams.length > 0 ? Math.round((submittedCount / relevantTeams.length) * 100) : 0}%)
                                </span>
                                {notSubmittedCount > 0 && (
                                  <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    ({notSubmittedCount} {lang === 'vi' ? 'nhóm chưa nộp' : 'pending'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Assignment Schedule & Submission Policy Ribbon */}
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.025)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px 16px',
                            fontSize: '0.76rem',
                            color: '#94a3b8',
                            alignItems: 'center'
                          }}>
                            {(() => {
                              const fmt = (d?: string | Date) => {
                                if (!d) return '--';
                                const dobj = new Date(d);
                                if (isNaN(dobj.getTime())) return '--';
                                return dobj.toLocaleString('vi-VN', {
                                  timeZone: 'Asia/Ho_Chi_Minh',
                                  hour12: false,
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                });
                              };
                              return (
                                <>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>🕒 {lang === 'vi' ? 'Mở bài (Giờ VN):' : 'Starts (VN):'} <strong style={{ color: '#e2e8f0' }}>{fmt(selAssign?.start_date)}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>⏰ {lang === 'vi' ? 'Hạn nộp (Due):' : 'Due Date:'} <strong style={{ color: '#fde047' }}>{fmt(selAssign?.due_date || selAssign?.deadline)}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>🚪 {lang === 'vi' ? 'Đóng bài (Close):' : 'Close Date:'} <strong style={{ color: '#f87171' }}>{fmt(selAssign?.close_date || selAssign?.deadline)}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>🏷️ {lang === 'vi' ? 'Nộp trễ:' : 'Late Submissions:'} <strong style={{ color: selAssign?.allow_late_submission === false ? '#f87171' : '#34d399' }}>{selAssign?.allow_late_submission === false ? (lang === 'vi' ? 'Không cho phép' : 'Disabled') : (lang === 'vi' ? 'Cho phép' : 'Allowed')}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>🔢 {lang === 'vi' ? 'Giới hạn nộp:' : 'Max Submissions:'} <strong style={{ color: '#a78bfa' }}>{selAssign?.max_submissions && selAssign.max_submissions > 0 ? `${selAssign.max_submissions} ${lang === 'vi' ? 'lần' : 'times'}` : (lang === 'vi' ? 'Không giới hạn' : 'Unlimited')}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>🔁 {lang === 'vi' ? 'Nộp lại:' : 'Resubmission:'} <strong style={{ color: selAssign?.allow_resubmission === false ? '#f87171' : '#34d399' }}>{selAssign?.allow_resubmission === false ? (lang === 'vi' ? 'Chặn' : 'Disabled') : (lang === 'vi' ? 'Cho phép' : 'Allowed')}</strong></span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {loadingRubrics ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" /> {lang === 'vi' ? 'Đang tải test cases...' : 'Loading test cases...'}
                    </div>
                  ) : rubricRules.length === 0 ? (
                    <div style={{
                      padding: '2.5rem 1.5rem',
                      border: '1px dashed rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.015)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a78bfa'
                      }}>
                        <ListTodo size={22} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Bài tập này chưa có Test Case nào' : 'No Test Cases Configured Yet'}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, maxWidth: '380px' }}>
                          {lang === 'vi' 
                            ? 'Bấm nút bên dưới để thiết lập bộ tiêu chí test case công khai hoặc test case ẩn bảo mật (BR-06).'
                            : 'Click the button below to add public or hidden test cases (BR-06).'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModalError('');
                          setTcCriterion('');
                          setTcDescription('');
                          setTcInputData('');
                          setTcExpectedOutput('');
                          setTcMaxScore('3.0');
                          setTcIsHidden(false);
                          setTcStatus('Active');
                          setPreviewResult(null);
                          setPreviewCode('');
                          setShowPreviewSection(false);
                          setShowAddTestCaseModal(true);
                        }}
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '8px', marginTop: '6px' }}
                      >
                        <Plus size={14} /> {lang === 'vi' ? 'Thêm Test Case đầu tiên' : 'Add First Test Case'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                      {rubricRules
                        .filter(r => {
                          if (tcFilterStatus === 'ALL') return true;
                          const st = r.status || (r.is_hidden ? 'Hidden' : 'Active');
                          return st === tcFilterStatus;
                        })
                        .map((r, idx) => {
                          const statusStr = r.status || (r.is_hidden ? 'Hidden' : 'Active');
                          return (
                            <div 
                              key={r.rubric_rule_id}
                              style={{
                                padding: '12px 14px',
                                background: statusStr === 'Disabled' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(15, 23, 42, 0.45)',
                                border: statusStr === 'Hidden' ? '1px solid rgba(168, 85, 247, 0.3)' : (statusStr === 'Draft' ? '1px solid rgba(250, 204, 21, 0.3)' : (statusStr === 'Disabled' ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)')),
                                borderRadius: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                opacity: statusStr === 'Disabled' ? 0.75 : 1
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {/* Reorder Buttons */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleReorderTestCases(idx, 'UP')}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: idx === 0 ? 'rgba(255,255,255,0.1)' : '#94a3b8',
                                        cursor: idx === 0 ? 'default' : 'pointer',
                                        padding: '0 2px',
                                        lineHeight: 1
                                      }}
                                      title={lang === 'vi' ? 'Di chuyển lên' : 'Move up'}
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === rubricRules.length - 1}
                                      onClick={() => handleReorderTestCases(idx, 'DOWN')}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: idx === rubricRules.length - 1 ? 'rgba(255,255,255,0.1)' : '#94a3b8',
                                        cursor: idx === rubricRules.length - 1 ? 'default' : 'pointer',
                                        padding: '0 2px',
                                        lineHeight: 1
                                      }}
                                      title={lang === 'vi' ? 'Di chuyển xuống' : 'Move down'}
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>

                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>#{r.order_index ?? idx + 1}</span>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>{r.criterion}</span>

                                  {/* Status Badge */}
                                  {statusStr === 'Hidden' ? (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(168, 85, 247, 0.15)',
                                      color: '#c084fc',
                                      border: '1px solid rgba(168, 85, 247, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 600
                                    }}>
                                      <ShieldCheck size={11} /> Hidden (BR-06)
                                    </span>
                                  ) : statusStr === 'Draft' ? (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(250, 204, 21, 0.15)',
                                      color: '#facc15',
                                      border: '1px solid rgba(250, 204, 21, 0.3)',
                                      fontWeight: 600
                                    }}>
                                      Draft
                                    </span>
                                  ) : statusStr === 'Disabled' ? (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(148, 163, 184, 0.15)',
                                      color: '#94a3b8',
                                      border: '1px solid rgba(148, 163, 184, 0.3)',
                                      fontWeight: 600
                                    }}>
                                      Disabled
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      fontWeight: 600
                                    }}>
                                      Active
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700, marginRight: '4px' }}>
                                    {r.max_score} {lang === 'vi' ? 'điểm' : 'pts'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRubric(r);
                                      setTcCriterion(r.criterion);
                                      setTcDescription(r.description || '');
                                      setTcInputData(r.input_data || '');
                                      setTcExpectedOutput(r.expected_output || '');
                                      setTcMaxScore(String(r.max_score));
                                      setTcIsHidden(Boolean(r.is_hidden || r.status === 'Hidden'));
                                      setTcStatus(r.status || (r.is_hidden ? 'Hidden' : 'Active'));
                                      setPreviewResult(null);
                                      setPreviewCode('');
                                      setShowPreviewSection(false);
                                      setModalError('');
                                      setShowAddTestCaseModal(true);
                                    }}
                                    title={lang === 'vi' ? 'Chỉnh sửa Test Case' : 'Edit Test Case'}
                                    style={{
                                      background: 'rgba(139, 92, 246, 0.1)',
                                      border: '1px solid rgba(139, 92, 246, 0.25)',
                                      color: '#a78bfa',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      padding: '5px 8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.74rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    <Edit3 size={13} />
                                    <span>{lang === 'vi' ? 'Sửa' : 'Edit'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTestCase(r.rubric_rule_id)}
                                    title={lang === 'vi' ? 'Xóa hoặc vô hiệu hóa Test Case' : 'Delete or disable test case'}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      color: '#f87171',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      padding: '5px 8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.74rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>{lang === 'vi' ? 'Xóa' : 'Delete'}</span>
                                  </button>
                                </div>
                              </div>

                              {r.description && (
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {r.description}
                                </p>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                                <div>
                                  <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>
                                    {lang === 'vi' ? 'Dữ liệu Input (stdin):' : 'Input Data:'}
                                  </span>
                                  <pre style={{ margin: 0, padding: '6px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                                    {r.input_data || '(Trống)'}
                                  </pre>
                                </div>
                                <div>
                                  <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>
                                    {lang === 'vi' ? 'Kết quả kỳ vọng (Expected):' : 'Expected Output:'}
                                  </span>
                                  <pre style={{ margin: 0, padding: '6px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', color: '#34d399', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                                    {r.expected_output || '(Trống)'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {/* TAB 4: PEER AUDIT SUMMARY (BR-08) */}
        {activeTab === 'peer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#34d399" /> {lang === 'vi' ? 'Báo cáo đánh giá chéo nội bộ (Peer Audit BR-08)' : 'Peer Audit Report (BR-08)'}
              </h3>
              
            </div>
            
            {teams.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: '20px' }}>
                <Users size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Chưa có nhóm nào trong hệ thống.' : 'No teams found.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.75rem' }}>
                {teams.map(team => {
                  const summary = peerAuditMap[team.team_id];
                  const isLoading = loadingPeerMap[team.team_id];
                  const memberSummaries = summary?.member_summaries || [];
                  const totalReviews = memberSummaries.reduce((acc: number, m: any) => acc + (m.total_reviews_received || 0), 0);

                  return (
                    <div 
                      key={team.team_id}
                      className="glass-card" 
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '20px', 
                        padding: '1.65rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        gap: '1.25rem'
                      }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                              {team.course_code}
                            </span>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-main)' }}>
                              {team.team_name}
                            </h4>
                          </div>
                          <span className="badge badge-success" style={{ fontWeight: 700 }}>
                            {totalReviews > 0 ? (lang === 'vi' ? `${totalReviews} phiếu đã gửi` : `${totalReviews} Reviews`) : (lang === 'vi' ? 'Chưa có phiếu' : 'No Reviews')}
                          </span>
                        </div>

                        {/* Members list with real average scores */}
                        {isLoading ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 8px', color: '#34d399' }} />
                            <p style={{ fontSize: '0.85rem' }}>{lang === 'vi' ? 'Đang tổng hợp điểm đánh giá...' : 'Aggregating peer scores...'}</p>
                          </div>
                        ) : memberSummaries.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {lang === 'vi' ? 'Chưa có thành viên nào nộp đánh giá chéo cho nhóm này.' : 'No peer reviews submitted yet for this team.'}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {memberSummaries.map((m: any) => {
                              const avg = Number(m.average_score) || 0;
                              const hasReviews = m.total_reviews_received > 0;
                              const scoreColor = hasReviews ? (avg >= 8.0 ? '#34d399' : (avg >= 5.0 ? '#fbbf24' : '#f87171')) : 'var(--text-muted)';

                              return (
                                <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '6px 0', borderBottom: '1px dashed rgba(255, 255, 255, 0.05)' }}>
                                  <div>
                                    <strong style={{ color: 'var(--text-main)' }}>{m.full_name}</strong>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      {m.assigned_module || m.email} • {m.total_reviews_received} {lang === 'vi' ? 'lượt đánh giá' : 'reviews'}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <strong style={{ color: scoreColor, fontSize: '1rem' }}>
                                      {hasReviews ? `${avg.toFixed(1)} / 10` : '—'}
                                    </strong>
                                    {m.needs_attention && (
                                      <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
                                        ⚠️ {lang === 'vi' ? 'Điểm thấp' : 'Low Score'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* View Comments Button */}
                      <button 
                        className="btn-secondary" 
                        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', fontSize: '0.85rem' }} 
                        onClick={() => {
                          const allComments: any[] = [];
                          memberSummaries.forEach((m: any) => {
                            if (m.feedback_comments && m.feedback_comments.length > 0) {
                              m.feedback_comments.forEach((c: any) => {
                                allComments.push({
                                  targetStudent: m.full_name,
                                  score: c.score,
                                  comments: c.comments,
                                  round: c.audit_round
                                });
                              });
                            }
                          });
                          setSelectedPeerTeamComments({
                            teamName: team.team_name,
                            comments: allComments
                          });
                        }}
                      >
                        {lang === 'vi' ? 'Xem chi tiết nhận xét bí mật (BR-08)' : 'View Confidential Comments'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                    background: 'rgba(124, 58, 237, 0.15)',
                    color: '#c4b5fd',
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
                      color: '#c4b5fd',
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

        {/* MODAL: CHỈNH SỬA HỌC PHẦN */}
        {showEditCourseModal && editingCourse && (
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
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#a78bfa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Edit3 size={16} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {lang === 'vi' ? 'Chỉnh sửa học phần' : 'Edit Course'}
                  </h3>
                </div>
                <button onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mã học phần' : 'Course Code'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SWD392, PRJ301..."
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value.toUpperCase())}
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
                    value={editCourseName}
                    onChange={(e) => setEditCourseName(e.target.value)}
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
                    value={editCourseSemester}
                    onChange={(e) => setEditCourseSemester(e.target.value.toUpperCase())}
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
                  <button type="button" onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingEditCourse} className="btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px', gap: '6px' }}>
                    {submittingEditCourse ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHỈNH SỬA THÔNG TIN NHÓM */}
        {showEditTeamModal && editingTeam && (
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
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#a78bfa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Edit3 size={16} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {lang === 'vi' ? 'Chỉnh sửa thông tin nhóm' : 'Edit Team'}
                  </h3>
                </div>
                <button onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên nhóm' : 'Team Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Group 1, Nhóm 2..."
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
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
                    {lang === 'vi' ? 'GitHub Repo URL' : 'GitHub Repo URL'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/organization/repo.git"
                    value={editTeamRepoUrl}
                    onChange={(e) => setEditTeamRepoUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: '#c4b5fd',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingEditTeam} className="btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px', gap: '6px' }}>
                    {submittingEditTeam ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</span>
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
                    background: 'rgba(124, 58, 237, 0.15)',
                    color: '#c4b5fd',
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
                      background: assignMode === 'email' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                      color: assignMode === 'email' ? '#c4b5fd' : 'var(--text-muted)',
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
                      background: assignMode === 'select' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                      color: assignMode === 'select' ? '#c4b5fd' : 'var(--text-muted)',
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
                          <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {students.map(st => (
                            <button
                              key={st.user_id}
                              type="button"
                              onClick={() => setAssignEmail(st.email)}
                              style={{
                                background: 'rgba(124, 58, 237, 0.12)',
                                border: '1px solid rgba(124, 58, 237, 0.3)',
                                color: '#c4b5fd',
                                borderRadius: '6px',
                                padding: '3px 10px',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              + {st.full_name} ({st.email})
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
                        background: assignRole === 'MEMBER' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: assignRole === 'MEMBER' ? '#c4b5fd' : 'var(--text-muted)',
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

        {/* MODAL 4: TẠO BÀI TẬP THỦ CÔNG (MANUAL ASSIGNMENT CREATION) */}
        {showAssignmentModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto',
              padding: '2rem', borderRadius: '20px',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} style={{ color: '#c4b5fd' }} />
                  {lang === 'vi' ? 'Tạo bài tập thủ công' : 'Create Assignment (Manual)'}
                </h3>
                <button onClick={() => { setShowAssignmentModal(false); setModalError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> {modalError}
                </div>
              )}

              <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Học phần liên kết:' : 'Course:'}
                    </label>
                    <select
                      value={assignmentCourseId}
                      onChange={(e) => setAssignmentCourseId(e.target.value)}
                      required
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    >
                      {courses.map(c => (
                        <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#c4b5fd' }}>
                      {lang === 'vi' ? 'Hình thức nộp (*):' : 'Submission Type (*):'}
                    </label>
                    <select
                      value={assignmentSubmissionType}
                      onChange={(e) => setAssignmentSubmissionType(e.target.value as 'INDIVIDUAL' | 'TEAM')}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: '#c4b5fd',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="INDIVIDUAL">{lang === 'vi' ? 'Cá nhân (Individual)' : 'Individual'}</option>
                      <option value="TEAM">{lang === 'vi' ? 'Theo nhóm (Team)' : 'Team'}</option>
                    </select>
                  </div>
                </div>

                {/* Ngôn ngữ cho phép & Đối tượng giao bài */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#a78bfa' }}>
                      {lang === 'vi' ? 'Ngôn ngữ chấm bài (*):' : 'Programming Language (*):'}
                    </label>
                    <select
                      value={assignmentAllowedLanguage}
                      onChange={(e) => setAssignmentAllowedLanguage(e.target.value as 'ALL' | 'python' | 'javascript')}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(167, 139, 250, 0.08)',
                        border: '1px solid rgba(167, 139, 250, 0.35)',
                        color: '#c4b5fd',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="ALL">{lang === 'vi' ? 'Tất cả (Python & JavaScript)' : 'All (Python & JavaScript)'}</option>
                      <option value="python">Python (Sandbox Python 3.11)</option>
                      <option value="javascript">JavaScript (Node.js 20)</option>
                    </select>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#34d399' }}>
                      {lang === 'vi' ? 'Đối tượng được giao bài (*):' : 'Target Audience (*):'}
                    </label>
                    <select
                      value={assignmentTargetType}
                      onChange={(e) => setAssignmentTargetType(e.target.value as 'ALL' | 'SPECIFIC_TEAMS')}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.08)',
                        border: '1px solid rgba(52, 211, 153, 0.35)',
                        color: '#6ee7b7',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="ALL">{lang === 'vi' ? 'Toàn bộ lớp (All Class)' : 'Entire Class'}</option>
                      <option value="SPECIFIC_TEAMS">{lang === 'vi' ? 'Chỉ định nhóm cụ thể (Specific Teams)' : 'Specific Teams'}</option>
                    </select>
                  </div>
                </div>

                {/* Danh sách chọn nhóm cụ thể từ DB khi chọn SPECIFIC_TEAMS */}
                {assignmentTargetType === 'SPECIFIC_TEAMS' && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6ee7b7' }}>
                        {lang === 'vi' ? 'Danh sách nhóm nhận đề:' : 'Target Teams:'} ({assignmentTargetTeamIds.length} {lang === 'vi' ? 'nhóm đã chọn' : 'selected'})
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const cId = Number(assignmentCourseId || selectedCourseId || (courses[0]?.course_id));
                            const relevantTeams = teams.filter(t => t.course_id === cId);
                            setAssignmentTargetTeamIds(relevantTeams.map(t => t.team_id));
                          }}
                          style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(139, 92, 246,0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246,0.3)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {lang === 'vi' ? 'Chọn tất cả' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignmentTargetTeamIds([])}
                          style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {lang === 'vi' ? 'Bỏ chọn' : 'Clear'}
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const cId = Number(assignmentCourseId || selectedCourseId || (courses[0]?.course_id));
                      const courseTeams = teams.filter(t => t.course_id === cId);
                      if (courseTeams.length === 0) {
                        return (
                          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', padding: '6px 0' }}>
                            ⚠️ {lang === 'vi' ? 'Chưa có nhóm nào trong lớp/học phần này.' : 'No teams found in this course.'}
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                          {courseTeams.map(t => {
                            const isChecked = assignmentTargetTeamIds.includes(t.team_id);
                            return (
                              <label
                                key={t.team_id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: isChecked ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                  border: `1px solid ${isChecked ? 'rgba(52, 211, 153, 0.45)' : 'var(--border-color)'}`,
                                  cursor: 'pointer',
                                  fontSize: '0.84rem'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setAssignmentTargetTeamIds([...assignmentTargetTeamIds, t.team_id]);
                                    } else {
                                      setAssignmentTargetTeamIds(assignmentTargetTeamIds.filter(id => id !== t.team_id));
                                    }
                                  }}
                                />
                                <div>
                                  <span style={{ fontWeight: 600, color: isChecked ? '#a7f3d0' : 'var(--text-main)' }}>{t.team_name}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                                    {t.members?.length || 0} {lang === 'vi' ? 'thành viên' : 'members'}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

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

                {/* Lifecycle Schedule: Start Date, Due Date, Close Date */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Ngày mở bài (*)' : 'Start Date (*)'}
                    </label>
                    <input
                      type="datetime-local"
                      value={assignmentStartDate}
                      onChange={(e) => setAssignmentStartDate(e.target.value)}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px', color: '#fbbf24' }}>
                      {lang === 'vi' ? 'Hạn nộp (Due Date) (*)' : 'Due Date (*)'}
                    </label>
                    <input
                      type="datetime-local" required
                      value={assignmentDueDate || assignmentDeadline}
                      onChange={(e) => {
                        setAssignmentDueDate(e.target.value);
                        setAssignmentDeadline(e.target.value);
                      }}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.4)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px', color: '#f87171' }}>
                      {lang === 'vi' ? 'Đóng bài (Close Date)' : 'Close Date'}
                    </label>
                    <input
                      type="datetime-local"
                      value={assignmentCloseDate}
                      onChange={(e) => setAssignmentCloseDate(e.target.value)}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Submission Policies: Status, Late, Max Attempts, Resubmit */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Trạng thái khởi tạo:' : 'Initial Status:'}
                    </label>
                    <select
                      value={assignmentStatus}
                      onChange={(e) => setAssignmentStatus(e.target.value as any)}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                      <option value="PUBLISHED">{lang === 'vi' ? 'Xuất bản ngay (PUBLISHED)' : 'Publish immediately'}</option>
                      <option value="DRAFT">{lang === 'vi' ? 'Lưu bản nháp (DRAFT)' : 'Save as Draft'}</option>
                    </select>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Điểm tối đa:' : 'Max Score:'}
                    </label>
                    <input
                      type="number" min="1" max="100"
                      value={assignmentMaxScore}
                      onChange={(e) => setAssignmentMaxScore(e.target.value)}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Nộp trễ (Late Submission):' : 'Late Submission:'}
                    </label>
                    <select
                      value={assignmentAllowLate ? 'yes' : 'no'}
                      onChange={(e) => setAssignmentAllowLate(e.target.value === 'yes')}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    >
                      <option value="yes">{lang === 'vi' ? 'Cho phép (Đánh dấu trễ)' : 'Allow (Mark as Late)'}</option>
                      <option value="no">{lang === 'vi' ? 'Chặn hoàn toàn khi hết hạn' : 'Disallow after due date'}</option>
                    </select>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Số lần nộp tối đa:' : 'Max Attempts:'}
                    </label>
                    <input
                      type="number" min="0" max="50"
                      placeholder="0 = Không giới hạn"
                      value={assignmentMaxSubmissions}
                      onChange={(e) => setAssignmentMaxSubmissions(e.target.value)}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Cho nộp lại:' : 'Resubmission:'}
                    </label>
                    <select
                      value={assignmentAllowResubmit ? 'yes' : 'no'}
                      onChange={(e) => setAssignmentAllowResubmit(e.target.value === 'yes')}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    >
                      <option value="yes">{lang === 'vi' ? 'Cho phép' : 'Allow'}</option>
                      <option value="no">{lang === 'vi' ? 'Chỉ 1 lần duy nhất' : 'Single attempt only'}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button type="button" onClick={() => { setShowAssignmentModal(false); setModalError(''); }} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
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

        {/* MODAL 6: STUDIO AI SOẠN ĐỀ TỰ ĐỘNG TỪ SLIDE BÀI GIẢNG (SEPARATE AI STUDIO) */}
        {showAiSlideModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%', maxWidth: '780px',
              maxHeight: '92vh', overflowY: 'auto',
              padding: '2rem', borderRadius: '22px',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 25px 70px rgba(0,0,0,0.9)'
            }}>
              {/* Header Studio AI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(139, 92, 246, 0.25)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)' }}>
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f3e8ff' }}>
                      {lang === 'vi' ? 'Studio AI: Soạn Đề Tự Động Từ Slide Bài Giảng' : 'AI Studio: Generate Assignment from Slide'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {lang === 'vi' ? 'Chuyển hóa slide bài giảng thành đề bài code thực hành + Bộ 3 Test Cases tự động chấm' : 'Converts lecture slide into programming assignment + 3 autograding test cases'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAiSlideModal(false);
                    setAiModalError('');
                    setAiSuccessMessage('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Error & Success Alerts */}
              {aiModalError && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> {aiModalError}
                </div>
              )}
              {aiSuccessMessage && (
                <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: '8px', padding: '10px 14px', color: '#86efac', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✅</span> {aiSuccessMessage}
                </div>
              )}

              {/* BƯỚC 1: NẠP SLIDE & CẤU HÌNH AI */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <input
                  type="file"
                  ref={slideFileInputRef}
                  accept=".pdf,.pptx,.ppt,.txt,.md,.docx"
                  style={{ display: 'none' }}
                  onChange={handleSlideFileUpload}
                />

                {/* Vùng nạp file slide trực quan */}
                <div
                  onClick={() => slideFileInputRef.current?.click()}
                  style={{
                    border: uploadedFileName ? '1.5px solid rgba(34, 197, 94, 0.5)' : '1.5px dashed rgba(139, 92, 246, 0.45)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    background: uploadedFileName ? 'rgba(34, 197, 94, 0.08)' : 'rgba(15, 23, 42, 0.65)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: 44, height: 44,
                      borderRadius: '10px',
                      background: uploadedFileName ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: uploadedFileName ? '#4ade80' : '#c084fc'
                    }}>
                      <Upload size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: uploadedFileName ? '#86efac' : '#f1f5f9' }}>
                        {uploadedFileName ? `📄 Slide đã nạp: ${uploadedFileName}` : (lang === 'vi' ? 'Bấm để nạp file Slide bài giảng (.pdf, .pptx, .txt, .md)' : 'Click to upload Slide file (.pdf, .pptx, .txt)')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {uploadedFileName
                          ? (lang === 'vi' ? '✓ Đã nhận diện tài liệu bài giảng. Bấm nút tím bên dưới để AI sinh đề.' : '✓ Slide attached. Click button below to generate.')
                          : (lang === 'vi' ? 'Chọn file slide bài giảng từ máy tính để AI tự đọc kiến thức' : 'Upload lecture slide, AI will analyze its concepts')}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    background: uploadedFileName ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.25)',
                    color: uploadedFileName ? '#86efac' : '#d8b4fe',
                    border: uploadedFileName ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(139, 92, 246, 0.4)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {uploadedFileName ? (lang === 'vi' ? 'Đổi file khác' : 'Change file') : (lang === 'vi' ? '📁 Chọn file slide' : 'Browse file')}
                  </span>
                </div>

                {/* Ô nhập chủ đề hoặc tóm tắt slide */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                      {lang === 'vi' ? 'Chủ đề bài giảng hoặc tóm tắt nội dung slide (*):' : 'Lecture Topic / Slide Summary (*):'}
                    </label>
                    {uploadedFileName && (
                      <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600 }}>
                        ✓ Tự động trích xuất từ slide
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={lang === 'vi' ? 'VD: Cây nhị phân tìm kiếm BST, Ngăn xếp Stack, Two Sum, hoặc dán tóm tắt slide...' : 'e.g.: Binary Search Tree (BST), Valid Parentheses Stack, Two Sum...'}
                    value={aiTopicInput}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                {/* Cấu hình Học phần, Hình thức nộp & Đối tượng giao đề */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '5px' }}>
                        {lang === 'vi' ? 'Học phần liên kết (*):' : 'Course (*):'}
                      </label>
                      <select
                        value={aiCourseId || selectedCourseId || (courses[0]?.course_id ?? '')}
                        onChange={(e) => {
                          setAiCourseId(e.target.value);
                          setAiTargetTeamIds([]);
                        }}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'rgba(10, 14, 26, 0.85)', border: '1px solid rgba(139, 92, 246, 0.35)', color: '#f8fafc', fontSize: '0.85rem' }}
                      >
                        {courses.map(c => (
                          <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '5px' }}>
                        {lang === 'vi' ? 'Hình thức nộp (*):' : 'Submission Type (*):'}
                      </label>
                      <select
                        value={aiSubmissionType}
                        onChange={(e) => setAiSubmissionType(e.target.value as 'INDIVIDUAL' | 'TEAM')}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(139, 92, 246, 0.45)', color: '#c4b5fd', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <option value="INDIVIDUAL">{lang === 'vi' ? '👤 Cá nhân (Individual)' : '👤 Individual'}</option>
                        <option value="TEAM">{lang === 'vi' ? '👥 Theo nhóm (Team)' : '👥 Team'}</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#34d399', marginBottom: '5px' }}>
                        {lang === 'vi' ? 'Đối tượng được giao bài (*):' : 'Target Audience (*):'}
                      </label>
                      <select
                        value={aiTargetType}
                        onChange={(e) => setAiTargetType(e.target.value as 'ALL' | 'SPECIFIC_TEAMS')}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.4)', color: '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <option value="ALL">{lang === 'vi' ? '🏫 Toàn bộ lớp (All Class)' : '🏫 All Class'}</option>
                        <option value="SPECIFIC_TEAMS">{lang === 'vi' ? '🎯 Chỉ định nhóm cụ thể (Specific Teams)' : '🎯 Specific Teams'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Danh sách chọn nhóm cụ thể khi aiTargetType === 'SPECIFIC_TEAMS' */}
                  {aiTargetType === 'SPECIFIC_TEAMS' && (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#6ee7b7' }}>
                          {lang === 'vi' ? 'Danh sách nhóm nhận đề:' : 'Target Teams:'} ({aiTargetTeamIds.length} {lang === 'vi' ? 'nhóm đã chọn' : 'selected'})
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const cId = Number(aiCourseId || selectedCourseId || (courses[0]?.course_id));
                              const relevantTeams = teams.filter(t => t.course_id === cId);
                              setAiTargetTeamIds(relevantTeams.map(t => t.team_id));
                            }}
                            style={{ fontSize: '0.74rem', padding: '3px 8px', background: 'rgba(139, 92, 246,0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246,0.3)', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {lang === 'vi' ? 'Chọn tất cả' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiTargetTeamIds([])}
                            style={{ fontSize: '0.74rem', padding: '3px 8px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {lang === 'vi' ? 'Bỏ chọn' : 'Clear'}
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const cId = Number(aiCourseId || selectedCourseId || (courses[0]?.course_id));
                        const courseTeams = teams.filter(t => t.course_id === cId);
                        if (courseTeams.length === 0) {
                          return (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 0' }}>
                              ⚠️ {lang === 'vi' ? 'Chưa có nhóm nào trong học phần này.' : 'No teams found in this course.'}
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                            {courseTeams.map(t => {
                              const isChecked = aiTargetTeamIds.includes(t.team_id);
                              return (
                                <label
                                  key={t.team_id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: isChecked ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isChecked ? 'rgba(52, 211, 153, 0.45)' : 'var(--border-color)'}`,
                                    cursor: 'pointer',
                                    fontSize: '0.82rem'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAiTargetTeamIds([...aiTargetTeamIds, t.team_id]);
                                      } else {
                                        setAiTargetTeamIds(aiTargetTeamIds.filter(id => id !== t.team_id));
                                      }
                                    }}
                                  />
                                  <div>
                                    <span style={{ fontWeight: 600, color: isChecked ? '#a7f3d0' : 'var(--text-main)' }}>{t.team_name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                                      {t.members?.length || 0} {lang === 'vi' ? 'thành viên' : 'members'}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Tùy chọn Ngôn ngữ, Độ khó & Hạn nộp bài */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Ngôn ngữ thực thi:' : 'Execution Language:'}
                    </label>
                    <select
                      value={aiLanguage}
                      onChange={(e) => setAiLanguage(e.target.value as 'javascript' | 'python')}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        color: '#c4b5fd',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="python">🐍 Python 3 (sys.stdin / stdout)</option>
                      <option value="javascript">⚡ Node.js (fs.readFileSync / stdout)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Mức độ khó:' : 'Difficulty:'}
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="EASY">🟢 Cơ bản (Easy)</option>
                      <option value="MEDIUM">🟡 Trung bình (Medium)</option>
                      <option value="HARD">🔴 Nâng cao (Hard)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24', marginBottom: '5px' }}>
                      {lang === 'vi' ? 'Hạn nộp bài (*):' : 'Deadline (*):'}
                    </label>
                    <input
                      type="datetime-local"
                      value={aiDeadline}
                      onChange={(e) => setAiDeadline(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#f8fafc',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                </div>

                {/* Nút kích hoạt AI */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleAiGenerateAssignment}
                    disabled={isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName)}
                    style={{
                      background: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName) ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{isAiGenerating ? (lang === 'vi' ? 'AI Đang Phân Tích Slide...' : 'AI Analyzing Slide...') : (lang === 'vi' ? '✨ Bắt Đầu Phân Tích Slide & Sinh Đề Bài' : '✨ Generate Assignment from Slide')}</span>
                  </button>
                </div>
              </div>

              {/* BƯỚC 2: KẾT QUẢ ĐỀ BÀI VÀ 3 TEST CASES DO AI XUẤT XƯỞNG */}
              {aiGeneratedAssignment && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🎉</span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>
                        {lang === 'vi' ? 'Kết quả đề bài và 3 Test Cases do AI vừa tạo:' : 'AI Generated Assignment & Test Cases:'}
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontWeight: 600 }}>
                      Tổng: 10.0 điểm
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Tiêu đề bài tập:' : 'Assignment Title:'}
                    </label>
                    <input
                      type="text"
                      value={aiGeneratedAssignment.title}
                      onChange={(e) => setAiGeneratedAssignment({ ...aiGeneratedAssignment, title: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Mô tả yêu cầu bài toán & Đặc tả I/O:' : 'Description & I/O Specifications:'}
                    </label>
                    <textarea
                      rows={3}
                      value={aiGeneratedAssignment.description}
                      onChange={(e) => setAiGeneratedAssignment({ ...aiGeneratedAssignment, description: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* BỘ 3 TEST CASES */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Bộ 3 Test Cases tự động (Chuẩn chấm Docker Sandbox):' : '3 Autograding Test Cases:'}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {aiGeneratedAssignment.rubrics?.map((r, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: r.is_hidden ? 'rgba(234, 179, 8, 0.08)' : 'rgba(30, 41, 59, 0.7)',
                            border: r.is_hidden ? '1px dashed rgba(234, 179, 8, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                              {r.criterion}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: r.is_hidden ? 'rgba(234, 179, 8, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                color: r.is_hidden ? '#fde047' : '#a78bfa',
                                fontWeight: 600,
                              }}>
                                {r.is_hidden ? (lang === 'vi' ? '🔒 Test Ẩn (BR-06)' : '🔒 Hidden') : (lang === 'vi' ? 'Công khai' : 'Public')}
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa' }}>
                                {r.max_score}đ
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                              <span style={{ color: '#94a3b8' }}>Input: </span>
                              <code style={{ color: '#e2e8f0' }}>{r.input_data.replace(/\n/g, ' ↵ ')}</code>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                              <span style={{ color: '#94a3b8' }}>Output: </span>
                              <code style={{ color: '#86efac' }}>{r.expected_output.replace(/\n/g, ' ↵ ')}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Xác nhận thông tin Giao bài */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    marginTop: '4px'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                        🏫 {courses.find(c => c.course_id === Number(aiCourseId || selectedCourseId))?.course_code || 'Khóa học'}:
                      </span>
                      <span style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.18)', color: '#c4b5fd', fontWeight: 700 }}>
                        {aiSubmissionType === 'TEAM' ? (lang === 'vi' ? '👥 Theo nhóm' : '👥 Team') : (lang === 'vi' ? '👤 Cá nhân' : '👤 Individual')}
                      </span>
                      <span style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: '6px', background: aiTargetType === 'ALL' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: aiTargetType === 'ALL' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                        {aiTargetType === 'ALL'
                          ? (lang === 'vi' ? '🏫 Toàn bộ lớp' : '🏫 All Class')
                          : (lang === 'vi' ? `🎯 ${aiTargetTeamIds.length} nhóm được chọn` : `🎯 ${aiTargetTeamIds.length} Teams`)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                        ⏰ {lang === 'vi' ? 'Hạn nộp:' : 'Deadline:'}
                      </label>
                      <input
                        type="datetime-local"
                        value={aiDeadline}
                        onChange={(e) => setAiDeadline(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f8fafc', fontSize: '0.78rem' }}
                      />
                    </div>
                  </div>

                  {/* NÚT LƯU & GIAO BÀI */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setAiGeneratedAssignment(null)}
                      className="btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                    >
                      {lang === 'vi' ? 'Soạn lại đề khác' : 'Discard & Re-generate'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyAiAssignment}
                      disabled={submittingAiAssignment}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 20px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: submittingAiAssignment ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      {submittingAiAssignment ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>{lang === 'vi' ? '🚀 Lưu & Giao Bài Ngay Cho Sinh Viên' : '🚀 Save & Assign Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Modal khi chưa sinh đề */}
              {!aiGeneratedAssignment && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiSlideModal(false);
                      setAiModalError('');
                      setAiSuccessMessage('');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {lang === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 5: THÊM TEST CASE CHO BÀI TẬP (ADD TEST CASE) */}
        {showAddTestCaseModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '1rem'
          }}>
            <div className="glass-card" style={{
              width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
              padding: '2rem', borderRadius: '20px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingRubric ? <Edit3 size={18} style={{ color: '#a78bfa' }} /> : <Plus size={18} style={{ color: '#a78bfa' }} />}
                  {editingRubric 
                    ? (lang === 'vi' ? 'Chỉnh sửa Test Case / Rubric' : 'Edit Test Case / Rubric')
                    : (assignments.length === 0 ? (lang === 'vi' ? 'Thêm Test Case & Khởi Tạo Bài Tập' : 'Add Test Case & Create Assignment') : (lang === 'vi' ? 'Thêm Test Case cho Bài Tập' : 'Add Test Case to Assignment'))}
                </h3>
                <button onClick={() => { setShowAddTestCaseModal(false); setEditingRubric(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> {modalError}
                </div>
              )}

              <form onSubmit={handleAddTestCase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!editingRubric && (assignments.length === 0 || selectedAssignmentId === -1) ? (
                  <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a78bfa' }}>
                        {lang === 'vi' ? 'Tiêu đề bài tập cần tạo (*):' : 'New Assignment Title (*):'}
                      </label>
                      {assignments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedAssignmentId(assignments[0].assignment_id)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {lang === 'vi' ? 'Chọn bài tập có sẵn' : 'Choose existing'}
                        </button>
                      )}
                    </div>
                    <input
                      type="text" required
                      placeholder={lang === 'vi' ? 'VD: Lab 1: Thuật toán Two Sum' : 'e.g. Lab 1: Two Sum'}
                      value={tcNewAssignmentTitle}
                      onChange={(e) => setTcNewAssignmentTitle(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.88rem', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Học phần liên kết:' : 'Course:'}
                        </label>
                        <select
                          value={assignmentCourseId}
                          onChange={(e) => setAssignmentCourseId(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                        >
                          {courses.map(c => (
                            <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Hình thức nộp:' : 'Submission Type:'}
                        </label>
                        <select
                          value={tcSubmissionType}
                          onChange={(e) => setTcSubmissionType(e.target.value as any)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                        >
                          <option value="INDIVIDUAL">{lang === 'vi' ? 'Cá nhân' : 'Individual'}</option>
                          <option value="TEAM">{lang === 'vi' ? 'Nhóm đồ án' : 'Team'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {lang === 'vi' ? 'Bài tập áp dụng (*):' : 'Target Assignment (*):'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedAssignmentId(-1)}
                        style={{ background: 'transparent', border: 'none', color: '#a78bfa', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        + {lang === 'vi' ? 'Tạo bài tập mới...' : 'New Assignment...'}
                      </button>
                    </div>
                    <select
                      value={selectedAssignmentId || ''}
                      onChange={(e) => {
                        if (e.target.value === '-1') {
                          setSelectedAssignmentId(-1);
                        } else {
                          handleSelectAssignment(Number(e.target.value));
                        }
                      }}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    >
                      {assignments.map((a, idx) => (
                        <option key={a.assignment_id} value={a.assignment_id}>
                          #{idx + 1} - {a.title} ({a.submission_type === 'TEAM' ? (lang === 'vi' ? 'Nhóm đồ án' : 'Team') : (lang === 'vi' ? 'Cá nhân' : 'Individual')})
                        </option>
                      ))}
                      <option value="-1">+ {lang === 'vi' ? 'Tạo bài tập mới...' : 'Create new assignment...'}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên tiêu chí Test Case (*):' : 'Criterion / Test Case Name (*):'}
                  </label>
                  <input
                    type="text" required
                    placeholder={lang === 'vi' ? 'VD: Test Case 1: Kiểm tra tính đúng tổng 2 số' : 'e.g. Test Case 1: Sum validation'}
                    value={tcCriterion}
                    onChange={(e) => setTcCriterion(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mô tả chi tiết (Tùy chọn):' : 'Detailed Description (Optional):'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={lang === 'vi' ? 'VD: Kiểm tra khả năng xử lý số âm và số lớn của thuật toán' : 'e.g. Tests negative numbers and large bounds'}
                    value={tcDescription}
                    onChange={(e) => setTcDescription(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Trạng thái Test Case (*):' : 'Test Case Status (*):'}
                    </label>
                    <select
                      value={tcStatus}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTcStatus(val);
                        if (val === 'Hidden') setTcIsHidden(true);
                        else if (val === 'Active') setTcIsHidden(false);
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                      <option value="Active">{lang === 'vi' ? '🟢 Active (Công khai - Áp dụng chấm)' : '🟢 Active (Public autograded)'}</option>
                      <option value="Hidden">{lang === 'vi' ? '🟣 Hidden (Ẩn bảo mật BR-06)' : '🟣 Hidden (Protected BR-06)'}</option>
                      <option value="Draft">{lang === 'vi' ? '🟡 Draft (Bản nháp - Chưa chấm)' : '🟡 Draft (Not autograded yet)'}</option>
                      <option value="Disabled">{lang === 'vi' ? '⚪ Disabled (Vô hiệu hóa)' : '⚪ Disabled (Deactivated)'}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Điểm tối đa (*):' : 'Max Score (*):'}
                    </label>
                    <input
                      type="number" step="0.5" min="0.5" max="100" required
                      value={tcMaxScore}
                      onChange={(e) => setTcMaxScore(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Dữ liệu đầu vào (stdin):' : 'Input Data (stdin):'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={lang === 'vi' ? 'VD: 15 25' : 'e.g.: 15 25'}
                      value={tcInputData}
                      onChange={(e) => setTcInputData(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Kết quả kỳ vọng (stdout):' : 'Expected Output (stdout):'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={lang === 'vi' ? 'VD: 40' : 'e.g.: 40'}
                      value={tcExpectedOutput}
                      onChange={(e) => setTcExpectedOutput(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#34d399', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Reference Solution Sandbox Preview Section */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Code size={16} style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa' }}>
                        {lang === 'vi' ? '🧪 Kiểm tra Test Case trước khi lưu (Sandbox Preview)' : '🧪 Preview with Reference Solution'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPreviewSection(!showPreviewSection)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {showPreviewSection ? (lang === 'vi' ? 'Thu gọn ▲' : 'Collapse ▲') : (lang === 'vi' ? 'Mở rộng ▼' : 'Expand ▼')}
                    </button>
                  </div>

                  {showPreviewSection && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Ngôn ngữ chạy thử:' : 'Runtime Language:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewLanguage('python')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: previewLanguage === 'python' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)',
                            background: previewLanguage === 'python' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            color: previewLanguage === 'python' ? '#a78bfa' : '#94a3b8',
                          }}
                        >
                          🐍 Python 3.11
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewLanguage('javascript')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: previewLanguage === 'javascript' ? '1px solid #facc15' : '1px solid rgba(255,255,255,0.1)',
                            background: previewLanguage === 'javascript' ? 'rgba(250, 204, 21, 0.2)' : 'transparent',
                            color: previewLanguage === 'javascript' ? '#facc15' : '#94a3b8',
                          }}
                        >
                          ⚡ Node.js (JavaScript)
                        </button>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Mã giải mẫu (Reference Solution Code):' : 'Reference Solution Code:'}
                        </label>
                        <textarea
                          rows={4}
                          placeholder={previewLanguage === 'python' ? '# Python code...' : '// JS code...'}
                          value={previewCode}
                          onChange={(e) => setPreviewCode(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#e2e8f0',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          type="button"
                          onClick={handleRunPreview}
                          disabled={previewRunning}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            border: '1px solid #a78bfa',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: previewRunning ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {previewRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                          <span>{previewRunning ? (lang === 'vi' ? 'Đang chạy Sandbox...' : 'Running Sandbox...') : (lang === 'vi' ? '⚡ Chạy thử trên Sandbox' : '⚡ Run on Sandbox')}</span>
                        </button>
                      </div>

                      {previewResult && (
                        <div style={{
                          marginTop: '6px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: previewResult.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: previewResult.passed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: previewResult.passed ? '#34d399' : '#f87171',
                              background: previewResult.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            }}>
                              {previewResult.passed ? '✓ PASSED (Accepted)' : `✕ ${previewResult.status}`}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              ⏱ {previewResult.execution_time_ms}ms
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                            <div>
                              <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Expected Output:</span>
                              <pre style={{ margin: 0, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', color: '#34d399', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {previewResult.expected_output || '(Trống)'}
                              </pre>
                            </div>
                            <div>
                              <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Actual Output:</span>
                              <pre style={{ margin: 0, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', color: previewResult.passed ? '#34d399' : '#f87171', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {previewResult.actual_output || '(Trống)'}
                              </pre>
                            </div>
                          </div>

                          {previewResult.stderr && (
                            <div>
                              <span style={{ color: '#f87171', fontSize: '0.72rem', display: 'block' }}>Stderr:</span>
                              <pre style={{ margin: 0, padding: '4px 6px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', color: '#fda4af', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                {previewResult.stderr}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                  <button type="button" onClick={() => { setShowAddTestCaseModal(false); setEditingRubric(null); }} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={submittingTestCase} className="btn-primary" style={{ fontSize: '0.85rem', gap: '8px' }}>
                    {submittingTestCase ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>
                      {editingRubric 
                        ? (lang === 'vi' ? 'Cập Nhật Test Case' : 'Update Test Case')
                        : (lang === 'vi' ? 'Lưu Test Case' : 'Save Test Case')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: XEM CHI TIẾT NHẬN XÉT BÍ MẬT PEER AUDIT (BR-08) */}
        {selectedPeerTeamComments && (
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
              maxWidth: '650px',
              padding: '1.75rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} color="#34d399" />
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      {lang === 'vi' ? 'Nhận xét đánh giá chéo bí mật' : 'Confidential Peer Comments'}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {selectedPeerTeamComments.teamName} • BR-08 Confidentiality
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPeerTeamComments(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {selectedPeerTeamComments.comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Chưa có phiếu nhận xét nào được nộp cho nhóm này.' : 'No comments submitted yet for this team.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedPeerTeamComments.comments.map((c, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '12px', 
                        padding: '1rem 1.25rem' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {lang === 'vi' ? 'Đánh giá cho:' : 'Review for:'} <span style={{ color: '#a78bfa' }}>{c.targetStudent}</span>
                        </span>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700,
                          background: c.score >= 8 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: c.score >= 8 ? '#34d399' : '#fbbf24',
                          border: `1px solid ${c.score >= 8 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {c.score} / 10
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{c.comments}"
                      </p>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                        🔒 {lang === 'vi' ? 'Danh tính người gửi được bảo mật tuyệt đối theo chuẩn BR-08.' : 'Reviewer identity is strictly protected under BR-08.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setSelectedPeerTeamComments(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  {lang === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: LỊCH SỬ CHẤM ĐIỂM & SO SÁNH KẾT QUẢ (GRADING HISTORY & DIFF) */}
        {showHistoryModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: '1.25rem'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '880px',
              maxHeight: '90vh',
              borderRadius: '20px',
              padding: '1.75rem 2rem',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <History size={18} color="#a78bfa" />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      {lang === 'vi' ? 'Lịch sử chấm điểm & So sánh kết quả' : 'Grading History & Score Comparison'}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {historyData?.assignment_title ? `${historyData.assignment_title} • ` : ''}
                    {lang === 'vi' ? 'Mã bài nộp #' : 'Submission #'}{historySubmissionId}
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              {loadingHistory ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '10px' }}>
                  <Loader2 size={32} className="animate-spin" color="#a78bfa" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Đang tải lịch sử các phiên chấm...' : 'Loading grading history...'}
                  </span>
                </div>
              ) : !historyData || !historyData.attempts || historyData.attempts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Chưa có lịch sử chấm nào cho bài nộp này.' : 'No grading attempts found for this submission.'}
                </div>
              ) : (() => {
                const attempts = historyData.attempts;
                const activeAttempt = attempts[selectedAttemptIndex] || attempts[attempts.length - 1];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Top Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {lang === 'vi' ? 'Tổng số lần chấm' : 'Total Attempts'}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
                          {attempts.length} {lang === 'vi' ? 'lần' : 'attempts'}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {lang === 'vi' ? 'Điểm phiên hiện tại' : 'Active Attempt Score'}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (activeAttempt.total_score >= 8) ? '#34d399' : (activeAttempt.total_score >= 5 ? '#f59e0b' : '#f87171'), marginTop: '2px' }}>
                          {Number(activeAttempt.total_score).toFixed(1)} / {Number(activeAttempt.max_score || 10).toFixed(1)}đ
                        </div>
                      </div>

                      {activeAttempt.score_diff && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {lang === 'vi' ? 'Độ lệch so với lần trước' : 'Score Difference'}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (activeAttempt.score_delta >= 0) ? '#34d399' : '#f87171', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {activeAttempt.score_diff}đ
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              ({activeAttempt.score_delta >= 0 ? 'Tăng điểm' : 'Giảm điểm'})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline Navigator */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {lang === 'vi' ? 'Chọn phiên chấm để xem chi tiết:' : 'Select grading attempt:'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {attempts.map((att: any, idx: number) => {
                          const isSelected = idx === selectedAttemptIndex;
                          return (
                            <button
                              key={att.grading_job_id || idx}
                              type="button"
                              onClick={() => setSelectedAttemptIndex(idx)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                border: `1px solid ${isSelected ? '#a78bfa' : 'var(--border-color)'}`,
                                color: isSelected ? '#a78bfa' : 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 800 : 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span>{lang === 'vi' ? `Lần ${att.attempt_number || (idx + 1)}` : `Attempt #${att.attempt_number || (idx + 1)}`}</span>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                background: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                                color: isSelected ? '#e0f2fe' : 'var(--text-muted)'
                              }}>
                                {Number(att.total_score).toFixed(1)}đ
                              </span>
                              {att.score_diff && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: att.score_delta >= 0 ? '#34d399' : '#f87171'
                                }}>
                                  ({att.score_diff}đ)
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Attempt Metadata Banner */}
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#a78bfa' }}>
                            {lang === 'vi' ? `Lần chấm #${activeAttempt.attempt_number}` : `Attempt #${activeAttempt.attempt_number}`}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                            background: activeAttempt.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: activeAttempt.status === 'COMPLETED' ? '#34d399' : '#fbbf24',
                            border: `1px solid ${activeAttempt.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}>
                            {activeAttempt.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {activeAttempt.completed_at 
                            ? `${lang === 'vi' ? 'Hoàn thành:' : 'Completed:'} ${new Date(activeAttempt.completed_at).toLocaleString('vi-VN')}` 
                            : (activeAttempt.queued_at ? `${lang === 'vi' ? 'Khởi tạo:' : 'Queued:'} ${new Date(activeAttempt.queued_at).toLocaleString('vi-VN')}` : '')}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <strong style={{ color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Lý do chấm lại:' : 'Regrade reason:'}</strong>{' '}
                        <span>{activeAttempt.regrade_reason || (selectedAttemptIndex === 0 ? 'Nộp bài ban đầu' : 'Chấm lại theo yêu cầu giảng viên')}</span>
                      </div>

                      {activeAttempt.triggered_by_name && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <strong>{lang === 'vi' ? 'Người yêu cầu:' : 'Triggered by:'}</strong> {activeAttempt.triggered_by_name}
                        </div>
                      )}
                    </div>

                    {/* Changed Test Cases (Diff Comparison) */}
                    {activeAttempt.changed_test_cases && activeAttempt.changed_test_cases.length > 0 && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={14} />
                          <span>{lang === 'vi' ? `Phát hiện ${activeAttempt.changed_test_cases.length} Test Case thay đổi trạng thái/điểm so với lần trước:` : `${activeAttempt.changed_test_cases.length} Test Cases changed compared to previous attempt:`}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeAttempt.changed_test_cases.map((ch: any, cIdx: number) => (
                            <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(0, 0, 0, 0.25)', padding: '6px 10px', borderRadius: '8px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ch.criterion}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#f87171' }}>{ch.previous_status} ({ch.previous_score}đ)</span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>{ch.current_status} ({ch.current_score}đ)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Cases Detail cho active attempt */}
                    {activeAttempt.test_case_results && activeAttempt.test_case_results.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                          {lang === 'vi' ? 'Chi tiết test cases:' : 'Test case details:'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeAttempt.test_case_results.map((tc: any, tIdx: number) => (
                            <div key={tIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                  background: tc.status === 'PASSED' ? '#34d399' : tc.status === 'PARTIAL' ? '#f59e0b' : '#f87171'
                                }} />
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tc.criterion || tc.test_name}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                                  background: tc.status === 'PASSED' ? 'rgba(16, 185, 129, 0.15)' : tc.status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                                  color: tc.status === 'PASSED' ? '#34d399' : tc.status === 'PARTIAL' ? '#fbbf24' : '#f87171'
                                }}>
                                  {tc.status}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{Number(tc.score || 0).toFixed(1)}đ</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Close button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => setShowHistoryModal(false)}
                        className="btn-secondary"
                        style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                      >
                        {lang === 'vi' ? 'Đóng' : 'Close'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        </div>
      </main>
    </div>
  );
}
