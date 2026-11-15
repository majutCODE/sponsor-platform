import Link from "next/link";
import type { Tile } from "@/lib/data";
import { fmt } from "@/lib/money";
import { getTemplate } from "@/lib/templates";
import ObjectTiles from "@/components/ObjectTiles";

export default function TileGrid(props: {
  id: string;
  imageUrl: string;
  rows: number;
  cols: number;
  tiles: Record<number, Tile>;
  /** Lowest bid accepted next on each spot, in pence. */
  ask?: Record<number, number>;
  buyable?: boolean;
  highlight?: number;
  compact?: boolean;
  /** Set design key. When present the tiles are drawn on the object instead of over the photo. */
  template?: string;
  /** Adds an empty image on the highlighted spot that the bid form fills with the chosen logo. */
  preview?: boolean;
}) {
  const { id, imageUrl, rows, cols, tiles, ask = {}, buyable, highlight, compact, preview } = props;
  const template = getTemplate(props.template);
  if (template) return <ObjectTiles id={id} template={template} tiles={tiles} ask={ask} buyable={buyable} highlight={highlight} compact={compact} preview={preview} />;
  return (
    <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)-10px)] border-2 border-stone-900 bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="block w-full" />
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const t = tiles[i];
          const ghost = preview && highlight === i ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img id="logo-preview" alt="" hidden className="absolute inset-1 m-auto max-h-[calc(100%-8px)] max-w-[calc(100%-8px)] rounded bg-white object-contain" />
          ) : null;
          const tag = (
            <span className="rounded-full border-2 border-stone-900 bg-white px-1.5 text-[11px] font-extrabold leading-4 tabular-nums text-stone-900">
              {fmt(ask[i] ?? 0).replace(/\.00$/, "")}
            </span>
          );
          const hl = highlight === i ? " ring-4 ring-inset ring-[var(--s-blue)] bg-[var(--s-blue)]/30" : "";
          if (t) {
            const inner = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.logoUrl} alt={t.brandName} title={t.brandName} className="max-h-full max-w-full object-contain" />
            );
            const cls = `relative flex items-center justify-center border border-white/50 bg-white/85 ${compact ? "p-0.5" : "p-1.5"}${hl}`;
            if (buyable) return <Link key={i} href={`/l/${id}?spot=${i}`} scroll={false} aria-label={`Outbid ${t.brandName} on spot ${i + 1}`} className={cls}>{inner}<span className="absolute bottom-0.5 right-0.5">{tag}</span></Link>;
            if (ghost) return <div key={i} className={cls}>{inner}{ghost}</div>;
            return t.website && !compact ? (
              <a key={i} href={t.website} target="_blank" rel="noopener noreferrer sponsored" className={cls}>{inner}</a>
            ) : (
              <div key={i} className={cls}>{inner}</div>
            );
          }
          if (buyable) {
            return (
              <Link key={i} href={`/l/${id}?spot=${i}`} scroll={false} aria-label={`Bid on spot ${i + 1}`} className={`flex items-center justify-center border border-dashed border-white/80 transition hover:bg-[var(--s-yellow)]/50 ${hl}`}>
                {tag}
              </Link>
            );
          }
          return <div key={i} className={`relative border border-white/40 ${hl}`}>{ghost}</div>;
        })}
      </div>
    </div>
  );
}
