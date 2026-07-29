# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The consumer-facing PWA for Hoopla — the customer's front door. Customers browse partner coffee
shops on a map, order + pay, earn/spend cashback, redeem gift cards and promocodes, and track
order pickup. It also runs embedded as a **Telegram Mini App** (see `src/helpers/telegram.ts`).
It talks to exactly one backend, **hoopla-api**, at `VITE_API_URL` (prod:
`https://api.hoopla.uz/api/v1`). It never touches the shared `qahvazor` DB directly and has no
knowledge of the other 9 repos in the workspace.

## Commands

```bash
npm install       # package-lock.json committed
npm run dev       # Vite dev server; set HTTPS=1 to enable vite-plugin-mkcert (local TLS cert)
npm run build     # vite build -> dist/
npm run start     # serve -s dist -p 3000 (what the Docker image runs)
npm run lint      # eslint (flat config: eslint.config.js)
make docker-up / docker-down / docker-rebuild
```

No test suite, no `tsc --noEmit` script (build's `vite build` does not type-check separately —
Vite/esbuild strips types without erroring on them). There is no `hoopla-pos`-style
`typecheck` script here; rely on `npm run lint` + `npm run build` succeeding as the gate.

## Configuration

Env is Vite-style (`import.meta.env`, `.env` at repo root, must be prefixed `VITE_`):

- `VITE_API_URL` — hoopla-api base URL, **includes** the `/api/v1` path segment (domain calls
  append bare paths like `/auth/login`, `/user/cart`).
- `VITE_HOOPLA_TEST_MODE` — `"true"` sends `X-Hoopla-Test: true` on every request, which makes
  hoopla-api reveal `type=test` partners/shops/orders otherwise hidden from real customers. Not
  tied to Vite dev/prod mode — never enable in a build real customers use.
- `VITE_HOST_PLATFORM` — `"eight"` compiles in the Eight/Anor miniapp support; empty (the
  default, in `.env`) is the public build. Must stay **declared** in `.env` even when empty, or
  Vite leaves it a runtime lookup instead of inlining a literal and the miniapp code survives
  minification into the public bundle.

## Two builds, two hosts

Same code, two bundles. `npm run build` → **web.hoopla.uz** (public + Telegram Mini App).
`npm run build:anor` (`vite build --mode anor`, loads `.env.anor`) → **anor.hoopla.uz**, the
Eight miniapp embedded in Anor Bank's app. `docker-compose.yml` builds both (`BUILD_MODE` arg,
ports 3013 and 3014); `deploy/nginx/anor.hoopla.conf` is the vhost for the second.

Everything host-specific lives behind `IS_EIGHT_BUILD` in **`src/helpers/eight.ts`**: the
launch-token capture, `isEightHost()`, and the native payment bridge. This is a **security
boundary, not a convenience** — an Eight session token arrives as a URL query param, and code
that accepts a session token off the URL must not exist on a host anyone can send a link to.
Verified by grepping the built bundles: `start_payment`/`nativeBridge` appear 0× in the public
build and `captureEightLaunch` compiles down to `return false`.

