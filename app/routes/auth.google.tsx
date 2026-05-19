import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { commitSession, getSession } from '~/lib/.server/session.server';
import { getGoogleAuthUrl } from '~/lib/.server/auth.server';

/**
 * Initiates the Google OAuth flow.
 * Generates a CSRF state token, stashes it in the session, and redirects to Google.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  const state = crypto.randomUUID();

  const session = await getSession(request.headers.get('Cookie'));
  session.set('oauth_state', state);
  session.set('oauth_redirect_to', redirectTo);

  const authUrl = getGoogleAuthUrl(request, state);

  return redirect(authUrl, {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
}
