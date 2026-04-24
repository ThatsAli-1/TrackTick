import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectMongo, getDb, getMongoClient } from "./mongo";

type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | null = null;

export async function getAuth(): Promise<AuthInstance> {
  if (authInstance) return authInstance;
  await connectMongo();
  authInstance = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
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
  }) as AuthInstance;
  return authInstance;
}
