[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / AuthConfig

# Type Alias: AuthConfig

> **AuthConfig** = `object`

Defined in: [src/index.ts:121](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L121)

Configuration object for authentication.

## Properties

### AUTH\_BASE\_URL

> **AUTH\_BASE\_URL**: `string`

Defined in: [src/index.ts:137](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L137)

Base URL for authentication API

***

### BASE\_DOMAIN

> **BASE\_DOMAIN**: `string`

Defined in: [src/index.ts:131](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L131)

Base hostname allowed for redirects

***

### COOKIE\_DOMAIN

> **COOKIE\_DOMAIN**: `string`

Defined in: [src/index.ts:129](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L129)

Domain for the cookie

***

### COOKIE\_REFRESH\_TTL

> **COOKIE\_REFRESH\_TTL**: `string`

Defined in: [src/index.ts:125](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L125)

Refresh token cookie time-to-live (in seconds)

***

### COOKIE\_SECURE

> **COOKIE\_SECURE**: `boolean`

Defined in: [src/index.ts:127](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L127)

Whether the cookie is secure

***

### COOKIE\_TOKEN\_TTL

> **COOKIE\_TOKEN\_TTL**: `string`

Defined in: [src/index.ts:123](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L123)

Token cookie time-to-live (in seconds)

***

### CURRENT\_APP\_DOMAIN

> **CURRENT\_APP\_DOMAIN**: `string`

Defined in: [src/index.ts:133](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L133)

Current app hostname used when preserving redirects

***

### LAUNCHPAD\_PAGE\_URL

> **LAUNCHPAD\_PAGE\_URL**: `string`

Defined in: [src/index.ts:139](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L139)

URL for the launchpad page

***

### LOGIN\_PAGE\_URL

> **LOGIN\_PAGE\_URL**: `string`

Defined in: [src/index.ts:135](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L135)

URL for the login page

***

### LOGOUT\_ENDPOINT?

> `optional` **LOGOUT\_ENDPOINT?**: `string`

Defined in: [src/index.ts:147](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L147)

Optional endpoint for revoking the server-side session during logout

***

### NATIVE\_PLATFORM?

> `optional` **NATIVE\_PLATFORM?**: `boolean`

Defined in: [src/index.ts:149](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L149)

Set to true if running on a native platform

***

### ON\_LOGIN?

> `optional` **ON\_LOGIN?**: () => `void`

Defined in: [src/index.ts:151](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L151)

Callback for login event

#### Returns

`void`

***

### ON\_LOGOUT?

> `optional` **ON\_LOGOUT?**: () => `void`

Defined in: [src/index.ts:153](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L153)

Callback for logout event

#### Returns

`void`

***

### REFRESH\_ENDPOINT

> **REFRESH\_ENDPOINT**: `string`

Defined in: [src/index.ts:141](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L141)

Endpoint for refreshing tokens

***

### TOKEN\_ENDPOINT

> **TOKEN\_ENDPOINT**: `string`

Defined in: [src/index.ts:145](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L145)

Endpoint for obtaining tokens

***

### VERIFY\_ENDPOINT

> **VERIFY\_ENDPOINT**: `string`

Defined in: [src/index.ts:143](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L143)

Endpoint for verifying tokens
