import { getAuth } from "./auth";

/** Resolves the signed-in user id from the request, or `null` if not authenticated. */
export async function getSessionUserId(request: Request): Promise<string | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}
