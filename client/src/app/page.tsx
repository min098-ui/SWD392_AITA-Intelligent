'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { useLanguage } from '../context/LanguageContext';
import { 
  Bot, ShieldCheck, Terminal, Cpu, Database, GitCommit, 
  ArrowRight, Sparkles, Code2, Users, Layers, Activity,
  CheckCircle2, Play, AlertTriangle, Shield, Check,
  Github, Twitter, Linkedin, Mail, ExternalLink, ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('STUDENT');
  const { lang } = useLanguage();

  // State cho interactive "Use modes" (Section 5)
  const [activeMode, setActiveMode] = useState<'lecturer' | 'student' | 'admin'>('lecturer');

  // State cho interactive Demo Sandbox (Section 6)
  const [demoActiveTab, setDemoActiveTab] = useState<'console' | 'ai' | 'git'>('console');
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);

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

  const handleRunDemo = () => {
    setIsDemoRunning(true);
    setDemoCompleted(false);
    setTimeout(() => {
      setIsDemoRunning(false);
      setDemoCompleted(true);
    }, 1200);
  };

  // Content Dictionary (Bilingual Support: Vietnamese & English)
  const t = {
    vi: {
      badge: 'SWD392 CAPSTONE PROJECT • NHÓM 4',
      heroTitle1: 'Đánh Giá Code.',
      heroTitle2: 'Chuẩn Xác & Minh Bạch.',
      heroSubtitle: 'Hệ sinh thái chấm điểm tự động tích hợp Sandbox Docker cô lập, trợ lý Socratic Gemini và phân tích Git thời gian thực — loại bỏ triệt để hiện tượng ăn bám trong đồ án nhóm.',
      ctaPrimary: 'Vào Cổng Học Tập',
      ctaSecondary: 'Xem Thử Nghiệm Sandbox',
      supportedBy: 'NỀN TẢNG KỸ THUẬT CỐT LÕI',

      meetTitle: 'Làm quen với AITA.',
      meetBtn: 'Khám phá giải pháp',
      meetDesc: 'AITA là hệ thống chấm điểm và trợ giảng AI thông minh giúp các trường đại học tự động hóa đánh giá đồ án công nghệ, đồng thời đảm bảo tính liêm chính học thuật và đo lường công bằng đóng góp của từng sinh viên.',

      bento1Title: 'Sandbox bảo mật tuyệt đối',
      bento1Desc: 'Biên dịch và thực thi mã nguồn sinh viên an toàn tuyệt đối trong các container Docker cô lập với bộ lọc seccomp syscall, hạn mức tài nguyên CPU/RAM nghiêm ngặt và giới hạn timeout chính xác.',
      bento1Badge: 'Zero-Trust Isolation Active',

      bento2Title: 'Đóng góp minh bạch, không ỷ lại',
      bento2Desc: 'Phân tích tự động dữ liệu Git qua Octokit: đo lường số dòng mã (LOC), tần suất commit và Pull Request theo từng thành viên — kịp thời phát hiện sinh viên không đóng góp.',
      bento2Badge: 'Git Telemetry Monitor',

      bento3Title: 'Trợ giảng Socratic, không làm hộ',
      bento3Desc: 'Tích hợp Gemini 1.5 Pro phân tích kiến trúc code, đặt câu hỏi gợi mở theo phương pháp Socratic để sinh viên tự tìm ra giải pháp thay vì sao chép lời giải có sẵn.',
      bento3Badge: 'Gemini Socratic Tutor',

      partnerTag: 'ĐƯỢC THIẾT KẾ DỰA TRÊN TIÊU CHUẨN CÔNG NGHỆ CAO CẤP',

      useModesTag: 'AITA TRONG THỰC TIỄN',
      useModesTitle: 'Chế độ sử dụng',
      useModesDesc: 'AITA cung cấp các chế độ làm việc tối ưu hóa cho giảng viên, sinh viên và ban quản lý đào tạo hướng đến quy trình đánh giá minh bạch và công bằng.',

      modeLecturer: 'Dành cho Giảng Viên',
      modeStudent: 'Dành cho Sinh Viên',
      modeAdmin: 'Dành cho Ban Quản Trị',

      modeDetails: {
        lecturer: {
          tag: 'CHẾ ĐỘ GIẢNG VIÊN',
          title: 'Trung Tâm Chấm Điểm & Phân Tích Lớp Học',
          desc: 'Tự động chạy hàng trăm repository sinh viên trong một cú nhấp chuột. Xem kết quả test suite tự động, nhận diện dị thường đóng góp Git và xem xét báo cáo chất lượng code tổng quan.',
          linkText: 'Truy cập không gian Giảng viên'
        },
        student: {
          tag: 'CHẾ ĐỘ SINH VIÊN',
          title: 'Môi Trường Thử Nghiệm & Trợ Lý Học Tập',
          desc: 'Kiểm thử code trực tiếp trên Sandbox Docker giống hệt môi trường chấm điểm trước khi nộp bài. Nhận phản hồi gợi ý kiến trúc từ Gemini và theo dõi minh bạch tiến độ đóng góp của bản thân.',
          linkText: 'Mở không gian Sinh viên'
        },
        admin: {
          tag: 'CHẾ ĐỘ QUẢN TRỊ VIÊN',
          title: 'Giám Sát Toàn Diện & Đánh Giá Chéo Nhóm',
          desc: 'Tổng hợp thống kê điểm số toàn khóa học, giám sát kết quả đánh giá đồng đẳng (Peer Review) ẩn danh và lưu trữ lịch sử chấm điểm vĩnh viễn phục vụ kiểm định chất lượng đào tạo.',
          linkText: 'Truy cập hệ thống Quản trị'
        }
      },

      demoBadge: 'TRẢI NGHIỆM TƯƠNG TÁC THỰC TẾ',
      demoTitle: 'Xem AITA vận hành trong từng giây',
      demoDesc: 'Xem cách Docker Sandbox chạy testcases an toàn và Gemini AI đưa ra nhận xét kiến trúc sâu sắc trong thời gian thực.',
      runDemoBtn: 'Chạy Thử Sandbox',
      runningDemo: 'Đang thực thi trong Docker...',

      ctaBottomTitle: 'Sẵn sàng nâng tầm chất lượng đào tạo công nghệ?',
      ctaBottomDesc: 'Đồng hành cùng giảng viên và sinh viên tại FPT University xây dựng môi trường học lập trình minh bạch, hiệu quả và công bằng.',
      ctaBottomBtn: 'Đăng Nhập Cổng Học Tập'
    },
    en: {
      badge: 'SWD392 CAPSTONE PROJECT • GROUP 4',
      heroTitle1: 'Your Code.',
      heroTitle2: 'Works Smarter.',
      heroSubtitle: 'An automated grading ecosystem engineered with isolated Docker sandboxing, Socratic Gemini tutoring, and deep Git contribution telemetry to eliminate free-riding in student teams.',
      ctaPrimary: 'Enter Campus Portal',
      ctaSecondary: 'Interactive Sandbox Demo',
      supportedBy: 'CORE ARCHITECTURAL ENGINES',

      meetTitle: 'Meet AITA.',
      meetBtn: 'Discover capabilities',
      meetDesc: 'AITA is an intelligent grading & pedagogical copilot that empowers academic institutions to automate code assessment while maintaining rigorous academic integrity and equitable teamwork.',

      bento1Title: 'Execution that shields',
      bento1Desc: 'Compile and run untrusted student code safely in isolated Docker containers with seccomp syscall filters, strict CPU quotas, memory ceilings, and sub-second execution timeouts.',
      bento1Badge: 'Zero-Trust Isolation Active',

      bento2Title: 'Always verifiable, zero free-riding',
      bento2Desc: 'Deep Octokit integration automatically tracks lines of code (LOC), commit frequency, and PR velocity — instantly alerting lecturers to passive group members.',
      bento2Badge: 'Git Telemetry Monitor',

      bento3Title: 'Pedagogy first, Socratic hints',
      bento3Desc: 'Powered by Gemini 1.5 Pro to provide qualitative architectural review and Socratic guidance without directly giving away answers, fostering authentic problem-solving skills.',
      bento3Badge: 'Gemini Socratic Tutor',

      partnerTag: 'ENGINEERED FOR MODERN SOFTWARE ENGINEERING EDUCATION & SCALE',

      useModesTag: 'AITA IN PRACTICE',
      useModesTitle: 'Use modes',
      useModesDesc: 'AITA delivers purpose-built modes for lecturers, students, and academic coordinators wanting transparent metrics, fair evaluations, and accelerated learning.',

      modeLecturer: 'For Lecturers',
      modeStudent: 'For Students',
      modeAdmin: 'For Academic Leads',

      modeDetails: {
        lecturer: {
          tag: 'LECTURER WORKSPACE',
          title: 'Automated Evaluation & Cohort Cockpit',
          desc: 'Batch-evaluate hundreds of project repositories simultaneously. Review auto-graded test suite results, Git contribution anomalies, and AI code reviews on a single dashboard.',
          linkText: 'Explore Lecturer Workspace'
        },
        student: {
          tag: 'STUDENT WORKSPACE',
          title: 'Self-Service Sandbox & Socratic Tutoring',
          desc: 'Run test suites in the identical Docker container before submitting. Ask the AI tutor for architectural hints and monitor your team’s verified Git contribution velocity in real time.',
          linkText: 'Launch Student Workspace'
        },
        admin: {
          tag: 'ADMINISTRATOR WORKSPACE',
          title: 'Curriculum Integrity & Peer Audit Oversight',
          desc: 'Consolidate semester-wide cohort trends, audit cross-peer evaluation scores, and ensure transparent grading across all Software Engineering classes.',
          linkText: 'Open Administration Center'
        }
      },

      demoBadge: 'INTERACTIVE LIVE ENVIRONMENT',
      demoTitle: 'See AITA in action under the hood',
      demoDesc: 'Experience how Docker Sandbox safely executes code in milliseconds while Gemini AI provides deep pedagogical guidance.',
      runDemoBtn: 'Execute in Docker Sandbox',
      runningDemo: 'Executing inside Docker...',

      ctaBottomTitle: 'Ready to upgrade software engineering education?',
      ctaBottomDesc: 'Join educators and students leveraging AITA to streamline grading, ensure teamwork fairness, and cultivate world-class software engineers.',
      ctaBottomBtn: 'Sign In to Campus Portal'
    }
  };

  const cur = t[lang] || t.vi;

  return (
    <>
      <Navigation />
      
      <main style={{ overflowX: 'hidden', paddingBottom: '4rem' }}>

        {/* ============================================================ */}
        {/* --- SECTION 1: HERO SECTION (HALO STYLE MASSIVE CARD) --- */}
        {/* ============================================================ */}
        <section id="overview" style={{
          maxWidth: '1360px',
          margin: '2rem auto 4rem',
          padding: '0 1.5rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 14, 23, 0.96) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '36px',
            padding: '4.5rem 3.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center'
          }}>
            {/* Ambient Background Glows inside the Card */}
            <div style={{
              position: 'absolute',
              top: '-15%',
              left: '-10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
              filter: 'blur(70px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, transparent 70%)',
              filter: 'blur(80px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />

            {/* Left Hero Column */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Capstone Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#38bdf8',
                letterSpacing: '0.04em',
                marginBottom: '1.8rem'
              }}>
                <Sparkles size={14} /> {cur.badge}
              </div>

              {/* Main Headline */}
              <h1 style={{
                fontSize: 'clamp(2.8rem, 5.2vw, 4.4rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                marginBottom: '1.5rem',
                color: '#ffffff'
              }}>
                {cur.heroTitle1} <br />
                <span style={{
                  background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {cur.heroTitle2}
                </span>
              </h1>

              {/* Subheadline description */}
              <p style={{
                fontSize: '1.12rem',
                color: '#94a3b8',
                lineHeight: 1.65,
                maxWidth: '520px',
                marginBottom: '2.5rem'
              }}>
                {cur.heroSubtitle}
              </p>

              {/* Action Buttons: Halo Pill Style */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                {!isLoggedIn ? (
                  <Link href="/login" className="pill-btn-white">
                    <span>{cur.ctaPrimary}</span>
                    <span className="pill-arrow">→</span>
                  </Link>
                ) : (
                  <Link href={getDashboardLink()} className="pill-btn-white">
                    <span>{cur.ctaPrimary}</span>
                    <span className="pill-arrow">→</span>
                  </Link>
                )}

                <a href="#demo" className="pill-btn-dark">
                  <span>{cur.ctaSecondary}</span>
                  <span className="pill-arrow">↓</span>
                </a>
              </div>

              {/* Integration Badges Row (Similar to Halo's wep, AAVE, Compound row) */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                  {cur.supportedBy}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', opacity: 0.75 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' }}>DOCKER</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' }}>GEMINI 1.5</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' }}>GITHUB API</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' }}>POSTGRESQL</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' }}>FPT UNIVERSITY</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: 3D Visual Artwork Frame */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '540px',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px -10px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                background: '#070a12'
              }}>
                {/* 3D Tech Visual Image */}
                <img 
                  src="/images/landing-hero.jpg" 
                  alt="AITA Intelligent Architecture"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'cover',
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />

                {/* Floating Telemetry Badges */}
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'rgba(10, 14, 23, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                  0.18s Sandbox Execution
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: '18px',
                  background: 'rgba(10, 14, 23, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#34d399',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                }}>
                  <Shield size={14} />
                  Anti Free-Rider Active
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ============================================================ */}
        {/* --- SECTION 2: SPLIT STATEMENT (MATCHES "MEET USD HALO.") --- */}
        {/* ============================================================ */}
        <section style={{
          maxWidth: '1360px',
          margin: '0 auto 4rem',
          padding: '0 2rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
            padding: '3rem 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            {/* Left side: Bold Title + Pill Button */}
            <div>
              <h2 style={{
                fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                marginBottom: '1.5rem'
              }}>
                {cur.meetTitle}
              </h2>
              <a href="#features" className="pill-btn-dark">
                <span>{cur.meetBtn}</span>
                <span className="pill-arrow">→</span>
              </a>
            </div>

            {/* Right side: Large Editorial Typography */}
            <div>
              <p style={{
                fontSize: 'clamp(1.15rem, 1.8vw, 1.45rem)',
                color: '#cbd5e1',
                lineHeight: 1.6,
                fontWeight: 400
              }}>
                {cur.meetDesc}
              </p>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* --- SECTION 3: BENTO GRID (MATCHES THE 3 HALO BENTO CARDS) --- */}
        {/* ============================================================ */}
        <section id="features" style={{
          maxWidth: '1360px',
          margin: '0 auto 5rem',
          padding: '0 1.5rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '1.5rem'
          }}>

            {/* CARD 1: Wide Card (~50% width on desktop) - Matches "Savings that bloom" */}
            <div id="sandbox" className="halo-card" style={{
              gridColumn: 'span 6',
              padding: '3rem 2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '440px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.09) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.22)'
            }}>
              {/* Top Content */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                <div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#38bdf8',
                    letterSpacing: '0.05em',
                    marginBottom: '0.8rem'
                  }}>
                    <Terminal size={14} /> Docker Sandboxing
                  </span>
                  <h3 style={{
                    fontSize: 'clamp(1.8rem, 2.4vw, 2.3rem)',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15
                  }}>
                    {cur.bento1Title}
                  </h3>
                </div>

                <div style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#38bdf8'
                }}>
                  {cur.bento1Badge}
                </div>
              </div>

              {/* 3D Visual Embedded on the Right/Center of the card */}
              <div style={{
                position: 'relative',
                margin: '2rem 0',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)'
              }}>
                <img 
                  src="/images/landing-sandbox.jpg" 
                  alt="Docker Sandbox Isolation"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10, 14, 23, 0.85) 0%, transparent 60%)',
                  pointerEvents: 'none'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Cpu size={14} /> Seccomp Syscall Filter Active • Zero Network Leakage
                </div>
              </div>

              {/* Bottom Description */}
              <p style={{
                color: '#94a3b8',
                fontSize: '1rem',
                lineHeight: 1.6,
                position: 'relative',
                zIndex: 2
              }}>
                {cur.bento1Desc}
              </p>
            </div>

            {/* CARD 2: Vertical Card (~25% width) - Matches "Always fluid, always pegged." */}
            <div id="telemetry" className="halo-card" style={{
              gridColumn: 'span 3',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '440px',
              background: 'linear-gradient(180deg, rgba(20, 26, 43, 0.8) 0%, rgba(10, 14, 23, 0.98) 100%)'
            }}>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#34d399',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem'
                }}>
                  <GitCommit size={14} /> Git Telemetry
                </span>

                <h3 style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  marginBottom: '1.5rem'
                }}>
                  {cur.bento2Title}
                </h3>

                {/* Visual Widget: Team Contribution Bars */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '4px' }}>
                      <span>Student A (Lead)</span>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>46% LOC</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '46%', height: '100%', borderRadius: '4px', background: '#34d399' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '4px' }}>
                      <span>Student B</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>42% LOC</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '42%', height: '100%', borderRadius: '4px', background: '#38bdf8' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#f87171', marginBottom: '4px' }}>
                      <span>Student C</span>
                      <span style={{ fontWeight: 600 }}>12% (Flagged)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '12%', height: '100%', borderRadius: '4px', background: '#f87171' }} />
                    </div>
                  </div>
                </div>
              </div>

              <p style={{
                color: '#94a3b8',
                fontSize: '0.92rem',
                lineHeight: 1.6
              }}>
                {cur.bento2Desc}
              </p>
            </div>

            {/* CARD 3: Vertical Card (~25% width) - Matches "Fully automated" */}
            <div id="ai-tutor" className="halo-card" style={{
              gridColumn: 'span 3',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '440px',
              background: 'linear-gradient(180deg, rgba(20, 26, 43, 0.8) 0%, rgba(10, 14, 23, 0.98) 100%)'
            }}>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#c084fc',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem'
                }}>
                  <Bot size={14} /> Gemini 1.5 Socratic
                </span>

                <h3 style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  marginBottom: '1.5rem'
                }}>
                  {cur.bento3Title}
                </h3>

                {/* Visual Widget: Socratic Hint Bubble */}
                <div style={{
                  background: 'rgba(192, 132, 252, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid rgba(192, 132, 252, 0.2)',
                  marginBottom: '1.5rem',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#c084fc', fontSize: '0.78rem', fontWeight: 600 }}>
                    <Sparkles size={14} /> Socratic Code Guidance
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic' }}>
                    &ldquo;Notice your nested loop at line 38. How does memoizing intermediate results reduce complexity from O(2ⁿ) to O(n)?&rdquo;
                  </p>
                </div>
              </div>

              <p style={{
                color: '#94a3b8',
                fontSize: '0.92rem',
                lineHeight: 1.6
              }}>
                {cur.bento3Desc}
              </p>
            </div>

          </div>
        </section>


        {/* ============================================================ */}
        {/* --- SECTION 4: PARTNERS & TRUST TICKER (MATCHES HALO TICKER) --- */}
        {/* ============================================================ */}
        <section style={{
          maxWidth: '1360px',
          margin: '0 auto 6rem',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
            padding: '2rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ maxWidth: '320px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {cur.partnerTag}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2.5rem',
              flexWrap: 'wrap',
              opacity: 0.8
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>FPT UNIVERSITY</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>DOCKER ENGINE</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>GOOGLE GEMINI</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>GITHUB OCTOKIT</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>PRISMA ORM</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>SECCOMP V2</span>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* --- SECTION 5: "USE MODES" (SPLIT LAYOUT WITH 3D ACADEMY) --- */}
        {/* ============================================================ */}
        <section id="use-modes" style={{
          maxWidth: '1360px',
          margin: '0 auto 6rem',
          padding: '0 1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center'
          }}>
            {/* Left Column: Use modes overview & Interactive Pill Switchers */}
            <div>
              <span style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1rem'
              }}>
                {cur.useModesTag}
              </span>

              <h2 style={{
                fontSize: 'clamp(2.6rem, 4.5vw, 3.8rem)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                marginBottom: '1.5rem',
                lineHeight: 1.1
              }}>
                {cur.useModesTitle}
              </h2>

              <p style={{
                fontSize: '1.15rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                marginBottom: '2.5rem',
                maxWidth: '500px'
              }}>
                {cur.useModesDesc}
              </p>

              {/* Mode Switcher Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '380px' }}>
                <button 
                  onClick={() => setActiveMode('lecturer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: activeMode === 'lecturer' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: activeMode === 'lecturer' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    color: activeMode === 'lecturer' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.98rem',
                    textAlign: 'left',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Code2 size={18} color={activeMode === 'lecturer' ? '#38bdf8' : '#64748b'} />
                    {cur.modeLecturer}
                  </span>
                  <ChevronRight size={18} color={activeMode === 'lecturer' ? '#38bdf8' : '#64748b'} />
                </button>

                <button 
                  onClick={() => setActiveMode('student')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: activeMode === 'student' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: activeMode === 'student' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    color: activeMode === 'student' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.98rem',
                    textAlign: 'left',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot size={18} color={activeMode === 'student' ? '#38bdf8' : '#64748b'} />
                    {cur.modeStudent}
                  </span>
                  <ChevronRight size={18} color={activeMode === 'student' ? '#38bdf8' : '#64748b'} />
                </button>

                <button 
                  onClick={() => setActiveMode('admin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: activeMode === 'admin' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: activeMode === 'admin' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    color: activeMode === 'admin' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.98rem',
                    textAlign: 'left',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={18} color={activeMode === 'admin' ? '#38bdf8' : '#64748b'} />
                    {cur.modeAdmin}
                  </span>
                  <ChevronRight size={18} color={activeMode === 'admin' ? '#38bdf8' : '#64748b'} />
                </button>
              </div>
            </div>

            {/* Right Column: Featured Card with 3D Cyber Academy Building (Matches Halo Commerce Card) */}
            <div className="halo-card" style={{
              padding: '3rem 2.8rem 0',
              background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(8, 12, 20, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '520px'
            }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#38bdf8',
                  letterSpacing: '0.06em',
                  marginBottom: '1rem'
                }}>
                  {cur.modeDetails[activeMode].tag}
                </span>

                <h3 style={{
                  fontSize: 'clamp(1.8rem, 2.5vw, 2.2rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '1rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}>
                  {cur.modeDetails[activeMode].title}
                </h3>

                <p style={{
                  color: '#94a3b8',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  marginBottom: '1.8rem'
                }}>
                  {cur.modeDetails[activeMode].desc}
                </p>

                <Link 
                  href={isLoggedIn ? getDashboardLink() : "/login"}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#38bdf8',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    marginBottom: '2rem'
                  }}
                >
                  <span>{cur.modeDetails[activeMode].linkText}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* 3D Cyber Academy Campus Illustration at bottom */}
              <div style={{
                margin: '0 -2.8rem',
                borderRadius: '0 0 32px 32px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <img 
                  src="/images/landing-campus.jpg" 
                  alt="AITA Cyber Academy"
                  style={{
                    width: '100%',
                    height: '240px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(8, 12, 20, 0.7) 0%, transparent 80%)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

          </div>
        </section>


        {/* ============================================================ */}
        {/* --- SECTION 6: LIVE INTERACTIVE CODE & SANDBOX CONSOLE --- */}
        {/* ============================================================ */}
        <section id="demo" style={{
          maxWidth: '1360px',
          margin: '0 auto 6rem',
          padding: '0 1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 14, 23, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '32px',
            padding: '3.5rem',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#38bdf8',
                marginBottom: '1.2rem'
              }}>
                <Terminal size={14} /> {cur.demoBadge}
              </div>

              <h2 style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                {cur.demoTitle}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>
                {cur.demoDesc}
              </p>
            </div>

            {/* Interactive Sandbox Terminal Container */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem',
              background: '#060911',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              {/* Left Box: Code Editor Mockup */}
              <div style={{ padding: '1.8rem', borderRight: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>Solution.ts • SWD392 Submission</span>
                  </div>

                  <pre style={{
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    paddingBottom: '1rem'
                  }}>
{`// Task: Optimized Dijkstra Pathfinding
function shortestPath(graph: Graph, src: number): number[] {
  const dist = new Array(graph.v).fill(Infinity);
  const minHeap = new PriorityQueue();
  
  dist[src] = 0;
  minHeap.push({ node: src, cost: 0 });

  while (!minHeap.isEmpty()) {
    const { node, cost } = minHeap.pop();
    if (cost > dist[node]) continue;

    for (const edge of graph.adj[node]) {
      if (dist[node] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[node] + edge.weight;
        minHeap.push({ node: edge.to, cost: dist[edge.to] });
      }
    }
  }
  return dist;
}`}
                  </pre>
                </div>

                <div style={{ paddingTop: '1.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <button 
                    onClick={handleRunDemo}
                    disabled={isDemoRunning}
                    className="pill-btn-white"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>{isDemoRunning ? cur.runningDemo : cur.runDemoBtn}</span>
                  </button>
                </div>
              </div>

              {/* Right Box: Output Telemetry Tabs */}
              <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.8rem' }}>
                  <button 
                    onClick={() => setDemoActiveTab('console')}
                    style={{
                      background: demoActiveTab === 'console' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: demoActiveTab === 'console' ? '#38bdf8' : '#94a3b8',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Terminal size={14} /> Docker Output
                  </button>

                  <button 
                    onClick={() => setDemoActiveTab('ai')}
                    style={{
                      background: demoActiveTab === 'ai' ? 'rgba(192, 132, 252, 0.15)' : 'transparent',
                      color: demoActiveTab === 'ai' ? '#c084fc' : '#94a3b8',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Bot size={14} /> Gemini Socratic Review
                  </button>

                  <button 
                    onClick={() => setDemoActiveTab('git')}
                    style={{
                      background: demoActiveTab === 'git' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                      color: demoActiveTab === 'git' ? '#34d399' : '#94a3b8',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <GitCommit size={14} /> Git Telemetry
                  </button>
                </div>

                {/* Tab 1: Docker Output */}
                {demoActiveTab === 'console' && (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                    <div style={{ color: '#38bdf8', marginBottom: '8px' }}>[INFO] Spawning isolated Docker container (node:20-alpine)...</div>
                    <div style={{ color: '#94a3b8', marginBottom: '8px' }}>[SEC] Seccomp profile mounted. Syscalls filtered: ptrace, reboot, mount.</div>
                    <div style={{ color: '#34d399', marginBottom: '6px' }}>✓ Test 1: Empty Graph Edge Case ............. PASSED (12ms)</div>
                    <div style={{ color: '#34d399', marginBottom: '6px' }}>✓ Test 2: Dense 1,000 Nodes Random Graph .... PASSED (38ms)</div>
                    <div style={{ color: '#34d399', marginBottom: '6px' }}>✓ Test 3: Disconnected Subgraph Matrix ...... PASSED (15ms)</div>
                    <div style={{ color: '#34d399', marginBottom: '12px' }}>✓ Test 4: Heavy Weighted Negative Cycle Guard PASSED (22ms)</div>
                    
                    <div style={{
                      marginTop: '1rem',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={16} /> ALL TESTS PASSED (4/4) • Final Grade: 10.0 / 10.0
                    </div>
                  </div>
                )}

                {/* Tab 2: Gemini AI */}
                {demoActiveTab === 'ai' && (
                  <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 600, marginBottom: '10px' }}>
                      <Sparkles size={16} /> Architectural Quality Score: 96/100
                    </div>
                    <p style={{ marginBottom: '12px', color: '#cbd5e1' }}>
                      <strong>Code Review:</strong> Clean O((V + E) log V) Dijkstra implementation utilizing a min-heap priority queue. Proper early-exit guard when cost exceeds known distance.
                    </p>
                    <div style={{ background: 'rgba(192, 132, 252, 0.08)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid #c084fc' }}>
                      <span style={{ fontWeight: 600, color: '#c084fc' }}>Socratic Question:</span>
                      <p style={{ fontSize: '0.82rem', marginTop: '4px', color: '#cbd5e1' }}>
                        &ldquo;Consider what happens if an edge weight is updated dynamically during execution. How might an Indexed Priority Queue improve cache performance?&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 3: Git Telemetry */}
                {demoActiveTab === 'git' && (
                  <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 600, marginBottom: '10px' }}>
                      <ShieldCheck size={16} /> Authenticated Student Commit (SHA: a7f8c29)
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Author:</span>
                        <strong style={{ color: '#fff' }}>Student ID #SE170123</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Branch:</span>
                        <span style={{ color: '#38bdf8' }}>feature/dijkstra-pathfinding</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Commit Status:</span>
                        <span style={{ color: '#34d399' }}>GPG Signed • No Free-Riding Detected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* --- SECTION 7: HIGH-CONVERSION BOTTOM CALL TO ACTION --- */}
        {/* ============================================================ */}
        <section style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 1.5rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(10, 14, 23, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '36px',
            padding: '5rem 3rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Ambient Radial Lighting */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
              filter: 'blur(90px)',
              pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px', margin: '0 auto' }}>
              <h2 style={{
                fontSize: 'clamp(2.4rem, 4.2vw, 3.4rem)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                marginBottom: '1.5rem',
                lineHeight: 1.15
              }}>
                {cur.ctaBottomTitle}
              </h2>

              <p style={{
                color: '#94a3b8',
                fontSize: '1.15rem',
                lineHeight: 1.6,
                marginBottom: '2.8rem'
              }}>
                {cur.ctaBottomDesc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                {!isLoggedIn ? (
                  <Link href="/login" className="pill-btn-white" style={{ padding: '14px 32px', fontSize: '1.02rem' }}>
                    <span>{cur.ctaBottomBtn}</span>
                    <span className="pill-arrow">→</span>
                  </Link>
                ) : (
                  <Link href={getDashboardLink()} className="pill-btn-white" style={{ padding: '14px 32px', fontSize: '1.02rem' }}>
                    <span>{cur.ctaBottomBtn}</span>
                    <span className="pill-arrow">→</span>
                  </Link>
                )}

                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="pill-btn-dark"
                  style={{ padding: '14px 28px', fontSize: '1.02rem' }}
                >
                  <Github size={18} />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ============================================================ */}
      {/* --- FOOTER: MODERN MINIMAL EDITORIAL FOOTER --- */}
      {/* ============================================================ */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#070a12',
        padding: '5rem 2rem 2.5rem',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '3rem',
          marginBottom: '4rem'
        }}>
          {/* Brand Info */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-neon)'
              }}>
                <Bot size={20} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
                AITA<span style={{ color: '#38bdf8' }}>.INTELLIGENT</span>
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '420px', marginBottom: '1.5rem' }}>
              Nền tảng trợ giảng AI & chấm điểm tự động tích hợp Sandbox Docker an toàn và giám sát đóng góp Git toàn diện cho sinh viên và giảng viên đại học.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8' }}>
              <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }}><Github size={20} /></a>
              <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }}><Twitter size={20} /></a>
              <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }}><Linkedin size={20} /></a>
              <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }}><Mail size={20} /></a>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.2rem' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              <li><a href="#sandbox" style={{ color: '#94a3b8' }}>Docker Sandbox</a></li>
              <li><a href="#ai-tutor" style={{ color: '#94a3b8' }}>Gemini AI Socratic</a></li>
              <li><a href="#telemetry" style={{ color: '#94a3b8' }}>Git Anti Free-Rider</a></li>
              <li><a href="#use-modes" style={{ color: '#94a3b8' }}>Use Modes</a></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.2rem' }}>Academic</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              <li><span style={{ color: '#94a3b8' }}>FPT University</span></li>
              <li><span style={{ color: '#94a3b8' }}>Capstone SWD392</span></li>
              <li><span style={{ color: '#94a3b8' }}>Group 4 Software Team</span></li>
              <li><span style={{ color: '#94a3b8' }}>Spring 2026</span></li>
            </ul>
          </div>

          {/* Column 3: Roles */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.2rem' }}>Portals</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              <li><Link href="/login" style={{ color: '#94a3b8' }}>Student Portal</Link></li>
              <li><Link href="/login" style={{ color: '#94a3b8' }}>Lecturer Workspace</Link></li>
              <li><Link href="/login" style={{ color: '#94a3b8' }}>System Admin</Link></li>
              <li><Link href="/login" style={{ color: '#94a3b8' }}>SSO Authentication</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <p>© 2026 AITA-INTELLIGENT • SWD392 Capstone Project Group 4. All rights reserved.</p>
          <p>Powered by Docker Engine & Google Gemini 1.5 Pro.</p>
        </div>
      </footer>
    </>
  );
}
