/**
 * @internal Test-only hook to swap out the default `setTimeout`-based sleep used by
 * {@link fetchIdempotentWithRetry} when no `opts.sleep` is supplied, so tests don't have
 * to wait out real backoff delays. Not part of the public API.
 */
export declare function __setDefaultRetrySleepForTests(sleep: (ms: number) => Promise<void>): void;
/**
 * Represents a key-value pair for storage operations (cookie or AsyncStorage).
 *
 * Used by {@link Auth.setKeyValue}.
 *
 * @property key - The key to set in storage.
 * @property value - The value to store.
 * @property [maxAge] - Optional max age (in seconds) for the key (used for cookies).
 * @category Types
 */
export type KeyVal = {
    key: string;
    value: string;
    maxAge?: string;
};
/**
 * Configuration object for authentication.
 * @category Types
 */
export type AuthConfig = {
    /** Token cookie time-to-live (in seconds) */
    COOKIE_TOKEN_TTL: string;
    /** Refresh token cookie time-to-live (in seconds) */
    COOKIE_REFRESH_TTL: string;
    /** Whether the cookie is secure */
    COOKIE_SECURE: boolean;
    /** Domain for the cookie */
    COOKIE_DOMAIN: string;
    /** Base hostname allowed for redirects */
    BASE_DOMAIN: string;
    /** Current app hostname used when preserving redirects */
    CURRENT_APP_DOMAIN: string;
    /** URL for the login page */
    LOGIN_PAGE_URL: string;
    /** Base URL for authentication API */
    AUTH_BASE_URL: string;
    /** URL for the launchpad page */
    LAUNCHPAD_PAGE_URL: string;
    /** Endpoint for refreshing tokens */
    REFRESH_ENDPOINT: string;
    /** Endpoint for verifying tokens */
    VERIFY_ENDPOINT: string;
    /** Endpoint for obtaining tokens */
    TOKEN_ENDPOINT: string;
    /** Set to true if running on a native platform */
    NATIVE_PLATFORM?: boolean;
    /** Callback for login event */
    ON_LOGIN?: () => void;
    /** Callback for logout event */
    ON_LOGOUT?: () => void;
};
/**
 * Internal: Current authentication configuration.
 */
/**
 * Singleton class for authentication and authorization utilities.
 *
 * Provides methods for token management, user info, login/logout, and redirection.
 *
 * Usage:
 *   1. Call {@link Auth.initialize} once with your config.
 *   2. Use {@link Auth.getInstance} to access all methods.
 *
 * @example
 *   Auth.initialize(config);
 *   const auth = Auth.getInstance();
 *   const user = await auth.getUser();
 *
 * @category Auth
 */
