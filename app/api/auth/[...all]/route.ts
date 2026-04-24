import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

let handlers: ReturnType<typeof toNextJsHandler> | null = null;

async function getHandlers() {
  if (!handlers) {
    handlers = toNextJsHandler(await getAuth());
  }
  return handlers;
}

export async function GET(request: Request) {
  return (await getHandlers()).GET(request);
}

export async function POST(request: Request) {
  return (await getHandlers()).POST(request);
}
