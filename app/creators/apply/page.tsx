import SubmitButton from "@/components/SubmitButton";
import { applyCreator } from "@/app/actions";
import { Notice } from "@/components/StatusBadge";

export default async function Apply({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">Apply as a creator</h1>
      <p className="mt-2 text-stone-600">
        TileSponsor is for verified creators. Tell us who you are and where your audience is. We review every application by hand, so there is no follower minimum.
      </p>
      {error && <div className="mt-6"><Notice>{error}</Notice></div>}
      <form action={applyCreator} className="card mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Your name or channel name</label>
            <input className="input" id="name" name="name" required maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="platform">Main platform</label>
            <select className="input" id="platform" name="platform">
              {["Instagram", "TikTok", "YouTube", "Twitch", "X", "Other"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="followers">Followers there</label>
            <input className="input" id="followers" name="followers" type="number" min={0} step="1" required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="handle">Link to your account</label>
          <input className="input" id="handle" name="handle" required maxLength={200} placeholder="instagram.com/yourname" />
        </div>
        <div>
          <label className="label" htmlFor="about">What would you list, and where is it seen?</label>
          <textarea className="input" id="about" name="about" rows={4} maxLength={1000} placeholder="My drift car, at 12 events a year and in every video..." />
        </div>
        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input type="checkbox" name="uk" required className="mt-1" />
          I am based in the UK and aged 18 or over.
        </label>
        <SubmitButton className="w-full">Send application</SubmitButton>
      </form>
    </div>
  );
}
