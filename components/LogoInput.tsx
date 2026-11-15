"use client";
import { useEffect, useRef, useState } from "react";

/** Logo picker. Shows the chosen file on the highlighted spot (the element with id "logo-preview") and beside the field. */
export default function LogoInput() {
  const [url, setUrl] = useState<string | null>(null);
  const last = useRef<string | null>(null);
  useEffect(() => {
    const el = document.getElementById("logo-preview");
    if (el) {
      if (url) {
        el.setAttribute(el instanceof SVGElement ? "href" : "src", url);
        el.removeAttribute("hidden");
      } else {
        el.removeAttribute(el instanceof SVGElement ? "href" : "src");
        if (!(el instanceof SVGElement)) el.setAttribute("hidden", "");
      }
    }
    if (last.current) URL.revokeObjectURL(last.current);
    last.current = url;
  }, [url]);
  return (
    <div>
      <label className="label" htmlFor="logo">Logo</label>
      <div className="flex items-center gap-3">
        <input
          className="input"
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            setUrl(f ? URL.createObjectURL(f) : null);
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="Your logo" className="logo-thumb mt-1.5 !h-12 !w-12" />}
      </div>
      <p className="mt-1 text-xs text-stone-600">{url ? "Your logo is now shown on the spot you picked." : "PNG or SVG with a transparent background prints best. Under 4 MB."}</p>
    </div>
  );
}
