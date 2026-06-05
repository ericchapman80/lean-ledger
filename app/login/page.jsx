import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import { getAuthMode } from '@/lib/authConfig';

async function signInWithGoogle() {
  'use server';
  await signIn('google', { redirectTo: '/profile' });
}

async function signOutToLogin() {
  'use server';
  await signOut({ redirectTo: '/login' });
}

export default async function LoginPage() {
  const authMode = getAuthMode(process.env);
  const session = authMode === 'enabled' ? await auth() : null;

  return (
    <div className="container" style={{ padding: '48px 20px', maxWidth: '640px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '12px' }}>Account</h1>
        {session?.user?.id && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Signed in as {session.user.email || session.user.name || `user ${session.user.id}`}.
            </p>
            <form action={signOutToLogin}>
              <button type="submit" className="btn btn-secondary">
                Sign out
              </button>
            </form>
          </>
        )}

        {!session?.user?.id && authMode === 'disabled' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Google auth groundwork is installed, but sign-in is not enabled in this environment yet.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
              Keep using the current single-user flow for now. Enable auth later by setting
              {' '}<code>AUTH_ENABLED=true</code> with the Google auth credentials.
            </p>
          </>
        )}

        {!session?.user?.id && authMode === 'configured' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Google auth credentials are configured, but auth cutover is intentionally still off.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
              This keeps the current owner data path stable until the owner-claim rehearsal is complete.
            </p>
          </>
        )}

        {!session?.user?.id && authMode === 'enabled' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Sign in with Google to access your private Lean Ledger data.
            </p>
            <form action={signInWithGoogle}>
              <button type="submit" className="btn btn-primary">
                Sign in with Google
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: '24px', fontSize: '14px' }}>
          <Link href="/">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
