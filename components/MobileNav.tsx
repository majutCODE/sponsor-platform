"use client";
import Link from "next/link";
import { useState } from "react";

/** Phone menu. The header links are hidden below the sm breakpoint, so this carries them. */
export default function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)} className="btn-ghost !min-h-9 !px-4">
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-16 border-y-[2.5px] border-stone-900 bg-[var(--background)] px-5 py-4 shadow-[0_6px_0_var(--foreground)]">
          <ul className="space-y-1">
            {links.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="display block rounded-xl px-2 py-2.5 text-2xl active:bg-[var(--s-lime)]">{n.label}</Link>
              </li>
            ))}
          </ul>
          <Link href="/creators/apply" onClick={() => setOpen(false)} className="btn btn-accent mt-4 w-full">Apply as a creator</Link>
        </div>
      )}
    </div>
  );
}
