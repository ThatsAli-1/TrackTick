import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectMongo, getDb, getMongoClient } from "./mongo";
import { getAuthSiteOrigin } from "./site-url";

type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | null = null;

export async function getAuth(): Promise<AuthInstance> {
  if (authInstance) return authInstance;
  await connectMongo();
  authInstance = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: getAuthSiteOrigin(),
    trustedProxyHeaders: true,
    database: mongodbAdapter(getDb(), { client: getMongoClient() }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },
  }) as unknown as AuthInstance;
  return authInstance;
}
