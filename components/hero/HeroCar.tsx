"use client";
import dynamic from "next/dynamic";

const CarScene = dynamic(() => import("./CarScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[calc(var(--radius-panel)-12px)] bg-stone-100" />,
});

export default function HeroCar() {
  return (
    <figure className="card m-0 w-full !p-3">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-[calc(var(--radius-panel)-12px)] bg-gradient-to-b from-stone-50 to-stone-100 sm:aspect-[16/11]">
        <CarScene />
      </div>
      <figcaption className="flex items-center justify-between gap-3 px-2 pb-1 pt-3 text-sm">
        <span className="font-medium text-stone-900">Example: a hatchback with 12 tiles</span>
        <span className="tabular-nums text-stone-600">8 of 12 sponsored · £40 a tile</span>
      </figcaption>
    </figure>
  );
}
