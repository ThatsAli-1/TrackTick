/** Public origin for Better Auth (no trailing slash). */
export function getAuthSiteOrigin(): string | undefined {
  const explicit =
    process.env.BETTER_AUTH_URL?.trim() || process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      return explicit.replace(/\/$/, "");
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (!vercel) return undefined;
  const withProto = vercel.startsWith("http://") || vercel.startsWith("https://") ? vercel : `https://${vercel}`;
  try {
    return new URL(withProto).origin;
  } catch {
    return undefined;
  }
}
