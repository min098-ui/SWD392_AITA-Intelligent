'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const roleParam = searchParams.get('role');
    const intendedRole = typeof window !== 'undefined' ? localStorage.getItem('intended_role') : null;

    if (token) {
      localStorage.setItem('token', token);
      let role = roleParam || intendedRole || 'STUDENT';
      if (userStr) {
        localStorage.setItem('user', userStr);
        try {
          const user = JSON.parse(userStr);
          if (user.role) role = user.role;
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
      if (role === 'LECTURER') {
        router.replace('/lecturer');
      } else if (role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/student');
      }
    } else {
      router.replace('/login?error=missing_token');
    }
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-main)',
      gap: '16px',
    }}>
      <div style={{
        background: 'var(--accent-gradient)',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-neon)',
      }}>
        <Bot size={30} color="#fff" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 600 }}>
        <Loader2 size={20} className="animate-spin" color="var(--accent-cyan)" />
        <span>Đang hoàn tất xác thực đăng nhập...</span>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Hệ thống đang chuyển hướng bạn tới bảng điều khiển AITA...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
