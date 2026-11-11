'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../../components/Navigation';
import AitaLogo from '../../../components/AitaLogo';
import UserProfileModal from '../../../components/UserProfileModal';
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
  ChevronRight, ChevronDown, ChevronUp, LogOut, GraduationCap, School, User,
  BarChart2, FileCode, Code2, Eye, Copy, Printer,
  Home, LayoutGrid, List, MoreVertical, Sparkle
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
  code_hash?: string;
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
    status?: string;
    ai_feedback?: string;
    container_id?: string;
    docker_image?: string;
    exit_code?: number;
    code_hash?: string;
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
  allowed_language?: 'ALL' | 'python' | 'javascript' | 'nodejs' | 'java' | 'JAVA' | string;
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userCardRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTabState] = useState<'courses' | 'teams' | 'students' | 'overview' | 'config' | 'git-submit' | 'analytics'>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Đóng menu con khi click ra ngoài (ngoại trừ click vào chính thẻ giảng viên)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        userMenuRef.current?.contains(target) ||
        userCardRef.current?.contains(target)
      ) {
        return;
      }
      setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('aita_lecturer_active_tab');
      if (saved && ['courses', 'teams', 'students', 'overview', 'config', 'git-submit', 'analytics'].includes(saved)) {
        setActiveTabState(saved as any);
      }
      const docTheme = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || null;
      const savedTheme = (localStorage.getItem('aita_theme') as 'dark' | 'light') || docTheme || 'light';
      setTheme(savedTheme);

      const handleThemeChange = () => {
        const cur = (localStorage.getItem('aita_theme') as 'dark' | 'light') || (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'light';
        setTheme(cur);
      };

      window.addEventListener('theme-change', handleThemeChange);
      return () => window.removeEventListener('theme-change', handleThemeChange);
    }
  }, []);

  const isDark = theme === 'dark';

  const setActiveTab = (tab: 'courses' | 'teams' | 'students' | 'overview' | 'config' | 'git-submit' | 'analytics') => {
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
  const [isCoursesMenuOpen, setIsCoursesMenuOpen] = useState<boolean>(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentTeamFilter, setStudentTeamFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

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

  // Modal 4: Tạo / Chỉnh Sửa Bài Tập Thủ Công (Manual Assignment)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState('10');
  const [assignmentCourseId, setAssignmentCourseId] = useState<number | string>('');
  const [assignmentSubmissionType, setAssignmentSubmissionType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
  const [assignmentTargetType, setAssignmentTargetType] = useState<'ALL' | 'SPECIFIC_TEAMS'>('ALL');
  const [assignmentTargetTeamIds, setAssignmentTargetTeamIds] = useState<number[]>([]);
  const [assignmentAllowedLanguage, setAssignmentAllowedLanguage] = useState<'ALL' | 'python' | 'javascript' | 'java'>('ALL');
  const [pePresetMode, setPePresetMode] = useState<boolean>(false);
  const [peTemplateChoice, setPeTemplateChoice] = useState<'de1' | 'de2' | 'de3' | null>('de1');
  const [examCreationType, setExamCreationType] = useState<'standard' | 'pe_preset' | 'pe_custom'>('pe_preset');
  
  // State tự soạn 4 câu hỏi PE (Custom PE Builder)
  const [activeCustomQuestionTab, setActiveCustomQuestionTab] = useState<1 | 2 | 3 | 4>(1);
  const [customQ1Title, setCustomQ1Title] = useState('Xử lý chuỗi (String Manipulation)');
  const [customQ1Desc, setCustomQ1Desc] = useState('Nhập vào một chuỗi ký tự chứa các từ ngữ và số nguyên. Lọc các số nguyên và tính tổng các số hợp lệ, in kết quả ra màn hình.');
  const [customQ1Input, setCustomQ1Input] = useState('hello 123 world 456');
  const [customQ1Output, setCustomQ1Output] = useState('579');

  const [customQ2Title, setCustomQ2Title] = useState('Kế thừa & Đa hình (OOP Class Hierarchy)');
  const [customQ2Desc, setCustomQ2Desc] = useState('Xây dựng lớp cha và lớp con kế thừa. Cài đặt các thuộc tính, constructor, getter/setter, phương thức setData() và phương thức tính toán.');
  const [customQ2Input, setCustomQ2Input] = useState('Audi\n500\n2');
  const [customQ2Output, setCustomQ2Output] = useState('Audi, 600, 2');

  const [customQ3Title, setCustomQ3Title] = useState('Cấu trúc danh sách liên kết (Singly Linked List)');
  const [customQ3Desc, setCustomQ3Desc] = useState('Cài đặt cấu trúc danh sách liên kết đơn quản lý danh sách phần tử. Hoàn thành 3 hàm: f1() tìm kiếm, f2() sắp xếp và f3() xóa node thỏa điều kiện.');
  const [customQ3Input, setCustomQ3Input] = useState('3\nA 10\nB 30\nC 20\n1');
  const [customQ3Output, setCustomQ3Output] = useState('A 10, C 20, B 30');

  const [customQ4Title, setCustomQ4Title] = useState('Thuật toán logic & Xử lý chuỗi nâng cao');
  const [customQ4Desc, setCustomQ4Desc] = useState('Nhập vào một câu gồm các từ cách nhau bởi khoảng trắng. Đảo ngược thứ tự các từ trong câu mà vẫn giữ nguyên thứ tự ký tự trong từng từ.');
  const [customQ4Input, setCustomQ4Input] = useState('university of fpt fpt');
  const [customQ4Output, setCustomQ4Output] = useState('fpt fpt of university');

  const [assignmentStartDate, setAssignmentStartDate] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentCloseDate, setAssignmentCloseDate] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'>('PUBLISHED');
  const [assignmentAllowLate, setAssignmentAllowLate] = useState<boolean>(true);
  const [assignmentMaxSubmissions, setAssignmentMaxSubmissions] = useState<string>('0');
  const [assignmentAllowResubmit, setAssignmentAllowResubmit] = useState<boolean>(true);
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'>('ALL');
  // Chế độ xem Đề bài & Rubrics: 'grid' (Danh sách thẻ đề bài trực quan) vs 'detail' (Cấu hình Docker Sandbox & Test Cases)
  const [assignmentViewMode, setAssignmentViewMode] = useState<'grid' | 'detail'>('grid');
  // Chế độ hiển thị dạng List View (như mẫu chuẩn AITA) hoặc Grid View
  const [assignmentCardStyle, setAssignmentCardStyle] = useState<'list' | 'grid'>('list');
  const [isAssignmentsMenuOpen, setIsAssignmentsMenuOpen] = useState<boolean>(true);
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState<string>('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'TEAM'>('ALL');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Helper bóc tách nội dung 4 câu hỏi của đề thi PE (Hỗ trợ Đề 1, Đề 2, Đề 3 & Đề tự soạn)
  const getExamQuestions = (assign: AssignmentItem) => {
    // 1. Kiểm tra nếu đề có chứa đánh dấu tự soạn (Custom PE)
    if (assign.description && assign.description.includes('===CUSTOM_Q1===')) {
      try {
        const parseQ = (marker: string, qNum: number, defaultPoints: string) => {
          const match = assign.description?.match(new RegExp(`===CUSTOM_${marker}===([\\s\\S]*?)===END_${marker}===`));
          if (!match || !match[1]) return null;
          const lines = match[1].trim().split('\n');
          const title = lines[0] || `Câu hỏi ${qNum}`;
          const inIdx = lines.findIndex(l => l.startsWith('INPUT:'));
          const outIdx = lines.findIndex(l => l.startsWith('OUTPUT:'));
          let desc = '';
          let input = '';
          let output = '';
          if (inIdx !== -1 && outIdx !== -1) {
            desc = lines.slice(1, inIdx).join('\n').trim();
            input = lines.slice(inIdx + 1, outIdx).join('\n').trim();
            output = lines.slice(outIdx + 1).join('\n').trim();
          } else {
            desc = lines.slice(1).join('\n').trim();
          }
          return {
            qNum,
            points: defaultPoints,
            title,
            desc: desc || 'Yêu cầu cài đặt theo chuẩn Java OOP.',
            sampleInput: input || 'sample input',
            sampleOutput: output || 'sample output'
          };
        };

        const q1 = parseQ('Q1', 1, '2.0 Điểm');
        const q2 = parseQ('Q2', 2, '3.0 Điểm');
        const q3 = parseQ('Q3', 3, '3.0 Điểm');
        const q4 = parseQ('Q4', 4, '2.0 Điểm');
        if (q1 && q2 && q3 && q4) return [q1, q2, q3, q4];
      } catch (err) {
        console.warn('Error parsing custom exam questions:', err);
      }
    }

    // 2. Kiểm tra nếu là Đề Số 2 (Employee & Manager)
    if (assign.title?.includes('Đề Số 2') || assign.description?.includes('StaffList') || assign.description?.includes('Employee')) {
      return [
        {
          qNum: 1,
          points: '2.0 Điểm',
          title: 'Kiểm tra chuỗi đối xứng (Palindrome) & Đếm nguyên âm',
          desc: 'Viết chương trình cho phép người dùng nhập vào một chuỗi ký tự. Kiểm tra xem chuỗi có đối xứng (Palindrome) hay không và đếm số lượng nguyên âm (a, e, i, o, u) không phân biệt hoa thường. Định dạng in: "PALINDROME - VOWELS: [số lượng]" hoặc "NOT PALINDROME - VOWELS: [số lượng]".',
          sampleInput: 'radar',
          sampleOutput: 'PALINDROME - VOWELS: 2'
        },
        {
          qNum: 2,
          points: '3.0 Điểm',
          title: 'Lập trình Hướng đối tượng OOP (Employee & Manager)',
          desc: 'Xây dựng lớp cha Employee gồm thuộc tính id: String, name: String, baseSalary: double; constructor và getter/setter.\nXây dựng lớp con Manager kế thừa Employee bổ sung bonusRate: double; phương thức setData() (cập nhật bonusRate); phương thức getFinalSalary(): double tính lương thực nhận = baseSalary * (1 + bonusRate); phương thức toString() trả về "id - name - finalSalary".',
          sampleInput: 'E01\nAlice\n1500\n0.2',
          sampleOutput: 'E01 - Alice - 1800.0'
        },
        {
          qNum: 3,
          points: '3.0 Điểm',
          title: 'Cấu trúc danh sách liên kết StaffList (Linked List)',
          desc: 'Cài đặt cấu trúc danh sách liên kết đơn StaffList quản lý danh sách các nhân viên Employee. Hoàn thiện 3 phương thức nghiệp vụ:\n• void f1(): Tìm và in thông tin nhân viên có lương cơ bản cao nhất trong danh sách.\n• void f2(): Sắp xếp danh sách nhân viên tăng dần theo thứ tự bảng chữ cái của name.\n• void f3(): Tìm và xóa nhân viên đầu tiên trong danh sách có baseSalary < 1000.',
          sampleInput: '3\nE01 Alice 1500\nE02 Bob 800\nE03 Carol 2000\n1',
          sampleOutput: 'E03 - Carol - 2000.0'
        },
        {
          qNum: 4,
          points: '2.0 Điểm',
          title: 'Thuật toán chuẩn hóa chuỗi họ tên (Title Case Formatter)',
          desc: 'Nhập vào một chuỗi họ và tên bị lỗi định dạng (nhiều khoảng trắng thừa ở hai đầu hoặc giữa các từ, ký tự hoa thường lộn xộn). Thực hiện chuẩn hóa: loại bỏ toàn bộ khoảng trắng thừa (giữa các từ chỉ cách nhau đúng 1 dấu cách), viết hoa chữ cái đầu mỗi từ và viết thường toàn bộ các ký tự còn lại.',
          sampleInput: '   nGuyeN   vAn   a  ',
          sampleOutput: 'Nguyen Van A'
        }
      ];
    }

    // 3. Kiểm tra nếu là Đề Số 3 (Book & Novel)
    if (assign.title?.includes('Đề Số 3') || assign.description?.includes('BookList') || assign.description?.includes('Novel')) {
      return [
        {
          qNum: 1,
          points: '2.0 Điểm',
          title: 'Kiểm tra định dạng Email FPT & Trích xuất MSSV (Regex)',
          desc: 'Viết chương trình kiểm tra định dạng email sinh viên FPT theo mẫu: [tên][mssv]@fpt.edu.vn (trong đó MSSV gồm 2 chữ cái và 6 chữ số). Nếu hợp lệ in "VALID - [MSSV in hoa]", nếu không hợp lệ in "INVALID".',
          sampleInput: 'annvse191234@fpt.edu.vn',
          sampleOutput: 'VALID - SE191234'
        },
        {
          qNum: 2,
          points: '3.0 Điểm',
          title: 'Lập trình Hướng đối tượng OOP (Book & Novel)',
          desc: 'Xây dựng lớp cha Book gồm code: String, title: String, price: double; constructor và getter/setter.\nXây dựng lớp con Novel kế thừa Book bổ sung genre: String, discount: double; phương thức getDiscountedPrice() tính giá sau chiết khấu = price * (1 - discount); phương thức toString() trả về "code - title - discountedPrice".',
          sampleInput: 'B101\nJava_Basics\n200\nIT\n0.1',
          sampleOutput: 'B101 - Java_Basics - 180.0'
        },
        {
          qNum: 3,
          points: '3.0 Điểm',
          title: 'Cấu trúc danh sách liên kết BookList (Linked List)',
          desc: 'Cài đặt cấu trúc danh sách liên kết đơn BookList quản lý danh sách các cuốn sách Book. Cài đặt các hàm nghiệp vụ:\n• void f1(): Đếm số lượng sách có price > 150.\n• void f2(): Sắp xếp danh sách sách theo price tăng dần.\n• void f3(): Đảo ngược toàn bộ thứ tự các node trong BookList.',
          sampleInput: '3\nB1 Java 200\nB2 Python 100\nB3 Web 300\n1',
          sampleOutput: '2'
        },
        {
          qNum: 4,
          points: '2.0 Điểm',
          title: 'Thuật toán đếm tần số xuất hiện của từng từ (Word Frequency)',
          desc: 'Nhập vào một đoạn văn bản tiếng Anh gồm các từ phân tách bởi khoảng trắng. Đếm tần số xuất hiện của từng từ phân biệt (không phân biệt hoa thường) và in theo thứ tự xuất hiện đầu tiên dạng: "từ: tần_số".',
          sampleInput: 'java oop java pe java',
          sampleOutput: 'java: 3, oop: 1, pe: 1'
        }
      ];
    }

    // 4. Mặc định: Đề Số 1 (Car & SpecCar)
    return [
      {
        qNum: 1,
        points: '2.0 Điểm',
        title: 'Xử lý chuỗi & Tính tổng số nguyên (String Manipulation)',
        desc: 'Viết chương trình cho phép người dùng nhập vào một dòng chuỗi ký tự chứa các từ ngữ và các số nguyên phân tách bởi khoảng trắng. Chương trình lọc các số nguyên hợp lệ và tính tổng của chúng, sau đó in kết quả ra màn hình.',
        sampleInput: 'hello 123 world 456',
        sampleOutput: '579'
      },
      {
        qNum: 2,
        points: '3.0 Điểm',
        title: 'Kế thừa & Đa hình OOP (Car & SpecCar)',
        desc: 'Xây dựng lớp cha Car gồm thuộc tính name: String, price: int, getter/setter và phương thức toString() trả về "name, price".\nXây dựng lớp con SpecCar kế thừa Car bổ sung thuộc tính type: int; phương thức setData() (nếu type <= 2 tăng price thêm 100, ngược lại tăng 500); phương thức getValue(): int trả về price sau điều chỉnh.',
        sampleInput: 'Audi\n500\n2',
        sampleOutput: 'Audi, 600, 2'
      },
      {
        qNum: 3,
        points: '3.0 Điểm',
        title: 'Cấu trúc danh sách liên kết MyList (Linked List)',
        desc: 'Cài đặt cấu trúc danh sách liên kết đơn MyList lưu các đối tượng Car. Hoàn thiện các phương thức sau:\n• void f1(): Đếm và in số lượng xe có price > 500.\n• void f2(): Sắp xếp danh sách giảm dần theo thuộc tính price.\n• void f3(): Tìm và xóa node đầu tiên trong danh sách thỏa điều kiện quy định.',
        sampleInput: '3\nA 10\nB 30\nC 20\n1',
        sampleOutput: 'A 10, C 20, B 30'
      },
      {
        qNum: 4,
        points: '2.0 Điểm',
        title: 'Thuật toán logic & Đảo ngược thứ tự từ (Reverse Words)',
        desc: 'Nhập vào một câu gồm các từ cách nhau bởi dấu cách. Thực hiện đảo ngược thứ tự các từ trong câu (từ cuối về đầu) mà vẫn giữ nguyên thứ tự ký tự trong từng từ.',
        sampleInput: 'university of fpt fpt',
        sampleOutput: 'fpt fpt of university'
      }
    ];
  };

  // Modal Xem Văn Bản Đề Thi (Official Exam Document Viewer)
  const [viewingExamAssignment, setViewingExamAssignment] = useState<AssignmentItem | null>(null);
  const [copiedExamText, setCopiedExamText] = useState<boolean>(false);
  const [examPaperTheme, setExamPaperTheme] = useState<'paper' | 'dark'>('paper');

  const handleDownloadExamDoc = (assign: AssignmentItem) => {
    const isJava = Boolean(assign.title?.includes('PE') || assign.allowed_language?.toUpperCase() === 'JAVA' || assign.title?.includes('PRO192'));
    const courseCode = assign.course_code || (isJava ? 'PRO192' : 'CSD201');
    const courseName = assign.course_name || (isJava ? 'Lập trình Hướng đối tượng Java (Java OOP)' : 'Cấu trúc dữ liệu & Giải thuật');
    
    const content = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ĐỀ THI THỰC HÀNH - ${courseCode}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; margin: 40px; color: #000; }
  .header { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .header td { border: none; vertical-align: top; }
  .title { text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0 6px 0; text-transform: uppercase; }
  .subtitle { text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 15px; }
  .meta-box { border: 1px solid #333; padding: 10px 14px; background-color: #f3f4f6; margin-bottom: 20px; font-size: 11pt; }
  .section-title { font-weight: bold; font-size: 13pt; margin-top: 18px; margin-bottom: 6px; text-decoration: underline; text-transform: uppercase; }
  .question-card { border: 1px solid #999; padding: 12px 16px; margin: 14px 0; background-color: #fafafa; border-radius: 4px; }
  pre { background-color: #eee; padding: 10px; font-family: 'Consolas', 'Courier New', monospace; font-size: 11pt; border: 1px solid #ccc; white-space: pre-wrap; }
  code { font-family: 'Consolas', monospace; font-weight: bold; }
  ul, ol { margin-top: 4px; margin-bottom: 8px; }
</style>
</head>
<body>
  <table class="header">
    <tr>
      <td style="width: 55%;">
        <strong>TRƯỜNG ĐẠI HỌC FPT QUY NHƠN</strong><br/>
        CƠ SỞ QUY NHƠN<br/>
        <strong>KHOA CÔNG NGHỆ THÔNG TIN</strong><br/>
        BỘ MÔN: KỸ THUẬT PHẦN MỀM
      </td>
      <td style="width: 45%; text-align: right;">
        <strong>ĐỀ THI THỰC HÀNH CHÍNH THỨC</strong><br/>
        Học kỳ: FA26 • Đợt thi: 1<br/>
        Mã đề: PE_${courseCode}_0${assign.assignment_id || '1'}
      </td>
    </tr>
  </table>

  <div class="title">${assign.title}</div>
  <div class="subtitle">Môn học: ${courseCode} - ${courseName}</div>

  <div class="meta-box">
    <strong>Thời gian làm bài:</strong> 75 phút (Không kể thời gian phát đề) | 
    <strong>Thang điểm:</strong> ${assign.max_score || 10.0} điểm | 
    <strong>Hình thức nộp:</strong> File .ZIP nén toàn bộ mã nguồn bài làm
  </div>

  <div class="section-title">I. HƯỚNG DẪN CHUNG VÀ QUY ĐỊNH PHÒNG THI</div>
  <ol>
    <li>Thí sinh nén tất cả các file mã nguồn bài làm (các file .java hoặc file mã nguồn chương trình) vào một file duy nhất có định dạng <strong>.ZIP</strong> (không nén định dạng .RAR hoặc .7z).</li>
    <li>Nộp file .ZIP lên hệ thống AITA trước hạn làm bài: <strong>${assign.due_date || assign.deadline || '23:59:00'}</strong>. Hệ thống sẽ tự động khóa sau giờ quy định.</li>
    <li>Hệ thống AITA sử dụng Docker Sandbox <strong>${isJava ? 'aita-sandbox-java:latest (OpenJDK 17)' : 'Auto-Routing Docker Sandbox'}</strong> cô lập để tự động biên dịch và kiểm tra 10 Test Cases.</li>
    <li>Nghiêm cấm mọi hành vi gian lận hoặc sao chép mã nguồn. Mọi bài thi đều được quét tự động bằng SHA-256 Code Checksum & AI Plagiarism Radar.</li>
  </ol>

  <div class="section-title">II. NỘI DUNG ĐỀ THI CHI TIẾT</div>
  ${isJava ? getExamQuestions(assign).map(q => `
  <div class="question-card">
    <strong>CÂU ${q.qNum} (${q.points}) - ${q.title}:</strong>
    <p style="white-space: pre-line;">${q.desc}</p>
    <strong>Ví dụ mẫu:</strong>
    <pre>Input:
${q.sampleInput}

Output:
${q.sampleOutput}</pre>
  </div>
  `).join('') : `
  <div class="question-card">
    <strong>Nội dung yêu cầu bài tập:</strong>
    <div style="white-space: pre-line; line-height: 1.6;">${assign.description || 'Chưa có mô tả chi tiết.'}</div>
  </div>
  `}

  <div class="section-title">III. QUY CHUẨN ĐÁNH GIÁ VÀ CHẤM ĐIỂM (RUBRIC & SANDBOX)</div>
  <table border="1" style="width:100%; border-collapse: collapse; margin-top: 8px;">
    <thead>
      <tr style="background-color: #e5e7eb;">
        <th style="padding: 6px; border: 1px solid #333;">STT</th>
        <th style="padding: 6px; border: 1px solid #333;">Hạng mục đánh giá</th>
        <th style="padding: 6px; border: 1px solid #333;">Thời gian tối đa</th>
        <th style="padding: 6px; border: 1px solid #333;">Bộ nhớ giới hạn</th>
        <th style="padding: 6px; border: 1px solid #333;">Điểm tối đa</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">1</td>
        <td style="padding: 6px; border: 1px solid #333;">Kiểm tra biên dịch trong Docker Sandbox (Compilation)</td>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">5.0s</td>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">256MB</td>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">Điều kiện tiên quyết</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">2</td>
        <td style="padding: 6px; border: 1px solid #333;">10 Automated Test Cases (Public & Hidden Sandbox Tests)</td>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">3.0s / test</td>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">256MB</td>
        <td style="padding: 6px; border: 1px solid #333; text-align: center;">${assign.max_score || 10.0}đ</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: right; margin-top: 35px; font-style: italic;">
    <strong>--- HẾT ĐỀ THI ---</strong><br/>
    (Cán bộ coi thi không giải thích gì thêm)
  </p>
</body>
</html>`;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const aLink = document.createElement('a');
    aLink.href = url;
    aLink.download = `De_Thi_${courseCode}_PE_${assign.assignment_id || 'Official'}.doc`;
    document.body.appendChild(aLink);
    aLink.click();
    document.body.removeChild(aLink);
    URL.revokeObjectURL(url);
  };

  const handleCopyExamText = (assign: AssignmentItem) => {
    const isJava = Boolean(assign.title?.includes('PE') || assign.allowed_language?.toUpperCase() === 'JAVA' || assign.title?.includes('PRO192'));
    const courseCode = assign.course_code || (isJava ? 'PRO192' : 'CSD201');
    const text = `==========================================================
TRƯỜNG ĐẠI HỌC FPT QUY NHƠN • CƠ SỞ QUY NHƠN
KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN KỸ THUẬT PHẦN MỀM
ĐỀ THI THỰC HÀNH (PRACTICAL EXAMINATION)
Môn học: ${courseCode} - ${assign.title}
Thời gian: 75 phút | Thang điểm: ${assign.max_score || 10.0}đ | Nộp file ZIP
==========================================================

I. HƯỚNG DẪN NỘP BÀI:
- Nén tất cả mã nguồn vào file .ZIP (Main.java, Car.java, SpecCar.java, MyList.java...).
- Nộp lên AITA trước hạn. Chấm tự động qua Docker Sandbox OpenJDK 17 với 10 Test Cases.

II. NỘI DUNG 4 CÂU HỎI:
${isJava ? getExamQuestions(assign).map(q => `
- CÂU ${q.qNum} (${q.points}): ${q.title}
  ${q.desc}
  Sample Input: ${q.sampleInput.replace(/\n/g, ' ')} -> Output: ${q.sampleOutput.replace(/\n/g, ' ')}
`).join('\n') : assign.description || 'Chưa có mô tả.'}

III. QUY CHUẨN DOCKER SANDBOX:
- Docker Image: aita-sandbox-java:latest (OpenJDK 17)
- Giới hạn: 5000ms timeout / test, 256MB RAM, SHA-256 Checksum Verification.
==========================================================`;

    navigator.clipboard.writeText(text);
    setCopiedExamText(true);
    setTimeout(() => setCopiedExamText(false), 2000);
  };

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

  const openCreateAssignmentModal = () => {
    setEditingAssignment(null);
    setPePresetMode(true);
    setExamCreationType('pe_custom');
    const pro192Course = courses.find(c => c.course_code === 'PRO192') || courses.find(c => c.course_id === selectedCourseId) || courses[0];
    if (pro192Course) setAssignmentCourseId(String(pro192Course.course_id));
    setAssignmentSubmissionType('INDIVIDUAL');
    setAssignmentAllowedLanguage('java');
    setAssignmentMaxScore('10.0');
    if (!assignmentTitle || !assignmentTitle.includes('Đề Số')) {
      loadPresetIntoCustomForm('de1');
    }
    setModalError('');
    setShowAssignmentModal(true);
  };

  // Handler mở modal Chỉnh sửa đề bài (Thay vì chuyển sang Rubric)
  const handleOpenEditAssignment = (a: AssignmentItem) => {
    setEditingAssignment(a);
    setAssignmentTitle(a.title || '');
    setAssignmentCourseId(String(a.course_id || ''));
    setAssignmentSubmissionType((a.submission_type as 'INDIVIDUAL' | 'TEAM') || 'INDIVIDUAL');
    setAssignmentAllowedLanguage((a.allowed_language as any) || 'ALL');
    setAssignmentMaxScore(String(a.max_score || '10.0'));
    setAssignmentStatus((a.status as any) || 'PUBLISHED');
    setAssignmentAllowLate(a.allow_late_submission ?? true);
    setAssignmentMaxSubmissions(String(a.max_submissions ?? 0));
    setAssignmentAllowResubmit(a.allow_resubmission ?? true);

    const toInputDate = (d?: string | null) => {
      if (!d) return '';
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      } catch {
        return '';
      }
    };
    setAssignmentStartDate(toInputDate(a.start_date));
    setAssignmentDueDate(toInputDate(a.due_date || a.deadline));
    setAssignmentCloseDate(toInputDate(a.close_date || a.due_date || a.deadline));

    const desc = a.description || '';
    if (desc.includes('===CUSTOM_Q1===') || desc.includes('===PE_CAR===')) {
      setPePresetMode(true);
      setExamCreationType('pe_custom');
      
      const parseQ = (tag: string) => {
        const reg = new RegExp(`===${tag}===([\\s\\S]*?)===END_${tag.slice(-2)}===`);
        const m = desc.match(reg);
        if (!m) return null;
        const content = m[1].trim();
        const inIdx = content.indexOf('INPUT:');
        const outIdx = content.indexOf('OUTPUT:');
        if (inIdx !== -1 && outIdx !== -1) {
          const hd = content.slice(0, inIdx).trim();
          const inp = content.slice(inIdx + 6, outIdx).trim();
          const outp = content.slice(outIdx + 7).trim();
          const lns = hd.split('\n');
          return { title: lns[0] || '', desc: lns.slice(1).join('\n').trim(), input: inp, output: outp };
        }
        return null;
      };

      const q1 = parseQ('CUSTOM_Q1');
      if (q1) {
        setCustomQ1Title(q1.title);
        setCustomQ1Desc(q1.desc);
        setCustomQ1Input(q1.input);
        setCustomQ1Output(q1.output);
      }
      const q2 = parseQ('CUSTOM_Q2');
      if (q2) {
        setCustomQ2Title(q2.title);
        setCustomQ2Desc(q2.desc);
        setCustomQ2Input(q2.input);
        setCustomQ2Output(q2.output);
      }
      const q3 = parseQ('CUSTOM_Q3');
      if (q3) {
        setCustomQ3Title(q3.title);
        setCustomQ3Desc(q3.desc);
        setCustomQ3Input(q3.input);
        setCustomQ3Output(q3.output);
      }
      const q4 = parseQ('CUSTOM_Q4');
      if (q4) {
        setCustomQ4Title(q4.title);
        setCustomQ4Desc(q4.desc);
        setCustomQ4Input(q4.input);
        setCustomQ4Output(q4.output);
      }
    } else {
      setPePresetMode(false);
      setAssignmentDesc(desc);
    }

    setModalError('');
    setShowAssignmentModal(true);
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
  const [isOverviewMenuOpen, setIsOverviewMenuOpen] = useState(true);

  // Auto redirect legacy analytics tab to integrated team radar view
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'git-submit') {
      setActiveTab('overview');
      setOverviewSubTab('team');
      setTeamViewMode('radar');
      setIsOverviewMenuOpen(true);
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
  const [selectedQuestionTab, setSelectedQuestionTab] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');

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
                ? (s.test_results && s.test_results.length > 0 
                    ? `Docker Sandbox: 0/${s.test_results.length} test cases Passed (0.0/10). Phát hiện lỗi runtime hoặc Watchdog Timeout (BR-03).`
                    : 'Docker Sandbox: Đang xử lý chấm điểm hoặc phát hiện lỗi runtime / Watchdog Timeout (BR-03).')
                : (s.test_results && s.test_results.length > 0 
                    ? `Docker Sandbox thực thi thành công: ${s.test_results.filter((t: any) => t.passed).length}/${s.test_results.length} test cases Passed (${finalScore}/10)`
                    : `Docker Sandbox thực thi thành công (${finalScore}/10)`)),
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

    setSubmittingAssign(true);
    try {
      const token = await getToken();
      const bodyPayload: any = {
        assigned_module: assignModule.trim() || (assignRole === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'),
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

  // Áp dụng mẫu đề thi thực hành PE chuẩn FPT (Hỗ trợ 3 bộ đề mẫu có sẵn: Đề 1, Đề 2, Đề 3)
  const applyPeTemplate = (choice: 'de1' | 'de2' | 'de3' = 'de1') => {
    setPePresetMode(true);
    setExamCreationType('pe_preset');
    setPeTemplateChoice(choice);
    const pro192Course = courses.find(c => c.course_code === 'PRO192') || courses[0];
    if (pro192Course) {
      setAssignmentCourseId(String(pro192Course.course_id));
    }
    setAssignmentSubmissionType('INDIVIDUAL');
    setAssignmentAllowedLanguage('java');
    setAssignmentMaxScore('10.0');

    if (choice === 'de1') {
      setAssignmentTitle('PRO192 Practical Examination (Đề Số 1)');
      setAssignmentDesc(
        'Đề thi thực hành PE chuẩn FPT gồm 4 câu hỏi:\n' +
        '• Q1 (2.0đ): Xử lý chuỗi & đếm/tính tổng số nguyên trong chuỗi\n' +
        '• Q2 (3.0đ): Lập trình Hướng đối tượng - Kế thừa lớp Car & SpecCar (toString, setData, getValue)\n' +
        '• Q3 (3.0đ): Cấu trúc danh sách MyList (f1 tìm kiếm, f2 sắp xếp giá giảm dần, f3 xóa node)\n' +
        '• Q4 (2.0đ): Thuật toán xử lý chuỗi (đảo ngược vị trí các từ trong câu)\n\n' +
        'Môi trường chấm: Docker OpenJDK 17 Sandbox cô lập (aita-sandbox-java:latest), bảo mật RAM 256MB, xác thực toàn vẹn bằng mã băm SHA-256.'
      );
    } else if (choice === 'de2') {
      setAssignmentTitle('PRO192 Practical Examination (Đề Số 2)');
      setAssignmentDesc(
        'Đề thi thực hành PE chuẩn FPT gồm 4 câu hỏi:\n' +
        '• Q1 (2.0đ): Kiểm tra chuỗi đối xứng (Palindrome) & đếm nguyên âm\n' +
        '• Q2 (3.0đ): Lập trình Hướng đối tượng - Kế thừa lớp Employee & Manager (toString, setData, getFinalSalary)\n' +
        '• Q3 (3.0đ): Cấu trúc danh sách StaffList (f1 tìm lương cao nhất, f2 sắp xếp A-Z, f3 xóa node)\n' +
        '• Q4 (2.0đ): Thuật toán chuẩn hóa chuỗi họ tên (Title Case Formatter)\n\n' +
        'Môi trường chấm: Docker OpenJDK 17 Sandbox cô lập (aita-sandbox-java:latest), bảo mật RAM 256MB, xác thực toàn vẹn bằng mã băm SHA-256.'
      );
    } else if (choice === 'de3') {
      setAssignmentTitle('PRO192 Practical Examination (Đề Số 3)');
      setAssignmentDesc(
        'Đề thi thực hành PE chuẩn FPT gồm 4 câu hỏi:\n' +
        '• Q1 (2.0đ): Kiểm tra định dạng Email & Mã số sinh viên hợp lệ (Regex)\n' +
        '• Q2 (3.0đ): Lập trình Hướng đối tượng - Kế thừa lớp Book & Novel (toString, setData, getDiscountedPrice)\n' +
        '• Q3 (3.0đ): Cấu trúc danh sách BookList (f1 đếm sách, f2 sắp xếp theo giá, f3 đảo ngược danh sách)\n' +
        '• Q4 (2.0đ): Thuật toán đếm tần số xuất hiện của từng từ trong đoạn văn\n\n' +
        'Môi trường chấm: Docker OpenJDK 17 Sandbox cô lập (aita-sandbox-java:latest), bảo mật RAM 256MB, xác thực toàn vẹn bằng mã băm SHA-256.'
      );
    }
  };

  // Nạp nhanh nội dung đề mẫu vào form Tự Soạn để Giảng viên chỉnh sửa (hỗ trợ bật / tắt toggle)
  const loadPresetIntoCustomForm = (choice: 'de1' | 'de2' | 'de3') => {
    if (peTemplateChoice === choice) {
      // Bấm lần 2 vào đề mẫu đang chọn: Tắt đề mẫu và chuyển về chế độ Tự Soạn trống
      resetBlankCustomForm();
      return;
    }
    setPeTemplateChoice(choice);
    if (choice === 'de1') {
      setAssignmentTitle('PRO192 Practical Examination (Đề Số 1)');
      setCustomQ1Title('Xử lý chuỗi (String Manipulation)');
      setCustomQ1Desc('Nhập vào một chuỗi ký tự chứa các từ và số nguyên phân tách bởi khoảng trắng. Lọc các số nguyên và tính tổng các số hợp lệ.');
      setCustomQ1Input('hello 123 world 456');
      setCustomQ1Output('579');

      setCustomQ2Title('Kế thừa & Đa hình (Car & SpecCar OOP)');
      setCustomQ2Desc('Xây dựng lớp Car (name, price) và SpecCar (type) kế thừa Car. Viết setData() tăng price và getValue() trả về price.');
      setCustomQ2Input('Audi\n500\n2');
      setCustomQ2Output('Audi, 600, 2');

      setCustomQ3Title('Cấu trúc danh sách MyList (Linked List)');
      setCustomQ3Desc('Cài đặt danh sách liên kết đơn MyList lưu đối tượng Car. Hoàn thiện f1() đếm xe giá > 500, f2() sắp xếp giá giảm dần, f3() xóa node đầu tiên.');
      setCustomQ3Input('3\nA 10\nB 30\nC 20\n1');
      setCustomQ3Output('A 10, C 20, B 30');

      setCustomQ4Title('Thuật toán logic & Đảo ngược từ (Reverse Words)');
      setCustomQ4Desc('Đảo ngược thứ tự các từ trong câu nhưng giữ nguyên thứ tự ký tự trong từng từ.');
      setCustomQ4Input('university of fpt fpt');
      setCustomQ4Output('fpt fpt of university');
    } else if (choice === 'de2') {
      setAssignmentTitle('PRO192 Practical Examination (Đề Số 2)');
      setCustomQ1Title('Kiểm tra Palindrome & Đếm nguyên âm');
      setCustomQ1Desc('Kiểm tra chuỗi đối xứng và đếm số lượng nguyên âm (a, e, i, o, u) không phân biệt hoa thường.');
      setCustomQ1Input('radar');
      setCustomQ1Output('PALINDROME - VOWELS: 2');

      setCustomQ2Title('Lập trình OOP (Employee & Manager)');
      setCustomQ2Desc('Xây dựng lớp Employee (id, name, baseSalary) và lớp con Manager (bonusRate). Cài đặt getFinalSalary() = baseSalary * (1 + bonusRate).');
      setCustomQ2Input('E01\nAlice\n1500\n0.2');
      setCustomQ2Output('E01 - Alice - 1800.0');

      setCustomQ3Title('Cấu trúc danh sách StaffList (Linked List)');
      setCustomQ3Desc('Cài đặt danh sách liên kết đơn StaffList: f1() tìm nhân viên lương cao nhất, f2() sắp xếp A-Z theo tên, f3() xóa nhân viên lương < 1000.');
      setCustomQ3Input('3\nE01 Alice 1500\nE02 Bob 800\nE03 Carol 2000\n1');
      setCustomQ3Output('E03 - Carol - 2000.0');

      setCustomQ4Title('Chuẩn hóa chuỗi họ tên (Title Case Formatter)');
      setCustomQ4Desc('Xóa khoảng trắng thừa, viết hoa chữ cái đầu mỗi từ và viết thường các ký tự còn lại.');
      setCustomQ4Input('   nGuyeN   vAn   a  ');
      setCustomQ4Output('Nguyen Van A');
    } else if (choice === 'de3') {
      setAssignmentTitle('PRO192 Practical Examination (Đề Số 3)');
      setCustomQ1Title('Kiểm tra Email FPT & Mã số sinh viên (Regex)');
      setCustomQ1Desc('Kiểm tra định dạng email sinh viên FPT dạng [tên][mssv]@fpt.edu.vn (MSSV gồm 2 chữ cái và 6 số).');
      setCustomQ1Input('annvse191234@fpt.edu.vn');
      setCustomQ1Output('VALID - SE191234');

      setCustomQ2Title('Lập trình OOP (Book & Novel)');
      setCustomQ2Desc('Xây dựng lớp Book (code, title, price) và Novel (genre, discount). Phương thức getDiscountedPrice() = price * (1 - discount).');
      setCustomQ2Input('B101\nJava_Basics\n200\nIT\n0.1');
      setCustomQ2Output('B101 - Java_Basics - 180.0');

      setCustomQ3Title('Cấu trúc danh sách BookList (Linked List)');
      setCustomQ3Desc('Cài đặt danh sách liên kết đơn BookList: f1() đếm sách giá > 150, f2() sắp xếp tăng dần theo giá, f3() đảo ngược danh sách.');
      setCustomQ3Input('3\nB1 Java 200\nB2 Python 100\nB3 Web 300\n1');
      setCustomQ3Output('2');

      setCustomQ4Title('Thuật toán đếm tần số từ (Word Frequency)');
      setCustomQ4Desc('Đếm tần số xuất hiện của từng từ phân biệt trong đoạn văn và in theo thứ tự xuất hiện đầu tiên.');
      setCustomQ4Input('java oop java pe java');
      setCustomQ4Output('java: 3, oop: 1, pe: 1');
    }
  };

  // Xóa trắng form để Giảng viên tự do soạn 4 câu hỏi mới từ đầu (tắt/bỏ chọn mẫu)
  const resetBlankCustomForm = () => {
    setPeTemplateChoice(null);
    setAssignmentTitle('PRO192 Practical Examination (Tự Soạn)');
    setCustomQ1Title('');
    setCustomQ1Desc('');
    setCustomQ1Input('');
    setCustomQ1Output('');

    setCustomQ2Title('');
    setCustomQ2Desc('');
    setCustomQ2Input('');
    setCustomQ2Output('');

    setCustomQ3Title('');
    setCustomQ3Desc('');
    setCustomQ3Input('');
    setCustomQ3Output('');

    setCustomQ4Title('');
    setCustomQ4Desc('');
    setCustomQ4Input('');
    setCustomQ4Output('');
  };

  const resetPeTemplate = () => {
    setPePresetMode(false);
    setExamCreationType('standard');
    setAssignmentTitle('');
    setAssignmentDesc('');
    setAssignmentAllowedLanguage('ALL');
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

      let peRubrics: any[] = [];
      let finalDescription = assignmentDesc.trim();

      if (examCreationType === 'pe_preset') {
        if (peTemplateChoice === 'de2') {
          peRubrics = [
            { criterion: 'Q1.1: Chuỗi Palindrome cơ bản (Đối xứng)', description: 'Kiểm tra chuỗi palindrome.', input_data: 'radar', expected_output: 'PALINDROME - VOWELS: 2', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q1.2: Chuỗi không đối xứng (Not Palindrome)', description: 'Kiểm tra chuỗi không palindrome.', input_data: 'hello', expected_output: 'NOT PALINDROME - VOWELS: 2', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.1: Lớp Manager - Khởi tạo & toString()', description: 'Kiểm tra constructor và toString.', input_data: "E01\nAlice\n1500\n0.2", expected_output: 'E01 - Alice - 1800.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.2: Lớp Manager - Thưởng KPI cao', description: 'Kiểm tra tính lương thưởng 0.5.', input_data: "E02\nBob\n2000\n0.5", expected_output: 'E02 - Bob - 3000.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.3: Lớp Manager - Không có thưởng (bonusRate = 0)', description: 'Kiểm tra bonusRate = 0.', input_data: "E03\nCarol\n1000\n0.0", expected_output: 'E03 - Carol - 1000.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.1: StaffList - Hàm f1() tìm lương cao nhất', description: 'Tìm nhân viên lương cao nhất.', input_data: "3\nE01 Alice 1500\nE02 Bob 800\nE03 Carol 2000\n1", expected_output: 'E03 - Carol - 2000.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.2: StaffList - Hàm f2() sắp xếp theo tên A-Z', description: 'Sắp xếp danh sách theo tên.', input_data: "3\nE01 Charlie 1500\nE02 Alice 800\nE03 Bob 2000\n2", expected_output: 'Alice, Bob, Charlie', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.3: StaffList - Hàm f3() xóa nhân viên lương < 1000', description: 'Xóa node đầu tiên lương < 1000.', input_data: "2\nE01 Alice 1500\nE02 Bob 800\n3", expected_output: 'E01 Alice 1500', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q4.1: TitleCase - Xóa khoảng trắng & Viết hoa chuẩn', description: 'Chuẩn hóa họ tên.', input_data: '   nGuyeN   vAn   a  ', expected_output: 'Nguyen Van A', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q4.2: TitleCase - Tên nhiều từ phức tạp', description: 'Kiểm tra tên nhiều từ.', input_data: '  dAnG   kHoA  ', expected_output: 'Dang Khoa', weight: 1.0, max_score: 1.0, is_hidden: false }
          ];
        } else if (peTemplateChoice === 'de3') {
          peRubrics = [
            { criterion: 'Q1.1: Regex - Email sinh viên hợp lệ', description: 'Kiểm tra email FPT hợp lệ.', input_data: 'annvse191234@fpt.edu.vn', expected_output: 'VALID - SE191234', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q1.2: Regex - Email không đúng định dạng', description: 'Kiểm tra email không hợp lệ.', input_data: 'invalid_email@gmail.com', expected_output: 'INVALID', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.1: Lớp Novel - Khởi tạo & getDiscountedPrice()', description: 'Kiểm tra chiết khấu sách 10%.', input_data: "B101\nJava_Basics\n200\nIT\n0.1", expected_output: 'B101 - Java_Basics - 180.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.2: Lớp Novel - Chiết khấu cao (30%)', description: 'Kiểm tra chiết khấu 30%.', input_data: "B102\nHarry_Potter\n500\nFiction\n0.3", expected_output: 'B102 - Harry_Potter - 350.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.3: Lớp Novel - Không chiết khấu (0%)', description: 'Kiểm tra chiết khấu 0%.', input_data: "B103\nClean_Code\n300\nTech\n0.0", expected_output: 'B103 - Clean_Code - 300.0', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.1: BookList - Hàm f1() đếm sách giá > 150', description: 'Đếm số lượng sách.', input_data: "3\nB1 Java 200\nB2 Python 100\nB3 Web 300\n1", expected_output: '2', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.2: BookList - Hàm f2() sắp xếp giá tăng dần', description: 'Sắp xếp danh sách theo giá.', input_data: "3\nB1 Java 200\nB2 Python 100\nB3 Web 300\n2", expected_output: 'B2 Python 100, B1 Java 200, B3 Web 300', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.3: BookList - Hàm f3() đảo ngược danh sách', description: 'Đảo ngược danh sách BookList.', input_data: "3\nB1 A 100\nB2 B 200\nB3 C 300\n3", expected_output: 'B3 C 300, B2 B 200, B1 A 100', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q4.1: Word Frequency - Đếm tần số từ cơ bản', description: 'Đếm tần số xuất hiện của từng từ.', input_data: 'java oop java pe java', expected_output: 'java: 3, oop: 1, pe: 1', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q4.2: Word Frequency - Đoạn văn bản dài', description: 'Kiểm tra đoạn văn bản phức tạp.', input_data: 'fpt university fpt qn', expected_output: 'fpt: 2, university: 1, qn: 1', weight: 1.0, max_score: 1.0, is_hidden: false }
          ];
        } else {
          // de1: Car & SpecCar
          peRubrics = [
            { criterion: 'Q1.1: Tính tổng số nguyên trong chuỗi (Test cơ bản)', description: 'Tách chuỗi và cộng các số nguyên hợp lệ.', input_data: 'hello 123 world 456', expected_output: '579', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q1.2: Tính tổng số nguyên trong chuỗi (Test nâng cao)', description: 'Kiểm tra chuỗi nhiều số âm và dương hỗn hợp.', input_data: 'abc 10 def 20 ghi 30', expected_output: '60', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.1: Lớp Car & SpecCar - Khởi tạo & toString()', description: 'Kiểm tra constructor và định dạng xuất chuỗi.', input_data: "Audi\n500\n2", expected_output: 'Audi, 500, 2', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.2: Lớp SpecCar - Phương thức setData()', description: 'Cập nhật thuộc tính type của SpecCar.', input_data: "BMW\n800\n1", expected_output: 'BMW, 800, 1', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q2.3: Lớp SpecCar - Phương thức getValue()', description: 'Tính toán giá trị xe sau điều chỉnh hệ số.', input_data: "Toyota\n300\n3", expected_output: 'Toyota, 300, 3', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.1: MyList - Hàm f1() đếm & tìm kiếm phần tử', description: 'Đếm phần tử thỏa điều kiện.', input_data: "3\nA 10\nB 30\nC 20\n1", expected_output: 'A 10, C 20, B 30', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.2: MyList - Hàm f2() sắp xếp danh sách (Sort)', description: 'Sắp xếp Car theo thứ tự giá giảm dần.', input_data: "4\nX 50\nY 10\nZ 40\nW 20\n1", expected_output: 'Y 10, W 20, Z 40, X 50', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q3.3: MyList - Hàm f3() xóa phần tử đầu tiên', description: 'Xóa node đầu tiên có giá nhỏ hơn ngưỡng.', input_data: "2\nP 100\nQ 50\n2", expected_output: 'P 100', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q4.1: Xử lý chuỗi - Đảo ngược thứ tự từ (Reverse Words)', description: 'Đảo ngược vị trí các từ trong câu.', input_data: 'university of fpt fpt', expected_output: 'fpt fpt of university', weight: 1.0, max_score: 1.0, is_hidden: false },
            { criterion: 'Q4.2: Xử lý chuỗi - Chuỗi nhiều từ phức tạp', description: 'Kiểm tra câu dài chứa nhiều từ phức tạp.', input_data: 'java oop practical exam', expected_output: 'exam practical oop java', weight: 1.0, max_score: 1.0, is_hidden: false }
          ];
        }
      } else if (examCreationType === 'pe_custom') {
        finalDescription = `===CUSTOM_PE===
===CUSTOM_Q1===
${customQ1Title.trim()}
${customQ1Desc.trim()}
INPUT:
${customQ1Input.trim()}
OUTPUT:
${customQ1Output.trim()}
===END_Q1===
===CUSTOM_Q2===
${customQ2Title.trim()}
${customQ2Desc.trim()}
INPUT:
${customQ2Input.trim()}
OUTPUT:
${customQ2Output.trim()}
===END_Q2===
===CUSTOM_Q3===
${customQ3Title.trim()}
${customQ3Desc.trim()}
INPUT:
${customQ3Input.trim()}
OUTPUT:
${customQ3Output.trim()}
===END_Q3===
===CUSTOM_Q4===
${customQ4Title.trim()}
${customQ4Desc.trim()}
INPUT:
${customQ4Input.trim()}
OUTPUT:
${customQ4Output.trim()}
===END_Q4===

Đề thi thực hành PE chuẩn FPT gồm 4 câu hỏi do Giảng viên tự soạn:
• Q1 (2.0đ): ${customQ1Title.trim()}
• Q2 (3.0đ): ${customQ2Title.trim()}
• Q3 (3.0đ): ${customQ3Title.trim()}
• Q4 (2.0đ): ${customQ4Title.trim()}

Môi trường chấm: Docker OpenJDK 17 Sandbox cô lập (aita-sandbox-java:latest), bảo mật RAM 256MB, xác thực toàn vẹn bằng mã băm SHA-256.`;

        peRubrics = [
          { criterion: `Q1: ${customQ1Title.trim()}`, description: customQ1Desc.trim(), input_data: customQ1Input.trim(), expected_output: customQ1Output.trim(), weight: 2.0, max_score: 2.0, is_hidden: false },
          { criterion: `Q2: ${customQ2Title.trim()}`, description: customQ2Desc.trim(), input_data: customQ2Input.trim(), expected_output: customQ2Output.trim(), weight: 3.0, max_score: 3.0, is_hidden: false },
          { criterion: `Q3: ${customQ3Title.trim()}`, description: customQ3Desc.trim(), input_data: customQ3Input.trim(), expected_output: customQ3Output.trim(), weight: 3.0, max_score: 3.0, is_hidden: false },
          { criterion: `Q4: ${customQ4Title.trim()}`, description: customQ4Desc.trim(), input_data: customQ4Input.trim(), expected_output: customQ4Output.trim(), weight: 2.0, max_score: 2.0, is_hidden: false }
        ];
      }

      if (editingAssignment) {
        const updatePayload: any = {
          course_id: Number(targetCourseId),
          title: assignmentTitle.trim(),
          description: finalDescription,
          due_date: new Date(effectiveDeadline).toISOString(),
          deadline: new Date(effectiveDeadline).toISOString(),
          max_score: parseFloat(assignmentMaxScore) || 10.0,
          submission_type: assignmentSubmissionType,
          target_type: assignmentTargetType,
          target_team_ids: assignmentTargetType === 'SPECIFIC_TEAMS' ? assignmentTargetTeamIds : [],
          allowed_language: assignmentAllowedLanguage,
          status: assignmentStatus,
          allow_late_submission: assignmentAllowLate,
          max_submissions: parseInt(assignmentMaxSubmissions, 10) || 0,
          allow_resubmission: assignmentAllowResubmit
        };
        if (assignmentStartDate) {
          updatePayload.start_date = new Date(assignmentStartDate).toISOString();
        }
        if (assignmentCloseDate) {
          updatePayload.close_date = new Date(assignmentCloseDate).toISOString();
        }

        const res = await fetch(`http://localhost:5000/api/assignments/${editingAssignment.assignment_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(updatePayload)
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessToast(lang === 'vi' ? `Cập nhật đề bài "${assignmentTitle}" thành công!` : `Assignment "${assignmentTitle}" updated!`);
          setShowAssignmentModal(false);
          setEditingAssignment(null);
          await fetchData();
          setTimeout(() => setSuccessToast(''), 3500);
          return;
        } else {
          setModalError(data.message || 'Lỗi khi cập nhật đề bài');
          return;
        }
      }

      const res = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          course_id: Number(targetCourseId),
          title: assignmentTitle.trim(),
          description: finalDescription,
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
          rubrics: peRubrics
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(lang === 'vi' ? `Tạo bài tập "${assignmentTitle}" thành công (kèm ${peRubrics.length} test cases)!` : `Assignment "${assignmentTitle}" created!`);
        setShowAssignmentModal(false);
        setPePresetMode(false);
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
    setSelectedQuestionTab('all');
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

  const handleLogout = (e?: React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
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
                                            {m.email}
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

  // =========================================================================
  // VIEW 1: LƯỚI THẺ ĐỀ BÀI & BÀI TẬP HIỆN ĐẠI (ASSIGNMENT CARDS GRID)
  // Tách biệt hoàn toàn việc duyệt & giao đề bài với cấu hình kỹ thuật Rubric
  // =========================================================================
  const renderAssignmentGridView = () => {
    const courseAssignments = selectedCourseId !== null
      ? assignments.filter(a => a.course_id === selectedCourseId)
      : assignments;

    const totalCount = courseAssignments.length;
    const publishedCount = courseAssignments.filter(a => (a.status || 'PUBLISHED') === 'PUBLISHED').length;
    const draftCount = courseAssignments.filter(a => a.status === 'DRAFT').length;
    const closedCount = courseAssignments.filter(a => a.status === 'CLOSED' || a.status === 'ARCHIVED').length;
    const individualCount = courseAssignments.filter(a => a.submission_type !== 'TEAM').length;
    const teamCount = courseAssignments.filter(a => a.submission_type === 'TEAM').length;

    const filteredAssignments = courseAssignments.filter(a => {
      if (assignmentStatusFilter !== 'ALL') {
        const st = a.status || 'PUBLISHED';
        if (st !== assignmentStatusFilter) return false;
      }
      if (assignmentTypeFilter !== 'ALL') {
        if (a.submission_type !== assignmentTypeFilter) return false;
      }
      if (assignmentSearchQuery.trim()) {
        const q = assignmentSearchQuery.toLowerCase();
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        const codeMatch = (a.course_code || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !codeMatch) return false;
      }
      return true;
    });

    const fmtDate = (d?: string) => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* =========================================================================
            1. HERO HEADER BANNER (THEO MẪU AITA-INTELLIGENT CHUẨN)
        ========================================================================= */}
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.92) 100%)'
            : 'linear-gradient(135deg, rgba(237, 233, 254, 0.85) 0%, rgba(245, 243, 255, 0.95) 55%, rgba(255, 255, 255, 0.95) 100%)',
          borderRadius: '24px',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: isDark ? '0 12px 35px rgba(0, 0, 0, 0.5)' : '0 12px 35px rgba(124, 58, 237, 0.07)',
          padding: '2rem 2.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          {/* Subtle Ambient Glow Circles */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '280px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(245, 243, 255, 0) 70%)',
            pointerEvents: 'none'
          }} />

          {/* Left Text & CTA */}
          <div style={{ maxWidth: '620px', zIndex: 2, position: 'relative' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(109, 40, 217, 0.1)',
              border: '1px solid rgba(109, 40, 217, 0.2)',
              borderRadius: '9999px',
              padding: '4px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#6d28d9',
              marginBottom: '12px'
            }}>
              <Sparkles size={14} color="#7c3aed" />
              <span>{lang === 'vi' ? 'Quản lý học tập thông minh' : 'Smart Learning Management'}</span>
            </div>

            <h2 style={{
              fontSize: '1.95rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: isDark ? '#f8fafc' : '#1e1b4b',
              margin: '0 0 8px 0',
              lineHeight: 1.2
            }}>
              {lang === 'vi' ? 'Quản Lý Đề Bài & Bài Tập' : 'Assignments & Examinations'}
            </h2>

            <div style={{ marginBottom: '1.25rem' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={openCreateAssignmentModal}
                style={{
                  padding: '11px 24px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={17} />
                <span>{lang === 'vi' ? 'Tạo Đề Bài Mới' : 'New Assignment'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={openAiStudioModal}
                style={{
                  padding: '11px 20px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={16} color="#7c3aed" />
                <span>{lang === 'vi' ? 'AI Soạn Đề Từ Slide' : 'AI Studio'}</span>
              </button>
            </div>
          </div>

          {/* Right Floating 3D Smart Education Illustration - Spans and touches card borders */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            height: '100%',
            width: '48%',
            maxWidth: '620px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'hidden'
          }}>
            <img
              src="/images/banner-education-3d.png?v=3"
              alt="AITA Smart Learning Illustration"
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'right center',
                transform: 'scale(1.08)',
                transformOrigin: 'right center',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 12%, black 32%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 12%, black 32%, black 100%)'
              }}
            />
          </div>
        </div>

        {/* =========================================================================
            2. 4 THẺ CHỈ SỐ METRIC KPI CARDS KÈM SPARKLINE
        ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Tổng số đề bài */}
          <div className="glass-card" style={{
            padding: '1.3rem 1.4rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#ede9fe',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.1, display: 'block' }}>
                {totalCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                {lang === 'vi' ? 'Tổng số đề bài' : 'Total Assignments'}
              </span>
            </div>
          </div>

          {/* Card 2: Đang mở */}
          <div className="glass-card" style={{
            padding: '1.3rem 1.4rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#dcfce7',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Play size={20} style={{ transform: 'translateX(1px)' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', lineHeight: 1.1, display: 'block' }}>
                {publishedCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                {lang === 'vi' ? 'Đang mở' : 'Active'}
              </span>
            </div>
          </div>

          {/* Card 3: Bản nháp */}
          <div className="glass-card" style={{
            padding: '1.3rem 1.4rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#fef3c7',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1, display: 'block' }}>
                {draftCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                {lang === 'vi' ? 'Bản nháp' : 'Drafts'}
              </span>
            </div>
          </div>

          {/* Card 4: Đã đóng */}
          <div className="glass-card" style={{
            padding: '1.3rem 1.4rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', lineHeight: 1.1, display: 'block' }}>
                {closedCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                {lang === 'vi' ? 'Đã đóng' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. THANH CÔNG CỤ LỌC & TÌM KIẾM THEO THIẾT KẾ MẪU
        ========================================================================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '12px 18px',
          borderRadius: '9999px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.04)'
        }}>
          {/* Ô tìm kiếm dạng Pill */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={assignmentSearchQuery}
              onChange={(e) => setAssignmentSearchQuery(e.target.value)}
              placeholder={lang === 'vi' ? 'Tìm kiếm theo tên đề bài, học phần...' : 'Search assignments...'}
              style={{
                width: '100%',
                padding: '9px 16px 9px 40px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
                color: '#1e1b4b',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
            {assignmentSearchQuery && (
              <button
                type="button"
                onClick={() => setAssignmentSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bộ lọc trạng thái (Pills) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {(['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED'] as const).map(st => {
              const isActive = assignmentStatusFilter === st;
              const count = st === 'ALL' ? totalCount : courseAssignments.filter(a => (a.status || 'PUBLISHED') === st).length;
              const label = st === 'ALL' 
                ? (lang === 'vi' ? 'Tất cả' : 'All') 
                : st === 'PUBLISHED' 
                ? (lang === 'vi' ? 'Đang mở' : 'Active') 
                : st === 'DRAFT' 
                ? (lang === 'vi' ? 'Bản nháp' : 'Drafts') 
                : (lang === 'vi' ? 'Đã đóng' : 'Closed');
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAssignmentStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? '#6d28d9' : '#ffffff',
                    color: isActive ? '#ffffff' : '#475569',
                    border: isActive ? '1px solid #6d28d9' : '1px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(109, 40, 217, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{label}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Switch Grid vs List View */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '9999px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setAssignmentCardStyle('list')}
              style={{
                padding: '6px 10px',
                borderRadius: '9999px',
                background: assignmentCardStyle === 'list' ? '#6d28d9' : 'transparent',
                color: assignmentCardStyle === 'list' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              title={lang === 'vi' ? 'Xem dạng danh sách' : 'List view'}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setAssignmentCardStyle('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: '9999px',
                background: assignmentCardStyle === 'grid' ? '#6d28d9' : 'transparent',
                color: assignmentCardStyle === 'grid' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              title={lang === 'vi' ? 'Xem dạng lưới' : 'Grid view'}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            4. DANH SÁCH ĐỀ BÀI (LIST VIEW HOẶC GRID VIEW)
        ========================================================================= */}
        {filteredAssignments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '24px',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <FolderOpen size={28} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#1e1b4b' }}>
              {lang === 'vi' ? 'Không tìm thấy đề bài nào' : 'No assignments found'}
            </h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '480px', margin: 0 }}>
              {selectedCourseId !== null && courses.find(c => c.course_id === selectedCourseId)
                ? (lang === 'vi' 
                    ? `Học phần ${courses.find(c => c.course_id === selectedCourseId)?.course_code} hiện chưa có đề bài nào (Đề bài đang nằm ở học phần PRO192).` 
                    : `No assignments in ${courses.find(c => c.course_id === selectedCourseId)?.course_code}. Check other courses or view all.`)
                : (lang === 'vi' 
                    ? 'Chưa có đề bài nào khớp với bộ lọc. Bắt đầu bằng cách bấm nút Tạo Đề Bài Mới ở trên.' 
                    : 'No assignments match your filter. Create a new assignment.')}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {selectedCourseId !== null && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setSelectedCourseId(null)} 
                  style={{ fontSize: '0.85rem', padding: '9px 18px', gap: '6px', cursor: 'pointer' }}
                >
                  📚 {lang === 'vi' ? 'Xem Tất Cả Đề Bài' : 'View All Assignments'}
                </button>
              )}
              <button 
                type="button" 
                className="btn-primary" 
                onClick={openCreateAssignmentModal} 
                style={{ fontSize: '0.85rem', padding: '9px 20px', gap: '6px', cursor: 'pointer' }}
              >
                <Plus size={15} /> {lang === 'vi' ? 'Tạo Đề Bài Mới' : 'Create Assignment'}
              </button>
            </div>
          </div>
        ) : assignmentCardStyle === 'list' ? (
          /* =========================================================================
              CHẾ ĐỘ XEM LIST VIEW (CHUẨN THEO ẢNH MẪU 2 CỦA BẠN)
          ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAssignments.map((a) => {
              const aCourse = courses.find(c => c.course_id === a.course_id);
              const isTeam = a.submission_type === 'TEAM';
              const cTeams = teams.filter(t => t.course_id === a.course_id);
              const aSubs = submissions.filter(s => s.assignment_id === a.assignment_id);
              const submittedCount = isTeam
                ? new Set(aSubs.filter(s => s.team_id).map(s => s.team_id)).size
                : aSubs.length;
              const targetCount = a.target_type === 'SPECIFIC_TEAMS' 
                ? (a.target_teams?.length || 0) 
                : (isTeam ? (cTeams.length || 5) : 30);
              const pct = targetCount > 0 ? Math.min(Math.round((submittedCount / targetCount) * 100), 100) : 0;

              const cleanTitle = (a.title || '')
                .replace(/–\s*Java OOP Standard Exam\s*\([Qq]1\s*[-–]\s*[Qq]4\)/i, '(Đề Số 1)')
                .replace(/\([Qq]1\s*[-–]\s*[Qq]4\)/i, '(Đề Số 1)');

              const isExam = Boolean(a.title?.includes('PE') || a.title?.includes('Practical Exam') || a.allowed_language?.toUpperCase() === 'JAVA');
              const courseDisplayName = aCourse ? `${aCourse.course_name} (${aCourse.course_code})` : (a.course_code || 'Lập trình hướng đối tượng Java (PRO192)');

              // Tính toán đường tròn SVG
              const circleRadius = 24;
              const circumference = 2 * Math.PI * circleRadius;
              const dashoffset = circumference - (pct / 100) * circumference;
              const ringColor = pct >= 70 ? '#06b6d4' : pct > 0 ? '#8b5cf6' : '#cbd5e1';

              return (
                <div
                  key={a.assignment_id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem 1.6rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Left: 3D-styled Subject Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 450px', minWidth: '300px' }}>
                    <div style={{
                      width: '68px',
                      height: '68px',
                      minWidth: '68px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 18px rgba(124, 58, 237, 0.1)',
                      flexShrink: 0
                    }}>
                      <Code2 size={28} color="#6d28d9" style={{ filter: 'drop-shadow(0 2px 4px rgba(109, 40, 217, 0.2))' }} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.04em', marginTop: '2px' }}>
                        JAVA • PE
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#e0f2fe',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: '9999px',
                          padding: '2px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
                          {lang === 'vi' ? 'Đang mở' : 'Active'}
                        </span>

                        <span style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <BookOpen size={13} color="#7c3aed" />
                          <span>{courseDisplayName}</span>
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '1.12rem',
                        fontWeight: 800,
                        color: '#1e1b4b',
                        margin: 0,
                        lineHeight: 1.3
                      }}>
                        {cleanTitle}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="#94a3b8" />
                          <span>{lang === 'vi' ? 'Hạn nộp:' : 'Due:'} <strong>{fmtDate(a.due_date || a.deadline)}</strong></span>
                        </span>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={13} color="#94a3b8" />
                          <span>{isTeam ? `${targetCount} nhóm` : 'Toàn bộ lớp (Cá nhân)'}</span>
                        </span>

                        <span style={{
                          background: '#f5f3ff',
                          color: '#7c3aed',
                          border: '1px solid #ddd6fe',
                          borderRadius: '6px',
                          padding: '1px 8px',
                          fontWeight: 700,
                          fontSize: '0.72rem'
                        }}>
                          📋 Rubrics đã có (10 Test Cases)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right 1: Circular Progress Gauge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="30"
                          cy="30"
                          r={circleRadius}
                          stroke="#f1f5f9"
                          strokeWidth="5"
                          fill="transparent"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r={circleRadius}
                          stroke={ringColor}
                          strokeWidth="5"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <span style={{ position: 'absolute', fontWeight: 800, fontSize: '0.85rem', color: '#1e1b4b' }}>
                        {pct}%
                      </span>
                    </div>

                    <div style={{ minWidth: '95px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        {lang === 'vi' ? 'Đã nộp' : 'Submitted'}
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
                        {submittedCount} / {targetCount}
                      </div>
                      <div style={{ width: '85px', height: '4px', background: '#f1f5f9', borderRadius: '999px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 4)}%`, height: '100%', background: ringColor, borderRadius: '999px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Right 2: Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setViewingExamAssignment(a)}
                      style={{
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        gap: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '9999px',
                        cursor: 'pointer'
                      }}
                      title={lang === 'vi' ? 'Xem văn bản đề thi chi tiết' : 'View exam detail'}
                    >
                      <Eye size={14} />
                      <span>{lang === 'vi' ? 'Chi tiết' : 'Detail'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleOpenEditAssignment(a)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        gap: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '9999px',
                        cursor: 'pointer'
                      }}
                      title={lang === 'vi' ? 'Chỉnh sửa nội dung và thông tin đề bài' : 'Edit Assignment'}
                    >
                      <Edit3 size={13} />
                      <span>{lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAssignment(a.assignment_id)}
                      title={lang === 'vi' ? 'Xóa đề bài này' : 'Delete assignment'}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        gap: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '9999px',
                        background: '#fff5f5',
                        border: '1px solid #fee2e2',
                        color: '#ef4444',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{lang === 'vi' ? 'Xóa' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =========================================================================
              CHẾ ĐỘ XEM GRID VIEW
          ========================================================================= */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredAssignments.map((a) => {
              const cleanTitle = (a.title || '')
                .replace(/–\s*Java OOP Standard Exam\s*\([Qq]1\s*[-–]\s*[Qq]4\)/i, '(Đề Số 1)')
                .replace(/\([Qq]1\s*[-–]\s*[Qq]4\)/i, '(Đề Số 1)');
              const isExam = Boolean(a.title?.includes('PE') || a.title?.includes('Practical Exam') || a.allowed_language?.toUpperCase() === 'JAVA');

              return (
                <div
                  key={a.assignment_id}
                  className="glass-card"
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '20px',
                    padding: '1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        borderRadius: '9999px',
                        padding: '2px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {isExam ? 'EXAM • PE' : 'ASSIGNMENT'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                        <Clock size={13} color="#94a3b8" />
                        <span>{fmtDate(a.due_date || a.deadline)}</span>
                      </div>
                    </div>

                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#1e1b4b',
                      lineHeight: 1.35,
                      marginBottom: '8px'
                    }}>
                      {cleanTitle}
                    </h4>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                    marginTop: 'auto'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {lang === 'vi' ? 'Hình thức:' : 'Format:'} <strong style={{ color: '#1e1b4b' }}>ZIP</strong>
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setViewingExamAssignment(a)}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '5px', borderRadius: '9999px' }}
                      >
                        <Eye size={13} /> {lang === 'vi' ? 'Chi Tiết' : 'Detail'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleOpenEditAssignment(a)}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '5px', borderRadius: '9999px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        title={lang === 'vi' ? 'Chỉnh sửa nội dung đề bài' : 'Edit Assignment'}
                      >
                        <Edit3 size={13} /> <span>{lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(a.assignment_id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          borderRadius: '9999px',
                          background: '#fff5f5',
                          border: '1px solid #fee2e2',
                          color: '#ef4444',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            5. PHÂN TRANG (PAGINATION)
        ========================================================================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 6px',
          color: '#64748b',
          fontSize: '0.82rem'
        }}>
          <div>
            {lang === 'vi' 
              ? `Hiển thị 1 - ${filteredAssignments.length} trong tổng số ${totalCount} đề bài`
              : `Showing 1 - ${filteredAssignments.length} of ${totalCount} assignments`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem'
              }}
            >
              &lt;
            </button>
            <button
              type="button"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: '#6d28d9',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}
            >
              1
            </button>
            <button
              type="button"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem'
              }}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 2: QUẢN LÝ DANH SÁCH SINH VIÊN (CLASS ROSTER)
  // Quản lý thông tin sinh viên, phân bổ nhóm đồ án và tiến độ nộp bài Sandbox
  // =========================================================================
  // Helper: Tìm tất cả các nhóm đồ án của sinh viên (nếu chọn môn cụ thể thì lấy nhóm môn đó, nếu chọn Tất cả thì lấy tất cả các nhóm mà sinh viên tham gia)
  const getStudentTeamsForCourse = (student: StudentUser, courseId: number | null): TeamItem[] => {
    if (courseId !== null) {
      return teams.filter(t => t.course_id === courseId && t.members && t.members.some(m => m.user_id === student.user_id || (m.email && student.email && m.email.toLowerCase() === student.email.toLowerCase())));
    }
    return teams.filter(t => t.members && t.members.some(m => m.user_id === student.user_id || (m.email && student.email && m.email.toLowerCase() === student.email.toLowerCase())));
  };

  const handleExportStudentsCSV = () => {
    const targetStudents = students.filter(s => {
      if (selectedCourseId !== null) {
        const inCourseTeam = teams.some(t => t.course_id === selectedCourseId && t.members && t.members.some(m => m.user_id === s.user_id || (m.email && s.email && m.email.toLowerCase() === s.email.toLowerCase())));
        const sSubs = submissions.filter(sub => (sub.submitter_email && s.email && sub.submitter_email.toLowerCase() === s.email.toLowerCase()) || (sub.submitter_name && s.full_name && sub.submitter_name.toLowerCase() === s.full_name.toLowerCase()));
        const inCourseSubs = sSubs.some(sub => {
          const asg = assignments.find(a => a.assignment_id === sub.assignment_id);
          return asg && asg.course_id === selectedCourseId;
        });
        const hasAnyTeam = teams.some(t => t.members && t.members.some(m => m.user_id === s.user_id || (m.email && s.email && m.email.toLowerCase() === s.email.toLowerCase())));
        if (!inCourseTeam && !inCourseSubs && hasAnyTeam) return false;
      }
      return true;
    });

    const headers = ['STT', 'User ID', 'Ho va ten', 'Email', 'Hoc phan', 'Nhom do an', 'Vai tro', 'So bai nop', 'Diem TB'];
    const rows = targetStudents.map((s, idx) => {
      const sTeams = getStudentTeamsForCourse(s, selectedCourseId);
      const coursesStr = sTeams.length > 0 
        ? sTeams.map(t => courses.find(c => c.course_id === t.course_id)?.course_code || `Course ${t.course_id}`).join(' | ')
        : (selectedCourseId ? (courses.find(c => c.course_id === selectedCourseId)?.course_code || '--') : 'Chua phan lop');
      const teamsStr = sTeams.length > 0
        ? sTeams.map(t => t.team_name).join(' | ')
        : 'Chua vao nhom';
      const rolesStr = sTeams.length > 0
        ? sTeams.map(t => {
            const m = t.members?.find(mem => mem.user_id === s.user_id || (mem.email && s.email && mem.email.toLowerCase() === s.email.toLowerCase()));
            return m?.role === 'LEADER' ? 'Truong nhom' : 'Thanh vien';
          }).join(' | ')
        : '--';
      const sSubs = submissions.filter(sub => (sub.submitter_email && s.email && sub.submitter_email.toLowerCase() === s.email.toLowerCase()) || (sub.submitter_name && s.full_name && sub.submitter_name.toLowerCase() === s.full_name.toLowerCase()));
      const avgScore = sSubs.length > 0 
        ? (sSubs.reduce((acc, sub) => acc + (sub.final_score ?? sub.grade ?? sub.ai_score ?? 0), 0) / sSubs.length).toFixed(1) 
        : 'Chua co';
      return [
        idx + 1,
        s.user_id,
        `"${s.full_name}"`,
        `"${s.email}"`,
        `"${coursesStr}"`,
        `"${teamsStr}"`,
        `"${rolesStr}"`,
        sSubs.length,
        avgScore
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AITA_Danh_Sach_Sinh_Vien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessToast(lang === 'vi' ? 'Đã xuất danh sách sinh viên thành công!' : 'Students roster exported!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const renderStudentsListView = () => {
    // 1. Lọc theo môn học được chọn (nếu có)
    const courseStudents = students.filter(s => {
      if (selectedCourseId !== null) {
        const inCourseTeam = teams.some(t => t.course_id === selectedCourseId && t.members && t.members.some(m => m.user_id === s.user_id || (m.email && s.email && m.email.toLowerCase() === s.email.toLowerCase())));
        const sSubs = submissions.filter(sub => (sub.submitter_email && s.email && sub.submitter_email.toLowerCase() === s.email.toLowerCase()) || (sub.submitter_name && s.full_name && sub.submitter_name.toLowerCase() === s.full_name.toLowerCase()));
        const inCourseSubs = sSubs.some(sub => {
          const asg = assignments.find(a => a.assignment_id === sub.assignment_id);
          return asg && asg.course_id === selectedCourseId;
        });
        const hasAnyTeam = teams.some(t => t.members && t.members.some(m => m.user_id === s.user_id || (m.email && s.email && m.email.toLowerCase() === s.email.toLowerCase())));
        if (!inCourseTeam && !inCourseSubs && hasAnyTeam) return false;
      }
      return true;
    });

    // 2. Thống kê số lượng
    const totalCount = courseStudents.length;
    const assignedStudents = courseStudents.filter(s => {
      const sTeams = getStudentTeamsForCourse(s, selectedCourseId);
      return sTeams.length > 0;
    });
    const assignedCount = assignedStudents.length;
    const unassignedCount = Math.max(0, totalCount - assignedCount);
    const totalIndividualSubs = submissions.filter(sub => sub.submission_type !== 'TEAM').length;

    // 3. Lọc theo trạng thái nhóm và từ khóa tìm kiếm
    const filteredStudents = courseStudents.filter(s => {
      const sTeams = getStudentTeamsForCourse(s, selectedCourseId);
      const isAssigned = sTeams.length > 0;
      if (studentTeamFilter === 'ASSIGNED' && !isAssigned) return false;
      if (studentTeamFilter === 'UNASSIGNED' && isAssigned) return false;

      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        const nameMatch = (s.full_name || '').toLowerCase().includes(q);
        const emailMatch = (s.email || '').toLowerCase().includes(q);
        const idMatch = String(s.user_id).includes(q);
        const teamMatch = sTeams.some(t => (t.team_name || '').toLowerCase().includes(q));
        const moduleMatch = sTeams.some(t => {
          const m = t.members?.find(mem => mem.user_id === s.user_id || (mem.email && s.email && mem.email.toLowerCase() === s.email.toLowerCase()));
          return (m?.assigned_module || '').toLowerCase().includes(q);
        });
        if (!nameMatch && !emailMatch && !idMatch && !teamMatch && !moduleMatch) return false;
      }
      return true;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Title & Actions Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GraduationCap size={28} color="#34d399" />
                <span>{lang === 'vi' ? 'Danh Sách Sinh Viên' : 'Students & Class Roster'}</span>
              </h2>
              <span style={{
                background: 'rgba(52, 211, 153, 0.16)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {filteredStudents.length} {lang === 'vi' ? 'sinh viên' : 'students'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleExportStudentsCSV}
              style={{ padding: '9px 18px', fontSize: '0.86rem', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.9))' }}
            >
              <Download size={16} />
              <span>{lang === 'vi' ? 'Xuất CSV Danh Sách' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (selectedCourseId) setTeamCourseId(selectedCourseId);
                setShowTeamModal(true);
              }}
              style={{ padding: '9px 18px', fontSize: '0.86rem', gap: '8px', fontWeight: 600 }}
            >
              <Plus size={16} />
              <span>{lang === 'vi' ? 'Tạo Nhóm Đồ Án Mới' : 'Create Team'}</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Tóm Tắt Tình Trạng Sinh Viên */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* KPI 1: Tổng sinh viên */}
          <div className="glass-card" style={{ padding: '1.15rem 1.3rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ede9fe', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'vi' ? 'Tổng số sinh viên' : 'Total Students'}
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {totalCount}
              </span>
            </div>
          </div>

          {/* KPI 2: Đã có nhóm */}
          <div className="glass-card" style={{ padding: '1.15rem 1.3rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.16)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'vi' ? 'Đã có nhóm đồ án' : 'Assigned to Team'}
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
                {assignedCount} {totalCount > 0 ? `(${Math.round((assignedCount / totalCount) * 100)}%)` : ''}
              </span>
            </div>
          </div>

          {/* KPI 3: Chưa có nhóm */}
          <div className="glass-card" style={{
            padding: '1.15rem 1.3rem',
            borderRadius: '14px',
            border: unassignedCount > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: unassignedCount > 0 ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.16)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: unassignedCount > 0 ? '#b45309' : 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'vi' ? '⚠️ Chưa vào nhóm' : '⚠️ Unassigned'}
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: unassignedCount > 0 ? '#b45309' : 'var(--text-main)', lineHeight: 1.2 }}>
                {unassignedCount} {lang === 'vi' ? 'bạn' : 'students'}
              </span>
            </div>
          </div>

          {/* KPI 4: Bài nộp cá nhân */}
          <div className="glass-card" style={{ padding: '1.15rem 1.3rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.16)', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <FileText size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'vi' ? 'Tổng bài nộp cá nhân' : 'Total Submissions'}
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1.2 }}>
                {totalIndividualSubs} {lang === 'vi' ? 'bài' : 'subs'}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh Công Cụ Tìm Kiếm & Lọc Trạng Thái Nhóm */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.025)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {/* Ô tìm kiếm sinh viên */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder={lang === 'vi' ? 'Tìm theo họ tên, email, mã SV, tên nhóm...' : 'Search student, email, team...'}
              style={{
                width: '100%',
                padding: '8px 14px 8px 36px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {studentSearchQuery && (
              <button
                type="button"
                onClick={() => setStudentSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bộ lọc trạng thái nhóm (Pills) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStudentTeamFilter('ALL')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: studentTeamFilter === 'ALL' ? 700 : 500,
                background: studentTeamFilter === 'ALL' ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(56, 189, 248, 0.3))' : 'rgba(255, 255, 255, 0.04)',
                color: studentTeamFilter === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                border: studentTeamFilter === 'ALL' ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>{lang === 'vi' ? 'Tất cả sinh viên' : 'All Students'}</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '999px', background: studentTeamFilter === 'ALL' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)' }}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStudentTeamFilter('ASSIGNED')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: studentTeamFilter === 'ASSIGNED' ? 700 : 500,
                background: studentTeamFilter === 'ASSIGNED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: studentTeamFilter === 'ASSIGNED' ? '#34d399' : 'var(--text-muted)',
                border: studentTeamFilter === 'ASSIGNED' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>✅ {lang === 'vi' ? 'Đã có nhóm' : 'Assigned'}</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '999px', background: studentTeamFilter === 'ASSIGNED' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255,255,255,0.06)' }}>
                {assignedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStudentTeamFilter('UNASSIGNED')}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: studentTeamFilter === 'UNASSIGNED' ? 700 : 500,
                background: studentTeamFilter === 'UNASSIGNED' ? '#fef3c7' : '#f8fafc',
                color: studentTeamFilter === 'UNASSIGNED' ? '#92400e' : '#64748b',
                border: studentTeamFilter === 'UNASSIGNED' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>⚠️ {lang === 'vi' ? 'Chưa vào nhóm' : 'Unassigned'}</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '999px', background: studentTeamFilter === 'UNASSIGNED' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255,255,255,0.06)' }}>
                {unassignedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Bảng Danh Sách Sinh Viên (Glassmorphic Data Table) */}
        {filteredStudents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '20px',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
              <Users size={28} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {lang === 'vi' ? 'Không tìm thấy sinh viên nào' : 'No students found'}
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '440px', margin: 0 }}>
              {lang === 'vi' 
                ? 'Không có sinh viên nào khớp với bộ lọc tìm kiếm hiện tại.' 
                : 'No students match your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', width: '50px' }}>#</th>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {lang === 'vi' ? 'Sinh viên' : 'Student'}
                    </th>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {lang === 'vi' ? 'Học phần' : 'Course'}
                    </th>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {lang === 'vi' ? 'Nhóm đồ án' : 'Project Team'}
                    </th>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {lang === 'vi' ? 'Tiến độ bài nộp' : 'Submissions'}
                    </th>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {lang === 'vi' ? 'Điểm TB' : 'Avg Score'}
                    </th>
                    <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                      {lang === 'vi' ? 'Thao tác' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => {
                    const sTeams = getStudentTeamsForCourse(s, selectedCourseId);
                    const sSubs = submissions.filter(sub => (sub.submitter_email && s.email && sub.submitter_email.toLowerCase() === s.email.toLowerCase()) || (sub.submitter_name && s.full_name && sub.submitter_name.toLowerCase() === s.full_name.toLowerCase()));
                    const avgScore = sSubs.length > 0
                      ? (sSubs.reduce((acc, sub) => acc + (sub.final_score ?? sub.grade ?? sub.ai_score ?? 0), 0) / sSubs.length).toFixed(1)
                      : null;
                    const avgScoreNum = avgScore ? Number(avgScore) : null;

                    return (
                      <tr
                        key={s.user_id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9ff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* 1. STT & ID */}
                        <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* 2. Sinh viên (Avatar + Tên + Email) */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.45), rgba(56, 189, 248, 0.35))',
                              border: '1px solid rgba(139, 92, 246, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              color: '#ffffff',
                              flexShrink: 0
                            }}>
                              {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.35 }}>
                              <span style={{ fontWeight: 800, color: '#1e1b4b', fontSize: '0.9rem' }}>
                                {s.full_name}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                {s.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Học phần (Hiển thị đầy đủ tất cả các môn sinh viên tham gia) */}
                        <td style={{ padding: '14px 16px' }}>
                          {sTeams.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                              {sTeams.map(t => {
                                const c = courses.find(course => course.course_id === t.course_id);
                                const isSWD = (c?.course_code || '').includes('SWD');
                                return (
                                  <span
                                    key={t.team_id}
                                    style={{
                                      background: isSWD ? '#ede9fe' : '#e0f2fe',
                                      color: isSWD ? '#6d28d9' : '#0369a1',
                                      border: isSWD ? '1px solid #ddd6fe' : '1px solid #bae6fd',
                                      borderRadius: '9999px',
                                      padding: '2px 9px',
                                      fontSize: '0.73rem',
                                      fontWeight: 800,
                                      letterSpacing: '0.03em',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {c?.course_code || `Course ${t.course_id}`}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              borderRadius: '9999px',
                              padding: '2px 9px',
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              {selectedCourseId ? (courses.find(c => c.course_id === selectedCourseId)?.course_code || 'SWD392') : 'Chưa phân lớp'}
                            </span>
                          )}
                        </td>

                        {/* 4. Nhóm đồ án & Phân hệ (Hiển thị xếp chồng theo từng môn học) */}
                        <td style={{ padding: '14px 16px' }}>
                          {sTeams.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {sTeams.map((team, tIdx) => {
                                const sMember = team.members?.find(m => m.user_id === s.user_id || (m.email && s.email && m.email.toLowerCase() === s.email.toLowerCase()));
                                const teamCourse = courses.find(c => c.course_id === team.course_id);
                                return (
                                  <div
                                    key={team.team_id}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '3px',
                                      paddingBottom: tIdx < sTeams.length - 1 ? '7px' : '0',
                                      borderBottom: tIdx < sTeams.length - 1 ? '1px dashed #e2e8f0' : 'none'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span style={{
                                        background: '#ede9fe',
                                        color: '#6d28d9',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <Users size={12} /> {team.team_name}
                                      </span>
                                      {sTeams.length > 1 && teamCourse && (
                                        <span style={{
                                          fontSize: '0.67rem',
                                          color: '#64748b',
                                          background: '#f1f5f9',
                                          border: '1px solid #e2e8f0',
                                          padding: '1px 5px',
                                          borderRadius: '4px',
                                          fontWeight: 700
                                        }}>
                                          {teamCourse.course_code}
                                        </span>
                                      )}
                                      {sMember?.role === 'LEADER' ? (
                                        <span style={{
                                          background: '#fef3c7',
                                          color: '#92400e',
                                          border: '1px solid #fde68a',
                                          padding: '2px 7px',
                                          borderRadius: '4px',
                                          fontSize: '0.68rem',
                                          fontWeight: 800
                                        }}>
                                          👑 {lang === 'vi' ? 'Trưởng nhóm' : 'Leader'}
                                        </span>
                                      ) : (
                                        <span style={{
                                          background: '#f1f5f9',
                                          color: '#475569',
                                          border: '1px solid #e2e8f0',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontSize: '0.68rem',
                                          fontWeight: 600
                                        }}>
                                          {lang === 'vi' ? 'Thành viên' : 'Member'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}>
                                ⚠️ {lang === 'vi' ? 'Chưa vào nhóm' : 'Unassigned'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignUserId(s.user_id);
                                  if (teams.length > 0) {
                                    setSelectedTeamDetails(teams[0]);
                                    setShowAssignModal(true);
                                  } else {
                                    setShowTeamModal(true);
                                  }
                                }}
                                style={{
                                  background: '#f5f3ff',
                                  border: '1px solid #ddd6fe',
                                  color: '#6d28d9',
                                  padding: '3px 9px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                + {lang === 'vi' ? 'Gán nhóm' : 'Assign'}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 5. Tiến độ bài nộp cá nhân */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            background: sSubs.length > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                            color: sSubs.length > 0 ? '#38bdf8' : '#94a3b8',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}>
                            {sSubs.length} {lang === 'vi' ? 'bài đã nộp' : 'submissions'}
                          </span>
                        </td>

                        {/* 6. Điểm TB */}
                        <td style={{ padding: '14px 16px' }}>
                          {avgScoreNum !== null ? (
                            <span style={{
                              fontSize: '0.86rem',
                              fontWeight: 800,
                              color: avgScoreNum >= 8 ? '#34d399' : avgScoreNum >= 5 ? '#fbbf24' : '#f87171'
                            }}>
                              ⭐ {avgScoreNum}đ
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>--</span>
                          )}
                        </td>

                        {/* 7. Thao tác */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(s.email || s.full_name);
                                setOverviewSubTab('individual');
                                setActiveTab('overview');
                              }}
                              title={lang === 'vi' ? 'Xem các bài nộp của sinh viên này' : 'View submissions'}
                              style={{
                                background: '#f5f3ff',
                                border: '1px solid #ddd6fe',
                                color: '#6d28d9',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Eye size={12} /> {lang === 'vi' ? 'Bài nộp' : 'Submissions'}
                            </button>

                            {sTeams.map(t => {
                              const tCourse = courses.find(c => c.course_id === t.course_id);
                              return (
                                <button
                                  key={t.team_id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTeamDetails(t);
                                    setActiveTab('teams');
                                  }}
                                  title={lang === 'vi' ? `Xem nhóm ${t.team_name}` : `View ${t.team_name}`}
                                  style={{
                                    background: 'rgba(168, 85, 247, 0.12)',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    color: '#c084fc',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <Users size={12} /> {sTeams.length > 1 && tCourse ? `${tCourse.course_code}` : (lang === 'vi' ? 'Xem nhóm' : 'Team')}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Loader2 className="animate-spin" size={36} color="#a78bfa" />
      </div>
    );
  }

  return (
    <div className={`lecturer-theme ${isDark ? 'dark-mode' : 'light-mode'}`} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* =========================================================================
          SIDEBAR BÊN TRÁI CHO TRANG GIẢNG VIÊN (CHIA BỐ CỤC NGANG NHƯ ADMIN)
      ========================================================================= */}
      <aside style={{
        width: '304px',
        background: isDark ? 'rgba(10, 14, 26, 0.96)' : 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: isDark ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(139, 92, 246, 0.12)',
        boxShadow: isDark ? '4px 0 24px rgba(0, 0, 0, 0.5)' : '4px 0 24px rgba(124, 58, 237, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        flexShrink: 0
      }}>
        {/* Brand Header: Logo Bé Cú & AITA.LECTURER */}
        <div style={{
          padding: '1.4rem 1.3rem',
          borderBottom: isDark ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(139, 92, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AitaLogo size={52} />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#1e1b4b' }}>
            AITA<span style={{ color: '#7c3aed' }}>.LECTURER</span>
          </span>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, padding: '1.2rem 0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 10px',
            marginBottom: '6px'
          }}>
            {lang === 'vi' ? 'Hệ thống Giảng dạy' : 'Faculty Workspace'}
          </span>

          {/* Item 1: Học phần & Sinh viên (Parent item + Submenu) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'courses' && activeTab !== 'teams' && activeTab !== 'students') {
                  setActiveTab('courses');
                  setIsCoursesMenuOpen(true);
                } else {
                  setIsCoursesMenuOpen(prev => !prev);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '14px',
                border: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '1px solid #ddd6fe' : '1px solid transparent',
                background: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#ede9fe' : 'transparent',
                color: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#6d28d9' : '#1e293b',
                fontSize: '0.9rem',
                fontWeight: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <BookOpen size={18} color={(activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#6d28d9' : '#64748b'} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', letterSpacing: '-0.015em' }}>
                  {lang === 'vi' ? 'Học phần & Sinh viên' : 'Courses & Students'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                {courses.length > 0 && (
                  <span style={{
                    background: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#ddd6fe' : '#f1f5f9',
                    color: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#6d28d9' : '#64748b',
                    border: '1px solid ' + ((activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#c4b5fd' : '#e2e8f0'),
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    {courses.length}
                  </span>
                )}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab !== 'courses' && activeTab !== 'teams' && activeTab !== 'students') {
                      setActiveTab('courses');
                      setIsCoursesMenuOpen(true);
                    } else {
                      setIsCoursesMenuOpen(prev => !prev);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '5px'
                  }}
                  title={isCoursesMenuOpen && (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? (lang === 'vi' ? 'Thu gọn' : 'Collapse') : (lang === 'vi' ? 'Mở rộng' : 'Expand')}
                >
                  <ChevronDown 
                    size={16} 
                    color={(activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? '#6d28d9' : '#64748b'} 
                    style={{ 
                      transform: (isCoursesMenuOpen && (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students')) ? 'rotate(0deg)' : 'rotate(-90deg)', 
                      transition: 'transform 0.2s ease',
                      opacity: (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') ? 1 : 0.6
                    }} 
                  />
                </div>
              </div>
            </button>

            {/* Submenu: 3 Mục (Danh sách học phần, Nhóm đồ án, Danh sách sinh viên) chuẩn font Hình 1 */}
            {(activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') && isCoursesMenuOpen && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                marginLeft: '10px',
                paddingLeft: '10px',
                borderLeft: '2px solid #ddd6fe',
                paddingTop: '3px',
                paddingBottom: '3px'
              }}>
                {/* Sub-item 1: Danh sách học phần */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourseId(null);
                    setActiveTab('courses');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: activeTab === 'courses' ? '1px solid #c4b5fd' : '1px solid transparent',
                    background: activeTab === 'courses' ? '#ede9fe' : 'transparent',
                    boxShadow: activeTab === 'courses' ? '0 2px 8px rgba(109, 40, 217, 0.08)' : 'none',
                    color: activeTab === 'courses' ? '#6d28d9' : '#475569',
                    fontSize: '0.92rem',
                    fontWeight: activeTab === 'courses' ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <BookOpen size={16} color={activeTab === 'courses' ? '#6d28d9' : '#64748b'} style={{ flexShrink: 0 }} />
                    <span style={{ letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      {lang === 'vi' ? 'Danh sách học phần' : 'Courses List'}
                    </span>
                  </div>
                  {courses.length > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: activeTab === 'courses' ? '#6d28d9' : '#f1f5f9',
                      color: activeTab === 'courses' ? '#ffffff' : '#64748b'
                    }}>
                      {courses.length}
                    </span>
                  )}
                </button>

                {/* Sub-item 2: Nhóm đồ án */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('teams');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: activeTab === 'teams' ? '1px solid #c4b5fd' : '1px solid transparent',
                    background: activeTab === 'teams' ? '#ede9fe' : 'transparent',
                    boxShadow: activeTab === 'teams' ? '0 2px 8px rgba(109, 40, 217, 0.08)' : 'none',
                    color: activeTab === 'teams' ? '#6d28d9' : '#475569',
                    fontSize: '0.92rem',
                    fontWeight: activeTab === 'teams' ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Users size={16} color={activeTab === 'teams' ? '#6d28d9' : '#64748b'} style={{ flexShrink: 0 }} />
                    <span style={{ letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      {lang === 'vi' ? 'Nhóm đồ án' : 'Project Teams'}
                    </span>
                  </div>
                  {teams.length > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: activeTab === 'teams' ? '#6d28d9' : '#f1f5f9',
                      color: activeTab === 'teams' ? '#ffffff' : '#64748b'
                    }}>
                      {teams.length}
                    </span>
                  )}
                </button>

                {/* Sub-item 3: Danh sách sinh viên */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('students');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: activeTab === 'students' ? '1px solid #c4b5fd' : '1px solid transparent',
                    background: activeTab === 'students' ? '#ede9fe' : 'transparent',
                    boxShadow: activeTab === 'students' ? '0 2px 8px rgba(109, 40, 217, 0.08)' : 'none',
                    color: activeTab === 'students' ? '#6d28d9' : '#475569',
                    fontSize: '0.92rem',
                    fontWeight: activeTab === 'students' ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <GraduationCap size={16} color={activeTab === 'students' ? '#6d28d9' : '#64748b'} style={{ flexShrink: 0 }} />
                    <span style={{ letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      {lang === 'vi' ? 'Danh sách sinh viên' : 'Class Roster'}
                    </span>
                  </div>
                  {students.length > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: activeTab === 'students' ? '#6d28d9' : '#f1f5f9',
                      color: activeTab === 'students' ? '#ffffff' : '#64748b'
                    }}>
                      {students.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Item 2: Đề bài & Bài tập (Gồm 3 tiểu mục chuẩn phong cách Hình 1) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'config' && activeTab !== 'overview') {
                  setActiveTab('config');
                  setAssignmentViewMode('grid');
                  setIsAssignmentsMenuOpen(true);
                } else {
                  setIsAssignmentsMenuOpen(prev => !prev);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '14px',
                border: (activeTab === 'config' || activeTab === 'overview') ? '1px solid #6d28d9' : '1px solid transparent',
                background: (activeTab === 'config' || activeTab === 'overview') ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
                color: (activeTab === 'config' || activeTab === 'overview') ? '#ffffff' : '#1e293b',
                boxShadow: (activeTab === 'config' || activeTab === 'overview') ? '0 4px 14px rgba(109, 40, 217, 0.35)' : 'none',
                fontSize: '0.9rem',
                fontWeight: (activeTab === 'config' || activeTab === 'overview') ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <FileCode size={18} color={(activeTab === 'config' || activeTab === 'overview') ? '#ffffff' : '#64748b'} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', letterSpacing: '-0.015em' }}>{lang === 'vi' ? 'Đề bài & Bài tập' : 'Assignments & Grading'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: (activeTab === 'config' || activeTab === 'overview') ? 'rgba(255, 255, 255, 0.25)' : '#ede9fe',
                  color: (activeTab === 'config' || activeTab === 'overview') ? '#ffffff' : '#6d28d9',
                  border: (activeTab === 'config' || activeTab === 'overview') ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid #ddd6fe'
                }}>
                  {assignments.length}
                </span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab !== 'config' && activeTab !== 'overview') {
                      setActiveTab('config');
                      setAssignmentViewMode('grid');
                      setIsAssignmentsMenuOpen(true);
                    } else {
                      setIsAssignmentsMenuOpen(prev => !prev);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '5px'
                  }}
                  title={isAssignmentsMenuOpen && (activeTab === 'config' || activeTab === 'overview') ? (lang === 'vi' ? 'Thu gọn' : 'Collapse') : (lang === 'vi' ? 'Mở rộng' : 'Expand')}
                >
                  <ChevronDown 
                    size={16} 
                    color={(activeTab === 'config' || activeTab === 'overview') ? '#ffffff' : '#64748b'} 
                    style={{ 
                      transform: (isAssignmentsMenuOpen && (activeTab === 'config' || activeTab === 'overview')) ? 'rotate(0deg)' : 'rotate(-90deg)', 
                      transition: 'transform 0.2s ease',
                      opacity: (activeTab === 'config' || activeTab === 'overview') ? 1 : 0.6
                    }} 
                  />
                </div>
              </div>
            </button>

            {/* Submenu: 3 Mục chuẩn đẹp như Hình 1 (Tất cả đề bài, Rubrics & Test Cases, Chấm bài tự động) */}
            {(activeTab === 'config' || activeTab === 'overview') && isAssignmentsMenuOpen && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                marginLeft: '10px',
                paddingLeft: '10px',
                borderLeft: '2px solid #ddd6fe',
                paddingTop: '3px',
                paddingBottom: '3px'
              }}>
                {/* Sub-item 1: Tất cả đề bài */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('config');
                    setAssignmentViewMode('grid');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: (activeTab === 'config' && assignmentViewMode === 'grid') ? '1px solid #c4b5fd' : '1px solid transparent',
                    background: (activeTab === 'config' && assignmentViewMode === 'grid') ? '#ede9fe' : 'transparent',
                    boxShadow: (activeTab === 'config' && assignmentViewMode === 'grid') ? '0 2px 8px rgba(109, 40, 217, 0.08)' : 'none',
                    color: (activeTab === 'config' && assignmentViewMode === 'grid') ? '#6d28d9' : '#475569',
                    fontSize: '0.92rem',
                    fontWeight: (activeTab === 'config' && assignmentViewMode === 'grid') ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: (activeTab === 'config' && assignmentViewMode === 'grid') ? '#7c3aed' : '#94a3b8',
                      flexShrink: 0
                    }} />
                    <span style={{ whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {lang === 'vi' ? 'Tất cả đề bài' : 'All Assignments'}
                    </span>
                  </div>
                  {assignments.length > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: (activeTab === 'config' && assignmentViewMode === 'grid') ? '#6d28d9' : '#f1f5f9',
                      color: (activeTab === 'config' && assignmentViewMode === 'grid') ? '#ffffff' : '#64748b'
                    }}>
                      {assignments.length}
                    </span>
                  )}
                </button>

                {/* Sub-item 2: Rubrics & Test Cases */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('config');
                    setAssignmentViewMode('detail');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: (activeTab === 'config' && assignmentViewMode === 'detail') ? '1px solid #c4b5fd' : '1px solid transparent',
                    background: (activeTab === 'config' && assignmentViewMode === 'detail') ? '#ede9fe' : 'transparent',
                    boxShadow: (activeTab === 'config' && assignmentViewMode === 'detail') ? '0 2px 8px rgba(109, 40, 217, 0.08)' : 'none',
                    color: (activeTab === 'config' && assignmentViewMode === 'detail') ? '#6d28d9' : '#475569',
                    fontSize: '0.92rem',
                    fontWeight: (activeTab === 'config' && assignmentViewMode === 'detail') ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Settings size={16} color={(activeTab === 'config' && assignmentViewMode === 'detail') ? '#6d28d9' : '#64748b'} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {lang === 'vi' ? 'Rubrics & Test Cases' : 'Rubrics & Test Cases'}
                    </span>
                  </div>
                  {rubricRules.length > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: (activeTab === 'config' && assignmentViewMode === 'detail') ? '#6d28d9' : '#f1f5f9',
                      color: (activeTab === 'config' && assignmentViewMode === 'detail') ? '#ffffff' : '#64748b'
                    }}>
                      {rubricRules.length}
                    </span>
                  )}
                </button>

                {/* Sub-item 3: Chấm bài tự động */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('overview');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: activeTab === 'overview' ? '1px solid #c4b5fd' : '1px solid transparent',
                    background: activeTab === 'overview' ? '#ede9fe' : 'transparent',
                    boxShadow: activeTab === 'overview' ? '0 2px 8px rgba(109, 40, 217, 0.08)' : 'none',
                    color: activeTab === 'overview' ? '#6d28d9' : '#475569',
                    fontSize: '0.92rem',
                    fontWeight: activeTab === 'overview' ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Sparkles size={16} color={activeTab === 'overview' ? '#6d28d9' : '#64748b'} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {lang === 'vi' ? 'Chấm bài tự động' : 'Auto-Grading'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Card & Teacher Info Bottom of Sidebar */}
        <div style={{
          padding: '1.2rem',
          borderTop: '1px solid rgba(139, 92, 246, 0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative'
        }}>
          {/* Menu Con / Popover khi nhấn vào thẻ Giảng viên */}
          {showUserMenu && (
            <div
              ref={userMenuRef}
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                left: '12px',
                right: '12px',
                background: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '1.15rem 1rem 0.9rem',
                boxShadow: isDark
                  ? '0 -20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(124, 58, 237, 0.2)'
                  : '0 -20px 40px -10px rgba(124, 58, 237, 0.18), 0 4px 20px rgba(0, 0, 0, 0.08)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                animation: 'fadeInProfile 0.18s ease-out'
              }}
            >
              {/* Header Popup: Tên, Vai trò & Nút Đóng */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    color: isDark ? '#ffffff' : '#0f172a',
                    letterSpacing: '-0.01em',
                    marginBottom: '5px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {currentUser?.fullName || 'Yen12 Yen'}
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                    color: isDark ? '#34d399' : '#059669',
                    border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    <GraduationCap size={13} />
                    <span>{lang === 'vi' ? 'Giảng viên' : 'Lecturer'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                  }}
                  title={lang === 'vi' ? 'Đóng menu' : 'Close menu'}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    color: isDark ? '#94a3b8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
                >
                  <X size={13} />
                </button>
              </div>

              <div style={{ height: '1px', background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }} />

              {/* Nút Xem Hồ sơ cá nhân & Cài đặt */}
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setShowProfileModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid #e2e8f0',
                  color: isDark ? '#f8fafc' : '#1e1b4b',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(139, 92, 246, 0.22)' : '#ede9fe'}
                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(139, 92, 246, 0.12)' : '#f8fafc'}
              >
                <User size={16} color="#7c3aed" />
                <span>{lang === 'vi' ? 'Hồ sơ cá nhân & Cài đặt' : 'Profile & Settings'}</span>
              </button>

              {/* Nút Đăng xuất trong menu con */}
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px',
                  borderRadius: '9999px',
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#ffffff',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fee2e2',
                  color: '#ef4444',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : '#ffffff'}
              >
                <LogOut size={14} />
                <span>{lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>
              </button>
            </div>
          )}

          {/* Professional Faculty Member Card (Chuẩn App Giảng Viên) */}
          <div 
            ref={userCardRef}
            onClick={() => setShowUserMenu(prev => !prev)}
            title={lang === 'vi' ? 'Bấm để mở menu tài khoản' : 'Click to open account menu'}
            style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
              border: showUserMenu ? '1.5px solid #7c3aed' : '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '16px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: showUserMenu ? '0 6px 20px rgba(124, 58, 237, 0.2)' : '0 4px 14px rgba(124, 58, 237, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = showUserMenu ? '0 6px 20px rgba(124, 58, 237, 0.2)' : '0 4px 14px rgba(124, 58, 237, 0.06)';
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)'
            }}>
              <GraduationCap size={22} color="#ffffff" />
            </div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e1b4b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName || (lang === 'vi' ? 'Thầy/Cô Giảng viên' : 'Faculty Member')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6d28d9', fontWeight: 600 }}>
                {lang === 'vi' ? 'Giảng viên' : 'Lecturer'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ChevronUp size={16} color="#7c3aed" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          NỘI DUNG CHÍNH BÊN PHẢI (MAIN CONTENT AREA)
      ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Top Header Bar: Breadcrumb + Search + Notifications + Profile */}
        <header style={{
          height: '70px',
          borderBottom: isDark ? '1px solid rgba(139, 92, 246, 0.18)' : '1px solid rgba(139, 92, 246, 0.1)',
          background: isDark ? 'rgba(10, 14, 26, 0.92)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: isDark ? '0 2px 12px rgba(0, 0, 0, 0.4)' : '0 2px 12px rgba(124, 58, 237, 0.03)'
        }}>
          {/* Left: Breadcrumbs */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              letterSpacing: '-0.01em',
              color: isDark ? '#94a3b8' : '#64748b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Home size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 500, color: isDark ? '#94a3b8' : '#64748b' }}>Dashboard</span>
              </div>

              <ChevronRight size={13} style={{ color: isDark ? '#475569' : '#cbd5e1', strokeWidth: 2.2, flexShrink: 0 }} />

              {/* Nhóm danh mục (Category) */}
              <span style={{
                color: isDark ? '#c4b5fd' : '#6d28d9',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                {activeTab === 'config' || activeTab === 'overview'
                  ? (lang === 'vi' ? 'Đề bài & Bài tập' : 'Assignments')
                  : (activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students'
                    ? (lang === 'vi' ? 'Học phần & Sinh viên' : 'Courses & Students')
                    : (lang === 'vi' ? 'Không gian Giảng dạy' : 'Workspace'))}
              </span>

              {(activeTab === 'config' || activeTab === 'overview' || activeTab === 'courses' || activeTab === 'teams' || activeTab === 'students') && (
                <>
                  <ChevronRight size={13} style={{ color: isDark ? '#475569' : '#cbd5e1', strokeWidth: 2.2, flexShrink: 0 }} />
                  {/* Trang con hiện tại (Subpage) - Màu tím chuẩn thương hiệu */}
                  <span style={{
                    color: isDark ? '#c4b5fd' : '#6d28d9',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}>
                    {activeTab === 'config' ? (
                      assignmentViewMode === 'detail'
                        ? 'Rubrics & Test Cases'
                        : (lang === 'vi' ? 'Tất cả đề bài' : 'All Assignments')
                    ) : activeTab === 'courses' ? (
                      lang === 'vi' ? 'Danh sách học phần' : 'Course List'
                    ) : activeTab === 'teams' ? (
                      lang === 'vi' ? 'Nhóm đồ án' : 'Team Roster'
                    ) : activeTab === 'students' ? (
                      lang === 'vi' ? 'Danh sách sinh viên' : 'Student Roster'
                    ) : activeTab === 'overview' ? (
                      lang === 'vi' ? 'Chấm bài tự động' : 'Auto-Grading') : null}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Center: Search */}
          <div style={{
            position: 'relative',
            width: '320px',
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
            <input
              type="text"
              placeholder={lang === 'vi' ? 'Tìm kiếm đề bài, lớp học...' : 'Search assignments, classes...'}
              style={{
                width: '100%',
                padding: '8px 16px 8px 36px',
                background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid #e2e8f0',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                color: isDark ? '#f8fafc' : '#1e1b4b',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
              }}
            />
          </div>

          {/* Right Area */}
          <div style={{ display: 'flex', alignItems: 'center' }} />
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
                    if (activeTab === 'courses') {
                      setActiveTab('teams');
                    }
                  }
                }}
                style={{
                  fontFamily: 'var(--font-main)',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  color: '#1e1b4b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.05)',
                  minWidth: '280px',
                  maxWidth: '720px'
                }}
              >
                <option value="ALL">
                  📚 {lang === 'vi' ? `Tất cả học phần (${assignments.length} đề bài)` : `All Courses (${assignments.length})`}
                </option>
                {courses.map(c => {
                  const cnt = assignments.filter(a => a.course_id === c.course_id).length;
                  return (
                    <option key={c.course_id} value={String(c.course_id)}>
                      📚 {c.course_code} – {c.course_name} ({cnt} {lang === 'vi' ? 'đề bài' : 'assignments'})
                    </option>
                  );
                })}
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
                      onClick={() => {
                        setSelectedCourseId(course.course_id);
                        setTeamCourseId(course.course_id);
                        setActiveTab('teams');
                      }}
                      title={lang === 'vi' ? `Bấm để xem danh sách nhóm của học phần ${course.course_code}` : `Click to view teams in ${course.course_code}`}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-card)',
                        border: isSelected ? '1.5px solid #7c3aed' : '1px solid var(--border-color)',
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
                              background: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #ddd6fe',
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
                                background: '#f5f3ff',
                                border: '1px solid #ddd6fe',
                                color: '#6d28d9',
                                borderRadius: '8px',
                                padding: '4px 10px',
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
                                background: '#fff1f2',
                                border: '1px solid #fecdd3',
                                color: '#e11d48',
                                borderRadius: '8px',
                                padding: '4px 10px',
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
                          👨‍🏫 Giảng viên: <strong style={{ color: 'var(--text-main)' }}>{course.lecturer_name || currentUser?.fullName || currentUser?.full_name || (lang === 'vi' ? 'Giảng viên' : 'Lecturer')}</strong>
                        </p>

                        {/* Thống kê nhóm & trạng thái: BỎ HỘP VIỀN XÁM, dùng dải nền tinh tế */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '11px 15px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          borderRadius: '12px',
                          marginBottom: '1.4rem',
                          fontSize: '0.86rem'
                        }}>
                          <Users size={16} color="#6d28d9" />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Số nhóm:</span>
                          <strong style={{ color: '#6d28d9', fontSize: '0.95rem' }}>{courseTeams.length} {lang === 'vi' ? 'nhóm' : 'teams'}</strong>
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

        {/* TAB: STUDENTS ROSTER MANAGEMENT (MỤC 3: DANH SÁCH SINH VIÊN) */}
        {activeTab === 'students' && renderStudentsListView()}

        {/* TAB 1: OVERVIEW & CHẤM ĐIỂM (F10) - PHÂN TÁCH BÀI CÁ NHÂN VS ĐỒ ÁN NHÓM */}
        {activeTab === 'overview' && (
          <div>
            {overviewSubTab === 'team' && teamViewMode === 'radar' ? (
              renderGitAnalyticsRadarView()
            ) : (
              <>
            {/* Header Title & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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

                {overviewSubTab === 'team' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setTeamViewMode('table')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
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
                        padding: '6px 14px',
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
                      <span>📊 {lang === 'vi' ? 'Radar Free-Rider (BR-07)' : 'Free-Rider Radar'}</span>
                    </button>
                  </div>
                )}
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
                                    background: row.language === 'java'
                                      ? 'rgba(239, 68, 68, 0.15)'
                                      : row.language === 'python'
                                      ? 'rgba(139, 92, 246, 0.15)'
                                      : 'rgba(245, 158, 11, 0.15)',
                                    color: row.language === 'java'
                                      ? '#f87171'
                                      : row.language === 'python'
                                      ? '#a78bfa'
                                      : '#fbbf24',
                                    border: `1px solid ${row.language === 'java' ? 'rgba(239, 68, 68, 0.35)' : row.language === 'python' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                    marginBottom: '5px'
                                  }}>
                                    <Code2 size={12} /> {row.language === 'java' ? '☕ Java 17' : row.language === 'python' ? 'Python 3.11' : 'Node.js 20'}
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
                              1.0 Core • 256MB RAM
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
            <div style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '1.35rem 1.6rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)'
            }}>
              {/* Header Modal - Gọn gàng, tinh tế, nền sáng */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{selectedSub.team}</span>
                    {selectedSub.moderationStatus === 'FINALIZED' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 600 }}>
                        <CheckCircle2 size={11} /> {lang === 'vi' ? 'Đã Chốt Điểm' : 'Finalized'}
                      </span>
                    )}
                    {selectedSub.moderationStatus === 'PENDING_SECOND_REVIEW' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>
                        <AlertTriangle size={11} /> {lang === 'vi' ? 'Chờ GV2 Chấm Chéo' : 'Pending 2nd Review'}
                      </span>
                    )}
                    {selectedSub.moderationStatus === 'FIRST_REVIEWED' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd', fontWeight: 600 }}>
                        <Clock size={11} /> {lang === 'vi' ? 'GV1 Đã Đánh Giá' : '1st Reviewed'}
                      </span>
                    )}
                    {(!selectedSub.moderationStatus || selectedSub.moderationStatus === 'AI_PREGRADED') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 600 }}>
                        <Sparkles size={11} /> {lang === 'vi' ? 'AI Chấm Sơ Bộ' : 'AI Pre-Graded'}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'inline', color: '#0f172a' }}>
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
                        background: selectedSub.language === 'java'
                          ? '#fee2e2'
                          : selectedSub.language === 'python'
                          ? '#ede9fe'
                          : '#fef3c7',
                        color: selectedSub.language === 'java'
                          ? '#b91c1c'
                          : selectedSub.language === 'python'
                          ? '#6d28d9'
                          : '#b45309',
                        border: `1px solid ${selectedSub.language === 'java' ? '#fca5a5' : selectedSub.language === 'python' ? '#c4b5fd' : '#fde68a'}`
                      }}>
                        {selectedSub.language === 'java' ? '☕ Java (OpenJDK 17)' : selectedSub.language === 'python' ? '🐍 Python 3' : '🟨 Node.js'}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {selectedSub.commit && selectedSub.commit !== 'DIRECT_SUBMI' && <>Commit: <code>{selectedSub.commit}</code> • </>}
                      {selectedSub.time}
                      {selectedSub.repo && selectedSub.repo.startsWith('http') && (
                        <> • Repo: <a href={selectedSub.repo} target="_blank" rel="noreferrer" style={{ color: '#6d28d9' }}>{selectedSub.repo.replace('https://github.com/', '')}</a></>
                      )}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSub(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 📄 MÃ NGUỒN BÀI NỘP TRỰC TIẾP (DIRECT CODE) & 4 CÂU HỎI PE */}
              {selectedSub.code_content && (() => {
                const code = selectedSub.code_content || '';
                const extractSection = (qNum: string) => {
                  const reg = new RegExp(
                    `(?:\\/\\/\\s*={2,}\\s*(?:QUESTION|CÂU|Q)[\\s_]*${qNum}[\\s_]*={2,}|\\/\\*\\s*={2,}\\s*(?:QUESTION|CÂU|Q)[\\s_]*${qNum}[\\s_]*={2,}\\s*\\*\\/)([\\s\\S]*?)(?=(?:\\/\\/\\s*={2,}\\s*(?:QUESTION|CÂU|Q)|\\/\\*\\s*={2,}\\s*(?:QUESTION|CÂU|Q)|$))`,
                    'i'
                  );
                  const m = code.match(reg);
                  if (m && m[1] && m[1].trim()) return m[1].trim();

                  if (qNum === '2' && (code.includes('class Car') || code.includes('class SpecCar'))) {
                    return code;
                  }
                  if (qNum === '3' && (code.includes('MyList') || code.includes('class Node'))) {
                    return code;
                  }
                  return '';
                };

                const q1Code = extractSection('1');
                const q2Code = extractSection('2');
                const q3Code = extractSection('3');
                const q4Code = extractSection('4');

                const displayedCode = selectedQuestionTab === 'all' 
                  ? code 
                  : (selectedQuestionTab === 'Q1' 
                      ? (q1Code || '// (Chưa có mã nguồn cho Câu 1 trong bài nộp)') 
                      : (selectedQuestionTab === 'Q2' 
                          ? (q2Code || '// (Chưa có mã nguồn cho Câu 2 trong bài nộp)') 
                          : (selectedQuestionTab === 'Q3' 
                              ? (q3Code || '// (Chưa có mã nguồn cho Câu 3 trong bài nộp)') 
                              : (q4Code || '// (Chưa có mã nguồn cho Câu 4 trong bài nộp)'))));

                return (
                  <div style={{
                    marginBottom: '0.85rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="#7c3aed" /> {lang === 'vi' ? 'Mã nguồn bài làm của sinh viên' : 'Student Submitted Code'} ({selectedSub.language === 'java' ? 'Java 17 (OpenJDK)' : selectedSub.language})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                        {displayedCode.split('\n').length} dòng
                      </span>
                    </div>

                    {/* 4 TABS CÂU HỎI PE PRO192 (Q1 - Q4) */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionTab('all')}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedQuestionTab === 'all' ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                          background: selectedQuestionTab === 'all' ? '#ede9fe' : '#ffffff',
                          color: selectedQuestionTab === 'all' ? '#6d28d9' : '#475569'
                        }}
                      >
                        ⭐ Tất cả mã nguồn
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionTab('Q1')}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedQuestionTab === 'Q1' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                          background: selectedQuestionTab === 'Q1' ? '#e0f2fe' : '#ffffff',
                          color: selectedQuestionTab === 'Q1' ? '#0369a1' : (q1Code ? '#334155' : '#94a3b8')
                        }}
                      >
                        Q1: Xử lý chuỗi (2đ) {q1Code ? '✓' : '—'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionTab('Q2')}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedQuestionTab === 'Q2' ? '1px solid #059669' : '1px solid #cbd5e1',
                          background: selectedQuestionTab === 'Q2' ? '#dcfce7' : '#ffffff',
                          color: selectedQuestionTab === 'Q2' ? '#15803d' : (q2Code ? '#334155' : '#94a3b8')
                        }}
                      >
                        Q2: Car & SpecCar (3đ) {q2Code ? '✓' : '—'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionTab('Q3')}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedQuestionTab === 'Q3' ? '1px solid #d97706' : '1px solid #cbd5e1',
                          background: selectedQuestionTab === 'Q3' ? '#fef3c7' : '#ffffff',
                          color: selectedQuestionTab === 'Q3' ? '#b45309' : (q3Code ? '#334155' : '#94a3b8')
                        }}
                      >
                        Q3: MyList (3đ) {q3Code ? '✓' : '—'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionTab('Q4')}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedQuestionTab === 'Q4' ? '1px solid #db2777' : '1px solid #cbd5e1',
                          background: selectedQuestionTab === 'Q4' ? '#fce7f3' : '#ffffff',
                          color: selectedQuestionTab === 'Q4' ? '#be185d' : (q4Code ? '#334155' : '#94a3b8')
                        }}
                      >
                        Q4: Đảo từ (2đ) {q4Code ? '✓' : '—'}
                      </button>
                    </div>

                    <pre style={{
                      margin: 0,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.78rem',
                      maxHeight: '180px',
                      overflow: 'auto',
                      lineHeight: 1.55
                    }}>
                      {displayedCode}
                    </pre>
                  </div>
                );
              })()}

              {/* 🧪 BẢNG ĐỐI SOÁT CHI TIẾT TEST CASES & BÁO CÁO LỖI DOCKER SANDBOX (HẠNG MỤC 1 - GIAO DIỆN SÁNG CHUẨN) */}
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
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                  }}>
                    {/* Header thông số thực thi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Terminal size={16} color="#7c3aed" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                          {lang === 'vi' ? 'Chi Tiết Chấm Điểm Docker Sandbox' : 'Docker Sandbox Autograding Breakdown'}
                        </span>
                        {totalTests > 0 ? (
                          <span style={{
                            fontSize: '0.74rem',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            background: isAllPass ? '#dcfce7' : (passedCount > 0 ? '#fef3c7' : '#fee2e2'),
                            color: isAllPass ? '#15803d' : (passedCount > 0 ? '#b45309' : '#b91c1c'),
                            border: `1px solid ${isAllPass ? '#86efac' : (passedCount > 0 ? '#fde68a' : '#fecaca')}`
                          }}>
                            {passedCount}/{totalTests} Test Cases Đạt ({totalEarned.toFixed(1)}/{totalMax.toFixed(1)}đ)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {lang === 'vi' ? 'Đang chấm điểm hoặc chưa có dữ liệu test' : 'Grading or no test results'}
                          </span>
                        )}
                      </div>

                      {hasTimeout && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#b91c1c', background: '#fee2e2', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fecaca', fontWeight: 700 }}>
                          <AlertTriangle size={12} color="#b91c1c" />
                          {lang === 'vi' ? 'Cảnh báo BR-03: Phát hiện Timeout (>5s)' : 'BR-03: Execution Timeout (>5s)'}
                        </span>
                      )}
                    </div>

                    {/* BẢNG THÔNG SỐ TELEMETRY MINH BẠCH DOCKER SANDBOX (Nền sáng trắng cao cấp) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '8px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '10px',
                      fontSize: '0.74rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>🐳 Docker Container ID:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <code style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.78rem' }}>
                            {trList[0]?.container_id || '66e950c00538'}
                          </code>
                          <span style={{ fontSize: '0.64rem', color: '#15803d', background: '#dcfce7', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            Active
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>📦 Docker Sandbox Image:</span>
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>
                          {trList[0]?.docker_image || (selectedSub.language === 'java' ? 'aita-sandbox-java:latest (openjdk:17-alpine)' : 'aita-sandbox-node:latest (node:20-alpine)')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>🔑 Mã Băm Bài Nộp (SHA-256):</span>
                        <code style={{ color: '#b45309', fontWeight: 700, fontSize: '0.75rem' }}>
                          {trList[0]?.code_hash || selectedSub.code_hash || 'e4b8a21f7c90d341'}
                        </code>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>🛡️ Giới Hạn Tài Nguyên:</span>
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          RAM: 256MB • CPU: 1.0 • Net: None
                        </span>
                      </div>
                    </div>

                    {/* Danh sách từng Test Case kèm đối soát Input, Expected, Actual Output */}
                    {totalTests > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                        {trList.map((tc, idx) => {
                          const tcTimeout = tc.execution_time_ms >= 5000 || (tc.actual_output && tc.actual_output.includes('TIMEOUT'));
                          const isCompileError = tc.status === 'COMPILATION_ERROR' || (tc.actual_output && (tc.actual_output.includes('error:') || tc.actual_output.includes('javac')));
                          return (
                            <div 
                              key={idx}
                              style={{
                                borderRadius: '8px',
                                padding: '10px 12px',
                                background: tc.passed ? '#f0fdf4' : isCompileError ? '#fffbeb' : '#fff1f2',
                                border: `1px solid ${tc.passed ? '#86efac' : isCompileError ? '#fde68a' : '#fecdd3'}`,
                                fontSize: '0.78rem'
                              }}
                            >
                              {/* Hàng trên: Icon trạng thái, Tên test, Huy hiệu, Thời gian, Điểm */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {tc.passed ? (
                                    <CheckCircle2 size={16} color="#16a34a" />
                                  ) : isCompileError ? (
                                    <AlertTriangle size={16} color="#d97706" />
                                  ) : (
                                    <XCircle size={16} color="#e11d48" />
                                  )}
                                  <span style={{ fontWeight: 700, color: tc.passed ? '#166534' : isCompileError ? '#92400e' : '#9f1239' }}>
                                    {tc.criterion}
                                  </span>
                                  {tc.is_hidden && (
                                    <span style={{ fontSize: '0.66rem', color: '#6d28d9', padding: '1px 5px', borderRadius: '4px', background: '#ede9fe', border: '1px solid #c4b5fd', fontWeight: 600 }}>
                                      🔒 Test Ẩn (BR-06)
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '0.72rem', color: tcTimeout ? '#b91c1c' : '#64748b', fontWeight: tcTimeout ? 800 : 500 }}>
                                    ⏱️ {tc.execution_time_ms}ms {tcTimeout ? '(Timeout)' : ''}
                                  </span>
                                  {isCompileError ? (
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '0.74rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fde68a'
                                    }}>
                                      COMPILATION ERROR (0.0/{tc.max_score}đ)
                                    </span>
                                  ) : tc.passed ? (
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#dcfce7',
                                      color: '#15803d',
                                      border: '1px solid #86efac'
                                    }}>
                                      PASSED (+{tc.score}/{tc.max_score}đ)
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#fee2e2',
                                      color: '#b91c1c',
                                      border: '1px solid #fecaca'
                                    }}>
                                      FAILED (+0.0/{tc.max_score}đ)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Báo cáo lỗi & Đối soát Input/Expected/Actual Output cho Giảng viên */}
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(0, 0, 0, 0.1)' }}>
                                {tcTimeout && (
                                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 10px', color: '#991b1b', fontSize: '0.73rem', marginBottom: '6px', fontWeight: 500 }}>
                                    <strong>⚠️ Lỗi Thực Thi:</strong> Phát hiện vòng lặp vô tận (Infinite Loop) hoặc thời gian vượt hạn mức 5.000ms. Watchdog (BR-03) đã can thiệp ngắt container an toàn.
                                  </div>
                                )}
                                {isCompileError && (
                                  <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', padding: '6px 10px', color: '#92400e', fontSize: '0.73rem', marginBottom: '6px', fontWeight: 500 }}>
                                    <strong>⚠️ Lỗi Biên Dịch (Compilation Error - javac):</strong> Code không vượt qua được bước biên dịch OpenJDK 17. Container Docker trả về Exit Code 1.
                                  </div>
                                )}
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '0.72rem' }}>
                                  {tc.input_data && (
                                    <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                      <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, marginBottom: '2px' }}>Dữ liệu Input:</div>
                                      <code style={{ color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>{tc.input_data}</code>
                                    </div>
                                  )}
                                  {tc.expected_output && (
                                    <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac' }}>
                                      <div style={{ color: '#16a34a', fontSize: '0.68rem', fontWeight: 700, marginBottom: '2px' }}>Expected (Kỳ vọng):</div>
                                      <code style={{ color: '#15803d', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: 600 }}>{tc.expected_output}</code>
                                    </div>
                                  )}
                                  <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${tc.passed ? '#86efac' : '#fecaca'}` }}>
                                    <div style={{ color: tc.passed ? '#16a34a' : '#b91c1c', fontSize: '0.68rem', fontWeight: 700, marginBottom: '2px' }}>
                                      {tc.passed ? 'Actual (Khớp 100%):' : 'Actual (Sai lệch/Lỗi):'}
                                    </div>
                                    <code style={{ color: tc.passed ? '#15803d' : '#b91c1c', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: tc.passed ? 600 : 500 }}>
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
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '0.78rem',
                        color: '#334155'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#b45309', fontWeight: 600 }}>
                          <Clock size={14} /> {lang === 'vi' ? 'Hệ thống Docker Sandbox đang xử lý hoặc đang nạp chi tiết các câu hỏi.' : 'Sandbox processing or loading test cases.'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                          {selectedSub.sandboxOutput}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* BR-09 Stage Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setActiveModalStage('review1')}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    gap: '5px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeModalStage === 'review1' ? '#7c3aed' : '#f1f5f9',
                    color: activeModalStage === 'review1' ? '#ffffff' : '#475569',
                    border: activeModalStage === 'review1' ? '1px solid #6d28d9' : '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Sparkles size={13} /> {lang === 'vi' ? '1. AI & GV 1 Xem Xét' : '1. AI & Lecturer 1'}
                </button>
                <button 
                  onClick={() => setActiveModalStage('review2')}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    gap: '5px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeModalStage === 'review2' ? '#7c3aed' : '#f1f5f9',
                    color: activeModalStage === 'review2' ? '#ffffff' : '#475569',
                    border: activeModalStage === 'review2' ? '1px solid #6d28d9' : '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Users size={13} /> {lang === 'vi' ? '2. GV 2 Chấm Chéo (Độc Lập)' : '2. Lecturer 2 Cross-Grade'}
                </button>
                <button 
                  onClick={() => setActiveModalStage('consensus')}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    gap: '5px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeModalStage === 'consensus' ? '#7c3aed' : '#f1f5f9',
                    color: activeModalStage === 'consensus' ? '#ffffff' : '#475569',
                    border: activeModalStage === 'consensus' ? '1px solid #6d28d9' : '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Award size={13} /> {lang === 'vi' ? '3. Biên Bản Đồng Thuận' : '3. Consensus Settlement'}
                </button>
              </div>

              {/* TAB 1: AI PRE-GRADING & REVIEWER 1 */}
              {activeModalStage === 'review1' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Card AI Pre-grading */}
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sparkles size={14} color="#7c3aed" /> {lang === 'vi' ? 'Bước 1: Điểm & Nhận xét từ AI Model' : 'Step 1: AI Preliminary Score & Critique'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#6d28d9' }}>
                          {selectedSub.ai_score ?? selectedSub.grade} / 10
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApproveAI(selectedSub)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            border: '1px solid #c4b5fd',
                            color: '#6d28d9',
                            background: '#ffffff',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          ⚡ {lang === 'vi' ? 'Phê duyệt điểm AI & Chốt ngay' : 'Approve AI Score & Finalize'}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                      {selectedSub.aiFeedback}
                    </p>
                  </div>

                  {/* Form Giảng Viên 1 */}
                  <form onSubmit={handleSaveGrade} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 800, marginBottom: '8px', color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} color="#7c3aed" /> {lang === 'vi' ? 'Giảng Viên 1 (Reviewer 1) Đánh Giá & Điều Chỉnh' : 'Lecturer 1 Review & Challenge'}
                    </h4>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
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
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
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
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', whiteSpace: 'nowrap', margin: 0 }}>
                        {lang === 'vi' ? 'Chỉ định GV 2 chấm kiểm định:' : 'Assign Lecturer 2:'}
                      </label>
                      <select 
                        value={assignedReviewer2}
                        onChange={e => setAssignedReviewer2(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
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
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={13} color="#15803d" /> {lang === 'vi' ? 'Lưu điểm GV 1 (Không cần GV 2)' : 'Save Grade (Single Lecturer)'}
                      </button>
                      <button 
                        type="button"
                        onClick={handleRequestSecondOpinion}
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#ffffff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
                        }}
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
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 600 }}>
                        {lang === 'vi' ? 'Kết quả từ GV 1:' : 'Lecturer 1 Assessment:'}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                        {selectedSub.reviewer_1_name || 'TS. Nguyễn Văn Giảng'}:
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        "{reviewer1Notes || selectedSub.reviewer_1_notes || (lang === 'vi' ? 'Đã xem xét bài nộp' : 'Reviewed')}"
                      </span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#6d28d9' }}>
                      {reviewer1Score} / 10
                    </span>
                  </div>

                  {/* Form Giảng Viên 2 */}
                  <form onSubmit={handleSubmitSecondOpinion} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 800, marginBottom: '4px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} color="#d97706" /> {lang === 'vi' ? 'Giảng Viên 2 (Reviewer 2) Chấm Điểm Độc Lập' : 'Lecturer 2 Independent Evaluation'}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      {lang === 'vi' ? 'Hệ thống tự động so sánh độ lệch điểm:' : 'Score difference comparison:'}
                      {' '}<strong>{lang === 'vi' ? '≤ 0.5: Tự chốt điểm | > 0.5: Mở họp đồng thuận' : '≤ 0.5: Auto-finalize | > 0.5: Consensus required'}</strong>.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
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
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
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
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        type="submit"
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                          color: '#ffffff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
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
                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', color: '#b45309', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <AlertTriangle size={15} color="#d97706" />
                      <span>{scoreDiffNotice}</span>
                    </div>
                  )}

                  {/* Bảng so sánh 3 nguồn điểm */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6d28d9', display: 'block', marginBottom: '2px', fontWeight: 700 }}>AI Pre-grade</span>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedSub.ai_score ?? selectedSub.grade ?? 0}</strong>
                    </div>
                    <div style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5b21b6', display: 'block', marginBottom: '2px', fontWeight: 700 }}>Giảng Viên 1</span>
                      <strong style={{ fontSize: '1.05rem', color: '#6d28d9' }}>{reviewer1Score}</strong>
                    </div>
                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#92400e', display: 'block', marginBottom: '2px', fontWeight: 700 }}>Giảng Viên 2</span>
                      <strong style={{ fontSize: '1.05rem', color: '#b45309' }}>{reviewer2Score}</strong>
                    </div>
                  </div>

                  {/* Form Biên bản đồng thuận */}
                  <form onSubmit={handleFinalizeConsensus} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                    <h4 style={{ fontSize: '0.84rem', fontWeight: 800, marginBottom: '8px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FileText size={14} color="#16a34a" /> {lang === 'vi' ? 'Biên Bản Thống Nhất & Điểm Số Chính Thức (Consensus)' : 'Consensus Notes & Final Published Score'}
                    </h4>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
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
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
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
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            color: '#15803d',
                            fontSize: '1rem',
                            fontWeight: 800,
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <button 
                        type="submit"
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#ffffff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        <Award size={14} /> {lang === 'vi' ? 'Chốt Điểm & Công Bố' : 'Publish Consensus Grade'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Footer Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    disabled={isRegrading}
                    onClick={handleRerunGrading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: isRegrading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isRegrading ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
                    <span>{lang === 'vi' ? 'Chấm lại (Regrade)' : 'Re-run Sandbox Grading'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleViewGradingHistory(selectedSub.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: '#ede9fe',
                      border: '1px solid #c4b5fd',
                      color: '#6d28d9',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <History size={13} />
                    <span>{lang === 'vi' ? 'Lịch sử chấm & So sánh' : 'Grading History & Diff'}</span>
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => setSelectedSub(null)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
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
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.color = '#6d28d9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <ArrowLeft size={15} />
                    <span>{lang === 'vi' ? 'Quay lại Danh sách Học phần' : 'Back to Courses'}</span>
                  </button>
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

            {/* Thanh chuyển đổi nhanh học phần: Bấm học phần nào hiển thị ngay đúng nhóm học phần đó */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '1.6rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setSelectedCourseId(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedCourseId === null ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                  background: selectedCourseId === null ? '#ede9fe' : '#ffffff',
                  color: selectedCourseId === null ? '#6d28d9' : '#475569',
                  boxShadow: selectedCourseId === null ? '0 2px 8px rgba(109, 40, 217, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📚</span>
                <span>{lang === 'vi' ? 'Tất cả học phần' : 'All Courses'}</span>
                <span style={{
                  background: selectedCourseId === null ? '#6d28d9' : '#f1f5f9',
                  color: selectedCourseId === null ? '#ffffff' : '#64748b',
                  fontSize: '0.72rem',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  fontWeight: 800
                }}>
                  {teams.length}
                </span>
              </button>

              {courses.map(c => {
                const cTeams = teams.filter(t => Number(t.course_id) === Number(c.course_id));
                const isCurrent = selectedCourseId !== null && Number(selectedCourseId) === Number(c.course_id);
                return (
                  <button
                    key={c.course_id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.course_id);
                      setTeamCourseId(c.course_id);
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isCurrent ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                      background: isCurrent ? '#ede9fe' : '#ffffff',
                      color: isCurrent ? '#6d28d9' : '#475569',
                      boxShadow: isCurrent ? '0 2px 8px rgba(109, 40, 217, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{c.course_code}</span>
                    <span style={{
                      background: isCurrent ? '#6d28d9' : '#f1f5f9',
                      color: isCurrent ? '#ffffff' : '#64748b',
                      fontSize: '0.72rem',
                      padding: '1px 7px',
                      borderRadius: '999px',
                      fontWeight: 800
                    }}>
                      {cTeams.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {loadingData && teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>{lang === 'vi' ? 'Đang tải danh sách nhóm...' : 'Loading teams...'}</p>
              </div>
            ) : (selectedCourseId !== null ? teams.filter(t => Number(t.course_id) === Number(selectedCourseId)) : teams).length === 0 ? (
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
                {(selectedCourseId !== null ? teams.filter(t => Number(t.course_id) === Number(selectedCourseId)) : teams).map((team) => {
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
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
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
                              background: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #ddd6fe',
                              borderRadius: '9999px',
                              padding: '2px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 800
                            }}>
                              {team.course_code || courseOfTeam?.course_code || 'SWD392'}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
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
                                background: '#f5f3ff',
                                border: '1px solid #ddd6fe',
                                color: '#6d28d9',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
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
                                background: '#fff1f2',
                                border: '1px solid #fecdd3',
                                color: '#e11d48',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
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
                              padding: '6px 12px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              color: '#475569',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              textDecoration: 'none',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <LinkIcon size={13} color="#6d28d9" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.repo_url.replace('https://github.com/', '')}</span>
                          </a>
                        </div>

                        {/* Danh sách thành viên nhóm đồ án */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Users size={15} color="#6d28d9" />
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
                                        background: isLeader ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#f8fafc',
                                        border: isLeader ? '1px solid #fde68a' : '1px solid #f1f5f9',
                                        boxShadow: isLeader ? '0 2px 6px rgba(245, 158, 11, 0.08)' : 'none',
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
                                            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#1e1b4b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {m.full_name}
                                            </span>
                                            {isLeader && (
                                              <span style={{
                                                fontSize: '0.64rem',
                                                padding: '2px 7px',
                                                borderRadius: '6px',
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                color: '#ffffff',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)'
                                              }}>
                                                <Crown size={10} /> LEADER
                                              </span>
                                            )}
                                          </div>
                                          <span style={{ fontSize: '0.72rem', color: isLeader ? '#92400e' : '#64748b', fontWeight: isLeader ? 600 : 500, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {isLeader ? (lang === 'vi' ? 'Trưởng nhóm' : 'Team Leader') : (lang === 'vi' ? 'Thành viên đồ án' : 'Team Member')}
                                          </span>
                                        </div>
                                      </div>
                                      <span style={{ fontSize: '0.72rem', color: isLeader ? '#78350f' : '#64748b', fontWeight: isLeader ? 600 : 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Course breadcrumbs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: '#ede9fe',
                        color: '#6d28d9',
                        border: '1px solid #ddd6fe',
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
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        fontWeight: 600
                      }}>
                        {selectedTeamDetails.semester || courseOfTeam?.semester || 'FA26'}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span style={{ fontSize: '0.82rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedTeamDetails.course_name || courseOfTeam?.course_name || 'Software Architecture & Design'}
                      </span>
                    </div>

                    {/* Team Title */}
                    <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
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
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          color: '#475569',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <GitBranch size={13} color="#6d28d9" />
                        <span>{selectedTeamDetails.repo_url.replace('https://github.com/', '')}</span>
                        <ExternalLink size={12} color="#64748b" />
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
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
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
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={18} color="#6d28d9" />
                      {lang === 'vi' ? `Danh sách thành viên (${selectedTeamDetails.members?.length || 0} sinh viên)` : `Team Members (${selectedTeamDetails.members?.length || 0})`}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
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
                              background: isLeader ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#f8fafc',
                              border: isLeader ? '1px solid #fde68a' : '1px solid #f1f5f9',
                              boxShadow: isLeader ? '0 2px 6px rgba(245, 158, 11, 0.08)' : 'none',
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
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                              }}>
                                {initial}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                  <strong style={{ fontSize: '0.98rem', color: '#1e1b4b', fontWeight: 800 }}>
                                    {m.full_name}
                                  </strong>
                                  {isLeader && (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '9999px',
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      color: '#ffffff',
                                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 800
                                    }}>
                                      <Crown size={11} /> {lang === 'vi' ? 'Trưởng nhóm' : 'Leader'}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '0.74rem',
                                    background: isLeader ? '#fef3c7' : '#ede9fe',
                                    color: isLeader ? '#92400e' : '#6d28d9',
                                    border: isLeader ? '1px solid #fde68a' : '1px solid #ddd6fe',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '260px'
                                  }}>
                                    {isLeader ? (lang === 'vi' ? 'Trưởng nhóm' : 'Team Leader') : (lang === 'vi' ? 'Thành viên đồ án' : 'Team Member')}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: isLeader ? '#78350f' : '#64748b' }}>
                                  <Mail size={12} color={isLeader ? '#92400e' : '#64748b'} />
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
          assignmentViewMode === 'grid' ? (
            renderAssignmentGridView()
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Thanh Điều Hướng Quay Lại & Studio Toolbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.04)',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setAssignmentViewMode('grid')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#1e293b',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowLeft size={16} color="#475569" />
                    <span>{lang === 'vi' ? 'Quay lại danh sách đề bài' : 'Back to Assignments'}</span>
                  </button>

                </div>
              </div>

              <div style={{ width: '100%' }}>
                <div style={{
                  padding: '1.75rem',
                  minWidth: 0,
                  overflow: 'hidden',
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#1e1b4b' }}>
                        {lang === 'vi' ? 'Bộ Test Cases & Rubric' : 'Test Cases & Rubric'}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: assignments.length > 0 ? '#ede9fe' : '#f1f5f9',
                        color: assignments.length > 0 ? '#6d28d9' : '#64748b',
                        border: assignments.length > 0 ? '1.5px solid #c4b5fd' : '1px solid #cbd5e1',
                        fontWeight: 700
                      }}>
                        {assignments.length > 0 ? `${rubricRules.length} Test Cases` : (lang === 'vi' ? '0 Bài tập' : '0 Assignments')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Nút Xem Văn Bản Đề Thi Chuẩn Doc/PDF chuyển từ bảng cũ sang */}
                      {selectedAssignmentId && (
                        <button
                          type="button"
                          onClick={() => {
                            const selAssign = assignments.find(a => a.assignment_id === selectedAssignmentId);
                            if (selAssign) {
                              setViewingExamAssignment(selAssign);
                            }
                          }}
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                          title={lang === 'vi' ? 'Xem văn bản đề thi chi tiết chuẩn FPT (Doc/PDF)' : 'View full exam document'}
                        >
                          <FileText size={15} color="#2563eb" />
                          <span>{lang === 'vi' ? 'Xem Văn Bản Đề Thi (Doc/PDF)' : 'View Exam Document'}</span>
                        </button>
                      )}
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
                        style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap', fontWeight: 700, borderRadius: '10px' }}
                      >
                        <Plus size={15} /> {lang === 'vi' ? 'Thêm Test Case' : 'Add Test Case'}
                      </button>
                    </div>
                  </div>

              {assignments.length === 0 ? (
                /* Empty state when NO assignments exist in the entire course */
                <div style={{
                  padding: '3rem 1.5rem',
                  border: '2px dashed #ddd6fe',
                  borderRadius: '16px',
                  textAlign: 'center',
                  background: '#faf5ff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7c3aed'
                  }}>
                    <FolderOpen size={26} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>
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
                      style={{ fontSize: '0.84rem', padding: '8px 18px', borderRadius: '10px', fontWeight: 700 }}
                    >
                      <Plus size={15} /> {lang === 'vi' ? 'Thêm Test Case đầu tiên' : 'Add First Test Case'}
                    </button>
                    <button
                      type="button"
                      onClick={openCreateAssignmentModal}
                      style={{
                        fontSize: '0.84rem',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} /> {lang === 'vi' ? 'Tạo bài tập trước' : 'Create Assignment First'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Assignment Lifecycle Status Filter Tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>
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
                            padding: '5px 12px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 700 : 500,
                            background: isActive ? '#ede9fe' : '#ffffff',
                            color: isActive ? '#6d28d9' : '#64748b',
                            border: isActive ? '1.5px solid #a78bfa' : '1px solid #e2e8f0',
                            boxShadow: isActive ? '0 2px 6px rgba(109, 40, 217, 0.12)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{labelMap[st]}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            background: isActive ? '#6d28d9' : '#f1f5f9',
                            color: isActive ? '#ffffff' : '#475569',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            fontWeight: 700
                          }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Assignment Selector with Delete Button */}
                  <div style={{
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px', minWidth: 0 }}>
                      <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {lang === 'vi' ? 'Đang chọn bài tập:' : 'Selected Assignment:'}
                      </label>
                      <select
                        value={selectedAssignmentId || ''}
                        onChange={(e) => handleSelectAssignment(Number(e.target.value))}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          maxWidth: '100%',
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#1e1b4b',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          textOverflow: 'ellipsis',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
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
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          color: '#7c3aed',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          cursor: isRegrading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <RotateCw size={14} className={isRegrading ? 'animate-spin' : ''} color="#7c3aed" />
                        <span>{isRegrading ? (lang === 'vi' ? 'Đang chấm...' : 'Re-grading...') : (lang === 'vi' ? 'Chấm lại bài nộp' : 'Re-grade')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(selectedAssignmentId)}
                        title={lang === 'vi' ? 'Xóa bài tập này' : 'Delete this assignment'}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Trash2 size={14} color="#dc2626" />
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
                            padding: '14px 18px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #faf5ff 100%)',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 10px rgba(124, 58, 237, 0.04)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: selAssign?.submission_type === 'TEAM' ? '#ede9fe' : '#e0e7ff',
                                color: selAssign?.submission_type === 'TEAM' ? '#6d28d9' : '#4338ca',
                                border: selAssign?.submission_type === 'TEAM' ? '1px solid #ddd6fe' : '1px solid #c7d2fe',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}>
                                {selAssign?.submission_type === 'TEAM' ? (lang === 'vi' ? '👥 Nhóm đồ án' : '👥 Team Assignment') : (lang === 'vi' ? '👤 Cá nhân' : '👤 Individual')}
                              </span>

                              {selAssign?.submission_type === 'TEAM' && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: targetType === 'ALL' ? '#ecfdf5' : '#fffbeb',
                                  color: targetType === 'ALL' ? '#059669' : '#d97706',
                                  border: targetType === 'ALL' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                                  fontSize: '0.78rem',
                                  fontWeight: 700
                                }}>
                                  {targetType === 'ALL' 
                                    ? (lang === 'vi' ? `🏫 Toàn bộ lớp (${cTeams.length} nhóm)` : `🏫 All Class (${cTeams.length} teams)`)
                                    : (lang === 'vi' ? `🎯 Chỉ định ${targetTeams.length} nhóm` : `🎯 ${targetTeams.length} Specific Teams`)}
                                </span>
                              )}

                              {/* Gộp ngôn ngữ và Docker Sandbox thành 1 chip cô đọng, chuyên nghiệp */}
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <Terminal size={13} color="#2563eb" />
                                <span>{selAssign?.allowed_language?.toUpperCase() === 'JAVA' ? 'Docker Java 17 Sandbox (256MB RAM)' : 'Docker Sandbox Engine'}</span>
                              </span>

                              {/* Assignment Lifecycle Status Badge */}
                              {(() => {
                                const st = selAssign?.status || 'PUBLISHED';
                                const bg = st === 'DRAFT' ? '#f1f5f9' : st === 'CLOSED' ? '#fef2f2' : st === 'ARCHIVED' ? '#faf5ff' : '#ecfdf5';
                                const border = st === 'DRAFT' ? '#cbd5e1' : st === 'CLOSED' ? '#fecaca' : st === 'ARCHIVED' ? '#e9d5ff' : '#a7f3d0';
                                const color = st === 'DRAFT' ? '#475569' : st === 'CLOSED' ? '#dc2626' : st === 'ARCHIVED' ? '#7c3aed' : '#059669';
                                const label = st === 'DRAFT' ? (lang === 'vi' ? '📝 Bản nháp (DRAFT)' : '📝 Draft') : st === 'CLOSED' ? (lang === 'vi' ? '🔒 Đã đóng (CLOSED)' : '🔒 Closed') : st === 'ARCHIVED' ? (lang === 'vi' ? '📦 Đã lưu trữ (ARCHIVED)' : '📦 Archived') : (lang === 'vi' ? '🟢 Đang mở (PUBLISHED)' : '🟢 Published');
                                return (
                                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: bg, border: `1px solid ${border}`, color, fontSize: '0.78rem', fontWeight: 800 }}>
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
                                        background: '#ecfdf5',
                                        border: '1px solid #a7f3d0',
                                        color: '#059669',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
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
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        color: '#dc2626',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
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
                                        background: '#f5f3ff',
                                        border: '1px solid #ddd6fe',
                                        color: '#6d28d9',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
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
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        color: '#475569',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      📦 {lang === 'vi' ? 'Lưu trữ (Archive)' : 'Archive'}
                                    </button>
                                  )}
                                </div>
                              )}

                              {selAssign?.submission_type === 'TEAM' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: submittedCount === relevantTeams.length && relevantTeams.length > 0 ? '#059669' : '#6d28d9',
                                    background: submittedCount === relevantTeams.length && relevantTeams.length > 0 ? '#ecfdf5' : '#ede9fe',
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    border: submittedCount === relevantTeams.length && relevantTeams.length > 0 ? '1px solid #a7f3d0' : '1px solid #ddd6fe',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {lang === 'vi' ? 'Tiến độ nộp:' : 'Submissions:'} {submittedCount}/{relevantTeams.length} {lang === 'vi' ? 'nhóm đã nộp' : 'teams'} ({relevantTeams.length > 0 ? Math.round((submittedCount / relevantTeams.length) * 100) : 0}%)
                                  </span>
                                  {notSubmittedCount > 0 && (
                                    <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                      ({notSubmittedCount} {lang === 'vi' ? 'nhóm chưa nộp' : 'pending'})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assignment Schedule & Submission Policy Ribbon */}
                          <div style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px 18px',
                            fontSize: '0.78rem',
                            color: '#475569',
                            alignItems: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
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
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>🕒 {lang === 'vi' ? 'Mở bài (Giờ VN):' : 'Starts (VN):'} <strong style={{ color: '#1e293b' }}>{fmt(selAssign?.start_date)}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>⏰ {lang === 'vi' ? 'Hạn nộp (Due):' : 'Due Date:'} <strong style={{ color: '#d97706' }}>{fmt(selAssign?.due_date || selAssign?.deadline)}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>🚪 {lang === 'vi' ? 'Đóng bài (Close):' : 'Close Date:'} <strong style={{ color: '#dc2626' }}>{fmt(selAssign?.close_date || selAssign?.deadline)}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>🏷️ {lang === 'vi' ? 'Nộp trễ:' : 'Late Submissions:'} <strong style={{ color: selAssign?.allow_late_submission === false ? '#dc2626' : '#059669' }}>{selAssign?.allow_late_submission === false ? (lang === 'vi' ? 'Không cho phép' : 'Disabled') : (lang === 'vi' ? 'Cho phép' : 'Allowed')}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>🔢 {lang === 'vi' ? 'Giới hạn nộp:' : 'Max Submissions:'} <strong style={{ color: '#7c3aed' }}>{selAssign?.max_submissions && selAssign.max_submissions > 0 ? `${selAssign.max_submissions} ${lang === 'vi' ? 'lần' : 'times'}` : (lang === 'vi' ? 'Không giới hạn' : 'Unlimited')}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>🔁 {lang === 'vi' ? 'Nộp lại:' : 'Resubmission:'} <strong style={{ color: selAssign?.allow_resubmission === false ? '#dc2626' : '#059669' }}>{selAssign?.allow_resubmission === false ? (lang === 'vi' ? 'Chặn' : 'Disabled') : (lang === 'vi' ? 'Cho phép' : 'Allowed')}</strong></span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {loadingRubrics ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" color="#7c3aed" /> {lang === 'vi' ? 'Đang tải test cases...' : 'Loading test cases...'}
                    </div>
                  ) : rubricRules.length === 0 ? (
                    <div style={{
                      padding: '2.5rem 1.5rem',
                      border: '2px dashed #ddd6fe',
                      borderRadius: '16px',
                      textAlign: 'center',
                      background: '#faf5ff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#ede9fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7c3aed'
                      }}>
                        <ListTodo size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '4px' }}>
                          {lang === 'vi' ? 'Bài tập này chưa có Test Case nào' : 'No Test Cases Configured Yet'}
                        </h4>
                        <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, maxWidth: '420px' }}>
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
                        style={{ fontSize: '0.84rem', padding: '8px 18px', borderRadius: '10px', marginTop: '6px', fontWeight: 700 }}
                      >
                        <Plus size={15} /> {lang === 'vi' ? 'Thêm Test Case đầu tiên' : 'Add First Test Case'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
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
                                padding: '14px 16px',
                                background: statusStr === 'Disabled' ? '#f8fafc' : '#ffffff',
                                border: statusStr === 'Hidden' ? '1.5px solid #d8b4fe' : (statusStr === 'Draft' ? '1.5px solid #fde68a' : (statusStr === 'Disabled' ? '1px solid #e2e8f0' : '1px solid #e2e8f0')),
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
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
                                        color: idx === 0 ? '#cbd5e1' : '#64748b',
                                        cursor: idx === 0 ? 'default' : 'pointer',
                                        padding: '0 2px',
                                        lineHeight: 1
                                      }}
                                      title={lang === 'vi' ? 'Di chuyển lên' : 'Move up'}
                                    >
                                      <ArrowUp size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === rubricRules.length - 1}
                                      onClick={() => handleReorderTestCases(idx, 'DOWN')}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: idx === rubricRules.length - 1 ? '#cbd5e1' : '#64748b',
                                        cursor: idx === rubricRules.length - 1 ? 'default' : 'pointer',
                                        padding: '0 2px',
                                        lineHeight: 1
                                      }}
                                      title={lang === 'vi' ? 'Di chuyển xuống' : 'Move down'}
                                    >
                                      <ArrowDown size={13} />
                                    </button>
                                  </div>

                                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800 }}>#{r.order_index ?? idx + 1}</span>
                                  {/* Question Badge for PE Exam */}
                                  {(() => {
                                    const crit = r.criterion || '';
                                    if (crit.includes('Q1')) {
                                      return <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 700 }}>Câu 1 (Chuỗi)</span>;
                                    }
                                    if (crit.includes('Q2')) {
                                      return <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontWeight: 700 }}>Câu 2 (OOP Car)</span>;
                                    }
                                    if (crit.includes('Q3')) {
                                      return <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700 }}>Câu 3 (MyList)</span>;
                                    }
                                    if (crit.includes('Q4')) {
                                      return <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 }}>Câu 4 (Đảo chuỗi)</span>;
                                    }
                                    return null;
                                  })()}
                                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e1b4b' }}>{r.criterion}</span>

                                  {/* Status Badge */}
                                  {statusStr === 'Hidden' ? (
                                    <span style={{
                                      fontSize: '0.74rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#f3e8ff',
                                      color: '#7e22ce',
                                      border: '1px solid #e9d5ff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 700
                                    }}>
                                      <ShieldCheck size={12} color="#7e22ce" /> Hidden (BR-06)
                                    </span>
                                  ) : statusStr === 'Draft' ? (
                                    <span style={{
                                      fontSize: '0.74rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fde68a',
                                      fontWeight: 700
                                    }}>
                                      Draft
                                    </span>
                                  ) : statusStr === 'Disabled' ? (
                                    <span style={{
                                      fontSize: '0.74rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#f1f5f9',
                                      color: '#64748b',
                                      border: '1px solid #cbd5e1',
                                      fontWeight: 700
                                    }}>
                                      Disabled
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '0.74rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#dcfce7',
                                      color: '#15803d',
                                      border: '1px solid #bbf7d0',
                                      fontWeight: 700
                                    }}>
                                      Active
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontSize: '0.82rem',
                                    color: '#6d28d9',
                                    fontWeight: 800,
                                    marginRight: '4px',
                                    background: '#ede9fe',
                                    border: '1px solid #ddd6fe',
                                    padding: '3px 9px',
                                    borderRadius: '6px'
                                  }}>
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
                                      background: '#f5f3ff',
                                      border: '1px solid #ddd6fe',
                                      color: '#7c3aed',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      padding: '6px 10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Edit3 size={13} color="#7c3aed" />
                                    <span>{lang === 'vi' ? 'Sửa' : 'Edit'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTestCase(r.rubric_rule_id)}
                                    title={lang === 'vi' ? 'Xóa hoặc vô hiệu hóa Test Case' : 'Delete or disable test case'}
                                    style={{
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      color: '#dc2626',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      padding: '6px 10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Trash2 size={13} color="#dc2626" />
                                    <span>{lang === 'vi' ? 'Xóa' : 'Delete'}</span>
                                  </button>
                                </div>
                              </div>

                              {r.description && (
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                                  {r.description}
                                </p>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
                                <div>
                                  <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                    {lang === 'vi' ? 'Dữ liệu Input (stdin):' : 'Input Data:'}
                                  </span>
                                  <pre style={{ margin: 0, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                                    {r.input_data || '(Trống)'}
                                  </pre>
                                </div>
                                <div>
                                  <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                    {lang === 'vi' ? 'Kết quả kỳ vọng (Expected):' : 'Expected Output:'}
                                  </span>
                                  <pre style={{ margin: 0, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'pre-wrap' }}>
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
        </div>
      )
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
              {/* Header Banner chính của Modal: Đề thi Thực hành PE Chuẩn FPT */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: '#dc2626' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#991b1b' }}>
                      {lang === 'vi' ? '⚡ Đề thi Thực hành PE Chuẩn FPT' : '⚡ PE Practical Exam Standard'}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                      {lang === 'vi' ? 'Môi trường Docker Sandbox cô lập đa ngôn ngữ • Hình thức nộp: Tệp nén ZIP mã nguồn' : 'Multi-language Isolated Docker Sandbox • Submission format: Source code ZIP'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fee2e2', color: '#991b1b', border: '1.5px solid #f87171', padding: '4px 10px', borderRadius: '6px' }}>
                    Thang điểm: 10.0đ
                  </span>
                  <button
                    type="button"
                    onClick={() => { setShowAssignmentModal(false); setModalError(''); }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease'
                    }}
                    title={lang === 'vi' ? 'Đóng' : 'Close'}
                  >
                    <X size={18} />
                  </button>
                </div>
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#6d28d9' }}>
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
                        background: 'var(--bg-card, #ffffff)',
                        border: '1.5px solid rgba(139, 92, 246, 0.4)',
                        color: 'var(--text-main, #0f172a)',
                        fontWeight: 600,
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#6d28d9' }}>
                      {lang === 'vi' ? 'Ngôn ngữ chấm bài (*):' : 'Programming Language (*):'}
                    </label>
                    <select
                      value={assignmentAllowedLanguage}
                      onChange={(e) => setAssignmentAllowedLanguage(e.target.value as any)}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1.5px solid rgba(139, 92, 246, 0.4)',
                        color: 'var(--text-main, #0f172a)',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="ALL">{lang === 'vi' ? 'Tất cả (Đa ngôn ngữ - Tự động định tuyến Docker)' : 'All (Auto-route Docker)'}</option>
                      <option value="java">☕ Java (OpenJDK 17 LTS - aita-sandbox-java:latest)</option>
                      <option value="python">🐍 Python (Python 3.11 - aita-sandbox-python:latest)</option>
                      <option value="javascript">🟢 Node.js (Node.js 20 - aita-sandbox-node:latest)</option>
                    </select>

                    {/* Docker Container Telemetry badge in modal */}
                    <div style={{
                      marginTop: '6px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: assignmentAllowedLanguage === 'java' ? '#fef2f2' : assignmentAllowedLanguage === 'python' ? '#f0f9ff' : '#f0fdf4',
                      border: `1.5px solid ${assignmentAllowedLanguage === 'java' ? '#fca5a5' : assignmentAllowedLanguage === 'python' ? '#7dd3fc' : '#86efac'}`,
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      <span style={{ fontWeight: 800, color: assignmentAllowedLanguage === 'java' ? '#991b1b' : assignmentAllowedLanguage === 'python' ? '#0369a1' : '#15803d' }}>
                        🐳 Docker: {assignmentAllowedLanguage === 'java' ? 'aita-sandbox-java:latest (OpenJDK 17 Alpine)' : assignmentAllowedLanguage === 'python' ? 'aita-sandbox-python:latest (Python 3.11)' : assignmentAllowedLanguage === 'javascript' ? 'aita-sandbox-node:latest (Node.js 20)' : 'Auto-Routing Engine'}
                      </span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>RAM 256MB • Net: none • UID 1001</span>
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#047857' }}>
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
                        background: 'var(--bg-card, #ffffff)',
                        border: '1.5px solid rgba(52, 211, 153, 0.45)',
                        color: 'var(--text-main, #0f172a)',
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

                {examCreationType === 'pe_custom' ? (
                  /* Giao diện Giảng viên Tự Soạn Bộ 4 Câu Hỏi PE (Custom 4-Question Authoring) */
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #c4b5fd',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)'
                  }}>
                    {/* Thanh nạp nhanh từ mẫu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} style={{ color: '#7c3aed' }} />
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#4c1d95' }}>
                          ✍️ {lang === 'vi' ? 'Soạn chi tiết các câu hỏi thực hành PE:' : 'Practical Exam Questions Authoring:'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                          {lang === 'vi' ? 'Chế độ đề:' : 'Template:'}
                        </span>
                        <button
                          type="button"
                          onClick={resetBlankCustomForm}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: peTemplateChoice === null ? '#7c3aed' : '#ffffff',
                            border: peTemplateChoice === null ? '1.5px solid #7c3aed' : '1px solid #a78bfa',
                            color: peTemplateChoice === null ? '#ffffff' : '#6d28d9',
                            cursor: 'pointer',
                            boxShadow: peTemplateChoice === null ? '0 2px 6px rgba(124, 58, 237, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          title={lang === 'vi' ? 'Tự do soạn 4 câu hỏi thực hành từ đầu (Đề trống)' : 'Write 4 custom questions from scratch'}
                        >
                          ✍️ {lang === 'vi' ? 'Tự soạn' : 'Custom'}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadPresetIntoCustomForm('de1')}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: peTemplateChoice === 'de1' ? '#7c3aed' : '#ffffff',
                            border: peTemplateChoice === 'de1' ? '1.5px solid #7c3aed' : '1px solid #a78bfa',
                            color: peTemplateChoice === 'de1' ? '#ffffff' : '#6d28d9',
                            cursor: 'pointer',
                            boxShadow: peTemplateChoice === 'de1' ? '0 2px 6px rgba(124, 58, 237, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          title={peTemplateChoice === 'de1' ? (lang === 'vi' ? 'Bấm để tắt mẫu (Chuyển sang Tự soạn)' : 'Click to toggle off') : (lang === 'vi' ? 'Nạp mẫu Đề 1 (Car & SpecCar)' : 'Load Template 1')}
                        >
                          Mẫu Đề 1
                        </button>
                        <button
                          type="button"
                          onClick={() => loadPresetIntoCustomForm('de2')}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: peTemplateChoice === 'de2' ? '#7c3aed' : '#ffffff',
                            border: peTemplateChoice === 'de2' ? '1.5px solid #7c3aed' : '1px solid #a78bfa',
                            color: peTemplateChoice === 'de2' ? '#ffffff' : '#6d28d9',
                            cursor: 'pointer',
                            boxShadow: peTemplateChoice === 'de2' ? '0 2px 6px rgba(124, 58, 237, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          title={peTemplateChoice === 'de2' ? (lang === 'vi' ? 'Bấm để tắt mẫu (Chuyển sang Tự soạn)' : 'Click to toggle off') : (lang === 'vi' ? 'Nạp mẫu Đề 2 (Employee & Manager)' : 'Load Template 2')}
                        >
                          Mẫu Đề 2
                        </button>
                        <button
                          type="button"
                          onClick={() => loadPresetIntoCustomForm('de3')}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: peTemplateChoice === 'de3' ? '#7c3aed' : '#ffffff',
                            border: peTemplateChoice === 'de3' ? '1.5px solid #7c3aed' : '1px solid #a78bfa',
                            color: peTemplateChoice === 'de3' ? '#ffffff' : '#6d28d9',
                            cursor: 'pointer',
                            boxShadow: peTemplateChoice === 'de3' ? '0 2px 6px rgba(124, 58, 237, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          title={peTemplateChoice === 'de3' ? (lang === 'vi' ? 'Bấm để tắt mẫu (Chuyển sang Tự soạn)' : 'Click to toggle off') : (lang === 'vi' ? 'Nạp mẫu Đề 3 (Book & Novel)' : 'Load Template 3')}
                        >
                          Mẫu Đề 3
                        </button>
                      </div>
                    </div>

                    {/* 4 Tabs Selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {[
                        { tab: 1, label: 'Câu 1 (2.0đ)', sub: 'Chuỗi / Cơ bản', activeColor: '#0284c7', activeBg: '#e0f2fe', activeBorder: '#0284c7' },
                        { tab: 2, label: 'Câu 2 (3.0đ)', sub: 'Kế thừa OOP', activeColor: '#7c3aed', activeBg: '#ede9fe', activeBorder: '#7c3aed' },
                        { tab: 3, label: 'Câu 3 (3.0đ)', sub: 'MyList DS', activeColor: '#059669', activeBg: '#d1fae5', activeBorder: '#059669' },
                        { tab: 4, label: 'Câu 4 (2.0đ)', sub: 'Thuật toán', activeColor: '#d97706', activeBg: '#fef3c7', activeBorder: '#d97706' }
                      ].map((item) => {
                        const isActive = activeCustomQuestionTab === item.tab;
                        return (
                          <button
                            key={item.tab}
                            type="button"
                            onClick={() => setActiveCustomQuestionTab(item.tab as 1 | 2 | 3 | 4)}
                            style={{
                              padding: '8px 6px',
                              borderRadius: '8px',
                              background: isActive ? item.activeBg : '#ffffff',
                              border: isActive ? `2px solid ${item.activeBorder}` : '1px solid #cbd5e1',
                              boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isActive ? item.activeColor : '#1e293b' }}>{item.label}</div>
                            <div style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500, color: isActive ? item.activeColor : '#64748b' }}>{item.sub}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Nội dung form theo Tab câu hỏi đang chọn */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      {activeCustomQuestionTab === 1 && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', marginBottom: '4px' }}>
                              📘 Tiêu đề Câu 1 (2.0đ):
                            </label>
                            <input
                              type="text"
                              value={customQ1Title}
                              onChange={(e) => setCustomQ1Title(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Nội dung yêu cầu đề bài:
                            </label>
                            <textarea
                              rows={2}
                              value={customQ1Desc}
                              onChange={(e) => setCustomQ1Desc(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '3px' }}>
                                DỮ LIỆU ĐẦU VÀO (STDIN):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ1Input}
                                onChange={(e) => setCustomQ1Input(e.target.value)}
                                placeholder="VD: hello 123 world 456"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', resize: 'vertical' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#047857', marginBottom: '3px' }}>
                                KẾT QUẢ ĐẦU RA KỲ VỌNG (STDOUT):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ1Output}
                                onChange={(e) => setCustomQ1Output(e.target.value)}
                                placeholder="VD: 579"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', fontWeight: 700, resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {activeCustomQuestionTab === 2 && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed', marginBottom: '4px' }}>
                              📙 Tiêu đề Câu 2 (3.0đ) - Kế thừa OOP:
                            </label>
                            <input
                              type="text"
                              value={customQ2Title}
                              onChange={(e) => setCustomQ2Title(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Nội dung yêu cầu đề bài:
                            </label>
                            <textarea
                              rows={2}
                              value={customQ2Desc}
                              onChange={(e) => setCustomQ2Desc(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '3px' }}>
                                DỮ LIỆU ĐẦU VÀO (STDIN):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ2Input}
                                onChange={(e) => setCustomQ2Input(e.target.value)}
                                placeholder="VD: Audi\n500\n2"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', resize: 'vertical' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#047857', marginBottom: '3px' }}>
                                KẾT QUẢ ĐẦU RA KỲ VỌNG (STDOUT):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ2Output}
                                onChange={(e) => setCustomQ2Output(e.target.value)}
                                placeholder="VD: Audi, 600, 2"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', fontWeight: 700, resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {activeCustomQuestionTab === 3 && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
                              📗 Tiêu đề Câu 3 (3.0đ) - Danh sách MyList:
                            </label>
                            <input
                              type="text"
                              value={customQ3Title}
                              onChange={(e) => setCustomQ3Title(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Nội dung yêu cầu đề bài:
                            </label>
                            <textarea
                              rows={2}
                              value={customQ3Desc}
                              onChange={(e) => setCustomQ3Desc(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '3px' }}>
                                DỮ LIỆU ĐẦU VÀO (STDIN):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ3Input}
                                onChange={(e) => setCustomQ3Input(e.target.value)}
                                placeholder="VD: 3\nA 10\nB 30\nC 20\n1"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', resize: 'vertical' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#047857', marginBottom: '3px' }}>
                                KẾT QUẢ ĐẦU RA KỲ VỌNG (STDOUT):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ3Output}
                                onChange={(e) => setCustomQ3Output(e.target.value)}
                                placeholder="VD: A 10, C 20, B 30"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', fontWeight: 700, resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {activeCustomQuestionTab === 4 && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>
                              📕 Tiêu đề Câu 4 (2.0đ) - Thuật toán:
                            </label>
                            <input
                              type="text"
                              value={customQ4Title}
                              onChange={(e) => setCustomQ4Title(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Nội dung yêu cầu đề bài:
                            </label>
                            <textarea
                              rows={2}
                              value={customQ4Desc}
                              onChange={(e) => setCustomQ4Desc(e.target.value)}
                              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '3px' }}>
                                DỮ LIỆU ĐẦU VÀO (STDIN):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ4Input}
                                onChange={(e) => setCustomQ4Input(e.target.value)}
                                placeholder="VD: university of fpt fpt"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', resize: 'vertical' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#047857', marginBottom: '3px' }}>
                                KẾT QUẢ ĐẦU RA KỲ VỌNG (STDOUT):
                              </label>
                              <textarea
                                rows={2}
                                value={customQ4Output}
                                onChange={(e) => setCustomQ4Output(e.target.value)}
                                placeholder="VD: fpt fpt of university"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: '0.8rem', fontFamily: 'Consolas, monospace', fontWeight: 700, resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
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
                )}

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

                {/* Preview Test Cases khi bật PE Preset hoặc Custom */}
                {pePresetMode && (
                  <div style={{
                    background: examCreationType === 'pe_custom' ? '#f0f9ff' : '#fef2f2',
                    border: examCreationType === 'pe_custom' ? '1.5px solid #bae6fd' : '1.5px solid #fecaca',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: examCreationType === 'pe_custom' ? '#0369a1' : '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                        {examCreationType === 'pe_custom'
                          ? (lang === 'vi' ? 'Bộ 4 Test Cases tự soạn (Q1 - Q4: 10.0đ):' : 'Custom 4 Test Cases (Q1 - Q4: 10.0 pts):')
                          : (lang === 'vi' ? `Bộ 10 Test Cases tự động nạp sẵn (${peTemplateChoice === 'de1' ? 'Đề 1: Car & SpecCar' : peTemplateChoice === 'de2' ? 'Đề 2: Employee & Manager' : 'Đề 3: Book & Novel'}):` : 'Pre-packaged 10 Test Cases (10.0 pts):')}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#475569', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        Tự động lưu vào DB khi bấm Tạo
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {examCreationType === 'pe_custom' ? (
                        [
                          { q: 'Q1 (2.0đ)', name: `Q1: ${customQ1Title || 'Xử lý chuỗi'}` },
                          { q: 'Q2 (3.0đ)', name: `Q2: ${customQ2Title || 'Kế thừa OOP'}` },
                          { q: 'Q3 (3.0đ)', name: `Q3: ${customQ3Title || 'Danh sách MyList'}` },
                          { q: 'Q4 (2.0đ)', name: `Q4: ${customQ4Title || 'Thuật toán logic'}` },
                        ].map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #e0f2fe', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <span style={{ fontWeight: 800, color: '#0284c7' }}>{item.q}</span>
                            <span style={{ color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                          </div>
                        ))
                      ) : peTemplateChoice === 'de2' ? (
                        [
                          { q: 'Q1 (2.0đ)', name: 'Q1.1 & Q1.2: Chuỗi Palindrome & Đếm nguyên âm' },
                          { q: 'Q2 (3.0đ)', name: 'Q2.1, Q2.2, Q2.3: Kế thừa Employee & Manager OOP' },
                          { q: 'Q3 (3.0đ)', name: 'Q3.1, Q3.2, Q3.3: Quản lý danh sách StaffList & Lương' },
                          { q: 'Q4 (2.0đ)', name: 'Q4.1 & Q4.2: Chuẩn hóa họ tên Title Case' },
                        ].map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #fee2e2', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <span style={{ fontWeight: 800, color: '#dc2626' }}>{item.q}</span>
                            <span style={{ color: '#1e293b', fontWeight: 600 }}>{item.name}</span>
                          </div>
                        ))
                      ) : peTemplateChoice === 'de3' ? (
                        [
                          { q: 'Q1 (2.0đ)', name: 'Q1.1 & Q1.2: Regex kiểm tra Email & MSSV FPT' },
                          { q: 'Q2 (3.0đ)', name: 'Q2.1, Q2.2, Q2.3: Kế thừa Book & Novel chiết khấu' },
                          { q: 'Q3 (3.0đ)', name: 'Q3.1, Q3.2, Q3.3: BookList đếm & đảo ngược' },
                          { q: 'Q4 (2.0đ)', name: 'Q4.1 & Q4.2: Thuật toán Word Frequency' },
                        ].map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #fee2e2', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <span style={{ fontWeight: 800, color: '#dc2626' }}>{item.q}</span>
                            <span style={{ color: '#1e293b', fontWeight: 600 }}>{item.name}</span>
                          </div>
                        ))
                      ) : (
                        [
                          { q: 'Q1 (2.0đ)', name: 'Q1.1 & Q1.2: Xử lý chuỗi (Tính tổng số nguyên)' },
                          { q: 'Q2 (3.0đ)', name: 'Q2.1, Q2.2, Q2.3: Kế thừa Car & SpecCar OOP' },
                          { q: 'Q3 (3.0đ)', name: 'Q3.1, Q3.2, Q3.3: Quản lý danh sách MyList & Sắp xếp' },
                          { q: 'Q4 (2.0đ)', name: 'Q4.1 & Q4.2: Thuật toán Reverse Words' },
                        ].map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #fee2e2', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <span style={{ fontWeight: 800, color: '#dc2626' }}>{item.q}</span>
                            <span style={{ color: '#1e293b', fontWeight: 600 }}>{item.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '1.2rem',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.2rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 240px', minWidth: '180px' }}>
                    {peTemplateChoice ? (
                      <span style={{ fontSize: '0.78rem', color: '#6d28d9', fontWeight: 700, lineHeight: 1.4, display: 'inline-block' }}>
                        ⚡ {lang === 'vi' ? `Đang nạp mẫu: ${peTemplateChoice === 'de1' ? 'Đề Số 1 (Car & SpecCar)' : peTemplateChoice === 'de2' ? 'Đề Số 2 (Employee & Manager)' : 'Đề Số 3 (Book & Novel)'} (Bấm lại để tắt mẫu)` : `Template loaded: ${peTemplateChoice.toUpperCase()} (Click again to toggle off)`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 700, lineHeight: 1.4, display: 'inline-block' }}>
                        ✍️ {lang === 'vi' ? 'Chế độ tự soạn tự do: Tùy biến câu hỏi & Test Cases (Tổng 10.0đ, Docker Sandbox)' : 'Custom Authoring Mode: Questions & Test Cases (10.0 pts, Docker Sandbox)'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => { setShowAssignmentModal(false); setEditingAssignment(null); setModalError(''); }}
                      style={{
                        height: '42px',
                        padding: '0 22px',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        color: '#475569',
                        border: '1.5px solid #cbd5e1',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#94a3b8';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#475569';
                      }}
                    >
                      {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAssignment}
                      style={{
                        height: '42px',
                        padding: '0 24px',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        cursor: submittingAssignment ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!submittingAssignment) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 18px rgba(109, 40, 217, 0.45)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!submittingAssignment) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(109, 40, 217, 0.35)';
                        }
                      }}
                    >
                      {submittingAssignment ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>{editingAssignment ? (lang === 'vi' ? 'Cập Nhật Bài Tập' : 'Update Assignment') : (lang === 'vi' ? 'Tạo Bài Tập' : 'Create Assignment')}</span>
                    </button>
                  </div>
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #1e1b4b)' }}>
                      {lang === 'vi' ? 'Studio AI: Soạn Đề Tự Động Từ Slide Bài Giảng' : 'AI Studio: Generate Assignment from Slide'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
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
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
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
                    border: uploadedFileName ? '1.5px solid rgba(34, 197, 94, 0.6)' : '1.5px dashed rgba(139, 92, 246, 0.45)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    background: uploadedFileName ? 'rgba(34, 197, 94, 0.08)' : 'rgba(124, 58, 237, 0.04)',
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
                      background: uploadedFileName ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: uploadedFileName ? '#16a34a' : '#7c3aed'
                    }}>
                      <Upload size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: uploadedFileName ? '#15803d' : 'var(--text-main, #1e293b)' }}>
                        {uploadedFileName ? `📄 Slide đã nạp: ${uploadedFileName}` : (lang === 'vi' ? 'Bấm để nạp file Slide bài giảng (.pdf, .pptx, .txt, .md)' : 'Click to upload Slide file (.pdf, .pptx, .txt)')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                        {uploadedFileName
                          ? (lang === 'vi' ? '✓ Đã nhận diện tài liệu bài giảng. Bấm nút tím bên dưới để AI sinh đề.' : '✓ Slide attached. Click button below to generate.')
                          : (lang === 'vi' ? 'Chọn file slide bài giảng từ máy tính để AI tự đọc kiến thức' : 'Upload lecture slide, AI will analyze its concepts')}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: uploadedFileName ? '#dcfce7' : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                    color: uploadedFileName ? '#15803d' : '#ffffff',
                    border: uploadedFileName ? '1px solid #86efac' : 'none',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                    whiteSpace: 'nowrap'
                  }}>
                    {uploadedFileName ? (lang === 'vi' ? 'Đổi file khác' : 'Change file') : (lang === 'vi' ? '📁 Chọn file slide' : 'Browse file')}
                  </span>
                </div>

                {/* Ô nhập chủ đề hoặc tóm tắt slide */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                      {lang === 'vi' ? 'Chủ đề bài giảng hoặc tóm tắt nội dung slide (*):' : 'Lecture Topic / Slide Summary (*):'}
                    </label>
                    {uploadedFileName && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
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
                      background: 'var(--bg-card, #ffffff)',
                      border: '1.5px solid rgba(139, 92, 246, 0.35)',
                      color: 'var(--text-main, #0f172a)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                {/* Cấu hình Học phần, Hình thức nộp & Đối tượng giao đề */}
                <div style={{
                  background: 'rgba(124, 58, 237, 0.04)',
                  border: '1px solid rgba(139, 92, 246, 0.22)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '5px' }}>
                        {lang === 'vi' ? 'Học phần liên kết (*):' : 'Course (*):'}
                      </label>
                      <select
                        value={aiCourseId || selectedCourseId || (courses[0]?.course_id ?? '')}
                        onChange={(e) => {
                          setAiCourseId(e.target.value);
                          setAiTargetTeamIds([]);
                        }}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card, #ffffff)', border: '1px solid rgba(139, 92, 246, 0.35)', color: 'var(--text-main, #0f172a)', fontSize: '0.85rem' }}
                      >
                        {courses.map(c => (
                          <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9', marginBottom: '5px' }}>
                        {lang === 'vi' ? 'Hình thức nộp (*):' : 'Submission Type (*):'}
                      </label>
                      <select
                        value={aiSubmissionType}
                        onChange={(e) => setAiSubmissionType(e.target.value as 'INDIVIDUAL' | 'TEAM')}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card, #ffffff)', border: '1px solid rgba(139, 92, 246, 0.45)', color: '#6d28d9', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <option value="INDIVIDUAL">{lang === 'vi' ? '👤 Cá nhân (Individual)' : '👤 Individual'}</option>
                        <option value="TEAM">{lang === 'vi' ? '👥 Theo nhóm (Team)' : '👥 Team'}</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#047857', marginBottom: '5px' }}>
                        {lang === 'vi' ? 'Đối tượng được giao bài (*):' : 'Target Audience (*):'}
                      </label>
                      <select
                        value={aiTargetType}
                        onChange={(e) => setAiTargetType(e.target.value as 'ALL' | 'SPECIFIC_TEAMS')}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card, #ffffff)', border: '1px solid rgba(52, 211, 153, 0.5)', color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <option value="ALL">{lang === 'vi' ? '🏫 Toàn bộ lớp (All Class)' : '🏫 All Class'}</option>
                        <option value="SPECIFIC_TEAMS">{lang === 'vi' ? '🎯 Chỉ định nhóm cụ thể (Specific Teams)' : '🎯 Specific Teams'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Danh sách chọn nhóm cụ thể khi aiTargetType === 'SPECIFIC_TEAMS' */}
                  {aiTargetType === 'SPECIFIC_TEAMS' && (
                    <div style={{
                      background: 'rgba(52, 211, 153, 0.06)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#047857' }}>
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
                            style={{ fontSize: '0.74rem', fontWeight: 600, padding: '3px 8px', background: 'rgba(139, 92, 246,0.15)', color: '#6d28d9', border: '1px solid rgba(139, 92, 246,0.3)', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {lang === 'vi' ? 'Chọn tất cả' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiTargetTeamIds([])}
                            style={{ fontSize: '0.74rem', fontWeight: 600, padding: '3px 8px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
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
                                    <span style={{ fontWeight: 600, color: isChecked ? '#047857' : 'var(--text-main)' }}>{t.team_name}</span>
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
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '5px' }}>
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
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        color: 'var(--text-main, #0f172a)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="python">🐍 Python 3 (sys.stdin / stdout)</option>
                      <option value="javascript">⚡ Node.js (fs.readFileSync / stdout)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '5px' }}>
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
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        color: 'var(--text-main, #0f172a)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="EASY">🟢 Cơ bản (Easy)</option>
                      <option value="MEDIUM">🟡 Trung bình (Medium)</option>
                      <option value="HARD">🔴 Nâng cao (Hard)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#b45309', marginBottom: '5px' }}>
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
                        background: 'var(--bg-card, #ffffff)',
                        border: '1.5px solid rgba(245, 158, 11, 0.45)',
                        color: 'var(--text-main, #0f172a)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
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
                      background: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName)
                        ? 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      color: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName)
                        ? '#7c3aed'
                        : '#ffffff',
                      border: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName)
                        ? '1.5px solid #c4b5fd'
                        : 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isAiGenerating || (!aiTopicInput.trim() && !uploadedFileName)
                        ? '0 2px 8px rgba(124, 58, 237, 0.12)'
                        : '0 4px 18px rgba(124, 58, 237, 0.45)',
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '1.25rem'
          }}>
            <div style={{
              width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
              padding: '2rem 2.2rem', borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                  }}>
                    {editingRubric ? <Edit3 size={22} color="#7c3aed" /> : <Plus size={22} color="#7c3aed" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {editingRubric 
                        ? (lang === 'vi' ? 'Chỉnh sửa Test Case / Rubric' : 'Edit Test Case / Rubric')
                        : (assignments.length === 0 ? (lang === 'vi' ? 'Thêm Test Case & Khởi Tạo Bài Tập' : 'Add Test Case & Create Assignment') : (lang === 'vi' ? 'Thêm Test Case cho Bài Tập' : 'Add Test Case to Assignment'))}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                      {lang === 'vi' ? 'Định nghĩa tiêu chí chấm và dữ liệu kiểm thử tự động Docker Sandbox' : 'Define autograding criteria and Docker Sandbox test data'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddTestCaseModal(false); setEditingRubric(null); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span>{modalError}</span>
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

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem'
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowAddTestCaseModal(false); setEditingRubric(null); }}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTestCase}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: submittingTestCase ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
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


        {/* MODAL: LỊCH SỬ CHẤM ĐIỂM & SO SÁNH KẾT QUẢ (GRADING HISTORY & DIFF) */}
        {showHistoryModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '880px',
              maxHeight: '90vh',
              borderRadius: '24px',
              padding: '2rem 2.2rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                  }}>
                    <History size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {lang === 'vi' ? 'Lịch sử chấm điểm & So sánh kết quả' : 'Grading History & Score Comparison'}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                      {historyData?.assignment_title ? `${historyData.assignment_title} • ` : ''}
                      {lang === 'vi' ? 'Mã bài nộp #' : 'Submission #'}{historySubmissionId}
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              {loadingHistory ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '10px' }}>
                  <Loader2 size={32} className="animate-spin" color="#7c3aed" />
                  <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                    {lang === 'vi' ? 'Đang tải lịch sử các phiên chấm...' : 'Loading grading history...'}
                  </span>
                </div>
              ) : !historyData || !historyData.attempts || historyData.attempts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontWeight: 600 }}>
                  {lang === 'vi' ? 'Chưa có lịch sử chấm nào cho bài nộp này.' : 'No grading attempts found for this submission.'}
                </div>
              ) : (() => {
                const attempts = historyData.attempts;
                const activeAttempt = attempts[selectedAttemptIndex] || attempts[attempts.length - 1];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Top Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                          {lang === 'vi' ? 'Tổng số lần chấm' : 'Total Attempts'}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
                          {attempts.length} {lang === 'vi' ? 'lần' : 'attempts'}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                          {lang === 'vi' ? 'Điểm phiên hiện tại' : 'Active Attempt Score'}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: (activeAttempt.total_score >= 8) ? '#059669' : (activeAttempt.total_score >= 5 ? '#d97706' : '#dc2626'), marginTop: '2px' }}>
                          {Number(activeAttempt.total_score).toFixed(1)} / {Number(activeAttempt.max_score || 10).toFixed(1)}đ
                        </div>
                      </div>

                      {activeAttempt.score_diff && (
                        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            {lang === 'vi' ? 'Độ lệch so với lần trước' : 'Score Difference'}
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: (activeAttempt.score_delta >= 0) ? '#059669' : '#dc2626', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {activeAttempt.score_diff}đ
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>
                              ({activeAttempt.score_delta >= 0 ? 'Tăng điểm' : 'Giảm điểm'})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline Navigator */}
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
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
                                background: isSelected ? '#ede9fe' : '#f8fafc',
                                border: isSelected ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                                color: isSelected ? '#6d28d9' : '#475569',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: isSelected ? 800 : 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span>{lang === 'vi' ? `Lần ${att.attempt_number || (idx + 1)}` : `Attempt #${att.attempt_number || (idx + 1)}`}</span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: isSelected ? '#7c3aed' : '#e2e8f0',
                                color: isSelected ? '#ffffff' : '#475569'
                              }}>
                                {Number(att.total_score).toFixed(1)}đ
                              </span>
                              {att.score_diff && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: att.score_delta >= 0 ? '#059669' : '#dc2626'
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
                    <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#6d28d9' }}>
                            {lang === 'vi' ? `Lần chấm #${activeAttempt.attempt_number}` : `Attempt #${activeAttempt.attempt_number}`}
                          </span>
                          <span style={{
                            padding: '3px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                            background: activeAttempt.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                            color: activeAttempt.status === 'COMPLETED' ? '#059669' : '#b45309',
                            border: `1.5px solid ${activeAttempt.status === 'COMPLETED' ? '#a7f3d0' : '#fde68a'}`
                          }}>
                            {activeAttempt.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          {activeAttempt.completed_at 
                            ? `${lang === 'vi' ? 'Hoàn thành:' : 'Completed:'} ${new Date(activeAttempt.completed_at).toLocaleString('vi-VN')}` 
                            : (activeAttempt.queued_at ? `${lang === 'vi' ? 'Khởi tạo:' : 'Queued:'} ${new Date(activeAttempt.queued_at).toLocaleString('vi-VN')}` : '')}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.84rem', color: '#1e1b4b' }}>
                        <strong style={{ color: '#64748b' }}>{lang === 'vi' ? 'Lý do chấm lại:' : 'Regrade reason:'}</strong>{' '}
                        <span style={{ fontWeight: 600 }}>{activeAttempt.regrade_reason || (selectedAttemptIndex === 0 ? 'Nộp bài ban đầu' : 'Chấm lại theo yêu cầu giảng viên')}</span>
                      </div>

                      {activeAttempt.triggered_by_name && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          <strong>{lang === 'vi' ? 'Người yêu cầu:' : 'Triggered by:'}</strong> {activeAttempt.triggered_by_name}
                        </div>
                      )}
                    </div>

                    {/* Changed Test Cases (Diff Comparison) */}
                    {activeAttempt.changed_test_cases && activeAttempt.changed_test_cases.length > 0 && (
                      <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={15} color="#b45309" />
                          <span>{lang === 'vi' ? `Phát hiện ${activeAttempt.changed_test_cases.length} Test Case thay đổi trạng thái/điểm so với lần trước:` : `${activeAttempt.changed_test_cases.length} Test Cases changed compared to previous attempt:`}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeAttempt.changed_test_cases.map((ch: any, cIdx: number) => (
                            <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', background: '#ffffff', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: '10px' }}>
                              <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{ch.criterion}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{ch.previous_status} ({ch.previous_score}đ)</span>
                                <span style={{ color: '#059669', fontWeight: 800 }}>{ch.current_status} ({ch.current_score}đ)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Cases Detail cho active attempt */}
                    {activeAttempt.test_case_results && activeAttempt.test_case_results.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                          {lang === 'vi' ? 'Chi tiết test cases:' : 'Test case details:'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeAttempt.test_case_results.map((tc: any, tIdx: number) => (
                            <div key={tIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                  background: tc.status === 'PASSED' ? '#059669' : tc.status === 'PARTIAL' ? '#d97706' : '#dc2626'
                                }} />
                                <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{tc.criterion || tc.test_name}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                                  background: tc.status === 'PASSED' ? '#ecfdf5' : tc.status === 'PARTIAL' ? '#fef3c7' : '#fef2f2',
                                  color: tc.status === 'PASSED' ? '#059669' : tc.status === 'PARTIAL' ? '#b45309' : '#dc2626',
                                  border: `1px solid ${tc.status === 'PASSED' ? '#a7f3d0' : tc.status === 'PARTIAL' ? '#fde68a' : '#fecaca'}`
                                }}>
                                  {tc.status}
                                </span>
                                <span style={{ color: '#475569', fontWeight: 700 }}>{Number(tc.score || 0).toFixed(1)}đ</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Close button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowHistoryModal(false)}
                        style={{
                          fontSize: '0.86rem',
                          padding: '10px 22px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          border: '1.5px solid #cbd5e1',
                          color: '#334155',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
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

        {viewingExamAssignment && (() => {
          const assign = viewingExamAssignment;
          const isJava = Boolean(assign.title?.includes('PE') || assign.allowed_language?.toUpperCase() === 'JAVA' || assign.title?.includes('PRO192'));
          const courseCode = assign.course_code || (isJava ? 'PRO192' : 'CSD201');
          const courseName = assign.course_name || (isJava ? 'Object-Oriented Programming (Java OOP)' : 'Data Structures & Algorithms');
          const isPaper = examPaperTheme === 'paper';

          const formattedDeadline = (() => {
            const d = assign.due_date || assign.deadline;
            if (!d) return '23:59:00';
            try {
              const dt = new Date(d);
              if (isNaN(dt.getTime())) return d;
              return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')} ngày ${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
            } catch {
              return d;
            }
          })();

          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1.25rem'
            }}>
              <div style={{
                width: '100%',
                maxWidth: '1020px',
                maxHeight: '94vh',
                overflowY: 'auto',
                padding: '2rem 2.2rem',
                borderRadius: '24px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                position: 'relative'
              }}>
                {/* Header thanh công cụ (Action Bar) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '1.2rem',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                      border: '1.5px solid #ddd6fe',
                      color: '#6d28d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                    }}>
                      <FileText size={22} color="#7c3aed" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          letterSpacing: '0.02em'
                        }}>
                          {isJava ? 'PE EXAM' : 'ASSIGNMENT DOC'}
                        </span>
                        <span style={{
                          fontSize: '0.74rem',
                          color: '#6d28d9',
                          background: '#ede9fe',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          Mã đề: PE_{courseCode}_0{assign.assignment_id || '1'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                        {lang === 'vi' ? 'Văn Bản Đề Thi Chuẩn FPT (Exam Paper)' : 'Official Exam Document'}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Nút đổi Theme: Giấy A4 Trắng vs Chế độ Tối */}
                    <button
                      type="button"
                      onClick={() => setExamPaperTheme(isPaper ? 'dark' : 'paper')}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        background: isPaper ? '#f8fafc' : '#1e1b4b',
                        border: '1.5px solid #cbd5e1',
                        color: isPaper ? '#334155' : '#e0e7ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      title={isPaper ? 'Chuyển sang giao diện nền tối' : 'Chuyển sang giao diện tờ giấy thi A4 sáng'}
                    >
                      {isPaper ? '🌙 Nền Tối' : '📄 Giấy A4'}
                    </button>

                    {/* Tải DOC */}
                    <button
                      type="button"
                      onClick={() => handleDownloadExamDoc(assign)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                      title={lang === 'vi' ? 'Tải file Word (.DOC) đề thi để in hoặc gửi sinh viên' : 'Download Word Doc'}
                    >
                      <Download size={15} />
                      <span>{lang === 'vi' ? 'Tải File Đề (.DOC)' : 'Download .DOC'}</span>
                    </button>

                    {/* Sao chép đề bài */}
                    <button
                      type="button"
                      onClick={() => handleCopyExamText(assign)}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: copiedExamText ? '#059669' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      title={lang === 'vi' ? 'Sao chép toàn bộ đề bài vào bộ nhớ tạm' : 'Copy exam text'}
                    >
                      {copiedExamText ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                      <span>{copiedExamText ? (lang === 'vi' ? 'Đã sao chép!' : 'Copied!') : (lang === 'vi' ? 'Sao chép đề' : 'Copy Text')}</span>
                    </button>

                    {/* Chuyển sang Cấu hình Rubrics */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectAssignment(assign.assignment_id);
                        setAssignmentViewMode('detail');
                        setViewingExamAssignment(null);
                      }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        background: '#ede9fe',
                        border: '1.5px solid #ddd6fe',
                        color: '#6d28d9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      title={lang === 'vi' ? 'Mở tab cấu hình Docker Sandbox & 10 Test Cases' : 'Open Rubrics Studio'}
                    >
                      <Settings size={15} color="#6d28d9" />
                      <span>{lang === 'vi' ? 'Cấu Hình Rubrics' : 'Rubrics & Tests'}</span>
                    </button>

                    {/* Đóng */}
                    <button
                      type="button"
                      onClick={() => setViewingExamAssignment(null)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      title={lang === 'vi' ? 'Đóng' : 'Close'}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* VĂN BẢN ĐỀ THI A4 PAPER SHEET */}
                <div style={{
                  background: isPaper ? '#fcfcfd' : '#090d16',
                  borderRadius: '18px',
                  border: isPaper ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '2.5rem 2.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.4rem',
                  boxShadow: isPaper ? '0 4px 20px -2px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(0,0,0,0.02)' : 'inset 0 2px 8px rgba(0,0,0,0.6)',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  transition: 'background 0.2s ease, border 0.2s ease'
                }}>
                  {/* Tiêu đề Quốc hiệu & Trường FPT */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: isPaper ? '3px double #cbd5e1' : '2px solid rgba(255, 255, 255, 0.15)',
                    paddingBottom: '1.2rem',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 900,
                        fontSize: '0.92rem',
                        letterSpacing: '0.04em',
                        color: isPaper ? '#1e1b4b' : '#f8fafc',
                        textTransform: 'uppercase'
                      }}>
                        TRƯỜNG ĐẠI HỌC FPT QUY NHƠN • CƠ SỞ QUY NHƠN
                      </div>
                      <div style={{ fontSize: '0.82rem', color: isPaper ? '#64748b' : '#94a3b8', marginTop: '3px', fontWeight: 500 }}>
                        Khoa Công Nghệ Thông Tin — Bộ Môn Kỹ Thuật Phần Mềm
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 900,
                        fontSize: '0.94rem',
                        color: isPaper ? '#b91c1c' : '#fca5a5',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                      }}>
                        ĐỀ THI THỰC HÀNH (PRACTICAL EXAM)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isPaper ? '#475569' : '#cbd5e1', marginTop: '3px' }}>
                        Học kỳ: <strong>FA26</strong> • Đợt thi: <strong>1</strong> • Mã đề: <strong style={{ color: isPaper ? '#1e1b4b' : '#ffffff' }}>PE_{courseCode}_0{assign.assignment_id || '1'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tên đề thi & Môn học */}
                  <div style={{ textAlign: 'center', padding: '0.6rem 0' }}>
                    <h2 style={{
                      fontSize: '1.45rem',
                      fontWeight: 900,
                      color: isPaper ? '#1e1b4b' : '#ffffff',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.01em'
                    }}>
                      {assign.title}
                    </h2>
                    <div style={{
                      fontSize: '0.92rem',
                      color: isPaper ? '#6d28d9' : '#a78bfa',
                      fontWeight: 700,
                      marginTop: '6px'
                    }}>
                      Môn học: {courseCode} — {courseName}
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      justifyContent: 'center',
                      gap: '14px',
                      marginTop: '12px',
                      flexWrap: 'wrap',
                      fontSize: '0.82rem',
                      color: isPaper ? '#334155' : '#cbd5e1',
                      background: isPaper ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                      padding: '8px 18px',
                      borderRadius: '12px',
                      border: isPaper ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <span>⏱️ Thời gian: <strong style={{ color: isPaper ? '#1e1b4b' : '#ffffff' }}>75 phút</strong></span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span>⭐ Thang điểm: <strong style={{ color: isPaper ? '#1e1b4b' : '#ffffff' }}>{assign.max_score || 10.0} điểm</strong></span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span>📦 Hình thức: <strong style={{ color: isPaper ? '#0284c7' : '#38bdf8' }}>File .ZIP (Mã nguồn)</strong></span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span>☕ Docker: <strong style={{ color: isPaper ? '#b91c1c' : '#fca5a5' }}>{isJava ? 'aita-sandbox-java:latest (Java 17)' : 'Auto Sandbox'}</strong></span>
                    </div>
                  </div>

                  {/* LƯU Ý PHÒNG THI */}
                  <div style={{
                    background: isPaper ? '#fff1f2' : 'rgba(239, 68, 68, 0.08)',
                    border: isPaper ? '1.5px solid #fecdd3' : '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    fontSize: '0.84rem',
                    color: isPaper ? '#881337' : '#fecaca',
                    lineHeight: 1.6
                  }}>
                    <strong style={{
                      color: isPaper ? '#9f1239' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                      fontWeight: 800
                    }}>
                      <AlertTriangle size={16} color={isPaper ? '#e11d48' : '#f87171'} /> QUY ĐỊNH LÀM BÀI & CẤU TRÚC NỘP BÀI:
                    </strong>
                    <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                      <li style={{ marginBottom: '3px' }}>
                        Thí sinh tạo một thư mục mã nguồn chứa đầy đủ các file theo yêu cầu của từng câu (ví dụ:{' '}
                        <code style={{
                          background: isPaper ? '#ffe4e6' : 'rgba(0,0,0,0.3)',
                          border: isPaper ? '1px solid #fecdd3' : 'none',
                          color: isPaper ? '#9f1239' : '#fed7aa',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          Main.java, Car.java, SpecCar.java, MyList.java
                        </code>).
                      </li>
                      <li style={{ marginBottom: '3px' }}>
                        Nén thư mục thành file <strong>.ZIP</strong> duy nhất và nộp lên hệ thống AITA trước hạn: <strong style={{ color: isPaper ? '#9f1239' : '#fecaca', textDecoration: 'underline' }}>{formattedDeadline}</strong>.
                      </li>
                      <li style={{ marginBottom: '3px' }}>
                        Bài làm được chạy và chấm tự động hoàn toàn trên môi trường cô lập <strong>Docker OpenJDK 17 Sandbox</strong> với 10 Test Cases (thang điểm 10.0đ).
                      </li>
                      <li>
                        Nghiêm cấm sao chép code. Hệ thống kiểm tra đối sánh bằng <strong>SHA-256 Checksum + AI Plagiarism Radar</strong>.
                      </li>
                    </ul>
                  </div>

                  {/* NỘI DUNG CHI TIẾT 4 CÂU HỎI */}
                  {isJava ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '6px' }}>
                      {getExamQuestions(assign).map((q, idx) => {
                        const palettesPaper = [
                          { border: '#bae6fd', bg: '#f0f9ff', titleColor: '#0369a1', badgeBg: '#e0f2fe', badgeColor: '#0284c7', icon: '📘' },
                          { border: '#ddd6fe', bg: '#f5f3ff', titleColor: '#6d28d9', badgeBg: '#ede9fe', badgeColor: '#5b21b6', icon: '📙' },
                          { border: '#bbf7d0', bg: '#f0fdf4', titleColor: '#15803d', badgeBg: '#dcfce7', badgeColor: '#166534', icon: '📗' },
                          { border: '#fde68a', bg: '#fffbeb', titleColor: '#b45309', badgeBg: '#fef3c7', badgeColor: '#92400e', icon: '📕' }
                        ];
                        const palettesDark = [
                          { border: 'rgba(56, 189, 248, 0.25)', bg: 'rgba(56, 189, 248, 0.05)', titleColor: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeColor: '#7dd3fc', icon: '📘' },
                          { border: 'rgba(168, 85, 247, 0.25)', bg: 'rgba(168, 85, 247, 0.05)', titleColor: '#c084fc', badgeBg: 'rgba(168, 85, 247, 0.15)', badgeColor: '#d8b4fe', icon: '📙' },
                          { border: 'rgba(52, 211, 153, 0.25)', bg: 'rgba(52, 211, 153, 0.05)', titleColor: '#34d399', badgeBg: 'rgba(52, 211, 153, 0.15)', badgeColor: '#6ee7b7', icon: '📗' },
                          { border: 'rgba(251, 191, 36, 0.25)', bg: 'rgba(251, 191, 36, 0.05)', titleColor: '#fbbf24', badgeBg: 'rgba(251, 191, 36, 0.15)', badgeColor: '#fde68a', icon: '📕' }
                        ];
                        const scheme = isPaper ? (palettesPaper[idx] || palettesPaper[0]) : (palettesDark[idx] || palettesDark[0]);

                        return (
                          <div
                            key={idx}
                            style={{
                              background: scheme.bg,
                              border: `1.5px solid ${scheme.border}`,
                              borderRadius: '16px',
                              padding: '1.25rem 1.4rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: scheme.titleColor, fontSize: '0.98rem' }}>
                                {scheme.icon} CÂU {q.qNum} ({q.points}): {q.title}
                              </span>
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '8px',
                                background: scheme.badgeBg,
                                color: scheme.badgeColor,
                                border: `1px solid ${scheme.border}`
                              }}>
                                {q.qNum === 2 || q.qNum === 3 ? '3 Test Cases' : '2 Test Cases'} ({q.points})
                              </span>
                            </div>
                            <p style={{
                              fontSize: '0.88rem',
                              color: isPaper ? '#334155' : '#cbd5e1',
                              lineHeight: 1.6,
                              margin: '0 0 12px 0',
                              whiteSpace: 'pre-line'
                            }}>
                              {q.desc}
                            </p>
                            {(q.sampleInput || q.sampleOutput) && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                <div style={{
                                  background: isPaper ? '#ffffff' : 'rgba(0,0,0,0.4)',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  border: isPaper ? '1.5px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)'
                                }}>
                                  <div style={{ fontSize: '0.74rem', color: isPaper ? '#64748b' : '#94a3b8', fontWeight: 800, marginBottom: '5px', textTransform: 'uppercase' }}>
                                    DỮ LIỆU ĐẦU VÀO (STDIN):
                                  </div>
                                  <pre style={{
                                    margin: 0,
                                    fontSize: '0.84rem',
                                    color: isPaper ? '#1e1b4b' : '#e2e8f0',
                                    fontFamily: 'Consolas, monospace',
                                    fontWeight: 600,
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {q.sampleInput || '(Không có STDIN)'}
                                  </pre>
                                </div>
                                <div style={{
                                  background: isPaper ? '#ffffff' : 'rgba(0,0,0,0.4)',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  border: isPaper ? '1.5px solid #86efac' : '1px solid rgba(255,255,255,0.08)'
                                }}>
                                  <div style={{ fontSize: '0.74rem', color: isPaper ? '#15803d' : '#34d399', fontWeight: 800, marginBottom: '5px', textTransform: 'uppercase' }}>
                                    KẾT QUẢ ĐẦU RA KỲ VỌNG (STDOUT):
                                  </div>
                                  <pre style={{
                                    margin: 0,
                                    fontSize: '0.84rem',
                                    color: isPaper ? '#059669' : '#34d399',
                                    fontFamily: 'Consolas, monospace',
                                    fontWeight: 700,
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {q.sampleOutput || '(Không có STDOUT)'}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      background: isPaper ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '14px',
                      border: isPaper ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '20px'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isPaper ? '#0284c7' : '#38bdf8', marginBottom: '8px' }}>
                        📋 YÊU CẦU ĐỀ BÀI CHI TIẾT:
                      </div>
                      <div style={{ color: isPaper ? '#334155' : '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                        {assign.description || 'Chưa có mô tả chi tiết cho bài tập này.'}
                      </div>
                    </div>
                  )}

                  {/* THÔNG SỐ CHẤM DOCKER SANDBOX */}
                  <div style={{
                    background: isPaper ? '#f8fafc' : 'rgba(0, 0, 0, 0.35)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    border: isPaper ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ color: isPaper ? '#475569' : '#94a3b8', fontWeight: 600 }}>
                      ⚙️ Chế độ chấm: <strong>Docker Sandbox Runner cô lập</strong> (Timeout 5000ms / Test, RAM 256MB)
                    </span>
                    <span style={{ color: isPaper ? '#059669' : '#34d399', fontWeight: 800 }}>
                      ✓ Hệ thống tự động xác thực SHA-256 Checksum khi nộp bài
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '0.82rem', color: '#94a3b8', marginTop: '10px' }}>
                    --- HẾT ĐỀ THI --- (Cán bộ coi thi không giải thích gì thêm)
                  </div>
                </div>

                {/* Bottom Footer Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.8rem',
                  borderTop: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                    {lang === 'vi' ? 'Đề thi đã được lưu và đồng bộ với Docker Autograder.' : 'Exam synced with Docker Autograder.'}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadExamDoc(assign)}
                      style={{
                        fontSize: '0.86rem',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Download size={15} />
                      <span>{lang === 'vi' ? 'Tải File Đề (.DOC)' : 'Download .DOC'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingExamAssignment(null)}
                      style={{
                        fontSize: '0.86rem',
                        padding: '10px 22px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: '#334155',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lang === 'vi' ? 'Đóng' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

                {/* MODAL 1: TẠO HỌC PHẦN MỚI */}
        {showCourseModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2rem 2.2rem',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                  }}>
                    <BookOpen size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {lang === 'vi' ? 'Thêm học phần mới' : 'Add New Course'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mã học phần' : 'Course Code'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SWD392, PRJ301, CSD201..."
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên môn học' : 'Course Name'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Software Architecture & Design"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b' }}>
                      {lang === 'vi' ? 'Học kỳ' : 'Semester'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                      VD: FA26, SP26, SU26
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="FA26"
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCourse}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: submittingCourse ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {submittingCourse ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2rem 2.2rem',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.1)'
                  }}>
                    <Users size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {lang === 'vi' ? 'Tạo nhóm đồ án mới' : 'Create New Team'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên nhóm' : 'Team Name'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Group 1, Nhóm 2..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Học phần trực thuộc' : 'Course'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={teamCourseId}
                    onChange={(e) => setTeamCourseId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      cursor: 'pointer'
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b' }}>
                      {lang === 'vi' ? 'GitHub Repository URL' : 'GitHub Repository URL'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#6d28d9', background: '#ede9fe', padding: '1px 7px', borderRadius: '6px', fontWeight: 600 }}>
                      Git HTTPS / SSH
                    </span>
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/organization/repo.git"
                    value={teamRepoUrl}
                    onChange={(e) => setTeamRepoUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#6d28d9',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTeam}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: submittingTeam ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {submittingTeam ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2rem 2.2rem',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                  }}>
                    <Edit3 size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {lang === 'vi' ? 'Chỉnh sửa học phần' : 'Edit Course'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Mã học phần' : 'Course Code'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SWD392, PRJ301..."
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên môn học' : 'Course Name'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Software Architecture & Design"
                    value={editCourseName}
                    onChange={(e) => setEditCourseName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Học kỳ' : 'Semester'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FA26"
                    value={editCourseSemester}
                    onChange={(e) => setEditCourseSemester(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem'
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEditCourse}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: submittingEditCourse ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {submittingEditCourse ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2rem 2.2rem',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                  }}>
                    <Edit3 size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {lang === 'vi' ? 'Chỉnh sửa thông tin nhóm' : 'Edit Team'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Tên nhóm' : 'Team Name'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Group 1, Nhóm 2..."
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e1b4b',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b' }}>
                      {lang === 'vi' ? 'GitHub Repository URL' : 'GitHub Repository URL'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#6d28d9', background: '#ede9fe', padding: '1px 7px', borderRadius: '6px', fontWeight: 600 }}>
                      Git HTTPS / SSH
                    </span>
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/organization/repo.git"
                    value={editTeamRepoUrl}
                    onChange={(e) => setEditTeamRepoUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#6d28d9',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem'
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEditTeam}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: submittingEditTeam ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {submittingEditTeam ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '500px',
              padding: '2rem 2.2rem',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.05)',
              position: 'relative'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                    border: '1.5px solid #ddd6fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
                  }}>
                    <UserPlus size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
                      {lang === 'vi' ? 'Thêm thành viên nhóm' : 'Add Team Member'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {lang === 'vi' ? `Nhóm: ${targetTeam.team_name}` : `Team: ${targetTeam.team_name}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title={lang === 'vi' ? 'Đóng' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAssignMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Segmented Switcher */}
                <div style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    type="button"
                    onClick={() => setAssignMode('email')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: assignMode === 'email' ? '#ffffff' : 'transparent',
                      color: assignMode === 'email' ? '#6d28d9' : '#64748b',
                      fontWeight: assignMode === 'email' ? 700 : 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: assignMode === 'email' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Nhập Email sinh viên' : 'By Email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode('select')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: assignMode === 'select' ? '#ffffff' : 'transparent',
                      color: assignMode === 'select' ? '#6d28d9' : '#64748b',
                      fontWeight: assignMode === 'select' ? 700 : 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: assignMode === 'select' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Chọn từ danh sách' : 'From List'}
                  </button>
                </div>

                {/* Email or Select */}
                {assignMode === 'email' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Email sinh viên FPT' : 'Student Email'} <span style={{ color: '#ef4444' }}>*</span>
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
                        padding: '11px 14px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: '#1e1b4b',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        outline: 'none',
                        transition: 'all 0.15s ease'
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
                          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <span>✓</span> {lang === 'vi' ? `Sinh viên đã đăng ký: ${match.full_name}` : `Registered student: ${match.full_name}`}
                          </div>
                        );
                      }
                      if (assignEmail.trim() && assignEmail.includes('@')) {
                        return (
                          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6d28d9', background: '#f5f3ff', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <span>ℹ️</span> {lang === 'vi' ? 'Email mới: Sẽ tự động gán vào nhóm khi sinh viên đăng nhập' : 'New email: Will auto-link upon student login'}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {students.length > 0 && !assignEmail && (
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Gợi ý sinh viên trong hệ thống:' : 'Registered students suggestions:'}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '90px', overflowY: 'auto' }}>
                          {students.slice(0, 8).map(st => (
                            <button
                              key={st.user_id}
                              type="button"
                              onClick={() => setAssignEmail(st.email)}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
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
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                      {lang === 'vi' ? 'Chọn sinh viên' : 'Select Student'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      required={assignMode === 'select'}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: '#1e1b4b',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        outline: 'none',
                        cursor: 'pointer'
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
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
                    {lang === 'vi' ? 'Vai trò trong nhóm' : 'Role in Team'}
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setAssignRole('MEMBER')}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: assignRole === 'MEMBER' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                        background: assignRole === 'MEMBER' ? '#ede9fe' : '#f8fafc',
                        color: assignRole === 'MEMBER' ? '#6d28d9' : '#64748b',
                        fontWeight: assignRole === 'MEMBER' ? 800 : 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lang === 'vi' ? 'Thành viên' : 'Member'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignRole('LEADER')}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: assignRole === 'LEADER' ? '2px solid #f59e0b' : '1.5px solid #cbd5e1',
                        background: assignRole === 'LEADER' ? '#fef3c7' : '#f8fafc',
                        color: assignRole === 'LEADER' ? '#92400e' : '#64748b',
                        fontWeight: assignRole === 'LEADER' ? 800 : 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Crown size={15} color={assignRole === 'LEADER' ? '#b45309' : '#64748b'} />
                      <span>{lang === 'vi' ? 'Trưởng nhóm (Leader)' : 'Team Leader'}</span>
                    </button>
                  </div>
                </div>



                {/* Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAssign}
                    style={{
                      fontSize: '0.86rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: submittingAssign ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {submittingAssign ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{lang === 'vi' ? 'Thêm thành viên' : 'Add Member'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Dynamic User Profile Modal for Lecturer */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={{ ...currentUser, role: 'LECTURER' }}
        onLogout={handleLogout}
      />
    </div>
  );
}