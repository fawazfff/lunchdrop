# LunchDrop

**Send someone lunch with one link.**

LunchDrop is a social gifting prototype built around Blackbird and Flynet. A sender chooses a real FLY-enabled Blackbird restaurant, adds a note and gift amount, then shares a secure LunchDrop link with the recipient.

The recipient can open the gift without creating an account, keep the sender's restaurant recommendation or browse other FLY-ready Blackbird locations, and optionally connect Blackbird to try the connected test FLY reward flow.

Live app: https://lunchdrop.vercel.app

## Product flow

1. Sender opens LunchDrop.
2. LunchDrop loads live restaurant/location data from Flynet.
3. Sender chooses a restaurant recommendation, FLY amount, note, and link expiry.
4. LunchDrop creates a compact HMAC-signed claim URL.
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

## Secure claim links

New claim URLs use:

`/c/<compact-signed-token>`

The token contains only the data needed to open the gift and is protected with an HMAC signature. Modified or expired links are rejected.

Older `/claim?t=...` links remain supported for compatibility.

Current non-database limitation: the claim payload itself is still carried in the signed link. The next database upgrade will replace this with a short server-side claim code.

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
- Secure compact claim links
- Recipient restaurant choice
- Optional Blackbird member connection
- Test-without-sign-in recipient flow
- Native share sheet
- WhatsApp, Telegram, Messages, and copy-link sharing
- Draft recovery after refresh
- Same-browser demo status tracking
- Claim receipt
- Integration health/status page
- Sound, motion, haptics where supported, branded loading states, and reduced-motion support
- Installable web-app manifest
- Private/noindex claim pages
- Security/privacy response headers

## What is waiting for the database

The next phase will use a dedicated Supabase database for:

- truly short claim codes such as `/c/X7K4P9`
- cross-device Created → Opened → Claimed status
- one-time server-enforced claims
- persistent sender receipts
- cancellation before claim
- server-side claim history
- real analytics/event tracking
- stronger abuse/rate-limit controls
- cross-device recipient restaurant choice

These are intentionally not faked in the current prototype.

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
