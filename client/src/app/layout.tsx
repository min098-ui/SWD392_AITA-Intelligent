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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('aita_theme') || 'dark';
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
