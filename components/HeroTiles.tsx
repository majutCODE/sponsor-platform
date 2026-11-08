"use client";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const BRANDS = ["Acme", "Nova", "Pulse", "Orbit", "Kite", "Lumen", "Bolt", "Fern", "Echo"];
const ORDER = [4, 0, 8, 2, 6, 1, 7, 3, 5];

export default function HeroTiles() {
  const reduce = useReducedMotion();
  const [filled, setFilled] = useState(reduce ? 6 : 0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setFilled((n) => (n >= 9 ? 0 : n + 1)), 900);
    return () => clearInterval(t);
  }, [reduce]);
  const on = new Set(ORDER.slice(0, filled));
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_50%_40%,var(--accent-subtle),transparent)]" />
      <div className="card !p-3">
        <div className="grid grid-cols-3 gap-2 rounded-[1.25rem] bg-stone-50 p-2">
          {BRANDS.map((b, i) => (
            <div key={b} className="relative aspect-square overflow-hidden rounded-[0.9rem] border border-dashed border-stone-300">
              <span className="absolute inset-0 grid place-items-center text-xs text-stone-400">£25</span>
              <motion.div
                className="absolute inset-0 grid place-items-center rounded-[0.9rem] border border-stone-200 bg-white text-sm font-semibold shadow-sm"
                initial={false}
                animate={on.has(i) ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: 0.85, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                {b}
              </motion.div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-2 pb-1 pt-3 text-sm">
          <span className="font-medium">Vintage Vespa</span>
          <span className="tabular-nums text-stone-500">{filled}/9 tiles sponsored</span>
        </div>
      </div>
    </div>
  );
}
