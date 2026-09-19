'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { 
  Bot, ShieldCheck, Terminal, Cpu, Database, GitCommit, 
  ArrowRight, Sparkles, Code2, Users, Layers, Activity,
  Github, Twitter, Linkedin, Mail
} from 'lucide-react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('STUDENT');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) {
      setIsLoggedIn(true);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role) setUserRole(user.role);
        } catch (e) {}
      }
    }
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'LECTURER') return '/lecturer';
    if (userRole === 'ADMIN') return '/admin';
    return '/student';
  };

  return (
    <>
      <Navigation />
      <main style={{ overflowX: 'hidden' }}>
        
        {/* --- HERO SECTION --- */}
        <section style={{
          position: 'relative',
          padding: '8rem 2rem 6rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}>
          {/* Background Ambient Glows */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '400px',
            height: '400px',
            background: 'var(--accent-primary)',
            filter: 'blur(180px)',
            opacity: 0.15,
            zIndex: -1,
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '20%',
            width: '400px',
            height: '400px',
            background: 'var(--accent-rose)',
            filter: 'blur(180px)',
            opacity: 0.12,
            zIndex: -1,
            borderRadius: '50%'
          }} />

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#60a5fa',
            marginBottom: '2rem',
            animation: 'fadeIn 1s ease-out'
          }}>
            <Sparkles size={16} /> SWD392 Capstone Project • Group 4
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: '1000px',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'fadeInUp 1s ease-out 0.2s both'
          }}>
            Next-Generation <br/>
            <span style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Automated Grading & AI Tutor
            </span>
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            maxWidth: '750px',
            lineHeight: 1.6,
            marginBottom: '3rem',
            animation: 'fadeInUp 1s ease-out 0.4s both'
          }}>
            AITA-INTELLIGENT empowers educators and students with Secure Docker Sandbox execution, 
            Qualitative AI Code Reviews, and comprehensive Git Analytics to prevent free-riding in group projects.
          </p>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1.2rem', 
            flexWrap: 'wrap',
            animation: 'fadeInUp 1s ease-out 0.6s both'
          }}>
            {!isLoggedIn ? (
              <>
                <Link href="/register" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem', borderRadius: '12px' }}>
                  Create Free Account <ArrowRight size={20} />
                </Link>
                <Link href="/login" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1.05rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                  Sign In to Workspace
                </Link>
              </>
            ) : (
              <Link href={getDashboardLink()} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem', borderRadius: '12px' }}>
                Go to Dashboard <ArrowRight size={20} />
              </Link>
            )}
          </div>
        </section>


        {/* --- FEATURE HIGHLIGHTS --- */}
        <section style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '4rem 2rem 8rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Core Features</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Built for performance, scalability, and an unmatched learning experience.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Feature 1 */}
            <div className="glass-card" style={{ padding: '2.5rem', transition: 'transform 0.3s ease' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem', color: '#38bdf8'
              }}>
                <Terminal size={30} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Docker Sandbox
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                Safely compile and execute untrusted student code in isolated Docker environments.
                Supports real-time output streaming and timeout protection.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem', color: '#a78bfa'
              }}>
                <Bot size={30} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Gemini AI Tutor
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                Move beyond syntax errors. Our integrated AI tutor analyzes architecture, applies Socratic questioning, 
                and provides qualitative feedback to improve code quality.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: 'rgba(251, 113, 133, 0.1)', border: '1px solid rgba(251, 113, 133, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem', color: '#fb7185'
              }}>
                <GitCommit size={30} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Anti Free-Rider
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                Deep Octokit integration automatically tracks lines of code (LOC) and commits per member.
                Smart anomaly detection highlights potential free-riders to lecturers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem', color: '#34d399'
              }}>
                <Users size={30} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Peer Auditing
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                Internal cross-evaluations ensure fair grading. Students review teammates anonymously, 
                with data seamlessly aggregating into the lecturer's final dashboard.
              </p>
            </div>
          </div>
        </section>


        {/* --- BOTTOM CTA --- */}
        <section style={{
          padding: '6rem 2rem',
          textAlign: 'center',
          position: 'relative',
          borderTop: '1px solid var(--border-color)',
          background: 'radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.1) 0%, transparent 60%)'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ready to transform education?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Join educators and students who are already using AITA-INTELLIGENT to streamline grading and supercharge learning.
          </p>
          {!isLoggedIn ? (
            <Link href="/register" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem', borderRadius: '12px' }}>
              Get Started Now
            </Link>
          ) : (
            <Link href={getDashboardLink()} className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem', borderRadius: '12px' }}>
              Go to Dashboard <ArrowRight size={20} />
            </Link>
          )}
        </section>

      </main>

      {/* Modern Multi-column Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        padding: '5rem 2rem 2rem',
        color: 'var(--text-dim)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '4rem',
          marginBottom: '4rem'
        }}>
          {/* Brand Column */}
          <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                width: '36px', height: '36px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-neon)'
              }}>
                <Bot size={20} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                AITA<span style={{ color: 'var(--accent-cyan)' }}>.INTELLIGENT</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Empowering the next generation of developers with secure environments, AI-assisted grading, and fair contribution metrics.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="#" style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}><Github size={20} /></Link>
              <Link href="#" style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}><Twitter size={20} /></Link>
              <Link href="#" style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}><Linkedin size={20} /></Link>
              <Link href="#" style={{ color: 'var(--text-dim)', transition: 'color 0.2s' }}><Mail size={20} /></Link>
            </div>
          </div>

          {/* Links Columns Group */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', flex: '2 1 500px', justifyContent: 'space-between' }}>
            <div style={{ minWidth: '140px' }}>
              <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '1.2rem', fontSize: '1rem' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Docker Sandbox</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>AI Socratic Tutor</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Git Analytics</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Peer Auditing</Link></li>
              </ul>
            </div>

            <div style={{ minWidth: '140px' }}>
              <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '1.2rem', fontSize: '1rem' }}>Resources</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Documentation</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>API Reference</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Lecturer Guide</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Student Guide</Link></li>
              </ul>
            </div>

            <div style={{ minWidth: '140px' }}>
              <h4 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '1.2rem', fontSize: '1rem' }}>Project</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>About SWD392</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Group 4 Members</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>FPT University</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <p>© 2026 SWD392 Software Design Project • Group 4. All rights reserved.</p>
        </div>
      </footer>

      {/* Global styles for simple animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  );
}
