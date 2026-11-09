import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TileSponsor",
  description: "Brands sponsor the things people own, one tile at a time.",
};

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-8 w-8 -rotate-6 grid-cols-2 gap-[3px] rounded-[10px] border-[2.5px] border-stone-900 bg-[var(--accent)] p-[4px]" aria-hidden>
        <span className="rounded-[3px] bg-white" />
        <span className="rounded-[3px] bg-[var(--s-lime)]" />
        <span className="rounded-[3px] bg-[var(--s-yellow)]" />
        <span className="rounded-[3px] bg-white" />
      </span>
      <span className="text-[24px] font-extrabold leading-none tracking-tight">tilesponsor</span>
    </span>
  );
}

const NAV = [
  { href: "/#browse", label: "Browse" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-30 bg-[var(--background)]/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
            <Link href="/"><Wordmark /></Link>
            <nav className="flex items-center gap-6 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hidden font-semibold text-stone-900 transition hover:text-[var(--accent)] sm:inline">{n.label}</Link>
              ))}
              <Link href="/list/new" className="btn !min-h-9">List an object</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-12">{children}</main>
        <footer className="mt-12 border-t-[2.5px] border-stone-900 bg-[var(--surface-muted)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Wordmark />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-600">
                Brands sponsor the things people own, one tile at a time. Paid out only on photo proof.
              </p>
            </div>
            {[
              ["Listers", [["List an object", "/list/new"], ["How it works", "/#how"]]],
              ["Brands", [["Browse objects", "/#browse"], ["FAQ", "/#faq"]]],
              ["Team", [["Admin", "/admin"]]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <div className="text-sm font-extrabold">{title as string}</div>
                <ul className="mt-3 space-y-2 text-sm">
                  {(links as string[][]).map(([l, h]) => (
                    <li key={h}><Link href={h} className="text-stone-600 hover:text-stone-900">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t-[2.5px] border-stone-900">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-5 py-5 text-xs text-stone-500 sm:flex-row">
              <span>© 2026 TileSponsor</span>
              <span>Test mode: payments are simulated. No real money moves.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
