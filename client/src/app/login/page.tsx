'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Loader2, GraduationCap, School, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import Navigation from '../../components/Navigation';
import { useLanguage } from '../../context/LanguageContext';

// Biểu tượng Google 4 màu chuẩn thương hiệu
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.57l4.02 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

// Biểu tượng GitHub chuẩn thương hiệu
const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

function LoginContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const urlRole = searchParams.get('state') || searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'LECTURER'>(urlRole === 'LECTURER' ? 'LECTURER' : 'STUDENT');
  const [redirectingProvider, setRedirectingProvider] = useState<'google' | 'github' | null>(null);
  const [errorType, setErrorType] = useState<'pending' | 'role_conflict' | 'locked' | 'general' | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  // Từ điển ngôn ngữ
  const t = {
    vi: {
      title: 'Đăng nhập vào AITA',
      studentRole: 'Sinh viên',
      lecturerRole: 'Giảng viên',
      studentSub: 'Cổng thông tin sinh viên & đồ án học phần',
      lecturerSub: 'Cổng quản lý giảng viên & đánh giá đồ án',
      continueGoogleStudent: 'Tiếp tục với Google',
      continueGoogleLecturer: 'Tiếp tục với Google',
      continueGoogle: 'Tiếp tục với Google',
      continueGithub: 'Tiếp tục với GitHub',
      redirecting: 'Đang chuyển hướng xác thực...',
      footerNotice: 'Đăng nhập bảo mật qua Google Workspace SSO.',
      errorGoogleDenied: 'Bạn đã hủy đăng nhập bằng tài khoản Google.',
      errorGithubDenied: 'Bạn đã hủy đăng nhập bằng tài khoản GitHub.',
      errorGeneral: 'Đăng nhập không thành công. Vui lòng thử lại sau.'
    },
    en: {
      title: 'Sign in to AITA',
      studentRole: 'Student',
      lecturerRole: 'Lecturer',
      studentSub: 'Student portal & project assignments',
      lecturerSub: 'Lecturer portal & grading system',
      continueGoogleStudent: 'Continue with Google',
      continueGoogleLecturer: 'Continue with Google',
      continueGoogle: 'Continue with Google',
      continueGithub: 'Continue with GitHub',
      redirecting: 'Redirecting to sign in...',
      footerNotice: 'Secure sign-in via Google Workspace SSO.',
      errorGoogleDenied: 'Google sign in was cancelled.',
      errorGithubDenied: 'GitHub sign in was cancelled.',
      errorGeneral: 'Sign in failed. Please try again.'
    }
  };

  const currentT = t[lang];

  useEffect(() => {
    const err = searchParams.get('error');
    const msg = searchParams.get('message');

    if (err === 'LECTURER_PENDING_APPROVAL' || msg?.includes('chờ Quản trị viên') || msg?.includes('phê duyệt')) {
      setErrorType('pending');
      setAlertMessage(msg || 'Tài khoản Giảng viên của bạn đã được gửi vào hệ thống và đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng liên hệ Admin để được cấp quyền truy cập.');
    } else if (err === 'ROLE_CONFLICT_LECTURER_AS_STUDENT' || msg?.includes('không được đăng nhập cho Sinh viên')) {
      setErrorType('role_conflict');
      setAlertMessage('Email này đã đăng nhập cho Giảng viên, không được đăng nhập cho Sinh viên!');
    } else if (err === 'ROLE_CONFLICT_STUDENT_AS_LECTURER' || msg?.includes('không được đăng nhập cho Giảng viên')) {
      setErrorType('role_conflict');
      setAlertMessage('Email này đã đăng nhập cho Sinh viên, không được đăng nhập cho Giảng viên!');
    } else if (err === 'ACCOUNT_LOCKED') {
      setErrorType('locked');
      setAlertMessage('Tài khoản của bạn đã bị khóa hoặc từ chối phê duyệt bởi Quản trị viên.');
    } else if (msg) {
      setErrorType('general');
      setAlertMessage(msg);
    } else if (err === 'google_denied') {
      setErrorType('general');
      setAlertMessage(currentT.errorGoogleDenied);
    } else if (err === 'github_denied') {
      setErrorType('general');
      setAlertMessage(currentT.errorGithubDenied);
    } else if (err) {
      setErrorType('general');
      setAlertMessage(currentT.errorGeneral);
    }
  }, [searchParams, currentT]);

  // Chuyển hướng trực tiếp tới Google OAuth 2.0 chính thức kèm state là vai trò đã chọn
  const handleGoogleLogin = () => {
    setRedirectingProvider('google');
    setErrorType(null);
    setAlertMessage('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('intended_role', selectedRole);
    }
    const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/callback/google');
    const scope = encodeURIComponent('openid email profile');
    const state = encodeURIComponent(selectedRole);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  // Chuyển hướng trực tiếp tới GitHub OAuth
  const handleGitHubLogin = () => {
    setRedirectingProvider('github');
    setErrorType(null);
    setAlertMessage('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('intended_role', selectedRole);
    }
    const clientId = (process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '').trim();
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/callback/github');
    const scope = encodeURIComponent('read:user user:email');
    const state = encodeURIComponent(selectedRole);
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    window.location.href = githubAuthUrl;
  };

  return (
    <>
      <Navigation />
      <main style={{ 
        minHeight: 'calc(100vh - 70px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative'
      }}>
        {/* Subtle Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '25%',
          width: '380px',
          height: '380px',
          background: 'var(--accent-primary)',
          filter: 'blur(180px)',
          opacity: 0.14,
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Card Đăng Nhập */}
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.6rem 2.2rem',
          position: 'relative',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          textAlign: 'center'
        }}>
          {/* Logo icon */}
          <div style={{
            background: 'var(--accent-gradient)',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px -4px rgba(59, 130, 246, 0.45)',
            margin: '0 auto 1.2rem'
          }}>
            <Bot size={30} color="#fff" />
          </div>

          {/* Heading */}
          <h1 style={{ 
            fontSize: '1.65rem', 
            fontWeight: 800, 
            marginBottom: '0.4rem', 
            letterSpacing: '-0.02em', 
            color: 'var(--text-main)' 
          }}>
            {currentT.title}
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.45 }}>
            {selectedRole === 'STUDENT' ? currentT.studentSub : currentT.lecturerSub}
          </p>

          {/* Role Selector Segmented Control: Sinh viên vs Giảng viên */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '1.5rem',
            gap: '4px'
          }}>
            <button
              type="button"
              id="role-btn-student"
              onClick={() => { setSelectedRole('STUDENT'); setErrorType(null); setAlertMessage(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: selectedRole === 'STUDENT' ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
                color: selectedRole === 'STUDENT' ? '#ffffff' : 'var(--text-dim)',
                boxShadow: selectedRole === 'STUDENT' ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: selectedRole === 'STUDENT' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                fontSize: '0.9rem',
                fontWeight: selectedRole === 'STUDENT' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <GraduationCap size={18} color={selectedRole === 'STUDENT' ? '#60a5fa' : 'currentColor'} />
              <span>{currentT.studentRole}</span>
            </button>

            <button
              type="button"
              id="role-btn-lecturer"
              onClick={() => { setSelectedRole('LECTURER'); setErrorType(null); setAlertMessage(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: selectedRole === 'LECTURER' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: selectedRole === 'LECTURER' ? '#ffffff' : 'var(--text-dim)',
                boxShadow: selectedRole === 'LECTURER' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: selectedRole === 'LECTURER' ? 'rgba(16, 185, 129, 0.5)' : 'transparent',
                fontSize: '0.9rem',
                fontWeight: selectedRole === 'LECTURER' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <School size={18} color={selectedRole === 'LECTURER' ? '#34d399' : 'currentColor'} />
              <span>{currentT.lecturerRole}</span>
            </button>
          </div>

          {/* Alert Banners */}
          {errorType === 'pending' && (
            <div style={{
              marginBottom: '1.4rem',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fef3c7',
              fontSize: '0.87rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              lineHeight: 1.45,
            }}>
              <Clock size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#fcd34d', marginBottom: '2px' }}>
                  Tài khoản Giảng viên đang chờ duyệt
                </div>
                <div>{alertMessage}</div>
              </div>
            </div>
          )}

          {errorType === 'role_conflict' && (
            <div style={{
              marginBottom: '1.4rem',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fee2e2',
              fontSize: '0.87rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              lineHeight: 1.45,
            }}>
              <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '2px' }}>
                  Xung đột vai trò tài khoản
                </div>
                <div>{alertMessage}</div>
              </div>
            </div>
          )}

          {errorType === 'locked' && (
            <div style={{
              marginBottom: '1.4rem',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fee2e2',
              fontSize: '0.87rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              lineHeight: 1.45,
            }}>
              <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '2px' }}>
                  Tài khoản bị khóa
                </div>
                <div>{alertMessage}</div>
              </div>
            </div>
          )}

          {errorType === 'general' && alertMessage && (
            <div style={{
              marginBottom: '1.4rem',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.86rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.45,
            }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{alertMessage}</div>
            </div>
          )}

          {/* Nút Đăng Nhập Google Workspace Chính Thức */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              type="button"
              id="google-login-btn"
              disabled={redirectingProvider !== null}
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                borderRadius: '14px',
                background: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#1f2937',
                fontSize: '0.94rem',
                fontWeight: 600,
                cursor: redirectingProvider !== null ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.18)',
                opacity: redirectingProvider === 'google' ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (!redirectingProvider) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.28)';
                }
              }}
              onMouseLeave={(e) => {
                if (!redirectingProvider) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.18)';
                }
              }}
            >
              {redirectingProvider === 'google' ? (
                <>
                  <Loader2 size={20} className="animate-spin" color="#1f2937" />
                  <span>{currentT.redirecting}</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>{selectedRole === 'LECTURER' ? currentT.continueGoogleLecturer : currentT.continueGoogleStudent}</span>
                </>
              )}
            </button>

            {/* Nút Đăng Nhập GitHub Phụ */}
            <button
              type="button"
              id="github-login-btn"
              disabled={redirectingProvider !== null}
              onClick={handleGitHubLogin}
              style={{
                width: '100%',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                fontSize: '0.94rem',
                fontWeight: 600,
                cursor: redirectingProvider !== null ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                opacity: redirectingProvider === 'github' ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (!redirectingProvider) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!redirectingProvider) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              {redirectingProvider === 'github' ? (
                <>
                  <Loader2 size={20} className="animate-spin" color="#ffffff" />
                  <span>{currentT.redirecting}</span>
                </>
              ) : (
                <>
                  <GitHubIcon />
                  <span>{currentT.continueGithub}</span>
                </>
              )}
            </button>
          </div>

          {/* Dòng ghi chú chân trang */}
          <p style={{
            marginTop: '1.6rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.2rem'
          }}>
            {currentT.footerNotice}
          </p>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
