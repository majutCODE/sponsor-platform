"use client";
import { useState, type ReactNode } from "react";
import { CATEGORIES } from "@/lib/categories";
import { getTemplate, templateKeyFor, tileTotal } from "@/lib/templates";
import ObjectTiles from "@/components/ObjectTiles";

/** Category picker. Shows the set design for the category, or grid size inputs for "Other". */
export default function CategoryFields({ children, hero }: { children?: ReactNode; hero?: ReactNode }) {
  const [category, setCategory] = useState<string>(CATEGORIES[0].name);
  const template = getTemplate(templateKeyFor(category));
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select className="input" id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {children}
      </div>
      {template ? (
        <div>
          <div className="label">Tile design</div>
          <div className="overflow-hidden rounded-2xl border-2 border-stone-900">
            <ObjectTiles id="preview" template={template} tiles={{}} />
          </div>
          <p className="mt-1 text-xs text-stone-500">{tileTotal(template)} sticker spots. Spots marked HERO are the big ones. The rest are medium.</p>
          {hero && <div className="mt-5">{hero}</div>}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rows">Grid rows</label>
            <input className="input" id="rows" name="rows" type="number" min={1} max={8} required defaultValue={3} />
          </div>
          <div>
            <label className="label" htmlFor="cols">Grid columns</label>
            <input className="input" id="cols" name="cols" type="number" min={1} max={8} required defaultValue={3} />
          </div>
          <p className="-mt-3 text-xs text-stone-500 sm:col-span-2">No set design for this category, so the grid is laid over your photo. Every spot is medium.</p>
        </div>
      )}
    </>
  );
}
