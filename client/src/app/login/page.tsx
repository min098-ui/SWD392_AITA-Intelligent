'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Loader2, GraduationCap, School } from 'lucide-react';
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
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
  const [redirectingProvider, setRedirectingProvider] = useState<'google' | 'github' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Từ điển ngôn ngữ chuẩn tối giản
  const t = {
    vi: {
      title: 'Đăng nhập vào AITA',
      studentRole: 'Sinh viên',
      lecturerRole: 'Giảng viên',
      studentSub: 'Cổng sinh viên: Nộp bài đồ án, xem điểm & AI chấm code',
      lecturerSub: 'Cổng giảng viên: Chấm bài nộp, cấu hình Rubric & quản lý lớp',
      continueGoogle: 'Tiếp tục với Google',
      continueGithub: 'Tiếp tục với GitHub',
      redirecting: 'Đang chuyển hướng xác thực...',
      errorGoogleDenied: 'Bạn đã hủy đăng nhập bằng tài khoản Google.',
      errorGithubDenied: 'Bạn đã hủy đăng nhập bằng tài khoản GitHub.',
      errorGeneral: 'Đăng nhập không thành công. Vui lòng thử lại.'
    },
    en: {
      title: 'Sign in to AITA',
      studentRole: 'Student',
      lecturerRole: 'Lecturer',
      studentSub: 'Student Portal: Submit assignments, AI grading & analytics',
      lecturerSub: 'Lecturer Portal: Grade submissions, rubric rules & courses',
      continueGoogle: 'Continue with Google',
      continueGithub: 'Continue with GitHub',
      redirecting: 'Redirecting to sign in...',
      errorGoogleDenied: 'Google sign in was cancelled.',
      errorGithubDenied: 'GitHub sign in was cancelled.',
      errorGeneral: 'Sign in failed. Please try again.'
    }
  };

  const currentT = t[lang];

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'google_denied') {
      setErrorMessage(currentT.errorGoogleDenied);
    } else if (err === 'github_denied') {
      setErrorMessage(currentT.errorGithubDenied);
    } else if (err) {
      setErrorMessage(currentT.errorGeneral);
    }
  }, [searchParams, currentT]);

  // Chuyển hướng trực tiếp tới Google OAuth 2.0 chính thức kèm state là vai trò đã chọn
  const handleGoogleLogin = () => {
    setRedirectingProvider('google');
    setErrorMessage('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('intended_role', selectedRole);
    }
    const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) {
      setErrorMessage(currentT === 'vi' ? 'Chưa cấu hình Google Client ID trong file môi trường (.env.local)' : 'Google Client ID not configured in .env.local');
      setRedirectingProvider(null);
      return;
    }
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/callback/google');
    const scope = encodeURIComponent('openid email profile');
    const state = encodeURIComponent(selectedRole);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  // Chuyển hướng trực tiếp tới GitHub OAuth chính thức kèm state là vai trò đã chọn
  const handleGitHubLogin = () => {
    setRedirectingProvider('github');
    setErrorMessage('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('intended_role', selectedRole);
    }
    const clientId = (process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '').trim();
    if (!clientId) {
      setErrorMessage(currentT === 'vi' ? 'Chưa cấu hình GitHub Client ID trong file môi trường (.env.local)' : 'GitHub Client ID not configured in .env.local');
      setRedirectingProvider(null);
      return;
    }
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
        {/* Ambient subtle glow */}
        <div style={{
          position: 'absolute',
          top: '25%',
          width: '320px',
          height: '320px',
          background: 'var(--accent-primary)',
          filter: 'blur(170px)',
          opacity: 0.12,
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Login Card theo chuẩn thiết kế tối giản chuyên nghiệp */}
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem 2rem',
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

          {/* Role Selector Segmented Control: Sinh viên vs Giảng viên */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '4px',
            margin: '1.4rem 0 1.6rem',
            gap: '4px'
          }}>
            <button
              type="button"
              id="role-btn-student"
              onClick={() => setSelectedRole('STUDENT')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: selectedRole === 'STUDENT' ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
                color: selectedRole === 'STUDENT' ? '#ffffff' : 'var(--text-dim)',
                boxShadow: selectedRole === 'STUDENT' ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: selectedRole === 'STUDENT' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                fontSize: '0.88rem',
                fontWeight: selectedRole === 'STUDENT' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <GraduationCap size={17} color={selectedRole === 'STUDENT' ? '#60a5fa' : 'currentColor'} />
              <span>{currentT.studentRole}</span>
            </button>

            <button
              type="button"
              id="role-btn-lecturer"
              onClick={() => setSelectedRole('LECTURER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: selectedRole === 'LECTURER' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: selectedRole === 'LECTURER' ? '#ffffff' : 'var(--text-dim)',
                boxShadow: selectedRole === 'LECTURER' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: selectedRole === 'LECTURER' ? 'rgba(16, 185, 129, 0.5)' : 'transparent',
                fontSize: '0.88rem',
                fontWeight: selectedRole === 'LECTURER' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <School size={17} color={selectedRole === 'LECTURER' ? '#34d399' : 'currentColor'} />
              <span>{currentT.lecturerRole}</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              marginBottom: '1.2rem',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontSize: '0.84rem',
              textAlign: 'left'
            }}>
              {errorMessage}
            </div>
          )}

          {/* 2 Nút Đăng Nhập Chuẩn Chuyên Nghiệp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. Nút Google: Nền trắng chữ đen chuẩn thiết kế Google Sign-In */}
            <button
              type="button"
              disabled={redirectingProvider !== null}
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#1f2937',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: redirectingProvider !== null ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                opacity: redirectingProvider === 'google' ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (!redirectingProvider) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!redirectingProvider) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
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
                  <span>{currentT.continueGoogle}</span>
                </>
              )}
            </button>

            {/* 2. Nút GitHub: Nền tối chuẩn nhận diện GitHub */}
            <button
              type="button"
              disabled={redirectingProvider !== null}
              onClick={handleGitHubLogin}
              style={{
                width: '100%',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                fontSize: '0.95rem',
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
