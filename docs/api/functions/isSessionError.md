[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / isSessionError

# Function: isSessionError()

> **isSessionError**(`status`): `boolean`

Defined in: [src/index.ts:882](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/index.ts#L882)

Whether an HTTP status from a business API call signals a broken session — only 401 qualifies, not 403 (permission-denied, still authenticated).

## Parameters

### status

`number`

HTTP status code from a business API response.

## Returns

`boolean`
