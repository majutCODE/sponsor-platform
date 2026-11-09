# TileSponsor

Verified creators list physical objects (car, kit, guitar, dress). Each object has sticker spots, medium and hero. Brands bid on spots while the listing's timer runs. The highest bid on each spot wins, the creator confirms the brands, and the platform prints and posts the stickers. The creator uploads proof photos on a schedule; an admin verifies them and marks the payout paid. The platform keeps 15%.

## Flow
1. `/creators/apply` creator applies. Gets a private creator link `/c/[id]?t=...`. Admin verifies at `/admin`.
2. `/list/new?c=...&t=...` verified creator lists an object: opening bids, deal length (event, 1, 3, 6 months), launch date, timer end.
3. `/l/[id]` brands bid on spots while the timer runs (test mode, no card held).
4. `/l/[id]/manage?t=...` creator declines unwanted brands, confirms winners after the timer, then uploads proof photos.
5. `/admin` verify creators, approve proofs, mark payouts paid, add strikes (three removes a creator).

## Data
Write-once JSON files in Vercel Blob (`.data/` locally): `creators/`, `listings/`, `bids/`. State is derived from events in `lib/data.ts`.

## Next
- Stripe: payment hold in `placeBid` (`app/actions.ts`), capture on `confirmWinners`, Stripe Connect for payouts.
- Email notifications (outbid, timer ended, proof due).
