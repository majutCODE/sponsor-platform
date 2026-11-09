import { listPrefix, readJSON, sha256 } from "./store";
import { getTemplate, tileTotal } from "./templates";
import { feeFor } from "./money";

const DAY = 24 * 60 * 60 * 1000;

/* ---------- Deal terms ---------- */

export type Term = "event" | "1" | "3" | "6";
/** How long a sponsorship runs, and how often the creator must send a fresh proof photo. */
export const TERMS: Record<Term, { label: string; proofs: number; everyDays: number; cadence: string }> = {
  event: { label: "One-off event", proofs: 1, everyDays: 0, cadence: "Photos from the day" },
  "1": { label: "1 month", proofs: 4, everyDays: 7, cadence: "Proof every week" },
  "3": { label: "3 months", proofs: 6, everyDays: 14, cadence: "Proof every 2 weeks" },
  "6": { label: "6 months", proofs: 6, everyDays: 30, cadence: "Proof every month" },
};
export const isTerm = (s: string): s is Term => s in TERMS;

/** Smallest opening bid, so our fee always covers printing and posting the sticker. */
export const MIN_BID = 5000; // pence
/** Creator has this long after the timer ends to confirm the winning brands. */
export const CONFIRM_WINDOW = 2 * DAY;
/** Days of grace after a proof is due before it counts as missed. */
export const PROOF_GRACE = 3 * DAY;
export const MAX_STRIKES = 3;

/* ---------- Creators ---------- */

export type CreatorMeta = {
  id: string;
  name: string;
  email: string;
  platform: string;
  handle: string;
  followers: number;
  about: string;
  tokenHash: string;
  createdAt: number;
};
export type CreatorEvent =
  | { type: "approved"; at: number }
  | { type: "rejected"; at: number; reason: string }
  | { type: "strike"; at: number; reason: string };
export type CreatorStatus = "pending" | "verified" | "rejected" | "removed";
export type Creator = { meta: CreatorMeta; status: CreatorStatus; strikes: number; events: CreatorEvent[] };

export const CREATOR_STATUS_LABEL: Record<CreatorStatus, string> = {
  pending: "Awaiting review",
  verified: "Verified creator",
  rejected: "Not approved",
  removed: "Verification removed",
};

