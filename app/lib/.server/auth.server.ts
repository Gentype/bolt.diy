import { createCookieSessionStorage, redirect } from '@remix-run/node';
import { Authenticator } from 'remix-auth';
import { GoogleStrategy } from 'remix-auth-google';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const sessionSecret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!sessionSecret) {
  console.warn(
    '[auth] SESSION_SECRET is not set. Falling back to a development-only secret. ' +
      'Set SESSION_SECRET (or NEXTAUTH_SECRET) in your environment for production deployments.',
  );
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__bolt_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [sessionSecret ?? 'dev-only-insecure-secret-change-me'],
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});

export const authenticator = new Authenticator<AuthUser>(sessionStorage);

const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

function resolveCallbackURL(request?: Request): string {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }

  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;

  if (appUrl) {
    return `${appUrl.replace(/\/$/, '')}/auth/google/callback`;
  }

  /*
   * Best-effort fallback when env is misconfigured: derive from the incoming
   * request URL so OAuth at least roundtrips against the current origin.
   */
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}/auth/google/callback`;
  }

  return 'http://localhost:5173/auth/google/callback';
}

if (googleClientID && googleClientSecret) {
  authenticator.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: resolveCallbackURL(),
      },
      async ({ profile }) => {
        const email = profile.emails?.[0]?.value ?? '';
        const allowList = (process.env.ALLOWED_EMAILS ?? '')
          .split(',')
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean);

        if (allowList.length > 0) {
          const isAllowed = allowList.some((entry) => {
            if (entry.startsWith('@')) {
              return email.toLowerCase().endsWith(entry);
            }

            return email.toLowerCase() === entry;
          });

          if (!isAllowed) {
            throw new Error(`Email ${email} is not authorized to access this application`);
          }
        }

        const user: AuthUser = {
          id: profile.id,
          email,
          name: profile.displayName ?? email,
          picture: profile.photos?.[0]?.value,
        };

        return user;
      },
    ),
    'google',
  );
} else {
  console.warn('[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. Google sign-in will be unavailable.');
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(googleClientID && googleClientSecret);
}

/**
 * Paths that bypass the authentication gate. These must be reachable while
 * unauthenticated so users can sign in and so health/auth endpoints work.
 */
const PUBLIC_PATH_PREFIXES = ['/auth/', '/api/health'];
const PUBLIC_PATH_EXACT = new Set(['/auth/login', '/auth/google', '/auth/google/callback', '/auth/logout']);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_EXACT.has(pathname)) {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function getOptionalUser(request: Request): Promise<AuthUser | null> {
  return authenticator.isAuthenticated(request);
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    const url = new URL(request.url);
    const search = url.pathname === '/' ? '' : `?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(`/auth/login${search}`);
  }

  return user;
}
