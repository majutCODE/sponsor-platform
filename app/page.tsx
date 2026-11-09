import Link from "next/link";
import { getAllListings } from "@/lib/data";
import { fmt, FEE_RATE } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import StatusBadge from "@/components/StatusBadge";
import HeroCar from "@/components/hero/HeroCar";
import Progress from "@/components/arc/progress/progress";
import EmptyState from "@/components/arc/empty-state/empty-state";
import { CATEGORIES } from "@/lib/categories";
import BrandsFeature from "@/components/home/BrandsFeature";
import { Faq5 } from "@/components/ui/faq-5";

const FAQ = [
  {
    title: "Questions, answered",
    description: "How payments, proof and payouts work.",
    items: [
      { question: "When does the lister get paid?", answer: `Once every sponsor's logo is on the object and we approve the proof photo. We release the tile price minus our ${FEE_RATE * 100}% fee.` },
      { question: "What if the logo never goes on?", answer: "Your payment is held by us, not the lister. If no valid proof arrives, you get refunded." },
      { question: "What can I list?", answer: "Anything you own and use in public: cars, bikes, guitars, prom dresses, sports kit, laptops and more." },
      { question: "How big is a tile?", answer: "You choose the grid, up to 8 by 8. Each cell on your photo is one logo spot." },
    ],
  },
];

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
    `inline-flex items-center gap-1.5 rounded-full border-2 border-stone-900 px-4 py-1.5 text-sm font-semibold transition ${active ? "bg-[var(--s-lime)] shadow-[2px_2px_0_var(--foreground)]" : "bg-white hover:bg-[var(--s-yellow)]"}`;
  return (
    <div className="space-y-28">
      <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 pt-2 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:pt-8">
        <div>
          <h1 className="text-[3.1rem] text-balance sm:text-7xl lg:text-[4.7rem]">
            Brands pay to put their logo on <span className="hl">your car.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-stone-700">
            Or your guitar, prom dress or anything else you own. Brands buy a spot like a sticker, and you get paid once
            a photo shows it&apos;s on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/list/new" className="btn btn-accent !min-h-14 !px-7 text-base">List your first object</Link>
            <Link href="#browse" className="btn-ghost !min-h-14 !px-7 text-base">Sponsor something</Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-3 text-sm">
            {[
              ["You keep", `${100 - FEE_RATE * 100}%`, "var(--s-yellow)", "-rotate-2"],
              ["Tiles", "Up to 64", "var(--s-pink)", "rotate-1"],
              ["Paid", "On proof", "#fff", "-rotate-1"],
            ].map(([k, v, bg, r]) => (
              <div key={k} className={`sticker rounded-2xl px-4 py-2 ${r}`} style={{ background: bg }}>
                <dt className="text-xs font-semibold">{k}</dt>
                <dd className="display text-xl tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroCar />
      </section>

      <section id="how" className="scroll-mt-24">
        <h2 className="max-w-2xl text-5xl text-balance">From listing to payout in four steps</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card">
              <div className="sticker grid h-12 w-12 place-items-center rounded-full text-xl font-extrabold tabular-nums" style={{ background: ["var(--s-lime)", "var(--s-yellow)", "var(--s-pink)", "var(--accent)"][i], transform: `rotate(${[-6, 4, -3, 6][i]}deg)` }}>{i + 1}</div>
              <div className="mt-4 text-lg font-extrabold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <BrandsFeature />

      <section id="browse" className="scroll-mt-24">
        <h2 className="text-5xl text-balance">Objects looking for sponsors</h2>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/#browse" scroll={false} className={chip(!cat)}>All <span className="tabular-nums opacity-60">{all.length}</span></Link>
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={`/?cat=${encodeURIComponent(c.name)}#browse`} scroll={false} className={chip(cat === c.name)}>
              {c.name}{counts.get(c.name) ? <span className="tabular-nums opacity-60">{counts.get(c.name)}</span> : null}
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
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.meta.id} href={`/l/${l.meta.id}`} className="card group block !p-3 transition hover:-translate-y-1">
                <div className="overflow-hidden rounded-[calc(var(--radius-panel)-12px)] border-2 border-stone-900">
                  <TileGrid id={l.meta.id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} tiles={l.tiles} price={l.meta.tilePrice} compact />
                </div>
                <div className="flex items-start justify-between gap-2 px-1 pt-4">
                  <div>
                    <div className="display text-xl">{l.meta.title}</div>
                    <div className="mt-0.5 text-sm text-stone-600"><span className="tabular-nums">{fmt(l.meta.tilePrice)}</span> a tile · {l.meta.category}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="px-1 pb-1 pt-4">
                  <Progress value={l.sold} max={l.total} label={`${l.sold} of ${l.total} tiles sponsored`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <div id="faq" className="scroll-mt-24 [&>section]:p-0 [&_.max-w-7xl]:px-0">
        <Faq5 categories={FAQ} />
      </div>

      <section className="sticker -mx-1 rounded-[28px] bg-[var(--s-blue)] px-6 py-14 text-white sm:px-12 sm:py-16" style={{ boxShadow: "8px 8px 0 var(--foreground)" }}>
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h2 className="text-5xl text-balance sm:text-6xl md:col-span-8">Got something people see? List it in two minutes.</h2>
          <div className="md:col-span-4 md:text-right">
            <Link href="/list/new" className="btn btn-accent !min-h-12 !px-6 text-[15px]">List your first object</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
