import Link from "next/link";
import { adminAction, adminLogin, adminLogout } from "@/app/actions";
import { adminPassword, isAdmin } from "@/lib/admin";
import { getAllListings, type Status } from "@/lib/data";
import { fmt } from "@/lib/money";
import StatusBadge, { Notice } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const ORDER: Status[] = ["in_review", "approved", "proof_rejected", "sold_out", "open", "paid_out"];

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-bold">Admin</h1>
        {error && <div className="mt-4"><Notice>{error}</Notice></div>}
        {!adminPassword() ? (
          <p className="mt-4 text-sm text-stone-600">Set the ADMIN_PASSWORD environment variable to enable admin.</p>
        ) : (
          <form action={adminLogin} className="card mt-4 space-y-3">
            <input className="input" name="password" type="password" placeholder="Admin password" required />
            <button className="btn w-full">Log in</button>
          </form>
        )}
      </div>
    );
  }

  const listings = (await getAllListings()).sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const totals = listings.reduce((s, l) => ({ gross: s.gross + l.gross, fees: s.fees + l.fees, tiles: s.tiles + l.sold }), { gross: 0, fees: 0, tiles: 0 });
  const owed = listings.filter((l) => l.status === "approved").reduce((s, l) => s + l.payout, 0);
  const review = listings.filter((l) => l.status === "in_review").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <form action={adminLogout}><button className="btn-ghost">Log out</button></form>
      </div>
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Proofs to review", String(review)],
          ["Tiles sold", String(totals.tiles)],
          ["Platform revenue", fmt(totals.fees)],
          ["Payouts owed", fmt(owed)],
        ].map(([k, v]) => (
          <div key={k} className="card"><div className="text-xs text-stone-500">{k}</div><div className="text-xl font-bold">{v}</div></div>
        ))}
      </div>

      {listings.length === 0 && <div className="card text-stone-600">No listings yet.</div>}
      {listings.map((l) => (
        <div key={l.meta.id} id={l.meta.id} className="card grid gap-5 md:grid-cols-[200px_1fr_260px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.meta.imageUrl} alt="" className="w-full rounded-lg object-cover" />
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/l/${l.meta.id}`} className="text-base font-semibold hover:underline">{l.meta.title}</Link>
              <StatusBadge status={l.status} />
            </div>
            <div className="text-stone-500">{l.meta.listerName} · {l.meta.listerEmail}</div>
            <div>{l.sold}/{l.total} tiles · gross {fmt(l.gross)} · fee {fmt(l.fees)} · lister {fmt(l.payout)}</div>
            {l.sold > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.values(l.tiles).sort((a, b) => a.index - b.index).map((t) => (
                  <span key={t.index} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs" title={`${t.email} · ${t.paymentRef}`}>#{t.index + 1} {t.brandName}</span>
                ))}
              </div>
            )}
            {l.latestProof?.note && <div className="rounded bg-stone-50 p-2 text-stone-600">Lister note: {l.latestProof.note}</div>}
          </div>
          <div className="space-y-3">
            {l.latestProof ? (
              <a href={l.latestProof.proofUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.latestProof.proofUrl} alt="Proof" className="w-full rounded-lg ring-1 ring-stone-200" />
              </a>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-xs text-stone-500">No proof yet</div>
            )}
            {l.status === "in_review" && (
              <div className="space-y-2">
                <form action={adminAction}>
                  <input type="hidden" name="id" value={l.meta.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button className="btn w-full">Approve proof</button>
                </form>
                <form action={adminAction} className="space-y-2">
                  <input type="hidden" name="id" value={l.meta.id} />
                  <input type="hidden" name="action" value="reject" />
                  <input className="input" name="reason" placeholder="Reason for rejection" />
                  <button className="btn-ghost w-full">Reject</button>
                </form>
              </div>
            )}
            {l.status === "approved" && (
              <form action={adminAction}>
                <input type="hidden" name="id" value={l.meta.id} />
                <input type="hidden" name="action" value="paid" />
                <button className="btn w-full">Mark {fmt(l.payout)} paid to lister</button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
