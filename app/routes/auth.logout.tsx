import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator, isAuthRequired } from '~/lib/.server/auth.server';

function postLogoutTarget(): string {
  // When auth isn't enforced the login page is unreachable, so send users
  // back to the app root after logout instead.
  return isAuthRequired() ? '/auth/login' : '/';
}

export async function action({ request }: ActionFunctionArgs) {
  if (!isAuthRequired()) {
    throw redirect('/');
  }

  return authenticator.logout(request, { redirectTo: postLogoutTarget() });
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isAuthRequired()) {
    throw redirect('/');
  }

  return authenticator.logout(request, { redirectTo: postLogoutTarget() });
}
