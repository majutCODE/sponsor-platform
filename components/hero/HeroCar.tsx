"use client";
import dynamic from "next/dynamic";

const CarScene = dynamic(() => import("./CarScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[var(--radius-panel)] bg-stone-100" />,
});

export default function HeroCar() {
  return (
    <figure className="m-0 w-full">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-panel)] bg-[#ebe5d8] sm:aspect-[21/9]">
        <CarScene />
      </div>
      <figcaption className="flex items-center justify-between gap-3 pt-3 text-sm">
        <span className="text-stone-900">Fig. 1. A hatchback with 12 sponsor tiles. Drag to turn it.</span>
        <span className="tabular-nums text-stone-600">8 of 12 sponsored · £40 a tile</span>
      </figcaption>
    </figure>
  );
}
