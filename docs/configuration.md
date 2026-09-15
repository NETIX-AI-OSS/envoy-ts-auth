# Configuration Reference

`Auth.initialize(config)` must be called exactly once before `Auth.getInstance()`.

## Required Fields

- `COOKIE_TOKEN_TTL`: access token TTL in seconds (string). Set it to the access JWT's own
  lifetime — a cookie that outlives the token buys nothing, and one that dies first forces a
  refresh the token did not need.
- `COOKIE_REFRESH_TTL`: refresh token TTL in seconds (string). Set it to the refresh token's
  own lifetime, on the same reasoning.
- `COOKIE_SECURE`: `true` writes `Secure; SameSite=None` session cookies (deployments);
  `false` writes plain `SameSite=Lax` cookies, which any page can store (local development
  over plain http)
- `COOKIE_DOMAIN`: cookie domain
- `BASE_DOMAIN`: base hostname allowed for redirect targets
- `CURRENT_APP_DOMAIN`: current app hostname used when preserving redirects
- `LOGIN_PAGE_URL`: login page URL
- `AUTH_BASE_URL`: auth API base URL
- `LAUNCHPAD_PAGE_URL`: post-login default redirect URL
- `REFRESH_ENDPOINT`: token refresh endpoint path
- `VERIFY_ENDPOINT`: token verify endpoint path
- `TOKEN_ENDPOINT`: login/token endpoint path

## Optional Fields

- `NATIVE_PLATFORM`: use AsyncStorage when true
- `ON_LOGIN`: callback override for login redirect behavior
- `ON_LOGOUT`: callback override for logout redirect behavior
- `LOGOUT_ENDPOINT`: auth API endpoint for best-effort server-side access and
  refresh-token revocation (for example `/auth/logout/`)

## Recommended Defaults

- Keep `COOKIE_SECURE: true` in production. Use `false` for local development over plain http:
  a browser stores a `Secure` cookie only in a secure context, so a dev server opened at a LAN
  or VM address (`http://10.0.0.1:3003`) would otherwise never persist the session.
- Use explicit endpoint paths (for example `/auth/token/verify/`) instead of building strings in app code.
- Ensure `LOGIN_PAGE_URL` and `LAUNCHPAD_PAGE_URL` are absolute URLs.
- Keep `BASE_DOMAIN` and `CURRENT_APP_DOMAIN` as hostnames only, without protocol or path.
- Redirect targets are limited to `BASE_DOMAIN` and single-level subdomains such as `app.example.com`.
- Configure `LOGOUT_ENDPOINT` only after the backend accepts the current access
  token as `Authorization: Bearer ...` and an optional JSON `{ "refresh": "..." }`
  body. Deploy that backend support before enabling the client setting.

## Minimal Example

```ts
const config = {
  COOKIE_TOKEN_TTL: "43200",
  COOKIE_REFRESH_TTL: "172800",
  COOKIE_SECURE: true,
  COOKIE_DOMAIN: ".example.com",
  BASE_DOMAIN: "example.com",
  CURRENT_APP_DOMAIN: "app.example.com",
  LOGIN_PAGE_URL: "https://auth.example.com/login",
  AUTH_BASE_URL: "https://auth.example.com",
  LAUNCHPAD_PAGE_URL: "https://app.example.com",
  REFRESH_ENDPOINT: "/auth/token/refresh/",
  VERIFY_ENDPOINT: "/auth/token/verify/",
  TOKEN_ENDPOINT: "/auth/token/",
  LOGOUT_ENDPOINT: "/auth/logout/",
};
```
