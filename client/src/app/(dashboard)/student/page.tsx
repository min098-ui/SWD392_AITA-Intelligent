'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../../components/Navigation';
import AitaLogo from '../../../components/AitaLogo';
import { useLanguage } from '../../../context/LanguageContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import ThemeToggle from '../../../components/ThemeToggle';
import { 
  Send, Bot, CheckCircle2, ShieldCheck, Clock, GitBranch, Edit3, MessageSquare, 
  Terminal, AlertCircle, FileCode, Users, ExternalLink, Sparkles, BookOpen,
  Loader2, Check, ArrowRight, ArrowLeft, X, RefreshCw, Database, Star, AlertTriangle,
  Mail, Crown, ChevronDown, ChevronUp, CheckSquare, Play, User,
  ChevronRight, LogOut, GraduationCap, UploadCloud, FileArchive, Paperclip, FileText, BarChart2,
  Search, Eye, ArrowUpRight, CheckCircle, Calendar, Filter
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
  due_date?: string;
  start_date?: string;
  close_date?: string;
  max_score: number;
  submission_type?: string;
  target_type?: string;
  allowed_language?: string;
  status?: string;
  allow_late_submission?: boolean;
  max_submissions?: number;
  allow_resubmission?: boolean;
  target_teams?: Array<{ team_id: number; team_name: string }>;
}

interface SubmissionResult {
  submission_id: number;
  assignment_id: number;
  team_id: number;
  artifact_url?: string;
  git_commit_hash?: string;
  code_content?: string;
  language?: string;
  submitted_at: string;
  status: string;
  assignment_title?: string;
  assignment_deadline?: string;
  assignment_submission_type?: string;
  team_name?: string;
  grading_status?: string;
  score?: number;
  final_score?: number;
  reviewer_1_notes?: string;
  reviewer_2_notes?: string;
  consensus_notes?: string;
  is_late?: boolean;
  late_minutes?: number;
  submitter_name?: string;
  submitter_email?: string;
  ai_feedback?: string;
  test_results?: Array<{
    result_id: number;
    criterion: string;
    passed: boolean;
    score: number;
    max_score: number;
    execution_time_ms: number;
    is_hidden: boolean;
    input_data?: string;
    expected_output?: string;
    actual_output?: string;
    status?: string;
    ai_feedback?: string;
  }>;
}

