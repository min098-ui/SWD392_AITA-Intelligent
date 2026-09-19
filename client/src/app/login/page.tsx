'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowRight, Mail, Lock } from 'lucide-react';
import Navigation from '../../components/Navigation';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Theo task_allocation: gọi POST /api/auth/login
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        if (res.status === 404) {
          throw new Error('Tính năng Đăng nhập chưa được backend hỗ trợ (404).');
        } else {
          throw new Error('Máy chủ trả về dữ liệu không hợp lệ (Không phải JSON).');
        }
      }

      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Lưu JWT vào localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Lưu thông tin user để dùng ở component khác (tuỳ chọn)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect theo role
      const role = data.user?.role || data.role; // Lấy role từ API
      if (role === 'STUDENT') {
        router.push('/student');
      } else if (role === 'LECTURER') {
        router.push('/lecturer');
      } else if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        // Fallback
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

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
          top: '20%',
          left: '20%',
          width: '300px',
          height: '300px',
          background: 'var(--accent-primary)',
          filter: 'blur(150px)',
          opacity: 0.15,
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}>
          {/* Decorative glow inside card */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'var(--accent-primary)',
            filter: 'blur(80px)',
            opacity: 0.4,
            borderRadius: '50%'
          }} />
          
          <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              background: 'var(--accent-gradient)',
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-neon)',
              margin: '0 auto 1.2rem'
            }}>
              <Bot size={30} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Sign in to your AITA workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 500, marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 12px 12px 42px',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  Password
                </label>
                <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 12px 12px 42px',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <button disabled={isLoading} type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', marginBottom: '1.5rem', fontWeight: 600, opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
