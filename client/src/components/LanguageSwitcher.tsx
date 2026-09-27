'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const VietnamFlag = () => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="none" style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}>
    <rect width="18" height="12" fill="#DA251D" />
    <polygon points="9,2.2 10.2,5.8 14,5.8 11,8 12.1,11.5 9,9.4 5.9,11.5 7,8 4,5.8 7.8,5.8" fill="#FFFF00" />
  </svg>
);

export const UKFlag = () => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="none" style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}>
    <clipPath id="uk-flag-clip-header">
      <rect width="18" height="12" rx="2" />
    </clipPath>
    <g clipPath="url(#uk-flag-clip-header)">
      <rect width="18" height="12" fill="#012169" />
      <path d="M0,0 L18,12 M18,0 L0,12" stroke="#fff" strokeWidth="2.4" />
      <path d="M0,0 L18,12 M18,0 L0,12" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M9,0 V12 M0,6 H18" stroke="#fff" strokeWidth="3.6" />
      <path d="M9,0 V12 M0,6 H18" stroke="#C8102E" strokeWidth="2.2" />
    </g>
  </svg>
);

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '24px',
      padding: '3px',
      gap: '2px',
      backdropFilter: 'blur(8px)',
      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)'
    }}>
      <button
        type="button"
        onClick={() => setLang('vi')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '18px',
          border: 'none',
          background: lang === 'vi' ? 'rgba(218, 37, 29, 0.25)' : 'transparent',
          color: lang === 'vi' ? '#ffffff' : 'var(--text-dim)',
          boxShadow: lang === 'vi' ? '0 0 10px rgba(218, 37, 29, 0.35)' : 'none',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        title="Tiếng Việt (VN)"
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
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '18px',
          border: 'none',
          background: lang === 'en' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
          color: lang === 'en' ? '#ffffff' : 'var(--text-dim)',
          boxShadow: lang === 'en' ? '0 0 10px rgba(59, 130, 246, 0.35)' : 'none',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        title="English (EN)"
      >
        <UKFlag />
        <span>EN</span>
      </button>
    </div>
  );
}
