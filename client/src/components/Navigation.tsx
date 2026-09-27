'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Code2, ShieldCheck, GraduationCap } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

export default function Navigation({ initialIsLoggedIn = false }: { initialIsLoggedIn?: boolean }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [userRole, setUserRole] = useState('');
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
          const user = JSON.parse(userStr);
          setUserRole(user.role);
        } catch (e) {}
      }
    } else {
      setIsLoggedIn(false);
      setUserRole('');
    }
  }, [pathname]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole('');
    router.push('/login');
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 2rem'
    }}>
      <div style={{
        maxWidth: '1300px',
        margin: '0 auto',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-neon)'
          }}>
            <Bot size={24} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              AITA<span style={{ color: 'var(--accent-cyan)' }}>.INTELLIGENT</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              SWD392 • GROUP 4
            </span>
          </div>
        </Link>

        {/* Dynamic Role-based Tabs */}
        {isLoggedIn && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {userRole === 'STUDENT' && (
              <Link href="/student" style={{ padding: '6px 12px', fontSize: '0.85rem', color: pathname.startsWith('/student') ? 'var(--text-main)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', background: pathname.startsWith('/student') ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '6px' }}>
                <GraduationCap size={16} /> {lang === 'vi' ? 'Bảng Điều Khiển SV' : 'Student Dashboard'}
              </Link>
            )}
            {userRole === 'LECTURER' && (
              <Link href="/lecturer" style={{ padding: '6px 12px', fontSize: '0.85rem', color: pathname.startsWith('/lecturer') ? 'var(--text-main)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', background: pathname.startsWith('/lecturer') ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '6px' }}>
                <Code2 size={16} /> {lang === 'vi' ? 'Bảng Điều Khiển GV' : 'Lecturer Dashboard'}
              </Link>
            )}
            {userRole === 'ADMIN' && (
              <Link href="/admin" style={{ padding: '6px 12px', fontSize: '0.85rem', color: pathname.startsWith('/admin') ? 'var(--text-main)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', background: pathname.startsWith('/admin') ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '6px' }}>
                <ShieldCheck size={16} /> {lang === 'vi' ? 'Quản Trị Hệ Thống' : 'Admin Dashboard'}
              </Link>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Nút chuyển đổi ngôn ngữ Toàn hệ thống */}
          <LanguageSwitcher />

          {isLoggedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              {lang === 'vi' ? 'Sandbox: Sẵn sàng' : 'Sandbox: Ready'}
            </div>
          )}
          
          {!isLoggedIn && (
            <Link href="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '10px' }}>
              {lang === 'vi' ? 'Đăng Nhập' : 'Sign In'}
            </Link>
          )}
          
          {isLoggedIn && (
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', outline: 'none' }}>
              {lang === 'vi' ? 'Đăng Xuất' : 'Sign Out'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

