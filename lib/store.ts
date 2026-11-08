// Storage layer. Uses Vercel Blob in production (BLOB_READ_WRITE_TOKEN set),
// and a local .data folder in development. Every file is write-once, which
// avoids stale CDN reads and makes tile claims atomic.
import { put, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), ".data");

export type Entry = { pathname: string; url: string };

const ALPHA = "abcdefghijklmnopqrstuvwxyz0123456789";
export function rand(n: number) {
  const bytes = crypto.randomBytes(n);
  return Array.from(bytes, (b) => ALPHA[b % ALPHA.length]).join("");
}

export function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Write a new file. Throws if it already exists. `secret` adds an unguessable suffix. */
export async function save(
  pathname: string,
  body: Buffer | string,
  contentType: string,
  opts: { secret?: boolean } = {}
): Promise<Entry> {
  if (USE_BLOB) {
    const r = await put(pathname, body, {
      access: "public",
      contentType,
      addRandomSuffix: !!opts.secret,
      allowOverwrite: false,
      cacheControlMaxAge: 31536000,
    });
    return { pathname: r.pathname, url: r.url };
  }
  const p = opts.secret ? pathname.replace(/(\.[a-z0-9]+)$/i, `-${rand(16)}$1`) : pathname;
  const full = path.join(LOCAL_DIR, p);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body, { flag: "wx" });
  return { pathname: p, url: `/files/${p}` };
}

/** Try to create a marker file. Returns false if someone else got there first. */
export async function claim(pathname: string): Promise<boolean> {
  try {
    await save(pathname, "{}", "application/json");
    return true;
  } catch {
    return false;
  }
}

export async function listPrefix(prefix: string): Promise<Entry[]> {
  if (USE_BLOB) {
    const out: Entry[] = [];
    let cursor: string | undefined;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      out.push(...r.blobs.map((b) => ({ pathname: b.pathname, url: b.url })));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out;
  }
  const out: Entry[] = [];
  async function walk(rel: string) {
    let items;
    try {
      items = await fs.readdir(path.join(LOCAL_DIR, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const it of items) {
      const p = rel ? `${rel}/${it.name}` : it.name;
      if (it.isDirectory()) await walk(p);
      else if (p.startsWith(prefix)) out.push({ pathname: p, url: `/files/${p}` });
    }
  }
  const base = prefix.includes("/") ? prefix.slice(0, prefix.lastIndexOf("/")) : "";
  await walk(base);
  return out;
}

export async function readJSON<T>(e: Entry): Promise<T> {
  if (USE_BLOB) {
    const r = await fetch(e.url, { cache: "no-store" });
    if (!r.ok) throw new Error(`read failed ${e.pathname}`);
    return (await r.json()) as T;
  }
  return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, e.pathname), "utf8")) as T;
}

export async function readLocalFile(p: string) {
  const full = path.join(LOCAL_DIR, p);
  if (!full.startsWith(LOCAL_DIR + path.sep)) throw new Error("bad path");
  return fs.readFile(full);
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Validates and uploads an image. Returns its public URL, or an error string. */
export async function uploadImage(file: unknown, folder: string): Promise<{ url?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose an image." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "Image must be JPG, PNG, WebP, GIF or SVG." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 4 MB." };
  const buf = Buffer.from(await file.arrayBuffer());
  const e = await save(`${folder}/${rand(20)}.${ext}`, buf, file.type);
  return { url: e.url };
}
