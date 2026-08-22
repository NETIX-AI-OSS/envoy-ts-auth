"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrowserLocaleStorage = exports.createAsyncStorageLocaleStorage = exports.LocaleRuntime = exports.PERMISSIONS_BY_MODULE = exports.PERMISSION_SET = exports.PERMISSIONS = exports.Auth = void 0;
exports.__setDefaultRetrySleepForTests = __setDefaultRetrySleepForTests;
exports.isSessionError = isSessionError;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const settings_1 = require("./conf/settings");
const Cookies = require("js-cookie");
let defaultRetrySleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Test-only hook that swaps the default `setTimeout`-based sleep used by {@link fetchIdempotentWithRetry}, so tests skip real backoff delays.
 * @internal
 */
function __setDefaultRetrySleepForTests(sleep) {
    defaultRetrySleep = sleep;
}
const RETRYABLE_STATUSES = new Set([429, 408]);
function isRetryableStatus(status) {
    return RETRYABLE_STATUSES.has(status) || (status >= 500 && status <= 599);
}
function computeBackoffDelay(attempt, baseDelayMs, maxDelayMs) {
    const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    return exponential * (0.5 + Math.random() * 0.5);
}
/**
 * Parses a `Retry-After` header (seconds form only) into milliseconds, or null so callers fall back to the computed backoff delay.
 * @internal
 */
function parseRetryAfterMs(response) {
    var _a, _b;
    const header = (_b = (_a = response.headers) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a, "Retry-After");
    if (!header)
        return null;
    const seconds = Number(header);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
}
/**
 * Fetch wrapper with jittered-exponential-backoff retries for transient failures — only call it for idempotent GET/HEAD/OPTIONS requests, never POST/PUT/PATCH/DELETE.
 * @internal
 */
function fetchIdempotentWithRetry(input, init, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const maxRetries = (_a = opts === null || opts === void 0 ? void 0 : opts.maxRetries) !== null && _a !== void 0 ? _a : 2;
        const baseDelayMs = (_b = opts === null || opts === void 0 ? void 0 : opts.baseDelayMs) !== null && _b !== void 0 ? _b : 250;
        const maxDelayMs = (_c = opts === null || opts === void 0 ? void 0 : opts.maxDelayMs) !== null && _c !== void 0 ? _c : 2000;
        const sleep = (_d = opts === null || opts === void 0 ? void 0 : opts.sleep) !== null && _d !== void 0 ? _d : defaultRetrySleep;
        for (let attempt = 0;; attempt++) {
            try {
                const response = yield fetch(input, init);
                if (response.ok || !isRetryableStatus(response.status)) {
                    return response;
                }
                if (attempt >= maxRetries) {
                    return response;
                }
                const retryAfterMs = response.status === 429 ? parseRetryAfterMs(response) : null;
                const delay = retryAfterMs !== null
                    ? Math.min(retryAfterMs, maxDelayMs)
                    : computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
                yield sleep(delay);
            }
            catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    throw error;
                }
                if (attempt >= maxRetries) {
                    throw error;
                }
                yield sleep(computeBackoffDelay(attempt, baseDelayMs, maxDelayMs));
            }
        }
    });
}
/**
 * Singleton class for authentication and authorization utilities — call {@link Auth.initialize} once, then {@link Auth.getInstance} for all methods.
 * @category Auth
 */
