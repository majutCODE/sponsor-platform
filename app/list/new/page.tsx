import SubmitButton from "@/components/SubmitButton";
import { createListing } from "@/app/actions";
import { Notice } from "@/components/StatusBadge";
import { FEE_RATE } from "@/lib/money";
import { CATEGORIES } from "@/lib/categories";


export default async function NewListing({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">List an object</h1>
      <p className="mt-2 text-stone-600">
        Brands will buy tiles on your photo. Once the logos are on the real object, upload a proof photo and we pay you
        {" "}{100 - FEE_RATE * 100}% of every tile.
      </p>
      {error && <div className="mt-6"><Notice>{error}</Notice></div>}
      <form action={createListing} className="card mt-6 space-y-5">
        <div>
          <label className="label" htmlFor="title">What is it?</label>
          <input className="input" id="title" name="title" required maxLength={120} placeholder="e.g. My prom dress, 2026 Porsche 911" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select className="input" id="category" name="category">{CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}</select>
          </div>
          <div>
            <label className="label" htmlFor="price">Price per tile (£)</label>
            <input className="input" id="price" name="price" type="number" min={1} max={100000} step="0.01" required defaultValue={50} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" rows={4} maxLength={1500} placeholder="Where will it be seen? Event date, audience, how logos will be applied..." />
        </div>
        <div>
          <label className="label" htmlFor="image">Photo of the object</label>
          <input className="input" id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
          <p className="mt-1 text-xs text-stone-500">Under 4 MB. The tile grid is laid over this photo.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rows">Grid rows</label>
            <input className="input" id="rows" name="rows" type="number" min={1} max={8} required defaultValue={3} />
          </div>
          <div>
            <label className="label" htmlFor="cols">Grid columns</label>
            <input className="input" id="cols" name="cols" type="number" min={1} max={8} required defaultValue={3} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="listerName">Your name</label>
            <input className="input" id="listerName" name="listerName" required maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="listerEmail">Your email</label>
            <input className="input" id="listerEmail" name="listerEmail" type="email" required maxLength={120} />
          </div>
        </div>
        <SubmitButton className="w-full">Publish listing</SubmitButton>
      </form>
    </div>
  );
}
