import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "TileSponsor",
  description: "Brands sponsor the things people own, one tile at a time.",
};

function Logo() {
  return (
    <span className="grid h-7 w-7 grid-cols-2 gap-[3px] rounded-[9px] bg-stone-900 p-[5px]">
      <span className="rounded-[3px] bg-indigo-500" />
      <span className="rounded-[3px] bg-white/35" />
      <span className="rounded-[3px] bg-white/35" />
      <span className="rounded-[3px] bg-white" />
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-accent="violet" className={GeistSans.variable}>
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
            <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
              <Logo />
              TileSponsor
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/#browse" className="hidden rounded-full px-3 py-2 text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 sm:inline">Browse</Link>
              <Link href="/#how" className="hidden rounded-full px-3 py-2 text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 sm:inline">How it works</Link>
              <Link href="/admin" className="rounded-full px-3 py-2 text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">Admin</Link>
              <Link href="/list/new" className="btn ml-2 !min-h-9">List an object</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
        <footer className="border-t border-stone-200">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 text-stone-900"><Logo /><span className="font-medium">TileSponsor</span></div>
            <p>Test mode: payments are simulated. No real money moves.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
