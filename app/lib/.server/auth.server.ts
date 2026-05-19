import { redirect } from '@remix-run/node';
import { commitSession, destroySession, getSession } from './session.server';

const SESSION_USER_KEY = 'user';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified: boolean;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Resolve the public origin used for OAuth callbacks. Prefers BASE_URL, then
 * Vercel-provided VERCEL_URL, then falls back to the inbound request origin.
 */
export function getAppOrigin(request: Request): string {
  const explicit = process.env.BASE_URL;

  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const url = new URL(request.url);

  return `${url.protocol}//${url.host}`;
}

export function getGoogleAuthUrl(request: Request, state: string): string {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const redirectUri = `${getAppOrigin(request)}/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code: string, request: Request): Promise<GoogleTokenResponse> {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  const redirectUri = `${getAppOrigin(request)}/auth/google/callback`;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google userinfo fetch failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as GoogleUserInfo;
}

/**
 * Optional comma-separated whitelist of allowed emails. If unset, any verified
 * Google account is allowed. Useful when you don't want every Gmail user on
 * Earth to log in to your private instance.
 */
function isEmailAllowed(email: string): boolean {
  const allowList = process.env.ALLOWED_GOOGLE_EMAILS;

  if (!allowList) {
    return true;
  }

  const allowed = allowList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

/**
 * Complete the OAuth callback: exchange code for tokens, load the user
 * profile, validate it, and return a SessionUser ready to be stored.
 */
export async function handleGoogleCallback(request: Request, code: string): Promise<SessionUser> {
  const tokens = await exchangeCodeForToken(code, request);
  const profile = await fetchGoogleUser(tokens.access_token);

  if (!profile.verified_email) {
    throw new Error('Google account email is not verified');
  }

  if (!isEmailAllowed(profile.email)) {
    throw new Error(`Access denied for ${profile.email}`);
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    verified: profile.verified_email,
  };
}

export async function getUser(request: Request): Promise<SessionUser | null> {
  const session = await getSession(request.headers.get('Cookie'));
  const user = session.get(SESSION_USER_KEY) as SessionUser | undefined;

  return user ?? null;
}

/**
 * Use in loader/action where authentication is mandatory. Redirects to login
 * (preserving the intended URL) if the user is not signed in.
 */
export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);

  if (user) {
    return user;
  }

  const url = new URL(request.url);
  const redirectTo = url.pathname + url.search;
  const params = new URLSearchParams({ redirectTo });

  throw redirect(`/auth/login?${params.toString()}`);
}

export async function createUserSession(request: Request, user: SessionUser, redirectTo: string): Promise<Response> {
  const session = await getSession(request.headers.get('Cookie'));
  session.set(SESSION_USER_KEY, user);

  return redirect(redirectTo, {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
}

export async function logout(request: Request): Promise<Response> {
  const session = await getSession(request.headers.get('Cookie'));

  return redirect('/auth/login', {
    headers: { 'Set-Cookie': await destroySession(session) },
  });
}
