import Link from "next/link";
import { getAllListings } from "@/lib/data";
import { fmt, FEE_RATE } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import StatusBadge from "@/components/StatusBadge";
import HeroTiles from "@/components/HeroTiles";
import Progress from "@/components/arc/progress/progress";
import EmptyState from "@/components/arc/empty-state/empty-state";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

const STEPS = [
  ["List your object", "Upload a photo of your prom dress, car, guitar or anything else. Pick a grid and a price per tile."],
  ["Brands buy tiles", "Each tile is a logo spot. Multiple brands can sponsor the same object."],
  ["Show the proof", "Put the logos on the real thing and upload a photo of it."],
  ["Get paid", `We check the photo, then release your earnings. We keep ${FEE_RATE * 100}%.`],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const all = await getAllListings();
  const listings = cat ? all.filter((l) => l.meta.category === cat) : all;
  const counts = new Map<string, number>();
  for (const l of all) counts.set(l.meta.category, (counts.get(l.meta.category) ?? 0) + 1);
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"}`;
  return (
    <div className="space-y-24">
      <section className="grid items-center gap-12 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Verified sponsorships, paid on proof
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.04] sm:text-6xl">
            Get your stuff sponsored, <span className="text-stone-400">one tile at a time.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">
            List something you own. We split it into a grid of tiles. Brands buy tiles to put their logo on it.
            Every sponsorship is verified with a photo before anyone gets paid.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/list/new" className="btn !min-h-12 !px-6">List an object</Link>
            <Link href="#browse" className="btn-ghost !min-h-12 !px-6">Sponsor something</Link>
          </div>
          <dl className="mt-10 flex gap-10 text-sm">
            <div><dt className="text-stone-500">Platform fee</dt><dd className="mt-1 text-xl font-semibold">{FEE_RATE * 100}%</dd></div>
            <div><dt className="text-stone-500">Grid size</dt><dd className="mt-1 text-xl font-semibold">Up to 8×8</dd></div>
            <div><dt className="text-stone-500">Payout</dt><dd className="mt-1 text-xl font-semibold">On proof</dd></div>
          </dl>
        </div>
        <HeroTiles />
      </section>

      <section id="how" className="scroll-mt-24">
        <div className="eyebrow">How it works</div>
        <h2 className="mt-2 text-3xl font-semibold">Four steps from listing to payout</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="card transition hover:-translate-y-0.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-stone-50 text-sm font-semibold tabular-nums">{i + 1}</div>
              <div className="mt-4 font-semibold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="browse" className="scroll-mt-24">
        <div className="eyebrow">Browse</div>
        <h2 className="mt-2 text-3xl font-semibold">Objects looking for sponsors</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/#browse" scroll={false} className={chip(!cat)}>All <span className="opacity-60">{all.length}</span></Link>
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/?cat=${encodeURIComponent(c.name)}#browse`} scroll={false} className={chip(cat === c.name)}>
              <span>{c.emoji}</span>{c.name}{counts.get(c.name) ? <span className="opacity-60">{counts.get(c.name)}</span> : null}
            </Link>
          ))}
        </div>
        {listings.length === 0 ? (
          <div className="card mt-6">
            <EmptyState
              title={cat ? "Nothing in this category yet" : "Nothing listed yet"}
              description="Be the first to list an object and let brands claim a tile."
              action={<Link href="/list/new" className="btn">List an object</Link>}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.meta.id} href={`/l/${l.meta.id}`} className="card group block !p-2.5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="overflow-hidden rounded-[1.1rem]">
                  <TileGrid id={l.meta.id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} tiles={l.tiles} price={l.meta.tilePrice} compact />
                </div>
                <div className="flex items-start justify-between gap-2 px-2.5 pt-4">
                  <div>
                    <div className="font-semibold">{l.meta.title}</div>
                    <div className="mt-0.5 text-sm text-stone-500">{l.meta.category} · {fmt(l.meta.tilePrice)} per tile</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="px-2.5 pb-2.5 pt-4">
                  <Progress value={l.sold} max={l.total} label={`${l.sold} of ${l.total} tiles sponsored`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
