# TileSponsor

People list physical objects (prom dress, sports car...). Each object is split into a grid of tiles. Brands buy tiles to put their logo on it. Brands pay the platform; the lister uploads a proof photo; an admin approves it before the lister is paid (platform keeps 15%).

## Flow
1. `/list/new` lister uploads a photo, sets grid size and tile price. Gets a private manage link.
2. `/l/[id]` brands click an empty tile, upload a logo and pay (test mode, simulated).
3. `/l/[id]/manage?t=...` lister downloads logos, applies them, uploads proof photo.
4. `/admin` admin approves or rejects proof, then marks the payout as paid.

## Stack
Next.js 15 (App Router, server actions), Tailwind 4, Vercel Blob for images and data (write-once JSON records, no database needed).

## Env vars
- `BLOB_READ_WRITE_TOKEN` set automatically when a Blob store is connected in Vercel. Without it, data is stored in `.data/` locally.
- `ADMIN_PASSWORD` admin login (defaults to `admin` in local dev only).

## Next steps
- Stripe Checkout in `buyTile` (`app/actions.ts`), Stripe Connect for lister payouts.
- Email notifications, refunds when proof is never submitted.