In the Eight build: auth is access-token-only (no refresh token, so `hydrateTokens` treats a
lone access token as signed in), 412 tells the customer to relaunch instead of opening the SMS
drawer (the guard lives in `openLoginModal`, so `ProtectedRoute` can't route around it), the
Profile log-out button is hidden (signing out of a host session leaves no way back), and
checkout's 402 carries `bridge_order_id` → `nativeBridge.postMessage("start_payment")` →
`/orders/:id/awaiting-payment`, which polls `/user/orders/:id/payment-status`. Note the app uses
a **HashRouter**, so cross-page jumps outside react-router must set `window.location.hash`, not
`assign()` a path.

`vite.config.ts` also bakes `package.json`'s `version` into `__APP_VERSION__` at build time; this
is the sole source of the `appVersion` reported on login device registration
(`src/helpers/device.ts`) — bump `package.json` version to change what shows in `/user/devices`.

## Architecture

Vite + React 18 + TypeScript, no framework router beyond `react-router-dom` v6. Path alias `@` →
`src/`.

- **`src/api/domains/*.ts`** — one file per backend resource (`auth`, `orders`, `cart`,
  `gift-cards`, `payment`, `shops`, `banners`, `categories`, `stories`, `subscription`,
  `notifications`, `devices`), each exporting a plain `*Api` object of async functions built on
  the shared `httpClient`. **`src/api/hooks/*.hook.tsx`** wraps those in TanStack Query
  (`useQuery`/`useMutation`) — this is the only place server state should live; don't mirror API
  responses into component state or a store.
- **`src/api/http-client.tsx`** — the axios instance and its interceptors; see Integration
  contracts below.
- **`src/context/`** — global React context, not server state: `auth.context.tsx` (session +
  login-modal/edit-profile-drawer orchestration), `protected.context.tsx` (`ProtectedRoute`:
  gates a page behind a sign-in drawer, auto-opened once, rather than redirecting to `/login`),
  `search.context.tsx`.
- **`src/navigation/routes.tsx`** — flat route table consumed by whatever renders `<Routes>`;
  routes needing auth set `protected: true` and are wrapped in `ProtectedRoute`.
- **`src/pages/<Feature>/*.page.tsx`** — one directory per screen (Home, Map, Cart, Orders,
  ShopDetail, PartnerDetail, Profile, Devices, Notifications, Login, static Privacy/Terms).
- **`src/components/ui/`** — shadcn/ui (Radix + Tailwind + CVA) primitives; `src/components/func/`
  — app-specific composed components (e.g. `LoadingScreen`).
- **`src/helpers/token-storage.ts`** and **`src/helpers/telegram.ts`** — see gotchas below.

## Integration contracts with hoopla-api (verified from code)

- **Auth is Bearer**, token read synchronously per-request from `token-storage` (not cookies —
  unlike dashboard-api/vendor). Login flow: `POST /auth/login {phoneNumber}` → SMS →
  `POST /auth/confirm-sms {sessionId, code, ...deviceInfo}` → `data.jwt.{accessToken,
  refreshToken}` (jwt is a nested object, not top-level fields).
- **Token expiry is HTTP 412**, not 401. The response interceptor in `http-client.tsx` catches
  412, calls `PATCH /user/refresh-token?refreshToken=...` with a **bare `axios` instance** (not
  `httpClient`, to skip re-attaching the expired token and the response-envelope extractor —
  tokens are read from `body.data`, not `body`), retries the original request once, and queues
  concurrent 412s behind a single in-flight refresh. A bare 401 is treated as unrecoverable and
  clears tokens immediately (`AUTH_EXPIRED_EVENT` dispatched → `AuthProvider` opens the login
  drawer instead of navigating to a route).
- **`extractorResponseInterceptor`** flattens the `{code, message, data, meta}` envelope onto the
  axios response object itself (`response.data`/`response.meta` become directly accessible) —
  this is why domain files read `response.data` after an `httpClient` call returns what looks
  like a raw axios response.
- **Order creation returns HTTP 402 on success when payment is required**: both
  `OrdersApi.createOrder` (`POST /user/orders/create-rahmat`) and `CartApi.checkout`
  (`POST /user/orders/cart-checkout`) catch the thrown error, check
  `error.data?.checkout_url` / `error.response?.data?.data?.checkout_url`, and treat a present
  `checkout_url` as success (the client shows the Rahmat payment screen). Only a missing
  `checkout_url` is a real failure and gets rethrown.
- **`CartApi.checkout` uses a 35s per-call axios timeout**, not the client's global 10s — checkout
  dispatches to an external billing/POS integration hoopla-api allows up to 30s to answer; a
  10s-timeout retry would abort mid-dispatch and then 404 on retry against an already-consumed
  cart.
- Money in every `*Api` response here is **already in sum** (not tiyin) — hoopla-api divides at
  the response boundary before this client ever sees it; do not divide again.
- Two parallel order models coexist: the legacy single-drink flow
  (`OrdersApi.validateOrder` → `createOrder`) and the newer multi-item cart flow (`CartApi`,
  `/user/cart/*` + `/user/orders/cart-checkout`). Both share `SelectedModifier` /
  `CreateOrderResponse` shapes from `orders.ts`.
- Feedback lives under `GET/POST /orders/feedbacks/{orderId}[/feedback]`, **not**
  `/user/orders/{id}/feedback`.

## Gotchas

- **Telegram WebView localStorage is not durable** — it can be evicted between launches.
  `token-storage.ts` keeps an in-memory cache (so the synchronous axios interceptor never awaits)
  backed by `localStorage` in a plain browser, and additionally by Telegram **CloudStorage**
  (server-synced, needs Bot API 6.9+, gated via `isVersionAtLeast`) when running as a Mini App.
  `hydrateTokens()` must be awaited once at boot before treating the user as signed out — it
  deliberately never pushes local tokens *up* to an empty CloudStorage (can't distinguish
  first-time migration from a store just cleared by logout/401); cloud durability re-establishes
  on the next login/refresh via `setTokens`' write-through.
- **`AuthApi.logout` passes the current device's `refreshToken` as a query param** so only that
  session is revoked; omitting it (old backend behavior) logs out every device on the account.
- Telegram fullscreen/safe-area handling (`telegram.ts`) mirrors Telegram's safe-area insets into
  CSS vars (`--tg-top-inset` etc.) so the fixed header/bottom-nav clear the status bar and
  Telegram's floating controls; fullscreen itself is Bot API 8.0+ and fails silently (no-op) on
  older clients/desktop.
- `routes.tsx` has no not-found/catch-all or nested layout route — check whatever mounts
  `<Routes>` (not itself in this table) if adding a new top-level screen.
- `Dockerfile` is a two-stage build (`node:20` builder → `node:20-slim` + global `serve`) that
  runs `npm run build` then serves static `dist/` on `:3000` — there is no server-side rendering
  or API proxying in this container; `nginx.conf` in the repo root is a separate SPA-serve config,
  not what the Docker image actually uses.
