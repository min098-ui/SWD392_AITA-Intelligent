'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Loader2, GraduationCap, School, AlertCircle, ShieldCheck, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
  const [loginMethod, setLoginMethod] = useState<'oauth' | 'password'>('password');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [redirectingProvider, setRedirectingProvider] = useState<'google' | 'github' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Từ điển ngôn ngữ
  const t = {
    vi: {
      title: 'Đăng nhập vào AITA',
      studentRole: 'Sinh viên',
      lecturerRole: 'Giảng viên',
      studentSub: 'Cổng sinh viên: Nộp bài đồ án, xem điểm & AI chấm code',
      lecturerSub: 'Cổng giảng viên: Chấm bài nộp, cấu hình Rubric & quản lý lớp',
      continueGoogle: 'Tiếp tục với Google Workspace',
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
      continueGoogle: 'Continue with Google Workspace',
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
    const msg = searchParams.get('message');
    if (msg) {
      setErrorMessage(msg);
    } else if (err === 'ROLE_CONFLICT_LECTURER_AS_STUDENT') {
      setErrorMessage('Email này đã được đăng ký cho Giảng viên, không được đăng nhập với vai trò Sinh viên!');
    } else if (err === 'ROLE_CONFLICT_STUDENT_AS_LECTURER') {
      setErrorMessage('Email này đã được đăng ký cho Sinh viên, không được đăng nhập với vai trò Giảng viên!');
    } else if (err === 'LECTURER_PENDING_APPROVAL') {
      setErrorMessage('Tài khoản Giảng viên của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng liên hệ Admin để được cấp quyền truy cập.');
    } else if (err === 'ACCOUNT_LOCKED') {
      setErrorMessage('Tài khoản của bạn đã bị khóa hoặc từ chối phê duyệt bởi Quản trị viên.');
    } else if (err === 'google_denied') {
      setErrorMessage(currentT.errorGoogleDenied);
    } else if (err === 'github_denied') {
      setErrorMessage(currentT.errorGithubDenied);
    } else if (err) {
      setErrorMessage(currentT.errorGeneral);
    }
  }, [searchParams, currentT]);

  // Điều hướng sau khi đăng nhập thành công
  const handleAuthSuccess = (userData: any, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setSuccessMessage(`Đăng nhập thành công! Chào mừng ${userData.fullName} (${userData.role})`);
    setTimeout(() => {
      if (userData.role === 'ADMIN') {
        router.push('/admin');
      } else if (userData.role === 'LECTURER') {
        router.push('/lecturer');
      } else {
        router.push('/student');
      }
    }, 800);
  };

  // Đăng nhập trực tiếp bằng Email & Mật khẩu
  const handleEmailSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string, customRole?: 'STUDENT' | 'LECTURER') => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const email = (customEmail || emailInput).trim();
    const password = customPass || passwordInput || 'Password@123';
    const role = customRole || selectedRole;

    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || 'Đăng nhập không thành công.');
      } else {
        handleAuthSuccess(data.user, data.token);
      }
    } catch (err: any) {
      console.error('Login request failed:', err);
      setErrorMessage('Không thể kết nối đến máy chủ Backend (http://localhost:5000). Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chuyển hướng Google OAuth 2.0
  const handleGoogleLogin = () => {
    setRedirectingProvider('google');
    setErrorMessage('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('intended_role', selectedRole);
    }
    const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) {
      setErrorMessage(lang === 'vi' ? 'Chưa cấu hình Google Client ID trong file môi trường (.env.local)' : 'Google Client ID not configured in .env.local');
      setRedirectingProvider(null);
      return;
    }
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/callback/google');
    const scope = encodeURIComponent('openid email profile');
    const state = encodeURIComponent(selectedRole);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  // Chuyển hướng GitHub OAuth
  const handleGitHubLogin = () => {
    setRedirectingProvider('github');
    setErrorMessage('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('intended_role', selectedRole);
    }
    const clientId = (process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '').trim();
    if (!clientId) {
      setErrorMessage(lang === 'vi' ? 'Chưa cấu hình GitHub Client ID trong file môi trường (.env.local)' : 'GitHub Client ID not configured in .env.local');
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
          top: '20%',
          width: '380px',
          height: '380px',
          background: 'var(--accent-primary)',
          filter: 'blur(180px)',
          opacity: 0.14,
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Login Card */}
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.2rem 2rem',
          position: 'relative',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          textAlign: 'center'
        }}>
          {/* Logo icon */}
          <div style={{
            background: 'var(--accent-gradient)',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px -4px rgba(59, 130, 246, 0.45)',
            margin: '0 auto 1rem'
          }}>
            <Bot size={28} color="#fff" />
          </div>

          {/* Heading */}
          <h1 style={{ 
            fontSize: '1.6rem', 
            fontWeight: 800, 
            marginBottom: '0.3rem', 
            letterSpacing: '-0.02em', 
            color: 'var(--text-main)' 
          }}>
            {currentT.title}
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
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
            marginBottom: '1.2rem',
            gap: '4px'
          }}>
            <button
              type="button"
              id="role-btn-student"
              onClick={() => { setSelectedRole('STUDENT'); setErrorMessage(''); }}
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
              onClick={() => { setSelectedRole('LECTURER'); setErrorMessage(''); }}
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

          {/* Success Banner */}
          {successMessage && (
            <div style={{
              marginBottom: '1.2rem',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.86rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.45,
            }}>
              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Error Banner with prominent alert styling */}
          {errorMessage && (
            <div style={{
              marginBottom: '1.2rem',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              fontSize: '0.86rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.45,
            }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Toggle Tab: Email/Mật khẩu vs Google/GitHub SSO */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '1.2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '8px'
          }}>
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              style={{
                background: 'transparent',
                border: 'none',
                color: loginMethod === 'password' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: loginMethod === 'password' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: loginMethod === 'password' ? '2px solid var(--accent-cyan)' : '2px solid transparent'
              }}
            >
              Email & Mật khẩu
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('oauth')}
              style={{
                background: 'transparent',
                border: 'none',
                color: loginMethod === 'oauth' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: loginMethod === 'oauth' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: loginMethod === 'oauth' ? '2px solid var(--accent-cyan)' : '2px solid transparent'
              }}
            >
              Google / GitHub SSO
            </button>
          </div>

          {loginMethod === 'password' ? (
            <form onSubmit={(e) => handleEmailSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Địa chỉ Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '0 12px'
                }}>
                  <Mail size={16} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="vd: lenguyenanhmai05@gmail.com"
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Mật khẩu
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '0 12px'
                }}>
                  <Lock size={16} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mặc định: Password@123"
                    style={{
                      width: '100%',
                      height: '44px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-neon)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Đăng nhập hệ thống</span>
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Nút Google Workspace */}
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
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: redirectingProvider !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  opacity: redirectingProvider === 'google' ? 0.75 : 1
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

              {/* Nút GitHub */}
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
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: redirectingProvider !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  opacity: redirectingProvider === 'github' ? 0.75 : 1
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
          )}

          {/* Quick Access Testing Accounts (Phục vụ kiểm thử trực tiếp các ràng buộc) */}
          <div style={{
            marginTop: '1.6rem',
            paddingTop: '1.2rem',
            borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} color="#f59e0b" /> Kiểm thử nhanh các ràng buộc:
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              {/* 1. Admin cố định */}
              <button
                type="button"
                onClick={() => {
                  setEmailInput('lenguyenanhmai05@gmail.com');
                  setPasswordInput('Password@123');
                  handleEmailSubmit(undefined, 'lenguyenanhmai05@gmail.com', 'Password@123', selectedRole);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#fca5a5',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <span>👑 <strong>Admin Cố Định:</strong> lenguyenanhmai05@gmail.com</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>Vào Admin</span>
              </button>

              {/* 2. Giảng viên đã được duyệt */}
              <button
                type="button"
                onClick={() => {
                  setEmailInput('giangnv@fe.edu.vn');
                  setPasswordInput('Password@123');
                  setSelectedRole('LECTURER');
                  handleEmailSubmit(undefined, 'giangnv@fe.edu.vn', 'Password@123', 'LECTURER');
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#6ee7b7',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <span>👨‍🏫 <strong>Giảng viên đã duyệt:</strong> giangnv@fe.edu.vn</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>Vào Giảng viên</span>
              </button>

              {/* 3. Giảng viên chờ duyệt */}
              <button
                type="button"
                onClick={() => {
                  setEmailInput('pending_lec@fe.edu.vn');
                  setPasswordInput('Password@123');
                  setSelectedRole('LECTURER');
                  handleEmailSubmit(undefined, 'pending_lec@fe.edu.vn', 'Password@123', 'LECTURER');
                }}
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#fcd34d',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <span>⏳ <strong>Giảng viên chờ duyệt:</strong> pending_lec@fe.edu.vn</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>Xem cảnh báo</span>
              </button>

              {/* 4. Thử xung đột vai trò: Giảng viên cố đăng nhập Sinh viên */}
              <button
                type="button"
                onClick={() => {
                  setEmailInput('giangnv@fe.edu.vn');
                  setPasswordInput('Password@123');
                  setSelectedRole('STUDENT');
                  handleEmailSubmit(undefined, 'giangnv@fe.edu.vn', 'Password@123', 'STUDENT');
                }}
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#c4b5fd',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <span>⚠️ <strong>Test khóa:</strong> Mail Giảng viên login Sinh viên</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(139, 92, 246, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>Bị khóa</span>
              </button>

              {/* 5. Sinh viên đăng nhập */}
              <button
                type="button"
                onClick={() => {
                  setEmailInput('student1@fpt.edu.vn');
                  setPasswordInput('Password@123');
                  setSelectedRole('STUDENT');
                  handleEmailSubmit(undefined, 'student1@fpt.edu.vn', 'Password@123', 'STUDENT');
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#93c5fd',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <span>🎓 <strong>Sinh viên:</strong> student1@fpt.edu.vn</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>Vào Sinh viên</span>
              </button>
            </div>
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
