"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { rand, save, sha256, uploadImage } from "@/lib/store";
import {
  canBid, canSubmitProof, checkCreatorToken, checkToken, getCreator, getListing, isTerm, MIN_BID, payoutOwed,
  type Bid, type CreatorEvent, type CreatorMeta, type ListingEvent, type ListingMeta,
} from "@/lib/data";
import { fmt } from "@/lib/money";
import { adminPassword, isAdmin } from "@/lib/admin";
import { CATEGORY_NAMES } from "@/lib/categories";
import { templateKeyFor } from "@/lib/templates";
import { ukToUtc } from "@/lib/time";

const DAY = 24 * 60 * 60 * 1000;
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitch", "X", "Other"];

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const fail = (path: string, msg: string): never => {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${encodeURIComponent(msg)}`);
};
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const json = (v: unknown) => JSON.stringify(v);

async function addEvent(id: string, ev: ListingEvent) {
  await save(`listings/${id}/events/${Date.now()}.json`, json(ev), "application/json", { secret: true });
}
async function addCreatorEvent(id: string, ev: CreatorEvent) {
  await save(`creators/${id}/events/${Date.now()}.json`, json(ev), "application/json", { secret: true });
}

/* ---------- Creators ---------- */

export async function applyCreator(fd: FormData) {
  const back = "/creators/apply";
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120);
  const rawPlatform = str(fd, "platform", 20);
  const platform = PLATFORMS.includes(rawPlatform) ? rawPlatform : "Other";
  const handle = str(fd, "handle", 200);
  const followers = Math.floor(Number(fd.get("followers")));
  const about = str(fd, "about", 1000);

  if (!name) fail(back, "Add your name.");
  if (!isEmail(email)) fail(back, "Add a valid email.");
  if (!handle) fail(back, "Add a link to your main account.");
  if (!(followers >= 0 && followers <= 1_000_000_000)) fail(back, "Add your follower count.");
  if (fd.get("uk") !== "on") fail(back, "We are UK only for now.");

  const id = rand(8);
  const token = rand(24);
  const meta: CreatorMeta = { id, name, email, platform, handle, followers, about, tokenHash: sha256(token), createdAt: Date.now() };
  await save(`creators/${id}/meta.json`, json(meta), "application/json", { secret: true });
  redirect(`/c/${id}?t=${token}&new=1`);
}

/* ---------- Listings ---------- */

export async function createListing(fd: FormData) {
  const c = str(fd, "c", 20);
  const t = str(fd, "t", 40);
  const back = `/list/new?c=${c}&t=${t}`;
  const creator = await getCreator(c);
  if (!creator || !checkCreatorToken(creator, t)) return fail("/creators/apply", "Use the private link from your creator page.");
  if (creator.status !== "verified") fail(`/c/${c}?t=${t}`, "Only verified creators can list.");

  const title = str(fd, "title", 120);
  const description = str(fd, "description", 1500);
  const rawCat = str(fd, "category", 40);
  const category = CATEGORY_NAMES.includes(rawCat) ? rawCat : "Other";
  const template = templateKeyFor(category);
  const rows = template ? 0 : Number(fd.get("rows"));
  const cols = template ? 0 : Number(fd.get("cols"));
  const startBid = Math.round(Number(fd.get("startBid")) * 100);
  const heroBid = template ? Math.round(Number(fd.get("heroBid")) * 100) : startBid;
  const rawTerm = str(fd, "term", 10);
  const eventDate = str(fd, "eventDate", 10);
  const now = Date.now();
  const launchRaw = str(fd, "launchAt", 16);
  const launchAt = launchRaw ? ukToUtc(launchRaw) : now;
  const closesAt = ukToUtc(str(fd, "closesAt", 16));

  if (!title) fail(back, "Give your object a title.");
  if (!template && ![rows, cols].every((n) => Number.isInteger(n) && n >= 1 && n <= 8)) fail(back, "Grid must be 1 to 8 rows and columns.");
  if (!isTerm(rawTerm)) return fail(back, "Pick a deal length.");
  if (rawTerm === "event" && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) fail(back, "Add the date of the event.");
  if (!(startBid >= MIN_BID && startBid <= 10_000_000)) fail(back, `Opening bid must be at least ${fmt(MIN_BID)}.`);
  if (!(heroBid >= startBid && heroBid <= 10_000_000)) fail(back, "Hero opening bid must be at least the medium opening bid.");
  if (Number.isNaN(launchAt)) fail(back, "Launch date is not valid.");
  if (Number.isNaN(closesAt)) fail(back, "Add the date and time the timer ends.");
  if (launchAt < now - 5 * 60 * 1000) fail(back, "Launch date is in the past.");
  if (closesAt < Math.max(launchAt, now) + 60 * 60 * 1000) fail(back, "The timer must run for at least 1 hour after launch.");
  if (closesAt > now + 90 * DAY) fail(back, "The timer must end within 90 days.");

  const img = await uploadImage(fd.get("image"), "images");
  if (img.error) fail(back, img.error);

  const id = rand(8);
  const meta: ListingMeta = {
    v: 2,
    id,
    creatorId: creator.meta.id,
    title,
    description,
    category,
    imageUrl: img.url!,
    rows,
    cols,
    ...(template ? { template } : {}),
    term: rawTerm,
    ...(rawTerm === "event" ? { eventDate } : {}),
    launchAt,
    closesAt,
    startBid,
    heroBid,
    listerName: creator.meta.name,
    tokenHash: creator.meta.tokenHash,
    createdAt: now,
  };
  await save(`listings/${id}/meta.json`, json(meta), "application/json", { secret: true });
  revalidatePath("/");
  redirect(`/l/${id}/manage?t=${t}&new=1`);
}

export async function placeBid(fd: FormData) {
  const id = str(fd, "id", 20);
  const idx = Number(fd.get("idx"));
  const back = `/l/${id}/buy/${idx}`;
  const l = await getListing(id);
  if (!l) return fail("/", "Listing not found.");
  if (!Number.isInteger(idx) || idx < 0 || idx >= l.total) fail(`/l/${id}`, "That spot does not exist.");
  if (!canBid(l)) fail(`/l/${id}`, "Bidding is not open on this listing.");

  const brandName = str(fd, "brandName", 80);
  const email = str(fd, "email", 120);
  let website = str(fd, "website", 200);
  if (website && !/^https?:\/\//i.test(website)) website = "https://" + website;
  const amount = Math.round(Number(fd.get("amount")) * 100);
  if (!brandName) fail(back, "Add your brand name.");
  if (!isEmail(email)) fail(back, "Add a valid email.");
  if (!(amount >= l.ask[idx])) fail(back, `Your bid must be at least ${fmt(l.ask[idx])}.`);
  if (amount > 100_000_000) fail(back, "That bid is too high.");
  if (fd.get("agree") !== "on") fail(back, "Please accept the terms.");

  const logo = await uploadImage(fd.get("logo"), "logos");
  if (logo.error) fail(back, logo.error);

  const at = Date.now();
  if (at >= l.meta.closesAt) fail(`/l/${id}`, "The timer just ended.");
  // TEST MODE: no card is held. Replace with a Stripe payment hold, captured when the creator confirms.
  const bid: Bid = { id: rand(12), index: idx, brandName, website, email, logoUrl: logo.url!, amount, paymentRef: "test_" + rand(14), at };
  await save(`bids/${id}/${idx}-${at}.json`, json(bid), "application/json", { secret: true });
  revalidatePath(`/l/${id}`);
  redirect(`/l/${id}?bid=${idx}`);
}

/** Creator turns a brand away. The next highest bid on that spot takes its place. */
export async function declineBid(fd: FormData) {
  const id = str(fd, "id", 20);
  const t = str(fd, "t", 40);
  const bidId = str(fd, "bidId", 20);
  const back = `/l/${id}/manage?t=${t}`;
  const l = await getListing(id);
  if (!l || !checkToken(l, t)) return fail("/", "Invalid manage link.");
  if (l.confirmed) fail(back, "Sponsors are already confirmed.");
  if (!l.bids.some((b) => b.id === bidId)) fail(back, "Bid not found.");
  await addEvent(id, { type: "bid_declined", at: Date.now(), bidId });
  revalidatePath(`/l/${id}`);
  redirect(back);
}

/** Creator agrees to the winning brands once the timer has ended. Locks them in. */
export async function confirmWinners(fd: FormData) {
  const id = str(fd, "id", 20);
  const t = str(fd, "t", 40);
  const back = `/l/${id}/manage?t=${t}`;
  const l = await getListing(id);
  if (!l || !checkToken(l, t)) return fail("/", "Invalid manage link.");
  if (l.status !== "confirming") fail(back, "There is nothing to confirm right now.");
  const winners: Record<number, string> = {};
  for (const [idx, b] of Object.entries(l.tiles)) winners[Number(idx)] = b.id;
  await addEvent(id, { type: "winners_confirmed", at: Date.now(), winners });
  revalidatePath(`/l/${id}`);
  redirect(`${back}&confirmed=1`);
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

/* ---------- Admin ---------- */

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
    await addEvent(id, { type: "rejected", at: now, reason: str(fd, "reason", 300) || "Proof unclear. Make sure every sticker is visible." });
  else if (action === "paid" && payoutOwed(l)) await addEvent(id, { type: "paid_out", at: now });
  else fail("/admin", "That action isn't allowed for this listing's status.");
  revalidatePath("/admin");
  redirect(`/admin#${id}`);
}

export async function adminCreatorAction(fd: FormData) {
  if (!(await isAdmin())) fail("/admin", "Please log in.");
  const id = str(fd, "id", 20);
  const action = str(fd, "action", 20);
  const c = await getCreator(id);
  if (!c) return fail("/admin", "Creator not found.");
  const now = Date.now();
  const reason = str(fd, "reason", 300);
  if (action === "approve" && c.status !== "verified") await addCreatorEvent(id, { type: "approved", at: now });
  else if (action === "reject" && c.status !== "rejected") await addCreatorEvent(id, { type: "rejected", at: now, reason: reason || "Not a fit right now." });
  else if (action === "strike" && c.status === "verified") await addCreatorEvent(id, { type: "strike", at: now, reason: reason || "Missed proof." });
  else fail("/admin", "That action isn't allowed for this creator.");
  revalidatePath("/admin");
  redirect(`/admin#c-${id}`);
}
