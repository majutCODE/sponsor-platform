"use client";
import dynamic from "next/dynamic";

const CarScene = dynamic(() => import("./CarScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[28px] bg-[var(--s-blue)]" />,
});

export default function HeroCar() {
  return (
    <figure className="m-0 w-full">
      <div className="sticker relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-[var(--s-blue)]" style={{ boxShadow: "8px 8px 0 var(--foreground)" }}>
        <span className="sticker pointer-events-none absolute left-5 top-5 z-10 -rotate-6 rounded-xl bg-[var(--s-yellow)] px-3 py-1.5 text-sm font-extrabold">Bids from £50</span>
        <span className="sticker pointer-events-none absolute bottom-5 right-5 z-10 rotate-3 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold tabular-nums">17 of 26 taken</span>
        <CarScene />
      </div>
      <figcaption className="flex items-center justify-between gap-3 pt-3 text-sm">
        <span className="font-semibold text-stone-900">A hatchback with 26 sponsor spots on its wings and doors. Drag to spin it.</span>
        
      </figcaption>
    </figure>
  );
}
