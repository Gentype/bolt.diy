import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator } from '~/lib/.server/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.authenticate('google', request);
}

export async function loader(_: LoaderFunctionArgs) {
  // Bare GET to /auth/google should not be used; send the user to the login page.
  throw redirect('/auth/login');
}
