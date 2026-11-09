import Link from "next/link";
import { getAllListings, TERMS } from "@/lib/data";
import { fmt, FEE_RATE } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import StatusBadge from "@/components/StatusBadge";
import HeroCar from "@/components/hero/HeroCar";
import Progress from "@/components/arc/progress/progress";
import EmptyState from "@/components/arc/empty-state/empty-state";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import BrandsFeature from "@/components/home/BrandsFeature";
import { Faq5 } from "@/components/ui/faq-5";

const FAQ = [
  {
    title: "Questions, answered",
    description: "How payments, proof and payouts work.",
    items: [
      { question: "Who can list?", answer: "Verified creators only. Apply once and we review every application by hand. UK only for now." },
      { question: "How do brands buy a spot?", answer: "By auction. Every listing has a launch date and a timer. Bid on any spot while the timer runs. The highest bid on each spot at zero wins, and the creator confirms each winning brand." },
      { question: "What sizes are there?", answer: "Two. Hero spots are the big, prime positions. Medium spots are everything else. Each has its own opening bid, from £50." },
      { question: "Who makes the sticker?", answer: "We do. We print it from your logo and post it to the creator. It is included in your bid." },
      { question: "How long does it stay on?", answer: "The creator picks the deal: a one-off event, or 1, 3 or 6 months. The clock starts when the first proof photo is verified." },
      { question: "How do I know it stays on?", answer: "The creator sends a fresh proof photo on a schedule: weekly for 1 month deals, every 2 weeks for 3 months, monthly for 6 months. We check each one. Missed proofs earn strikes, and three strikes removes a creator." },
      { question: "When does the creator get paid?", answer: `Once the stickers are on and we verify the first proof photo. We keep ${FEE_RATE * 100}%, which also covers printing and postage.` },
      { question: "Do I get social posts too?", answer: "No. You are buying the sticker on the real object, seen wherever that creator takes it." },
    ],
  },
];

export const dynamic = "force-dynamic";

const STEPS = [
  ["Creators list", "Verified creators list a car, kit, guitar or dress, then set a launch date and a timer."],
  ["Brands bid", "Every sticker spot is an auction. The highest bid on each spot when the timer ends wins."],
  ["We send stickers", "The creator confirms the brands. We print the stickers and post them out."],
  ["Proof, then pay", `The creator sends proof photos on a schedule. We pay them once the stickers are verified and keep ${FEE_RATE * 100}%.`],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const all = await getAllListings();
  const listings = cat ? all.filter((l) => categoryOf(l.meta.category) === cat) : all;
  const counts = new Map<string, number>();
  for (const l of all) counts.set(categoryOf(l.meta.category), (counts.get(categoryOf(l.meta.category)) ?? 0) + 1);
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border-2 border-stone-900 px-4 py-1.5 text-sm font-semibold transition ${active ? "bg-[var(--s-lime)] shadow-[2px_2px_0_var(--foreground)]" : "bg-white hover:bg-[var(--s-yellow)]"}`;
  return (
    <div className="space-y-28">
      <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 pt-2 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:pt-8">
        <div>
          <h1 className="text-[3.1rem] text-balance sm:text-7xl lg:text-[4.7rem]">
            Brands bid to put their sticker on <span className="hl">your car.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-stone-700">
            Or your guitar, kit or wedding dress. Verified creators list an object, brands bid on sticker spots, and we
            print and post the stickers. You get paid once a photo shows they are on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/creators/apply" className="btn btn-accent !min-h-14 !px-7 text-base">Apply as a creator</Link>
            <Link href="#browse" className="btn-ghost !min-h-14 !px-7 text-base">Sponsor something</Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-3 text-sm">
            {[
              ["You keep", `${100 - FEE_RATE * 100}%`, "var(--s-yellow)", "-rotate-2"],
              ["Spots", "By auction", "var(--s-pink)", "rotate-1"],
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
        <h2 className="max-w-2xl text-5xl text-balance">From launch to payout in four steps</h2>
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
              description="Verified creators list here. Apply to be one of the first."
              action={<Link href="/creators/apply" className="btn">Apply as a creator</Link>}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.meta.id} href={`/l/${l.meta.id}`} className="card group block !p-3 transition hover:-translate-y-1">
                <div className="overflow-hidden rounded-[calc(var(--radius-panel)-12px)] border-2 border-stone-900">
                  <TileGrid id={l.meta.id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} compact />
                </div>
                <div className="flex items-start justify-between gap-2 px-1 pt-4">
                  <div>
                    <div className="display text-xl">{l.meta.title}</div>
                    <div className="mt-0.5 text-sm text-stone-600">Bids from <span className="tabular-nums">{fmt(l.meta.startBid).replace(/\.00$/, "")}</span> · {TERMS[l.meta.term].label} · {l.meta.listerName}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="px-1 pb-1 pt-4">
                  <Progress value={l.sold} max={l.total} label={`${l.sold} of ${l.total} spots ${l.confirmed ? "sponsored" : "with bids"}`} />
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
          <h2 className="text-5xl text-balance sm:text-6xl md:col-span-8">Got an audience and something they see? Get it sponsored.</h2>
          <div className="md:col-span-4 md:text-right">
            <Link href="/creators/apply" className="btn btn-accent !min-h-12 !px-6 text-[15px]">Apply as a creator</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
