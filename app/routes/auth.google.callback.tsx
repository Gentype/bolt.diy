import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { createUserSession, handleGoogleCallback } from '~/lib/.server/auth.server';
import { commitSession, getSession } from '~/lib/.server/session.server';

/**
 * OAuth callback. Validates the state, exchanges the code for tokens,
 * fetches the Google profile, and stores the user in a signed session cookie.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const session = await getSession(request.headers.get('Cookie'));
  const expectedState = session.get('oauth_state') as string | undefined;
  const redirectTo = (session.get('oauth_redirect_to') as string | undefined) || '/';

  // Always clear OAuth flow state — we don't want it to leak into next request
  session.unset('oauth_state');
  session.unset('oauth_redirect_to');

  if (errorParam) {
    return redirectToLoginWithError(errorParam, session);
  }

  if (!code || !state) {
    return redirectToLoginWithError('Missing authorization code or state', session);
  }

  if (!expectedState || state !== expectedState) {
    return redirectToLoginWithError('Invalid OAuth state. Please try again.', session);
  }

  try {
    const user = await handleGoogleCallback(request, code);
    return await createUserSession(request, user, redirectTo);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return redirectToLoginWithError(message, session);
  }
}

async function redirectToLoginWithError(message: string, session: Awaited<ReturnType<typeof getSession>>) {
  const params = new URLSearchParams({ error: message });

  return redirect(`/auth/login?${params.toString()}`, {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
}
