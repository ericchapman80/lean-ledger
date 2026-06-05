import { auth } from '@/auth';
import { isAuthEnabled } from '@/lib/authConfig';

// Multi-tenancy seam.
// Until AUTH_ENABLED=true, the app intentionally stays on the original single-user owner path.
// Once enabled, requests must carry an Auth.js session user id.
export async function getCurrentUserId(_request) {
  if (!isAuthEnabled(process.env)) {
    return 1;
  }

  const session = await auth();
  const id = Number(session?.user?.id);

  if (Number.isInteger(id)) {
    return id;
  }

  const error = new Error('Unauthenticated');
  error.status = 401;
  throw error;
}
