[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / Auth

# Class: Auth

Defined in: src/index.ts:177

Singleton class for authentication and authorization utilities, call [Auth.initialize](#initialize) once, then [Auth.getInstance](#getinstance) for all methods.

## Methods

### allCookies()

> **allCookies**(): `Record`\<`string`, `string`\>

Defined in: src/index.ts:295

Returns all cookies as an object. Not available on native platforms.

#### Returns

`Record`\<`string`, `string`\>

Object of cookie key-value pairs or message if unavailable.

***

### clearCookies()

> **clearCookies**(): `Promise`\<`void`\>

Defined in: src/index.ts:372

Clears authentication cookies or AsyncStorage tokens.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### getGroups()

> **getGroups**(): `Promise`\<`string`[] \| `undefined`\>

Defined in: src/index.ts:548

Gets the groups for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of group names or empty array.

#### Throws

If the Auth config is unavailable.

***

### getKeyValue()

> **getKeyValue**(`key`): `Promise`\<`string` \| `null`\>

Defined in: src/index.ts:341

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

Defined in: src/index.ts:495

Gets the permissions for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of permissions or empty array.

#### Throws

If the Auth config is unavailable.

***

### getToken()

> **getToken**(): `Promise`\<`string` \| `null`\>

Defined in: src/index.ts:569

Gets the current access token from storage or API.

#### Returns

`Promise`\<`string` \| `null`\>

The access token string or null.

#### Throws

If the Auth config is unavailable.

***

### getUser()

> **getUser**(): `Promise`\<`any`\>

Defined in: src/index.ts:440

Gets the current user from the API or cache; only a 401 triggers the login redirect, other failures (403/429/5xx) resolve to `null`.

#### Returns

`Promise`\<`any`\>

The user object or null if not found.

#### Throws

If the Auth config is unavailable.

***

### hasAllPermissions()

> **hasAllPermissions**(`codenames`): `Promise`\<`boolean`\>

Defined in: src/index.ts:538

Whether the current user holds ALL of the given permission codenames.

#### Parameters

##### codenames

readonly `string`[]

#### Returns

`Promise`\<`boolean`\>

***

### hasAnyPermission()

> **hasAnyPermission**(`codenames`): `Promise`\<`boolean`\>

Defined in: src/index.ts:530

Whether the current user holds ANY of the given permission codenames.

#### Parameters

##### codenames

readonly `string`[]

#### Returns

`Promise`\<`boolean`\>

***

### hasPermission()

> **hasPermission**(`codename`): `Promise`\<`boolean`\>

Defined in: src/index.ts:522

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

Defined in: src/index.ts:319

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

Defined in: src/index.ts:888

Checks if logged in; on web, a valid token also triggers a redirect to `continue` or `LAUNCHPAD_PAGE_URL` (side-effect, for login/guard pages).

#### Returns

`Promise`\<`boolean`\>

True if logged in, false otherwise.

#### Throws

If unable to check login status.

***

### login()

> **login**(`username`, `password`): `Promise`\<`boolean` \| `undefined`\>

Defined in: src/index.ts:825

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

Defined in: src/index.ts:800

Logs out the user: clears local storage, best-effort revokes the server session, then always redirects to login, even when an expiry redirect already fired.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### redirectToLoginPage()

> **redirectToLoginPage**(): `void`

Defined in: src/index.ts:387

Redirects the user to the login page or calls ON_LOGOUT callback; a no-op once a redirect is under way, or when the login page is the page already showing.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

***

### redirectToSourcePage()

> **redirectToSourcePage**(): `void`

Defined in: src/index.ts:420

Redirects the user to the source page or calls ON_LOGIN callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

***

### reviveToken()

> **reviveToken**(): `Promise`\<`any`\>

Defined in: src/index.ts:624

Attempts to revive the access token using the refresh token; a missing or rejected refresh token ends the session and redirects, while a server or network failure keeps it for a later attempt.

#### Returns

`Promise`\<`any`\>

The new access token or error status/message.

#### Throws

If the Auth config is unavailable.

***

### setKeyValue()

> **setKeyValue**(`data`): `Promise`\<`void`\>

Defined in: src/index.ts:356

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

Defined in: src/index.ts:719

Verifies the current access token, revives if needed; classifies failures exactly as [Auth.reviveToken](#revivetoken) does.

#### Returns

`Promise`\<\{ `message`: `string`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `number`; \}\>

Status object indicating result.

#### Throws

If the Auth config is unavailable.

***

### getInstance()

> `static` **getInstance**(): `Auth`

Defined in: src/index.ts:217

Returns the singleton Auth instance.

#### Returns

`Auth`

The Auth instance.

#### Throws

If Auth is not initialized.

***

### initialize()

> `static` **initialize**(`config`): `void`

Defined in: src/index.ts:198

Initializes the Auth singleton with the given configuration; must be called before any other Auth method.

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

Defined in: src/index.ts:225

Resets the Auth singleton so it can be re-initialized (for tests/reconfiguration).

#### Returns

`void`
