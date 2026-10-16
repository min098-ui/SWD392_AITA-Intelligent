'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import UserProfileMenu from './UserProfileMenu';
import { useLanguage } from '../context/LanguageContext';

export default function Navigation({ 
  initialIsLoggedIn = false,
  centerContent
}: { 
  initialIsLoggedIn?: boolean;
  centerContent?: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [userRole, setUserRole] = useState('');
  const [user, setUser] = useState<{ fullName?: string; full_name?: string; email?: string; role?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();

  useEffect(() => {
    // Kiểm tra token khi component mount hoặc khi chuyển trang
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) {
      setIsLoggedIn(true);
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);
          setUserRole(parsedUser.role || '');
        } catch (e) {}
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setUserRole('');
    }
  }, [pathname]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setUserRole('');
    router.push('/login');
  };

  const getDashboardHref = () => {
    if (!isLoggedIn) return '/';
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'LECTURER') return '/lecturer';
    return '/student';
  };

  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(10, 14, 23, 0.88)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 1.5rem',
      width: '100%'
    }}>
      <div style={{
        width: '100%',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem'
      }}>
        {/* Phần Hình 1: Logo sát mép trái */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Link href={getDashboardHref()} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-neon)'
            }}>
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.18rem', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.15, display: 'block' }}>
                AITA<span style={{ color: 'var(--accent-cyan)' }}>.INTELLIGENT</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1, marginTop: '2px', fontWeight: 600, letterSpacing: '0.04em' }}>
                SWD392 • GROUP 4
              </span>
            </div>
          </Link>
        </div>

        {/* Phần Hình 2: Tabs navigation ở giữa navbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {centerContent ? (
            centerContent
          ) : pathname === '/' && !isLoggedIn ? (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <a href="#overview" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                {lang === 'vi' ? 'Tổng Quan' : 'Overview'}
              </a>
              <a href="#sandbox" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                {lang === 'vi' ? 'Docker Sandbox' : 'Sandbox'}
              </a>
              <a href="#ai-tutor" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                {lang === 'vi' ? 'Gemini AI' : 'AI Tutor'}
              </a>
              <a href="#telemetry" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                {lang === 'vi' ? 'Git Telemetry' : 'Telemetry'}
              </a>
              <a href="#use-modes" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                {lang === 'vi' ? 'Chế Độ Sử Dụng' : 'Use Modes'}
              </a>
            </nav>
          ) : null}
        </div>

        {/* Phần Hình 3: Profile Avatar Dropdown (nếu đăng nhập) hoặc LanguageSwitcher & Đăng Nhập (nếu chưa) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {isLoggedIn ? (
            <UserProfileMenu user={user} onLogout={handleLogout} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LanguageSwitcher />
              <Link href="/login" className="pill-btn-white" style={{ padding: '7px 18px', fontSize: '0.88rem' }}>
                <span>{lang === 'vi' ? 'Đăng Nhập' : 'Sign In'}</span>
                <span className="pill-arrow" style={{ width: '18px', height: '18px', fontSize: '0.7rem' }}>→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

