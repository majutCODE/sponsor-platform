// Adapted from Watermelon UI feature-3 (registry.watermelon.sh/r/feature-3.json).
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const POINTS = [
  "Pick the exact tile your logo goes on",
  "Pay once, held until the lister uploads proof",
  "Refunded if the logo never makes it on",
  "Link from your tile straight to your site",
];

export default function BrandsFeature() {
  return (
    <section className="w-full">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-4xl text-balance sm:text-5xl">
            For brands: real placements, paid only on proof
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Sponsor a prom dress, a rally car or a busker&apos;s guitar for less than a boosted post. You see the photo
            before the lister sees a penny.
          </p>
          <ul className="space-y-2.5">
            {POINTS.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-900 bg-[var(--s-lime)]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-sm text-stone-700">{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="btn btn-accent !min-h-12 !px-6 text-base">
            <Link href="#browse">Browse objects</Link>
          </Button>
        </div>

        <div className="sticker relative flex justify-center rounded-[28px] bg-[var(--s-lime)] p-8" style={{ boxShadow: "8px 8px 0 var(--foreground)" }}>
          <div className="relative h-[360px] w-full max-w-md">
            <Card className="absolute top-0 left-0 w-[250px] gap-0 sticker rounded-2xl p-0 -rotate-2">
              <CardContent className="space-y-2 p-4">
                <div className="text-muted-foreground text-xs">Tile #5 · Vintage Vespa</div>
                <div className="display text-4xl tabular-nums">£40.00</div>
                <div className="flex gap-2 text-[11px]">
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800">Held</span>
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-stone-700">Awaiting proof</span>
                </div>
              </CardContent>
            </Card>

            <Card className="absolute top-28 right-0 z-10 w-[240px] gap-0 sticker rounded-2xl p-0 rotate-2">
              <CardContent className="space-y-3 p-4">
                <div className="text-muted-foreground text-xs">Proof photo</div>
                <div className="grid aspect-[4/3] grid-cols-3 gap-1 rounded-lg bg-gradient-to-br from-[#c9a27a] to-[#6b4f3a] p-1.5">
                  {["NOVA", "", "pulse", "", "KITE", "", "", "lumen", ""].map((b, i) => (
                    <div key={i} className={`flex items-center justify-center rounded-[4px] text-[9px] font-bold ${b ? "bg-white text-stone-900" : "border border-dashed border-white/50"}`}>{b}</div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Verified</span> <span className="text-muted-foreground">by TileSponsor</span>
                </div>
              </CardContent>
            </Card>

            <Card className="absolute bottom-4 left-8 w-[250px] gap-0 sticker rounded-2xl p-0 rotate-1">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Payout released</span>
                  <span className="text-muted-foreground text-xs tabular-nums">2 min ago</span>
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium tabular-nums">£34.00</span> to the lister
                </div>
                <div className="flex gap-2 text-[11px]">
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800">Paid</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
