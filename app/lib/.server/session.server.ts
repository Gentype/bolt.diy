import { createCookieSessionStorage } from '@remix-run/node';

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production');
}

/**
 * Cookie-backed session storage. We keep the user object directly in the
 * cookie (signed) — small enough that a database isn't needed for the auth gate.
 *
 * If the cookie ever exceeds ~4KB, switch to an external store.
 */
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__bolt_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [SESSION_SECRET || 'insecure-dev-secret-change-me'],
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
