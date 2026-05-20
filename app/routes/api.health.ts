import { json, type LoaderFunctionArgs } from '@remix-run/node';

const PROBE_KEYS = [
  'NODE_ENV',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'APP_URL',
  'AUTH_REQUIRED',
  'REQUIRE_AUTH',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'OPEN_ROUTER_API_KEY',
] as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get('probe') !== '1') {
    return json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }

  const seen: Record<string, string> = {};

  for (const key of PROBE_KEYS) {
    const raw = process.env[key];
    seen[key] = raw ? `present(len=${raw.length})` : 'MISSING';
  }

  return json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    node: process.versions.node,
    env: seen,
    env_count: Object.keys(process.env).length,
  });
};
