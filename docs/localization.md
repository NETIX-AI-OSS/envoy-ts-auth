# Organization Locale Runtime

`LocaleRuntime` fetches and persists organization terminology without choosing
an i18n framework. Applications pass the returned `translations` object to
i18next, React Intl, or their own renderer.

## Browser setup

```ts
import {
  Auth,
  LocaleRuntime,
  createBrowserLocaleStorage,
} from "envoy-ts-auth";

const auth = Auth.getInstance();
const locales = new LocaleRuntime({
  apiBaseUrl: "https://users.example.com",
  application: "cafm-v2-ui",
  storage: createBrowserLocaleStorage(),
  getAccessToken: () => auth.getToken(),
});

const identity = { userId: user.id, organizationId: user.organization.id };
const cached = await locales.hydrate(identity, user.preferred_language);
if (cached) applyTranslations(cached.locale.translations);

const refreshed = await locales.refreshEffective(
  identity,
  user.preferred_language,
);
applyTranslations(refreshed.locale.translations);
```

`refreshEffective` checks `/healthz/`, reconciles a pending language choice,
then requests the effective locale using the access-token provider. It sends a
stored ETag through `If-None-Match`; a `304`, failed health check, or transient
fetch failure retains an exact matching cache. Concurrent identical refreshes
share one request.

## React Native setup

Pass AsyncStorage explicitly so this module remains independent of React Native:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LocaleRuntime,
  createAsyncStorageLocaleStorage,
} from "envoy-ts-auth";

const locales = new LocaleRuntime({
  apiBaseUrl: config.AUTH_BASE_URL,
  application: "technician-app",
  storage: createAsyncStorageLocaleStorage(AsyncStorage),
  getAccessToken: () => auth.getToken(),
});
```

Applications should call `refreshEffective` from their existing AppState and
connectivity recovery flow. The runtime does not subscribe to platform events.

## Language preferences

`setPreferredLanguage(identity, language)` persists the latest choice before
attempting `PATCH /auth/me/language/`. It returns `false` while the choice is
pending. Call `reconcilePendingLanguage(identity)` after connectivity returns;
only the latest pending value is sent. If the runtime has an active catalog
for another identity, it keeps the offline choice pending for the original
identity. Both preference methods can be used without selecting a catalog.

## Session isolation

Every cache entry includes API origin, application, user, organization, and
requested language. The envelope repeats these fields and is validated before
use. Invalid or corrupt records are deleted.

- Call `setActiveIdentity(identity)` after `/auth/me/` resolves or the active
  organization changes.
- Call `notifyTokenChanged()` when replacing the access token, before the
  token provider returns the new credential to this runtime. This discards the
  previous identity's in-flight request state.
- Call `handleLogout(identity)` during logout. It invalidates authenticated
  requests immediately, then removes that identity's locale and pending
  preference from storage.

If a NETIX access token has the platform's `token_type`, `auth_version`,
`user_id`, and `organization_id` claims, the runtime checks that its user and
organization match the request before sending an authenticated GET or PATCH.
The check only rejects mismatches. The backend authenticates the bearer.
Opaque tokens and tokens with incomplete or unrecognized claims use the
session notifications above for scope changes.

The cache keeps eight entries by default. Set `maxCacheEntries` to another
positive integer where device constraints require a smaller bound.

## Universal login

`fetchAnonymousEffective(language, localeContextToken)` calls the anonymous
locale endpoint. The opaque context is sent only in `X-Locale-Context`, never
in the URL or persistent storage. The application identifier should be
`universal-login`; authentication and tenant discovery remain backend concerns.

## Failure behavior

- A cache is used only for an exact identity, organization, application, API
  origin, and language match.
- No cache plus an unhealthy backend or failed request rejects, allowing the
  application to retain its bundled catalog.
- Invalid API payloads reject and are never persisted.
- Locale values are data; consuming renderers must treat them as text and must
  not enable raw HTML interpolation.
