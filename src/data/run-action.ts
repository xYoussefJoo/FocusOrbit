import 'server-only';
import { getCurrentUser, UnauthenticatedError, type CurrentUser } from './auth';
import { SessionError } from './sessions';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; error: string };

/**
 * The shape every Server Action shares: resolve the signed-in user, run the
 * work, and turn known errors into a small result the UI can show.
 * Unknown errors are logged on the server and never leak details to the browser.
 */
export async function runAction<T>(fn: (user: CurrentUser) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthenticatedError();
    return { ok: true, data: await fn(user) };
  } catch (err) {
    if (err instanceof SessionError) return { ok: false, code: err.code, error: err.message };
    if (err instanceof UnauthenticatedError) return { ok: false, code: 'UNAUTHENTICATED', error: err.message };
    console.error('[action] unexpected error', err);
    return { ok: false, code: 'UNKNOWN', error: 'Something went wrong. Please try again.' };
  }
}
