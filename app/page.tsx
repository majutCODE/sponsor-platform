import Link from "next/link";
import { getAllListings } from "@/lib/data";
import { fmt, FEE_RATE } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import StatusBadge from "@/components/StatusBadge";
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
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"}`;
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Get your stuff sponsored, one tile at a time.</h1>
          <p className="mt-4 text-lg text-stone-600">
            List something you own. We split it into a grid of tiles. Brands buy tiles to put their logo on it.
            Every sponsorship is verified with a photo before anyone gets paid.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/list/new" className="btn">List an object</Link>
            <Link href="#browse" className="btn-ghost">Sponsor something</Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-3 shadow-lg">
          {["Acme", "", "Nova", "", "Pulse", "", "Orbit", "", ""].map((b, i) => (
            <div key={i} className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold ${b ? "bg-white text-stone-800" : "border-2 border-dashed border-white/60 text-white/80"}`}>
              {b || "£"}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([t, d], i) => (
          <div key={t} className="card">
            <div className="text-xs font-semibold text-indigo-600">Step {i + 1}</div>
            <div className="mt-1 font-semibold">{t}</div>
            <p className="mt-1 text-sm text-stone-600">{d}</p>
          </div>
        ))}
      </section>

      <section id="browse">
        <h2 className="text-2xl font-bold tracking-tight">Objects looking for sponsors</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/#browse" scroll={false} className={chip(!cat)}>All <span className="opacity-70">{all.length}</span></Link>
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/?cat=${encodeURIComponent(c.name)}#browse`} scroll={false} className={chip(cat === c.name)}>
              <span>{c.emoji}</span>{c.name}{counts.get(c.name) ? <span className="opacity-70">{counts.get(c.name)}</span> : null}
            </Link>
          ))}
        </div>
        {listings.length === 0 ? (
          <div className="card mt-4 text-center text-stone-600">
            {cat ? "Nothing in this category yet." : "Nothing listed yet."} <Link href="/list/new" className="font-semibold text-indigo-600">Be the first.</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.meta.id} href={`/l/${l.meta.id}`} className="card block !p-3 transition hover:shadow-md">
                <TileGrid id={l.meta.id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} tiles={l.tiles} price={l.meta.tilePrice} compact />
                <div className="mt-3 flex items-start justify-between gap-2 px-1">
                  <div>
                    <div className="font-semibold">{l.meta.title}</div>
                    <div className="text-sm text-stone-500">{l.meta.category} · {fmt(l.meta.tilePrice)} per tile</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="mt-3 px-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full bg-indigo-600" style={{ width: `${(l.sold / l.total) * 100}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{l.sold} of {l.total} tiles sponsored</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
