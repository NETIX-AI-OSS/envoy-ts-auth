[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / isSessionError

# Function: isSessionError()

> **isSessionError**(`status`): `boolean`

Defined in: [src/index.ts:882](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/089495cad60af6640a27c7f23b89176eb6d5fab3/src/index.ts#L882)

Whether an HTTP status from a business API call signals a broken session — only 401 qualifies, not 403 (permission-denied, still authenticated).

## Parameters

### status

`number`

HTTP status code from a business API response.

## Returns

`boolean`
