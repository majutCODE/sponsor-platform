// Serves uploaded files in local development only (production uses Vercel Blob URLs).
import { readLocalFile } from "@/lib/store";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", json: "application/json" };

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return new Response("Not found", { status: 404 });
  const p = (await params).path.join("/");
  if (p.endsWith(".json")) return new Response("Not found", { status: 404 });
  try {
    const buf = await readLocalFile(p);
    return new Response(new Uint8Array(buf), { headers: { "content-type": TYPES[p.split(".").pop()!] ?? "application/octet-stream" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
