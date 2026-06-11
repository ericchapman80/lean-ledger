import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import { getAuthMode } from '@/lib/authConfig';

async function signInWithGoogle(formData) {
  'use server';
  const redirectTo = formData.get('redirectTo');
  await signIn('google', {
    redirectTo: typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/profile',
  });
}

async function signOutToLogin() {
  'use server';
  await signOut({ redirectTo: '/login' });
}

export default async function LoginPage({ searchParams }) {
  const authMode = getAuthMode(process.env);
  const session = authMode === 'enabled' ? await auth() : null;
  const redirectTo = typeof searchParams?.next === 'string' && searchParams.next.startsWith('/')
    ? searchParams.next
    : '/profile';
  const reason = searchParams?.reason;

  return (
    <div className="container" style={{ padding: '48px 20px', maxWidth: '640px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '12px' }}>Account & Access</h1>
        {reason === 'session-expired' && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--warning-color)',
              background: 'var(--warning-surface)',
              color: 'var(--text-primary)',
            }}
          >
            Your session expired. Sign in again to keep using Lean Ledger.
          </div>
        )}
        {reason === 'access-denied' && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--danger-color)',
              background: 'var(--danger-surface)',
              color: 'var(--text-primary)',
            }}
          >
            Access has not been approved for this Google account yet. Ask an admin to invite your email first.
          </div>
        )}
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
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <button type="submit" className="btn btn-primary">
                Sign in with Google
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: '24px', fontSize: '14px' }}>
          <Link href="/profile">Back to profile</Link>
        </div>
      </div>
    </div>
  );
}
