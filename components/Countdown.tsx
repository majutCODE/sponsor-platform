"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pad = (n: number) => String(n).padStart(2, "0");

/** Live timer to a moment. Refreshes the page when it hits zero so the listing changes state.
 *  `compact` gives a short inline text such as "2d 4h" for cards and bars. */
export default function Countdown({ to, label, compact }: { to: number; label?: string; compact?: boolean }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, to - now);
  useEffect(() => {
    if (left === 0) router.refresh();
  }, [left, router]);
  const s = Math.floor((left ?? 0) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sec = s % 60;
  if (compact) {
    const text = left === null ? "--" : d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${pad(m)}m` : `${m}m ${pad(sec)}s`;
    return <span className="tabular-nums" suppressHydrationWarning>{text}</span>;
  }
  const parts: [string, number][] = [["days", d], ["hrs", h], ["min", m], ["sec", sec]];
  return (
    <div>
      {label && <div className="text-xs font-bold">{label}</div>}
      <div className="mt-1.5 flex gap-2" aria-live="off">
        {parts.map(([k, v]) => (
          <div key={k} className="sticker min-w-14 rounded-xl bg-[var(--s-yellow)] px-2 py-1.5 text-center">
            <div className="display text-2xl tabular-nums">{left === null ? "--" : pad(v)}</div>
            <div className="text-[10px] font-semibold uppercase">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
