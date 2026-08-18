/**
 * Test-only hook that swaps the default `setTimeout`-based sleep used by {@link fetchIdempotentWithRetry}, so tests skip real backoff delays.
 * @internal
 */
export declare function __setDefaultRetrySleepForTests(sleep: (ms: number) => Promise<void>): void;
/**
 * Key-value pair for storage operations (cookie or AsyncStorage), used by {@link Auth.setKeyValue}.
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
    /** Optional endpoint for revoking the server-side session during logout */
    LOGOUT_ENDPOINT?: string;
    /** Set to true if running on a native platform */
    NATIVE_PLATFORM?: boolean;
    /** Callback for login event */
    ON_LOGIN?: () => void;
    /** Callback for logout event */
    ON_LOGOUT?: () => void;
};
/**
 * Singleton class for authentication and authorization utilities — call {@link Auth.initialize} once, then {@link Auth.getInstance} for all methods.
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
     * Initializes the Auth singleton with the given configuration; must be called before any other Auth method.
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
    /** Resets the Auth singleton so it can be re-initialized (for tests/reconfiguration). */
    static reset(): void;
    private get authConfig();
    /** Drops all in-memory state; token changes must also drop the cached user, since permissions/org membership belong to the token subject that populated it. */
    private clearSessionCache;
    /** Removes only the access token, retaining the refresh token for a single refresh attempt. */
    private clearAccessToken;
    /** Best-effort server revocation; local invalidation never depends on it. */
    private revokeServerSession;
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
     * Gets the current user from the API or cache; only a 401 triggers the login redirect, other failures (403/429/5xx) resolve to `null`.
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
    }>;
    /**
     * Logs out the user: clears local storage, best-effort revokes the server session, then redirects to login.
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
     * Checks if logged in; on web, a valid token also triggers a redirect to `continue` or `LAUNCHPAD_PAGE_URL` (side-effect, for login/guard pages).
     * @returns True if logged in, false otherwise.
     * @throws {Error} If unable to check login status.
     */
    isLoggedIn(): Promise<boolean>;
}
export { Auth };
/**
 * Whether an HTTP status from a business API call signals a broken session — only 401 qualifies, not 403 (permission-denied, still authenticated).
 * @param status HTTP status code from a business API response.
 * @category Auth
 */
export declare function isSessionError(status: number): boolean;
export { PERMISSIONS, PERMISSION_SET, PERMISSIONS_BY_MODULE, type Permission, } from "./permissions.generated";
