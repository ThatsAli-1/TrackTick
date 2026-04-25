import { createAuthClient } from "better-auth/react";

const explicitPublic = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();

/**
 * Omit baseURL when unset so Better Auth resolves it from `window.location`
 * in the browser (correct on Vercel) and from `VERCEL_URL` during SSR.
 * Never default to localhost — that breaks production sign-in.
 */
export const authClient = createAuthClient(
  explicitPublic ? { baseURL: explicitPublic } : {},
);
