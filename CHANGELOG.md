# Changelog

## [2.0.3] — 2026-09-16

- Synchronize the canonical platform permission catalog, including organization configuration,
  AI settings management, and explicit unrestricted asset scope.
- Redirect expired sessions to login, retain credentials on transient authentication failures,
  and deduplicate involuntary redirects.
- Rebuild the distributed JavaScript and TypeScript declarations for these fixes.

## [2.0.2] — 2026-09-15

- cookies (fixed): `COOKIE_SECURE: false` now writes `SameSite=Lax` session cookies without
  `Secure`, and removes them with the same attributes. Every cookie used to be stamped
  `SameSite=None`, which browsers accept only together with `Secure` — and store `Secure` cookies
  only in a secure context — so a dev server opened over plain http at a LAN or VM address
  (`http://10.0.0.1:3003`) could never persist a session: sign-in succeeded and the prompt came
  straight back. `COOKIE_SECURE: true` is unchanged (`Secure; SameSite=None`).

## [2.0.1] — 2026-09-04

- locale (fixed): endpoints resolve relative to `apiBaseUrl`, so a base URL that carries a path
  prefix (e.g. a dev proxy's `/user-api`) is preserved instead of being discarded against the
  origin. Endpoint defaults are now relative with trailing slashes; `LocaleRuntime.url()` strips a
  leading slash (tolerating overrides) and guarantees a trailing slash, since a missing one hits
  the backend's `APPEND_SLASH` 301 and a redirect can drop the `Authorization` header.
  Absolute-origin bases resolve identically.


## [2.0.0] — 2026-08-26

- Added the same-origin `BffAuth` browser client with credentialed requests and CSRF headers.
- Existing browser shared-cookie sessions remain the migration default so upgrades preserve one-point login; applications disable browser token APIs explicitly with `BROWSER_SESSION_MODE: "bff-only"` after their BFF cutover.
- Marked the browser boundary as server-managed, host-only HttpOnly sessions.

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `LocaleRuntimeConfig.fallbackLanguage` (default `"en"`) -- the locale a read
  path serves when it is handed an unparseable language code. Set it to the
  deployment's own default so a misconfigured organization degrades to its own
  language rather than to English. An unparseable value here throws at
  construction.
- `LocaleRuntimeConfig.onInvalidLanguage(language, fallback)` -- called once per
  distinct bad code a read path receives, defaulting to `console.warn`. Route it
  to your error tracker: now that the read paths no longer throw, this is the
  only signal that identifies the caller supplying the bad value.

### Fixed

- session expiry now redirects to login instead of rendering as missing permissions. When the
  refresh cookie aged out of the browser, `reviveToken()` cleared the session without
  redirecting, `getUser()` then answered `null` with no request at all, and consuming apps read
  the resulting `undefined` permissions as a "No Permission" page. No 401 could ever arrive, so
  neither this library's nor the apps' 401 redirect paths were reachable on the most common
  expiry path. A missing refresh cookie, an empty one, and a `404` from the refresh endpoint are
  now terminal alongside `401`/`403`: they clear the session and redirect.

### Changed

- transient auth failures no longer destroy the session. A `429`/`5xx` from the refresh or verify
  endpoint, or a network error, used to call `clearCookies()` — discarding a refresh token still
  valid for up to 48h because the auth service had a bad minute. Those paths now keep every
  credential and return the status for the caller to surface or retry. Only a credential the
  server actually rejected is cleared.
- `redirectToLoginPage()` is a no-op once a redirect is under way, so concurrent `getToken()` /
  `getUser()` callers produce one navigation (or one `ON_LOGOUT` call) rather than one each, and
  a no-op when `LOGIN_PAGE_URL` is the page already showing (same origin and path), so a login
  app that points `LOGIN_PAGE_URL` at itself cannot bounce against its own URL. The flag
  de-duplicates involuntary redirects only: `login()` and `logout()` re-arm it, so an explicit
  `logout()` always redirects even when an expiry redirect already fired. That matters under
  `ON_LOGOUT`, which runs without navigating and so leaves the instance alive.
- `verifyToken()` with an empty access-token cookie next to a live refresh token now revives
  instead of clearing both.
- the refresh write path no longer falls back to a hardcoded `"300"` for the access-token cookie
  TTL. It reads `COOKIE_TOKEN_TTL` exactly as the login write path always has, so a rotated token
  can no longer be re-pinned to 5 minutes while the same token from login carries the configured
  lifetime. Set both TTLs to the lifetimes the backend issues.
- `LocaleRuntime` read paths (`hydrate`, `refreshEffective`,
  `fetchAnonymousEffective`) no longer throw on an unparseable language code.
  They report once per distinct bad value and serve `fallbackLanguage`, so a
  misconfigured i18n bridge can no longer break rendering or flood error
  trackers. `setPreferredLanguage` remains strict: a bad code still cannot
  overwrite a stored preference.
- The reported-value set is per-runtime and capped at 32 entries, so a caller
  emitting high-cardinality garbage cannot grow it without bound.

## [1.5.0] — 2026-08-22

### Added

- Framework-neutral `LocaleRuntime` with typed effective-locale payloads,
  browser and React Native storage adapters, bounded identity-scoped caching,
  ETag revalidation, offline preference reconciliation, and universal-login
  locale-context support.

## [1.4.0] — 2026-08-18

### Added

- Optional `LOGOUT_ENDPOINT` integration for best-effort access/refresh token
  revocation before redirecting from logout or replacing an account session.

### Security

- Token verification and refresh failures now fail closed: stale access and
  refresh credentials, cached users, and cached permissions are invalidated.
- In-memory tokens are compared with persistent storage before reuse so a
  logout or account change in another tab cannot retain the previous subject.
- Successful login and token rotation invalidate user/permission caches.

## [1.4.13] — OSS Public Release Prep

### Added
- OSS-focused README with Mermaid diagrams (auth state model, token workflow, storage strategy).
- Developer documentation under `docs/`: architecture, configuration, getting-started, troubleshooting, workflows.
- Governance files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- `docs/release-checklist.md` for release execution.
- GitHub issue templates (bug report, feature request) and pull request template.
- Vitest test suite (`src/__tests__/auth.test.ts`) with jsdom environment.
- GitHub Actions CI workflow (build + test on push/PR to `main`).
- `Auth.reset()` static method for test teardown and re-initialization.

### Changed
- License migrated to AGPL-3.0-only.
- `@types/node` moved from `dependencies` to `devDependencies`.
- `package.json` now declares `types` and `files` fields for correct TypeScript resolution and install footprint.
- Removed non-standard `include`/`exclude` fields from `package.json`.
- Removed unused `start` script.
- `ON_LOGIN` and `ON_LOGOUT` callback types narrowed from `Function` to `() => void`.
- Permissions and groups return types corrected from boxed `String[]` to `string[]`.
- Removed debug `console.log` calls from `getToken()` and `getUser()`.
- `isLoggedIn()` now documents its redirect side-effect in JSDoc.