class Auth {
    constructor(config) {
        this.cachedToken = null;
        this.cachedUser = null;
        this.tokenTimestamp = null;
        this.userTimestamp = null;
        this.config = config;
    }
    /**
     * Initializes the Auth singleton with the given configuration; must be called before any other Auth method.
     * @param config The authentication configuration object.
     * @throws If already initialized or config is invalid.
     */
    static initialize(config) {
        if (Auth.initialized) {
            throw new Error(settings_1.ERROR_MESSAGES.ALREADY_INITIALIZED);
        }
        validateAuthConfig(config);
        Auth.instance = new Auth(config);
        Auth.initialized = true;
    }
    /**
     * Returns the singleton Auth instance.
     * @returns {Auth} The Auth instance.
     * @throws If Auth is not initialized.
     */
    static getInstance() {
        if (!Auth.initialized || !Auth.instance) {
            throw new Error(settings_1.ERROR_MESSAGES.NOT_INITIALIZED);
        }
        return Auth.instance;
    }
    /** Resets the Auth singleton so it can be re-initialized (for tests/reconfiguration). */
    static reset() {
        Auth.instance = null;
        Auth.initialized = false;
    }
    get authConfig() {
        return this.config;
    }
    /** Drops all in-memory state; token changes must also drop the cached user, since permissions/org membership belong to the token subject that populated it. */
    clearSessionCache() {
        this.cachedToken = null;
        this.cachedUser = null;
        this.tokenTimestamp = null;
        this.userTimestamp = null;
    }
    /** Removes only the access token, retaining the refresh token for a single refresh attempt. */
    clearAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            this.clearSessionCache();
            if (this.authConfig.NATIVE_PLATFORM) {
                yield async_storage_1.default.removeItem("token");
            }
            else {
                Cookies.remove("token", {
                    domain: this.authConfig.COOKIE_DOMAIN,
                    secure: this.authConfig.COOKIE_SECURE,
                    sameSite: "None",
                });
            }
        });
    }
    /** Best-effort server revocation; local invalidation never depends on it. */
    revokeServerSession(accessToken, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig.LOGOUT_ENDPOINT ||
                (!accessToken && !refreshToken)) {
                return;
            }
            try {
                const headers = {
                    "Content-Type": "application/json",
                };
                if (accessToken) {
                    headers.Authorization = `Bearer ${accessToken}`;
                }
                yield fetch(`${this.authConfig.AUTH_BASE_URL}${this.authConfig.LOGOUT_ENDPOINT}`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(refreshToken ? { refresh: refreshToken } : {}),
                });
            }
            catch (error) {
                console.error("envoy-ts-auth-logout revoke error: ", error);
            }
        });
    }
    /**
     * Returns all cookies as an object. Not available on native platforms.
     * @returns Object of cookie key-value pairs or message if unavailable.
     */
    allCookies() {
        if (!this.authConfig)
            throw AuthConfigUnavailableError();
        if (this.authConfig.NATIVE_PLATFORM) {
            return { message: "Unavailable" };
        }
        const cookies = {};
        document.cookie.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            if (!key)
                return;
            try {
                cookies[decodeURIComponent(key)] = decodeURIComponent(value);
            }
            catch (e) {
                console.warn(`Failed to decode cookie ${key}=${value}`, e);
            }
        });
        return cookies;
    }
    /**
     * Checks whether a given key is present in the storage (cookie or AsyncStorage).
     * @param key - The key to check for presence.
     * @returns A promise that resolves to `true` if the key is present, otherwise `false`.
     * @throws {Error} If the Auth config is unavailable.
     */
    isKeyPresent(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            if (this.authConfig.NATIVE_PLATFORM) {
                try {
                    const data = yield async_storage_1.default.getItem(key);
                    return !!data;
                }
                catch (error) {
                    console.error("Error checking key in AsyncStorage:", error);
                    return false;
                }
            }
            else {
                const cookies = document.cookie.split(";").map((c) => c.trim());
                return cookies.some((c) => c.startsWith(`${key}=`));
            }
        });
    }
    /**
     * Gets the value for a key from storage (cookie or AsyncStorage).
     * @param key The key to retrieve.
     * @returns The value or null if not found.
     * @throws {Error} If the Auth config is unavailable.
     */
    getKeyValue(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            if (this.authConfig.NATIVE_PLATFORM) {
                const data = yield async_storage_1.default.getItem(key);
                return data === undefined ? null : String(data);
            }
            else {
                return Cookies.get(key) || null;
            }
        });
    }
    /**
     * Sets a key-value pair in storage (cookie or AsyncStorage).
     * @param data The key, value, and optional maxAge.
     * @throws {Error} If the Auth config is unavailable.
     */
    setKeyValue(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            if (this.authConfig.NATIVE_PLATFORM) {
                yield async_storage_1.default.setItem(data.key, data.value);
            }
            else {
                Cookies.set(data.key, data.value, {
                    domain: this.authConfig.COOKIE_DOMAIN,
                    secure: this.authConfig.COOKIE_SECURE,
                    sameSite: "None",
                    expires: data.maxAge ? Number(data.maxAge) / (60 * 60 * 24) : undefined,
                });
            }
        });
    }
    /**
     * Clears authentication cookies or AsyncStorage tokens.
     * @throws {Error} If the Auth config is unavailable.
     */
    clearCookies() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            this.clearSessionCache();
            if (this.authConfig.NATIVE_PLATFORM) {
                yield async_storage_1.default.multiRemove(["token", "refresh"]);
            }
            else {
                Cookies.remove("token", {
                    domain: this.authConfig.COOKIE_DOMAIN,
                    secure: this.authConfig.COOKIE_SECURE,
                    sameSite: "None",
                });
                Cookies.remove("refresh", {
                    domain: this.authConfig.COOKIE_DOMAIN,
                    secure: this.authConfig.COOKIE_SECURE,
                    sameSite: "None",
                });
            }
        });
    }
    /**
     * Redirects the user to the login page or calls ON_LOGOUT callback.
     * @throws {Error} If the Auth config is unavailable.
     */
    redirectToLoginPage() {
        if (!this.authConfig)
            throw AuthConfigUnavailableError();
        if (this.authConfig.ON_LOGOUT instanceof Function) {
            return this.authConfig.ON_LOGOUT();
        }
        if (!this.authConfig.NATIVE_PLATFORM && this.authConfig.LOGIN_PAGE_URL) {
            const loginUrl = new URL(this.authConfig.LOGIN_PAGE_URL);
            const redirectUrl = getValidatedRedirectUrl(location.href, this.authConfig);
            if (redirectUrl &&
                normalizeHostname(location.hostname) ===
                    normalizeHostname(this.authConfig.CURRENT_APP_DOMAIN)) {
                loginUrl.searchParams.set(settings_1.REDIRECT_DESTINATION_URL, redirectUrl);
            }
            location.href = loginUrl.toString();
        }
    }
    /**
     * Redirects the user to the source page or calls ON_LOGIN callback.
     * @throws {Error} If the Auth config is unavailable.
     */
    redirectToSourcePage() {
        var _a;
        if (!this.authConfig)
            throw AuthConfigUnavailableError();
        if (this.authConfig.ON_LOGIN instanceof Function) {
            return this.authConfig.ON_LOGIN();
        }
        const searchParams = new URLSearchParams(location.search);
        const sourceUrl = (_a = getValidatedRedirectUrl(searchParams.get(settings_1.REDIRECT_DESTINATION_URL), this.authConfig)) !== null && _a !== void 0 ? _a : this.authConfig.LAUNCHPAD_PAGE_URL;
        if (!this.authConfig.NATIVE_PLATFORM && sourceUrl)
            location.replace(sourceUrl);
    }
    /**
     * Gets the current user from the API or cache; only a 401 triggers the login redirect, other failures (403/429/5xx) resolve to `null`.
     * @returns The user object or null if not found.
     * @throws {Error} If the Auth config is unavailable.
     */
    getUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = Date.now();
            let tokenForRequest = null;
            if (this.cachedUser &&
                this.userTimestamp &&
                currentTime - this.userTimestamp < Auth.CACHE_DURATION) {
                // Confirm cache still belongs to this session before returning it.
                tokenForRequest = yield this.getToken();
                if (tokenForRequest && this.cachedUser) {
                    return this.cachedUser;
                }
                if (!tokenForRequest)
                    return null;
            }
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            try {
                const token = tokenForRequest !== null && tokenForRequest !== void 0 ? tokenForRequest : (yield this.getToken());
                if (!token) {
                    return null;
                }
                const response = yield fetchIdempotentWithRetry(`${this.authConfig.AUTH_BASE_URL}/auth/me/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response) {
                    if (response.ok) {
                        const data = yield response.json();
                        this.userTimestamp = Date.now();
                        this.cachedUser = data;
                        return data;
                    }
                    else if (isSessionError(response.status)) {
                        yield this.clearCookies();
                        this.redirectToLoginPage();
                    }
                    else {
                        // Not a session error (403/429/5xx): let caller render its own UI.
                        return null;
                    }
                }
            }
            catch (error) {
                const err = error;
                console.error("envoy-ts-auth-getUser error: ", err);
            }
        });
    }
    /**
     * Gets the permissions for the current user.
     * @returns Array of permissions or empty array.
     * @throws {Error} If the Auth config is unavailable.
     */
    getPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            try {
                const user = yield this.getUser();
                if (user) {
                    // Union `permissions` + `groups_detailed`, normalize, dedupe codenames.
                    const topLevel = Array.isArray(user.permissions) ? user.permissions : [];
                    const groupPermissions = (user === null || user === void 0 ? void 0 : user.groups_detailed)
                        ? Object.values(user.groups_detailed)
                            .map((entry) => { var _a; return (_a = entry === null || entry === void 0 ? void 0 : entry.permissions) !== null && _a !== void 0 ? _a : []; })
                            .flat()
                        : [];
                    const normalized = [...topLevel, ...groupPermissions].map((permission) => String(permission).split(".").pop());
                    return Array.from(new Set(normalized));
                }
            }
            catch (error) {
                const err = error;
                console.error("Unable to get permissions: ", err);
            }
        });
    }
    /**
     * Whether the current user holds the given permission codename.
     * @param codename Canonical bare permission codename (e.g. "gateway-config-apply").
     */
    hasPermission(codename) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const permissions = (_a = (yield this.getPermissions())) !== null && _a !== void 0 ? _a : [];
            return permissions.includes(codename);
        });
    }
    /**
     * Whether the current user holds ANY of the given permission codenames.
     */
    hasAnyPermission(codenames) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const permissions = new Set((_a = (yield this.getPermissions())) !== null && _a !== void 0 ? _a : []);
            return codenames.some((codename) => permissions.has(codename));
        });
    }
    /**
     * Whether the current user holds ALL of the given permission codenames.
     */
    hasAllPermissions(codenames) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const permissions = new Set((_a = (yield this.getPermissions())) !== null && _a !== void 0 ? _a : []);
            return codenames.every((codename) => permissions.has(codename));
        });
    }
    /**
     * Gets the groups for the current user.
     * @returns Array of group names or empty array.
     * @throws {Error} If the Auth config is unavailable.
     */
    getGroups() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            try {
                const user = yield this.getUser();
                if (user) {
                    const groups = (user === null || user === void 0 ? void 0 : user.groups_detailed)
                        ? Object.keys(user === null || user === void 0 ? void 0 : user.groups_detailed)
                        : [];
                    return groups;
                }
            }
            catch (error) {
                const err = error;
                console.error("Unable to get groups: ", err);
            }
        });
    }
    /**
     * Gets the current access token from storage or API.
     * @returns The access token string or null.
     * @throws {Error} If the Auth config is unavailable.
     */
    getToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = Date.now();
            if (this.cachedToken &&
                this.tokenTimestamp &&
                currentTime - this.tokenTimestamp < Auth.CACHE_DURATION) {
                // Cookies can change in another tab; never let cache outlive that.
                const storedToken = yield this.getKeyValue("token");
                if (storedToken === this.cachedToken) {
                    return this.cachedToken;
                }
                this.clearSessionCache();
            }
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            const isPresent = yield this.isKeyPresent("token");
            if (isPresent) {
                const token = yield this.getKeyValue("token");
                let response = null;
                try {
                    response = yield fetch(`${this.authConfig.AUTH_BASE_URL}${this.authConfig.VERIFY_ENDPOINT}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ token }),
                    });
                }
                catch (error) {
                    const err = error;
                    console.error("envoy-ts-auth-getToken verify error: ", err);
                }
                if ((response === null || response === void 0 ? void 0 : response.status) === 200) {
                    this.cachedToken = token;
                    this.tokenTimestamp = Date.now();
                    return token;
                }
                if ((response === null || response === void 0 ? void 0 : response.status) === 403) {
                    yield this.clearCookies();
                    this.redirectToLoginPage();
                    return null;
                }
            }
            const revivedToken = yield this.reviveToken();
            return typeof revivedToken === "string" ? revivedToken : null;
        });
    }
    /**
     * Attempts to revive the access token using the refresh token.
     * @returns The new access token or error status/message.
     * @throws {Error} If the Auth config is unavailable.
     */
    reviveToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            const isRefreshTokenPresent = yield this.isKeyPresent("refresh");
            if (!isRefreshTokenPresent) {
                yield this.clearCookies();
                return {
                    status: "failed",
                    message: "Refresh token cookie, not found. Please log in",
                };
            }
            else {
                const refreshToken = yield this.getKeyValue("refresh");
                if (!refreshToken) {
                    yield this.clearCookies();
                    return {
                        status: "failed",
                        message: "Invalid refresh token",
                    };
                }
                try {
                    // Token is untrusted; clear it before the call so it can't be reused.
                    yield this.clearAccessToken();
                    const response = yield fetch(`${this.authConfig.AUTH_BASE_URL}${this.authConfig.REFRESH_ENDPOINT}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${refreshToken}`,
                        },
                        body: JSON.stringify({ refresh: refreshToken }),
                    });
                    if (response) {
                        if (!this.authConfig)
                            throw AuthConfigUnavailableError();
                        if (response.ok) {
                            const data = yield response.json();
                            if (data && data.access) {
                                yield this.setKeyValue({
                                    key: "token",
                                    value: data.access,
                                    maxAge: this.authConfig.COOKIE_TOKEN_TTL || "300",
                                });
                                if (data.refresh) {
                                    yield this.setKeyValue({
                                        key: "refresh",
                                        value: data.refresh,
                                        maxAge: this.authConfig.COOKIE_REFRESH_TTL,
                                    });
                                }
                                this.cachedToken = data.access;
                                this.tokenTimestamp = Date.now();
                                return data.access;
                            }
                            else {
                                yield this.clearCookies();
                                this.redirectToLoginPage();
                                return { status: "failed", message: "Invalid refresh response" };
                            }
                        }
                        if (response.status === 401) {
                            yield this.clearCookies();
                            this.redirectToLoginPage();
                            return { status: response.status };
                        }
                        if ((response === null || response === void 0 ? void 0 : response.status) === 403) {
                            yield this.clearCookies();
                            this.redirectToLoginPage();
                            return { status: response === null || response === void 0 ? void 0 : response.status };
                        }
                        if (response.status === 404) {
                            yield this.clearCookies();
                            return {
                                status: response === null || response === void 0 ? void 0 : response.status,
                                message: "Cookie not found, please log in",
                            };
                        }
                        yield this.clearCookies();
                        return { status: response.status };
                    }
                }
                catch (error) {
                    const err = error;
                    console.error("envoy-ts-auth-reviveToken error: ", err);
                    yield this.clearCookies();
                    return { status: "failed", message: "Unable to refresh session" };
                }
            }
        });
    }
    /**
     * Verifies the current access token, revives if needed.
     * @returns Status object indicating result.
     * @throws {Error} If the Auth config is unavailable.
     */
    verifyToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            const isRefreshTokenPresent = yield this.isKeyPresent("refresh");
            if (!isRefreshTokenPresent) {
                yield this.clearCookies();
                return {
                    status: "failed",
                    message: "Refresh token cookie, not found. Please log in",
                };
            }
            else {
                const isTokenPresent = yield this.isKeyPresent("token");
                if (!isTokenPresent) {
                    const response = yield this.reviveToken();
                    if (typeof response === "string")
                        return { status: "ok" };
                    else
                        return {
                            status: "failed",
                            message: "Access token cookie, not found. Please log in",
                        };
                }
                else {
                    const token = yield this.getKeyValue("token");
                    if (!token) {
                        yield this.clearCookies();
                        return {
                            status: "failed",
                            message: "Access token cookie not found. Please log in",
                        };
                    }
                    try {
                        const response = yield fetch(`${this.authConfig.AUTH_BASE_URL}${this.authConfig.VERIFY_ENDPOINT}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ token }),
                        });
                        if (response.ok) {
                            this.cachedToken = token;
                            this.tokenTimestamp = Date.now();
                            return { status: "ok" };
                        }
                        if ((response === null || response === void 0 ? void 0 : response.status) === 401) {
                            const revivedToken = yield this.reviveToken();
                            return typeof revivedToken === "string"
                                ? { status: "ok" }
                                : { status: response.status };
                        }
                        if ((response === null || response === void 0 ? void 0 : response.status) === 403) {
                            yield this.clearCookies();
                            this.redirectToLoginPage();
                            return { status: response === null || response === void 0 ? void 0 : response.status };
                        }
                        if ((response === null || response === void 0 ? void 0 : response.status) === 404) {
                            yield this.clearCookies();
                            return { status: response === null || response === void 0 ? void 0 : response.status };
                        }
                        yield this.clearCookies();
                        return { status: response.status };
                    }
                    catch (error) {
                        const err = error;
                        console.error("envoy-ts-auth-verifyToken error: ", err);
                        yield this.clearCookies();
                        return { status: "failed" };
                    }
                }
            }
        });
    }
    /**
     * Logs out the user: clears local storage, best-effort revokes the server session, then redirects to login.
     * @throws {Error} If the Auth config is unavailable.
     */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            let accessToken = null;
            let refreshToken = null;
            try {
                accessToken = yield this.getKeyValue("token");
                refreshToken = yield this.getKeyValue("refresh");
            }
            catch (error) {
                console.error("envoy-ts-auth-logout storage error: ", error);
            }
            // Clear local creds first; a slow auth service can't stay logged in.
            yield this.clearCookies();
            yield this.revokeServerSession(accessToken, refreshToken);
            this.redirectToLoginPage();
        });
    }
    /**
     * Logs in the user with username and password.
     * @param username The username.
     * @param password The password.
     * @returns True if login successful, false otherwise.
     * @throws {Error} If the Auth config is unavailable.
     */
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authConfig)
                throw AuthConfigUnavailableError();
            try {
                const response = yield fetch(`${this.authConfig.AUTH_BASE_URL}${this.authConfig.TOKEN_ENDPOINT}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });
                if (response) {
                    if (!this.authConfig)
                        throw AuthConfigUnavailableError();
                    if (response.status === 200) {
                        const data = yield response.json();
                        if (data.refresh === undefined) {
                            yield this.clearCookies();
                            return false;
                        }
                        if (data && data.access) {
                            // Login can change accounts; drop old subject's caches first.
                            const previousAccessToken = yield this.getKeyValue("token");
                            const previousRefreshToken = yield this.getKeyValue("refresh");
                            yield this.clearCookies();
                            yield this.revokeServerSession(previousAccessToken, previousRefreshToken);
                            yield this.setKeyValue({
                                key: "token",
                                value: data.access,
                                maxAge: this.authConfig.COOKIE_TOKEN_TTL,
                            });
                            yield this.setKeyValue({
                                key: "refresh",
                                value: data.refresh,
                                maxAge: this.authConfig.COOKIE_REFRESH_TTL,
                            });
                            this.cachedToken = data.access;
                            this.tokenTimestamp = Date.now();
                            this.redirectToSourcePage();
                            return true;
                        }
                        else
                            return false;
                    }
                }
            }
            catch (error) {
                const err = error;
                console.error("envoy-ts-auth-login error: ", err);
                yield this.clearCookies();
                return false;
            }
        });
    }
    /**
     * Checks if logged in; on web, a valid token also triggers a redirect to `continue` or `LAUNCHPAD_PAGE_URL` (side-effect, for login/guard pages).
     * @returns True if logged in, false otherwise.
     * @throws {Error} If unable to check login status.
     */
    isLoggedIn() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = yield this.getToken();
                if (token) {
                    if (!this.authConfig)
                        throw AuthConfigUnavailableError();
                    const searchParams = new URLSearchParams(location.search);
                    const sourceUrl = (_a = getValidatedRedirectUrl(searchParams.get(settings_1.REDIRECT_DESTINATION_URL), this.authConfig)) !== null && _a !== void 0 ? _a : this.authConfig.LAUNCHPAD_PAGE_URL;
                    if (!this.authConfig.NATIVE_PLATFORM && sourceUrl)
                        location.replace(sourceUrl);
                    return true;
                }
                return false;
            }
            catch (error) {
                throw new Error(settings_1.ERROR_MESSAGES.UNABLE_TO_CHECK_LOGIN_STATUS);
            }
        });
    }
}
exports.Auth = Auth;
Auth.instance = null;
Auth.initialized = false;
Auth.CACHE_DURATION = 60 * 1000; // 1 minute
/**
 * Whether an HTTP status from a business API call signals a broken session — only 401 qualifies, not 403 (permission-denied, still authenticated).
 * @param status HTTP status code from a business API response.
 * @category Auth
 */
