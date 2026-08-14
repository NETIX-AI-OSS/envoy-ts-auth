[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / Auth

# Class: Auth

Defined in: [src/index.ts:204](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L204)

Singleton class for authentication and authorization utilities.

Provides methods for token management, user info, login/logout, and redirection.

Usage:
  1. Call [Auth.initialize](#initialize) once with your config.
  2. Use [Auth.getInstance](#getinstance) to access all methods.

## Example

```ts
Auth.initialize(config);
  const auth = Auth.getInstance();
  const user = await auth.getUser();
```

## Methods

### allCookies()

> **allCookies**(): `Record`\<`string`, `string`\>

Defined in: [src/index.ts:323](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L323)

Returns all cookies as an object. Not available on native platforms.

#### Returns

`Record`\<`string`, `string`\>

Object of cookie key-value pairs or message if unavailable.

***

### clearCookies()

> **clearCookies**(): `Promise`\<`void`\>

Defined in: [src/index.ts:402](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L402)

Clears authentication cookies or AsyncStorage tokens.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### getGroups()

> **getGroups**(): `Promise`\<`string`[] \| `undefined`\>

Defined in: [src/index.ts:597](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L597)

Gets the groups for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of group names or empty array.

#### Throws

If the Auth config is unavailable.

***

### getKeyValue()

> **getKeyValue**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [src/index.ts:369](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L369)

Gets the value for a key from storage (cookie or AsyncStorage).

#### Parameters

##### key

`string`

The key to retrieve.

#### Returns

`Promise`\<`string` \| `null`\>

The value or null if not found.

#### Throws

If the Auth config is unavailable.

***

### getPermissions()

> **getPermissions**(): `Promise`\<`string`[] \| `undefined`\>

Defined in: [src/index.ts:539](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L539)

Gets the permissions for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of permissions or empty array.

#### Throws

If the Auth config is unavailable.

***

### getToken()

> **getToken**(): `Promise`\<`string` \| `null`\>

Defined in: [src/index.ts:618](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L618)

Gets the current access token from storage or API.

#### Returns

`Promise`\<`string` \| `null`\>

The access token string or null.

#### Throws

If the Auth config is unavailable.

***

### getUser()

> **getUser**(): `Promise`\<`any`\>

Defined in: [src/index.ts:480](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L480)

Gets the current user from the API or cache.

Only a 401 (session problem) triggers the login redirect. Any other
failure — 403 from a fail-closed permission gate, 429, 5xx — resolves to
`null` so callers can surface an in-app error/no-permission state instead
of bouncing a logged-in user to the login page (which would loop straight
back while the session is still valid).

#### Returns

`Promise`\<`any`\>

The user object or null if not found.

#### Throws

If the Auth config is unavailable.

***

### hasAllPermissions()

> **hasAllPermissions**(`codenames`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:587](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L587)

Whether the current user holds ALL of the given permission codenames.

#### Parameters

##### codenames

readonly `string`[]

#### Returns

`Promise`\<`boolean`\>

***

### hasAnyPermission()

> **hasAnyPermission**(`codenames`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:579](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L579)

Whether the current user holds ANY of the given permission codenames.

#### Parameters

##### codenames

readonly `string`[]

#### Returns

`Promise`\<`boolean`\>

***

### hasPermission()

> **hasPermission**(`codename`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:571](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L571)

Whether the current user holds the given permission codename.

#### Parameters

##### codename

`string`

Canonical bare permission codename (e.g. "gateway-config-apply").

#### Returns

`Promise`\<`boolean`\>

***

### isKeyPresent()

> **isKeyPresent**(`key`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:347](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L347)

Checks whether a given key is present in the storage (cookie or AsyncStorage).

#### Parameters

##### key

`string`

The key to check for presence.

#### Returns

`Promise`\<`boolean`\>

A promise that resolves to `true` if the key is present, otherwise `false`.

#### Throws

If the Auth config is unavailable.

***

### isLoggedIn()

> **isLoggedIn**(): `Promise`\<`boolean`\>

Defined in: [src/index.ts:935](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L935)

Checks if the user is logged in (token present and valid).

**Side-effect**: On web platforms, if a valid token is found, the user is
automatically redirected to the `continue` query-param URL or the configured
`LAUNCHPAD_PAGE_URL`. Designed for use on login/guard pages where an already-
authenticated user should be bounced away immediately.

#### Returns

`Promise`\<`boolean`\>

True if logged in, false otherwise.

#### Throws

If unable to check login status.

***

### login()

> **login**(`username`, `password`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [src/index.ts:868](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L868)

Logs in the user with username and password.

#### Parameters

##### username

`string`

The username.

##### password

`string`

The password.

#### Returns

`Promise`\<`boolean` \| `undefined`\>

True if login successful, false otherwise.

#### Throws

If the Auth config is unavailable.

***

### logout()

> **logout**(): `Promise`\<`void`\>

Defined in: [src/index.ts:844](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L844)

Logs out the user by optionally revoking the server-side session, clearing
local storage, and redirecting to login.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### redirectToLoginPage()

> **redirectToLoginPage**(): `void`

Defined in: [src/index.ts:425](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L425)

Redirects the user to the login page or calls ON_LOGOUT callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

***

### redirectToSourcePage()

> **redirectToSourcePage**(): `void`

Defined in: [src/index.ts:453](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L453)

Redirects the user to the source page or calls ON_LOGIN callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

***

### reviveToken()

> **reviveToken**(): `Promise`\<`any`\>

Defined in: [src/index.ts:674](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L674)

Attempts to revive the access token using the refresh token.

#### Returns

`Promise`\<`any`\>

The new access token or error status/message.

#### Throws

If the Auth config is unavailable.

***

### setKeyValue()

> **setKeyValue**(`data`): `Promise`\<`void`\>

Defined in: [src/index.ts:384](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L384)

Sets a key-value pair in storage (cookie or AsyncStorage).

#### Parameters

##### data

[`KeyVal`](../type-aliases/KeyVal.md)

The key, value, and optional maxAge.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### verifyToken()

> **verifyToken**(): `Promise`\<\{ `message`: `string`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `number`; \}\>

Defined in: [src/index.ts:767](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L767)

Verifies the current access token, revives if needed.

#### Returns

`Promise`\<\{ `message`: `string`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `number`; \}\>

Status object indicating result.

#### Throws

If the Auth config is unavailable.

***

### getInstance()

> `static` **getInstance**(): `Auth`

Defined in: [src/index.ts:238](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L238)

Returns the singleton Auth instance.

#### Returns

`Auth`

The Auth instance.

#### Throws

If Auth is not initialized.

***

### initialize()

> `static` **initialize**(`config`): `void`

Defined in: [src/index.ts:224](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L224)

Initializes the Auth singleton with the given configuration.
Must be called before using any Auth methods.

#### Parameters

##### config

[`AuthConfig`](../type-aliases/AuthConfig.md)

The authentication configuration object.

#### Returns

`void`

#### Throws

If already initialized or config is invalid.

***

### reset()

> `static` **reset**(): `void`

Defined in: [src/index.ts:249](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L249)

Resets the Auth singleton, allowing re-initialization.
Intended for use in tests and environments that require reconfiguration.

#### Returns

`void`