declare class Auth {
    private static instance;
    private static initialized;
    private config;
    private cachedToken;
    private cachedUser;
    private tokenTimestamp;
    private userTimestamp;
    private static readonly CACHE_DURATION;
    private constructor();
    /**
     * Initializes the Auth singleton with the given configuration.
     * Must be called before using any Auth methods.
     * @param config The authentication configuration object.
     * @throws If already initialized or config is invalid.
     */
    static initialize(config: AuthConfig): void;
    /**
     * Returns the singleton Auth instance.
     * @returns {Auth} The Auth instance.
     * @throws If Auth is not initialized.
     */
    static getInstance(): Auth;
    /**
     * Resets the Auth singleton, allowing re-initialization.
     * Intended for use in tests and environments that require reconfiguration.
     */
    static reset(): void;
    private get authConfig();
    /**
     * Returns all cookies as an object. Not available on native platforms.
     * @returns Object of cookie key-value pairs or message if unavailable.
     */
    allCookies(): Record<string, string>;
    /**
     * Checks whether a given key is present in the storage (cookie or AsyncStorage).
     * @param key - The key to check for presence.
     * @returns A promise that resolves to `true` if the key is present, otherwise `false`.
     * @throws {Error} If the Auth config is unavailable.
     */
    isKeyPresent(key: string): Promise<boolean>;
    /**
     * Gets the value for a key from storage (cookie or AsyncStorage).
     * @param key The key to retrieve.
     * @returns The value or null if not found.
     * @throws {Error} If the Auth config is unavailable.
     */
    getKeyValue(key: string): Promise<string | null>;
    /**
     * Sets a key-value pair in storage (cookie or AsyncStorage).
     * @param data The key, value, and optional maxAge.
     * @throws {Error} If the Auth config is unavailable.
     */
    setKeyValue(data: KeyVal): Promise<void>;
    /**
     * Clears authentication cookies or AsyncStorage tokens.
     * @throws {Error} If the Auth config is unavailable.
     */
    clearCookies(): Promise<void>;
    /**
     * Redirects the user to the login page or calls ON_LOGOUT callback.
     * @throws {Error} If the Auth config is unavailable.
     */
    redirectToLoginPage(): void;
    /**
     * Redirects the user to the source page or calls ON_LOGIN callback.
     * @throws {Error} If the Auth config is unavailable.
     */
    redirectToSourcePage(): void;
    /**
     * Gets the current user from the API or cache.
     *
     * Only a 401 (session problem) triggers the login redirect. Any other
     * failure — 403 from a fail-closed permission gate, 429, 5xx — resolves to
     * `null` so callers can surface an in-app error/no-permission state instead
     * of bouncing a logged-in user to the login page (which would loop straight
     * back while the session is still valid).
     *
     * @returns The user object or null if not found.
     * @throws {Error} If the Auth config is unavailable.
     */
    getUser(): Promise<any>;
    /**
     * Gets the permissions for the current user.
     * @returns Array of permissions or empty array.
     * @throws {Error} If the Auth config is unavailable.
     */
    getPermissions(): Promise<string[] | undefined>;
    /**
     * Whether the current user holds the given permission codename.
     * @param codename Canonical bare permission codename (e.g. "gateway-config-apply").
     */
    hasPermission(codename: string): Promise<boolean>;
    /**
     * Whether the current user holds ANY of the given permission codenames.
     */
    hasAnyPermission(codenames: readonly string[]): Promise<boolean>;
    /**
     * Whether the current user holds ALL of the given permission codenames.
     */
    hasAllPermissions(codenames: readonly string[]): Promise<boolean>;
    /**
     * Gets the groups for the current user.
     * @returns Array of group names or empty array.
     * @throws {Error} If the Auth config is unavailable.
     */
    getGroups(): Promise<string[] | undefined>;
    /**
     * Gets the current access token from storage or API.
     * @returns The access token string or null.
     * @throws {Error} If the Auth config is unavailable.
     */
    getToken(): Promise<string | null>;
    /**
     * Attempts to revive the access token using the refresh token.
     * @returns The new access token or error status/message.
     * @throws {Error} If the Auth config is unavailable.
     */
    reviveToken(): Promise<any>;
    /**
     * Verifies the current access token, revives if needed.
     * @returns Status object indicating result.
     * @throws {Error} If the Auth config is unavailable.
     */
    verifyToken(): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    } | {
        status: number;
        message?: undefined;
    } | undefined>;
    /**
     * Logs out the user by clearing cookies/storage and redirecting to login.
     * @throws {Error} If the Auth config is unavailable.
     */
    logout(): Promise<void>;
    /**
     * Logs in the user with username and password.
     * @param username The username.
     * @param password The password.
     * @returns True if login successful, false otherwise.
     * @throws {Error} If the Auth config is unavailable.
     */
    login(username: string, password: string): Promise<boolean | undefined>;
    /**
     * Checks if the user is logged in (token present and valid).
     *
     * **Side-effect**: On web platforms, if a valid token is found, the user is
     * automatically redirected to the `continue` query-param URL or the configured
     * `LAUNCHPAD_PAGE_URL`. Designed for use on login/guard pages where an already-
     * authenticated user should be bounced away immediately.
     *
     * @returns True if logged in, false otherwise.
     * @throws {Error} If unable to check login status.
     */
    isLoggedIn(): Promise<boolean>;
}
/**
 * Exports the Auth class for authentication utilities.
 * @category Auth
 */
export { Auth };
/**
 * Whether an HTTP status from a BUSINESS API call signals a broken session,
 * i.e. the caller should run its refresh/re-login flow.
 *
 * Only 401 qualifies. A 403 on a business endpoint means the user is
 * authenticated but lacks permission — redirecting to login would bounce the
 * still-valid session straight back and loop. Surface 403 in-app instead
 * (error state, NoPermission view, toast).
 *
 * Note: a 403 from the auth server's own token verify/refresh endpoints is a
 * session-level signal (blacklisted token); {@link Auth.verifyToken} and
 * {@link Auth.reviveToken} already handle that case internally.
 *
 * @param status HTTP status code from a business API response.
 * @category Auth
 */
export declare function isSessionError(status: number): boolean;
export { PERMISSIONS, PERMISSION_SET, PERMISSIONS_BY_MODULE, type Permission, } from "./permissions.generated";
