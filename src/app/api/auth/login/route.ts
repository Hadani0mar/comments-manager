import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = process.env.APP_USERNAME || 'azhar';
    const expectedPassword = process.env.APP_PASSWORD || '123';
    const sessionSecret = process.env.SESSION_SECRET || 'default_secret';

    if (username === expectedUsername && password === expectedPassword) {
      const response = NextResponse.json({ success: true, message: 'Successful login' });
      
      // Set session cookie
      response.cookies.set('session', sessionSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      return response;
    }

    return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
