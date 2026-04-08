[**auth**](../README.md)

---

[auth](../README.md) / Auth

# Class: Auth

Defined in: [src/index.ts:97](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L97)

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

Defined in: [src/index.ts:155](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L155)

Returns all cookies as an object. Not available on native platforms.

#### Returns

`Record`\<`string`, `string`\>

Object of cookie key-value pairs or message if unavailable.

---

### clearCookies()

> **clearCookies**(): `Promise`\<`void`\>

Defined in: [src/index.ts:234](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L234)

Clears authentication cookies or AsyncStorage tokens.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

---

### getGroups()

> **getGroups**(): `Promise`\<`string`[] \| `undefined`\>

Defined in: [src/index.ts:362](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L362)

Gets the groups for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of group names or empty array.

#### Throws

If the Auth config is unavailable.

---

### getKeyValue()

> **getKeyValue**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [src/index.ts:201](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L201)

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

---

### getPermissions()

> **getPermissions**(): `Promise`\<`string`[] \| `undefined`\>

Defined in: [src/index.ts:339](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L339)

Gets the permissions for the current user.

#### Returns

`Promise`\<`string`[] \| `undefined`\>

Array of permissions or empty array.

#### Throws

If the Auth config is unavailable.

---

### getToken()

> **getToken**(): `Promise`\<`string` \| `null`\>

Defined in: [src/index.ts:383](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L383)

Gets the current access token from storage or API.

#### Returns

`Promise`\<`string` \| `null`\>

The access token string or null.

#### Throws

If the Auth config is unavailable.

---

### getUser()

> **getUser**(): `Promise`\<`any`\>

Defined in: [src/index.ts:300](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L300)

Gets the current user from the API or cache.

#### Returns

`Promise`\<`any`\>

The user object or null if not found.

#### Throws

If the Auth config is unavailable.

---

### isKeyPresent()

> **isKeyPresent**(`key`): `Promise`\<`boolean`\>

Defined in: [src/index.ts:179](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L179)

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

---

### isLoggedIn()

> **isLoggedIn**(): `Promise`\<`boolean`\>

Defined in: [src/index.ts:623](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L623)

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

---

### login()

> **login**(`username`, `password`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [src/index.ts:572](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L572)

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

---

### logout()

> **logout**(): `Promise`\<`void`\>

Defined in: [src/index.ts:559](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L559)

Logs out the user by clearing cookies/storage and redirecting to login.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

---

### redirectToLoginPage()

> **redirectToLoginPage**(): `void`

Defined in: [src/index.ts:256](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L256)

Redirects the user to the login page or calls ON_LOGOUT callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

---

### redirectToSourcePage()

> **redirectToSourcePage**(): `void`

Defined in: [src/index.ts:281](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L281)

Redirects the user to the source page or calls ON_LOGIN callback.

#### Returns

`void`

#### Throws

If the Auth config is unavailable.

---

### reviveToken()

> **reviveToken**(): `Promise`\<`any`\>

Defined in: [src/index.ts:423](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L423)

Attempts to revive the access token using the refresh token.

#### Returns

`Promise`\<`any`\>

The new access token or error status/message.

#### Throws

If the Auth config is unavailable.

---

### setKeyValue()

> **setKeyValue**(`data`): `Promise`\<`void`\>

Defined in: [src/index.ts:216](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L216)

Sets a key-value pair in storage (cookie or AsyncStorage).

#### Parameters

##### data

[`KeyVal`](../type-aliases/KeyVal.md)

The key, value, and optional maxAge.

#### Returns

`Promise`\<`void`\>

#### Throws

If the Auth config is unavailable.

---

### verifyToken()

> **verifyToken**(): `Promise`\<\{ `message`: `string`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `number`; \} \| `undefined`\>

Defined in: [src/index.ts:494](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L494)

Verifies the current access token, revives if needed.

#### Returns

`Promise`\<\{ `message`: `string`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `string`; \} \| \{ `message?`: `undefined`; `status`: `number`; \} \| `undefined`\>

Status object indicating result.

#### Throws

If the Auth config is unavailable.

---

### getInstance()

> `static` **getInstance**(): `Auth`

Defined in: [src/index.ts:131](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L131)

Returns the singleton Auth instance.

#### Returns

`Auth`

The Auth instance.

#### Throws

If Auth is not initialized.

---

### initialize()

> `static` **initialize**(`config`): `void`

Defined in: [src/index.ts:117](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L117)

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

---

### reset()

> `static` **reset**(): `void`

Defined in: [src/index.ts:142](https://github.com/NETIX-AI-OSS/auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L142)

Resets the Auth singleton, allowing re-initialization.
Intended for use in tests and environments that require reconfiguration.

#### Returns

`void`
