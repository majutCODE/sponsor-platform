import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buyTile } from "@/app/actions";
import { canBuy, getListing } from "@/lib/data";
import { feeFor, fmt } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import { Notice } from "@/components/StatusBadge";
import { describeTile, getTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function BuyPage({ params, searchParams }: { params: Promise<{ id: string; idx: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id, idx: idxStr } = await params;
  const { error } = await searchParams;
  const l = await getListing(id);
  if (!l) notFound();
  const idx = Number(idxStr);
  if (!Number.isInteger(idx) || idx < 0 || idx >= l.total) notFound();
  if (!canBuy(l) || l.tiles[idx]) redirect(`/l/${id}`);
  const template = getTemplate(l.meta.template);
  const where = template
    ? describeTile(template, idx)
    : `row ${Math.floor(idx / l.meta.cols) + 1}, column ${(idx % l.meta.cols) + 1}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <div>
        <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} price={l.meta.tilePrice} highlight={idx} />
        <p className="mt-2 text-sm text-stone-500">Highlighted: tile #{idx + 1} ({where})</p>
      </div>
      <div>
        <Link href={`/l/${id}`} className="text-sm text-indigo-600 hover:underline">← {l.meta.title}</Link>
        <h1 className="mt-2 text-2xl font-semibold">Sponsor tile #{idx + 1}</h1>
        {error && <div className="mt-4"><Notice>{error}</Notice></div>}
        <form action={buyTile} className="card mt-4 space-y-4">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="idx" value={idx} />
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
            <p className="mt-1 text-xs text-stone-500">PNG or SVG with a transparent background works best. Under 4 MB.</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3 text-sm">
            <div className="flex justify-between"><span>Tile</span><span>{fmt(l.meta.tilePrice)}</span></div>
            <div className="flex justify-between text-stone-500"><span>Goes to lister after verification</span><span>{fmt(l.meta.tilePrice - feeFor(l.meta.tilePrice))}</span></div>
            <div className="flex justify-between text-stone-500"><span>Platform fee</span><span>{fmt(feeFor(l.meta.tilePrice))}</span></div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Test mode: no card is charged. Real payments switch on once Stripe is connected.
          </div>
          <label className="flex items-start gap-2 text-sm text-stone-600">
            <input type="checkbox" name="agree" required className="mt-1" />
            I own the rights to this logo. My payment is held until the lister proves the logo is on the object.
          </label>
          <SubmitButton className="w-full">Pay {fmt(l.meta.tilePrice)}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