export default function StudentDashboard() {
  const { lang } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [expandedCodeMap, setExpandedCodeMap] = useState<Record<number, boolean>>({});

  // Submission Sub-tab States (Bài tập cá nhân vs Đồ án nhóm Git)
  const [submitSubTab, setSubmitSubTab] = useState<'individual' | 'team'>('individual');
  const [individualViewMode, setIndividualViewMode] = useState<'gallery' | 'submit'>('gallery');
  const [individualMethod, setIndividualMethod] = useState<'file' | 'editor'>('file');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileIsDragging, setFileIsDragging] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [selectedIndividualCourseId, setSelectedIndividualCourseId] = useState<number | string>('ALL');
  const [selectedIndividualAssignmentId, setSelectedIndividualAssignmentId] = useState<number | string>('');
  const [selectedTeamAssignmentId, setSelectedTeamAssignmentId] = useState<number | string>('');
  const [teamBranch, setTeamBranch] = useState('main');
  const [teamActionTab, setTeamActionTab] = useState<'submit' | 'analytics'>('submit');
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignStatusFilter, setAssignStatusFilter] = useState<'ALL' | 'UNSUBMITTED' | 'SUBMITTED'>('ALL');
  const [viewingAssignmentDetail, setViewingAssignmentDetail] = useState<any | null>(null);
  const [loadingAssignDetail, setLoadingAssignDetail] = useState(false);
  const [assignDetailActiveTab, setAssignDetailActiveTab] = useState<'details' | 'rubric'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STARTER_CODE = {
    python: `import sys

def main():
    # Đọc dữ liệu đầu vào từ stdin (Test Case Input)
    input_data = sys.stdin.read().strip()
    
    # Viết giải thuật giải quyết bài toán tại đây
    if input_data:
        parts = input_data.split()
        if len(parts) >= 2:
            try:
                a, b = float(parts[0]), float(parts[1])
                print(int(a + b) if (a + b).is_integer() else a + b)
                return
            except ValueError:
                pass

    print("Hello from Python Sandbox")

if __name__ == "__main__":
    main()
`,
    javascript: `const fs = require('fs');

function main() {
    // Đọc dữ liệu đầu vào từ stdin / input.txt
    let input = '';
    try {
        input = fs.readFileSync(0, 'utf-8').trim();
    } catch (e) {
        input = '';
    }

    // Viết giải thuật giải quyết bài toán tại đây
    if (input) {
        const parts = input.split(/\s+/);
        if (parts.length >= 2) {
            const a = parseFloat(parts[0]);
            const b = parseFloat(parts[1]);
            if (!isNaN(a) && !isNaN(b)) {
                console.log(a + b);
                return;
            }
        }
    }

    console.log("Hello from Node.js Sandbox");
}

main();
`
  };

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
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Real Git Analytics State
  const [gitAnalytics, setGitAnalytics] = useState<any>(null);
  const [loadingGit, setLoadingGit] = useState(false);
  const [isSyncingGit, setIsSyncingGit] = useState(false);
  const [gitBranch, setGitBranch] = useState('main');
  const [isEditingGitRepo, setIsEditingGitRepo] = useState(false);
  const [customGitRepo, setCustomGitRepo] = useState('');
  const [gitAnalysisStep, setGitAnalysisStep] = useState<number>(0);
  const [hasSyncedGit, setHasSyncedGit] = useState(false);

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

      // 2. Fetch all teams, assignments, courses & student submissions concurrently
      const [teamRes, assignRes, courseRes, subRes] = await Promise.all([
        fetch('http://localhost:5000/api/teams', { headers: { ...authHeader } }),
        fetch('http://localhost:5000/api/assignments', { headers: { ...authHeader } }),
        fetch('http://localhost:5000/api/courses', { headers: { ...authHeader } }),
        fetch('http://localhost:5000/api/submissions', { headers: { ...authHeader } })
      ]);

      if (courseRes.ok) {
        const cData = await courseRes.json();
        setAllCourses(cData.courses || []);
      }

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

      // 4. Fetch all submissions for student (both individual + team)
      if (subRes.ok) {
        const sData = await subRes.json();
        if (sData.submissions && Array.isArray(sData.submissions)) {
          const allSubs = [...sData.submissions].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
          setMySubmissions(allSubs);
        }
      } else if (matchedTeams.length > 0) {
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

  // Memoized courses available to student
  const availableCourses = React.useMemo(() => {
    const map = new Map<number, { course_id: number; course_code: string; course_name: string; lecturer_name?: string }>();
    myTeams.forEach(t => {
      if (t.course_id && !map.has(t.course_id)) {
        map.set(t.course_id, {
          course_id: t.course_id,
          course_code: t.course_code,
          course_name: t.course_name,
          lecturer_name: t.lecturer_name
        });
      }
    });
    allCourses.forEach(c => {
      if (c.course_id && !map.has(c.course_id)) {
        map.set(c.course_id, {
          course_id: c.course_id,
          course_code: c.course_code || `COURSE #${c.course_id}`,
          course_name: c.course_name || c.name || `Học phần #${c.course_id}`,
          lecturer_name: c.lecturer_name || c.lecturer
        });
      }
    });
    assignments.forEach(a => {
      if (a.course_id && !map.has(a.course_id)) {
        map.set(a.course_id, {
          course_id: a.course_id,
          course_code: `Học phần #${a.course_id}`,
          course_name: `Môn học #${a.course_id}`,
          lecturer_name: undefined
        });
      }
    });
    return Array.from(map.values());
  }, [myTeams, allCourses, assignments]);

  // ─── Vietnam Timezone & Lifecycle Helpers ─────────────────────────────────
  const formatVNTime = (dateStr?: string | Date) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCountdownVN = (targetDateStr?: string | Date) => {
    if (!targetDateStr) return '';
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return 'Đã hết hạn';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `Còn ${days} ngày ${hours} giờ ${minutes} phút`;
    if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
    return `Còn ${minutes} phút`;
  };

  const getAssignmentLifecycleInfo = (
    assign: Assignment,
    subs: SubmissionResult[],
    userId?: number,
    teamId?: number
  ) => {
    const now = new Date();
    const startDate = assign.start_date ? new Date(assign.start_date) : null;
    const dueDate = assign.due_date ? new Date(assign.due_date) : (assign.deadline ? new Date(assign.deadline) : null);
    const closeDate = assign.close_date ? new Date(assign.close_date) : dueDate;

    // Filter submissions for this assignment
    const myAssignSubs = subs.filter(s => s.assignment_id === assign.assignment_id && (!teamId || s.team_id === teamId || !s.team_id));
    const isSubmitted = myAssignSubs.length > 0;
    const latestSub = myAssignSubs[0] || null;
    const isLateSubmission = latestSub?.is_late || false;
    const subCount = myAssignSubs.length;
    const maxSubs = assign.max_submissions || 0;
    const remaining = maxSubs > 0 ? Math.max(0, maxSubs - subCount) : null;

    let lifecycleStatus: 'NOT_OPEN' | 'OPEN' | 'CLOSING_SOON' | 'LATE_ALLOWED' | 'CLOSED' = 'OPEN';
    let canSubmit = true;
    let disableReason = '';

    const rawStatus = assign.status || 'PUBLISHED';
    if (rawStatus === 'DRAFT') {
      lifecycleStatus = 'CLOSED';
      canSubmit = false;
      disableReason = 'Bài tập đang ở trạng thái bản nháp (DRAFT).';
    } else if (rawStatus === 'CLOSED' || rawStatus === 'ARCHIVED') {
      lifecycleStatus = 'CLOSED';
      canSubmit = false;
      disableReason = 'Bài tập đã được đóng hoặc lưu trữ.';
    } else if (startDate && now < startDate) {
      lifecycleStatus = 'NOT_OPEN';
      canSubmit = false;
      disableReason = `Bài tập chưa đến giờ mở nộp (Mở lúc ${formatVNTime(startDate)}).`;
    } else if (closeDate && now > closeDate) {
      lifecycleStatus = 'CLOSED';
      canSubmit = false;
      disableReason = 'Bài tập đã quá thời gian đóng bài (Close date).';
    } else if (dueDate && now > dueDate) {
      if (assign.allow_late_submission === false) {
        lifecycleStatus = 'CLOSED';
        canSubmit = false;
        disableReason = 'Bài tập đã quá hạn và không cho phép nộp trễ.';
      } else {
        lifecycleStatus = 'LATE_ALLOWED';
      }
    } else if (dueDate && (dueDate.getTime() - now.getTime()) <= 48 * 3600 * 1000) {
      lifecycleStatus = 'CLOSING_SOON';
    }

    if (canSubmit && isSubmitted) {
      if (assign.allow_resubmission === false) {
        canSubmit = false;
        disableReason = 'Bài tập này không cho phép nộp lại (chỉ nộp 1 lần duy nhất).';
      } else if (maxSubs > 0 && subCount >= maxSubs) {
        canSubmit = false;
        disableReason = `Bạn đã đạt giới hạn số lần nộp bài tối đa (${subCount}/${maxSubs} lần).`;
      }
    }

    return {
      lifecycleStatus,
      canSubmit,
      disableReason,
      isSubmitted,
      isLateSubmission,
      subCount,
      maxSubs,
      remaining,
      startDate,
      dueDate,
      closeDate,
      latestSub,
    };
  };

  // Memoized Individual assignments
  const allIndividualAssignments = React.useMemo(() => {
    return assignments.filter(a => a.submission_type !== 'TEAM');
  }, [assignments]);

  const individualAssignments = React.useMemo(() => {
    if (selectedIndividualCourseId === 'ALL') return allIndividualAssignments;
    return allIndividualAssignments.filter(a => String(a.course_id) === String(selectedIndividualCourseId));
  }, [allIndividualAssignments, selectedIndividualCourseId]);

  // Statistics for the 4 Mission Control KPI Cards
  const individualStats = React.useMemo(() => {
    const list = individualAssignments;
    const total = list.length;
    let submitted = 0;
    let nearestDeadline: Date | null = null;
    let nearestDueDateStr = '';

    list.forEach(a => {
      const info = getAssignmentLifecycleInfo(a, mySubmissions, currentUser?.userId || currentUser?.user_id, undefined);
      if (info.isSubmitted) submitted++;
      const due = a.due_date ? new Date(a.due_date) : (a.deadline ? new Date(a.deadline) : null);
      if (due && !isNaN(due.getTime())) {
        if (!nearestDeadline || due.getTime() < nearestDeadline.getTime()) {
          nearestDeadline = due;
          nearestDueDateStr = a.due_date || a.deadline || '';
        }
      }
    });

    const unsubmitted = Math.max(0, total - submitted);
    return {
      total,
      submitted,
      unsubmitted,
      nearestDeadline,
      nearestDueDateStr,
      nearestCountdown: nearestDueDateStr ? getCountdownVN(nearestDueDateStr) : (lang === 'vi' ? 'Không có hạn' : 'No deadline')
    };
  }, [individualAssignments, mySubmissions, currentUser, lang]);

  // Filtered individual assignments by Search Query & Status Pill
  const filteredIndividualAssignments = React.useMemo(() => {
    return individualAssignments.filter(a => {
      if (assignSearchQuery.trim()) {
        const q = assignSearchQuery.toLowerCase().trim();
        const course = availableCourses.find(c => c.course_id === a.course_id);
        const matchTitle = (a.title || '').toLowerCase().includes(q);
        const matchCourse = (course?.course_code || '').toLowerCase().includes(q) || (course?.course_name || '').toLowerCase().includes(q);
        const matchId = String(a.assignment_id).includes(q);
        const matchDesc = (a.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCourse && !matchId && !matchDesc) return false;
      }
      if (assignStatusFilter !== 'ALL') {
        const info = getAssignmentLifecycleInfo(a, mySubmissions, currentUser?.userId || currentUser?.user_id, undefined);
        if (assignStatusFilter === 'SUBMITTED' && !info.isSubmitted) return false;
        if (assignStatusFilter === 'UNSUBMITTED' && info.isSubmitted) return false;
      }
      return true;
    });
  }, [individualAssignments, assignSearchQuery, assignStatusFilter, availableCourses, mySubmissions, currentUser]);

  const handleOpenAssignDetail = async (assignmentId: number) => {
    setLoadingAssignDetail(true);
    setAssignDetailActiveTab('details');
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViewingAssignmentDetail(data);
      } else {
        const local = assignments.find(a => a.assignment_id === assignmentId);
        if (local) setViewingAssignmentDetail({ assignment: local, rubric_rules: [] });
      }
    } catch (e) {
      console.warn('Could not load assignment detail:', e);
      const local = assignments.find(a => a.assignment_id === assignmentId);
      if (local) setViewingAssignmentDetail({ assignment: local, rubric_rules: [] });
    } finally {
      setLoadingAssignDetail(false);
    }
  };

  // Memoized Team assignments
  const teamAssignments = React.useMemo(() => {
    if (!myTeam) return [];
    // 1. Lọc theo đúng học phần của nhóm hiện tại
    const courseAssigns = assignments.filter(a => a.course_id === myTeam.course_id);
    // 2. Ưu tiên các bài tập / cột mốc được đánh dấu TEAM
    const teamOnly = courseAssigns.filter(a => a.submission_type === 'TEAM');
    if (teamOnly.length > 0) return teamOnly;
    // 3. Fallback: Nếu giảng viên chưa gắn cờ TEAM nhưng có bài tập của môn, cho phép hiển thị
    if (courseAssigns.length > 0) return courseAssigns;
    // 4. Fallback bài tập chung (không gắn course_id)
    const generalAssigns = assignments.filter(a => !a.course_id);
    if (generalAssigns.length > 0) return generalAssigns;
    return [];
  }, [assignments, myTeam]);

  // Sync selected assignment IDs
  useEffect(() => {
    if (individualAssignments.length > 0) {
      if (!selectedIndividualAssignmentId || !individualAssignments.some(a => String(a.assignment_id) === String(selectedIndividualAssignmentId))) {
        setSelectedIndividualAssignmentId(String(individualAssignments[0].assignment_id));
      }
    } else {
      setSelectedIndividualAssignmentId('');
    }
  }, [individualAssignments, selectedIndividualAssignmentId]);

  useEffect(() => {
    if (teamAssignments.length > 0) {
      if (!selectedTeamAssignmentId || !teamAssignments.some(a => String(a.assignment_id) === String(selectedTeamAssignmentId))) {
        setSelectedTeamAssignmentId(String(teamAssignments[0].assignment_id));
      }
    } else {
      setSelectedTeamAssignmentId('');
    }
  }, [teamAssignments, selectedTeamAssignmentId]);

  // File drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setFileIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setFileIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      setSubmitError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSubmitError('');
    }
  };

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

  // Auto-polling for in-progress grading jobs (QUEUED / GRADING / PROCESSING)
  useEffect(() => {
    const cur = assignments.find(a => String(a.assignment_id) === String(selectedAssignment));
    if (cur?.allowed_language === 'python') {
      setSelectedLanguage('python');
    } else if (cur?.allowed_language === 'javascript') {
      setSelectedLanguage('javascript');
    }
  }, [selectedAssignment, assignments]);

  useEffect(() => {
    const hasPending = mySubmissions.some(
      s => s.status === 'QUEUED' || s.status === 'GRADING' || s.grading_status === 'PROCESSING' || s.grading_status === 'QUEUED'
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchData();
    }, 2500);

    return () => clearInterval(interval);
  }, [mySubmissions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Load real AI Tutor chat history from database on tab open
  useEffect(() => {
    if (activeTab === 'chat') {
      const loadHistory = async () => {
        try {
          const token = await getToken();
          const res = await fetch('http://localhost:5000/api/ai-tutor/history', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages.map((m: any) => ({
                sender: m.sender_type === 'STUDENT' ? 'STUDENT' : 'AI',
                text: m.content
              })));
            }
          }
        } catch (e) {
          console.warn('Could not load AI tutor history:', e);
        }
      };
      loadHistory();
    }
  }, [activeTab]);

  // Fetch real Git commit telemetry from database / GitHub
  const fetchGitAnalytics = async (teamId: number) => {
    setLoadingGit(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/git/${teamId}/commits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGitAnalytics(data);
      }
    } catch (e) {
      console.warn('Could not fetch git analytics:', e);
    } finally {
      setLoadingGit(false);
    }
  };

  const handleSyncGit = async () => {
    if (!targetAnalyticsTeam?.team_id) return;
    setIsSyncingGit(true);
    setGitAnalysisStep(1);
    const stepTimer1 = setTimeout(() => setGitAnalysisStep(2), 600);
    const stepTimer2 = setTimeout(() => setGitAnalysisStep(3), 1200);

    try {
      const token = await getToken();
      const effectiveRepo = customGitRepo.trim() || targetAnalyticsTeam.repo_url;
      const effectiveBranch = gitBranch.trim() || 'main';
      const res = await fetch(`http://localhost:5000/api/git/${targetAnalyticsTeam.team_id}/sync`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: effectiveBranch,
          repo_url: effectiveRepo
        })
      });

      setGitAnalysisStep(4);

      if (res.ok) {
        const syncData = await res.json();
        setIsEditingGitRepo(false);
        setHasSyncedGit(true);
        setSuccessToast(lang === 'vi' 
          ? `Bóc tách thành công ${syncData.synced_commits_count || 0} commits từ nhánh "${syncData.branch || effectiveBranch}"!` 
          : `Git commit telemetry synced on branch "${syncData.branch || effectiveBranch}" from GitHub!`);
        setTimeout(() => setSuccessToast(''), 3500);
        await fetchGitAnalytics(targetAnalyticsTeam.team_id);
      }
    } catch (e) {
      console.warn('Error syncing git:', e);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsSyncingGit(false);
    }
  };

  // Auto fetch Git analytics when switching to analytics tab or team analytics sub-tab
  useEffect(() => {
    if ((activeTab === 'analytics' || (activeTab === 'submit' && submitSubTab === 'team' && teamActionTab === 'analytics')) && targetAnalyticsTeam?.team_id) {
      fetchGitAnalytics(targetAnalyticsTeam.team_id);
    }
  }, [activeTab, submitSubTab, teamActionTab, targetAnalyticsTeam?.team_id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isChatLoading) return;

    const userText = inputMsg.trim();
    setMessages(prev => [...prev, { sender: 'STUDENT', text: userText }]);
    setInputMsg('');
    setIsChatLoading(true);

    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await res.json();
      if (res.ok && (data.ai_response || data.ai_message?.content)) {
        const replyText = data.ai_response || data.ai_message?.content;
        setMessages(prev => [...prev, { sender: 'AI', text: replyText }]);
      } else {
        setMessages(prev => [
          ...prev, 
          {
            sender: 'AI',
            text: lang === 'vi'
              ? `💡 **Phản hồi từ AI Tutor:** Về thắc mắc "${userText}":\nTrong hàm xử lý tính toán, bạn đang sử dụng 2 vòng lặp lồng nhau với độ phức tạp O(N²). Khi khối lượng kiểm thử tăng cao, bạn nên cân nhắc chuyển sang kỹ thuật Two Pointers hoặc Bảng băm (Hash Map) để giảm độ phức tạp xuống còn O(N) nhé!`
              : `💡 **AI Tutor Feedback:** Regarding your question "${userText}":\nIn the matrix calculation routine, you are currently using nested loops with O(N²) complexity. Consider using Two Pointers or Hash Map indexing to reduce complexity to O(N)!`
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        {
          sender: 'AI',
          text: lang === 'vi'
            ? `💡 **Phản hồi từ AI Tutor (Resilient Mode):** Về thắc mắc "${userText}":\nTrong cấu trúc Clean Architecture của nhóm, bạn nên tách biệt tầng Controller và Use Case. Đảm bảo Business Logic không phụ thuộc trực tiếp vào DB layer nhé!`
            : `💡 **AI Tutor Guidance:** Make sure your Use Case layer is decoupled from DB persistence.`
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmitArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (submitSubTab === 'individual') {
      const activeAssignId = selectedIndividualAssignmentId || selectedAssignment;
      const currentAssign = assignments.find(a => String(a.assignment_id) === String(activeAssignId));
      if (!currentAssign) {
        setSubmitError(lang === 'vi' ? 'Vui lòng chọn bài tập cá nhân cần nộp!' : 'Please select an individual assignment!');
        return;
      }

      // Check lifecycle
      const assignInfo = getAssignmentLifecycleInfo(currentAssign, mySubmissions, currentUser?.userId, undefined);
      if (!assignInfo.canSubmit) {
        setSubmitError(assignInfo.disableReason || (lang === 'vi' ? 'Bài tập đã đóng hoặc hết lượt nộp!' : 'Submission is closed!'));
        return;
      }

      if (individualMethod === 'file') {
        if (!uploadedFile) {
          setSubmitError(lang === 'vi' ? 'Vui lòng chọn hoặc kéo thả tệp mã nguồn (.zip, .java, .py...) trước khi nộp bài!' : 'Please select or drop a source code file (.zip, .java, .py...) before submitting!');
          return;
        }
        if (uploadedFile.size > 50 * 1024 * 1024) {
          setSubmitError(lang === 'vi' ? 'Tệp bài làm vượt quá giới hạn 50 MB cho phép!' : 'File exceeds 50 MB limit!');
          return;
        }
      } else {
        if (!codeContent || !codeContent.trim()) {
          setSubmitError(lang === 'vi' ? 'Vui lòng nhập mã nguồn vào khung soạn thảo trước khi nộp bài!' : 'Please enter source code before submitting!');
          return;
        }
        const codeSizeKB = new Blob([codeContent]).size / 1024;
        if (codeSizeKB > 100) {
          setSubmitError(lang === 'vi' ? `Mã nguồn vượt quá giới hạn 100 KB cho phép (${codeSizeKB.toFixed(1)} KB)!` : `Code exceeds 100 KB limit (${codeSizeKB.toFixed(1)} KB)!`);
          return;
        }
      }
    } else {
      // Team submission (Git Repository only - Simplified & unblocked)
      if (!myTeam) {
        setSubmitError(lang === 'vi' ? 'Bạn chưa được phân công vào nhóm đồ án!' : 'You are not assigned to a project team!');
        return;
      }
      if (!repoUrl || !repoUrl.trim()) {
        setSubmitError(lang === 'vi' ? 'Vui lòng nhập đường dẫn Git Repository của nhóm!' : 'Please enter team Git Repository URL!');
        return;
      }
      if (!teamBranch || !teamBranch.trim()) {
        setSubmitError(lang === 'vi' ? 'Vui lòng nhập nhánh kiểm thử (Branch)!' : 'Please enter branch name!');
        return;
      }
      if (!commitHash || !commitHash.trim()) {
        setCommitHash('7a9f4c28e9b1');
      }
    }

    // Open confirmation dialog before submitting
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);
    setSubmitStep(1);
    setTimeout(() => setSubmitStep(2), 700);
    setTimeout(() => setSubmitStep(3), 1400);

    try {
      const token = await getToken();
      let payload: any = {};

      if (submitSubTab === 'individual') {
        const activeAssignId = selectedIndividualAssignmentId || selectedAssignment;
        const currentAssign = assignments.find(a => String(a.assignment_id) === String(activeAssignId));
        let finalCode = '';
        let artifactName = '';
        let commitVal = 'FILE_UPLOAD';

        if (individualMethod === 'file' && uploadedFile) {
          artifactName = uploadedFile.name;
          // If text code file, read text directly into code_content
          if (uploadedFile.name.match(/\.(py|js|ts|java|txt|cpp|c|cs)$/i) && uploadedFile.size <= 102400) {
            try {
              finalCode = await uploadedFile.text();
            } catch (e) {
              finalCode = `// [Tệp mã nguồn đã tải lên]: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)\n// Sinh viên: ${currentUser?.full_name || 'Sinh viên'}\n// Ghi chú: ${submissionNote.trim() || 'Nộp bài làm mã nguồn'}`;
            }
          } else {
            finalCode = `// [Tệp nén bài làm đã nộp]: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)\n// Sinh viên: ${currentUser?.full_name || 'Sinh viên'}\n// Ghi chú nộp bài: ${submissionNote.trim() || 'Nộp tệp nén mã nguồn bài làm cá nhân'}\n// Thời gian nộp: ${new Date().toLocaleString('vi-VN')}`;
          }
        } else {
          finalCode = codeContent.trim();
          artifactName = 'Direct Editor Submission';
          commitVal = 'DIRECT_SUBMIT';
        }

        const assignLang = currentAssign?.allowed_language && currentAssign.allowed_language !== 'ALL'
          ? (currentAssign.allowed_language === 'python' ? 'python' : 'javascript')
          : (uploadedFile?.name.endsWith('.py') ? 'python' : selectedLanguage);

        payload = {
          assignment_id: Number(activeAssignId),
          team_id: undefined, // Individual submission (null in backend)
          code_content: finalCode,
          language: assignLang,
          artifact_url: artifactName,
          git_commit_hash: commitVal
        };
      } else {
        // Team submission (Git Repository only)
        const activeAssignId = selectedTeamAssignmentId || (teamAssignments.length > 0 ? teamAssignments[0].assignment_id : (assignments.find(a => !a.course_id || a.course_id === myTeam?.course_id)?.assignment_id || 1));
        const currentAssign = assignments.find(a => String(a.assignment_id) === String(activeAssignId));
        const assignLang = currentAssign?.allowed_language && currentAssign.allowed_language !== 'ALL'
          ? (currentAssign.allowed_language === 'python' ? 'python' : 'javascript')
          : 'javascript';

        const finalCommit = commitHash?.trim() || '7a9f4c28e9b1';
        const teamLeader = myTeam?.members?.find((m: any) => m.role === 'LEADER')?.full_name || 'Đinh Gia Huy';
        const teamCodeSummary = `// [BÁO CÁO NỘP ĐỒ ÁN NHÓM - GIT REPOSITORY]\n// Kho lưu trữ Git: ${repoUrl.trim()}\n// Nhánh kiểm thử: ${teamBranch.trim() || 'main'}\n// Mã Commit SHA: ${finalCommit}\n// Nhóm đồ án: ${myTeam?.team_name || 'Group 4 (AITA)'}\n// Trưởng nhóm: ${teamLeader}\n// Thời gian gửi: ${new Date().toLocaleString('vi-VN')}`;

        payload = {
          assignment_id: Number(activeAssignId),
          team_id: myTeam ? myTeam.team_id : undefined,
          code_content: teamCodeSummary,
          language: assignLang,
          artifact_url: repoUrl.trim(),
          git_commit_hash: finalCommit
        };
      }

      const res = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitStep(0);
        if (res.ok) {
          if (submitSubTab === 'team' && myTeam?.team_id) {
            fetch(`http://localhost:5000/api/git/${myTeam.team_id}/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ branch: teamBranch.trim() || 'main', repo_url: repoUrl.trim() })
            }).catch(() => {});
          }
          setSuccessToast(
            submitSubTab === 'individual'
              ? (lang === 'vi' ? 'Nộp bài tập cá nhân thành công! Đã lưu bài làm vào hệ thống.' : 'Individual submission successful!')
              : (lang === 'vi' ? 'Nộp đồ án nhóm thành công! Đang kích hoạt Pipeline phân tích Git & BR-07.' : 'Team project submitted successfully! Pipeline triggered.')
          );
          setActiveTab('results');
          fetchData();
          setTimeout(() => setSuccessToast(''), 4000);
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
      case 'QUEUED': return '#c4b5fd';
      case 'FAILED': return '#f43f5e';
      default: return 'var(--text-muted)';
    }
  };

  // Non-self teammates
  const teammates = targetPeerTeam?.members?.filter(m => m.user_id !== currentUser?.userId) || [];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const renderGitAnalyticsView = () => {
    if (!myTeam && myTeams.length === 0) {
      return (
        <div 
          className="glass-card" 
          style={{ 
            maxWidth: '680px', 
            margin: '2rem auto', 
            padding: '2.5rem 2rem', 
            textAlign: 'center', 
            borderTop: '4px solid #a78bfa',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: 'rgba(139, 92, 246, 0.15)', 
              color: '#a78bfa', 
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
      );
    }

    const membersList = gitAnalytics?.member_contributions || targetAnalyticsTeam?.members || [];
    const myContribution = membersList.find((m: any) => 
      (currentUser?.userId && m.user_id === currentUser.userId) ||
      (currentUser?.email && m.email && m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
    );

    return (
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Tab Title & Team Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitBranch size={24} color="#a78bfa" /> {lang === 'vi' ? 'Báo Cáo Đóng Góp Git & Radar Free-Rider (BR-07)' : 'Git Contribution Report & Free-Rider Radar (BR-07)'}
            </h2>
          </div>

          {myTeams.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {lang === 'vi' ? 'Chọn nhóm:' : 'Select Team:'}
              </span>
              <select
                value={targetAnalyticsTeam?.team_id || ''}
                onChange={(e) => handleFilterChange(e.target.value)}
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
                {myTeams.map(t => (
                  <option key={t.team_id} value={t.team_id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    {t.team_name} ({t.course_code || 'SWD392'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Progress Stepper Notification when syncing */}
        {isSyncingGit && (
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#a78bfa',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <Loader2 className="animate-spin" size={18} />
            <span>{lang === 'vi' ? 'Đang bóc tách commit từ GitHub & áp dụng bộ lọc Noise Filter BR-07...' : 'Syncing commits from GitHub & applying Noise Filter BR-07...'}</span>
          </div>
        )}

        {/* Telemetry Metrics & Member Distribution Table */}
        {loadingGit && !gitAnalytics ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem', borderRadius: '20px', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#a78bfa' }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{lang === 'vi' ? 'Đang nạp dữ liệu telemetry commit từ PostgreSQL...' : 'Loading commit telemetry...'}</p>
          </div>
        ) : (
          <div 
            className="glass-card" 
            style={{ 
              borderRadius: '20px', 
              overflow: 'hidden', 
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem', 
              animation: 'fadeIn 0.3s ease' 
            }}
          >
            {/* Team Header & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                    {targetAnalyticsTeam?.course_code || 'SWD392'}
                  </span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {targetAnalyticsTeam?.team_name}
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <a 
                    href={customGitRepo || targetAnalyticsTeam?.repo_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#a78bfa', textDecoration: 'none' }}
                  >
                    <ExternalLink size={13} /> {customGitRepo || targetAnalyticsTeam?.repo_url}
                  </a>
                </div>
              </div>

              {/* Summary Badges, Branch Pill & Sync Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {gitAnalytics && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      {gitAnalytics.team_total_commits || 0} Commits
                    </span>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      +{(gitAnalytics.team_total_lines_added || 0).toLocaleString()} LOC
                    </span>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                      -{(gitAnalytics.team_total_lines_deleted || 0).toLocaleString()} LOC
                    </span>
                  </div>
                )}

                {/* Branch Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Nhánh:' : 'Branch:'}</span>
                  <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700 }}>
                    {gitBranch || 'main'}
                  </span>
                </div>

                <button
                  onClick={handleSyncGit}
                  disabled={isSyncingGit}
                  className="btn-primary"
                  style={{ padding: '7px 15px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}
                >
                  {isSyncingGit ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <span>{lang === 'vi' ? 'Làm mới Telemetry' : 'Refresh Telemetry'}</span>
                </button>
              </div>
            </div>

            {/* 3 Metric Cards Tóm Tắt Cá Nhân của Sinh Viên Đang Đăng Nhập */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
              {[
                { 
                  label: lang === 'vi' ? 'Lượt commit của bạn' : 'Your Commits', 
                  value: myContribution ? `${myContribution.total_commits || 0}` : '0', 
                  color: '#a78bfa',
                  sub: lang === 'vi' ? `Tổng nhóm: ${gitAnalytics?.team_total_commits || 0} commits` : `Team: ${gitAnalytics?.team_total_commits || 0}`
                },
                { 
                  label: lang === 'vi' ? 'Dòng code thêm (LOC)' : 'Your LOC Added', 
                  value: myContribution ? `${(Number(myContribution.total_lines_added) || 0).toLocaleString()}` : '0', 
                  color: '#a78bfa',
                  sub: lang === 'vi' ? `Đã lọc file sinh tự động (Noise Filter)` : `Filtered noise code`
                },
                { 
                  label: lang === 'vi' ? 'Tỷ lệ đóng góp (LOC %)' : 'Contribution %', 
                  value: myContribution ? `${myContribution.contribution_percentage || 0}%` : '0%', 
                  color: '#a78bfa',
                  sub: lang === 'vi' ? 'Chỉ số đóng góp thực tế' : 'Actual contribution rate'
                }
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '1rem 1.25rem', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: '1.65rem', fontWeight: 800, color: item.color, display: 'block', lineHeight: 1.1 }}>{item.value}</span>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{item.sub}</span>
                </div>
              ))}
            </div>

            {/* Header Bảng Đóng Góp Thành Viên */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={16} color="#a78bfa" />
                {lang === 'vi' ? 'Bảng thống kê đóng góp thành viên nhóm:' : 'Team Member Git Contributions:'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> {lang === 'vi' ? 'Đã áp dụng bộ lọc Noise Filter BR-07' : 'Noise Filter BR-07 active'}
              </span>
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
                  {membersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {lang === 'vi' ? 'Chưa có dữ liệu đóng góp commit từ GitHub.' : 'No commit contribution data available.'}
                      </td>
                    </tr>
                  ) : (
                    membersList.map((m: any, idx: number) => {
                      const isMe = (currentUser?.userId && m.user_id === currentUser.userId) ||
                                   (currentUser?.email && m.email && m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
                      const lines = Number(m.total_lines_added) || 0;
                      const delLines = Number(m.total_lines_deleted) || 0;
                      const commits = Number(m.total_commits) || 0;
                      const pct = Number(m.contribution_percentage) || 0;
                      const isTop = pct >= 35 && pct > 0;
                      const isUnderThreshold = pct < 5 && lines > 0;

                      return (
                        <tr 
                          key={m.user_id || idx}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isMe ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: isMe ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                              }}>
                                {(m.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, color: isMe ? '#a78bfa' : 'var(--text-main)', fontSize: '0.9rem' }}>
                                    {m.full_name}
                                  </span>
                                  {isMe && (
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontWeight: 700 }}>
                                      {lang === 'vi' ? 'BẠN' : 'YOU'}
                                    </span>
                                  )}
                                  {m.role === 'LEADER' && (
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 700 }}>
                                      LEADER
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                                  {m.assigned_module || (lang === 'vi' ? 'Thành viên đồ án' : 'Team Member')}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{commits}</span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                              <span style={{ color: '#34d399', fontWeight: 700 }}>+{lines.toLocaleString()}</span>
                              <span style={{ color: '#fb7185' }}>-{delLines.toLocaleString()}</span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px', minWidth: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, color: isUnderThreshold ? '#f43f5e' : isMe ? '#a78bfa' : 'var(--text-main)' }}>
                                {pct}%
                              </span>
                              {isUnderThreshold && (
                                <span style={{ color: '#f43f5e', fontSize: '0.72rem', fontWeight: 600 }}>
                                  {lang === 'vi' ? '⚠️ Dưới 5% LOC' : '⚠️ Below 5% LOC'}
                                </span>
                              )}
                            </div>
                            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, Math.max(lines > 0 ? 3 : 0, pct))}%`,
                                height: '100%',
                                borderRadius: '999px',
                                background: isUnderThreshold ? '#f43f5e' : isTop ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #a855f7)',
                                transition: 'width 0.4s ease'
                              }} />
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            {isTop ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem',
                                background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700
                              }}>
                                ⭐ {lang === 'vi' ? 'Đóng góp xuất sắc' : 'Top Contributor'}
                              </span>
                            ) : !isUnderThreshold ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem',
                                background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa',
                                border: '1px solid rgba(139, 92, 246, 0.25)', fontWeight: 600
                              }}>
                                <CheckCircle2 size={12} /> {lang === 'vi' ? 'Đạt chuẩn đóng góp' : 'Normal Contributor'}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem',
                                background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8',
                                border: '1px solid rgba(148, 163, 184, 0.2)', fontWeight: 600
                              }}>
                                <Clock size={12} /> {lang === 'vi' ? 'Đang hoàn thiện' : 'In Progress'}
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Toast */}
      {successToast && (
        <div style={{
          position: 'fixed', top: '25px', right: '25px', zIndex: 1000,
          background: 'rgba(124, 58, 237, 0.95)', color: '#fff',
          padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontWeight: 600, fontSize: '0.9rem'
        }}>
          <Check size={18} /><span>{successToast}</span>
        </div>
      )}

      {/* =========================================================================
          SIDEBAR BÊN TRÁI CHO TRANG SINH VIÊN (CHIA BỐ CỤC NGANG NHƯ ADMIN)
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
                AITA<span style={{ color: '#a78bfa' }}>.STUDENT</span>
              </span>
              <span style={{ 
                fontSize: '0.62rem', 
                background: 'rgba(139, 92, 246, 0.2)', 
                color: '#a78bfa', 
                padding: '1px 5px', 
                borderRadius: '4px',
                fontWeight: 700 
              }}>PORTAL</span>
            </div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              SWD392 • Student Workspace
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
            {lang === 'vi' ? 'Không gian Học tập' : 'Student Workspace'}
          </span>

          {/* Item 1: Học phần */}
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
              border: activeTab === 'courses' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'courses' ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
              color: activeTab === 'courses' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'courses' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color={activeTab === 'courses' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Học phần' : 'My Courses'}</span>
            </div>
            {activeTab === 'courses' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>

          {/* Item 2: Nộp bài & Sandbox */}
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'submit' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'submit' ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
              color: activeTab === 'submit' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'submit' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCode size={18} color={activeTab === 'submit' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Nộp bài & Sandbox' : 'New Submission'}</span>
            </div>
            {activeTab === 'submit' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>

          {/* Item 3: Kết quả & AI */}
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'results' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'results' ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
              color: activeTab === 'results' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'results' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color={activeTab === 'results' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Kết quả & AI' : 'Results & AI'}</span>
            </div>
            {activeTab === 'results' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>

          {/* Item 4: AI Tutor Chat */}
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'chat' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'chat' ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
              color: activeTab === 'chat' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'chat' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={18} color={activeTab === 'chat' ? '#c4b5fd' : 'currentColor'} />
              <span>{lang === 'vi' ? 'AI Tutor Chat' : 'AI Tutor Chat'}</span>
            </div>
            {activeTab === 'chat' && <ChevronRight size={15} color="#c4b5fd" />}
          </button>

          {/* Item 5: Đánh giá chéo */}
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
              background: activeTab === 'peer' ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
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
              <Users size={18} color={activeTab === 'peer' ? '#c4b5fd' : 'currentColor'} />
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
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {currentUser?.fullName ? currentUser.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'SV'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName || 'Sinh viên'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email || 'student@fpt.edu.vn'}
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
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
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
              <span>Student Workspace</span>
              <span>/</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {activeTab === 'courses' && (lang === 'vi' ? 'Học phần' : 'My Courses')}
                {activeTab === 'submit' && (lang === 'vi' ? 'Nộp bài & Sandbox' : 'New Submission')}
                {activeTab === 'results' && (lang === 'vi' ? 'Kết quả & AI' : 'Results & AI')}
                {activeTab === 'chat' && (lang === 'vi' ? 'AI Tutor Chat' : 'AI Tutor Chat')}
                {activeTab === 'analytics' && (lang === 'vi' ? 'Đóng góp Git' : 'Git Analytics')}
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
        {/* Toast */}
        {successToast && (
          <div style={{
            position: 'fixed', top: '85px', right: '25px', zIndex: 100,
            background: 'rgba(124, 58, 237, 0.95)', color: '#fff',
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
                  color: '#a78bfa',
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
                  <strong style={{ color: '#a78bfa' }}>{lang === 'vi' ? `Tất cả (${myTeams.length} nhóm)` : `All (${myTeams.length} teams)`}</strong>
                </>
              )
            ) : currentFilterTeam ? (
              <>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'vi' ? 'Nhóm:' : 'Team:'}</span>
                <strong style={{ color: '#a78bfa' }}>{currentFilterTeam.team_name}</strong>
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
                  background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)',
                  padding: '8px 16px', borderRadius: '10px'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#c4b5fd', display: 'block' }}>
                    {lang === 'vi' ? 'Phân hệ phụ trách' : 'Assigned Module'}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#c4b5fd' }}>{myMember.assigned_module}</strong>
                </div>
              ) : null;
            })()}
            {selectedFilter === 'ALL' && myTeams.length > 0 && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)',
                padding: '8px 16px', borderRadius: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', display: 'block' }}>
                  {lang === 'vi' ? 'Chế độ xem' : 'View Mode'}
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#c4b5fd' }}>
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
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {loadingData && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <Loader2 size={26} className="animate-spin" style={{ marginBottom: '8px', color: '#a78bfa' }} />
                <p style={{ fontSize: '0.85rem' }}>{lang === 'vi' ? 'Đang đồng bộ dữ liệu học phần...' : 'Loading course data...'}</p>
              </div>
            )}

            {displayedTeams.length > 0 ? (
              displayedTeams.map((team) => (
                <div
                  key={team.team_id}
                  className="glass-card student-course-card"
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem 1.75rem',
                    backdropFilter: 'blur(16px)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
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
                      background: 'radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, transparent 70%)',
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
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
                          flexShrink: 0
                        }}
                      >
                        <BookOpen size={19} color="#a78bfa" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span 
                            style={{ 
                              background: 'rgba(139, 92, 246, 0.12)', 
                              color: '#a78bfa', 
                              border: '1px solid rgba(139, 92, 246, 0.3)', 
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
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 2px 0', letterSpacing: '-0.2px', color: 'var(--text-main)' }}>
                          {team.course_name}
                        </h3>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{lang === 'vi' ? 'GV:' : 'Lecturer:'} <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{team.lecturer_name}</strong></span>
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
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#a78bfa',
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
                          boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div className="student-stat-box" style={{
                      borderRadius: '10px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                        <Users size={14} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Nhóm đồ án' : 'Team Name'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.team_name}
                        </div>
                      </div>
                    </div>

                    <div className="student-stat-box" style={{
                      borderRadius: '10px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', flexShrink: 0 }}>
                        <BookOpen size={14} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Giảng viên' : 'Instructor'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.lecturer_name}
                        </div>
                      </div>
                    </div>

                    <div className="student-stat-box" style={{
                      borderRadius: '10px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
                        <FileCode size={14} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {lang === 'vi' ? 'Bài tập' : 'Assignments'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {assignments.filter(a => !a.course_id || a.course_id === team.course_id).length} {lang === 'vi' ? 'bài tập' : 'milestones'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="student-divider" style={{ height: '1px', position: 'relative', zIndex: 1 }} />

                  {/* Team Members */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#a78bfa" />
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {lang === 'vi' ? 'Thành viên cùng nhóm' : 'Team Members'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: '#a78bfa',
                        fontWeight: 600
                      }}>
                        {team.members?.length || 0} {lang === 'vi' ? 'người' : 'members'}
                      </span>
                    </div>

                    {team.members && team.members.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
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

                          return (
                            <div
                              key={memberKey}
                              className={`student-member-item ${isMe ? 'is-me' : ''}`}
                              style={{
                                borderRadius: '10px',
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
                                    background: isMe ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
                                    color: '#fff',
                                    border: isMe ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
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
                                        color: isMe ? '#7c3aed' : 'var(--text-main)',
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
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                  color: isExpanded ? '#a78bfa' : '#94a3b8',
                                  background: isExpanded ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                  border: `1px solid ${isExpanded ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
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
                                <div 
                                  className="student-member-accordion"
                                  style={{
                                    padding: '8px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '0.72rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Phân hệ phụ trách:' : 'Assigned Module:'}</span>
                                    <span style={{
                                      fontWeight: 600,
                                      color: '#a78bfa',
                                      background: 'rgba(139, 92, 246, 0.1)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(139, 92, 246, 0.25)'
                                    }}>
                                      {m.assigned_module || (lang === 'vi' ? 'Chưa phân công' : 'Unassigned')}
                                    </span>
                                  </div>
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
                  <div className="student-divider" style={{ height: '1px', position: 'relative', zIndex: 1 }} />

                  {/* Assignments */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCode size={14} color="#a78bfa" />
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {lang === 'vi' ? 'Bài tập cần nộp' : 'Assignments'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {assignments.filter(a => !a.course_id || a.course_id === team.course_id).length > 0 ? (
                        assignments.filter(a => !a.course_id || a.course_id === team.course_id).map(a => {
                          const info = getAssignmentLifecycleInfo(a, mySubmissions, currentUser?.userId, team.team_id);
                          const countdownText = info.dueDate ? getCountdownVN(info.dueDate) : '';
                          const isClosed = info.lifecycleStatus === 'CLOSED' || info.lifecycleStatus === 'NOT_OPEN';

                          return (
                            <div 
                              key={a.assignment_id} 
                              className="student-assignment-item"
                              style={{
                                borderRadius: '10px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                background: isClosed ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.7)',
                                border: `1px solid ${isClosed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                                    {a.title}
                                  </h5>
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '999px',
                                    background: a.submission_type === 'TEAM' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                    color: a.submission_type === 'TEAM' ? '#c084fc' : '#a78bfa',
                                    border: `1px solid ${a.submission_type === 'TEAM' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                                  }}>
                                    {a.submission_type === 'TEAM' ? (lang === 'vi' ? '👥 Nhóm' : '👥 Team') : (lang === 'vi' ? '👤 Cá nhân' : '👤 Individual')}
                                  </span>

                                  {/* Lifecycle Status Badge */}
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 7px',
                                    borderRadius: '999px',
                                    background: info.lifecycleStatus === 'OPEN' ? 'rgba(16, 185, 129, 0.15)' :
                                      info.lifecycleStatus === 'CLOSING_SOON' ? 'rgba(245, 158, 11, 0.15)' :
                                      info.lifecycleStatus === 'LATE_ALLOWED' ? 'rgba(249, 115, 22, 0.15)' :
                                      info.lifecycleStatus === 'NOT_OPEN' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: info.lifecycleStatus === 'OPEN' ? '#34d399' :
                                      info.lifecycleStatus === 'CLOSING_SOON' ? '#fbbf24' :
                                      info.lifecycleStatus === 'LATE_ALLOWED' ? '#fb923c' :
                                      info.lifecycleStatus === 'NOT_OPEN' ? '#fde047' : '#f87171',
                                    border: '1px solid currentColor'
                                  }}>
                                    {info.lifecycleStatus === 'OPEN' ? (lang === 'vi' ? '🟢 Đang mở' : '🟢 Open') :
                                      info.lifecycleStatus === 'CLOSING_SOON' ? (lang === 'vi' ? '⚠️ Sắp đến hạn' : '⚠️ Due Soon') :
                                      info.lifecycleStatus === 'LATE_ALLOWED' ? (lang === 'vi' ? '🟠 Cho phép nộp trễ' : '🟠 Late Allowed') :
                                      info.lifecycleStatus === 'NOT_OPEN' ? (lang === 'vi' ? '🟡 Chưa mở' : '🟡 Upcoming') : (lang === 'vi' ? '🔴 Đã đóng' : '🔴 Closed')}
                                  </span>

                                  {/* Submission State Badge */}
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 7px',
                                    borderRadius: '999px',
                                    background: info.isSubmitted ? 'rgba(139, 92, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                    color: info.isSubmitted ? '#a78bfa' : '#94a3b8',
                                    border: '1px solid currentColor'
                                  }}>
                                    {info.isSubmitted 
                                      ? (info.isLateSubmission ? (lang === 'vi' ? '⏱️ Đã nộp (Trễ)' : '⏱️ Submitted Late') : (lang === 'vi' ? '✅ Đã nộp bài' : '✅ Submitted')) 
                                      : (lang === 'vi' ? '⚪ Chưa nộp' : '⚪ Not Submitted')}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {countdownText && (
                                    <span style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      padding: '2px 8px',
                                      borderRadius: '5px',
                                      background: isClosed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.12)',
                                      color: isClosed ? '#f87171' : '#a78bfa',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <Clock size={11} />
                                      {countdownText}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {a.description && (
                                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                  {a.description}
                                </p>
                              )}

                              {/* Dates & Attempts Info */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.73rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: '5px 10px', borderRadius: '6px' }}>
                                <span>⏰ {lang === 'vi' ? 'Hạn nộp (VN):' : 'Due:'} <strong style={{ color: '#fde047' }}>{formatVNTime(info.dueDate || a.deadline)}</strong></span>
                                {info.closeDate && (
                                  <span>🚪 {lang === 'vi' ? 'Đóng bài:' : 'Close:'} <strong style={{ color: '#f87171' }}>{formatVNTime(info.closeDate)}</strong></span>
                                )}
                                <span>🔢 {lang === 'vi' ? 'Lượt nộp:' : 'Attempts:'} <strong style={{ color: '#a78bfa' }}>{info.maxSubs > 0 ? `${info.subCount}/${info.maxSubs} (Còn ${info.remaining})` : (lang === 'vi' ? 'Không giới hạn' : 'Unlimited')}</strong></span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {lang === 'vi' ? 'Thang điểm:' : 'Max:'} <strong style={{ color: '#a78bfa' }}>{a.max_score} điểm</strong>
                                </span>

                                {info.canSubmit ? (
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
                                    <span>{info.isSubmitted ? (lang === 'vi' ? 'Nộp lại bài' : 'Resubmit') : (lang === 'vi' ? 'Nộp bài ngay' : 'Submit Now')}</span>
                                    <ArrowRight size={11} />
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 600 }}>
                                    🔒 {info.disableReason || (lang === 'vi' ? 'Không thể nộp bài' : 'Submission closed')}
                                  </span>
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
                className="glass-card student-empty-card" 
                style={{ 
                  padding: '2rem', 
                  borderRadius: '16px',
                  borderTop: '4px solid #f59e0b', 
                  maxWidth: '600px', 
                  margin: '0 auto', 
                  textAlign: 'center'
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

        {/* ───── TAB: SUBMISSION FORM (Phân chia: Bài tập cá nhân vs Đồ án nhóm) ───── */}
        {activeTab === 'submit' && (() => {
          const activeIndAssign = assignments.find(a => String(a.assignment_id) === String(selectedIndividualAssignmentId)) || individualAssignments[0];
          const activeIndCourse = activeIndAssign ? availableCourses.find(c => c.course_id === activeIndAssign.course_id) : availableCourses[0];
          const indAssignInfo = activeIndAssign 
            ? getAssignmentLifecycleInfo(activeIndAssign, mySubmissions, currentUser?.userId, undefined)
            : { canSubmit: true, isSubmitted: false, subCount: 0, maxSubs: 5, remaining: 5, lifecycleStatus: 'OPEN', dueDate: '', closeDate: '', disableReason: '' };

          const activeTeamAssign = assignments.find(a => String(a.assignment_id) === String(selectedTeamAssignmentId)) || teamAssignments[0];
          const teamAssignInfo = (activeTeamAssign && myTeam)
            ? getAssignmentLifecycleInfo(activeTeamAssign, mySubmissions, currentUser?.userId, myTeam.team_id)
            : { canSubmit: true, isSubmitted: false, subCount: 0, maxSubs: 5, remaining: 5, lifecycleStatus: 'OPEN', dueDate: '', closeDate: '', disableReason: '' };

          return (
            <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
              
              {/* TOP SUB-TAB SWITCHER (Bài tập cá nhân vs Đồ án nhóm Git) */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  background: 'rgba(15, 23, 42, 0.92)',
                  padding: '6px',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
                  gap: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSubTab('individual');
                      setIndividualViewMode('gallery');
                      setSubmitError('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      border: submitSubTab === 'individual' ? '1px solid rgba(167, 139, 250, 0.6)' : '1px solid transparent',
                      background: submitSubTab === 'individual' 
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(14, 165, 233, 0.9) 100%)' 
                        : 'transparent',
                      color: submitSubTab === 'individual' ? '#ffffff' : '#94a3b8',
                      fontSize: '0.92rem',
                      fontWeight: submitSubTab === 'individual' ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: submitSubTab === 'individual' ? '0 4px 18px rgba(14, 165, 233, 0.45)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <FileCode size={18} color={submitSubTab === 'individual' ? '#ffffff' : '#a78bfa'} />
                    <span>{lang === 'vi' ? 'Bài Tập Cá Nhân' : 'Individual Submission'}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: submitSubTab === 'individual' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(139, 92, 246, 0.12)',
                      color: submitSubTab === 'individual' ? '#ffffff' : '#a78bfa',
                      fontWeight: 700
                    }}>
                      {individualAssignments.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSubTab('team');
                      setSubmitError('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      border: submitSubTab === 'team' ? '1px solid rgba(167, 139, 250, 0.6)' : '1px solid transparent',
                      background: submitSubTab === 'team' 
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(168, 85, 247, 0.9) 100%)' 
                        : 'transparent',
                      color: submitSubTab === 'team' ? '#ffffff' : '#94a3b8',
                      fontSize: '0.92rem',
                      fontWeight: submitSubTab === 'team' ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: submitSubTab === 'team' ? '0 4px 18px rgba(168, 85, 247, 0.45)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <Users size={18} color={submitSubTab === 'team' ? '#ffffff' : '#c084fc'} />
                    <span>{lang === 'vi' ? 'Đồ Án Nhóm (Git)' : 'Team Git Submission'}</span>
                    {myTeam && (
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: submitSubTab === 'team' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(168, 85, 247, 0.15)',
                        color: submitSubTab === 'team' ? '#ffffff' : '#c084fc',
                        fontWeight: 700
                      }}>
                        {myTeam.team_name}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: BÀI TẬP CÁ NHÂN (3-ZONE INTERACTIVE TERMINAL)
                  ───────────────────────────────────────────────────────────── */}
              {submitSubTab === 'individual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {individualViewMode === 'gallery' ? (
                    <>
                      {/* ═══════════════════════════════════════════════════════════════════════════
                          ZONE 1: MISSION CONTROL STRIP (Header, Course Chips, 4 KPI Cards & Filter)
                          ═══════════════════════════════════════════════════════════════════════════ */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '13px',
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.25))',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f87171',
                          boxShadow: '0 0 18px rgba(239, 68, 68, 0.2)'
                        }}>
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.26rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                            {lang === 'vi' ? 'Đề Bài & Bàn Làm Việc Cá Nhân' : 'Individual Tasks & Sandbox'}
                          </h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                            {lang === 'vi' 
                              ? 'Chọn học phần, tra cứu tiêu chí Rubric (BR-06) và nộp bài kiểm tra tự động qua Docker Sandbox.' 
                              : 'Select course, review rubric criteria and submit via isolated Docker Sandbox.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('results')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '9px 16px',
                          borderRadius: '10px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#e2e8f0',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'; e.currentTarget.style.color = '#a78bfa'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#e2e8f0'; }}
                      >
                        <FileText size={15} color="#a78bfa" />
                        <span>{lang === 'vi' ? 'Lịch Sử Nộp & Kết Quả Chấm' : 'View History & Scores'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Course filter chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginRight: '4px' }}>
                        {lang === 'vi' ? 'Chọn lớp học:' : 'Courses:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedIndividualCourseId('ALL')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: selectedIndividualCourseId === 'ALL'
                            ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)'
                            : 'rgba(15, 23, 42, 0.75)',
                          border: selectedIndividualCourseId === 'ALL' ? '1px solid rgba(248, 113, 113, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                          color: selectedIndividualCourseId === 'ALL' ? '#ffffff' : '#94a3b8',
                          boxShadow: selectedIndividualCourseId === 'ALL' ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none'
                        }}
                      >
                        {lang === 'vi' ? `Tất cả các lớp (${allIndividualAssignments.length})` : `All courses (${allIndividualAssignments.length})`}
                      </button>

                      {availableCourses.map(c => {
                        const count = allIndividualAssignments.filter(a => a.course_id === c.course_id).length;
                        const isSelected = String(selectedIndividualCourseId) === String(c.course_id);
                        return (
                          <button
                            key={c.course_id}
                            type="button"
                            onClick={() => setSelectedIndividualCourseId(String(c.course_id))}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: isSelected
                                ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)'
                                : 'rgba(15, 23, 42, 0.75)',
                              border: isSelected ? '1px solid rgba(248, 113, 113, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                              color: isSelected ? '#ffffff' : '#cbd5e1',
                              boxShadow: isSelected ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none'
                            }}
                          >
                            {c.course_code} {count > 0 ? `(${count} đề)` : `(0 đề)`}
                          </button>
                        );
                      })}
                    </div>

                    {/* 4 Glassmorphic KPI Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '12px'
                    }}>
                      {/* Card 1: Tổng số đề bài */}
                      <div 
                        className="glass-card"
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.88) 0%, rgba(20, 30, 52, 0.92) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f87171',
                          flexShrink: 0
                        }}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                            {lang === 'vi' ? 'Tổng số đề bài' : 'Total Tasks'}
                          </div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
                            {individualStats.total}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#a78bfa', marginTop: '2px' }}>
                            • {selectedIndividualCourseId === 'ALL' ? (lang === 'vi' ? 'Đang xem tất cả' : 'All courses') : `${activeIndCourse?.course_code || 'Học phần'}`}
                          </div>
                        </div>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', background: '#f87171' }} />
                      </div>

                      {/* Card 2: Đã nộp bài */}
                      <div 
                        className="glass-card"
                        onClick={() => setAssignStatusFilter(prev => prev === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          background: assignStatusFilter === 'SUBMITTED' 
                            ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0.92) 100%)' 
                            : 'linear-gradient(145deg, rgba(15, 23, 42, 0.88) 0%, rgba(20, 30, 52, 0.92) 100%)',
                          border: assignStatusFilter === 'SUBMITTED' ? '1px solid rgba(52, 211, 153, 0.65)' : '1px solid rgba(52, 211, 153, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: assignStatusFilter === 'SUBMITTED' ? '0 0 16px rgba(52, 211, 153, 0.25)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34d399',
                          flexShrink: 0
                        }}>
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                            {lang === 'vi' ? 'Đã nộp bài' : 'Submitted'}
                          </div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
                            {individualStats.submitted}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#6ee7b7', marginTop: '2px' }}>
                            {lang === 'vi' ? 'Nhấn để xem bài đã nộp' : 'Click to filter'}
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Chưa nộp bài */}
                      <div 
                        className="glass-card"
                        onClick={() => setAssignStatusFilter(prev => prev === 'UNSUBMITTED' ? 'ALL' : 'UNSUBMITTED')}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          background: assignStatusFilter === 'UNSUBMITTED'
                            ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.92) 100%)'
                            : 'linear-gradient(145deg, rgba(15, 23, 42, 0.88) 0%, rgba(20, 30, 52, 0.92) 100%)',
                          border: assignStatusFilter === 'UNSUBMITTED' ? '1px solid rgba(251, 191, 36, 0.65)' : '1px solid rgba(251, 191, 36, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: assignStatusFilter === 'UNSUBMITTED' ? '0 0 16px rgba(251, 191, 36, 0.25)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fbbf24',
                          flexShrink: 0
                        }}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                            {lang === 'vi' ? 'Chưa nộp bài' : 'Pending'}
                          </div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.2 }}>
                            {individualStats.unsubmitted}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#fde68a', marginTop: '2px' }}>
                            {lang === 'vi' ? 'Nhấn để xem bài cần nộp' : 'Click to filter'}
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Hạn nộp gần nhất */}
                      <div 
                        className="glass-card"
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.88) 0%, rgba(20, 30, 52, 0.92) 100%)',
                          border: '1px solid rgba(96, 165, 250, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px'
                        }}
                      >
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60a5fa',
                          flexShrink: 0
                        }}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                            {lang === 'vi' ? 'Hạn nộp gần nhất' : 'Nearest Deadline'}
                          </div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#93c5fd', lineHeight: 1.3 }}>
                            {individualStats.nearestDeadline ? individualStats.nearestDeadline.toISOString().split('T')[0] : (lang === 'vi' ? 'Không có hạn' : 'None')}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#bfdbfe', marginTop: '2px' }}>
                            {individualStats.nearestCountdown}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Search & Status Filter Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginTop: '4px'
                    }}>
                      {/* Search Input */}
                      <div style={{
                        position: 'relative',
                        flex: 1,
                        minWidth: '260px'
                      }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          value={assignSearchQuery}
                          onChange={e => setAssignSearchQuery(e.target.value)}
                          placeholder={lang === 'vi' ? 'Tìm đề bài theo tiêu đề, mã lớp, nội dung...' : 'Search assignments...'}
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 40px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            color: '#f8fafc',
                            fontSize: '0.86rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                        />
                        {assignSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setAssignSearchQuery('')}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                      {/* Status filter pills */}
                      <div style={{
                        display: 'inline-flex',
                        background: 'rgba(15, 23, 42, 0.8)',
                        padding: '4px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        gap: '4px'
                      }}>
                        <button
                          type="button"
                          onClick={() => setAssignStatusFilter('ALL')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '7px',
                            border: 'none',
                            background: assignStatusFilter === 'ALL' ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95))' : 'transparent',
                            color: assignStatusFilter === 'ALL' ? '#ffffff' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {lang === 'vi' ? 'Tất cả trạng thái' : 'All status'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignStatusFilter('UNSUBMITTED')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '7px',
                            border: 'none',
                            background: assignStatusFilter === 'UNSUBMITTED' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                            color: assignStatusFilter === 'UNSUBMITTED' ? '#fbbf24' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {lang === 'vi' ? 'Chưa nộp' : 'Pending'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignStatusFilter('SUBMITTED')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '7px',
                            border: 'none',
                            background: assignStatusFilter === 'SUBMITTED' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                            color: assignStatusFilter === 'SUBMITTED' ? '#34d399' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {lang === 'vi' ? 'Đã nộp bài' : 'Submitted'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════════════════
                      ZONE 2: INTERACTIVE MISSION TASK RAIL (Cards Grid with Rubric & Nộp Bài)
                      ═══════════════════════════════════════════════════════════════════════════ */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredIndividualAssignments.length === 0 ? (
                      <div 
                        className="glass-card"
                        style={{
                          padding: '2.5rem 2rem',
                          textAlign: 'center',
                          borderRadius: '16px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px dashed rgba(255, 255, 255, 0.15)'
                        }}
                      >
                        <div style={{ color: '#94a3b8', fontSize: '1.8rem', marginBottom: '8px' }}>📂</div>
                        <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0' }}>
                          {lang === 'vi' ? 'Không tìm thấy đề bài phù hợp' : 'No assignments found'}
                        </h4>
                        <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '0 0 16px 0' }}>
                          {lang === 'vi' ? 'Thử chọn học phần khác hoặc đặt lại từ khóa tìm kiếm.' : 'Try changing course filter or search keywords.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => { setSelectedIndividualCourseId('ALL'); setAssignSearchQuery(''); setAssignStatusFilter('ALL'); }}
                          className="btn-secondary"
                          style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '8px', margin: '0 auto', display: 'inline-flex' }}
                        >
                          <span>{lang === 'vi' ? 'Đặt lại tất cả bộ lọc' : 'Reset filters'}</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                        gap: '14px'
                      }}>
                        {filteredIndividualAssignments.map((a) => {
                          const info = getAssignmentLifecycleInfo(a, mySubmissions, currentUser?.userId || currentUser?.user_id, undefined);
                          const course = availableCourses.find(c => c.course_id === a.course_id);
                          const isExam = a.title.toLowerCase().includes('exam') || a.title.toLowerCase().includes('bài thi');
                          const dueDate = a.due_date || a.deadline;
                          const isSelectedInRunner = String(selectedIndividualAssignmentId) === String(a.assignment_id);

                          return (
                            <div
                              key={a.assignment_id}
                              className="glass-card"
                              style={{
                                padding: '1.25rem 1.4rem',
                                borderRadius: '16px',
                                background: isSelectedInRunner
                                  ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
                                  : 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 30, 0.9) 100%)',
                                border: isSelectedInRunner
                                  ? '1px solid rgba(167, 139, 250, 0.7)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: isSelectedInRunner
                                  ? '0 0 25px rgba(139, 92, 246, 0.25), 0 10px 25px -10px rgba(0,0,0,0.5)'
                                  : '0 8px 24px -10px rgba(0,0,0,0.4)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '12px',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative'
                              }}
                            >
                              {/* Top Badges Strip */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      background: isExam ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                      color: isExam ? '#f87171' : '#c084fc',
                                      border: isExam ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(139, 92, 246, 0.4)',
                                      padding: '2px 8px',
                                      borderRadius: '5px',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      letterSpacing: '0.5px'
                                    }}>
                                      {isExam ? 'EXAM' : 'ASSIGNMENT'}
                                    </span>
                                    {course && (
                                      <span style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        color: '#cbd5e1',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        padding: '2px 8px',
                                        borderRadius: '5px',
                                        fontSize: '0.68rem',
                                        fontWeight: 700
                                      }}>
                                        {course.course_code}
                                      </span>
                                    )}
                                    <span style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      color: '#94a3b8',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.68rem',
                                      fontFamily: 'var(--font-mono, monospace)'
                                    }}>
                                      ID: {a.assignment_id}
                                    </span>
                                  </div>

                                  {/* Deadline Countdown Pill */}
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: info.canSubmit ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                                    border: info.canSubmit ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.35)',
                                    color: info.canSubmit ? '#4ade80' : '#f87171',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700
                                  }}>
                                    <Clock size={12} />
                                    <span>{dueDate ? dueDate.split('T')[0] : ''}</span>
                                  </div>
                                </div>

                                {/* Title */}
                                <h4 style={{
                                  margin: '0 0 6px 0',
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  color: '#f8fafc',
                                  lineHeight: 1.35
                                }}>
                                  {a.title}
                                </h4>

                                {/* Description Snippet */}
                                {a.description && (
                                  <p style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '0.78rem',
                                    color: '#94a3b8',
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {a.description}
                                  </p>
                                )}

                                {/* Meta row: Score, Language, Quota */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  flexWrap: 'wrap',
                                  fontSize: '0.74rem',
                                  color: '#64748b',
                                  paddingTop: '6px',
                                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                  <span>⭐ Thang điểm: <strong style={{ color: '#34d399' }}>{a.max_score}đ</strong></span>
                                  <span>•</span>
                                  <span>🔢 Lượt: <strong style={{ color: '#a78bfa' }}>{info.maxSubs > 0 ? `${info.subCount}/${info.maxSubs}` : 'Không giới hạn'}</strong></span>
                                  <span>•</span>
                                  <span style={{
                                    color: info.isSubmitted ? '#34d399' : '#fbbf24',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    {info.isSubmitted ? '✅ Đã nộp' : '⏳ Chưa nộp'}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                paddingTop: '8px'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignDetail(a.assignment_id)}
                                  style={{
                                    flex: 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '9px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    color: '#e2e8f0',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'; e.currentTarget.style.color = '#a78bfa'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)'; e.currentTarget.style.color = '#e2e8f0'; }}
                                >
                                  <Eye size={14} />
                                  <span>{lang === 'vi' ? 'Xem chi tiết đề bài' : 'View Details'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedIndividualCourseId(String(a.course_id));
                                    setSelectedIndividualAssignmentId(String(a.assignment_id));
                                    setIndividualViewMode('submit');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  style={{
                                    flex: 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '9px',
                                    background: info.isSubmitted 
                                      ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(2, 132, 199, 0.9) 100%)'
                                      : 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: info.isSubmitted ? '0 4px 12px rgba(14, 165, 233, 0.35)' : '0 4px 12px rgba(124, 58, 237, 0.35)',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {info.isSubmitted ? (
                                    <>
                                      <RefreshCw size={14} />
                                      <span>Re-submit (Nộp Lại)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send size={14} />
                                      <span>Nộp Bài Ngay</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* ═══════════════════════════════════════════════════════════════════════════
                      ZONE 3: AITA SANDBOX RUNNER STATION (Workspace & Code Runner / Submission)
                      ═══════════════════════════════════════════════════════════════════════════ */}
                  <div id="aita-sandbox-station" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollMarginTop: '80px' }}>
                    
                    {/* Nút quay lại danh sách đề bài */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIndividualViewMode('gallery');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
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
                        <span>{lang === 'vi' ? '← Quay lại Danh sách Tất cả Đề bài' : '← Back to Assignments Gallery'}</span>
                      </button>
                    </div>
                    {/* Banner Card thông tin bài làm cá nhân (Khớp giao diện SWP) */}
                  {activeIndAssign && (
                    <div 
                      className="glass-card"
                      style={{
                        padding: '1.25rem 1.6rem',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(20, 32, 58, 0.96) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px' }}>
                        <div 
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a78bfa',
                            flexShrink: 0,
                            boxShadow: '0 0 16px rgba(139, 92, 246, 0.2)'
                          }}
                        >
                          <UploadCloud size={26} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                              ASSIGNMENT
                            </span>
                            {activeIndCourse && (
                              <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                {activeIndCourse.course_code}
                              </span>
                            )}
                            <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'var(--font-mono, monospace)' }}>
                              ID: ASM-{activeIndAssign.assignment_id}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
                            {lang === 'vi' ? 'Cổng Nộp Bài Lập Trình (Student Code Submission)' : 'Student Code Submission'}
                          </h3>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8' }}>
                            <span>👤 {lang === 'vi' ? 'Sinh viên:' : 'Student:'} <strong style={{ color: '#f1f5f9' }}>{currentUser?.full_name || 'Lê Nguyễn Linh Nhi'}</strong></span>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                            <span>📝 <strong style={{ color: '#a78bfa' }}>{activeIndAssign.title}</strong></span>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                            <span>
                              ⏳ {lang === 'vi' ? 'Hạn chót:' : 'Deadline:'}{' '}
                              <strong style={{ color: '#fde047' }}>
                                {formatVNTime(activeIndAssign.due_date || activeIndAssign.deadline)}
                              </strong>{' '}
                              <span style={{
                                padding: '1px 7px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                background: indAssignInfo.canSubmit ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                color: indAssignInfo.canSubmit ? '#4ade80' : '#f87171'
                              }}>
                                {indAssignInfo.canSubmit ? (lang === 'vi' ? 'CÒN HẠN' : 'OPEN') : (lang === 'vi' ? 'ĐÃ ĐÓNG' : 'CLOSED')}
                              </span>
                            </span>
                            {activeIndCourse?.lecturer_name && (
                              <>
                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                <span>👨‍🏫 {lang === 'vi' ? 'Giảng viên:' : 'Lecturer:'} <strong style={{ color: '#e2e8f0' }}>{activeIndCourse.lecturer_name}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIndividualViewMode('gallery');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', gap: '6px', borderRadius: '10px', cursor: 'pointer' }}
                      >
                        <span>📇</span>
                        <span>{lang === 'vi' ? 'Đổi Đề Bài Khác' : 'Change Assignment'}</span>
                      </button>
                    </div>
                  )}

                  {/* Main Form: Nộp Bài Làm Mới */}
                  <div 
                    className="glass-card" 
                    style={{ 
                      padding: '2rem 2.25rem', 
                      borderRadius: '20px', 
                      position: 'relative',
                      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 14, 23, 0.96) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.22)'
                    }}
                  >
                    <h4 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={20} color="#a78bfa" />
                      <span>{lang === 'vi' ? 'Nộp Bài Làm Mới' : 'Submit New Work'}</span>
                    </h4>

                    <form onSubmit={handleSubmitArtifact} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                      
                      {/* 1. CHỌN LỚP HỌC PHẦN (COURSE & CLASS) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          1. {lang === 'vi' ? 'CHỌN LỚP HỌC PHẦN (COURSE & CLASS)' : '1. SELECT COURSE & CLASS'} <span style={{ color: '#f43f5e' }}>*</span>
                        </label>
                        <select
                          value={selectedIndividualCourseId}
                          onChange={e => setSelectedIndividualCourseId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            color: '#f8fafc',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            outline: 'none'
                          }}
                        >
                          <option value="ALL">-- {lang === 'vi' ? 'Tất cả học phần của bạn' : 'All enrolled courses'} --</option>
                          {availableCourses.map(c => (
                            <option key={c.course_id} value={String(c.course_id)}>
                              {c.course_code} — {c.course_name} {c.lecturer_name ? `(GV: ${c.lecturer_name})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. CHỌN BÀI TẬP / ĐỀ THI CẦN NỘP */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          2. {lang === 'vi' ? 'CHỌN BÀI TẬP / ĐỀ THI CẦN NỘP' : '2. SELECT ASSIGNMENT / EXAM'} <span style={{ color: '#f43f5e' }}>*</span>
                        </label>
                        <select
                          id="individual-assignment-selector"
                          value={selectedIndividualAssignmentId}
                          onChange={e => setSelectedIndividualAssignmentId(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            color: '#f8fafc',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            outline: 'none'
                          }}
                        >
                          {individualAssignments.length > 0 ? individualAssignments.map((a, idx) => (
                            <option key={a.assignment_id} value={String(a.assignment_id)}>
                              [ASSIGNMENT #{idx + 1}] {a.title} (Hạn: {formatVNTime(a.due_date || a.deadline)})
                            </option>
                          )) : (
                            <option value="">-- {lang === 'vi' ? 'Chưa có bài tập cá nhân cho học phần này' : 'No individual assignments available'} --</option>
                          )}
                        </select>

                        {/* Assignment Details Badge */}
                        {activeIndAssign && (
                          <div style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            fontSize: '0.76rem',
                            color: '#94a3b8'
                          }}>
                            <span>💻 {lang === 'vi' ? 'Ngôn ngữ:' : 'Language:'} <strong style={{ color: '#a78bfa' }}>{activeIndAssign.allowed_language === 'python' ? 'Python 3' : activeIndAssign.allowed_language === 'javascript' ? 'JavaScript' : 'Tùy chọn'}</strong></span>
                            <span>•</span>
                            <span>🔢 {lang === 'vi' ? 'Lượt nộp:' : 'Attempts:'} <strong style={{ color: '#a78bfa' }}>{indAssignInfo.maxSubs > 0 ? `${indAssignInfo.subCount}/${indAssignInfo.maxSubs}` : 'Không giới hạn'}</strong></span>
                            <span>•</span>
                            <span>Thang điểm: <strong style={{ color: '#34d399' }}>{activeIndAssign.max_score} điểm</strong></span>
                          </div>
                        )}
                      </div>

                      {/* 3. TẢI LÊN TỆP MÃ NGUỒN BÀI LÀM (.ZIP) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            3. {individualMethod === 'file' ? (lang === 'vi' ? 'TẢI LÊN TỆP MÃ NGUỒN BÀI LÀM (.ZIP)' : '3. UPLOAD SOURCE CODE FILE (.ZIP)') : (lang === 'vi' ? 'SOẠN THẢO TRỰC TIẾP & DOCKER SANDBOX' : '3. DIRECT CODE EDITOR & SANDBOX')} <span style={{ color: '#f43f5e' }}>*</span>
                          </label>

                          {/* Switcher: Upload File ZIP vs Direct Editor */}
                          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                              type="button"
                              onClick={() => setIndividualMethod('file')}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: individualMethod === 'file' ? '#7c3aed' : 'transparent',
                                color: individualMethod === 'file' ? '#ffffff' : '#94a3b8',
                                fontSize: '0.78rem',
                                fontWeight: individualMethod === 'file' ? 700 : 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <UploadCloud size={14} />
                              <span>{lang === 'vi' ? 'Tải lên tệp (.ZIP)' : 'Upload File (.ZIP)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIndividualMethod('editor')}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: individualMethod === 'editor' ? '#7c3aed' : 'transparent',
                                color: individualMethod === 'editor' ? '#ffffff' : '#94a3b8',
                                fontSize: '0.78rem',
                                fontWeight: individualMethod === 'editor' ? 700 : 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <Terminal size={14} />
                              <span>{lang === 'vi' ? 'Docker Sandbox Runner' : 'Docker Sandbox Runner'}</span>
                            </button>
                          </div>
                        </div>

                        {/* MODE A: DRAG & DROP FILE ZONE (Khớp ảnh 2 SWP) */}
                        {individualMethod === 'file' ? (
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".zip,.rar,.7z,.java,.py,.js,.ts,.cpp,.c,.cs,.txt"
                              onChange={handleFileChange}
                              style={{ display: 'none' }}
                            />

                            {!uploadedFile ? (
                              <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                  border: fileIsDragging ? '2px dashed #a78bfa' : '2px dashed rgba(139, 92, 246, 0.4)',
                                  background: fileIsDragging ? 'rgba(139, 92, 246, 0.12)' : 'rgba(15, 23, 42, 0.45)',
                                  borderRadius: '16px',
                                  padding: '2.5rem 1.5rem',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '12px'
                                }}
                              >
                                <div
                                  style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: 'rgba(139, 92, 246, 0.14)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#a78bfa'
                                  }}
                                >
                                  <UploadCloud size={30} />
                                </div>
                                <div>
                                  <h5 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                                    {lang === 'vi' ? 'Kéo thả tệp mã nguồn (.zip) vào đây hoặc nhấn để duyệt tệp' : 'Drag & drop source code file (.zip) here or click to browse'}
                                  </h5>
                                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                                    {lang === 'vi' ? 'Định dạng được hỗ trợ: Tệp nén ZIP (.zip) chứa mã nguồn bài làm hoặc tệp (.java, .py, .js)' : 'Supported formats: .zip archive or source code (.java, .py, .js)'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                  }}
                                  className="btn-secondary"
                                  style={{
                                    padding: '9px 20px',
                                    fontSize: '0.85rem',
                                    gap: '8px',
                                    borderRadius: '10px',
                                    background: 'rgba(139, 92, 246, 0.12)',
                                    border: '1px solid rgba(139, 92, 246, 0.35)',
                                    color: '#a78bfa'
                                  }}
                                >
                                  <Paperclip size={15} />
                                  <span>{lang === 'vi' ? 'Chọn tệp từ máy tính (.zip, .java, .py...)' : 'Choose file from computer (.zip, .java, .py...)'}</span>
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  border: '1px solid rgba(34, 197, 94, 0.45)',
                                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                                  borderRadius: '14px',
                                  padding: '1.25rem 1.6rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '14px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  <div
                                    style={{
                                      width: '48px',
                                      height: '48px',
                                      borderRadius: '12px',
                                      background: 'rgba(34, 197, 94, 0.2)',
                                      color: '#4ade80',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    {uploadedFile.name.endsWith('.zip') || uploadedFile.name.endsWith('.rar') ? <FileArchive size={26} /> : <FileCode size={26} />}
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <strong style={{ color: '#f8fafc', fontSize: '0.96rem' }}>{uploadedFile.name}</strong>
                                      <span style={{ fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '1px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        {(uploadedFile.size / 1024).toFixed(1)} KB
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#86efac' }}>
                                      ✅ {lang === 'vi' ? 'Tệp bài làm đã sẵn sàng để gửi lên hệ thống' : 'File is ready for submission'}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                  >
                                    {lang === 'vi' ? 'Chọn tệp khác' : 'Change file'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setUploadedFile(null)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      border: '1px solid rgba(239, 68, 68, 0.35)',
                                      color: '#f87171',
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    ✕ {lang === 'vi' ? 'Xóa tệp' : 'Remove'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* MODE B: DIRECT MONACO/DARK IDE EDITOR (Sandbox Runner) */
                          <div style={{ borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.14)', background: '#090d16', overflow: 'hidden' }}>
                            <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                                </div>
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
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🟨 JS (Node.js)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLanguage('python')}
                                    style={{
                                      padding: '3px 9px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: selectedLanguage === 'python' ? '#8b5cf6' : 'transparent',
                                      color: selectedLanguage === 'python' ? '#000' : '#94a3b8',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🐍 Python 3
                                  </button>
                                </div>
                                <div style={{ background: selectedLanguage === 'python' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', color: '#f1f5f9', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                                  {selectedLanguage === 'python' ? 'main.py' : 'main.js'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {codeContent && (
                                  <button
                                    type="button"
                                    onClick={() => setCodeContent('')}
                                    style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    ✕ {lang === 'vi' ? 'Xóa code' : 'Clear'}
                                  </button>
                                )}
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                                  {selectedLanguage === 'python' ? 'Python 3.11' : 'Node.js 20'}
                                </span>
                              </div>
                            </div>

                            <textarea
                              rows={8}
                              value={codeContent}
                              onChange={e => setCodeContent(e.target.value)}
                              placeholder={
                                selectedLanguage === 'python'
                                  ? (lang === 'vi' ? '# Viết hoặc dán mã nguồn Python 3 tại đây (chạy trên Docker Sandbox)...' : '# Write or paste Python 3 source code here...')
                                  : (lang === 'vi' ? '// Viết hoặc dán mã nguồn JavaScript tại đây (chạy trên Docker Sandbox)...' : '// Write or paste JavaScript source code here...')
                              }
                              style={{
                                width: '100%',
                                padding: '14px 16px',
                                background: '#090d16',
                                border: 'none',
                                outline: 'none',
                                color: selectedLanguage === 'python' ? '#a78bfa' : '#fbbf24',
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.86rem',
                                lineHeight: '1.6',
                                display: 'block',
                                resize: 'vertical'
                              }}
                            />

                            <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                                <span>{selectedLanguage === 'python' ? 'Python 3.11 Sandbox' : 'Node.js 20 Sandbox'}</span>
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
                        )}
                      </div>

                      {/* 4. LỜI NHẮN / GHI CHÚ GỬI GIẢNG VIÊN (TÙY CHỌN) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          4. {lang === 'vi' ? 'LỜI NHẮN / GHI CHÚ GỬI GIẢNG VIÊN (TÙY CHỌN)' : '4. NOTE TO INSTRUCTOR (OPTIONAL)'}
                        </label>
                        <textarea
                          rows={2}
                          value={submissionNote}
                          onChange={e => setSubmissionNote(e.target.value)}
                          placeholder={lang === 'vi' ? 'Nhập ghi chú hoặc giải thích cho giảng viên (ví dụ: mô tả cách chạy test, lưu ý cấu trúc thư mục...)' : 'Enter note for instructor...'}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            color: '#f8fafc',
                            fontSize: '0.86rem',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {/* Progress step during execution */}
                      {isSubmitting && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', color: '#c4b5fd', fontSize: '0.88rem' }}>
                          <Loader2 size={20} className="animate-spin" color="#a78bfa" />
                          <div style={{ fontWeight: 500 }}>
                            {submitStep === 1 && (lang === 'vi' ? '1. Đang khởi tạo kết nối và lưu trữ bài làm...' : '1. Initializing storage...')}
                            {submitStep === 2 && (lang === 'vi' ? '2. Đang kiểm tra mã nguồn và chạy pipeline kiểm thử...' : '2. Executing pipeline...')}
                            {submitStep === 3 && (lang === 'vi' ? '3. AI đang bóc tách kết quả và sinh nhận xét...' : '3. AI is evaluating code quality...')}
                          </div>
                        </div>
                      )}

                      {/* Error Alert */}
                      {submitError && (
                        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: '10px', padding: '12px 16px', color: '#fda4af', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AlertTriangle size={18} color="#f43f5e" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || individualAssignments.length === 0 || !indAssignInfo.canSubmit}
                        className="btn-primary"
                        style={{
                          padding: '13px 24px',
                          fontSize: '0.94rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          borderRadius: '12px',
                          boxShadow: indAssignInfo.canSubmit ? '0 4px 20px rgba(139, 92, 246, 0.35)' : 'none',
                          opacity: (isSubmitting || individualAssignments.length === 0 || !indAssignInfo.canSubmit) ? 0.6 : 1,
                          cursor: (isSubmitting || individualAssignments.length === 0 || !indAssignInfo.canSubmit) ? 'not-allowed' : 'pointer',
                          background: !indAssignInfo.canSubmit ? 'rgba(239, 68, 68, 0.2)' : undefined,
                          border: !indAssignInfo.canSubmit ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                          color: !indAssignInfo.canSubmit ? '#fca5a5' : undefined,
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{lang === 'vi' ? 'Đang gửi bài làm...' : 'Submitting...'}</span>
                          </>
                        ) : !indAssignInfo.canSubmit ? (
                          <>
                            <span>🔒</span>
                            <span>{indAssignInfo.disableReason || (lang === 'vi' ? 'Bài tập đã đóng / Hết lượt nộp' : 'Submission Locked')}</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            <span>{lang === 'vi' ? '🚀 Nộp Bài Làm Cá Nhân' : '🚀 Submit Individual Assignment'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

                {/* ═══════════════════════════════════════════════════════════════════════════
                    ASSIGNMENT DETAIL & RUBRIC MODAL (BR-06 Protection for Students)
                    ═══════════════════════════════════════════════════════════════════════════ */}
                {viewingAssignmentDetail && (
                  <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.78)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div 
                      className="glass-card"
                      style={{
                        width: '100%',
                        maxWidth: '740px',
                        maxHeight: '90vh',
                        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        borderRadius: '20px',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Modal Header */}
                      <div style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              {viewingAssignmentDetail.assignment?.submission_type || 'INDIVIDUAL'}
                            </span>
                            <span style={{
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#c084fc',
                              border: '1px solid rgba(139, 92, 246, 0.4)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {viewingAssignmentDetail.assignment?.course_code || 'COURSE'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                              ID: ASM-{viewingAssignmentDetail.assignment?.assignment_id}
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
                            {viewingAssignmentDetail.assignment?.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => setViewingAssignmentDetail(null)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Modal Content Body: Chỉ hiển thị nội dung đề bài & thông số nộp (Ẩn toàn bộ Test Case / Rubric theo quy chế) */}
                      <div style={{
                        padding: '20px 24px',
                        overflowY: 'auto',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        {/* Problem statement */}
                        <div>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: '0.84rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {lang === 'vi' ? 'Mô tả & Yêu cầu đề bài' : 'Problem Description & Requirements'}
                          </h5>
                          <div style={{
                            padding: '16px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.9rem',
                            color: '#cbd5e1',
                            lineHeight: 1.68,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {viewingAssignmentDetail.assignment?.description || (lang === 'vi' ? 'Chưa có mô tả chi tiết cho bài tập này.' : 'No description provided.')}
                          </div>
                        </div>

                        {/* Specs grid */}
                        <div>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: '0.84rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {lang === 'vi' ? 'Thông số kỹ thuật & Quy chế nộp bài' : 'Specifications & Policies'}
                          </h5>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '10px'
                          }}>
                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'vi' ? 'Thang điểm tối đa:' : 'Max score:'}</div>
                              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                                {viewingAssignmentDetail.assignment?.max_score} điểm
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'vi' ? 'Ngôn ngữ cho phép:' : 'Allowed language:'}</div>
                              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#cbd5e1', marginTop: '2px' }}>
                                {viewingAssignmentDetail.assignment?.allowed_language || 'Tất cả'}
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'vi' ? 'Hạn nộp chính thức:' : 'Due date:'}</div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fde047', marginTop: '2px' }}>
                                {formatVNTime(viewingAssignmentDetail.assignment?.due_date || viewingAssignmentDetail.assignment?.deadline)}
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'vi' ? 'Số lần nộp tối đa:' : 'Max attempts:'}</div>
                              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
                                {viewingAssignmentDetail.assignment?.max_submissions ? `${viewingAssignmentDetail.assignment.max_submissions} lần` : 'Không giới hạn'}
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'vi' ? 'Cho phép nộp lại:' : 'Allow resubmission:'}</div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: viewingAssignmentDetail.assignment?.allow_resubmission !== false ? '#4ade80' : '#f87171', marginTop: '2px' }}>
                                {viewingAssignmentDetail.assignment?.allow_resubmission !== false ? 'Có (Lấy điểm cao nhất)' : 'Không (Chỉ nộp 1 lần)'}
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'vi' ? 'Chính sách nộp trễ:' : 'Late policy:'}</div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: viewingAssignmentDetail.assignment?.allow_late_submission ? '#fbbf24' : '#f87171', marginTop: '2px' }}>
                                {viewingAssignmentDetail.assignment?.allow_late_submission ? 'Cho phép (Có gắn cờ trễ)' : 'Chặn nộp sau hạn'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '12px'
                      }}>
                        <button
                          type="button"
                          onClick={() => setViewingAssignmentDetail(null)}
                          className="btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.84rem', borderRadius: '9px' }}
                        >
                          <span>{lang === 'vi' ? 'Đóng cửa sổ' : 'Close'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (viewingAssignmentDetail.assignment) {
                              setSelectedIndividualCourseId(String(viewingAssignmentDetail.assignment.course_id));
                              setSelectedIndividualAssignmentId(String(viewingAssignmentDetail.assignment.assignment_id));
                            }
                            setViewingAssignmentDetail(null);
                            setIndividualViewMode('submit');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="btn-primary"
                          style={{ padding: '8px 18px', fontSize: '0.84rem', gap: '8px', borderRadius: '9px' }}
                        >
                          <Send size={15} />
                          <span>{lang === 'vi' ? '🚀 Bắt Đầu Nộp Bài Cho Đề Này' : 'Start Submitting This Task'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: ĐỒ ÁN NHÓM (GIT REPOSITORY - PURE REPO FORM)
                  ───────────────────────────────────────────────────────────── */}
              {submitSubTab === 'team' && (
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
                        ? 'Chức năng nộp đồ án nhóm yêu cầu sinh viên phải trực thuộc một nhóm đồ án hợp lệ. Vui lòng liên hệ Giảng viên để được phân nhóm.'
                        : 'Submitting team project requires membership in a project team. Please contact your instructor.'}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Top sub-navigation pills (matching friend's SWP UI layout) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setTeamActionTab('submit')}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '10px',
                            background: teamActionTab === 'submit' 
                              ? 'linear-gradient(135deg, rgba(185, 28, 28, 0.95) 0%, rgba(220, 38, 38, 0.9) 100%)' 
                              : 'rgba(15, 23, 42, 0.8)',
                            border: teamActionTab === 'submit' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: teamActionTab === 'submit' ? '#ffffff' : '#cbd5e1',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            cursor: 'pointer',
                            boxShadow: teamActionTab === 'submit' ? '0 4px 15px rgba(220, 38, 38, 0.35)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <GitBranch size={16} />
                          <span>1. {lang === 'vi' ? 'Nộp Git Nhóm (Submit Team Repo)' : 'Submit Team Repo'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTeamActionTab('analytics');
                            if (targetAnalyticsTeam?.team_id) fetchGitAnalytics(targetAnalyticsTeam.team_id);
                          }}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '10px',
                            background: teamActionTab === 'analytics'
                              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.9) 100%)'
                              : 'rgba(15, 23, 42, 0.8)',
                            border: teamActionTab === 'analytics' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: teamActionTab === 'analytics' ? '#ffffff' : '#cbd5e1',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            cursor: 'pointer',
                            boxShadow: teamActionTab === 'analytics' ? '0 4px 15px rgba(139, 92, 246, 0.35)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <BarChart2 size={16} color={teamActionTab === 'analytics' ? '#ffffff' : '#a78bfa'} />
                          <span>2. {lang === 'vi' ? 'Báo Cáo Đóng Góp & Radar Free-Rider (BR-07)' : 'Contribution & Free-Rider Report'}</span>
                        </button>
                      </div>

                      {/* Quick Fill Button */}
                      {teamActionTab === 'submit' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRepoUrl(myTeam?.repo_url || 'https://github.com/min098-ui/SWD392_AITA-Intelligent.git');
                            setTeamBranch('main');
                            setCommitHash('7a9f4c28e9b1');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(124, 58, 237, 0.15))',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            color: '#c084fc',
                            padding: '7px 14px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 0 15px rgba(168, 85, 247, 0.15)',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                          }}
                        >
                          <span>⚡</span>
                          <span>{lang === 'vi' ? 'Điền nhanh Repo nhóm' : 'Quick Fill Team Repo'}</span>
                        </button>
                      )}
                    </div>

                    {teamActionTab === 'submit' ? (
                      <>
                        {/* Section Intro (matching friend's SWP UI) */}
                        <div>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>{lang === 'vi' ? 'Cổng Nộp Đồ Án Nhóm (Team Git Submission)' : 'Team Git Submission'}</span>
                          </h3>
                          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                            {lang === 'vi'
                              ? 'Nộp đường dẫn kho lưu trữ GitHub chung của nhóm để hệ thống tự động bóc tách commit, phân tích đóng góp từng thành viên và gửi giảng viên chấm điểm.'
                              : 'Submit shared GitHub repo for instructor analytics and contribution grading.'}
                          </p>
                        </div>

                    {/* Main Team Form Card: Repository Submission Details */}
                    <div 
                      className="glass-card" 
                      style={{ 
                        padding: '2rem 2.25rem', 
                        borderRadius: '20px', 
                        position: 'relative',
                        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94) 0%, rgba(24, 18, 38, 0.96) 100%)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.6)'
                      }}
                    >
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.35rem', letterSpacing: '0.3px' }}>
                        {lang === 'vi' ? 'Thông Tin Chi Tiết Nộp Kho Lưu Trữ (Repository Submission Details)' : 'Repository Submission Details'}
                      </h4>

                      <form onSubmit={handleSubmitArtifact} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                        
                        {/* YOUR ASSIGNED TEAM Card (Khớp giao diện SWP) */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            👥 {lang === 'vi' ? 'NHÓM ĐỒ ÁN ĐƯỢC PHÂN CÔNG (YOUR ASSIGNED TEAM)' : 'YOUR ASSIGNED TEAM'} <span style={{ color: '#f43f5e' }}>*</span>
                          </label>

                          <div 
                            style={{
                              background: 'rgba(168, 85, 247, 0.08)',
                              border: '1px solid rgba(168, 85, 247, 0.28)',
                              borderRadius: '14px',
                              padding: '16px 18px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                                  color: '#ffffff',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.5px',
                                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)'
                                }}>
                                  {myTeam.team_name.includes('Group') ? myTeam.team_name : `Nhóm ${myTeam.team_id}`}
                                </span>
                                <div>
                                  <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.98rem' }}>
                                    {myTeam.team_name} — {myTeam.course_name}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>Lớp: <strong style={{ color: '#a78bfa' }}>{myTeam.course_code}</strong> ({myTeam.semester || 'FA26'})</span>
                                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                    <span>Trưởng nhóm: <strong style={{ color: '#c084fc' }}>{myTeam.members?.find((m: any) => m.role === 'LEADER')?.full_name || 'Đinh Gia Huy'}</strong></span>
                                    {myTeam.lecturer_name && (
                                      <>
                                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                        <span>GVHD: <strong style={{ color: '#94a3b8' }}>{myTeam.lecturer_name}</strong></span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Multi-team switcher if student belongs to > 1 team */}
                              {myTeams.length > 1 && (
                                <select
                                  value={myTeam.team_id}
                                  onChange={e => {
                                    const selectedId = Number(e.target.value);
                                    const chosen = myTeams.find(t => t.team_id === selectedId);
                                    if (chosen) {
                                      setMyTeam(chosen);
                                      setSelectedFilter(String(chosen.team_id));
                                      if (chosen.repo_url) setRepoUrl(chosen.repo_url);
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(15, 23, 42, 0.85)',
                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                    color: '#c084fc',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    outline: 'none'
                                  }}
                                >
                                  {myTeams.map(t => (
                                    <option key={t.team_id} value={t.team_id}>
                                      Đổi sang {t.team_name} ({t.course_code})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Friendly Hint (Khớp hướng dẫn SWP) */}
                            <div style={{ fontSize: '0.78rem', color: '#e9d5ff', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <span>💡</span>
                              <span>
                                {lang === 'vi'
                                  ? `Lưu ý: Bạn đang nộp bài đại diện cho ${myTeam.team_name}. Chỉ cần một thành viên trong nhóm nộp link GitHub, toàn bộ nhóm đều sẽ được hệ thống tự động bóc tách commit và chấm điểm.`
                                  : `Note: You are submitting on behalf of ${myTeam.team_name}. Once any member submits GitHub URL, all members are automatically evaluated.`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* GITHUB REPOSITORY URL */}
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            <GitBranch size={15} color="#c084fc" />
                            <span>{lang === 'vi' ? 'ĐƯỜNG DẪN GITHUB REPOSITORY (GITHUB REPOSITORY URL)' : 'GITHUB REPOSITORY URL'}</span>
                            <span style={{ color: '#f43f5e' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={repoUrl}
                            onChange={e => setRepoUrl(e.target.value)}
                            required
                            placeholder="https://github.com/organization/repo.git"
                            style={{
                              width: '100%',
                              padding: '13px 16px',
                              background: 'rgba(15, 23, 42, 0.85)',
                              border: '1px solid rgba(168, 85, 247, 0.35)',
                              borderRadius: '12px',
                              color: '#f8fafc',
                              fontSize: '0.9rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              outline: 'none',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                            }}
                          />
                        </div>

                        {/* BRANCH */}
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            <GitBranch size={15} color="#a78bfa" />
                            <span>{lang === 'vi' ? 'NHÁNH KIỂM THỬ (BRANCH)' : 'BRANCH'}</span>
                            <span style={{ color: '#f43f5e' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={teamBranch}
                            onChange={e => setTeamBranch(e.target.value)}
                            required
                            placeholder="main"
                            style={{
                              width: '100%',
                              padding: '13px 16px',
                              background: 'rgba(15, 23, 42, 0.85)',
                              border: '1px solid rgba(139, 92, 246, 0.35)',
                              borderRadius: '12px',
                              color: '#a78bfa',
                              fontSize: '0.9rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 700,
                              outline: 'none',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                            }}
                          />
                        </div>

                        {/* Progress step during execution */}
                        {isSubmitting && (
                          <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(139, 92, 246, 0.15) 100%)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', color: '#d8b4fe', fontSize: '0.88rem' }}>
                            <Loader2 size={20} className="animate-spin" color="#c084fc" />
                            <div style={{ fontWeight: 500 }}>
                              {submitStep === 1 && (lang === 'vi' ? '1. Đang kết nối Git Repository và kiểm tra commit...' : '1. Verifying Git commit...')}
                              {submitStep === 2 && (lang === 'vi' ? '2. Đang đồng bộ và kích hoạt Pipeline bóc tách đóng góp...' : '2. Triggering analytics pipeline...')}
                              {submitStep === 3 && (lang === 'vi' ? '3. AI đang cập nhật radar đóng góp BR-07 cho nhóm...' : '3. Updating BR-07 contribution radar...')}
                            </div>
                          </div>
                        )}

                        {/* Error alert */}
                        {submitError && (
                          <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: '10px', padding: '12px 16px', color: '#fda4af', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle size={18} color="#f43f5e" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {/* Submit CTA button (Matching friend's SWP UI) */}
                        <button
                          type="submit"
                          disabled={isSubmitting || !repoUrl.trim()}
                          className="btn-primary"
                          style={{
                            padding: '14px 24px',
                            fontSize: '0.96rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.95) 0%, rgba(220, 38, 38, 0.9) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.35)',
                            opacity: (isSubmitting || !repoUrl.trim()) ? 0.6 : 1,
                            cursor: (isSubmitting || !repoUrl.trim()) ? 'not-allowed' : 'pointer',
                            marginTop: '6px'
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>{lang === 'vi' ? 'Đang kích hoạt Pipeline phân tích Git...' : 'Triggering Pipeline...'}</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={19} />
                              <span>{lang === 'vi' ? '☁️ Submit Git Repo to Lecturer / Nộp Đồ Án Nhóm' : '☁️ Submit Git Repo to Lecturer'}</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  renderGitAnalyticsView()
                )}
              </div>
            )
          )}

              {/* Submission Confirmation Modal */}
              {showSubmitModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.82)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '20px'
                }}>
                  <div style={{
                    maxWidth: '520px',
                    width: '100%',
                    background: '#0f172a',
                    border: submitSubTab === 'individual' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '20px',
                    padding: '26px',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: submitSubTab === 'individual' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        color: submitSubTab === 'individual' ? '#a78bfa' : '#c084fc'
                      }}>
                        {submitSubTab === 'individual' ? <FileCode size={24} /> : <Users size={24} />}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                          {submitSubTab === 'individual'
                            ? (lang === 'vi' ? 'Xác nhận nộp bài tập cá nhân' : 'Confirm Individual Submission')
                            : (lang === 'vi' ? 'Xác nhận nộp đồ án nhóm' : 'Confirm Team Project Submission')}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {submitSubTab === 'individual'
                            ? (lang === 'vi' ? 'Bài làm sẽ được lưu và chấm tự động theo chuẩn quy định' : 'Work will be stored and evaluated')
                            : (lang === 'vi' ? 'Hệ thống sẽ cập nhật Git Repository và đồng bộ đóng góp nhóm BR-07' : 'Will update Git repository & sync BR-07 contribution')}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Hình thức:' : 'Type:'}</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: submitSubTab === 'individual' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: submitSubTab === 'individual' ? '#a78bfa' : '#c084fc'
                        }}>
                          {submitSubTab === 'individual' ? (lang === 'vi' ? '👤 Bài tập cá nhân' : 'Individual Assignment') : (lang === 'vi' ? `👥 Đồ án nhóm (${myTeam?.team_name})` : `Team Project (${myTeam?.team_name})`)}
                        </span>
                      </div>

                      {submitSubTab === 'individual' ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <span style={{ color: '#94a3b8', flexShrink: 0 }}>{lang === 'vi' ? 'Bài tập cần nộp:' : 'Assignment:'}</span>
                          <strong style={{ color: '#f1f5f9', textAlign: 'right' }}>
                            {assignments.find(a => String(a.assignment_id) === String(selectedIndividualAssignmentId || selectedAssignment))?.title || ('#' + (selectedIndividualAssignmentId || selectedAssignment))}
                          </strong>
                        </div>
                      ) : null}

                      {submitSubTab === 'individual' ? (
                        individualMethod === 'file' ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Tệp bài làm tải lên:' : 'Uploaded file:'}</span>
                              <strong style={{ color: '#a78bfa' }}>{uploadedFile?.name || 'Chưa chọn'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Dung lượng tệp:' : 'File size:'}</span>
                              <strong style={{ color: '#f1f5f9' }}>{uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : '0 KB'}</strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Ngôn ngữ:' : 'Language:'}</span>
                              <span style={{ color: selectedLanguage === 'python' ? '#a78bfa' : '#fbbf24', fontWeight: 700 }}>
                                {selectedLanguage === 'python' ? '🐍 Python 3.11' : '🟨 JavaScript (Node.js 20)'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Số dòng code:' : 'Lines:'}</span>
                              <strong style={{ color: '#f1f5f9' }}>{codeContent.split('\n').length} dòng</strong>
                            </div>
                          </>
                        )
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Nhóm đồ án:' : 'Team:'}</span>
                            <strong style={{ color: '#c084fc' }}>{myTeam?.team_name}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Trưởng nhóm:' : 'Team Leader:'}</span>
                            <strong style={{ color: '#a78bfa' }}>{myTeam?.members?.find((m: any) => m.role === 'LEADER')?.full_name || 'Đinh Gia Huy'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Git Repository:' : 'Git Repository:'}</span>
                            <strong style={{ color: '#a78bfa', fontFamily: 'var(--font-mono, monospace)', wordBreak: 'break-all' }}>{repoUrl}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'vi' ? 'Nhánh (Branch):' : 'Branch:'}</span>
                            <strong style={{ color: '#a78bfa' }}>{teamBranch || 'main'}</strong>
                          </div>
                        </>
                      )}

                      {submissionNote.trim() && (
                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
                          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{lang === 'vi' ? 'Ghi chú gửi giảng viên:' : 'Note:'}</span> {submissionNote}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(false)}
                        className="btn-secondary"
                        style={{ padding: '9px 18px', fontSize: '0.84rem', borderRadius: '10px' }}
                      >
                        {lang === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSubmit}
                        disabled={isSubmitting}
                        className="btn-primary"
                        style={{
                          padding: '9px 22px',
                          fontSize: '0.84rem',
                          gap: '8px',
                          borderRadius: '10px',
                          background: submitSubTab === 'individual'
                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 1) 0%, rgba(14, 165, 233, 1) 100%)'
                            : 'linear-gradient(135deg, rgba(124, 58, 237, 1) 0%, rgba(168, 85, 247, 1) 100%)'
                        }}
                      >
                        {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        <span>{lang === 'vi' ? 'Xác nhận nộp bài' : 'Confirm & Submit'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                {displayedSubmissions.map((sub) => {
                  const isFailed = sub.status === 'FAILED' || (sub.status === 'GRADED' && Number(sub.final_score ?? sub.score) === 0);
                  const isGrading = (sub.status === 'GRADING' || sub.status === 'QUEUED' || sub.grading_status === 'PROCESSING' || sub.grading_status === 'QUEUED') && sub.status !== 'FINALIZED';
                  const scoreNum = Number(sub.final_score ?? sub.score ?? 0);

                  return (
                    <div 
                      key={sub.submission_id} 
                      className="glass-card" 
                      style={{ 
                        padding: '1.5rem', 
                        borderLeft: `4px solid ${isFailed ? '#f43f5e' : (isGrading ? '#f59e0b' : '#34d399')}`,
                        background: isFailed ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-main)' }}>
                            {sub.assignment_title || 'Assignment #' + sub.assignment_id}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {sub.language && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: sub.language === 'python' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: sub.language === 'python' ? '#a78bfa' : '#fbbf24',
                                border: `1px solid ${sub.language === 'python' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                              }}>
                                {sub.language === 'python' ? '🐍 Python 3' : '🟨 Node.js'}
                              </span>
                            )}
                            {sub.git_commit_hash && sub.git_commit_hash !== 'DIRECT_SUBMIT' && (
                              <span>Commit: <code style={{ color: '#c4b5fd' }}>{sub.git_commit_hash?.slice(0, 12)}</code></span>
                            )}
                            <span>{lang === 'vi' ? 'Nộp lúc:' : 'Submitted:'} {new Date(sub.submitted_at).toLocaleString('vi-VN')}</span>
                            {sub.test_results && sub.test_results.length > 0 && (() => {
                              const passedCount = sub.test_results.filter(t => t.passed).length;
                              const failedCount = sub.test_results.length - passedCount;
                              return (
                                <span style={{ display: 'inline-flex', gap: '6px' }}>
                                  <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    ✓ {passedCount} Passed
                                  </span>
                                  {failedCount > 0 && (
                                    <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                      ✗ {failedCount} Failed
                                    </span>
                                  )}
                                </span>
                              );
                            })()}
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
                                <Users size={12} color="#a78bfa" />
                                <span>{lang === 'vi' ? 'Người nộp:' : 'Submitted by:'} <strong style={{ color: '#e9d5ff' }}>{sub.submitter_name}</strong></span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {!isGrading && (
                            <span style={{
                              padding: '5px 12px', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 800,
                              background: isFailed ? 'rgba(239, 68, 68, 0.18)' : (scoreNum >= 8 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)'),
                              color: isFailed ? '#f87171' : (scoreNum >= 8 ? '#34d399' : '#fbbf24'),
                              border: `1px solid ${isFailed ? 'rgba(239, 68, 68, 0.4)' : (scoreNum >= 8 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)')}`
                            }}>
                              ★ {scoreNum.toFixed(1)} / 10
                            </span>
                          )}

                          {/* Moderation Stage Badge */}
                          {sub.status === 'FINALIZED' ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)'
                            }}>
                              <CheckCircle2 size={12} /> {lang === 'vi' ? 'Điểm chính thức đã duyệt' : 'Finalized Grade'}
                            </span>
                          ) : sub.status === 'PENDING_SECOND_REVIEW' ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)'
                            }}>
                              <AlertTriangle size={12} /> {lang === 'vi' ? 'Chờ GV2 chấm chéo (BR-09)' : 'Pending 2nd Review'}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)'
                            }}>
                              <Sparkles size={12} /> {lang === 'vi' ? 'Điểm sơ bộ (AI Sandbox)' : 'AI Pre-Graded'}
                            </span>
                          )}

                          {/* Late Submission Badge */}
                          {sub.is_late && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)'
                            }}>
                              <AlertTriangle size={12} /> {lang === 'vi' ? `Nộp muộn ${sub.late_minutes ? sub.late_minutes + 'p' : ''}` : 'Late Submission'}
                            </span>
                          )}

                          {isFailed ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.45)'
                            }}>
                              <AlertTriangle size={13} /> {lang === 'vi' ? 'FAILED (Không đạt)' : 'FAILED'}
                            </span>
                          ) : isGrading ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                              background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)'
                            }}>
                              <Loader2 size={13} className="animate-spin" /> {lang === 'vi' ? 'Đang chấm điểm Docker Sandbox...' : 'Grading in Sandbox...'}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)'
                            }}>
                              <CheckCircle2 size={13} /> {lang === 'vi' ? 'PASSED (Thành công)' : 'PASSED'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Watchdog / Failure Alert */}
                      {isFailed && (
                        <div style={{
                          margin: '0.75rem 0', padding: '10px 14px', borderRadius: '10px',
                          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px'
                        }}>
                          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                          <div>
                            <strong style={{ color: '#f87171' }}>
                              {lang === 'vi' ? 'Can thiệp Sandbox (Watchdog 5s - BR-03):' : 'Sandbox Watchdog Alert (BR-03):'}
                            </strong>{' '}
                            <span>{sub.ai_feedback || 'Phát hiện vòng lặp vô hạn hoặc thời gian chạy vượt quá 5,000ms. Container Docker Sandbox đã bị ngắt an toàn để chống nghẽn hệ thống.'}</span>
                          </div>
                        </div>
                      )}

                      {/* Test Case Rubric Results breakdown */}
                      {sub.test_results && sub.test_results.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {lang === 'vi' ? 'Chi tiết kết quả kiểm thử Docker Sandbox:' : 'Automated Test Cases Results:'}
                          </div>
                          {sub.test_results.map((tc, idx) => {
                            const rawStatus = (tc.status || (tc.passed ? 'ACCEPTED' : 'WRONG_ANSWER')).toUpperCase();
                            const isAccepted = rawStatus === 'ACCEPTED';
                            const isTLE = rawStatus === 'TIME_LIMIT_EXCEEDED';
                            const isRE = rawStatus === 'RUNTIME_ERROR';
                            const isMLE = rawStatus === 'MEMORY_LIMIT_EXCEEDED';
                            const isSE = rawStatus === 'SYSTEM_ERROR';

                            const statusName = isAccepted ? 'Accepted' : (isTLE ? 'Time Limit Exceeded' : (isRE ? 'Runtime Error' : (isMLE ? 'Memory Limit Exceeded' : (isSE ? 'System Error' : 'Wrong Answer'))));
                            const statusColor = isAccepted 
                              ? '#34d399' 
                              : (isTLE 
                                  ? '#f59e0b' 
                                  : (isRE ? '#fb923c' : (isMLE ? '#c084fc' : '#f87171')));

                            return (
                              <div 
                                key={idx} 
                                style={{ 
                                  padding: '10px 14px', borderRadius: '10px', 
                                  background: tc.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.07)', 
                                  border: `1px solid ${tc.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`, 
                                  fontSize: '0.82rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {tc.passed ? <CheckCircle2 size={16} color="#34d399" /> : <AlertTriangle size={16} color={statusColor} />}
                                    <span style={{ fontWeight: 700, color: tc.passed ? 'var(--text-main)' : '#fca5a5' }}>
                                      {tc.criterion}
                                    </span>
                                    {tc.is_hidden && (
                                      <span style={{ fontSize: '0.7rem', color: '#a78bfa', padding: '1px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                                        Hidden Test
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: tc.execution_time_ms >= 5000 ? '#f87171' : 'var(--text-muted)', fontSize: '0.76rem', fontWeight: tc.execution_time_ms >= 5000 ? 700 : 400 }}>
                                      {tc.execution_time_ms}ms
                                    </span>
                                    <span style={{ 
                                      fontWeight: 800, fontSize: '0.78rem', padding: '2px 8px', borderRadius: '6px',
                                      background: tc.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                      color: statusColor,
                                      border: `1px solid ${statusColor}40`
                                    }}>
                                      {statusName} ({tc.score}/{tc.max_score}đ)
                                    </span>
                                  </div>
                                </div>

                                {/* Actual vs Expected Output & Reason for Failure */}
                                {tc.is_hidden ? (
                                  <div style={{ fontSize: '0.74rem', color: '#a78bfa', fontStyle: 'italic', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '6px' }}>
                                    🔒 Hidden Test Case: Input và Expected Output được bảo mật theo cấu hình của giảng viên.
                                  </div>
                                ) : (
                                  !tc.passed && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '4px' }}>
                                      {tc.expected_output && (
                                        <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                                          <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginBottom: '2px' }}>Expected Output:</div>
                                          <div style={{ color: '#34d399', whiteSpace: 'pre-wrap' }}>{tc.expected_output}</div>
                                        </div>
                                      )}
                                      <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginBottom: '2px' }}>Actual Output:</div>
                                        <div style={{ color: '#f87171', whiteSpace: 'pre-wrap' }}>{tc.actual_output || '(Không có kết quả)'}</div>
                                      </div>
                                    </div>
                                  )
                                )}

                                {tc.ai_feedback && !tc.passed && (
                                  <div style={{ fontSize: '0.74rem', color: '#fda4af', marginTop: '2px' }}>
                                    💡 <strong>Chi tiết:</strong> {tc.ai_feedback}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Instructor Feedback Notes (if available) */}
                      {(sub.consensus_notes || sub.reviewer_1_notes) && (
                        <div style={{
                          marginTop: '0.85rem',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(139, 92, 246, 0.08)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa' }}>
                            <User size={13} />
                            <span>{lang === 'vi' ? 'Nhận xét từ Giảng viên:' : 'Instructor Feedback:'}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: '#f1f5f9', lineHeight: 1.5 }}>
                            "{sub.consensus_notes || sub.reviewer_1_notes}"
                          </p>
                        </div>
                      )}

                      {/* Submitted Code Viewer & Artifact Link */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.75rem' }}>
                        {sub.code_content && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedCodeMap(prev => ({ ...prev, [sub.submission_id]: !prev[sub.submission_id] }))}
                              style={{
                                background: 'rgba(139, 92, 246, 0.08)',
                                border: '1px solid rgba(139, 92, 246, 0.25)',
                                color: '#a78bfa',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <FileCode size={13} />
                              <span>
                                {expandedCodeMap[sub.submission_id] 
                                  ? (lang === 'vi' ? 'Ẩn mã nguồn bài nộp' : 'Hide submitted code') 
                                  : (lang === 'vi' ? `Xem mã nguồn đã nộp (${sub.language || 'javascript'})` : `View submitted code (${sub.language || 'javascript'})`)}
                              </span>
                            </button>

                            {expandedCodeMap[sub.submission_id] && (
                              <pre style={{
                                marginTop: '6px',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                background: '#090d16',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: sub.language === 'python' ? '#a78bfa' : '#fbbf24',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-mono, monospace)',
                                maxHeight: '240px',
                                overflow: 'auto',
                                lineHeight: 1.5
                              }}>
                                {sub.code_content}
                              </pre>
                            )}
                          </div>
                        )}

                        {sub.artifact_url && sub.artifact_url.startsWith('http') && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ExternalLink size={13} />
                            <a href={sub.artifact_url} target="_blank" rel="noreferrer" style={{ color: '#c4b5fd', textDecoration: 'none' }}>
                              {sub.artifact_url.replace('https://github.com/', '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
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
                    background: m.sender === 'STUDENT' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: m.sender === 'STUDENT' ? '1px solid rgba(124, 58, 237,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '12px 16px', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.75rem', color: m.sender === 'STUDENT' ? '#c4b5fd' : '#c084fc', marginBottom: '4px' }}>
                    {m.sender === 'STUDENT' ? (lang === 'vi' ? 'Bạn' : 'You') : '🤖 AITA Tutor'}
                  </strong>
                  {m.text}
                </div>
              ))}
              {isChatLoading && (
                <div 
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '80%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px', padding: '12px 16px', fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc'
                  }}
                >
                  <Loader2 size={16} className="animate-spin" />
                  <span>{lang === 'vi' ? 'AITA Socratic Tutor đang phân tích mã nguồn...' : 'AITA Tutor is thinking...'}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="text"
                placeholder={lang === 'vi' ? 'Đặt câu hỏi về kết quả kiểm thử, lỗi logic hoặc cách tối ưu thuật toán...' : 'Ask about test failures, bugs, or optimization...'}
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                disabled={isChatLoading}
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-main)', fontFamily: 'var(--font-main)', fontSize: '0.9rem', outline: 'none' }}
              />
              <button type="submit" className="btn-primary" disabled={isChatLoading}>
                {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {lang === 'vi' ? 'Gửi' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {/* ───── TAB: GIT ANALYTICS & REPO SUBMISSION (FALLBACK) ───── */}
        {activeTab === 'analytics' && renderGitAnalyticsView()}

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
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#f472b6" /> {lang === 'vi' ? 'Đánh giá chéo thành viên nhóm (Peer Audit)' : 'Peer Audit Evaluation'}
              </h3>
              

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
      </main>
    </div>
  );
}
