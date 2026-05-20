import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator, isGoogleAuthConfigured } from '~/lib/.server/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  if (!isGoogleAuthConfigured()) {
    // No OAuth available - just send the user to the app.
    throw redirect('/');
  }

  return authenticator.authenticate('google', request);
}

export async function loader(_: LoaderFunctionArgs) {
  // Bare GET to /auth/google should not be used; send the user to the app
  // (or the login page if OAuth is configured).
  throw redirect(isGoogleAuthConfigured() ? '/auth/login' : '/');
}
