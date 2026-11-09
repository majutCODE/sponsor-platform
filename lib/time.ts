// All dates are entered and shown in UK time.
const TZ = "Europe/London";

/** "2026-11-10T18:00" typed as UK wall time, to a UTC timestamp. NaN if it does not parse. */
export function ukToUtc(local: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return NaN;
  const guess = Date.parse(local + ":00Z");
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(guess)
      .map((x) => [x.type, x.value])
  );
  const wall = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return guess - (wall - guess);
}

export const fmtDateTime = (ts: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ts);

export const fmtDate = (ts: number) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(ts);
