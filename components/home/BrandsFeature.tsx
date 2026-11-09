// Adapted from Watermelon UI feature-3 (registry.watermelon.sh/r/feature-3.json).
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates";

const DRESS = TEMPLATES.dress;
// Fictional example brands by tile index: [name, sticker colour, text colour].
const DRESS_SPONSORS: Record<number, [string, string, string?]> = {
  0: ["NOVA", "#c6f45b"],
  3: ["kite", "#ffd23f"],
  4: ["pulse", "#ffffff"],
  8: ["orbit", "#ff8fd1"],
  11: ["lumen", "#1d1a16", "#fff6e5"],
  13: ["fizz", "#2b6cff", "#ffffff"],
  15: ["KITE", "#ffd23f"],
  17: ["NOVA", "#c6f45b"],
};

const POINTS = [
  "Bid on the exact spot your sticker goes on",
  "We print and post the sticker, included in your bid",
  "Fresh proof photos for the whole deal",
  "Pay nothing if the creator says no",
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
            Put a real sticker on a verified creator&apos;s rally car, kit or guitar. You name your price at auction, and
            you see the photo before the creator sees a penny.
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
                <div className="text-muted-foreground text-xs">Spot #5 · White wedding dress</div>
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
                <svg viewBox="70 15 260 290" className="block aspect-[4/3] w-full rounded-lg border-2 border-stone-900 bg-[var(--s-pink)]" role="img" aria-label="White wedding dress with sponsor logos on its tiles">
                  <path d={DRESS.body} fill="#ffffff" stroke="#1d1a16" strokeWidth={3} strokeLinejoin="round" />
                  {DRESS.slots.map((slot, i) => {
                    const brand = DRESS_SPONSORS[i];
                    return (
                      <g key={i}>
                        <rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx={3} fill={brand ? brand[1] : "#ffffff"} stroke="#1d1a16" strokeWidth={brand ? 1.5 : 1} strokeDasharray={brand ? undefined : "3 3"} strokeOpacity={brand ? 1 : 0.35} />
                        {brand && (
                          <text x={slot.x + slot.w / 2} y={slot.y + slot.h / 2 + 2.6} textAnchor="middle" fontSize={Math.min(8, (slot.w - 3) / (brand[0].length * 0.62))} fontWeight={800} fill={brand[2] ?? "#1d1a16"}>{brand[0]}</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
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
                  <span className="text-foreground font-medium tabular-nums">£34.00</span> to the creator
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
