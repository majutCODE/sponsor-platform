"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pad = (n: number) => String(n).padStart(2, "0");

/** Live timer to a moment. Refreshes the page when it hits zero so the listing changes state. */
export default function Countdown({ to, label }: { to: number; label: string }) {
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
  const parts: [string, number][] = [["days", Math.floor(s / 86400)], ["hrs", Math.floor(s / 3600) % 24], ["min", Math.floor(s / 60) % 60], ["sec", s % 60]];
  return (
    <div>
      <div className="text-xs font-bold">{label}</div>
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
