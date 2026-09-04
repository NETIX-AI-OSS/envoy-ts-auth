# Changelog

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

### Changed

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
