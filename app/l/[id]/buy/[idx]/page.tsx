import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { placeBid } from "@/app/actions";
import { canBid, getListing, isHero, TERMS } from "@/lib/data";
import { fmt } from "@/lib/money";
import { fmtDateTime } from "@/lib/time";
import TileGrid from "@/components/TileGrid";
import { Notice } from "@/components/StatusBadge";
import Countdown from "@/components/Countdown";
import { describeTile, getTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function BidPage({ params, searchParams }: { params: Promise<{ id: string; idx: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id, idx: idxStr } = await params;
  const { error } = await searchParams;
  const l = await getListing(id);
  if (!l) notFound();
  const idx = Number(idxStr);
  if (!Number.isInteger(idx) || idx < 0 || idx >= l.total) notFound();
  if (!canBid(l)) redirect(`/l/${id}`);
  const template = getTemplate(l.meta.template);
  const where = template
    ? describeTile(template, idx)
    : `row ${Math.floor(idx / l.meta.cols) + 1}, column ${(idx % l.meta.cols) + 1}`;
  const leader = l.tiles[idx];
  const min = l.ask[idx];
  const size = isHero(l.meta, idx) ? "Hero" : "Medium";

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <div>
        <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} ask={l.ask} highlight={idx} />
        <p className="mt-2 text-sm text-stone-500">Highlighted: spot #{idx + 1} ({where}) · {size} sticker</p>
      </div>
      <div>
        <Link href={`/l/${id}`} className="text-sm text-indigo-600 hover:underline">← {l.meta.title}</Link>
        <h1 className="mt-2 text-2xl font-semibold">Bid on spot #{idx + 1}</h1>
        <div className="mt-4"><Countdown to={l.meta.closesAt} label={`Bidding ends ${fmtDateTime(l.meta.closesAt)}`} /></div>
        {error && <div className="mt-4"><Notice>{error}</Notice></div>}
        <form action={placeBid} className="card mt-4 space-y-4">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="idx" value={idx} />
          <div className="rounded-lg bg-stone-50 p-3 text-sm">
            <div className="flex justify-between"><span>Leading bid</span><span className="font-semibold">{leader ? `${fmt(leader.amount)} by ${leader.brandName}` : "No bids yet"}</span></div>
            <div className="flex justify-between"><span>Lowest bid you can place</span><span className="font-semibold">{fmt(min)}</span></div>
            <div className="flex justify-between text-stone-500"><span>Covers</span><span>{TERMS[l.meta.term].label}, sticker included</span></div>
          </div>
          <div>
            <label className="label" htmlFor="amount">Your bid (£)</label>
            <input className="input" id="amount" name="amount" type="number" min={min / 100} step="1" required defaultValue={min / 100} />
          </div>
          <div>
            <label className="label" htmlFor="brandName">Brand name</label>
            <input className="input" id="brandName" name="brandName" required maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="website">Website (optional)</label>
            <input className="input" id="website" name="website" maxLength={200} placeholder="yourbrand.com" />
          </div>
          <div>
            <label className="label" htmlFor="email">Billing email</label>
            <input className="input" id="email" name="email" type="email" required maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="logo">Logo</label>
            <input className="input" id="logo" name="logo" type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" required />
            <p className="mt-1 text-xs text-stone-500">PNG or SVG with a transparent background prints best. Under 4 MB.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Test mode: no card is held or charged. Real payments switch on once Stripe is connected.
          </div>
          <label className="flex items-start gap-2 text-sm text-stone-600">
            <input type="checkbox" name="agree" required className="mt-1" />
            I own the rights to this logo. If I win and the creator confirms, I pay my bid. There is no refund once the term is running.
          </label>
          <SubmitButton className="w-full">Place bid</SubmitButton>
        </form>
      </div>
    </div>
  );
}
