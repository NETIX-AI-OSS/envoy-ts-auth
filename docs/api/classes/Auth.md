[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / Auth

# Class: Auth

Defined in: [src/index.ts:160](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L160)

Singleton class for authentication and authorization utilities — call [Auth.initialize](#initialize) once, then [Auth.getInstance](#getinstance) for all methods.

## Methods

### allCookies()

> **allCookies**(): `Record`\<`string`, `string`\>

Defined in: [src/index.ts:267](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L267)

Returns all cookies as an object. Not available on native platforms.

#### Returns

`Record`\<`string`, `string`\>

Object of cookie key-value pairs or message if unavailable.

***

### clearCookies()

> **clearCookies**(): `Promise`\<`void`\>

Defined in: [src/index.ts:346](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L346)

Clears authentication cookies or AsyncStorage tokens.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### getGroups()

> **getGroups**(): `Promise`\<`string`[] \| `undefined`\>

Defined in: [src/index.ts:526](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L526)

Gets the groups for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of group names or empty array.

#### Throws

If the Auth config is unavailable.

***

### getKeyValue()

> **getKeyValue**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [src/index.ts:313](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L313)

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

Defined in: [src/index.ts:473](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L473)

Gets the permissions for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of permissions or empty array.

#### Throws

If the Auth config is unavailable.

***

### getToken()

> **getToken**(): `Promise`\<`string` \| `null`\>

Defined in: [src/index.ts:547](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L547)

Gets the current access token from storage or API.

#### Returns

`Promise`\<`string` \| `null`\>

The access token string or null.

#### Throws

If the Auth config is unavailable.

***

### getUser()

> **getUser**(): `Promise`\<`any`\>

Defined in: [src/index.ts:417](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L417)

Gets the current user from the API or cache; only a 401 triggers the login redirect, other failures (403/429/5xx) resolve to `null`.

#### Returns

`Promise`\<`any`\>

The user object or null if not found.

#### Throws

If the Auth config is unavailable.

***

### hasAllPermissions()

> **hasAllPermissions**(`codenames`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:516](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L516)

Whether the current user holds ALL of the given permission codenames.

#### Parameters

##### codenames

readonly `string`[]

#### Returns

`Promise`\<`boolean`\>

***

### hasAnyPermission()

> **hasAnyPermission**(`codenames`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:508](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L508)

Whether the current user holds ANY of the given permission codenames.

#### Parameters

##### codenames

readonly `string`[]

#### Returns

`Promise`\<`boolean`\>

***

### hasPermission()

> **hasPermission**(`codename`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:500](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L500)

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

Defined in: [src/index.ts:291](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L291)

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

Defined in: [src/index.ts:853](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L853)

Checks if logged in; on web, a valid token also triggers a redirect to `continue` or `LAUNCHPAD_PAGE_URL` (side-effect, for login/guard pages).

#### Returns

`Promise`\<`boolean`\>

True if logged in, false otherwise.

#### Throws

If unable to check login status.

***

### login()

> **login**(`username`, `password`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [src/index.ts:793](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L793)

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

Defined in: [src/index.ts:770](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L770)

Logs out the user: clears local storage, best-effort revokes the server session, then redirects to login.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

***

### redirectToLoginPage()

> **redirectToLoginPage**(): `void`

Defined in: [src/index.ts:369](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L369)

Redirects the user to the login page or calls ON_LOGOUT callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

***

### redirectToSourcePage()

> **redirectToSourcePage**(): `void`

Defined in: [src/index.ts:397](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L397)

Redirects the user to the source page or calls ON_LOGIN callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

***

### reviveToken()

> **reviveToken**(): `Promise`\<`any`\>

Defined in: [src/index.ts:602](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L602)

Attempts to revive the access token using the refresh token.

#### Returns

`Promise`\<`any`\>

The new access token or error status/message.

#### Throws

If the Auth config is unavailable.

***

### setKeyValue()

> **setKeyValue**(`data`): `Promise`\<`void`\>

Defined in: [src/index.ts:328](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L328)

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

Defined in: [src/index.ts:694](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L694)

Verifies the current access token, revives if needed.

#### Returns

`Promise`\<\{ `message`: `string`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `number`; \}\>

Status object indicating result.

#### Throws

If the Auth config is unavailable.

***

### getInstance()

> `static` **getInstance**(): `Auth`

Defined in: [src/index.ts:193](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L193)

Returns the singleton Auth instance.

#### Returns

`Auth`

The Auth instance.

#### Throws

If Auth is not initialized.

***

### initialize()

> `static` **initialize**(`config`): `void`

Defined in: [src/index.ts:179](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L179)

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

Defined in: [src/index.ts:201](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L201)

Resets the Auth singleton so it can be re-initialized (for tests/reconfiguration).

#### Returns

`void`
