import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getGoogleCredentials() {
  let clientId = '';
  let clientSecret = '';

  const candidatePaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), 'client', '.env.local'),
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            if (key === 'GOOGLE_CLIENT_ID' && !clientId) clientId = val;
            if (key === 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' && !clientId) clientId = val;
            if (key === 'GOOGLE_CLIENT_SECRET' && !clientSecret) clientSecret = val;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const isStale = (s?: string) => !s || s.includes('255327045579') || s.includes('GOCSPX-L31vo');

  if (isStale(clientId)) {
    const nextPublic = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    if (!isStale(nextPublic)) {
      clientId = nextPublic;
    } else {
      clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    }
  }

  if (isStale(clientSecret)) {
    const envSec = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    if (!isStale(envSec)) {
      clientSecret = envSec;
    }
  }

  return { clientId, clientSecret };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=google_denied', request.url));
  }

  try {
    const { clientId, clientSecret } = getGoogleCredentials();
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback/google';

    // 1. Trao đổi authorization code lấy access_token từ Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const state = searchParams.get('state');
    const requestedRole = state === 'LECTURER' ? 'LECTURER' : 'STUDENT';

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to get token from Google:', {
        status: tokenRes.status,
        error: tokenData.error,
        error_description: tokenData.error_description,
        clientIdUsed: clientId ? `${clientId.slice(0, 15)}...` : 'missing',
      });
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'google_token_failed');
      if (tokenData.error_description) {
        errorUrl.searchParams.set('message', tokenData.error_description);
      }
      return NextResponse.redirect(errorUrl);
    }

    // 2. Lấy thông tin tài khoản người dùng từ Google UserInfo API
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      console.error('Failed to get userinfo from Google:', googleUser);
      return NextResponse.redirect(new URL('/login?error=google_userinfo_failed', request.url));
    }

    const ADMIN_EMAILS = ['lenguyenanhmai05@gmail.com', 'admin@fpt.edu.vn'];
    const isAdmin = ADMIN_EMAILS.includes((googleUser.email || '').toLowerCase().trim());
    const finalRole = isAdmin ? 'ADMIN' : requestedRole;

    // 3. Đồng bộ với Backend AITA Server (cấp JWT token và phân quyền)
    const backendRes = await fetch('http://localhost:5000/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: googleUser.email,
        fullName: googleUser.name || googleUser.email.split('@')[0],
        role: finalRole,
      }),
    });

    const backendData = await backendRes.json();
    if (!backendRes.ok || !backendData.token) {
      console.error('Backend Google auth failed:', backendData);
      const errorCode = backendData.code || 'backend_auth_failed';
      const errorMessage = backendData.message || 'Đăng nhập không thành công';
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', errorCode);
      errorUrl.searchParams.set('message', errorMessage);
      return NextResponse.redirect(errorUrl);
    }

    // 4. Chuyển hướng về trang callback client để lưu token vào localStorage
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('token', backendData.token);
    callbackUrl.searchParams.set('user', JSON.stringify(backendData.user));
    callbackUrl.searchParams.set('role', backendData.user.role || finalRole);
    return NextResponse.redirect(callbackUrl);
  } catch (err: any) {
    console.error('Google OAuth callback unexpected error:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }
}