function isSessionError(status) {
    return status === 401;
}
// Canonical permission catalog, generated from user-management.
var permissions_generated_1 = require("./permissions.generated");
Object.defineProperty(exports, "PERMISSIONS", { enumerable: true, get: function () { return permissions_generated_1.PERMISSIONS; } });
Object.defineProperty(exports, "PERMISSION_SET", { enumerable: true, get: function () { return permissions_generated_1.PERMISSION_SET; } });
Object.defineProperty(exports, "PERMISSIONS_BY_MODULE", { enumerable: true, get: function () { return permissions_generated_1.PERMISSIONS_BY_MODULE; } });
var locale_1 = require("./locale");
Object.defineProperty(exports, "LocaleRuntime", { enumerable: true, get: function () { return locale_1.LocaleRuntime; } });
Object.defineProperty(exports, "createAsyncStorageLocaleStorage", { enumerable: true, get: function () { return locale_1.createAsyncStorageLocaleStorage; } });
Object.defineProperty(exports, "createBrowserLocaleStorage", { enumerable: true, get: function () { return locale_1.createBrowserLocaleStorage; } });
function AuthConfigUnavailableError() {
    return new Error(settings_1.ERROR_MESSAGES.CONFIG_UNAVAILABLE);
}
/** Validates required AuthConfig fields and BASE_DOMAIN/CURRENT_APP_DOMAIN format; throws if invalid. */
function validateAuthConfig(config) {
    const requiredProperties = [
        "COOKIE_TOKEN_TTL",
        "COOKIE_REFRESH_TTL",
        "COOKIE_SECURE",
        "COOKIE_DOMAIN",
        "BASE_DOMAIN",
        "CURRENT_APP_DOMAIN",
        "LOGIN_PAGE_URL",
        "AUTH_BASE_URL",
        "LAUNCHPAD_PAGE_URL",
        "REFRESH_ENDPOINT",
        "VERIFY_ENDPOINT",
        "TOKEN_ENDPOINT",
    ];
    const missingProperties = requiredProperties.filter((prop) => !config.hasOwnProperty(prop));
    if (missingProperties.length > 0) {
        throw new Error(`${settings_1.ERROR_MESSAGES.MISSING_PROPERTIES}: ${missingProperties.join(", ")}`);
    }
    const baseDomain = normalizeHostname(config.BASE_DOMAIN);
    const currentAppDomain = normalizeHostname(config.CURRENT_APP_DOMAIN);
    if (!baseDomain) {
        throw new Error("envoy-ts-auth: BASE_DOMAIN must be a valid hostname.");
    }
    if (currentAppDomain !== baseDomain &&
        !isSingleLevelSubdomain(currentAppDomain, baseDomain)) {
        throw new Error("envoy-ts-auth: CURRENT_APP_DOMAIN must match BASE_DOMAIN or be a single-level subdomain of it.");
    }
}
function getValidatedRedirectUrl(candidateUrl, config) {
    if (!candidateUrl)
        return null;
    try {
        const parsedUrl = new URL(candidateUrl);
        const hostname = normalizeHostname(parsedUrl.hostname);
        const baseDomain = normalizeHostname(config.BASE_DOMAIN);
        if (parsedUrl.protocol !== "https:" ||
            parsedUrl.username ||
            parsedUrl.password ||
            !isAllowedRedirectHostname(hostname, baseDomain)) {
            return null;
        }
        return parsedUrl.toString();
    }
    catch (_a) {
        return null;
    }
}
function isAllowedRedirectHostname(hostname, baseDomain) {
    return (hostname === baseDomain || isSingleLevelSubdomain(hostname, baseDomain));
}
function isSingleLevelSubdomain(hostname, baseDomain) {
    if (!hostname.endsWith(`.${baseDomain}`)) {
        return false;
    }
    const subdomain = hostname.slice(0, -(baseDomain.length + 1));
    return Boolean(subdomain) && !subdomain.includes(".");
}
function normalizeHostname(hostname) {
    return hostname.trim().toLowerCase().replace(/^\.+/, "").replace(/\.+$/, "");
}
