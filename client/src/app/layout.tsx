import React from 'react';
import './globals.css';

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
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
