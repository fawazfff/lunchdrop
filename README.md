# LunchDrop

**Send someone lunch with one link.**

LunchDrop is a social gifting prototype built around Blackbird and Flynet. A sender chooses a real FLY-enabled Blackbird restaurant, adds a note and gift amount, then shares a secure LunchDrop link with the recipient.

The recipient can open the gift without creating an account, keep the sender's restaurant recommendation or browse other FLY-ready Blackbird locations, and optionally connect Blackbird to try the connected test FLY reward flow.

Live app: https://lunchdrop.vercel.app

## Product flow

1. Sender opens LunchDrop.
2. LunchDrop loads live restaurant/location data from Flynet.
3. Sender chooses a restaurant recommendation, FLY amount, note, and link expiry.
4. LunchDrop writes the gift to Supabase and creates a short capability URL such as `/c/X7K4P9`.
5. Recipient opens the gift.
6. Recipient can:
   - test the claim experience without signing in, or
   - optionally connect Blackbird through OAuth + PKCE and attempt the test FLY reward flow.
7. LunchDrop shows a clear receipt and claim status.

Blackbird is deliberately optional for the demo experience. The connected member flow is only used when the recipient wants to try the reward path.

## Flynet + Blackbird integration

### Live discovery

- `app/api/restaurants/route.ts` calls Flynet's authenticated `/locations` endpoint.
- Locations are normalized into the restaurant cards used by the UI.
- Live data is cached for 60 minutes to reduce unnecessary API usage.
- Flynet restaurant specials are loaded through `/specials`.
- Claim pages resolve the recommended venue again from Flynet.

### Blackbird OAuth

- `app/api/auth/blackbird/start/route.ts`
  - OAuth authorization-code flow
  - PKCE challenge/verifier
  - state validation
  - scopes: `read:profile read:wallets`
- `app/api/auth/blackbird/callback/route.ts`
  - exchanges the OAuth code
  - loads the connected Blackbird member through `/users/me`
  - stores only a short-lived member-session marker in an HttpOnly cookie
  - attempts the test reward flow for recipient claims

The homepage also supports an **optional Blackbird connection** so judges can see the member integration without first creating a gift.

### Test FLY reward path

When a recipient chooses the connected flow, LunchDrop attempts to issue the configured test FLY reward using an idempotency key tied to the LunchDrop claim.

The UI distinguishes between:

- **Demo claim:** no Blackbird account required, no FLY moved.
- **Connected claim:** Blackbird member flow + test FLY reward attempt.

LunchDrop does not intentionally present an unverified external result as successful.

## Persistent short claim links

New LunchDrops are stored in the dedicated Supabase database and use short claim codes such as:

`/c/X7K4P9`

The short code is a capability URL. The gift payload stays server-side, so recipient names, notes and restaurant data are no longer carried in the share URL.

The database now persists:

- Created / Opened / Demo claimed / Blackbird claimed / Cancelled state
- expiry
- recipient restaurant choice
- Blackbird reward receipt ID when available
- sender-only status access using a separate secret
- event records for created, opened, restaurant selection, claims and cancellation

Older signed-token claim links remain supported for compatibility.

## Integration status

Visit:

https://lunchdrop.vercel.app/status

The status page deliberately separates:

- **Connected**
- **Configured**
- **Needs verification**
- **Unavailable**

This makes it clear which external paths have actually been tested.

## Current demo features

- Live Flynet restaurant discovery
- FLY-enabled location filtering
- Restaurant search, cuisine, and neighborhood filters
- Live Flynet specials
- 5 / 15 / 30 FLY presets + custom amount
- 24-hour / 3-day / 7-day claim expiry
- Supabase-backed short claim links
- Recipient restaurant choice
- Optional Blackbird member connection
- Test-without-sign-in recipient flow
- Native share sheet
- WhatsApp, Telegram, Messages, and copy-link sharing
- Local QR generation for short claim links, with no third-party QR service
- Private browser sender history with live Supabase status refresh
- Draft recovery after refresh
- Cross-device Created → Opened → Claimed sender status
- Claim receipt
- Integration health/status page
- Sound, motion, haptics where supported, branded loading states, and reduced-motion support
- Installable web-app manifest
- Private/noindex claim pages
- Security/privacy response headers

## Supabase persistence

LunchDrop now uses the dedicated Supabase project for:

- short 7-character claim codes
- cross-device sender status
- server-side claim expiry
- persistent recipient restaurant choice
- cancellation before a connected reward claim
- persistent reward receipt IDs
- server-side event history
- row-level security on the underlying tables

The browser never receives database write credentials. LunchDrop talks to constrained server/RPC paths instead of exposing direct table access.

## Still intentionally not claimed as production-ready

The remaining hardening work is mainly:

- stronger distributed abuse/rate limiting
- a polished QR-code generator for the final short link
- optional authenticated sender accounts/history across different devices
- full end-to-end Blackbird member/reward verification with an eligible test/member account

The connected Blackbird reward path also uses an idempotency key so retries do not intentionally create a second reward.

## Environment variables

Server-side values used by the app:

```bash
FLYNET_API_KEY=
FLYNET_API_BASE=
FLYNET_CLIENT_ID=
FLYNET_CLIENT_SECRET=
FLYNET_AUTH_BASE=
REDIRECT_URI=
CLAIM_SIGNING_SECRET=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Never expose `FLYNET_API_KEY`, the OAuth client secret, or claim-signing secrets to browser code.

## Local development

```bash
npm install
npm run dev
```

Then open:

`http://localhost:3000`

The production Blackbird OAuth redirect URI must match the redirect URI registered with the provider.

## Runtime NYC

Built for the Blackbird / Flynet track at Runtime NYC.


## Abuse protection

LunchDrop now uses a Supabase-backed distributed rate-limit bucket for sensitive public actions such as claim creation, claim opening, status polling, cancellation, recipient restaurant updates, demo claims, and Blackbird OAuth starts. The limiter is enforced server-side and does not expose sender secrets in URLs.
