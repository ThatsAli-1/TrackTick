import { readFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED = new Set(["model.json", "metadata.json", "weights.bin"]);
const BASE_DIR = path.join(process.cwd(), "models", "pose");

type Params = { params: Promise<{ file: string }> };

export async function GET(_: Request, { params }: Params) {
  const { file } = await params;
  if (!ALLOWED.has(file)) {
    return Response.json({ error: "File not found." }, { status: 404 });
  }

  const fullPath = path.join(BASE_DIR, file);
  const data = await readFile(fullPath);
  const contentType =
    file === "weights.bin" ? "application/octet-stream" : "application/json; charset=utf-8";

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
