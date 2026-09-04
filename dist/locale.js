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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocaleRuntime = void 0;
exports.createBrowserLocaleStorage = createBrowserLocaleStorage;
exports.createAsyncStorageLocaleStorage = createAsyncStorageLocaleStorage;
/** Adapts browser localStorage to the asynchronous locale storage contract. */
function createBrowserLocaleStorage(storage) {
    const resolved = storage !== null && storage !== void 0 ? storage : globalThis.localStorage;
    if (!resolved) {
        throw new Error("envoy-ts-auth locale: browser localStorage is unavailable.");
    }
    return {
        getItem: (key) => __awaiter(this, void 0, void 0, function* () { return resolved.getItem(key); }),
        setItem: (key, value) => __awaiter(this, void 0, void 0, function* () { return resolved.setItem(key, value); }),
        removeItem: (key) => __awaiter(this, void 0, void 0, function* () { return resolved.removeItem(key); }),
    };
}
/** Adapts React Native AsyncStorage without coupling the runtime to React Native. */
function createAsyncStorageLocaleStorage(storage) {
    return storage;
}
const DEFAULT_NAMESPACE = "envoy-ts-auth:locale:v1";
/** Default locale served when a caller supplies an unparseable language on a read path. */
const FALLBACK_LANGUAGE = "en";
/** Cap on remembered bad codes, so a high-cardinality caller cannot grow the dedupe set forever. */
const MAX_WARNED_LANGUAGES = 32;
/**
 * Framework-neutral organization locale coordinator.
 *
 * Consumers own their i18n bindings. This class only handles identity-safe
 * persistence, health-gated network reconciliation, and conditional requests.
 */
