import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=github_denied', request.url));
  }

  try {
    const clientId = (process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GITHUB_CLIENT_SECRET || '').trim();
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/callback/github';

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth credentials not configured in environment variables');
      return NextResponse.redirect(new URL('/login?error=oauth_config_missing', request.url));
    }

    // 1. Trao đổi authorization code lấy access_token từ GitHub
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to get token from GitHub:', tokenData);
      return NextResponse.redirect(new URL('/login?error=github_token_failed', request.url));
    }

    // 2. Lấy thông tin tài khoản GitHub người dùng
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'AITA-Intelligent-Platform',
      },
    });

    const githubUser = await userRes.json();
    if (!userRes.ok || !githubUser.login) {
      console.error('Failed to get user from GitHub:', githubUser);
      return NextResponse.redirect(new URL('/login?error=github_user_failed', request.url));
    }

    // 3. Nếu email là private trên GitHub, gọi API lấy danh sách email
    let userEmail = githubUser.email;
    if (!userEmail) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'AITA-Intelligent-Platform',
          },
        });
        const emails = await emailsRes.json();
        if (Array.isArray(emails)) {
          const primaryEmailObj = emails.find((e: any) => e.primary && e.verified) || emails[0];
          if (primaryEmailObj) {
            userEmail = primaryEmailObj.email;
          }
        }
      } catch (e) {
        console.warn('Could not fetch GitHub private emails:', e);
      }
    }

    // Nếu vẫn không có email, tạo email định danh theo GitHub username
    if (!userEmail) {
      userEmail = `${githubUser.login.toLowerCase()}@fpt.edu.vn`;
    }

    const state = searchParams.get('state');
    const requestedRole = state === 'LECTURER' ? 'LECTURER' : 'STUDENT';

    // 4. Đồng bộ với Backend AITA Server
    const backendRes = await fetch('http://localhost:5000/api/auth/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        fullName: githubUser.name || githubUser.login,
        githubUsername: githubUser.login,
        role: requestedRole,
      }),
    });

    const backendData = await backendRes.json();
    if (!backendRes.ok || !backendData.token) {
      console.error('Backend GitHub auth failed:', backendData);
      return NextResponse.redirect(new URL('/login?error=backend_auth_failed', request.url));
    }

    // 5. Chuyển hướng về trang callback client để lưu token vào localStorage
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('token', backendData.token);
    callbackUrl.searchParams.set('user', JSON.stringify(backendData.user));
    callbackUrl.searchParams.set('role', backendData.user.role || requestedRole);
    return NextResponse.redirect(callbackUrl);
  } catch (err: any) {
    console.error('GitHub OAuth callback unexpected error:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }
}
