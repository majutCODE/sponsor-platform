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
import BidAmount from "@/components/BidAmount";
import LogoInput from "@/components/LogoInput";
import { describeTile, getTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

const gbp = (pence: number) => fmt(pence).replace(/\.00$/, "");

export default async function BidPage({ params, searchParams }: { params: Promise<{ id: string; idx: string }>; searchParams: Promise<{ error?: string; amount?: string }> }) {
  const { id, idx: idxStr } = await params;
  const { error, amount } = await searchParams;
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
  const chosen = Number(amount);
  const initial = Number.isFinite(chosen) && chosen > 0 ? Math.floor(chosen) : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} ask={l.ask} highlight={idx} preview />
        <p className="mt-3 text-sm font-semibold">Outlined in blue: spot #{idx + 1}, {where}. {size} sticker.</p>
      </div>
      <div>
        <Link href={`/l/${id}?spot=${idx}`} className="link text-sm">← {l.meta.title}</Link>
        <h1 className="mt-3 text-4xl sm:text-5xl">Bid on spot #{idx + 1}</h1>
        <div className="mt-5"><Countdown to={l.meta.closesAt} label={`Bidding ends ${fmtDateTime(l.meta.closesAt)}`} /></div>
        {error && <div className="mt-5"><Notice>{error}</Notice></div>}
        <form action={placeBid} className="mt-6 space-y-5">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="idx" value={idx} />
          <fieldset className="card space-y-4">
            <legend className="sr-only">Your bid</legend>
            <div className="flex items-center gap-3"><span className="stepno bg-[var(--s-lime)]">1</span><span className="text-lg font-extrabold">Your bid</span></div>
            <dl className="panel space-y-1 text-sm">
              <div className="flex justify-between gap-3"><dt>Leading bid</dt><dd className="font-bold tabular-nums">{leader ? `${gbp(leader.amount)} by ${leader.brandName}` : "No bids yet"}</dd></div>
              <div className="flex justify-between gap-3"><dt>Lowest bid you can place</dt><dd className="font-bold tabular-nums">{gbp(min)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Covers</dt><dd className="font-bold">{TERMS[l.meta.term].label}, sticker included</dd></div>
            </dl>
            <BidAmount min={min / 100} initial={initial} />
          </fieldset>
          <fieldset className="card space-y-4">
            <legend className="sr-only">Your brand</legend>
            <div className="flex items-center gap-3"><span className="stepno bg-[var(--s-yellow)]">2</span><span className="text-lg font-extrabold">Your brand</span></div>
            <div>
              <label className="label" htmlFor="brandName">Brand name</label>
              <input className="input" id="brandName" name="brandName" required maxLength={80} autoComplete="organization" />
            </div>
            <LogoInput />
            <div>
              <label className="label" htmlFor="email">Billing email</label>
              <input className="input" id="email" name="email" type="email" required maxLength={120} autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="website">Website (optional)</label>
              <input className="input" id="website" name="website" maxLength={200} placeholder="yourbrand.com" />
            </div>
          </fieldset>
          <div className="note">Test mode: no card is held or charged. Real payments switch on once Stripe is connected.</div>
          <label className="flex items-start gap-2.5 text-sm text-stone-700">
            <input type="checkbox" name="agree" required className="mt-0.5 flex-none" />
            I own the rights to this logo. If I win and the creator confirms, I pay my bid. There is no refund once the term is running.
          </label>
          <SubmitButton className="w-full">Place bid</SubmitButton>
        </form>
      </div>
    </div>
  );
}
