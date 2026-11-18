[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / AuthConfig

# Type Alias: AuthConfig

> **AuthConfig** = `object`

Defined in: src/index.ts:122

Configuration object for authentication.

## Properties

### ~~ALLOW\_INSECURE\_BROWSER\_TOKEN\_STORAGE?~~

> `optional` **ALLOW\_INSECURE\_BROWSER\_TOKEN\_STORAGE?**: `boolean`

Defined in: src/index.ts:166

#### Deprecated

Use `BROWSER_SESSION_MODE`. Retained so upgrading this library
cannot break applications during the coordinated BFF migration.

***

### AUTH\_BASE\_URL

> **AUTH\_BASE\_URL**: `string`

Defined in: src/index.ts:143

Base URL for authentication API

***

### BASE\_DOMAIN

> **BASE\_DOMAIN**: `string`

Defined in: src/index.ts:137

Base hostname allowed for redirects

***

### BROWSER\_SESSION\_MODE?

> `optional` **BROWSER\_SESSION\_MODE?**: `"legacy-shared-cookie"` \| `"bff-only"`

Defined in: src/index.ts:161

Browser migration control. `legacy-shared-cookie` (the default) preserves
one-point login for existing applications. Set `bff-only` only after the
application has moved all API traffic and login bootstrap to BffAuth.

***

### COOKIE\_DOMAIN

> **COOKIE\_DOMAIN**: `string`

Defined in: src/index.ts:135

Domain for the cookie

***

### COOKIE\_REFRESH\_TTL

> **COOKIE\_REFRESH\_TTL**: `string`

Defined in: src/index.ts:126

Refresh token cookie time-to-live (in seconds)

***

### COOKIE\_SECURE

> **COOKIE\_SECURE**: `boolean`

Defined in: src/index.ts:133

Whether the session cookies carry `Secure` (and with it `SameSite=None`). Keep `true`
deployed. `false` writes plain `SameSite=Lax` cookies, which any page can store, use it
for local development over plain http, where a dev server opened at a LAN or VM address
cannot store a `Secure` cookie at all.

***

### COOKIE\_TOKEN\_TTL

> **COOKIE\_TOKEN\_TTL**: `string`

Defined in: src/index.ts:124

Token cookie time-to-live (in seconds)

***

### CURRENT\_APP\_DOMAIN

> **CURRENT\_APP\_DOMAIN**: `string`

Defined in: src/index.ts:139

Current app hostname used when preserving redirects

***

### LAUNCHPAD\_PAGE\_URL

> **LAUNCHPAD\_PAGE\_URL**: `string`

Defined in: src/index.ts:145

URL for the launchpad page

***

### LOGIN\_PAGE\_URL

> **LOGIN\_PAGE\_URL**: `string`

Defined in: src/index.ts:141

URL for the login page

***

### LOGOUT\_ENDPOINT?

> `optional` **LOGOUT\_ENDPOINT?**: `string`

Defined in: src/index.ts:153

Optional endpoint for revoking the server-side session during logout

***

### NATIVE\_PLATFORM?

> `optional` **NATIVE\_PLATFORM?**: `boolean`

Defined in: src/index.ts:155

Set to true if running on a native platform

***

### ON\_LOGIN?

> `optional` **ON\_LOGIN?**: () => `void`

Defined in: src/index.ts:168

Callback for login event

#### Returns

`void`

***

### ON\_LOGOUT?

> `optional` **ON\_LOGOUT?**: () => `void`

Defined in: src/index.ts:170

Callback for logout event

#### Returns

`void`

***

### REFRESH\_ENDPOINT

> **REFRESH\_ENDPOINT**: `string`

Defined in: src/index.ts:147

Endpoint for refreshing tokens

***

### TOKEN\_ENDPOINT

> **TOKEN\_ENDPOINT**: `string`

Defined in: src/index.ts:151

Endpoint for obtaining tokens

***

### VERIFY\_ENDPOINT

> **VERIFY\_ENDPOINT**: `string`

Defined in: src/index.ts:149

Endpoint for verifying tokens
