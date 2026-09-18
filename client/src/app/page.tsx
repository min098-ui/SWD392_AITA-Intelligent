'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { 
  Bot, ShieldCheck, Terminal, Cpu, Database, GitCommit, 
  ArrowRight, CheckCircle2, Sparkles, Layers, Users
} from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', flex: 1 }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', margin: '2rem 0 4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            fontSize: '0.85rem',
            color: '#60a5fa',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={16} /> SWD392 Project • FPT University Quy Nhon • Group 4
          </div>

          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.2rem',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI-Powered Teaching Assistant &amp; <br />
            <span style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Automated Sandbox Code Grading
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: '750px',
            margin: '0 auto 2.5rem'
          }}>
            A comprehensive solution for students and instructors: Secure code execution in Docker Sandbox, 
            intelligent qualitative AI error feedback, Git contribution tracking against free-riding, and internal peer audits.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/student" className="btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Enter Student Workspace <ArrowRight size={18} />
            </Link>
            <Link href="/lecturer" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Lecturer Workspace
            </Link>
          </div>
        </section>

        {/* 3 Core Portals Cards */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '4rem'
        }}>
          {/* Student Hub */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.2rem',
              color: '#38bdf8'
            }}>
              <Terminal size={26} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>Student</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.2rem' }}>
              Submit assignments via Git Hash, inspect test cases executed in Docker Sandbox, receive AI qualitative reviews, and chat with AI Tutor.
            </p>
            <Link href="/student" style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Open Student Dashboard <ArrowRight size={15} />
            </Link>
          </div>

          {/* Lecturer Hub */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.2rem',
              color: '#34d399'
            }}>
              <Cpu size={26} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>Lecturer</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.2rem' }}>
              Configure assignments, define Rubric criteria (public / hidden test cases), manage student teams, and monitor Git commit contributions.
            </p>
            <Link href="/lecturer" style={{ color: '#34d399', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Open Lecturer Dashboard <ArrowRight size={15} />
            </Link>
          </div>

          {/* Admin Hub */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.2rem',
              color: '#fb7185'
            }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>Admin</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.2rem' }}>
              Manage user accounts, assign lecturers, oversee AI Key Pool rotation, and maintain Prompt Template versions.
            </p>
            <Link href="/admin" style={{ color: '#fb7185', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Open Admin Dashboard <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Database & Architecture Summary */}
        <section className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <Database size={24} color="#60a5fa" />
            <h2 style={{ fontSize: '1.35rem' }}>14 Relational Database Entities (PostgreSQL Schema)</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            All 14 tables are mapped from the ERD design in <code>database/schema.sql</code> and populated with initial seed data in <code>database/seed.sql</code>:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.8rem',
            fontSize: '0.88rem'
          }}>
            {[
              'users (Accounts & Roles)',
              'courses (Courses & Classes)',
              'teams (Project Teams & Repos)',
              'team_members (Module Assignments)',
              'assignments (Tasks & Deadlines)',
              'rubric_rules (Public / Hidden Tests)',
              'submissions (Submission Records)',
              'grading_jobs (Docker Execution Queue)',
              'grading_results (Scores & AI Feedback)',
              'prompt_templates (Version Control)',
              'ai_api_keys (Key Pool Rotation)',
              'tutor_chat_messages (AI Tutor Chat)',
              'git_commits (Lines Added / Deleted)',
              'peer_audits (Peer Reviews)'
            ].map((table, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>{table}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.85rem'
      }}>
        AITA-INTELLIGENT © 2026 • SWD392 Software Design Project • Group 4 (FPT University Quy Nhon)
      </footer>
    </>
  );
}
