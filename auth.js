import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import NeonAdapter from '@auth/neon-adapter';
import { isAuthEnabled } from './lib/authConfig.js';
import { createAuthAdapterClient } from './lib/authDbClient.js';

function createDisabledAuth() {
  const disabled = () => new Response('Auth is not enabled for this environment.', { status: 503 });

  return {
    handlers: {
      GET: disabled,
      POST: disabled,
    },
    auth: async () => null,
    signIn: async () => {
      throw new Error('Auth is not enabled for this environment.');
    },
    signOut: async () => {
      throw new Error('Auth is not enabled for this environment.');
    },
  };
}

const authKit = isAuthEnabled(process.env)
  ? NextAuth(() => {
      const { kind, pool } = createAuthAdapterClient(process.env);

      return {
        adapter: NeonAdapter(pool),
        session: { strategy: 'database' },
        trustHost: true,
        debug: process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true',
        logger: {
          error(code, ...message) {
            console.error('[auth][error]', code, ...message);
          },
          warn(code, ...message) {
            console.warn('[auth][warn]', code, ...message);
          },
          debug(code, ...message) {
            if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
              console.debug('[auth][debug]', code, ...message);
            }
          },
        },
        pages: {
          signIn: '/login',
        },
        events: {
          async signIn({ user, account }) {
            console.info('[auth][signIn]', { userId: user?.id, email: user?.email, provider: account?.provider, adapterClient: kind });
          },
          async linkAccount({ user, account }) {
            console.info('[auth][linkAccount]', { userId: user?.id, email: user?.email, provider: account?.provider });
          },
        },
        providers: [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // Required for the staged owner-claim rollout: the existing single-user
            // owner row is pre-claimed by email before the first Google login.
            allowDangerousEmailAccountLinking: true,
          }),
        ],
        callbacks: {
          session({ session, user }) {
            if (session.user && user?.id != null) {
              session.user.id = String(user.id);
            }
            return session;
          },
        },
      };
    })
  : createDisabledAuth();

export const { handlers, auth, signIn, signOut } = authKit;
