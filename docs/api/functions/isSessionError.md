[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / isSessionError

# Function: isSessionError()

> **isSessionError**(`status`): `boolean`

Defined in: [src/index.ts:979](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/b0e2e32afa294a56ed8c22617a0ed08cbd35ef3f/src/index.ts#L979)

Whether an HTTP status from a BUSINESS API call signals a broken session,
i.e. the caller should run its refresh/re-login flow.

Only 401 qualifies. A 403 on a business endpoint means the user is
authenticated but lacks permission — redirecting to login would bounce the
still-valid session straight back and loop. Surface 403 in-app instead
(error state, NoPermission view, toast).

Note: a 403 from the auth server's own token verify/refresh endpoints is a
session-level signal (blacklisted token); [Auth.verifyToken](../classes/Auth.md#verifytoken) and
[Auth.reviveToken](../classes/Auth.md#revivetoken) already handle that case internally.

## Parameters

### status

`number`

HTTP status code from a business API response.

## Returns

`boolean`
