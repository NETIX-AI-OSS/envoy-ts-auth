[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / AuthConfig

# Type Alias: AuthConfig

> **AuthConfig** = `object`

Defined in: [src/index.ts:149](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L149)

Configuration object for authentication.

## Properties

### AUTH\_BASE\_URL

> **AUTH\_BASE\_URL**: `string`

Defined in: [src/index.ts:165](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L165)

Base URL for authentication API

***

### BASE\_DOMAIN

> **BASE\_DOMAIN**: `string`

Defined in: [src/index.ts:159](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L159)

Base hostname allowed for redirects

***

### COOKIE\_DOMAIN

> **COOKIE\_DOMAIN**: `string`

Defined in: [src/index.ts:157](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L157)

Domain for the cookie

***

### COOKIE\_REFRESH\_TTL

> **COOKIE\_REFRESH\_TTL**: `string`

Defined in: [src/index.ts:153](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L153)

Refresh token cookie time-to-live (in seconds)

***

### COOKIE\_SECURE

> **COOKIE\_SECURE**: `boolean`

Defined in: [src/index.ts:155](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L155)

Whether the cookie is secure

***

### COOKIE\_TOKEN\_TTL

> **COOKIE\_TOKEN\_TTL**: `string`

Defined in: [src/index.ts:151](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L151)

Token cookie time-to-live (in seconds)

***

### CURRENT\_APP\_DOMAIN

> **CURRENT\_APP\_DOMAIN**: `string`

Defined in: [src/index.ts:161](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L161)

Current app hostname used when preserving redirects

***

### LAUNCHPAD\_PAGE\_URL

> **LAUNCHPAD\_PAGE\_URL**: `string`

Defined in: [src/index.ts:167](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L167)

URL for the launchpad page

***

### LOGIN\_PAGE\_URL

> **LOGIN\_PAGE\_URL**: `string`

Defined in: [src/index.ts:163](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L163)

URL for the login page

***

### LOGOUT\_ENDPOINT?

> `optional` **LOGOUT\_ENDPOINT?**: `string`

Defined in: [src/index.ts:175](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L175)

Optional endpoint for revoking the server-side session during logout

***

### NATIVE\_PLATFORM?

> `optional` **NATIVE\_PLATFORM?**: `boolean`

Defined in: [src/index.ts:177](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L177)

Set to true if running on a native platform

***

### ON\_LOGIN?

> `optional` **ON\_LOGIN?**: () => `void`

Defined in: [src/index.ts:179](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L179)

Callback for login event

#### Returns

`void`

***

### ON\_LOGOUT?

> `optional` **ON\_LOGOUT?**: () => `void`

Defined in: [src/index.ts:181](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L181)

Callback for logout event

#### Returns

`void`

***

### REFRESH\_ENDPOINT

> **REFRESH\_ENDPOINT**: `string`

Defined in: [src/index.ts:169](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L169)

Endpoint for refreshing tokens

***

### TOKEN\_ENDPOINT

> **TOKEN\_ENDPOINT**: `string`

Defined in: [src/index.ts:173](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L173)

Endpoint for obtaining tokens

***

### VERIFY\_ENDPOINT

> **VERIFY\_ENDPOINT**: `string`

Defined in: [src/index.ts:171](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L171)

Endpoint for verifying tokens
