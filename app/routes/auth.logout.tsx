import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator, isGoogleAuthConfigured } from '~/lib/.server/auth.server';

function postLogoutTarget(): string {
  // When Google OAuth isn't configured the login page is unreachable, so
  // send users back to the app root after logout instead.
  return isGoogleAuthConfigured() ? '/auth/login' : '/';
}

export async function action({ request }: ActionFunctionArgs) {
  if (!isGoogleAuthConfigured()) {
    throw redirect('/');
  }

  return authenticator.logout(request, { redirectTo: postLogoutTarget() });
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isGoogleAuthConfigured()) {
    throw redirect('/');
  }

  return authenticator.logout(request, { redirectTo: postLogoutTarget() });
}
