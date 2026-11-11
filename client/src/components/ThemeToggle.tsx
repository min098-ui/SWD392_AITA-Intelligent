'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ThemeToggle() {
  const { lang } = useLanguage();
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const docTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    const saved = (localStorage.getItem('aita_theme') as 'dark' | 'light') || docTheme || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);

    const handleThemeChange = () => {
      const current = (localStorage.getItem('aita_theme') as 'dark' | 'light') || document.documentElement.getAttribute('data-theme') as 'dark' | 'light' || 'light';
      setTheme(current);
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('aita_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    window.dispatchEvent(new Event('theme-change'));
  };

  if (!mounted) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '3px',
        height: '34px',
        width: '120px'
      }} />
    );
  }

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '24px',
        padding: '3px',
        gap: '2px',
        backdropFilter: 'blur(8px)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        transition: 'all 0.2s ease'
      }}
      role="group"
      aria-label="Theme Switcher"
    >
      <button
        type="button"
        onClick={() => toggleTheme('dark')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '18px',
          border: 'none',
          background: theme === 'dark' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
          color: theme === 'dark' ? '#c4b5fd' : 'var(--text-dim)',
          boxShadow: theme === 'dark' ? '0 0 10px rgba(139, 92, 246, 0.35)' : 'none',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        title={lang === 'vi' ? 'Giao diện Tối (Dark Mode)' : 'Dark Mode'}
      >
        <Moon size={13} color={theme === 'dark' ? '#c4b5fd' : 'currentColor'} />
        <span>{lang === 'vi' ? 'Tối' : 'Dark'}</span>
      </button>

      <button
        type="button"
        onClick={() => toggleTheme('light')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '18px',
          border: 'none',
          background: theme === 'light' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
          color: theme === 'light' ? '#f59e0b' : 'var(--text-dim)',
          boxShadow: theme === 'light' ? '0 0 10px rgba(245, 158, 11, 0.35)' : 'none',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        title={lang === 'vi' ? 'Giao diện Sáng (Light Mode)' : 'Light Mode'}
      >
        <Sun size={13} color={theme === 'light' ? '#f59e0b' : 'currentColor'} />
        <span>{lang === 'vi' ? 'Sáng' : 'Light'}</span>
      </button>
    </div>
  );
}

