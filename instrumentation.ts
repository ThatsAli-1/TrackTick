export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (!process.env.MONGODB_URI?.trim()) {
    console.warn(
      "[TrackTick] MONGODB_URI is not set. Add it to .env.local; MongoDB connects on the first API request.",
    );
  }
}
