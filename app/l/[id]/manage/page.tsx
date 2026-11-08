import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { headers } from "next/headers";
import { submitProof } from "@/app/actions";
import { canSubmitProof, checkToken, getListing } from "@/lib/data";
import { fmt } from "@/lib/money";
import TileGrid from "@/components/TileGrid";
import StatusBadge, { Notice } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Manage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; new?: string; error?: string; submitted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const l = await getListing(id);
  if (!l || !checkToken(l, sp.t)) {
    return <div className="card mx-auto max-w-md text-center">This manage link is invalid. <Link href="/" className="text-indigo-600">Go home</Link></div>;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const manageUrl = `${proto}://${host}/l/${id}/manage?t=${sp.t}`;
  const sponsors = Object.values(l.tiles).sort((a, b) => a.index - b.index);

  return (
    <div className="space-y-6">
      {sp.new && (
        <Notice kind="info" title="Your listing is live">
          <div>Save this private link: it&apos;s how you manage it and get paid.</div>
          <code className="mt-2 block break-all rounded-2xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs">{manageUrl}</code>
        </Notice>
      )}
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Tiles sold", `${l.sold}/${l.total}`],
          ["Sponsor payments", fmt(l.gross)],
          ["Platform fee", fmt(l.fees)],
          [l.status === "paid_out" ? "Paid to you" : "Your payout", fmt(l.payout)],
        ].map(([k, v]) => (
          <div key={k} className="card"><div className="text-xs text-stone-500">{k}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div></div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 font-semibold">Logos to apply</div>
          <TileGrid id={id} imageUrl={l.meta.imageUrl} rows={l.meta.rows} cols={l.meta.cols} tiles={l.tiles} price={l.meta.tilePrice} compact />
          {sponsors.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No sponsors yet. Share your public page with brands.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {sponsors.map((t) => (
                <li key={t.index} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logoUrl} alt="" className="h-6 w-10 object-contain" />
                    Tile #{t.index + 1}: {t.brandName}
                  </span>
                  <a href={t.logoUrl} download className="text-indigo-600 hover:underline">Logo file</a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-1 font-semibold">Proof of sponsorship</div>
          <p className="mb-3 text-sm text-stone-600">
            Put every sponsor&apos;s logo on the real object, take a clear photo showing all of them, and upload it here.
            We pay you once it&apos;s approved.
          </p>
          {l.status === "proof_rejected" && l.lastRejection && (
            <Notice>Your last proof was rejected: {l.lastRejection.reason}</Notice>
          )}
          {l.latestProof && l.status !== "proof_rejected" && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.latestProof.proofUrl} alt="Your proof" className="mb-3 w-full rounded-2xl" />
            </>
          )}
          {l.status === "in_review" && <p className="text-sm text-amber-800">Waiting for review.</p>}
          {l.status === "approved" && <p className="text-sm text-sky-800">Approved. Your payout of {fmt(l.payout)} is being processed.</p>}
          {l.status === "paid_out" && <p className="text-sm text-emerald-800">Paid. {fmt(l.payout)} sent to you.</p>}
          {canSubmitProof(l) && (
            <form action={submitProof} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="t" value={sp.t} />
              <input className="input" name="proof" type="file" accept="image/jpeg,image/png,image/webp" required />
              <textarea className="input" name="note" rows={2} maxLength={500} placeholder="Optional note for the reviewer (where/when this was taken)" />
              <SubmitButton className="w-full">Submit proof</SubmitButton>
              {l.status === "open" && <p className="text-xs text-stone-500">Submitting proof closes your listing to new sponsors.</p>}
            </form>
          )}
          {l.sold === 0 && <p className="text-sm text-stone-500">You can submit proof once at least one tile is sold.</p>}
        </div>
      </div>
    </div>
  );
}
