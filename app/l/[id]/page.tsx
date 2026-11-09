import Link from "next/link";
import { notFound } from "next/navigation";
import { canBid, fmtFollowers, getListing, TERMS, tierOf } from "@/lib/data";
import { FEE_RATE, fmt } from "@/lib/money";
import { fmtDate, fmtDateTime } from "@/lib/time";
import { categoryOf } from "@/lib/categories";
import TileGrid from "@/components/TileGrid";
import StatusBadge, { Notice } from "@/components/StatusBadge";
import Countdown from "@/components/Countdown";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bid?: string; error?: string }> }) {
  const { id } = await params;
  const { bid, error } = await searchParams;
  const l = await getListing(id);
  if (!l) notFound();
  const live = canBid(l);
  const term = TERMS[l.meta.term];
  const leaders = Object.values(l.tiles).sort((a, b) => b.amount - a.amount);
  const c = l.creator;
  const hasHero = l.meta.heroBid !== l.meta.startBid;

  return (
    <div>
      {bid !== undefined && <Notice kind="success">Bid placed (test mode). You lead spot #{Number(bid) + 1} for now. If you are still on top when the timer ends and the creator confirms, the spot is yours.</Notice>}
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} ask={l.ask} buyable={live} highlight={bid !== undefined ? Number(bid) : undefined} />
          {live && <p className="mt-2 text-sm text-stone-500">Tap any spot to bid. Prices show the lowest bid that spot will take right now.</p>}
          {l.meta.template && (
            <figure className="m-0 mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.meta.imageUrl} alt={l.meta.title} className="block w-full rounded-[calc(var(--radius-panel)-10px)] border-2 border-stone-900" />
              <figcaption className="mt-2 text-sm text-stone-500">The real object. Stickers go on the matching spots.</figcaption>
            </figure>
          )}
        </div>
        <div className="space-y-5">
          <div>
            <StatusBadge status={l.status} />
            <h1 className="mt-2 text-3xl font-semibold">{l.meta.title}</h1>
            <div className="mt-1 text-sm text-stone-500">{categoryOf(l.meta.category)} · {term.label}{l.meta.eventDate ? ` on ${fmtDate(Date.parse(l.meta.eventDate))}` : ""}</div>
          </div>
          {l.status === "upcoming" && <Countdown to={l.meta.launchAt} label={`Bidding opens ${fmtDateTime(l.meta.launchAt)}`} />}
          {live && <Countdown to={l.meta.closesAt} label={`Bidding ends ${fmtDateTime(l.meta.closesAt)}`} />}
          {c && (
            <div className="card text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="sticker rounded-full bg-[var(--s-lime)] px-2.5 py-0.5 text-xs font-bold !shadow-none">Verified creator</span>
                <span className="rounded-full border-2 border-stone-900 bg-white px-2.5 py-0.5 text-xs font-bold">{tierOf(c.meta.followers)}</span>
              </div>
              <div className="mt-2 text-lg font-extrabold">{c.meta.name}</div>
              <div className="text-stone-600"><span className="tabular-nums">{fmtFollowers(c.meta.followers)}</span> followers on {c.meta.platform}</div>
            </div>
          )}
          {l.meta.description && <p className="whitespace-pre-line text-stone-700">{l.meta.description}</p>}
          <div className="card grid grid-cols-3 gap-2 text-center">
            <div><div className="mt-1 text-2xl font-semibold tabular-nums">{fmt(l.meta.startBid).replace(/\.00$/, "")}</div><div className="text-xs text-stone-500">{hasHero ? "medium opens at" : "bids open at"}</div></div>
            {hasHero
              ? <div><div className="mt-1 text-2xl font-semibold tabular-nums">{fmt(l.meta.heroBid).replace(/\.00$/, "")}</div><div className="text-xs text-stone-500">hero opens at</div></div>
              : <div><div className="mt-1 text-2xl font-semibold tabular-nums">{l.total}</div><div className="text-xs text-stone-500">spots</div></div>}
            <div><div className="mt-1 text-2xl font-semibold tabular-nums">{l.sold}/{l.total}</div><div className="text-xs text-stone-500">{l.confirmed ? "sponsored" : "spots with bids"}</div></div>
          </div>
          <div className="card text-sm text-stone-600">
            <div className="mb-1 font-semibold text-stone-900">How it works</div>
            <ul className="list-disc space-y-1 pl-4">
              <li>Highest bid on each spot when the timer ends wins. Your bid covers the whole {l.meta.term === "event" ? "event" : "term"}.</li>
              <li>The creator confirms every winning brand. If they say no, you pay nothing.</li>
              <li>We print your sticker and post it to the creator. No extra charge.</li>
              <li>{term.cadence}, checked by us. The creator is paid {100 - FEE_RATE * 100}% once the stickers are verified.</li>
            </ul>
          </div>
          {l.proofsApproved > 0 && l.latestProof && l.status !== "in_review" && l.status !== "proof_rejected" && (
            <div className="card">
              <div className="mb-2 text-sm font-semibold">Latest verified proof · {l.proofsApproved} of {l.proofsTotal}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.latestProof.proofUrl} alt="Proof" className="w-full rounded-lg" />
            </div>
          )}
          {leaders.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold">{l.confirmed ? "Sponsors" : live ? "Leading bids" : "Winning bids"}</div>
              <ul className="divide-y divide-stone-200 text-sm">
                {leaders.map((t) => (
                  <li key={t.index} className="flex items-center justify-between gap-3 py-1.5">
                    <span>#{t.index + 1} {t.website && l.confirmed ? <a href={t.website} target="_blank" rel="noopener noreferrer sponsored" className="hover:underline">{t.brandName}</a> : t.brandName}</span>
                    <span className="font-semibold tabular-nums">{fmt(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/" className="inline-block text-sm text-indigo-600 hover:underline">← All listings</Link>
        </div>
      </div>
    </div>
  );
}
