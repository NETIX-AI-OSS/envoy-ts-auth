/** Nested locale resources. Every leaf is rendered as text by the consuming app. */
export type LocaleTranslations = {
    [key: string]: string | LocaleTranslations;
};
/** Effective locale payload returned by user-management. */
export type EffectiveLocale = {
    application: string;
    requested_language: string;
    resolved_language: string;
    available_languages: string[];
    revision: string;
    translations: LocaleTranslations;
};
/** Authenticated identity used to isolate persisted locale state. */
export type LocaleIdentity = {
    userId: string | number;
    organizationId: string | number;
};
/** Persisted locale payload. Identity fields are repeated to fail closed on bad keys. */
export type LocaleCacheEnvelope = {
    schemaVersion: 1;
    apiOrigin: string;
    application: string;
    userId: string;
    organizationId: string;
    language: string;
    etag: string | null;
    fetchedAt: number;
    locale: EffectiveLocale;
};
/** Minimal asynchronous storage contract shared by browsers and React Native. */
export interface LocaleStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}
/** React Native AsyncStorage-compatible subset. */
export interface AsyncStorageLike {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}
/** Browser localStorage-compatible subset. */
export interface BrowserStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/** Adapts browser localStorage to the asynchronous locale storage contract. */
export declare function createBrowserLocaleStorage(storage?: BrowserStorageLike): LocaleStorage;
/** Adapts React Native AsyncStorage without coupling the runtime to React Native. */
export declare function createAsyncStorageLocaleStorage(storage: AsyncStorageLike): LocaleStorage;
export type LocaleRuntimeConfig = {
    apiBaseUrl: string;
    application: string;
    storage: LocaleStorage;
    getAccessToken: () => Promise<string | null>;
    /** Defaults to global fetch. */
    fetch?: typeof fetch;
    /** Defaults to `/healthz/`. */
    healthEndpoint?: string;
    /** Defaults to `/api/organization-locale/effective/`. */
    effectiveEndpoint?: string;
    /** Defaults to `/auth/me/language/`. */
    preferenceEndpoint?: string;
    /** Defaults to `/auth/organization-locale/effective/`. */
    anonymousEffectiveEndpoint?: string;
    /** Maximum cached identity/application/language entries, default 8. */
    maxCacheEntries?: number;
    /** Storage namespace, useful when an app embeds multiple environments. */
    storageNamespace?: string;
    /**
     * Locale served when a read path is handed an unparseable language, default `"en"`.
     * Set it to the deployment's own default so a misconfigured organization degrades to
     * its own language rather than to English.
     */
    fallbackLanguage?: string;
    /**
     * Called once per distinct unparseable language code a read path receives. Defaults to
     * `console.warn`; apps should route it to their error tracker, because this is the only
     * signal left once the read paths stop throwing.
     */
    onInvalidLanguage?: (language: string, fallback: string) => void;
    now?: () => number;
};
export type LocaleRefreshResult = {
    locale: EffectiveLocale;
    source: "network" | "cache";
    notModified: boolean;
};
/**
 * Framework-neutral organization locale coordinator.
 *
 * Consumers own their i18n bindings. This class only handles identity-safe
 * persistence, health-gated network reconciliation, and conditional requests.
 */
export declare class LocaleRuntime {
    private readonly config;
    /** Distinct unparseable language codes already reported; capped by MAX_WARNED_LANGUAGES. */
    private readonly warnedInvalidLanguages;
    private inFlight;
    private anonymousInFlight;
    private preferenceInFlight;
    private activeIdentity;
    private sessionGeneration;
    constructor(config: LocaleRuntimeConfig);
    /** Returns true only when user-management answers its health endpoint successfully. */
    checkHealth(): Promise<boolean>;
    /** Loads an exact identity/org/app/language cache match, otherwise returns null. */
    hydrate(identity: LocaleIdentity, language: string): Promise<LocaleCacheEnvelope | null>;
    /**
     * Health-gated authenticated refresh with ETag support and per-request deduplication.
     * On a transient outage it returns the exact cached catalog when one exists.
     */
    refreshEffective(identity: LocaleIdentity, language: string): Promise<LocaleRefreshResult>;
    /** Saves the latest choice first, then attempts to reconcile it with the server. */
    setPreferredLanguage(identity: LocaleIdentity, language: string): Promise<boolean>;
    /** Replays the latest offline language choice. Returns false while still pending. */
    reconcilePendingLanguage(identity: LocaleIdentity): Promise<boolean>;
    private performPendingLanguageReconciliation;
    /**
     * Fetches universal-login copy before authentication. The context token is
     * carried only in X-Locale-Context and is never persisted by this runtime.
     */
    fetchAnonymousEffective(language: string, localeContextToken?: string | null): Promise<EffectiveLocale>;
    private performAnonymousEffectiveFetch;
    /** Marks an identity active and drops request state when the subject/org changes. */
    setActiveIdentity(identity: LocaleIdentity | null): void;
    /** Call after access-token replacement so no in-flight response crosses sessions. */
    notifyTokenChanged(): void;
    /** Removes all persisted locale and pending-preference state for one identity. */
    clearIdentity(identity: LocaleIdentity): Promise<void>;
    /** Logout hook: clears the supplied (or active) identity without affecting other users. */
    handleLogout(identity?: LocaleIdentity): Promise<void>;
    private performEffectiveRefresh;
    private assertCurrentSession;
    private persistEnvelope;
    private touchIndex;
    private removeCacheEntry;
    private readIndex;
    private writeIndex;
    private safeGet;
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
    private normalizeLanguageLenient;
    private cacheKey;
    private pendingKey;
    private isMatchingEnvelope;
    private url;
    private apiOrigin;
}
