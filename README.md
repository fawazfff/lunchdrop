# LunchDrop

Send a friend lunch at a real Blackbird restaurant with one link.

LunchDrop uses Flynet's live restaurant and location network to let a sender pick a place, personalize a lunch gift, and create a shareable claim experience.

## Flynet integration

- `app/api/restaurants/route.ts` calls Flynet's authenticated `/locations` route.
- Results are normalized and cached for 30 minutes to avoid polling Flynet.
- Restaurant IDs and location IDs travel with each LunchDrop claim link.
- Blackbird OAuth, wallet lookup, Payment Intents, and reward delivery are the next activation layer after the production callback URL is registered.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Add your server-side Flynet credentials.
3. Run `npm install` and `npm run dev`.

Never commit `.env.local` or expose `FLYNET_API_KEY` to browser code.

## Runtime NYC

Built for the Blackbird — Best Use of Flynet track.
