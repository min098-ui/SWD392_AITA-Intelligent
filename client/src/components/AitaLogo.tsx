'use client';

import React from 'react';

interface AitaLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showText?: boolean;
  textColor?: string;
}

/**
 * AITA-INTELLIGENT - Logo Bé Cú Tri Thức & Nón Cử Nhân (Owl of Wisdom)
 * Hiển thị hình ảnh bé cú aita-owl-official-hd.png trong suốt, không nền, tương thích mọi chế độ sáng / tối.
 */
export default function AitaLogo({
  size = 48,
  className = '',
  style,
  showText = false,
  textColor = 'var(--text-main, #ffffff)'
}: AitaLogoProps) {
  // Tỉ lệ gốc của biểu tượng bé cú: 164w x 134h (~1.22:1)
  const height = Math.round(size * (134 / 164));

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        ...style
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${height}px`,
          minWidth: `${size}px`,
          minHeight: `${height}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: 'transparent',
          overflow: 'visible',
          transition: 'transform 0.25s ease',
          filter: 'drop-shadow(0 3px 8px rgba(124, 58, 237, 0.3))'
        }}
      >
        <img
          src="/images/aita-owl-official-hd.png"
          alt="AITA-INTELLIGENT Logo Bé Cú"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em', color: textColor }}>
            AITA-INTELLIGENT
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#c084fc', letterSpacing: '0.04em' }}>
            AI-Powered Education
          </span>
        </div>
      )}
    </div>
  );
}
