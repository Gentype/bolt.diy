import { json, redirect, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { getUser } from '~/lib/.server/auth.server';

export const meta: MetaFunction = () => [{ title: 'Sign in · bolt.diy' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (user) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/';
    throw redirect(redirectTo);
  }

  const url = new URL(request.url);

  return json({
    error: url.searchParams.get('error'),
  });
}

export default function Login() {
  const { error } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  const googleHref = `/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bolt-elements-background-depth-1 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-8 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary">Welcome to bolt.diy</h1>
          <p className="text-sm text-bolt-elements-textSecondary">Sign in with your Google account to continue</p>
        </div>

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <Link
          to={googleHref}
          className="flex items-center justify-center gap-3 w-full rounded-md border border-bolt-elements-borderColor bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </Link>

        <p className="text-xs text-center text-bolt-elements-textTertiary">
          Access is restricted to authorized Google accounts.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a10.99 10.99 0 000 9.86l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}
