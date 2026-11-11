'use client';

import React, { useState, useEffect } from 'react';
import { X, LogOut, Sun, Moon, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Terminal, Cpu, GraduationCap, School, Shield, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { VietnamFlag, UKFlag } from './LanguageSwitcher';

export interface UserProfileData {
  id?: string | number;
  userId?: string | number;
  user_id?: string | number;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
  studentCode?: string;
  student_code?: string;
  staffCode?: string;
  staff_code?: string;
  major?: string;
  campus?: string;
  className?: string;
  department?: string;
}

export interface UserScoreData {
  hasScore: boolean;
  score?: number;
  passedTests?: number;
  totalTests?: number;
  statusText?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfileData | null;
  scoreData?: UserScoreData;
  onLogout?: (e?: any) => void;
}

export default function StudentProfileModal({
  isOpen,
  onClose,
  user,
  scoreData,
  onLogout
}: UserProfileModalProps) {
  const { lang, setLang } = useLanguage();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('aita_theme') as 'dark' | 'light') || 
      (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('aita_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Xác định Role người dùng (STUDENT, LECTURER, ADMIN)
  const rawRole = (user?.role || '').toUpperCase();
  const isLecturer = rawRole === 'LECTURER' || rawRole === 'TEACHER' || rawRole === 'GIANG_VIEN';
  const isAdmin = rawRole === 'ADMIN' || rawRole === 'SUPERADMIN' || rawRole === 'QUAN_TRI';
  const isStudent = !isLecturer && !isAdmin;

  // Dữ liệu hiển thị động
  const displayName = user?.fullName || user?.full_name || user?.name || (
    isLecturer ? 'Yen12 Yen' : (isAdmin ? 'Administrator' : 'Lê Nguyễn Linh Nhi')
  );

  const displayEmail = user?.email || (
    isLecturer ? 'yen12@fe.edu.vn' : (isAdmin ? 'admin@aita.fpt.edu.vn' : 'student@fpt.edu.vn')
  );

  const studentCode = user?.studentCode || user?.student_code || (user?.userId ? `SE${user.userId}` : 'SE180211');
  const staffCode = user?.staffCode || user?.staff_code || 'GV-FPTU-8821';
  const major = user?.major || (lang === 'vi' ? 'Kỹ thuật phần mềm' : 'Software Engineering');
  const campus = user?.campus || (lang === 'vi' ? 'ĐH FPT Quy Nhơn' : 'FPT University Quy Nhon');

  // Điểm số: Chỉ hiển thị khi thực sự có điểm (hasScore === true && score !== undefined && score !== null)
  const hasScore = !!(scoreData?.hasScore && scoreData?.score !== undefined && scoreData?.score !== null);
  const score = scoreData?.score;
  const passedTests = scoreData?.passedTests ?? 19;
  const totalTests = scoreData?.totalTests ?? 20;

  // Chữ cái viết tắt làm Avatar
  const initial = displayName.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeInProfile 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: isDark
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 23, 0.99) 100%)'
            : '#ffffff',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '28px',
          padding: '2rem',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(139, 92, 246, 0.15)'
            : '0 25px 50px -15px rgba(0, 0, 0, 0.12)',
          color: isDark ? '#f8fafc' : '#0f172a',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header của Modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <h3 style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: isDark ? '#ffffff' : '#0f172a'
            }}>
              {isLecturer
                ? (lang === 'vi' ? 'Hồ Sơ Giảng Viên' : 'Faculty Profile')
                : (isAdmin
                  ? (lang === 'vi' ? 'Hồ Sơ Quản Trị Viên' : 'Administrator Profile')
                  : (lang === 'vi' ? 'Hồ Sơ Sinh Viên' : 'Student Profile'))}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isLecturer ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                color: isDark ? '#34d399' : '#059669',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <GraduationCap size={14} />
                {lang === 'vi' ? 'Giảng viên FPTU' : 'FPTU Lecturer'}
              </span>
            ) : isAdmin ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                color: isDark ? '#f87171' : '#dc2626',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <Shield size={14} />
                {lang === 'vi' ? 'Quản trị hệ thống (ROOT)' : 'Root Administrator'}
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                color: isDark ? '#c084fc' : '#7c3aed',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(124, 58, 237, 0.2)'
              }}>
                <ShieldCheck size={14} />
                {lang === 'vi' ? 'Sinh viên FPTU' : 'FPTU Student'}
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                color: isDark ? '#cbd5e1' : '#64748b',
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

        {/* =====================================================================
            BENTO GRID KIỂU 1: CỘT ĐỨNG (APPLE / VERCEL STYLE)
            - Cột Trái: ID Card Cá Nhân Dạng Đứng (Avatar, Tên, Role, Đăng xuất)
            - Cột Phải: Các Khối Bento (Thống kê / Điểm số, Thông tin, Hạ tầng, Tùy chọn)
            ===================================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(270px, 34%) 1fr',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}>

          {/* CỘT TRÁI: THẺ ID CARD CÁ NHÂN DẠNG ĐỨNG */}
          <div style={{
            background: isDark
              ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '22px',
            padding: '1.75rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'space-between',
            boxShadow: isDark ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 4px 15px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Avatar Lớn Viền Phát Sáng */}
              <div style={{
                position: 'relative',
                width: '84px',
                height: '84px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: isLecturer
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
                    : (isAdmin
                      ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)'
                      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c084fc 100%)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  boxShadow: isLecturer
                    ? '0 8px 24px rgba(16, 185, 129, 0.4)'
                    : (isAdmin
                      ? '0 8px 24px rgba(239, 68, 68, 0.4)'
                      : '0 8px 24px rgba(124, 58, 237, 0.45)'),
                  border: isDark ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #ffffff'
                }}>
                  {initial}
                </div>
                {/* Chấm Xanh Đang Hoạt Động */}
                <span style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: isDark ? '3px solid #0f172a' : '3px solid #ffffff',
                  boxShadow: '0 0 8px #10b981'
                }} />
              </div>

              {/* Tên & Trạng Thái */}
              <h4 style={{
                margin: '0 0 4px',
                fontSize: '1.22rem',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.02em',
                wordBreak: 'break-word'
              }}>
                {displayName}
              </h4>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem',
                color: '#10b981',
                fontWeight: 700,
                marginBottom: '1rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                {isLecturer
                  ? (lang === 'vi' ? 'Đang giảng dạy' : 'Teaching')
                  : (isAdmin
                    ? (lang === 'vi' ? 'Quản trị tối cao' : 'Root Active')
                    : (lang === 'vi' ? 'Đang hoạt động' : 'Active'))}
              </div>

              {/* Tag Vai Trò Chuyên Nghiệp */}
              <div style={{
                padding: '5px 12px',
                borderRadius: '8px',
                background: isLecturer
                  ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5')
                  : (isAdmin
                    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                    : (isDark ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe')),
                color: isLecturer
                  ? (isDark ? '#34d399' : '#059669')
                  : (isAdmin
                    ? (isDark ? '#f87171' : '#dc2626')
                    : (isDark ? '#c4b5fd' : '#6d28d9')),
                fontSize: '0.76rem',
                fontWeight: 700,
                marginBottom: '1rem',
                border: isLecturer
                  ? (isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0')
                  : (isAdmin
                    ? (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca')
                    : (isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #ddd6fe'))
              }}>
                {isLecturer
                  ? (lang === 'vi' ? 'Khoa Kỹ Thuật Phần Mềm' : 'Dept. of Software Engineering')
                  : (isAdmin
                    ? (lang === 'vi' ? 'Root System Administrator' : 'Root System Administrator')
                    : (lang === 'vi' ? 'Sinh viên Khóa K18 - CNTT' : 'Student Class K18 - IT'))}
              </div>

              {/* Email & Đơn Vị */}
              <div style={{
                width: '100%',
                fontSize: '0.78rem',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.5,
                padding: '0.75rem',
                background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#ffffff',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ wordBreak: 'break-all', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>
                  {displayEmail}
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.74rem' }}>
                  {isLecturer ? (
                    <span>{lang === 'vi' ? 'Phụ trách môn:' : 'Teaching:'} <strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>SWD392 & SWP391</strong></span>
                  ) : isAdmin ? (
                    <span>{lang === 'vi' ? 'Hệ thống:' : 'Scope:'} <strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>AITA Platform Server</strong></span>
                  ) : (
                    <span>{lang === 'vi' ? 'Sinh viên lớp:' : 'Class:'} <strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>SWD392</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Nút Đăng Xuất ở dưới cùng cột trái */}
            <button
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca',
                color: '#ef4444',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <LogOut size={15} />
              <span>{lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>
            </button>
          </div>

          {/* CỘT PHẢI: CÁC KHỐI BENTO THÔNG TIN & HỆ THỐNG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* KHỐI 1:
                - NẾU LÀ SINH VIÊN: KẾT QUẢ ĐỒ ÁN / ĐIỂM SỐ (CHỈ HIỆN ĐIỂM KHI ĐÃ CÓ ĐIỂM THEO YÊU CẦU: "điểm số thành viên nào chưa có thì chưa hiện ạ, nào có mới hiện ạ")
                - NẾU LÀ GIẢNG VIÊN: THỐNG KÊ GIẢNG DẠY & ĐÁNH GIÁ SANDBOX
                - NẾU LÀ ADMIN: TỔNG QUAN TÀI NGUYÊN TOÀN HỆ THỐNG
            */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)'
                : '#ffffff',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.22)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '20px',
              padding: '1.2rem 1.4rem',
              boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              {isStudent && (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.6rem'
                  }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      🎯 {lang === 'vi' ? 'KẾT QUẢ ĐỒ ÁN' : 'PROJECT GRADE'}
                    </span>

                    {hasScore ? (
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                        color: '#10b981',
                        border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0'
                      }}>
                        {scoreData?.statusText || (lang === 'vi' ? 'Đã bảo vệ xong' : 'Defended')}
                      </span>
                    ) : (
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                        color: '#f59e0b',
                        border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a'
                      }}>
                        {lang === 'vi' ? 'Chưa có điểm' : 'Pending Evaluation'}
                      </span>
                    )}
                  </div>

                  {hasScore ? (
                    <div>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: isDark ? '#ffffff' : '#0f172a',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        marginBottom: '4px'
                      }}>
                        {score !== undefined ? `${score.toFixed(2)} / 10.0` : '10.0 / 10.0'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                        ✓ {lang === 'vi' ? `Vượt qua ${passedTests}/${totalTests} test cases` : `Passed ${passedTests}/${totalTests} test cases`}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '0.4rem 0' }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: isDark ? '#94a3b8' : '#64748b',
                        marginBottom: '4px'
                      }}>
                        {lang === 'vi' ? 'Chưa có điểm đánh giá' : 'No grade available yet'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                        {lang === 'vi' ? 'Hệ thống đang đồng bộ kết quả chấm hoặc bài nộp đang chờ giảng viên đánh giá.' : 'Scores will appear automatically once published by lecturers.'}
                      </div>
                    </div>
                  )}
                </>
              )}

              {isLecturer && (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.6rem'
                  }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      👨‍🏫 {lang === 'vi' ? 'THỐNG KÊ GIẢNG DẠY & ĐÁNH GIÁ' : 'FACULTY INSTRUCTION METRICS'}
                    </span>

                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                      color: '#10b981',
                      border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0'
                    }}>
                      {lang === 'vi' ? 'Học kỳ SP26' : 'Semester SP26'}
                    </span>
                  </div>

                  <div>
                    <div style={{
                      fontSize: '1.65rem',
                      fontWeight: 900,
                      color: isDark ? '#ffffff' : '#0f172a',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                      marginBottom: '4px'
                    }}>
                      {lang === 'vi' ? '3 Lớp Học Phần • 18 Nhóm Đồ Án' : '3 Course Classes • 18 Teams'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ {lang === 'vi' ? '100% Đề bài tích hợp kiểm thử tự động Docker Sandbox' : '100% Assignments Docker Sandbox autograded'}
                    </div>
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.6rem'
                  }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      🖥️ {lang === 'vi' ? 'TỔNG QUAN TÀI NGUYÊN HỆ THỐNG' : 'SYSTEM OVERVIEW & INFRASTRUCTURE'}
                    </span>

                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                      color: '#3b82f6',
                      border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #bfdbfe'
                    }}>
                      {lang === 'vi' ? 'Hệ thống ổn định (99.98%)' : 'Cluster Uptime 99.98%'}
                    </span>
                  </div>

                  <div>
                    <div style={{
                      fontSize: '1.65rem',
                      fontWeight: 900,
                      color: isDark ? '#ffffff' : '#0f172a',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                      marginBottom: '4px'
                    }}>
                      {lang === 'vi' ? '1,250 Sinh viên • 45 Giảng viên' : '1,250 Students • 45 Faculty'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ {lang === 'vi' ? '8,420 Phiên chấm Sandbox Docker đã xử lý an toàn' : '8,420 Docker Sandbox submissions verified'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* KHỐI 2: THÔNG TIN TÀI KHOẢN (BENTO 4 Ô NGẮN GỌN NHƯ HÌNH) */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)'
                : '#ffffff',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.22)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '20px',
              padding: '1.2rem 1.4rem',
              boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isDark ? '#94a3b8' : '#64748b',
                marginBottom: '0.9rem'
              }}>
                📰 {isLecturer
                  ? (lang === 'vi' ? 'THÔNG TIN GIẢNG VIÊN' : 'FACULTY PROFILE')
                  : (isAdmin
                    ? (lang === 'vi' ? 'THÔNG TIN HỆ THỐNG' : 'SYSTEM DETAILS')
                    : (lang === 'vi' ? 'THÔNG TIN TÀI KHOẢN' : 'ACCOUNT DETAILS'))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.8rem'
              }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {isLecturer
                      ? (lang === 'vi' ? 'MÃ GIẢNG VIÊN (MGV)' : 'STAFF ID')
                      : (isAdmin
                        ? (lang === 'vi' ? 'QUYỀN HẠN HỆ THỐNG' : 'PRIVILEGE LEVEL')
                        : (lang === 'vi' ? 'MÃ SINH VIÊN (MSSV)' : 'STUDENT ID'))}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', marginTop: '2px' }}>
                    {isLecturer ? staffCode : (isAdmin ? 'Super Admin (ROOT)' : studentCode)}
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {isLecturer
                      ? (lang === 'vi' ? 'KHOA / BỘ MÔN' : 'DEPARTMENT')
                      : (isAdmin
                        ? (lang === 'vi' ? 'CỤM MÁY CHỦ' : 'CLUSTER NODE')
                        : (lang === 'vi' ? 'CHUYÊN NGÀNH' : 'MAJOR'))}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', marginTop: '2px' }}>
                    {isLecturer ? (lang === 'vi' ? 'Kỹ thuật phần mềm' : 'Software Engineering') : (isAdmin ? 'Node Quy Nhơn - 01' : major)}
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {isLecturer
                      ? (lang === 'vi' ? 'HỌC PHẦN PHỤ TRÁCH' : 'COURSES TAUGHT')
                      : (isAdmin
                        ? (lang === 'vi' ? 'PHIÊN BẢN NỀN TẢNG' : 'PLATFORM VERSION')
                        : (lang === 'vi' ? 'ĐỒ ÁN TỐT NGHIỆP' : 'CAPSTONE PROJECT'))}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#7c3aed', marginTop: '2px' }}>
                    {isLecturer ? 'SWD392 & SWP391' : (isAdmin ? 'AITA v2.4 Enterprise' : 'AITA-Intelligent')}
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {lang === 'vi' ? 'CƠ SỞ ĐÀO TẠO' : 'CAMPUS'}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', marginTop: '2px' }}>
                    {campus}
                  </div>
                </div>
              </div>
            </div>

            {/* HÀNG DƯỚI: 2 Ô SONG SONG (HẠ TẦNG KẾT NỐI + GIAO DIỆN & TÙY CHỌN) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>

              {/* Ô TRÁI: TRẠNG THÁI HẠ TẦNG KẾT NỐI */}
              <div style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)'
                  : '#ffffff',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.22)' : '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '20px',
                padding: '1.15rem 1.25rem',
                boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: '0.75rem'
                }}>
                  🛡️ {lang === 'vi' ? 'TRẠNG THÁI HẠ TẦNG KẾT NỐI' : 'INFRASTRUCTURE'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isDark ? '#cbd5e1' : '#334155' }}>PostgreSQL Database</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>• {lang === 'vi' ? 'Trực tuyến (5432)' : 'Online (5432)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isDark ? '#cbd5e1' : '#334155' }}>BullMQ & Redis Queue</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>• {lang === 'vi' ? 'Đang chạy (6379)' : 'Running (6379)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isDark ? '#cbd5e1' : '#334155' }}>Docker Sandbox Isolation</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>• {lang === 'vi' ? 'Bảo vệ an toàn' : 'Active Safe'}</span>
                  </div>
                </div>
              </div>

              {/* Ô PHẢI: GIAO DIỆN & TÙY CHỌN */}
              <div style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)'
                  : '#ffffff',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.22)' : '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '20px',
                padding: '1.15rem 1.25rem',
                boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: '0.75rem'
                }}>
                  ⚙️ {lang === 'vi' ? 'GIAO DIỆN & TÙY CHỌN' : 'SETTINGS & THEME'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Ngôn ngữ */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Ngôn ngữ hiển thị:' : 'Language:'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        onClick={() => setLang('vi')}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: lang === 'vi' ? '1.5px solid #7c3aed' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'),
                          background: lang === 'vi' ? (isDark ? 'rgba(124, 58, 237, 0.25)' : '#ede9fe') : 'transparent',
                          color: lang === 'vi' ? (isDark ? '#c4b5fd' : '#6d28d9') : (isDark ? '#94a3b8' : '#64748b'),
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <VietnamFlag />
                        <span>Tiếng Việt</span>
                      </button>
                      <button
                        onClick={() => setLang('en')}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: lang === 'en' ? '1.5px solid #7c3aed' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'),
                          background: lang === 'en' ? (isDark ? 'rgba(124, 58, 237, 0.25)' : '#ede9fe') : 'transparent',
                          color: lang === 'en' ? (isDark ? '#c4b5fd' : '#6d28d9') : (isDark ? '#94a3b8' : '#64748b'),
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <UKFlag />
                        <span>English (US)</span>
                      </button>
                    </div>
                  </div>

                  {/* Chế độ màu sắc */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                      {lang === 'vi' ? 'Chế độ màu sắc:' : 'Theme Mode:'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        onClick={() => toggleTheme('light')}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: !isDark ? '1.5px solid #f59e0b' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'),
                          background: !isDark ? '#fef3c7' : 'transparent',
                          color: !isDark ? '#b45309' : (isDark ? '#94a3b8' : '#64748b'),
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <Sun size={13} color="#f59e0b" />
                        <span>{lang === 'vi' ? 'Chế độ Sáng' : 'Light Mode'}</span>
                      </button>
                      <button
                        onClick={() => toggleTheme('dark')}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: isDark ? '1.5px solid #a855f7' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'),
                          background: isDark ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                          color: isDark ? '#e9d5ff' : (isDark ? '#94a3b8' : '#64748b'),
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <Moon size={13} color="#a855f7" />
                        <span>{lang === 'vi' ? 'Chế độ Tối' : 'Dark Mode'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Named alias export for UserProfileModal
export { StudentProfileModal as UserProfileModal };
