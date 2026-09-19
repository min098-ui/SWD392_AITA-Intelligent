'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowRight, Mail, Lock, User } from 'lucide-react';
import Navigation from '../../components/Navigation';

import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT'); // Mặc định là sinh viên
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Theo task_allocation: gọi POST /api/auth/register
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Đăng ký thất bại');
        }
      } else {
        if (res.status === 404) {
          throw new Error('Tính năng Đăng ký chưa được backend hỗ trợ (API chưa hoàn thiện).');
        } else {
          throw new Error('Máy chủ trả về dữ liệu không hợp lệ (Không phải JSON).');
        }
      }

      // Đăng ký thành công thì chuyển về trang đăng nhập
      router.push('/login');
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
          bottom: '10%',
          right: '10%',
          width: '350px',
          height: '350px',
          background: 'var(--accent-rose)',
          filter: 'blur(150px)',
          opacity: 0.12,
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
            bottom: '-50px',
            left: '-50px',
            width: '150px',
            height: '150px',
            background: 'var(--accent-emerald)',
            filter: 'blur(80px)',
            opacity: 0.3,
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
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Create Account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Join AITA to start managing your code
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 500, marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 500, marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                Password
              </label>
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

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 500, marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                Select Role
              </label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 12px 12px 14px',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none', // Ẩn mũi tên mặc định để giao diện sạch hơn hoặc có thể giữ lại
                  transition: 'all 0.2s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <option value="STUDENT" style={{ background: '#111827' }}>Student</option>
                <option value="LECTURER" style={{ background: '#111827' }}>Lecturer</option>
                <option value="ADMIN" style={{ background: '#111827' }}>Admin</option>
              </select>
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
              {isLoading ? 'Creating...' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
