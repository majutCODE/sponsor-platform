"use client";
import { useState } from "react";

/** Bid input in whole pounds with quick raise buttons. `min` is the lowest bid the spot takes. */
export default function BidAmount({ min, initial, id = "amount" }: { min: number; initial?: number; id?: string }) {
  const [value, setValue] = useState(String(Math.max(min, initial ?? min)));
  const n = Number(value);
  const raise = (by: number) => setValue(String(Math.max(min, Number.isFinite(n) ? Math.floor(n) : min) + by));
  return (
    <div>
      <label className="label" htmlFor={id}>Your bid</label>
      <div className="relative">
        <span className="display pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl" aria-hidden>£</span>
        <input
          className="input display !py-3 !pl-10 !text-2xl tabular-nums"
          id={id}
          name="amount"
          type="number"
          inputMode="numeric"
          min={min}
          step="1"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {[10, 25, 50].map((by) => (
          <button key={by} type="button" onClick={() => raise(by)} className="btn-ghost !min-h-9 !px-3.5 tabular-nums">+£{by}</button>
        ))}
        <button type="button" onClick={() => setValue(String(min))} className="btn-ghost !min-h-9 !px-3.5 tabular-nums">Lowest £{min}</button>
      </div>
    </div>
  );
}
