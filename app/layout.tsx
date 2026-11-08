import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TileSponsor",
  description: "Brands sponsor the things people own, one tile at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="grid h-7 w-7 grid-cols-2 gap-0.5 rounded-md bg-indigo-600 p-1">
                <span className="rounded-sm bg-white/90" />
                <span className="rounded-sm bg-white/40" />
                <span className="rounded-sm bg-white/40" />
                <span className="rounded-sm bg-white/90" />
              </span>
              TileSponsor
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/#browse" className="hidden text-stone-600 hover:text-stone-900 sm:inline">Browse</Link>
              <Link href="/admin" className="text-stone-600 hover:text-stone-900">Admin</Link>
              <Link href="/list/new" className="btn !py-2">List an object</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-stone-500">
          Test mode: payments are simulated. No real money moves.
        </footer>
      </body>
    </html>
  );
}
