[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / KeyVal

# Type Alias: KeyVal

> **KeyVal** = `object`

Defined in: [src/index.ts:121](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L121)

Represents a key-value pair for storage operations (cookie or AsyncStorage).

Used by [Auth.setKeyValue](../classes/Auth.md#setkeyvalue).

## Properties

### key

> **key**: `string`

Defined in: [src/index.ts:121](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L121)

The key to set in storage.

***

### maxAge?

> `optional` **maxAge?**: `string`

Defined in: [src/index.ts:121](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L121)

Optional max age (in seconds) for the key (used for cookies).

***

### value

> **value**: `string`

Defined in: [src/index.ts:121](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L121)

The value to store.
