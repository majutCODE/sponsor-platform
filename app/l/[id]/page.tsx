import Link from "next/link";
import { notFound } from "next/navigation";
import { canBid, fmtFollowers, getListing, isHero, TERMS, tierOf } from "@/lib/data";
import { FEE_RATE, fmt } from "@/lib/money";
import { ago, fmtDate, fmtDateTime } from "@/lib/time";
import { categoryOf } from "@/lib/categories";
import { describeTile, getTemplate } from "@/lib/templates";
import TileGrid from "@/components/TileGrid";
import StatusBadge, { Notice } from "@/components/StatusBadge";
import Countdown from "@/components/Countdown";
import BidAmount from "@/components/BidAmount";

export const dynamic = "force-dynamic";

const gbp = (pence: number) => fmt(pence).replace(/\.00$/, "");

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bid?: string; error?: string; spot?: string }> }) {
  const { id } = await params;
  const { bid, error, spot: spotStr } = await searchParams;
  const l = await getListing(id);
  if (!l) notFound();
  const live = canBid(l);
  const term = TERMS[l.meta.term];
  const leaders = Object.values(l.tiles).sort((a, b) => b.amount - a.amount);
  const c = l.creator;
  const hasHero = l.meta.heroBid !== l.meta.startBid;
  const template = getTemplate(l.meta.template);
  const where = (i: number) => (template ? describeTile(template, i) : `row ${Math.floor(i / l.meta.cols) + 1}, column ${(i % l.meta.cols) + 1}`);

  // The spot the brand tapped. Its bid panel opens on this page.
  const n = spotStr === undefined || spotStr === "" ? NaN : Number(spotStr);
  const spot = live && Number.isInteger(n) && n >= 0 && n < l.total ? n : undefined;
  const lowest = Math.min(...Object.values(l.ask));
  const now = Date.now();
  const activity = l.bids
    .filter((b) => b.at < l.meta.closesAt && !l.declined.has(b.id) && b.index < l.total)
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);
  const bar = spot === undefined && (live || l.status === "upcoming");

  return (
    <div className={spot !== undefined ? "max-lg:pb-80" : bar ? "max-lg:pb-20" : ""}>
      {bid !== undefined && <Notice kind="success" title="Bid placed">Test mode, so no card was charged. You lead spot #{Number(bid) + 1} for now. If you are still on top when the timer ends and the creator confirms, the spot is yours.</Notice>}
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <div id="spots" className="scroll-mt-20">
            <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} ask={l.ask} buyable={live} highlight={spot ?? (bid !== undefined ? Number(bid) : undefined)} />
          </div>
          {live && <p className="mt-3 text-sm font-semibold">Tap a spot to bid. Each price is the lowest bid that spot takes right now.</p>}
          {l.meta.template && (
            <figure className="m-0 mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.meta.imageUrl} alt={l.meta.title} className="shot w-full" />
              <figcaption className="mt-2 text-sm text-stone-600">The real object. Stickers go on the matching spots.</figcaption>
            </figure>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <StatusBadge status={l.status} />
            <h1 className="mt-3 text-4xl text-balance sm:text-5xl">{l.meta.title}</h1>
            <div className="mt-2 text-sm font-semibold text-stone-700">{categoryOf(l.meta.category)} · {term.label}{l.meta.eventDate ? ` on ${fmtDate(Date.parse(l.meta.eventDate))}` : ""}</div>
          </div>
          {l.status === "upcoming" && <Countdown to={l.meta.launchAt} label={`Bidding opens ${fmtDateTime(l.meta.launchAt)}`} />}
          {live && <Countdown to={l.meta.closesAt} label={`Bidding ends ${fmtDateTime(l.meta.closesAt)}`} />}

          {spot !== undefined && (
            <form key={spot} action={`/l/${id}/buy/${spot}`} method="get" className="card space-y-4 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:rounded-b-none max-lg:border-x-0 max-lg:border-b-0 max-lg:!p-5 max-lg:shadow-[0_-6px_0_var(--foreground)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="display text-2xl">Spot #{spot + 1}</div>
                  <div className="mt-1 text-sm text-stone-700">{where(spot)} · {isHero(l.meta, spot) ? "Hero" : "Medium"} sticker</div>
                </div>
                <Link href={`/l/${id}`} scroll={false} className="btn-ghost !min-h-9 !px-3.5">Close</Link>
              </div>
              <div className="panel flex items-center justify-between gap-3 text-sm">
                {l.tiles[spot] ? (
                  <>
                    <span className="flex min-w-0 items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.tiles[spot].logoUrl} alt="" className="logo-thumb" />
                      <span className="truncate font-bold">{l.tiles[spot].brandName} leads</span>
                    </span>
                    <span className="display text-xl tabular-nums">{gbp(l.tiles[spot].amount)}</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold">No bids yet</span>
                    <span>Opens at <span className="font-extrabold tabular-nums">{gbp(l.ask[spot])}</span></span>
                  </>
                )}
              </div>
              <BidAmount min={l.ask[spot] / 100} id="panel-amount" />
              <button className="btn btn-accent w-full !min-h-12 text-base">Continue</button>
              <p className="text-xs text-stone-600 max-lg:hidden">Next you add your brand and logo. You only pay if you win and the creator confirms.</p>
            </form>
          )}

          {c && (
            <div className="card text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill" style={{ background: "var(--s-lime)" }}>Verified creator</span>
                <span className="pill">{tierOf(c.meta.followers)}</span>
              </div>
              <div className="mt-3 text-lg font-extrabold">{c.meta.name}</div>
              <div className="text-stone-700"><span className="tabular-nums">{fmtFollowers(c.meta.followers)}</span> followers on {c.meta.platform}</div>
            </div>
          )}
          {l.meta.description && <p className="whitespace-pre-line text-stone-700">{l.meta.description}</p>}
          <div className="card grid grid-cols-3 gap-2 text-center">
            <div><div className="display text-3xl tabular-nums">{gbp(l.meta.startBid)}</div><div className="mt-1 text-xs font-semibold text-stone-600">{hasHero ? "medium opens at" : "bids open at"}</div></div>
            {hasHero
              ? <div><div className="display text-3xl tabular-nums">{gbp(l.meta.heroBid)}</div><div className="mt-1 text-xs font-semibold text-stone-600">hero opens at</div></div>
              : <div><div className="display text-3xl tabular-nums">{l.total}</div><div className="mt-1 text-xs font-semibold text-stone-600">spots</div></div>}
            <div><div className="display text-3xl tabular-nums">{l.sold}/{l.total}</div><div className="mt-1 text-xs font-semibold text-stone-600">{l.confirmed ? "sponsored" : "spots with bids"}</div></div>
          </div>

          {leaders.length > 0 && (
            <div className="card">
              <div className="text-lg font-extrabold">{l.confirmed ? "Sponsors" : live ? "Leading bids" : "Winning bids"}</div>
              <ol className="rows mt-2 text-sm">
                {leaders.map((t, rank) => {
                  const name = t.website && l.confirmed ? <a href={t.website} target="_blank" rel="noopener noreferrer sponsored" className="link">{t.brandName}</a> : t.brandName;
                  const row = (
                    <>
                      <span className="w-5 text-center font-extrabold tabular-nums text-stone-600">{rank + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.logoUrl} alt="" className="logo-thumb" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{name}</span>
                        <span className="block truncate text-xs text-stone-600">Spot #{t.index + 1} · {where(t.index)}</span>
                      </span>
                      <span className="display text-lg tabular-nums">{gbp(t.amount)}</span>
                    </>
                  );
                  return (
                    <li key={t.index}>
                      {live
                        ? <Link href={`/l/${id}?spot=${t.index}`} scroll={false} className="flex items-center gap-3 py-2.5 hover:bg-[var(--surface-muted)]">{row}</Link>
                        : <div className="flex items-center gap-3 py-2.5">{row}</div>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {!l.confirmed && activity.length > 0 && (
            <div className="card">
              <div className="text-lg font-extrabold">Latest bids</div>
              <ul className="rows mt-2 text-sm">
                {activity.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.logoUrl} alt="" className="logo-thumb !h-8 !w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="font-bold">{b.brandName}</span> bid <span className="font-extrabold tabular-nums">{gbp(b.amount)}</span> on spot #{b.index + 1}
                      <span className="block text-xs text-stone-600">{ago(b.at, now)}</span>
                    </span>
                    {l.tiles[b.index]?.id === b.id
                      ? <span className="pill" style={{ background: "var(--s-lime)" }}>Leading</span>
                      : <span className="pill">Outbid</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {l.proofsApproved > 0 && l.latestProof && l.status !== "in_review" && l.status !== "proof_rejected" && (
            <div className="card">
              <div className="mb-3 text-lg font-extrabold">Latest verified proof · {l.proofsApproved} of {l.proofsTotal}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.latestProof.proofUrl} alt="Proof" className="shot w-full" />
            </div>
          )}

          <div className="card text-sm">
            <div className="text-lg font-extrabold">How it works</div>
            <ol className="mt-3 space-y-3">
              {[
                `Highest bid on each spot when the timer ends wins. Your bid covers the whole ${l.meta.term === "event" ? "event" : "term"}.`,
                "The creator confirms every winning brand. If they say no, you pay nothing.",
                "We print your sticker and post it to the creator. No extra charge.",
                `${term.cadence}, checked by us. The creator is paid ${100 - FEE_RATE * 100}% once the stickers are verified.`,
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="stepno !h-7 !w-7 text-sm" style={{ background: ["var(--s-lime)", "var(--s-yellow)", "var(--s-pink)", "var(--accent)"][i] }}>{i + 1}</span>
                  <span className="pt-0.5 text-stone-700">{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <Link href="/#browse" className="link inline-block text-sm">← All listings</Link>
        </div>
      </div>

      {bar && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t-[2.5px] border-stone-900 bg-[var(--s-yellow)] px-5 py-3 lg:hidden">
          <div>
            <div className="text-xs font-bold">{live ? "Bidding ends in" : "Bidding opens in"}</div>
            <div className="display text-2xl"><Countdown compact to={live ? l.meta.closesAt : l.meta.launchAt} /></div>
          </div>
          <a href="#spots" className="btn !min-h-12 tabular-nums">{live ? `Bid from ${gbp(lowest)}` : `See spots, from ${gbp(lowest)}`}</a>
        </div>
      )}
    </div>
  );
}
