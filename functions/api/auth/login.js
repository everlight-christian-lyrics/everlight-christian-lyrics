import { makeCookie, cookieHeader, json } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({
      error: 'Admin secrets are missing.',
      adminPasswordPresent: Boolean(env.ADMIN_PASSWORD),
      sessionSecretPresent: Boolean(env.SESSION_SECRET)
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (typeof body.password !== 'string' ||
      body.password !== env.ADMIN_PASSWORD) {
    return json({
      error: 'Incorrect password.',
      submittedLength: typeof body.password === 'string'
        ? body.password.length
        : null,
      configuredLength: env.ADMIN_PASSWORD.length,
      matches: typeof body.password === 'string' &&
        body.password === env.ADMIN_PASSWORD
    }, 401);
  }

  const cookie = await makeCookie(env.SESSION_SECRET);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': cookieHeader(cookie)
    }
  });
}
