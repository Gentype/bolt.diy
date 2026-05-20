import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator, isAuthRequired } from '~/lib/.server/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // If auth isn't enforced, the OAuth callback shouldn't be in play at all.
  // Send the user to the app instead of trying to run a strategy that may
  // not be registered.
  if (!isAuthRequired()) {
    throw redirect('/');
  }

  return authenticator.authenticate('google', request, {
    successRedirect: '/',
    failureRedirect: '/auth/login',
  });
}
