import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { confirmWinners, declineBid, submitProof } from "@/app/actions";
import { canSubmitProof, checkToken, getListing, TERMS } from "@/lib/data";
import { fmt } from "@/lib/money";
import { fmtDateTime } from "@/lib/time";
import TileGrid from "@/components/TileGrid";
import StatusBadge, { Notice } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Manage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; new?: string; error?: string; submitted?: string; confirmed?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const l = await getListing(id);
  if (!l || !checkToken(l, sp.t)) {
    return <div className="card mx-auto max-w-md text-center">This manage link is invalid. <Link href="/" className="text-indigo-600">Go home</Link></div>;
  }
  const sponsors = Object.values(l.tiles).sort((a, b) => a.index - b.index);
  const term = TERMS[l.meta.term];
  const proofNo = Math.min(l.proofsApproved + 1, l.proofsTotal);

  return (
    <div className="space-y-6">
      {sp.new && <Notice kind="info" title="Your listing is up">Bidding opens {fmtDateTime(l.meta.launchAt)} and the timer ends {fmtDateTime(l.meta.closesAt)}. Share the public page with brands.</Notice>}
      {sp.confirmed && <Notice kind="success">Sponsors confirmed. We are printing the stickers and will post them to you.</Notice>}
      {sp.submitted && <Notice kind="success">Proof submitted. We&apos;ll review it shortly.</Notice>}
      {sp.error && <Notice>{sp.error}</Notice>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-stone-500">Managing</div>
          <h1 className="text-2xl font-semibold">{l.meta.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={l.status} />
          <Link href={`/l/${id}`} className="btn-ghost">View public page</Link>
          <Link href={`/c/${l.meta.creatorId}?t=${sp.t}`} className="btn-ghost">Creator page</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          [l.confirmed ? "Spots sold" : "Spots with bids", `${l.sold}/${l.total}`],
          [l.confirmed ? "Sponsor payments" : "Leading bids", fmt(l.gross)],
          ["Platform fee", fmt(l.fees)],
          [l.paid ? "Paid to you" : "Your payout", fmt(l.payout)],
        ].map(([k, v]) => (
          <div key={k} className="card"><div className="text-xs text-stone-500">{k}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div></div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 font-semibold">{l.confirmed ? "Your sponsors" : "Brands in the lead"}</div>
          <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} template={l.meta.template} tiles={l.tiles} compact />
          {sponsors.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No bids yet. Share your public page with brands.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {sponsors.map((t) => (
                <li key={t.index} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logoUrl} alt="" className="h-6 w-10 object-contain" />
                    Spot #{t.index + 1}: {t.brandName} · <span className="tabular-nums">{fmt(t.amount)}</span>
                  </span>
                  {!l.confirmed && (
                    <form action={declineBid}>
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="t" value={sp.t} />
                      <input type="hidden" name="bidId" value={t.id} />
                      <button className="text-sm font-semibold text-red-700 hover:underline">Decline brand</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!l.confirmed && sponsors.length > 0 && <p className="mt-3 text-xs text-stone-500">Declining a brand hands the spot to the next highest bid.</p>}
          {l.status === "confirming" && (
            <form action={confirmWinners} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="t" value={sp.t} />
              <SubmitButton className="w-full">Confirm these sponsors</SubmitButton>
              <p className="text-xs text-stone-500">Both sides have to agree. Confirm by {fmtDateTime(l.confirmBy)} or the brands are released.</p>
            </form>
          )}
        </div>

        <div className="card">
          <div className="mb-1 font-semibold">Proof</div>
          {!l.confirmed ? (
            <p className="text-sm text-stone-600">Once the timer ends and you confirm your sponsors, we post you the stickers. Put them all on, then upload your first proof photo here to get paid.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-stone-600">
                {l.proofsApproved === 0
                  ? "Put every sticker on its spot, take a clear photo showing all of them, and upload it. You are paid once we verify it."
                  : `${term.cadence}. ${l.proofsApproved} of ${l.proofsTotal} verified.`}
                {l.nextProofDue && l.status !== "in_review" ? ` Next proof due ${fmtDateTime(l.nextProofDue)}.` : ""}
              </p>
              {l.status === "proof_overdue" && <Notice>Your proof is overdue. Upload it now to avoid a strike. Three strikes removes your verified status.</Notice>}
              {l.status === "proof_rejected" && l.lastRejection && <Notice>Your last proof was rejected: {l.lastRejection.reason}</Notice>}
              {l.latestProof && l.status !== "proof_rejected" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.latestProof.proofUrl} alt="Your latest proof" className="mb-3 w-full rounded-lg" />
              )}
              {l.status === "in_review" && <p className="text-sm text-amber-800">Waiting for review.</p>}
              {l.proofsApproved > 0 && !l.paid && <p className="mb-3 text-sm text-sky-800">Stickers verified. Your payout of {fmt(l.payout)} is being processed.</p>}
              {l.paid && <p className="mb-3 text-sm text-emerald-800">Paid. {fmt(l.payout)} sent to you.</p>}
              {l.status === "complete" && <p className="text-sm text-stone-600">All proofs verified. This deal is complete.</p>}
              {canSubmitProof(l) && (
                <form action={submitProof} className="space-y-3">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="t" value={sp.t} />
                  <input className="input" name="proof" type="file" accept="image/jpeg,image/png,image/webp" required />
                  <textarea className="input" name="note" rows={2} maxLength={500} placeholder="Optional note for the reviewer (where and when this was taken)" />
                  <SubmitButton className="w-full">Submit proof {proofNo} of {l.proofsTotal}</SubmitButton>
                </form>
              )}
              <p className="mt-3 text-xs text-stone-500">Sticker damaged or fallen off? Email us and we will send a replacement.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
