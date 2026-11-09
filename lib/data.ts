import { listPrefix, readJSON, sha256 } from "./store";
import { getTemplate, tileTotal } from "./templates";

export type ListingMeta = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  rows: number;
  cols: number;
  /** Set design key from lib/templates. Absent on listings that use the free grid over the photo. */
  template?: string;
  tilePrice: number; // pence
  listerName: string;
  listerEmail: string;
  tokenHash: string;
  createdAt: number;
};

export type Tile = {
  index: number;
  brandName: string;
  website: string;
  email: string;
  logoUrl: string;
  amount: number; // pence
  fee: number; // pence
  paymentRef: string;
  paidAt: number;
};

export type ListingEvent =
  | { type: "proof_submitted"; at: number; proofUrl: string; note: string }
  | { type: "approved"; at: number }
  | { type: "rejected"; at: number; reason: string }
  | { type: "paid_out"; at: number };

export type Status = "open" | "sold_out" | "in_review" | "proof_rejected" | "approved" | "paid_out";

export type Listing = {
  meta: ListingMeta;
  tiles: Record<number, Tile>;
  events: ListingEvent[];
  status: Status;
  sold: number;
  total: number;
  gross: number;
  fees: number;
  payout: number;
  latestProof?: Extract<ListingEvent, { type: "proof_submitted" }>;
  lastRejection?: Extract<ListingEvent, { type: "rejected" }>;
};

export const STATUS_LABEL: Record<Status, string> = {
  open: "Open for sponsors",
  sold_out: "Fully sponsored",
  in_review: "Proof in review",
  proof_rejected: "Proof needs redo",
  approved: "Verified",
  paid_out: "Verified and paid",
};

/** Brands can buy tiles until the lister submits proof (or after a rejection). */
export const canBuy = (l: Listing) => l.status === "open" || l.status === "proof_rejected";
/** Lister can submit proof once at least one tile is sold and nothing is pending. */
export const canSubmitProof = (l: Listing) =>
  l.sold > 0 && (l.status === "open" || l.status === "sold_out" || l.status === "proof_rejected");

export async function getListing(id: string): Promise<Listing | null> {
  if (!/^[a-z0-9]{6,16}$/.test(id)) return null;
  const [lEntries, tEntries] = await Promise.all([
    listPrefix(`listings/${id}/`),
    listPrefix(`tiles/${id}/`),
  ]);
  const metaEntry = lEntries.find((e) => e.pathname.startsWith(`listings/${id}/meta`));
  if (!metaEntry) return null;
  const eventEntries = lEntries
    .filter((e) => e.pathname.startsWith(`listings/${id}/events/`))
    .sort((a, b) => a.pathname.localeCompare(b.pathname));
  const tileEntries = tEntries.filter((e) => e.pathname.endsWith(".json") && e.pathname.includes("-data"));

  const [meta, events, tileList] = await Promise.all([
    readJSON<ListingMeta>(metaEntry),
    Promise.all(eventEntries.map((e) => readJSON<ListingEvent>(e))),
    Promise.all(tileEntries.map((e) => readJSON<Tile>(e))),
  ]);

  const tiles: Record<number, Tile> = {};
  for (const t of tileList) tiles[t.index] = t;
  const sold = tileList.length;
  const template = getTemplate(meta.template);
  const total = template ? tileTotal(template) : meta.rows * meta.cols;
  const gross = tileList.reduce((s, t) => s + t.amount, 0);
  const fees = tileList.reduce((s, t) => s + t.fee, 0);

  const last = events.at(-1);
  let status: Status = sold >= total ? "sold_out" : "open";
  if (last?.type === "proof_submitted") status = "in_review";
  else if (last?.type === "rejected") status = "proof_rejected";
  else if (last?.type === "approved") status = "approved";
  else if (last?.type === "paid_out") status = "paid_out";

  const proofs = events.filter((e) => e.type === "proof_submitted");
  const rejections = events.filter((e) => e.type === "rejected");

  return {
    meta,
    tiles,
    events,
    status,
    sold,
    total,
    gross,
    fees,
    payout: gross - fees,
    latestProof: proofs.at(-1) as Listing["latestProof"],
    lastRejection: rejections.at(-1) as Listing["lastRejection"],
  };
}

export async function getAllListings(): Promise<Listing[]> {
  const entries = await listPrefix("listings/");
  const ids = new Set<string>();
  for (const e of entries) {
    const m = e.pathname.match(/^listings\/([a-z0-9]+)\/meta/);
    if (m) ids.add(m[1]);
  }
  const all = await Promise.all([...ids].map(getListing));
  return all.filter((l): l is Listing => !!l).sort((a, b) => b.meta.createdAt - a.meta.createdAt);
}

export const checkToken = (l: Listing, token: string | undefined) =>
  !!token && sha256(token) === l.meta.tokenHash;
