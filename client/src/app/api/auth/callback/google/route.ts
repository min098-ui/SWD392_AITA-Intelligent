import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=google_denied', request.url));
  }

  try {
    const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback/google';

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured in environment variables');
      return NextResponse.redirect(new URL('/login?error=oauth_config_missing', request.url));
    }

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

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to get token from Google:', tokenData);
      return NextResponse.redirect(new URL('/login?error=google_token_failed', request.url));
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

    const state = searchParams.get('state');
    const requestedRole = state === 'LECTURER' ? 'LECTURER' : 'STUDENT';
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
      return NextResponse.redirect(new URL('/login?error=backend_auth_failed', request.url));
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
