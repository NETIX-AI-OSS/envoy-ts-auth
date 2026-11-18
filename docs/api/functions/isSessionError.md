[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / isSessionError

# Function: isSessionError()

> **isSessionError**(`status`): `boolean`

Defined in: src/index.ts:917

Whether an HTTP status from a business API call signals a broken session, only 401 qualifies, not 403 (permission-denied, still authenticated).

## Parameters

### status

`number`

HTTP status code from a business API response.

## Returns

`boolean`