class LocaleRuntime {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        /** Distinct unparseable language codes already reported; capped by MAX_WARNED_LANGUAGES. */
        this.warnedInvalidLanguages = new Set();
        this.inFlight = new Map();
        this.anonymousInFlight = new Map();
        this.preferenceInFlight = new Map();
        this.activeIdentity = null;
        this.sessionGeneration = 0;
        if (!config.apiBaseUrl || !config.application || !config.storage) {
            throw new Error("envoy-ts-auth locale: apiBaseUrl, application, and storage are required.");
        }
        if (!Number.isInteger((_a = config.maxCacheEntries) !== null && _a !== void 0 ? _a : 8) ||
            ((_b = config.maxCacheEntries) !== null && _b !== void 0 ? _b : 8) < 1) {
            throw new Error("envoy-ts-auth locale: maxCacheEntries must be a positive integer.");
        }
        const runtimeFetch = (_c = config.fetch) !== null && _c !== void 0 ? _c : globalThis.fetch;
        if (!runtimeFetch) {
            throw new Error("envoy-ts-auth locale: fetch is unavailable.");
        }
        this.config = {
            apiBaseUrl: config.apiBaseUrl.replace(/\/$/, ""),
            application: normalizeSegment(config.application, "application"),
            storage: config.storage,
            getAccessToken: config.getAccessToken,
            fetch: runtimeFetch,
            healthEndpoint: (_d = config.healthEndpoint) !== null && _d !== void 0 ? _d : "healthz/",
            effectiveEndpoint: (_e = config.effectiveEndpoint) !== null && _e !== void 0 ? _e : "api/organization-locale/effective/",
            preferenceEndpoint: (_f = config.preferenceEndpoint) !== null && _f !== void 0 ? _f : "auth/me/language/",
            anonymousEffectiveEndpoint: (_g = config.anonymousEffectiveEndpoint) !== null && _g !== void 0 ? _g : "auth/organization-locale/effective/",
            maxCacheEntries: (_h = config.maxCacheEntries) !== null && _h !== void 0 ? _h : 8,
            storageNamespace: (_j = config.storageNamespace) !== null && _j !== void 0 ? _j : DEFAULT_NAMESPACE,
            // Strict on purpose: a misconfigured fallback must fail at construction, not silently
            // on the first bad read.
            fallbackLanguage: normalizeLanguage((_k = config.fallbackLanguage) !== null && _k !== void 0 ? _k : FALLBACK_LANGUAGE),
            onInvalidLanguage: (_l = config.onInvalidLanguage) !== null && _l !== void 0 ? _l : ((language, fallback) => {
                console.warn(`envoy-ts-auth locale: invalid language code ${JSON.stringify(language)}; falling back to "${fallback}".`);
            }),
            now: (_m = config.now) !== null && _m !== void 0 ? _m : Date.now,
        };
    }
    /** Returns true only when user-management answers its health endpoint successfully. */
    checkHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.config.fetch(this.url(this.config.healthEndpoint), { method: "GET", credentials: "omit" });
                return response.ok;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /** Loads an exact identity/org/app/language cache match, otherwise returns null. */
    hydrate(identity, language) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalized = normalizeIdentity(identity);
            const normalizedLanguage = this.normalizeLanguageLenient(language);
            const key = this.cacheKey(normalized, normalizedLanguage);
            const raw = yield this.safeGet(key);
            if (!raw)
                return null;
            try {
                const envelope = JSON.parse(raw);
                if (!this.isMatchingEnvelope(envelope, normalized, normalizedLanguage)) {
                    yield this.removeCacheEntry(key);
                    return null;
                }
                yield this.touchIndex(key);
                return envelope;
            }
            catch (_a) {
                yield this.removeCacheEntry(key);
                return null;
            }
        });
    }
    /**
     * Health-gated authenticated refresh with ETag support and per-request deduplication.
     * On a transient outage it returns the exact cached catalog when one exists.
     */
    refreshEffective(identity, language) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalized = normalizeIdentity(identity);
            const normalizedLanguage = this.normalizeLanguageLenient(language);
            this.setActiveIdentity(normalized);
            const requestKey = this.cacheKey(normalized, normalizedLanguage);
            const existing = this.inFlight.get(requestKey);
            if (existing)
                return existing;
            const generation = this.sessionGeneration;
            let request;
            request = this.performEffectiveRefresh(normalized, normalizedLanguage, generation).finally(() => {
                if (this.inFlight.get(requestKey) === request) {
                    this.inFlight.delete(requestKey);
                }
            });
            this.inFlight.set(requestKey, request);
            return request;
        });
    }
    /** Saves the latest choice first, then attempts to reconcile it with the server. */
    setPreferredLanguage(identity, language) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalized = normalizeIdentity(identity);
            const pending = Object.assign(Object.assign({ schemaVersion: 1 }, normalized), { language: normalizeLanguage(language), updatedAt: this.config.now() });
            yield this.config.storage.setItem(this.pendingKey(normalized), JSON.stringify(pending));
            return this.reconcilePendingLanguage(normalized);
        });
    }
    /** Replays the latest offline language choice. Returns false while still pending. */
    reconcilePendingLanguage(identity) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalized = normalizeIdentity(identity);
            const key = this.pendingKey(normalized);
            const existing = this.preferenceInFlight.get(key);
            if (existing)
                return existing;
            let request;
            request = this.performPendingLanguageReconciliation(normalized, key).finally(() => {
                if (this.preferenceInFlight.get(key) === request) {
                    this.preferenceInFlight.delete(key);
                }
            });
            this.preferenceInFlight.set(key, request);
            return request;
        });
    }
    performPendingLanguageReconciliation(normalized, key) {
        return __awaiter(this, void 0, void 0, function* () {
            // Loop because a newer offline choice may be written while PATCH is in flight.
            for (;;) {
                const raw = yield this.safeGet(key);
                if (!raw)
                    return true;
                let pending;
                try {
                    pending = JSON.parse(raw);
                    if (pending.schemaVersion !== 1 ||
                        pending.userId !== normalized.userId ||
                        pending.organizationId !== normalized.organizationId) {
                        yield this.config.storage.removeItem(key);
                        return true;
                    }
                    pending.language = normalizeLanguage(pending.language);
                }
                catch (_a) {
                    yield this.config.storage.removeItem(key);
                    return true;
                }
                if (!(yield this.checkHealth()))
                    return false;
                const token = yield this.config.getAccessToken();
                if (!token)
                    return false;
                try {
                    const response = yield this.config.fetch(this.url(this.config.preferenceEndpoint), {
                        method: "PATCH",
                        credentials: "omit",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ preferred_language: pending.language }),
                    });
                    if (!response.ok)
                        return false;
                    // Do not erase a newer choice that arrived while this request was running.
                    const latest = yield this.safeGet(key);
                    if (latest === raw) {
                        yield this.config.storage.removeItem(key);
                        return true;
                    }
                }
                catch (_b) {
                    return false;
                }
            }
        });
    }
    /**
     * Fetches universal-login copy before authentication. The context token is
     * carried only in X-Locale-Context and is never persisted by this runtime.
     */
    fetchAnonymousEffective(language, localeContextToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedLanguage = this.normalizeLanguageLenient(language);
            const requestKey = `${normalizedLanguage}:${localeContextToken !== null && localeContextToken !== void 0 ? localeContextToken : ""}`;
            const existing = this.anonymousInFlight.get(requestKey);
            if (existing)
                return existing;
            let request;
            request = this.performAnonymousEffectiveFetch(normalizedLanguage, localeContextToken).finally(() => {
                if (this.anonymousInFlight.get(requestKey) === request) {
                    this.anonymousInFlight.delete(requestKey);
                }
            });
            this.anonymousInFlight.set(requestKey, request);
            return request;
        });
    }
    performAnonymousEffectiveFetch(language, localeContextToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new URL(this.url(this.config.anonymousEffectiveEndpoint));
            url.searchParams.set("language", language);
            const headers = { Accept: "application/json" };
            if (localeContextToken)
                headers["X-Locale-Context"] = localeContextToken;
            const response = yield this.config.fetch(url.toString(), {
                method: "GET",
                credentials: "omit",
                headers,
            });
            if (!response.ok)
                throw httpError("anonymous locale", response.status);
            return parseEffectiveLocale(yield response.json(), this.config.application);
        });
    }
    /** Marks an identity active and drops request state when the subject/org changes. */
    setActiveIdentity(identity) {
        const normalized = identity ? normalizeIdentity(identity) : null;
        if (!sameIdentity(this.activeIdentity, normalized)) {
            this.sessionGeneration += 1;
            this.inFlight.clear();
            this.preferenceInFlight.clear();
        }
        this.activeIdentity = normalized;
    }
    /** Call after access-token replacement so no in-flight response crosses sessions. */
    notifyTokenChanged() {
        this.sessionGeneration += 1;
        this.inFlight.clear();
        this.preferenceInFlight.clear();
        this.activeIdentity = null;
    }
    /** Removes all persisted locale and pending-preference state for one identity. */
    clearIdentity(identity) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalized = normalizeIdentity(identity);
            const index = yield this.readIndex();
            const prefix = `${this.config.storageNamespace}:cache:${encode(normalized.userId)}:${encode(normalized.organizationId)}:`;
            const owned = index.filter((entry) => entry.key.startsWith(prefix));
            yield Promise.all(owned.map((entry) => this.config.storage.removeItem(entry.key)));
            yield this.config.storage.removeItem(this.pendingKey(normalized));
            yield this.writeIndex(index.filter((entry) => !entry.key.startsWith(prefix)));
            if (sameIdentity(this.activeIdentity, normalized))
                this.activeIdentity = null;
            this.sessionGeneration += 1;
            this.inFlight.clear();
            this.preferenceInFlight.clear();
        });
    }
    /** Logout hook: clears the supplied (or active) identity without affecting other users. */
    handleLogout(identity) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = identity ? normalizeIdentity(identity) : this.activeIdentity;
            if (target)
                yield this.clearIdentity(target);
            this.activeIdentity = null;
            this.sessionGeneration += 1;
            this.inFlight.clear();
            this.preferenceInFlight.clear();
        });
    }
    performEffectiveRefresh(identity, language, generation) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = yield this.hydrate(identity, language);
            if (!(yield this.checkHealth())) {
                if (cached) {
                    this.assertCurrentSession(identity, generation);
                    return { locale: cached.locale, source: "cache", notModified: false };
                }
                throw new Error("envoy-ts-auth locale: user-management is unavailable.");
            }
            yield this.reconcilePendingLanguage(identity);
            const token = yield this.config.getAccessToken();
            if (!token)
                throw new Error("envoy-ts-auth locale: authentication is required.");
            const url = new URL(this.url(this.config.effectiveEndpoint));
            url.searchParams.set("application", this.config.application);
            url.searchParams.set("language", language);
            const headers = {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };
            if (cached === null || cached === void 0 ? void 0 : cached.etag)
                headers["If-None-Match"] = cached.etag;
            try {
                const response = yield this.config.fetch(url.toString(), {
                    method: "GET",
                    credentials: "omit",
                    headers,
                });
                if (response.status === 304 && cached) {
                    this.assertCurrentSession(identity, generation);
                    return { locale: cached.locale, source: "cache", notModified: true };
                }
                if (!response.ok)
                    throw httpError("effective locale", response.status);
                const locale = parseEffectiveLocale(yield response.json(), this.config.application);
                const envelope = Object.assign(Object.assign({ schemaVersion: 1, apiOrigin: this.apiOrigin(), application: this.config.application }, identity), { language, etag: response.headers.get("ETag"), fetchedAt: this.config.now(), locale });
                this.assertCurrentSession(identity, generation);
                yield this.persistEnvelope(envelope);
                return { locale, source: "network", notModified: false };
            }
            catch (error) {
                if (cached && isTransientFailure(error)) {
                    this.assertCurrentSession(identity, generation);
                    return { locale: cached.locale, source: "cache", notModified: false };
                }
                throw error;
            }
        });
    }
    assertCurrentSession(identity, generation) {
        if (generation !== this.sessionGeneration ||
            !sameIdentity(this.activeIdentity, identity)) {
            throw new LocaleSessionChangedError();
        }
    }
    persistEnvelope(envelope) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.cacheKey(envelope, envelope.language);
            yield this.config.storage.setItem(key, JSON.stringify(envelope));
            yield this.touchIndex(key);
        });
    }
    touchIndex(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = (yield this.readIndex()).filter((entry) => entry.key !== key);
            index.push({ key, accessedAt: this.config.now() });
            index.sort((a, b) => b.accessedAt - a.accessedAt);
            const evicted = index.slice(this.config.maxCacheEntries);
            yield Promise.all(evicted.map((entry) => this.config.storage.removeItem(entry.key)));
            yield this.writeIndex(index.slice(0, this.config.maxCacheEntries));
        });
    }
    removeCacheEntry(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.storage.removeItem(key);
            const index = yield this.readIndex();
            yield this.writeIndex(index.filter((entry) => entry.key !== key));
        });
    }
    readIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = yield this.safeGet(`${this.config.storageNamespace}:index`);
            if (!raw)
                return [];
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed)
                    ? parsed.filter((entry) => entry &&
                        typeof entry.key === "string" &&
                        typeof entry.accessedAt === "number")
                    : [];
            }
            catch (_a) {
                return [];
            }
        });
    }
    writeIndex(index) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.storage.setItem(`${this.config.storageNamespace}:index`, JSON.stringify(index));
        });
    }
    safeGet(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.config.storage.getItem(key);
            }
            catch (_a) {
                return null;
            }
        });
    }
    /**
     * Read-path variant of `normalizeLanguage`. Callers such as i18n bridges can surface a
     * bogus value (an empty string, a raw Accept-Language header, a server-supplied
     * `organization_default_language`) that must not break rendering, so the read paths serve
     * `fallbackLanguage` instead of throwing. Write paths (`setPreferredLanguage`) stay strict
     * so a bad value never overwrites a stored preference.
     *
     * Because the throw was the only signal that identified the offending caller, every
     * distinct bad value is reported once through `onInvalidLanguage`; the set is per-instance
     * and capped so a high-cardinality caller cannot grow it without bound.
     */
    normalizeLanguageLenient(language) {
        try {
            return normalizeLanguage(language);
        }
        catch (_a) {
            const key = String(language);
            if (!this.warnedInvalidLanguages.has(key)) {
                if (this.warnedInvalidLanguages.size >= MAX_WARNED_LANGUAGES) {
                    this.warnedInvalidLanguages.clear();
                }
                this.warnedInvalidLanguages.add(key);
                this.config.onInvalidLanguage(key, this.config.fallbackLanguage);
            }
            return this.config.fallbackLanguage;
        }
    }
    cacheKey(identity, language) {
        const normalized = normalizeIdentity(identity);
        return [
            this.config.storageNamespace,
            "cache",
            encode(normalized.userId),
            encode(normalized.organizationId),
            encode(this.apiOrigin()),
            encode(this.config.application),
            encode(normalizeLanguage(language)),
        ].join(":");
    }
    pendingKey(identity) {
        const normalized = normalizeIdentity(identity);
        return `${this.config.storageNamespace}:pending:${encode(normalized.userId)}:${encode(normalized.organizationId)}`;
    }
    isMatchingEnvelope(envelope, identity, language) {
        return ((envelope === null || envelope === void 0 ? void 0 : envelope.schemaVersion) === 1 &&
            envelope.apiOrigin === this.apiOrigin() &&
            envelope.application === this.config.application &&
            envelope.userId === identity.userId &&
            envelope.organizationId === identity.organizationId &&
            envelope.language === language &&
            isEffectiveLocale(envelope.locale, this.config.application));
    }
    url(path) {
        // Endpoints resolve relative to the base so a path-prefixed base (e.g. a dev proxy's
        // "/user-api") is preserved. Strip a leading slash — which would reset resolution to the
        // origin and drop the prefix — and guarantee a trailing slash, since a missing one hits the
        // backend's APPEND_SLASH 301 and a redirect can drop the Authorization header.
        const relative = path.replace(/^\/+/, "");
        const [pathname, query] = relative.split(/(?=[?#])/, 2);
        const withTrailingSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
        return new URL(`${withTrailingSlash}${query !== null && query !== void 0 ? query : ""}`, `${this.config.apiBaseUrl}/`).toString();
    }
    apiOrigin() {
        return new URL(this.config.apiBaseUrl).origin;
    }
}
exports.LocaleRuntime = LocaleRuntime;
function parseEffectiveLocale(value, application) {
    if (!isEffectiveLocale(value, application)) {
        throw new LocalePayloadError();
    }
    return value;
}
function isEffectiveLocale(value, application) {
    if (!value || typeof value !== "object")
        return false;
    const locale = value;
    return (locale.application === application &&
        typeof locale.requested_language === "string" &&
        typeof locale.resolved_language === "string" &&
        typeof locale.revision === "string" &&
        Array.isArray(locale.available_languages) &&
        locale.available_languages.every((item) => typeof item === "string") &&
        isTranslationObject(locale.translations));
}
function isTranslationObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    return Object.values(value).every((leaf) => typeof leaf === "string" || isTranslationObject(leaf));
}
function normalizeIdentity(identity) {
    return {
        userId: normalizeSegment(String(identity.userId), "userId"),
        organizationId: normalizeSegment(String(identity.organizationId), "organizationId"),
    };
}
function normalizeLanguage(language) {
    const normalized = language.trim().replace(/_/g, "-").toLowerCase();
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(normalized)) {
        throw new Error("envoy-ts-auth locale: invalid language code.");
    }
    return normalized;
}
function normalizeSegment(value, name) {
    const normalized = value.trim();
    if (!normalized) {
        throw new Error(`envoy-ts-auth locale: ${name} is required.`);
    }
    if (name === "application" &&
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
        throw new Error("envoy-ts-auth locale: application must be a lowercase slug.");
    }
    return normalized;
}
function encode(value) {
    return encodeURIComponent(value);
}
function sameIdentity(left, right) {
    return (left === right ||
        Boolean(left &&
            right &&
            left.userId === right.userId &&
            left.organizationId === right.organizationId));
}
class LocaleHttpError extends Error {
    constructor(operation, status) {
        super(`envoy-ts-auth locale: ${operation} request failed (${status}).`);
        this.status = status;
    }
}
class LocalePayloadError extends Error {
    constructor() {
        super("envoy-ts-auth locale: invalid effective locale response.");
    }
}
class LocaleSessionChangedError extends Error {
    constructor() {
        super("envoy-ts-auth locale: session changed during request.");
    }
}
function httpError(operation, status) {
    return new LocaleHttpError(operation, status);
}
function isTransientFailure(error) {
    if (error instanceof LocalePayloadError ||
        error instanceof LocaleSessionChangedError ||
        (error instanceof Error &&
            (error.name === "AbortError" || error instanceof SyntaxError))) {
        return false;
    }
    return (!(error instanceof LocaleHttpError) ||
        error.status === 408 ||
        error.status === 429 ||
        error.status >= 500);
}
