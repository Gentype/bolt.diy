import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/lib/.server/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.logout(request, { redirectTo: '/auth/login' });
}

export async function loader({ request }: LoaderFunctionArgs) {
  return authenticator.logout(request, { redirectTo: '/auth/login' });
}
