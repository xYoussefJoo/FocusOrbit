import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './auth';

// Browser-side helper: signIn.email, signUp.email, signOut, useSession.
// It calls /api/auth/* on the same origin, so no URL is needed.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
