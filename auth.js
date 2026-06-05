import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import NeonAdapter from '@auth/neon-adapter';
import { Pool } from '@neondatabase/serverless';
import { getDatabaseUrl } from './lib/dbUrl.js';
import { isAuthEnabled } from './lib/authConfig.js';

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
      const pool = new Pool({ connectionString: getDatabaseUrl(process.env) });

      return {
        adapter: NeonAdapter(pool),
        session: { strategy: 'database' },
        trustHost: true,
        pages: {
          signIn: '/login',
        },
        providers: [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
