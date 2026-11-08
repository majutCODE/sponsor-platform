import Link from "next/link";
import type { Tile } from "@/lib/data";
import { fmt } from "@/lib/money";

export default function TileGrid(props: {
  id: string;
  imageUrl: string;
  rows: number;
  cols: number;
  tiles: Record<number, Tile>;
  price: number;
  buyable?: boolean;
  highlight?: number;
  compact?: boolean;
}) {
  const { id, imageUrl, rows, cols, tiles, price, buyable, highlight, compact } = props;
  return (
    <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)-10px)] bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="block w-full" />
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const t = tiles[i];
          const hl = highlight === i ? " ring-4 ring-inset ring-indigo-500 bg-indigo-500/30" : "";
          if (t) {
            const inner = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.logoUrl} alt={t.brandName} title={t.brandName} className="max-h-full max-w-full object-contain" />
            );
            const cls = `flex items-center justify-center border border-white/50 bg-white/85 ${compact ? "p-0.5" : "p-1.5"}${hl}`;
            return t.website && !compact ? (
              <a key={i} href={t.website} target="_blank" rel="noopener noreferrer sponsored" className={cls}>{inner}</a>
            ) : (
              <div key={i} className={cls}>{inner}</div>
            );
          }
          if (buyable) {
            return (
              <Link
                key={i}
                href={`/l/${id}/buy/${i}`}
                className={`group flex items-center justify-center border border-dashed border-white/80 transition hover:bg-indigo-600/50 ${hl}`}
              >
                <span className="rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white opacity-70 group-hover:opacity-100">
                  {fmt(price)}
                </span>
              </Link>
            );
          }
          return <div key={i} className={`border border-white/40 ${hl}`} />;
        })}
      </div>
    </div>
  );
}
