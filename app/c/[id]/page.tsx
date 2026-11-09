import Link from "next/link";
import { headers } from "next/headers";
import { checkCreatorToken, CREATOR_STATUS_LABEL, fmtFollowers, getAllListings, getCreator, MAX_STRIKES, tierOf } from "@/lib/data";
import StatusBadge, { Notice } from "@/components/StatusBadge";
import { fmt } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CreatorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; new?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = await getCreator(id);
  if (!c || !checkCreatorToken(c, sp.t)) {
    return <div className="card mx-auto max-w-md text-center">This creator link is invalid. <Link href="/creators/apply" className="text-indigo-600">Apply as a creator</Link></div>;
  }
  const h = await headers();
  const url = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}/c/${id}?t=${sp.t}`;
  const listings = (await getAllListings()).filter((l) => l.meta.creatorId === id);
  const rejection = c.events.filter((e) => e.type === "rejected").at(-1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {sp.new && (
        <Notice kind="info" title="Application received">
          <div>Save this private link. It is how you check your status, list objects and get paid.</div>
          <code className="mt-2 block break-all rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs">{url}</code>
        </Notice>
      )}
      {sp.error && <Notice>{sp.error}</Notice>}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-stone-500">Creator</div>
            <h1 className="text-3xl font-semibold">{c.meta.name}</h1>
            <div className="mt-1 text-sm text-stone-600">{fmtFollowers(c.meta.followers)} followers on {c.meta.platform} · {tierOf(c.meta.followers)}</div>
          </div>
          <span className="sticker rounded-full px-3 py-1 text-sm font-bold" style={{ background: c.status === "verified" ? "var(--s-lime)" : c.status === "pending" ? "var(--s-yellow)" : "#fff" }}>{CREATOR_STATUS_LABEL[c.status]}</span>
        </div>
        <p className="mt-4 text-sm text-stone-600">
          {c.status === "pending" && "We review every application by hand. Check back here soon."}
          {c.status === "verified" && `You can list objects. Strikes: ${c.strikes} of ${MAX_STRIKES}. A missed proof is a strike, and ${MAX_STRIKES} removes your verified status.`}
          {c.status === "rejected" && `We could not approve this application. ${rejection && "reason" in rejection ? rejection.reason : ""}`}
          {c.status === "removed" && "Your verified status was removed after three strikes."}
        </p>
        {c.status === "verified" && <Link href={`/list/new?c=${id}&t=${sp.t}`} className="btn btn-accent mt-5">List an object</Link>}
      </div>

      {listings.length > 0 && (
        <div className="card">
          <div className="mb-2 font-semibold">Your listings</div>
          <ul className="divide-y divide-stone-200 text-sm">
            {listings.map((l) => (
              <li key={l.meta.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2"><span className="font-semibold">{l.meta.title}</span><StatusBadge status={l.status} /></span>
                <span className="flex items-center gap-3"><span className="tabular-nums text-stone-600">{l.sold}/{l.total} spots · {fmt(l.payout)}</span><Link href={`/l/${l.meta.id}/manage?t=${sp.t}`} className="font-semibold text-indigo-600 hover:underline">Manage</Link></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
