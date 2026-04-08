[**envoy-ts-auth**](../README.md)

---

[envoy-ts-auth](../README.md) / AuthConfig

# Type Alias: AuthConfig

> **AuthConfig** = `object`

Defined in: [src/index.ts:44](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L44)

Configuration object for authentication.

## Properties

### AUTH_BASE_URL

> **AUTH_BASE_URL**: `string`

Defined in: [src/index.ts:60](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L60)

Base URL for authentication API

---

### BASE_DOMAIN

> **BASE_DOMAIN**: `string`

Defined in: [src/index.ts:54](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L54)

Base hostname allowed for redirects

---

### COOKIE_DOMAIN

> **COOKIE_DOMAIN**: `string`

Defined in: [src/index.ts:52](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L52)

Domain for the cookie

---

### COOKIE_REFRESH_TTL

> **COOKIE_REFRESH_TTL**: `string`

Defined in: [src/index.ts:48](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L48)

Refresh token cookie time-to-live (in seconds)

---

### COOKIE_SECURE

> **COOKIE_SECURE**: `boolean`

Defined in: [src/index.ts:50](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L50)

Whether the cookie is secure

---

### COOKIE_TOKEN_TTL

> **COOKIE_TOKEN_TTL**: `string`

Defined in: [src/index.ts:46](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L46)

Token cookie time-to-live (in seconds)

---

### CURRENT_APP_DOMAIN

> **CURRENT_APP_DOMAIN**: `string`

Defined in: [src/index.ts:56](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L56)

Current app hostname used when preserving redirects

---

### LAUNCHPAD_PAGE_URL

> **LAUNCHPAD_PAGE_URL**: `string`

Defined in: [src/index.ts:62](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L62)

URL for the launchpad page

---

### LOGIN_PAGE_URL

> **LOGIN_PAGE_URL**: `string`

Defined in: [src/index.ts:58](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L58)

URL for the login page

---

### NATIVE_PLATFORM?

> `optional` **NATIVE_PLATFORM?**: `boolean`

Defined in: [src/index.ts:70](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L70)

Set to true if running on a native platform

---

### ON_LOGIN?

> `optional` **ON_LOGIN?**: () => `void`

Defined in: [src/index.ts:72](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L72)

Callback for login event

#### Returns

`void`

---

### ON_LOGOUT?

> `optional` **ON_LOGOUT?**: () => `void`

Defined in: [src/index.ts:74](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L74)

Callback for logout event

#### Returns

`void`

---

### REFRESH_ENDPOINT

> **REFRESH_ENDPOINT**: `string`

Defined in: [src/index.ts:64](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L64)

Endpoint for refreshing tokens

---

### TOKEN_ENDPOINT

> **TOKEN_ENDPOINT**: `string`

Defined in: [src/index.ts:68](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L68)

Endpoint for obtaining tokens

---

### VERIFY_ENDPOINT

> **VERIFY_ENDPOINT**: `string`

Defined in: [src/index.ts:66](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L66)

Endpoint for verifying tokens
