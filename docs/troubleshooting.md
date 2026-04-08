# Troubleshooting

## `Auth.getInstance()` throws not initialized

- Ensure `Auth.initialize(config)` is called exactly once before any auth call.
- Confirm initialization runs before route guards/components that use auth.

## Redirect loop to login

- Check `LOGIN_PAGE_URL` and `LAUNCHPAD_PAGE_URL` are valid absolute URLs.
- Confirm refresh token is persisted and readable (`refresh` key).
- Verify backend refresh endpoint returns `access` on success.

## `verifyToken()` keeps failing

- Validate `AUTH_BASE_URL` and endpoint paths.
- Confirm token/refresh formats expected by backend.
- Check CORS and cookie settings for browser usage.

## Cookies not persisted in browser

- Confirm `COOKIE_SECURE` matches HTTPS deployment.
- Ensure cookie `domain` is valid for the current host.
- Check browser policies around `SameSite=None` + secure cookies.

## Native storage issues

- Set `NATIVE_PLATFORM: true`.
- Confirm AsyncStorage is linked/available in your React Native runtime.

## Debug Checklist

1. Inspect token and refresh presence.
2. Verify endpoint responses (status + body).
3. Validate redirect callback overrides (`ON_LOGIN`, `ON_LOGOUT`).
4. Reproduce with minimal config from `docs/configuration.md`.
