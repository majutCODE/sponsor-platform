import Link from "next/link";
import type { Tile } from "@/lib/data";
import { fmt } from "@/lib/money";
import type { Template } from "@/lib/templates";

const INK = "#1d1a16";

/** Tiles drawn on the set design of the object, one drawing per side. */
export default function ObjectTiles(props: {
  id: string;
  template: Template;
  tiles: Record<number, Tile>;
  /** Lowest bid accepted next on each spot, in pence. */
  ask?: Record<number, number>;
  buyable?: boolean;
  highlight?: number;
  compact?: boolean;
  /** Adds an empty image on the highlighted spot that the bid form fills with the chosen logo. */
  preview?: boolean;
}) {
  const { id, template: t, tiles, ask = {}, buyable, highlight, compact, preview } = props;
  const price = (i: number) => fmt(ask[i] ?? 0).replace(/\.00$/, "");
  const per = t.slots.length;
  const zones = [...new Map(t.slots.map((s) => [s.zone, s])).values()];
  return (
    <div className="rounded-[calc(var(--radius-panel)-10px)] bg-[var(--background)]">
      <div className="grid">
        {(compact ? t.sides.slice(0, 1) : t.sides).map((side, s) => {
          const flip = s === 1;
          const clip = `clip-${id}-${t.key}-${s}`;
          return (
            <figure key={s} className="m-0">
              <svg viewBox={t.viewBox} className="block w-full" role="img" aria-label={`${side || "Object"} tile layout`}>
                <defs><clipPath id={clip}><path d={t.body} clipRule="evenodd" transform={flip ? `translate(${t.width},0) scale(-1,1)` : undefined} /></clipPath></defs>
                <g transform={flip ? `translate(${t.width},0) scale(-1,1)` : undefined}>
                  <path d={t.body} fill="#ffffff" fillRule="evenodd" />
                </g>
                <g clipPath={`url(#${clip})`}>
                  {t.slots.map((slot, k) => {
                    const i = s * per + k;
                    const x = flip ? t.width - slot.x - slot.w : slot.x;
                    const sold = tiles[i];
                    const hl = highlight === i;
                    const frame = { x, y: slot.y, width: slot.w, height: slot.h, rx: 3, stroke: hl ? "#2b6cff" : INK, strokeWidth: hl ? 3.5 : 1.5 };
                    const ghost = preview && hl ? (
                      <image id="logo-preview" x={x + 2} y={slot.y + 2} width={slot.w - 4} height={slot.h - 4} preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: "none" }} />
                    ) : null;
                    if (sold) {
                      // While bidding is open the strip shows the price to beat.
                      const tag = Math.min(11, slot.h * 0.36);
                      const tagText = price(i);
                      const tagSize = Math.min(tag * 0.78, (slot.w - 4) / (tagText.length * 0.62));
                      const inner = (
                        <>
                          <rect {...frame} fill="#ffffff" />
                          <image href={sold.logoUrl} x={x + 2} y={slot.y + 2} width={slot.w - 4} height={slot.h - 4 - (buyable ? tag : 0)} preserveAspectRatio="xMidYMid meet"><title>{sold.brandName}</title></image>
                          {buyable && (
                            <>
                              <rect x={x} y={slot.y + slot.h - tag} width={slot.w} height={tag} fill={INK} />
                              <text x={x + slot.w / 2} y={slot.y + slot.h - tag / 2 + tagSize * 0.36} textAnchor="middle" fontSize={tagSize} fontWeight={800} fill="#ffffff" style={{ pointerEvents: "none" }}>{tagText}</text>
                              <rect {...frame} fill="none" />
                            </>
                          )}
                          {ghost && <rect {...frame} fill="#ffffff" />}
                          {ghost}
                        </>
                      );
                      if (buyable) return <Link key={i} href={`/l/${id}?spot=${i}`} scroll={false} aria-label={`Outbid ${sold.brandName} on spot ${i + 1}, ${tagText} to lead`} className="transition-opacity hover:opacity-75">{inner}</Link>;
                      return sold.website && !compact ? (
                        <a key={i} href={sold.website} target="_blank" rel="noopener noreferrer sponsored">{inner}</a>
                      ) : (
                        <g key={i}>{inner}</g>
                      );
                    }
                    const text = buyable ? price(i) : slot.prime ? "HERO" : String(i + 1);
                    const size = Math.min(13, slot.h * 0.46, (slot.w - 4) / (text.length * 0.62));
                    const label = (
                      <>
                        <rect {...frame} fill={slot.color} fillOpacity={buyable || hl ? 1 : 0.55} strokeDasharray={hl ? undefined : "4 3"} />
                        {!compact && (
                          <text x={x + slot.w / 2} y={slot.y + slot.h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={800} fill={slot.color === "#2b6cff" ? "#ffffff" : INK} style={{ pointerEvents: "none" }}>
                            {text}
                          </text>
                        )}
                        {ghost}
                      </>
                    );
                    return buyable ? (
                      <Link key={i} href={`/l/${id}?spot=${i}`} scroll={false} aria-label={`Bid on spot ${i + 1}, ${slot.zone}${side ? `, ${side}` : ""}, from ${text}`} className="transition-opacity hover:opacity-75">{label}</Link>
                    ) : (
                      <g key={i}>{label}</g>
                    );
                  })}
                </g>
                <g transform={flip ? `translate(${t.width},0) scale(-1,1)` : undefined}>
                  <path d={t.body} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
                  <g dangerouslySetInnerHTML={{ __html: t.extra }} />
                </g>
              </svg>
              {side && !compact && <figcaption className="pb-2 text-center text-xs font-semibold text-stone-600">{side}</figcaption>}
            </figure>
          );
        })}
      </div>
      {!compact && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-dashed border-[var(--border-subtle)] px-3 py-2 text-xs">
          {zones.map((z) => (
            <li key={z.zone} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px] border-[1.5px] border-stone-900" style={{ background: z.color }} />
              {z.zone}{z.prime && <span className="rounded-full border-[1.5px] border-stone-900 bg-white px-1.5 text-[10px] font-bold">HERO</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
