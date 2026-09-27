'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import { 
  ShieldCheck, Key, MessageSquareText, Activity, 
  Server, Database, Plus, RefreshCw, Edit2, Trash2,
  Users, BookOpen, Check, X, Lock, CheckCircle2, AlertTriangle, Cpu,
  Bot, LogOut, ChevronRight, ExternalLink, Sparkles, Terminal
} from 'lucide-react';

interface AIKeyItem {
  id: number;
  provider: string;
  mask: string;
  status: string;
  statusColor: string;
  usage: string;
  last: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  status: string;
}

interface CourseItem {
  id: number;
  code: string;
  name: string;
  semester: string;
  lecturer: string;
  teamsCount?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'prompts' | 'users' | 'courses' | 'health' | 'database'>('keys');

  // Key Pool State (UC-15)
  const [keys, setKeys] = useState<AIKeyItem[]>([
    { id: 1, provider: 'Google Gemini 1.5 Pro', mask: 'AIzaSyB...9KjA', status: 'Active', statusColor: 'var(--accent-success)', usage: '4,521', last: '2 mins ago' },
    { id: 2, provider: 'Google Gemini 1.5 Flash', mask: 'AIzaSyX...2MwQ', status: 'Rate Limited (Cooldown)', statusColor: 'var(--accent-error)', usage: '1,200', last: '15 mins ago' },
    { id: 3, provider: 'OpenAI GPT-4o', mask: 'sk-proj...7T3A', status: 'Active', statusColor: 'var(--accent-success)', usage: '8,922', last: 'Just now' },
    { id: 4, provider: 'Anthropic Claude 3.5', mask: 'sk-ant...9Lq1', status: 'Standby / Fallback', statusColor: 'var(--text-muted)', usage: '450', last: '1 hour ago' },
  ]);

