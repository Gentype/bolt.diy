import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { logout } from '~/lib/.server/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

// Logout via GET is convenient for a simple link in the UI.
export async function loader({ request }: LoaderFunctionArgs) {
  return logout(request);
}

export default function Logout() {
  // This component should never render — both loader and action redirect.
  return redirect('/auth/login');
}
