'use client';

import React from 'react';

interface AitaLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AITA Intelligent - Logo Con Cú Tri Thức & Nón Cử Nhân (Owl of Wisdom)
 * Khung biểu tượng màu TRẮNG ngọc trai tinh khôi (#ffffff),
 * làm nổi bật tối đa hình con cú tím hoàng gia và ngôi sao vàng kim.
 */
export default function AitaLogo({
  size = 42,
  className = '',
  style
}: AitaLogoProps) {
  const radius = Math.round(size * 0.28);
  const padding = Math.max(3, Math.round(size * 0.08));

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: `${radius}px`,
        background: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px -1px rgba(139, 92, 246, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        flexShrink: 0,
        padding: `${padding}px`,
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...style
      }}
    >
      <img
        src="/images/aita-owl-official.png"
        alt="AITA Logo (Con Cú Tri Thức)"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
