'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, ArrowRight, ShieldAlert, GraduationCap, Lock } from 'lucide-react';
import Navigation from '../../components/Navigation';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <main style={{ 
        minHeight: 'calc(100vh - 70px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Background Gradients */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '350px',
          height: '350px',
          background: 'var(--accent-primary)',
          filter: 'blur(160px)',
          opacity: 0.15,
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '520px',
          padding: '3rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          textAlign: 'center'
        }}>
          {/* Top Icon Badge */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--accent-cyan)'
          }}>
            <Lock size={36} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem'
          }}>
            <GraduationCap size={15} color="var(--accent-cyan)" />
            Cổng Học Thuật FPT University
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Tài Khoản Được Cấp Tự Động
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Hệ thống <strong>AITA-INTELLIGENT</strong> áp dụng cơ chế xác thực nội bộ. 
            Tài khoản Sinh viên và Giảng viên được đồng bộ tự động theo danh sách lớp học của Phòng Đào tạo (Academic Office) với định dạng email trường:
            <br />
            <code style={{ display: 'inline-block', marginTop: '8px', padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>
              @fpt.edu.vn / @fe.edu.vn
            </code>
          </p>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            marginBottom: '2rem',
            textAlign: 'left',
            fontSize: '0.88rem',
            color: 'var(--text-dim)',
            lineHeight: '1.5'
          }}>
            💡 <strong>Bạn đã có sẵn tài khoản?</strong> Vui lòng sử dụng email sinh viên/giảng viên được cấp để đăng nhập vào Workspace học tập.
          </div>

          <Link href="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Chuyển Đến Trang Đăng Nhập <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    </>
  );
}
