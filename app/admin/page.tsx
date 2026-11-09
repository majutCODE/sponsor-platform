import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { adminAction, adminCreatorAction, adminLogin, adminLogout } from "@/app/actions";
import { adminPassword, isAdmin } from "@/lib/admin";
import { CREATOR_STATUS_LABEL, fmtFollowers, getAllCreators, getAllListings, payoutOwed, TERMS, tierOf, type Status } from "@/lib/data";
import { fmtDateTime } from "@/lib/time";
import { fmt } from "@/lib/money";
import StatusBadge, { Notice } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const ORDER: Status[] = ["in_review", "proof_overdue", "confirming", "stickers_due", "proof_rejected", "running", "live", "upcoming", "complete", "unsold"];

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold">Admin</h1>
        {error && <div className="mt-4"><Notice>{error}</Notice></div>}
        {!adminPassword() ? (
          <p className="mt-4 text-sm text-stone-600">Set the ADMIN_PASSWORD environment variable to enable admin.</p>
        ) : (
          <form action={adminLogin} className="card mt-4 space-y-3">
            <input className="input" name="password" type="password" placeholder="Admin password" required />
            <SubmitButton className="w-full">Log in</SubmitButton>
          </form>
        )}
      </div>
    );
  }

  const [all, creators] = await Promise.all([getAllListings(), getAllCreators()]);
  const listings = all.sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const sold = listings.filter((l) => l.confirmed);
  const totals = sold.reduce((s, l) => ({ fees: s.fees + l.fees, tiles: s.tiles + l.sold }), { fees: 0, tiles: 0 });
  const owed = listings.filter(payoutOwed).reduce((s, l) => s + l.payout, 0);
  const review = listings.filter((l) => l.status === "in_review").length;
  const pending = creators.filter((c) => c.status === "pending");
  const others = creators.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <form action={adminLogout}><button className="btn-ghost">Log out</button></form>
      </div>
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-5">
        {[
          ["Creators to review", String(pending.length)],
          ["Proofs to review", String(review)],
          ["Spots sold", String(totals.tiles)],
          ["Platform revenue", fmt(totals.fees)],
          ["Payouts owed", fmt(owed)],
        ].map(([k, v]) => (
          <div key={k} className="card"><div className="text-xs text-stone-500">{k}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div></div>
        ))}
      </div>

      <h2 className="text-xl font-semibold">Creators</h2>
      {creators.length === 0 && <div className="card text-stone-600">No applications yet.</div>}
      {[...pending, ...others].map((c) => (
        <div key={c.meta.id} id={`c-${c.meta.id}`} className="card grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="space-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{c.meta.name}</span>
              <span className="rounded-full border-2 border-stone-900 bg-white px-2 py-0.5 text-xs font-bold">{CREATOR_STATUS_LABEL[c.status]}</span>
              {c.strikes > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">{c.strikes} strike{c.strikes > 1 ? "s" : ""}</span>}
            </div>
            <div className="text-stone-500">{c.meta.email} · {fmtFollowers(c.meta.followers)} on {c.meta.platform} ({tierOf(c.meta.followers)})</div>
            <div className="break-all">{c.meta.handle}</div>
            {c.meta.about && <div className="rounded bg-stone-50 p-2 text-stone-600">{c.meta.about}</div>}
          </div>
          <div className="space-y-2">
            {c.status !== "verified" && c.status !== "removed" && (
              <form action={adminCreatorAction}>
                <input type="hidden" name="id" value={c.meta.id} />
                <input type="hidden" name="action" value="approve" />
                <SubmitButton className="w-full">Verify creator</SubmitButton>
              </form>
            )}
            {c.status === "pending" && (
              <form action={adminCreatorAction} className="space-y-2">
                <input type="hidden" name="id" value={c.meta.id} />
                <input type="hidden" name="action" value="reject" />
                <input className="input" name="reason" placeholder="Reason (shown to them)" />
                <SubmitButton variant="secondary" className="w-full">Reject</SubmitButton>
              </form>
            )}
            {c.status === "verified" && (
              <form action={adminCreatorAction} className="space-y-2">
                <input type="hidden" name="id" value={c.meta.id} />
                <input type="hidden" name="action" value="strike" />
                <input className="input" name="reason" placeholder="Reason for strike" />
                <SubmitButton variant="secondary" className="w-full">Add strike</SubmitButton>
              </form>
            )}
          </div>
        </div>
      ))}

      <h2 className="pt-4 text-xl font-semibold">Listings</h2>
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
            <div className="text-stone-500">{l.meta.listerName} · {l.creator?.meta.email} · {TERMS[l.meta.term].label}</div>
            <div>{l.sold}/{l.total} spots · gross {fmt(l.gross)} · fee {fmt(l.fees)} · creator {fmt(l.payout)}{l.paid ? " (paid)" : ""}</div>
            <div className="text-stone-500">
              Timer ends {fmtDateTime(l.meta.closesAt)}
              {l.status === "confirming" && ` · creator must confirm by ${fmtDateTime(l.confirmBy)}`}
              {l.confirmed && ` · proofs ${l.proofsApproved}/${l.proofsTotal}`}
              {l.nextProofDue && ` · next due ${fmtDateTime(l.nextProofDue)}`}
            </div>
            {l.sold > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.values(l.tiles).sort((a, b) => a.index - b.index).map((t) => (
                  <a key={t.index} href={t.logoUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-stone-100 px-2 py-0.5 text-xs" title={`${t.email} · ${t.paymentRef} · open logo to print`}>#{t.index + 1} {t.brandName} {fmt(t.amount)}</a>
                ))}
              </div>
            )}
            {l.latestProof?.note && <div className="rounded bg-stone-50 p-2 text-stone-600">Creator note: {l.latestProof.note}</div>}
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
                  <SubmitButton className="w-full">Approve proof {l.proofsApproved + 1} of {l.proofsTotal}</SubmitButton>
                </form>
                <form action={adminAction} className="space-y-2">
                  <input type="hidden" name="id" value={l.meta.id} />
                  <input type="hidden" name="action" value="reject" />
                  <input className="input" name="reason" placeholder="Reason for rejection" />
                  <SubmitButton variant="secondary" className="w-full">Reject</SubmitButton>
                </form>
              </div>
            )}
            {payoutOwed(l) && (
              <form action={adminAction}>
                <input type="hidden" name="id" value={l.meta.id} />
                <input type="hidden" name="action" value="paid" />
                <SubmitButton className="w-full">Mark {fmt(l.payout)} paid to creator</SubmitButton>
              </form>
            )}
            {l.status === "proof_overdue" && l.creator?.status === "verified" && (
              <form action={adminCreatorAction}>
                <input type="hidden" name="id" value={l.creator.meta.id} />
                <input type="hidden" name="action" value="strike" />
                <input type="hidden" name="reason" value={`Missed proof on ${l.meta.title}`} />
                <SubmitButton variant="secondary" className="w-full">Strike for missed proof</SubmitButton>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
