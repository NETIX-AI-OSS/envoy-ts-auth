[**envoy-ts-auth**](../README.md)

---

[envoy-ts-auth](../README.md) / KeyVal

# Type Alias: KeyVal

> **KeyVal** = `object`

Defined in: [src/index.ts:16](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L16)

Represents a key-value pair for storage operations (cookie or AsyncStorage).

Used by [Auth.setKeyValue](../classes/Auth.md#setkeyvalue).

## Properties

### key

> **key**: `string`

Defined in: [src/index.ts:16](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L16)

The key to set in storage.

---

### maxAge?

> `optional` **maxAge?**: `string`

Defined in: [src/index.ts:16](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L16)

Optional max age (in seconds) for the key (used for cookies).

---

### value

> **value**: `string`

Defined in: [src/index.ts:16](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/13daa3a28e0ee8b021942735c788ff2260a747a2/src/index.ts#L16)

The value to store.
