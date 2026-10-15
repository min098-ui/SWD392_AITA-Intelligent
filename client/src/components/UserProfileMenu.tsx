'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Sun, Moon, Shield, GraduationCap, School } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { VietnamFlag, UKFlag } from './LanguageSwitcher';

interface UserProfileMenuProps {
  user: {
    fullName?: string;
    full_name?: string;
    email?: string;
    role?: string;
  } | null;
  onLogout: (e: React.MouseEvent) => void;
}

export default function UserProfileMenu({ user, onLogout }: UserProfileMenuProps) {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo theme từ localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('aita_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('aita_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Tính chữ cái viết tắt của tên người dùng (VD: Mai -> M, Le Nguyen Anh Mai -> M)
  const getInitial = () => {
    const name = user?.fullName || user?.full_name || '';
    if (name.trim()) {
      const parts = name.trim().split(/\s+/);
      const lastWord = parts[parts.length - 1];
      return lastWord.charAt(0).toUpperCase();
    }
    if (user?.email?.trim()) {
      return user.email.trim().charAt(0).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.fullName || user?.full_name || user?.email?.split('@')[0] || (lang === 'vi' ? 'Người dùng' : 'User');
  const userEmail = user?.email || 'user@fpt.edu.vn';
  const role = user?.role || 'STUDENT';
  const initial = getInitial();

  const getRoleBadge = () => {
    if (role === 'ADMIN') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(168, 85, 247, 0.2)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '9999px',
          padding: '2px 8px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <Shield size={11} />
          {lang === 'vi' ? 'Quản trị viên' : 'Admin'}
        </span>
      );
    }
    if (role === 'LECTURER') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(16, 185, 129, 0.2)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '9999px',
          padding: '2px 8px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <School size={11} />
          {lang === 'vi' ? 'Giảng viên' : 'Lecturer'}
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(59, 130, 246, 0.2)',
        color: '#60a5fa',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '9999px',
        padding: '2px 8px',
        fontSize: '0.72rem',
        fontWeight: 700
      }}>
        <GraduationCap size={11} />
        {lang === 'vi' ? 'Sinh viên' : 'Student'}
      </span>
    );
  };

  return (
    <div
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      {/* Nút Avatar hiển thị chữ cái viết tắt */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Profile Menu"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          border: isOpen ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 16px rgba(59, 130, 246, 0.6)'
            : '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        {initial}
      </button>

      {/* Dropdown Popup khi hover hoặc click */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '290px',
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: theme === 'dark' 
              ? '0 20px 45px -10px rgba(0, 0, 0, 0.75), 0 0 20px rgba(59, 130, 246, 0.15)' 
              : '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            animation: 'fadeInProfile 0.18s ease-out'
          }}
        >
          {/* Thông tin người dùng: Tên + Gmail + Vai trò */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '4px'
              }}>
                {userEmail}
              </div>
              <div>{getRoleBadge()}</div>
            </div>
          </div>

          <div style={{ height: '1px', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

          {/* Chỉnh chế độ sáng tối (Theme Toggle) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              {lang === 'vi' ? 'Giao diện' : 'Theme'}
            </span>
            <div style={{
              display: 'inline-flex',
              background: theme === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: '10px',
              padding: '3px',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => toggleTheme('dark')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 9px',
                  borderRadius: '7px',
                  border: 'none',
                  background: theme === 'dark' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: theme === 'dark' ? '#93c5fd' : '#64748b',
                  fontSize: '0.76rem',
                  fontWeight: theme === 'dark' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Moon size={12} />
                <span>{lang === 'vi' ? 'Tối' : 'Dark'}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme('light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 9px',
                  borderRadius: '7px',
                  border: 'none',
                  background: theme === 'light' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: theme === 'light' ? '#2563eb' : '#64748b',
                  fontSize: '0.76rem',
                  fontWeight: theme === 'light' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Sun size={12} />
                <span>{lang === 'vi' ? 'Sáng' : 'Light'}</span>
              </button>
            </div>
          </div>

          {/* Chuyển ngôn ngữ (Language Switcher) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              {lang === 'vi' ? 'Ngôn ngữ' : 'Language'}
            </span>
            <div style={{
              display: 'inline-flex',
              background: theme === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: '10px',
              padding: '3px',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => setLang('vi')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 9px',
                  borderRadius: '7px',
                  border: 'none',
                  background: lang === 'vi' ? 'rgba(218, 37, 29, 0.25)' : 'transparent',
                  color: lang === 'vi' ? (theme === 'dark' ? '#fff' : '#b91c1c') : '#64748b',
                  fontSize: '0.76rem',
                  fontWeight: lang === 'vi' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <VietnamFlag />
                <span>VN</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 9px',
                  borderRadius: '7px',
                  border: 'none',
                  background: lang === 'en' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: lang === 'en' ? (theme === 'dark' ? '#fff' : '#1d4ed8') : '#64748b',
                  fontSize: '0.76rem',
                  fontWeight: lang === 'en' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <UKFlag />
                <span>EN</span>
              </button>
            </div>
          </div>

          <div style={{ height: '1px', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

          {/* Nút Đăng xuất */}
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '9px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
            }}
          >
            <LogOut size={14} />
            <span>{lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
