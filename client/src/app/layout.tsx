import React from 'react';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';

export const metadata = {
  title: 'AITA-INTELLIGENT | AI Teaching Assistant & Code Analytics Platform',
  description: 'AI-Powered Teaching Assistant, Sandbox Autograding, and Student Contribution Analytics for SWD392',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('aita_theme') || 'light';
                  document.documentElement.setAttribute('data-theme', saved);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