  // Users State (UC-13)
  const [users, setUsers] = useState<UserItem[]>([]);
  // Courses State (UC-14)
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  // Course Creation Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSemester, setNewSemester] = useState('FA26');
  const [newLecturerId, setNewLecturerId] = useState<number | string>('');
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Database Inspector State
  const [dbSummary, setDbSummary] = useState<Record<string, number>>({ users: 0, courses: 0, teams: 0, team_members: 0 });
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const [modalError, setModalError] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper để lấy token hoặc tự động cấp token hợp lệ cho Admin
  const getToken = async (): Promise<string> => {
    let token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      try {
        const u = localStorage.getItem('user');
        const userObj = u ? JSON.parse(u) : null;
        const email = userObj?.email || 'lenguyenanhmai05@gmail.com';
        const loginRes = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName: userObj?.fullName || 'AMai', role: 'ADMIN' })
        });
        if (loginRes.ok) {
          const lData = await loginRes.json();
          token = lData.token;
          if (token) localStorage.setItem('token', token);
          if (!u && lData.user) localStorage.setItem('user', JSON.stringify(lData.user));
        }
      } catch (e) {
        console.error('Admin auto auth error:', e);
      }
    }
    return token || '';
  };

  // Fetch real data from PostgreSQL backend
  const fetchAdminData = async () => {
    try {
      const token = await getToken();
      const authHeader: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Fetch Users
      const uRes = await fetch('http://localhost:5000/api/auth/users', { headers: { ...authHeader } });
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.users) {
          const mappedUsers = uData.users.map((u: any) => ({
            id: u.user_id,
            name: u.full_name,
            email: u.email,
            role: u.role,
            status: 'Active'
          }));
          setUsers(mappedUsers);
          if (mappedUsers.length > 0 && !newLecturerId) {
            const defaultLec = mappedUsers.find((u: any) => u.role === 'LECTURER' || u.role === 'ADMIN');
            if (defaultLec) setNewLecturerId(defaultLec.id);
          }
        }
      }

      // 2. Fetch Courses
      const cRes = await fetch('http://localhost:5000/api/courses', { headers: { ...authHeader } });
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.courses) {
          setCourses(cData.courses.map((c: any) => ({
            id: c.course_id,
            code: c.course_code,
            name: c.course_name,
            semester: c.semester,
            lecturer: c.lecturer_name || 'Dr. Nguyen Van Giang',
            teamsCount: c.teamsCount || 1
          })));
        }
      }

      // 3. Fetch DB Inspect Summary
      const dbRes = await fetch('http://localhost:5000/api/auth/db-inspect', { headers: { ...authHeader } });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        if (dbData.tables) {
          setDbSummary(dbData.tables);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  // Fetch rows for a specific database table
  const fetchTableRows = async (tableName: string) => {
    setSelectedTable(tableName);
    setLoadingTable(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/auth/db-inspect/${tableName}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTableRows(data.rows || []);
      }
    } catch (err) {
      console.error('Error loading table rows:', err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        setCurrentUser(JSON.parse(u));
      }
    } catch (e) {}
    fetchAdminData();
    fetchTableRows('users');
  }, []);

  const handleToggleKey = (id: number) => {
    setKeys(prev => prev.map(k => {
      if (k.id === id) {
        const nextStatus = k.status === 'Active' ? 'Disabled' : 'Active';
        return {
          ...k,
          status: nextStatus,
          statusColor: nextStatus === 'Active' ? 'var(--accent-success)' : 'var(--text-muted)'
        };
      }
      return k;
    }));
    triggerToast(lang === 'vi' ? 'Đã cập nhật trạng thái khóa API!' : 'API key status updated!');
  };

  const handleChangeRole = async (userId: number, newRole: 'ADMIN' | 'LECTURER' | 'STUDENT') => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        triggerToast(lang === 'vi' ? `Đã cập nhật vai trò người dùng thành ${newRole} trong CSDL!` : `User role updated to ${newRole}!`);
        fetchAdminData();
      } else {
        const data = await res.json();
        triggerToast(data.message || 'Lỗi khi cập nhật vai trò.');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Không thể kết nối đến máy chủ.');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!newCode.trim() || !newName.trim() || !newSemester.trim()) {
      setModalError(lang === 'vi' ? 'Vui lòng điền đầy đủ thông tin học phần!' : 'Please fill all course fields!');
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
          course_code: newCode.trim().toUpperCase(),
          course_name: newName.trim(),
          semester: newSemester.trim().toUpperCase(),
          lecturer_id: newLecturerId ? Number(newLecturerId) : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(lang === 'vi' ? `Tạo học phần ${newCode.toUpperCase()} thành công!` : `Course ${newCode} created successfully!`);
        setShowCourseModal(false);
        setNewCode('');
        setNewName('');
        await fetchAdminData();
        await fetchTableRows(selectedTable);
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

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '25px',
          right: '25px',
          zIndex: 1000,
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
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          SIDEBAR BÊN TRÁI RIÊNG CHO TRANG ADMIN (LEFT SIDEBAR)
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
          <div style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)',
            flexShrink: 0
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#fff' }}>
                AITA<span style={{ color: '#ef4444' }}>.ADMIN</span>
              </span>
              <span style={{ 
                fontSize: '0.62rem', 
                background: 'rgba(239, 68, 68, 0.2)', 
                color: '#f87171', 
                padding: '1px 5px', 
                borderRadius: '4px',
                fontWeight: 700 
              }}>ROOT</span>
            </div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              SWD392 • Architecture Core
            </span>
          </div>
        </div>

        {/* Menu Items (Hệ thống / System Modules) */}
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
            {lang === 'vi' ? 'Hệ thống Quản trị' : 'System Administration'}
          </span>

          {/* Item 1: Key Pool */}
          <button
            onClick={() => setActiveTab('keys')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'keys' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
              background: activeTab === 'keys' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === 'keys' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'keys' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={18} color={activeTab === 'keys' ? '#f87171' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Kho Khóa AI (Key Pool)' : 'AI Key Pool'}</span>
            </div>
            {activeTab === 'keys' && <ChevronRight size={15} color="#f87171" />}
          </button>

          {/* Item 2: Prompt Templates */}
          <button
            onClick={() => setActiveTab('prompts')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'prompts' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
              background: activeTab === 'prompts' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === 'prompts' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'prompts' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquareText size={18} color={activeTab === 'prompts' ? '#f87171' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Mẫu Prompt Hệ thống' : 'Prompt Templates'}</span>
            </div>
            {activeTab === 'prompts' && <ChevronRight size={15} color="#f87171" />}
          </button>

          {/* Item 3: Users RBAC */}
          <button
            onClick={() => setActiveTab('users')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'users' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
              background: activeTab === 'users' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'users' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color={activeTab === 'users' ? '#f87171' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Tài khoản & Phân quyền' : 'Users & RBAC'}</span>
            </div>
            {activeTab === 'users' && <ChevronRight size={15} color="#f87171" />}
          </button>

          {/* Item 4: Courses & Lecturers */}
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'courses' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
              background: activeTab === 'courses' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
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
              <BookOpen size={18} color={activeTab === 'courses' ? '#f87171' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Học phần & Giảng viên' : 'Courses & Lecturers'}</span>
            </div>
            {activeTab === 'courses' && <ChevronRight size={15} color="#f87171" />}
          </button>

          {/* Item 5: System Health */}
          <button
            onClick={() => setActiveTab('health')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'health' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
              background: activeTab === 'health' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === 'health' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'health' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color={activeTab === 'health' ? '#f87171' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Giám sát Máy chủ & Docker' : 'System Health'}</span>
            </div>
            {activeTab === 'health' && <ChevronRight size={15} color="#f87171" />}
          </button>

          {/* Item 6: PostgreSQL Database Inspector */}
          <button
            onClick={() => setActiveTab('database')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              border: activeTab === 'database' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              background: activeTab === 'database' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'database' ? '#ffffff' : 'var(--text-dim)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'database' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} color={activeTab === 'database' ? '#38bdf8' : 'currentColor'} />
              <span>{lang === 'vi' ? 'Cơ sở Dữ liệu (PostgreSQL)' : 'Database Inspector'}</span>
            </div>
            {activeTab === 'database' && <ChevronRight size={15} color="#38bdf8" />}
          </button>

          {/* Shortcuts section */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 12px',
              display: 'block',
              marginBottom: '8px'
            }}>
              {lang === 'vi' ? 'Xem các cổng người dùng' : 'View Portals'}
            </span>

            <Link href="/lecturer" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 14px',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.84rem',
              textDecoration: 'none',
              transition: 'all 0.15s'
            }}>
              <ExternalLink size={15} />
              <span>{lang === 'vi' ? 'Cổng Giảng viên' : 'Lecturer Portal'}</span>
            </Link>

            <Link href="/student" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 14px',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.84rem',
              textDecoration: 'none',
              transition: 'all 0.15s'
            }}>
              <ExternalLink size={15} />
              <span>{lang === 'vi' ? 'Cổng Sinh viên' : 'Student Portal'}</span>
            </Link>
          </div>
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
              background: 'linear-gradient(135deg, #ef4444, #991b1b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              AM
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName || 'AMai'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email || 'lenguyenanhmai05@gmail.com'}
              </div>
            </div>
          </div>

          <button
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
              <span>Admin Control</span>
              <span>/</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>
                {activeTab === 'keys' && (lang === 'vi' ? 'Kho Khóa AI' : 'AI Key Pool')}
                {activeTab === 'prompts' && (lang === 'vi' ? 'Mẫu Prompt' : 'Prompt Templates')}
                {activeTab === 'users' && (lang === 'vi' ? 'Quản lý Tài khoản' : 'User Accounts')}
                {activeTab === 'courses' && (lang === 'vi' ? 'Học phần' : 'Courses')}
                {activeTab === 'health' && (lang === 'vi' ? 'Giám sát Máy chủ' : 'System Health')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <LanguageSwitcher />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              {lang === 'vi' ? 'Sandbox: Sẵn sàng' : 'Sandbox: Ready'}
            </div>
          </div>
        </header>

        {/* Nội dung theo từng Tab */}
        <div style={{ padding: '2rem 2.5rem', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          
          {/* TAB 1: API KEY POOL (UC-15) */}
          {activeTab === 'keys' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
                    {lang === 'vi' ? 'Quản lý Kho Khóa AI & Thuật toán Xoay vòng (Key Rotation)' : 'AI API Key Pool Management'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' 
                      ? 'Tất cả API Key được mã hóa AES-256 at-rest. Hệ thống tự động chuyển đổi sang Key dự phòng khi gặp lỗi HTTP 429 (Rate Limit).'
                      : 'All API keys are encrypted with AES-256 at-rest. System dynamically failovers to fallback keys upon HTTP 429 rate limit.'}
                  </p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => alert(lang === 'vi' ? 'Modal thêm khóa AI mới sẵn sàng!' : 'Add Key modal ready!')}>
                  <Plus size={16} /> {lang === 'vi' ? 'Thêm Khóa AI Mới' : 'Add New Key'}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Nhà cung cấp' : 'Provider'}</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Mã Khóa (Masked)' : 'Key Mask'}</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Lượt gọi' : 'Usage Count'}</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Lần dùng cuối' : 'Last Used'}</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Hành động' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{row.provider}</td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', color: '#93c5fd' }}>{row.mask}</td>
                        <td style={{ padding: '16px', color: row.statusColor, fontWeight: 600 }}>{row.status}</td>
                        <td style={{ padding: '16px' }}>{row.usage} reqs</td>
                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{row.last}</td>
                        <td style={{ padding: '16px' }}>
                          <button 
                            onClick={() => handleToggleKey(row.id)}
                            className="btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          >
                            {row.status === 'Active' ? (lang === 'vi' ? 'Tạm dừng' : 'Disable') : (lang === 'vi' ? 'Kích hoạt' : 'Enable')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PROMPT TEMPLATES (UC-16) */}
          {activeTab === 'prompts' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
                    {lang === 'vi' ? 'Quản lý Mẫu System Prompt (AI Prompt Templates)' : 'System Prompt Templates'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Định hình phong cách chấm bài của AI và gợi ý Socratic cho sinh viên với quản lý phiên bản (v1.0, v2.1).' : 'Version-controlled prompts for automated grading and Socratic tutoring.'}
                  </p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <Plus size={16} /> {lang === 'vi' ? 'Tạo mẫu Prompt mới' : 'Create Template'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Clean Architecture Code Review</h4>
                    <span className="badge badge-info">v2.1</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px' }}>
                    "Bạn là Kiến trúc sư Phần mềm cao cấp phụ trách chấm đồ án SWD392. Đánh giá tính phân tầng Clean Architecture, các nguyên lý SOLID và bảo mật kết nối. Trả lời dưới định dạng Markdown chuẩn."
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>{lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}</button>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>{lang === 'vi' ? 'Nhân bản (Clone)' : 'Clone v2.2'}</button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Socratic AI Tutor Assistant</h4>
                    <span className="badge badge-info">v1.0</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px' }}>
                    "Bạn là Trợ lý AI Giảng dạy phương pháp Socratic. TUYỆT ĐỐI KHÔNG giải bài trực tiếp hay đưa code copy-paste cho sinh viên. Chỉ đặt câu hỏi dẫn dắt, gợi ý tư duy thuật toán và chỉ ra vị trí lỗi logic."
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>{lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}</button>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>{lang === 'vi' ? 'Nhân bản (Clone)' : 'Clone v1.1'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER ACCOUNTS (UC-13) */}
          {activeTab === 'users' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
                    {lang === 'vi' ? 'Quản lý Tài khoản & Phân quyền Người dùng (RBAC)' : 'User Accounts & Roles Management'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Quản trị viên phân định các vai trò: ADMIN, LECTURER (Giảng viên) và STUDENT (Sinh viên).' : 'Manage system users and access control roles (ADMIN, LECTURER, STUDENT).'}
                  </p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => alert('Thêm người dùng mới')}>
                  <Plus size={16} /> {lang === 'vi' ? 'Thêm Người Dùng' : 'Add User'}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Họ và tên' : 'Full Name'}</th>
                      <th style={{ padding: '12px 16px' }}>Email</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Vai trò hiện tại' : 'Current Role'}</th>
                      <th style={{ padding: '12px 16px' }}>{lang === 'vi' ? 'Chuyển đổi vai trò' : 'Change Role'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '16px', color: '#60a5fa' }}>{u.email}</td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${u.role === 'ADMIN' ? 'badge-error' : (u.role === 'LECTURER' ? 'badge-success' : 'badge-info')}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select 
                            value={u.role}
                            onChange={e => handleChangeRole(u.id, e.target.value as any)}
                            style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: '#fff',
                              padding: '6px 10px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="LECTURER">LECTURER</option>
                            <option value="STUDENT">STUDENT</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COURSES (UC-14) */}
          {activeTab === 'courses' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
                    {lang === 'vi' ? 'Học phần & Phân công Giảng viên phụ trách' : 'Courses & Instructor Assignments'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Khởi tạo các môn học trong học kỳ và chỉ định giảng viên quản lý.' : 'Initialize courses and assign designated lecturers.'}
                  </p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowCourseModal(true)}>
                  <Plus size={16} /> {lang === 'vi' ? 'Thêm Học Phần Mới' : 'Create Course'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {courses.map(c => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <span className="badge badge-info" style={{ marginBottom: '6px' }}>{c.code}</span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.name}</h4>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
                      <p>{lang === 'vi' ? 'Học kỳ:' : 'Semester:'} <strong style={{ color: '#fff' }}>{c.semester}</strong></p>
                      <p>{lang === 'vi' ? 'Giảng viên phụ trách:' : 'Lecturer:'} <strong style={{ color: '#34d399' }}>{c.lecturer}</strong></p>
                      <p>{lang === 'vi' ? 'Số nhóm đồ án:' : 'Active Teams:'} <strong style={{ color: '#60a5fa' }}>{c.teamsCount} Teams</strong></p>
                    </div>
                    <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                      {lang === 'vi' ? 'Đổi Giảng viên phụ trách' : 'Reassign Lecturer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: HEALTH */}
          {activeTab === 'health' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
                    {lang === 'vi' ? 'Giám sát Tài nguyên & Máy chủ (System Health)' : 'System Health & Metrics'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Độ sẵn sàng của REST API, PostgreSQL, Redis Queue và Docker Sandbox containers.' : 'Availability and metrics of REST API, PostgreSQL, Redis, and Docker Sandboxes.'}
                  </p>
                </div>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => triggerToast(lang === 'vi' ? 'Đã làm mới thông số hệ thống!' : 'System metrics refreshed!')}>
                  <RefreshCw size={16} /> {lang === 'vi' ? 'Làm mới số liệu' : 'Refresh Metrics'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <Server size={32} color="#34d399" />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Express Backend API</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>UP (Port 5000)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <Database size={32} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Database (PostgreSQL)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>Connected (Port 5432)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(167, 139, 250, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                  <Cpu size={32} color="#a78bfa" />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Docker Sandbox Runner</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a78bfa' }}>Isolated &amp; Ready</div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                {`[INFO] 2026-09-27T11:45:00Z GET /api/health - 200 OK (3ms)
[INFO] 2026-09-27T11:50:12Z POST /api/submissions - Enqueueing Docker Sandbox Job: submission_id=1
[INFO] 2026-09-27T11:50:14Z DockerSandbox - Container aita-sandbox-runner completed in 142ms (EXIT 0).
[INFO] 2026-09-27T11:50:15Z AI_Engine - Evaluated Clean Architecture rubric rules with Gemini 1.5 Pro.
[AUTH] 2026-09-27T11:58:30Z Google OAuth - Authenticated Root Admin: lenguyenanhmai05@gmail.com`}
              </div>
            </div>
          )}

          {/* TAB 6: DATABASE INSPECTOR (POSTGRESQL VIEWER) */}
          {activeTab === 'database' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header Box */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-info" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                        PostgreSQL 16 (Docker)
                      </span>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                        {lang === 'vi' ? 'Khám Phá Cơ Sở Dữ Liệu PostgreSQL (Live DB Inspector)' : 'PostgreSQL Live Database Inspector'}
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' 
                        ? 'Dữ liệu được lưu trữ tập trung tại PostgreSQL trong Docker container `aita_postgres` (Port 5432). Xem và truy vấn dữ liệu trực tiếp dưới đây.'
                        : 'Centralized relational storage in PostgreSQL Docker container `aita_postgres` (Port 5432). Inspect and query tables below.'}
                    </p>
                  </div>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => {
                      fetchAdminData();
                      fetchTableRows(selectedTable);
                      triggerToast(lang === 'vi' ? 'Đã làm mới dữ liệu từ PostgreSQL!' : 'Refreshed from PostgreSQL!');
                    }}
                  >
                    <RefreshCw size={16} /> {lang === 'vi' ? 'Làm mới CSDL' : 'Refresh DB'}
                  </button>
                </div>

                {/* Connection Details Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Thông số kết nối (Host & Port)' : 'Connection Host & Port'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#60a5fa', fontWeight: 600 }}>
                      localhost:5432 / aita_db
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      User: <strong style={{ color: '#fff' }}>aita_user</strong> • Container: <strong style={{ color: '#34d399' }}>aita_postgres</strong>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Tệp DDL & Dữ liệu mẫu' : 'DDL Schema & Seed Scripts'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#f59e0b' }}>
                      database/schema.sql
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#10b981', marginTop: '2px' }}>
                      database/seed.sql
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Cách xem qua phần mềm thứ 3' : 'External GUI Viewers'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                      DBeaver / Beekeeper / VS Code Extension
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Mật khẩu DB: <code style={{ color: '#c084fc' }}>aita_password_123</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Selector & Live Rows */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      {lang === 'vi' ? `Xem dữ liệu thực tế bảng: "${selectedTable}"` : `Live Table Rows: "${selectedTable}"`}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? `Hiển thị ${tableRows.length} bản ghi mới nhất từ bảng ${selectedTable}` : `Showing ${tableRows.length} rows from table ${selectedTable}`}
                    </span>
                  </div>

                  {/* Table Switcher Tabs */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'users', label: 'users', count: dbSummary.users || 0 },
                      { key: 'courses', label: 'courses', count: dbSummary.courses || 0 },
                      { key: 'teams', label: 'teams', count: dbSummary.teams || 0 },
                      { key: 'team_members', label: 'team_members', count: dbSummary.team_members || 0 },
                    ].map((tbl) => (
                      <button
                        key={tbl.key}
                        onClick={() => fetchTableRows(tbl.key)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: selectedTable === tbl.key ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid var(--border-color)',
                          background: selectedTable === tbl.key ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                          color: selectedTable === tbl.key ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{tbl.label}</span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '9999px' }}>
                          {tbl.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTable ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                    <p>{lang === 'vi' ? 'Đang truy vấn bảng từ PostgreSQL...' : 'Querying PostgreSQL table...'}</p>
                  </div>
                ) : tableRows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
                    <p>{lang === 'vi' ? 'Bảng này hiện chưa có bản ghi nào.' : 'No records found in this table.'}</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', background: 'rgba(0,0,0,0.3)' }}>
                          {Object.keys(tableRows[0]).map((col) => (
                            <th key={col} style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            {Object.entries(row).map(([k, val], cIdx) => (
                              <td key={cIdx} style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                                {val === null || val === undefined ? (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                                ) : typeof val === 'object' ? (
                                  <code style={{ fontSize: '0.75rem', color: '#93c5fd' }}>{JSON.stringify(val)}</code>
                                ) : k === 'email' ? (
                                  <span style={{ color: '#60a5fa' }}>{String(val)}</span>
                                ) : k === 'role' ? (
                                  <span className={`badge ${val === 'ADMIN' ? 'badge-error' : (val === 'LECTURER' ? 'badge-success' : 'badge-info')}`} style={{ fontSize: '0.72rem' }}>
                                    {String(val)}
                                  </span>
                                ) : (
                                  <span>{String(val)}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: TẠO HỌC PHẦN MỚI (CREATE COURSE FOR ADMIN) */}
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
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {lang === 'vi' ? 'Thêm Học Phần Mới' : 'Create New Course'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Ghi trực tiếp vào bảng `courses` trong PostgreSQL' : 'Insert into PostgreSQL `courses` table'}
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
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
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
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
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
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value.toUpperCase())}
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
                  {lang === 'vi' ? 'Chỉ định Giảng viên phụ trách:' : 'Assigned Lecturer:'}
                </label>
                <select
                  value={newLecturerId}
                  onChange={(e) => setNewLecturerId(e.target.value)}
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
                  {users
                    .filter((u) => u.role === 'LECTURER' || u.role === 'ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) - {u.email}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowCourseModal(false)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" disabled={submittingCourse} className="btn-primary" style={{ fontSize: '0.85rem', gap: '8px' }}>
                  {submittingCourse ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{lang === 'vi' ? 'Lưu Học Phần' : 'Save Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
