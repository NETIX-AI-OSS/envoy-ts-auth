# Configuration Reference

`Auth.initialize(config)` must be called exactly once before `Auth.getInstance()`.

## Required Fields

- `COOKIE_TOKEN_TTL`: access token TTL in seconds (string)
- `COOKIE_REFRESH_TTL`: refresh token TTL in seconds (string)
- `COOKIE_SECURE`: cookie secure flag
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

- Keep `COOKIE_SECURE: true` in production.
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
  COOKIE_TOKEN_TTL: "300",
  COOKIE_REFRESH_TTL: "86400",
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
