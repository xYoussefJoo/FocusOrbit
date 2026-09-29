import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';

// Every Better Auth endpoint (/api/auth/sign-in/email, /api/auth/sign-out, …) goes through here.
export const { GET, POST } = toNextJsHandler(auth);
