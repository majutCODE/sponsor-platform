import Link from "next/link";
import { notFound } from "next/navigation";
import { canBuy, getListing } from "@/lib/data";
import { fmt } from "@/lib/money";
import { categoryOf } from "@/lib/categories";
import TileGrid from "@/components/TileGrid";
import StatusBadge, { Notice } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bought?: string; error?: string }> }) {
  const { id } = await params;
  const { bought, error } = await searchParams;
  const l = await getListing(id);
  if (!l) notFound();
  const buyable = canBuy(l);
  const sponsors = Object.values(l.tiles).sort((a, b) => a.paidAt - b.paidAt);

  return (
    <div>
      {bought !== undefined && <Notice kind="success">Payment received (test mode). Your logo is now on tile #{Number(bought) + 1}. We&apos;ll email you when the lister&apos;s proof photo is verified.</Notice>}
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} price={l.meta.tilePrice} buyable={buyable} highlight={bought !== undefined ? Number(bought) : undefined} />
          {buyable && <p className="mt-2 text-sm text-stone-500">Tap an empty tile to sponsor it.</p>}
          {l.meta.template && (
            <figure className="m-0 mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.meta.imageUrl} alt={l.meta.title} className="block w-full rounded-[calc(var(--radius-panel)-10px)] border-2 border-stone-900" />
              <figcaption className="mt-2 text-sm text-stone-500">The real object. Logos go on the matching spots.</figcaption>
            </figure>
          )}
        </div>
        <div className="space-y-5">
          <div>
            <StatusBadge status={l.status} />
            <h1 className="mt-2 text-3xl font-semibold">{l.meta.title}</h1>
            <div className="mt-1 text-sm text-stone-500">{categoryOf(l.meta.category)} · listed by {l.meta.listerName}</div>
          </div>
          {l.meta.description && <p className="whitespace-pre-line text-stone-700">{l.meta.description}</p>}
          <div className="card grid grid-cols-3 gap-2 text-center">
            <div><div className="mt-1 text-2xl font-semibold tabular-nums">{fmt(l.meta.tilePrice)}</div><div className="text-xs text-stone-500">per tile</div></div>
            <div><div className="mt-1 text-2xl font-semibold tabular-nums">{l.sold}/{l.total}</div><div className="text-xs text-stone-500">sponsored</div></div>
            <div><div className="mt-1 text-2xl font-semibold tabular-nums">{l.total - l.sold}</div><div className="text-xs text-stone-500">available</div></div>
          </div>
          <div className="card text-sm text-stone-600">
            <div className="mb-1 font-semibold text-stone-900">How your sponsorship is verified</div>
            You pay us, not the lister. The lister puts your logo on the real object and uploads a photo. We check it
            before releasing any money. If it never happens, you get refunded.
          </div>
          {l.status === "approved" || l.status === "paid_out" ? (
            l.latestProof && (
              <div className="card">
                <div className="mb-2 text-sm font-semibold">Verified proof photo</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.latestProof.proofUrl} alt="Proof" className="w-full rounded-lg" />
              </div>
            )
          ) : null}
          {sponsors.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold">Sponsors</div>
              <ul className="flex flex-wrap gap-2">
                {sponsors.map((t) => (
                  <li key={t.index} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm">
                    {t.website ? <a href={t.website} target="_blank" rel="noopener noreferrer sponsored" className="hover:underline">{t.brandName}</a> : t.brandName}
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
