import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { createListing } from "@/app/actions";
import { Notice } from "@/components/StatusBadge";
import { FEE_RATE, fmt } from "@/lib/money";
import { checkCreatorToken, getCreator, MIN_BID, TERMS, type Term } from "@/lib/data";
import CategoryFields from "@/components/CategoryFields";

export const dynamic = "force-dynamic";

export default async function NewListing({ searchParams }: { searchParams: Promise<{ error?: string; c?: string; t?: string }> }) {
  const { error, c, t } = await searchParams;
  const creator = await getCreator(c);
  const ok = !!creator && checkCreatorToken(creator, t);

  if (!ok || creator.status !== "verified") {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-semibold">Listing is for verified creators</h1>
        <p className="mt-3 text-stone-600">
          {ok && creator.status === "pending"
            ? "Your application is still being reviewed. You can list as soon as you are verified."
            : "Apply once, get verified, then list as many objects as you like. Already verified? Open the private link we gave you."}
        </p>
        <div className="mt-6">
          {ok ? <Link href={`/c/${c}?t=${t}`} className="btn">Back to your creator page</Link> : <Link href="/creators/apply" className="btn btn-accent">Apply as a creator</Link>}
        </div>
      </div>
    );
  }

  const min = MIN_BID / 100;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">List an object</h1>
      <p className="mt-2 text-stone-600">
        Brands bid on sticker spots while your timer runs. The highest bid on each spot wins. We post you the stickers, you put them on, and we pay you
        {" "}{100 - FEE_RATE * 100}% once a photo shows they are on.
      </p>
      {error && <div className="mt-6"><Notice>{error}</Notice></div>}
      <form action={createListing} className="card mt-6 space-y-5">
        <input type="hidden" name="c" value={c} />
        <input type="hidden" name="t" value={t} />
        <div>
          <label className="label" htmlFor="title">What is it?</label>
          <input className="input" id="title" name="title" required maxLength={120} placeholder="e.g. My track day BMW, my wedding dress" />
        </div>
        <CategoryFields
          hero={
            <div>
              <label className="label" htmlFor="heroBid">Opening bid, hero spot (£)</label>
              <input className="input" id="heroBid" name="heroBid" type="number" min={min} max={100000} step="1" required defaultValue={min * 3} />
            </div>
          }
        >
          <div>
            <label className="label" htmlFor="startBid">Opening bid, medium spot (£)</label>
            <input className="input" id="startBid" name="startBid" type="number" min={min} max={100000} step="1" required defaultValue={min} />
            <p className="mt-1 text-xs text-stone-500">For the whole deal. Minimum {fmt(MIN_BID).replace(/\.00$/, "")}.</p>
          </div>
        </CategoryFields>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="term">Deal length</label>
            <select className="input" id="term" name="term" defaultValue="3">
              {(Object.keys(TERMS) as Term[]).map((k) => <option key={k} value={k}>{TERMS[k].label} · {TERMS[k].cadence.toLowerCase()}</option>)}
            </select>
            <p className="mt-1 text-xs text-stone-500">How long the stickers stay on. Starts when your first proof is verified.</p>
          </div>
          <div>
            <label className="label" htmlFor="eventDate">Event date (one-off events only)</label>
            <input className="input" id="eventDate" name="eventDate" type="date" />
          </div>
          <div>
            <label className="label" htmlFor="launchAt">Bidding opens (UK time)</label>
            <input className="input" id="launchAt" name="launchAt" type="datetime-local" />
            <p className="mt-1 text-xs text-stone-500">Leave empty to open now. A future date shows a countdown.</p>
          </div>
          <div>
            <label className="label" htmlFor="closesAt">Timer ends (UK time)</label>
            <input className="input" id="closesAt" name="closesAt" type="datetime-local" required />
            <p className="mt-1 text-xs text-stone-500">Highest bids win at this moment.</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" rows={4} maxLength={1500} placeholder="Where will it be seen? Events, videos, daily use, who is watching..." />
        </div>
        <div>
          <label className="label" htmlFor="image">Photo of the object</label>
          <input className="input" id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
          <p className="mt-1 text-xs text-stone-500">Under 4 MB. Shown on your listing so brands see the real thing.</p>
        </div>
        <SubmitButton className="w-full">Publish listing</SubmitButton>
      </form>
    </div>
  );
}
