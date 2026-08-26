# BFF migration without interrupting one-point login

Upgrading `envoy-ts-auth` does not change an existing browser application's
login behavior. `Auth` defaults to `legacy-shared-cookie` until that application
explicitly selects `BROWSER_SESSION_MODE: "bff-only"`.

## Browser API

```ts
const auth = new BffAuth({
  baseUrl: "/bff/auth",
  getCsrfToken,
});

const session = await auth.bootstrap<User>();
if (!session.authenticated) {
  auth.startAuthorizationCodeLogin();
}
```

`startAuthorizationCodeLogin(returnTo?)` accepts only a same-origin target and
navigates to:

```text
GET /bff/auth/oauth/authorize?return_to=/current/path
```

The BFF redirects to the central identity provider. A user who already has a
central login session returns without entering credentials again. The identity
provider redirects to the URL returned by `getOAuthCallbackUrl()`:

```text
GET /bff/auth/oauth/callback?code=...&state=...
```

The callback is a server endpoint. Application JavaScript must not exchange the
code or receive access and refresh tokens.

## Required BFF contract

The application BFF must provide these same-origin endpoints:

| Endpoint | Required behavior |
| --- | --- |
| `GET /oauth/authorize` | Validate `return_to`; create high-entropy `state` and a PKCE verifier; retain them in a short-lived, encrypted or server-side transaction; redirect with an S256 challenge. |
| `GET /oauth/callback` | Validate state and transaction expiry; exchange the code and verifier server-side; rotate the transaction; create the application session; redirect to the saved path. |
| `GET /session` | Return 2xx only for a valid application session and otherwise 401. |
| `GET /me` | Return the current user for a valid session and otherwise 401. Never return tokens. |
| `POST /logout` | Require CSRF; revoke/expire the application session; coordinate central logout when product policy requires it. |
| Proxied APIs | Read the server-side session, attach the access token upstream, and never return it to the browser. |

Session cookies must be host-only, `HttpOnly`, `Secure`, and at least
`SameSite=Lax`. Unsafe requests require CSRF validation. The BFF must reject
absolute or cross-origin return targets to avoid an open redirect. The SDK also
rejects them as defense in depth.

## Safe rollout

1. Deploy the per-application OAuth client, callback, BFF transaction/session
   store, and proxy routes while the app remains in legacy mode.
2. Exercise `bootstrap`, silent one-point login, refresh, logout, CSRF, and API
   proxying in stage. Keep the existing shared cookie available for rollback.
3. Move the application UI and API calls to `BffAuth`. Leave
   `BROWSER_SESSION_MODE` unset during the observation window.
4. Set `BROWSER_SESSION_MODE: "bff-only"` for that application only. This is the
   explicit security cutover; it makes accidental legacy `Auth` use fail fast.
5. After every application is cut over, expire the parent-domain token cookies
   centrally and remove the deprecated `ALLOW_INSECURE_BROWSER_TOKEN_STORAGE`
   setting.

Rollback is application-local until step 5: revert its UI/proxy routing and
unset `BROWSER_SESSION_MODE`. Do not remove or rotate the shared-cookie path for
all applications in the same deployment as the first BFF cutover.