export const tierOf = (followers: number) => (followers >= 500_000 ? "Headline" : followers >= 50_000 ? "Established" : "Rising");
export const fmtFollowers = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}m` : n >= 1000 ? `${+(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);

const ID = /^[a-z0-9]{6,16}$/;

export async function getCreator(id: string | undefined): Promise<Creator | null> {
  if (!id || !ID.test(id)) return null;
  const entries = await listPrefix(`creators/${id}/`);
  const metaEntry = entries.find((e) => e.pathname.startsWith(`creators/${id}/meta`));
  if (!metaEntry) return null;
  const evEntries = entries.filter((e) => e.pathname.startsWith(`creators/${id}/events/`)).sort((a, b) => a.pathname.localeCompare(b.pathname));
  const [meta, events] = await Promise.all([readJSON<CreatorMeta>(metaEntry), Promise.all(evEntries.map((e) => readJSON<CreatorEvent>(e)))]);
  const strikes = events.filter((e) => e.type === "strike").length;
  const decision = events.filter((e) => e.type !== "strike").at(-1);
  let status: CreatorStatus = decision?.type === "approved" ? "verified" : decision?.type === "rejected" ? "rejected" : "pending";
  if (status === "verified" && strikes >= MAX_STRIKES) status = "removed";
  return { meta, status, strikes, events };
}

export async function getAllCreators(): Promise<Creator[]> {
  const entries = await listPrefix("creators/");
  const ids = new Set<string>();
  for (const e of entries) {
    const m = e.pathname.match(/^creators\/([a-z0-9]+)\/meta/);
    if (m) ids.add(m[1]);
  }
  const all = await Promise.all([...ids].map((id) => getCreator(id)));
  return all.filter((c): c is Creator => !!c).sort((a, b) => b.meta.createdAt - a.meta.createdAt);
}

export const checkCreatorToken = (c: Creator, token: string | undefined) => !!token && sha256(token) === c.meta.tokenHash;

/* ---------- Listings ---------- */

export type ListingMeta = {
  /** Version 2 is the creator and auction model. Older listings are no longer shown. */
  v: 2;
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  rows: number;
  cols: number;
  /** Set design key from lib/templates. Absent on listings that use the free grid over the photo. */
  template?: string;
  term: Term;
  /** Event deals only: the day of the event, as typed by the creator. */
  eventDate?: string;
  /** Bidding opens. */
  launchAt: number;
  /** Timer ends. Highest bid on each spot wins. */
  closesAt: number;
  /** Opening bid for a medium spot, for the whole term, in pence. */
  startBid: number;
  /** Opening bid for a hero spot, for the whole term, in pence. */
  heroBid: number;
  listerName: string;
  tokenHash: string;
  createdAt: number;
};

export type Bid = {
  id: string;
  index: number;
  brandName: string;
  website: string;
  email: string;
  logoUrl: string;
  amount: number; // pence, for the whole term
  paymentRef: string;
  at: number;
};
/** A spot's current leader while bidding is open, or its confirmed sponsor afterwards. */
export type Tile = Bid;

export type ListingEvent =
  | { type: "bid_declined"; at: number; bidId: string }
  | { type: "winners_confirmed"; at: number; winners: Record<number, string> }
  | { type: "proof_submitted"; at: number; proofUrl: string; note: string }
  | { type: "approved"; at: number }
  | { type: "rejected"; at: number; reason: string }
  | { type: "paid_out"; at: number };

export type Status =
  | "upcoming"
  | "live"
  | "confirming"
  | "unsold"
  | "stickers_due"
  | "in_review"
  | "proof_rejected"
  | "running"
  | "proof_overdue"
  | "complete";

export type Listing = {
  meta: ListingMeta;
  creator: Creator | null;
  bids: Bid[];
  declined: Set<string>;
  /** Leaders while bidding, confirmed sponsors after. Keyed by spot index. */
  tiles: Record<number, Tile>;
  /** Lowest bid we will accept next on each spot, in pence. */
  ask: Record<number, number>;
  events: ListingEvent[];
  status: Status;
  confirmed: boolean;
  sold: number;
  total: number;
  gross: number;
  fees: number;
  payout: number;
  paid: boolean;
  proofsApproved: number;
  proofsTotal: number;
  nextProofDue?: number;
  confirmBy: number;
  latestProof?: Extract<ListingEvent, { type: "proof_submitted" }>;
  lastRejection?: Extract<ListingEvent, { type: "rejected" }>;
};

export const STATUS_LABEL: Record<Status, string> = {
  upcoming: "Launching soon",
  live: "Bidding open",
  confirming: "Bidding closed",
  unsold: "Closed, no bids",
  stickers_due: "Stickers going on",
  in_review: "Proof in review",
  proof_rejected: "Proof needs redo",
  running: "Live and verified",
  proof_overdue: "Proof overdue",
  complete: "Deal complete",
};

export const canBid = (l: Listing) => l.status === "live";
/** Creator can send proof once sponsors are confirmed and nothing is waiting on us. */
export const canSubmitProof = (l: Listing) =>
  l.confirmed && ["stickers_due", "proof_rejected", "running", "proof_overdue"].includes(l.status);

/** Hero spots are the prime zones of a set design. Everything else is medium. */
export function isHero(meta: ListingMeta, index: number) {
  const t = getTemplate(meta.template);
  return !!t && t.slots[index % t.slots.length].prime;
}
export const openingBid = (meta: ListingMeta, index: number) => (isHero(meta, index) ? meta.heroBid : meta.startBid);
/** Next bid must beat the leader by 5%, and at least £5, rounded up to a whole pound. */
export const nextBid = (top: number) => Math.ceil((top + Math.max(500, top * 0.05)) / 100) * 100;

export async function getListing(id: string, now = Date.now()): Promise<Listing | null> {
  if (!ID.test(id)) return null;
  const [lEntries, bEntries] = await Promise.all([listPrefix(`listings/${id}/`), listPrefix(`bids/${id}/`)]);
  const metaEntry = lEntries.find((e) => e.pathname.startsWith(`listings/${id}/meta`));
  if (!metaEntry) return null;
  const eventEntries = lEntries
    .filter((e) => e.pathname.startsWith(`listings/${id}/events/`))
    .sort((a, b) => a.pathname.localeCompare(b.pathname));

  const meta = await readJSON<ListingMeta>(metaEntry);
  if (meta.v !== 2) return null;
  const [events, bids, creator] = await Promise.all([
    Promise.all(eventEntries.map((e) => readJSON<ListingEvent>(e))),
    Promise.all(bEntries.filter((e) => e.pathname.endsWith(".json")).map((e) => readJSON<Bid>(e))),
    getCreator(meta.creatorId),
  ]);
  bids.sort((a, b) => b.amount - a.amount || a.at - b.at);

  const template = getTemplate(meta.template);
  const total = template ? tileTotal(template) : meta.rows * meta.cols;
  const declined = new Set(events.flatMap((e) => (e.type === "bid_declined" ? [e.bidId] : [])));
  const confirmation = events.find((e) => e.type === "winners_confirmed") as Extract<ListingEvent, { type: "winners_confirmed" }> | undefined;

  // Bids placed after the timer ended never count.
  const valid = bids.filter((b) => b.at < meta.closesAt && !declined.has(b.id) && b.index < total);
  const tiles: Record<number, Tile> = {};
  if (confirmation) {
    for (const [idx, bidId] of Object.entries(confirmation.winners)) {
      const b = bids.find((x) => x.id === bidId);
      if (b) tiles[Number(idx)] = b;
    }
  } else {
    for (const b of valid) if (!tiles[b.index]) tiles[b.index] = b; // sorted, so first is highest
  }
  const ask: Record<number, number> = {};
  for (let i = 0; i < total; i++) ask[i] = tiles[i] ? nextBid(tiles[i].amount) : openingBid(meta, i);

  const winners = Object.values(tiles);
  const gross = winners.reduce((s, t) => s + t.amount, 0);
  const fees = winners.reduce((s, t) => s + feeFor(t.amount), 0);

  const proofEvents = events.filter((e) => e.type === "proof_submitted" || e.type === "approved" || e.type === "rejected");
  const approvals = events.filter((e) => e.type === "approved");
  const proofsTotal = TERMS[meta.term].proofs;
  const proofsApproved = Math.min(approvals.length, proofsTotal);
  const lastProofEvent = proofEvents.at(-1);
  const termStart = approvals[0]?.at;
  const nextProofDue =
    termStart && proofsApproved < proofsTotal ? termStart + proofsApproved * TERMS[meta.term].everyDays * DAY : undefined;

  let status: Status;
  if (now < meta.launchAt) status = "upcoming";
  else if (now < meta.closesAt) status = "live";
  else if (!confirmation) status = winners.length ? "confirming" : "unsold";
  else if (lastProofEvent?.type === "proof_submitted") status = "in_review";
  else if (lastProofEvent?.type === "rejected") status = "proof_rejected";
  else if (proofsApproved === 0) status = "stickers_due";
  else if (proofsApproved >= proofsTotal) status = "complete";
  else status = nextProofDue && now > nextProofDue + PROOF_GRACE ? "proof_overdue" : "running";

  return {
    meta,
    creator,
    bids,
    declined,
    tiles,
    ask,
    events,
    status,
    confirmed: !!confirmation,
    sold: winners.length,
    total,
    gross,
    fees,
    payout: gross - fees,
    paid: events.some((e) => e.type === "paid_out"),
    proofsApproved,
    proofsTotal,
    nextProofDue,
    confirmBy: meta.closesAt + CONFIRM_WINDOW,
    latestProof: events.filter((e) => e.type === "proof_submitted").at(-1) as Listing["latestProof"],
    lastRejection: events.filter((e) => e.type === "rejected").at(-1) as Listing["lastRejection"],
  };
}

export async function getAllListings(): Promise<Listing[]> {
  const entries = await listPrefix("listings/");
  const ids = new Set<string>();
  for (const e of entries) {
    const m = e.pathname.match(/^listings\/([a-z0-9]+)\/meta/);
    if (m) ids.add(m[1]);
  }
  const all = await Promise.all([...ids].map((id) => getListing(id).catch(() => null)));
  return all.filter((l): l is Listing => !!l).sort((a, b) => b.meta.createdAt - a.meta.createdAt);
}

export const checkToken = (l: Listing, token: string | undefined) => !!token && sha256(token) === l.meta.tokenHash;

/** Payout is owed once the first proof is approved and until we mark it paid. */
export const payoutOwed = (l: Listing) => l.proofsApproved > 0 && !l.paid;
