import Link from "next/link";
import { getAllListings } from "@/lib/data";
import { fmt, FEE_RATE } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import StatusBadge from "@/components/StatusBadge";
import HeroCar from "@/components/hero/HeroCar";
import CategoryIcon from "@/components/CategoryIcon";
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
      <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 pt-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 md:pt-10">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.05] text-balance sm:text-[3.5rem]">
            Brands pay to put their logo on your car.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-stone-700">
            Or your guitar, prom dress or anything else you own. We split it into tiles, brands buy them, and you get
            paid once a photo shows the logos are on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/list/new" className="btn btn-accent !min-h-12 !px-6 text-[15px]">List your first object</Link>
            <Link href="#browse" className="text-sm font-medium text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline">
              Or sponsor something
            </Link>
          </div>
          <dl className="mt-10 grid max-w-sm grid-cols-3 gap-6 border-t border-stone-200 pt-6 text-sm">
            <div><dt className="text-stone-600">You keep</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{100 - FEE_RATE * 100}%</dd></div>
            <div><dt className="text-stone-600">Tiles</dt><dd className="mt-1 text-xl font-semibold tabular-nums">Up to 64</dd></div>
            <div><dt className="text-stone-600">Paid</dt><dd className="mt-1 text-xl font-semibold">On proof</dd></div>
          </dl>
        </div>
        <HeroCar />
      </section>

      <section id="how" className="scroll-mt-24">
        <h2 className="text-3xl font-semibold text-balance">From listing to payout in four steps</h2>
        <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="border-t border-stone-900 pt-4">
              <div className="text-sm font-medium tabular-nums text-stone-600">Step {i + 1}</div>
              <div className="mt-1 font-semibold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="browse" className="scroll-mt-24">
        <h2 className="text-3xl font-semibold text-balance">Objects looking for sponsors</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/#browse" scroll={false} className={chip(!cat)}>All <span className="tabular-nums opacity-60">{all.length}</span></Link>
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/?cat=${encodeURIComponent(c.name)}#browse`} scroll={false} className={chip(cat === c.name)}>
              <CategoryIcon name={c.name} />{c.name}{counts.get(c.name) ? <span className="tabular-nums opacity-60">{counts.get(c.name)}</span> : null}
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
              <Link key={l.meta.id} href={`/l/${l.meta.id}`} className="card group block !p-2.5 transition hover:border-stone-300 hover:shadow-lg">
                <div className="overflow-hidden rounded-[calc(var(--radius-panel)-10px)]">
                  <TileGrid id={l.meta.id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} tiles={l.tiles} price={l.meta.tilePrice} compact />
                </div>
                <div className="flex items-start justify-between gap-2 px-2.5 pt-4">
                  <div>
                    <div className="font-semibold">{l.meta.title}</div>
                    <div className="mt-0.5 text-sm text-stone-600"><span className="tabular-nums">{fmt(l.meta.tilePrice)}</span> a tile · {l.meta.category}</div>
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
