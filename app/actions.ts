"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { claim, rand, save, sha256, uploadImage } from "@/lib/store";
import { canBuy, canSubmitProof, checkToken, getListing, type ListingEvent, type ListingMeta, type Tile } from "@/lib/data";
import { feeFor } from "@/lib/money";
import { adminPassword, isAdmin } from "@/lib/admin";
import { CATEGORY_NAMES } from "@/lib/categories";

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const fail = (path: string, msg: string): never => {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${encodeURIComponent(msg)}`);
};
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

async function addEvent(id: string, ev: ListingEvent) {
  await save(`listings/${id}/events/${Date.now()}.json`, JSON.stringify(ev), "application/json", { secret: true });
}

export async function createListing(fd: FormData) {
  const back = "/list/new";
  const title = str(fd, "title", 120);
  const description = str(fd, "description", 1500);
  const rawCat = str(fd, "category", 40);
  const category = CATEGORY_NAMES.includes(rawCat) ? rawCat : "Other";
  const listerName = str(fd, "listerName", 80);
  const listerEmail = str(fd, "listerEmail", 120);
  const rows = Number(fd.get("rows"));
  const cols = Number(fd.get("cols"));
  const price = Number(fd.get("price"));

  if (!title) fail(back, "Give your object a title.");
  if (!listerName) fail(back, "Add your name.");
  if (!isEmail(listerEmail)) fail(back, "Add a valid email.");
  if (![rows, cols].every((n) => Number.isInteger(n) && n >= 1 && n <= 8)) fail(back, "Grid must be 1 to 8 rows and columns.");
  if (!(price >= 1 && price <= 100000)) fail(back, "Tile price must be between £1 and £100,000.");

  const img = await uploadImage(fd.get("image"), "images");
  if (img.error) fail(back, img.error);

  const id = rand(8);
  const token = rand(24);
  const meta: ListingMeta = {
    id,
    title,
    description,
    category,
    imageUrl: img.url!,
    rows,
    cols,
    tilePrice: Math.round(price * 100),
    listerName,
    listerEmail,
    tokenHash: sha256(token),
    createdAt: Date.now(),
  };
  await save(`listings/${id}/meta.json`, JSON.stringify(meta), "application/json", { secret: true });
  revalidatePath("/");
  redirect(`/l/${id}/manage?t=${token}&new=1`);
}

export async function buyTile(fd: FormData) {
  const id = str(fd, "id", 20);
  const idx = Number(fd.get("idx"));
  const back = `/l/${id}/buy/${idx}`;
  const l = await getListing(id);
  if (!l) return fail("/", "Listing not found.");
  if (!Number.isInteger(idx) || idx < 0 || idx >= l.total) fail(`/l/${id}`, "That tile does not exist.");
  if (!canBuy(l)) fail(`/l/${id}`, "This listing is no longer taking sponsors.");
  if (l.tiles[idx]) fail(`/l/${id}`, "Sorry, that tile is already sponsored.");

  const brandName = str(fd, "brandName", 80);
  const email = str(fd, "email", 120);
  let website = str(fd, "website", 200);
  if (website && !/^https?:\/\//i.test(website)) website = "https://" + website;
  if (!brandName) fail(back, "Add your brand name.");
  if (!isEmail(email)) fail(back, "Add a valid email.");
  if (fd.get("agree") !== "on") fail(back, "Please accept the terms.");

  const logo = await uploadImage(fd.get("logo"), "logos");
  if (logo.error) fail(back, logo.error);

  // Atomic claim so two brands can't buy the same tile.
  const got = await claim(`tiles/${id}/${idx}.lock`);
  if (!got) fail(`/l/${id}`, "Sorry, someone just sponsored that tile. Pick another.");

  // TEST MODE: no real payment. Replace with a Stripe Checkout session.
  const tile: Tile = {
    index: idx,
    brandName,
    website,
    email,
    logoUrl: logo.url!,
    amount: l.meta.tilePrice,
    fee: feeFor(l.meta.tilePrice),
    paymentRef: "test_" + rand(14),
    paidAt: Date.now(),
  };
  await save(`tiles/${id}/${idx}-data.json`, JSON.stringify(tile), "application/json", { secret: true });
  revalidatePath(`/l/${id}`);
  redirect(`/l/${id}?bought=${idx}`);
}

export async function submitProof(fd: FormData) {
  const id = str(fd, "id", 20);
  const t = str(fd, "t", 40);
  const back = `/l/${id}/manage?t=${t}`;
  const l = await getListing(id);
  if (!l || !checkToken(l, t)) return fail("/", "Invalid manage link.");
  if (!canSubmitProof(l)) fail(back, "You can't submit proof right now.");
  const img = await uploadImage(fd.get("proof"), "proofs");
  if (img.error) fail(back, img.error);
  await addEvent(id, { type: "proof_submitted", at: Date.now(), proofUrl: img.url!, note: str(fd, "note", 500) });
  redirect(`${back}&submitted=1`);
}

export async function adminLogin(fd: FormData) {
  const pw = adminPassword();
  if (!pw || String(fd.get("password")) !== pw) fail("/admin", "Wrong password.");
  (await cookies()).set("ts_admin", sha256("ts-admin:" + pw), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin");
}

export async function adminLogout() {
  (await cookies()).delete("ts_admin");
  redirect("/admin");
}

export async function adminAction(fd: FormData) {
  if (!(await isAdmin())) fail("/admin", "Please log in.");
  const id = str(fd, "id", 20);
  const action = str(fd, "action", 20);
  const l = await getListing(id);
  if (!l) return fail("/admin", "Listing not found.");
  const now = Date.now();
  if (action === "approve" && l.status === "in_review") await addEvent(id, { type: "approved", at: now });
  else if (action === "reject" && l.status === "in_review")
    await addEvent(id, { type: "rejected", at: now, reason: str(fd, "reason", 300) || "Proof unclear. Make sure every logo is visible." });
  else if (action === "paid" && l.status === "approved") await addEvent(id, { type: "paid_out", at: now });
  else fail("/admin", "That action isn't allowed for this listing's status.");
  revalidatePath("/admin");
  redirect(`/admin#${id}`);
}
