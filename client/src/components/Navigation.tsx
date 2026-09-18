'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Code2, Users, ShieldCheck, Terminal, GraduationCap } from 'lucide-react';

export default function Navigation() {
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

        {/* Role Navigation Hub */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/student" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            color: 'var(--text-main)',
            background: 'rgba(255,255,255,0.04)'
          }}>
            <GraduationCap size={16} color="#38bdf8" />
            Student
          </Link>

          <Link href="/lecturer" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            color: 'var(--text-main)',
            background: 'rgba(255,255,255,0.04)'
          }}>
            <Code2 size={16} color="#34d399" />
            Lecturer
          </Link>

          <Link href="/admin" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            color: 'var(--text-main)',
            background: 'rgba(255,255,255,0.04)'
          }}>
            <ShieldCheck size={16} color="#f43f5e" />
            Admin
          </Link>
        </nav>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.75rem',
            color: '#34d399'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Docker Sandbox: Ready
          </div>
        </div>
      </div>
    </header>
  );
}
