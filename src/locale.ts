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

type NormalizedLocaleIdentity = { userId: string; organizationId: string };

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
export function createBrowserLocaleStorage(
  storage?: BrowserStorageLike,
): LocaleStorage {
  const resolved = storage ?? globalThis.localStorage;
  if (!resolved) {
    throw new Error("envoy-ts-auth locale: browser localStorage is unavailable.");
  }
  return {
    getItem: async (key) => resolved.getItem(key),
    setItem: async (key, value) => resolved.setItem(key, value),
    removeItem: async (key) => resolved.removeItem(key),
  };
}

/** Adapts React Native AsyncStorage without coupling the runtime to React Native. */
export function createAsyncStorageLocaleStorage(
  storage: AsyncStorageLike,
): LocaleStorage {
  return storage;
}

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

type CacheIndexEntry = { key: string; accessedAt: number };
type PendingLanguage = {
  schemaVersion: 1;
  userId: string;
  organizationId: string;
  language: string;
  updatedAt: number;
};

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
export class LocaleRuntime {
  private readonly config: Required<
    Pick<
      LocaleRuntimeConfig,
      | "apiBaseUrl"
      | "application"
      | "storage"
      | "getAccessToken"
      | "healthEndpoint"
      | "effectiveEndpoint"
      | "preferenceEndpoint"
      | "anonymousEffectiveEndpoint"
      | "maxCacheEntries"
      | "storageNamespace"
      | "fallbackLanguage"
      | "onInvalidLanguage"
      | "now"
    >
  > & { fetch: typeof fetch };
  /** Distinct unparseable language codes already reported; capped by MAX_WARNED_LANGUAGES. */
  private readonly warnedInvalidLanguages = new Set<string>();
  private inFlight = new Map<string, Promise<LocaleRefreshResult>>();
  private anonymousInFlight = new Map<string, Promise<EffectiveLocale>>();
  private preferenceInFlight = new Map<string, Promise<boolean>>();
  private activeIdentity: NormalizedLocaleIdentity | null = null;
  private sessionGeneration = 0;

  constructor(config: LocaleRuntimeConfig) {
    if (!config.apiBaseUrl || !config.application || !config.storage) {
      throw new Error(
        "envoy-ts-auth locale: apiBaseUrl, application, and storage are required.",
      );
    }
    if (
      !Number.isInteger(config.maxCacheEntries ?? 8) ||
      (config.maxCacheEntries ?? 8) < 1
    ) {
      throw new Error(
        "envoy-ts-auth locale: maxCacheEntries must be a positive integer.",
      );
    }
    const runtimeFetch = config.fetch ?? globalThis.fetch;
    if (!runtimeFetch) {
      throw new Error("envoy-ts-auth locale: fetch is unavailable.");
    }
    this.config = {
      apiBaseUrl: config.apiBaseUrl.replace(/\/$/, ""),
      application: normalizeSegment(config.application, "application"),
      storage: config.storage,
      getAccessToken: config.getAccessToken,
      fetch: runtimeFetch,
      healthEndpoint: config.healthEndpoint ?? "/healthz/",
      effectiveEndpoint:
        config.effectiveEndpoint ?? "/api/organization-locale/effective/",
      preferenceEndpoint: config.preferenceEndpoint ?? "/auth/me/language/",
      anonymousEffectiveEndpoint:
        config.anonymousEffectiveEndpoint ??
        "/auth/organization-locale/effective/",
      maxCacheEntries: config.maxCacheEntries ?? 8,
      storageNamespace: config.storageNamespace ?? DEFAULT_NAMESPACE,
      // Strict on purpose: a misconfigured fallback must fail at construction, not silently
      // on the first bad read.
      fallbackLanguage: normalizeLanguage(
        config.fallbackLanguage ?? FALLBACK_LANGUAGE,
      ),
      onInvalidLanguage:
        config.onInvalidLanguage ??
        ((language, fallback) => {
          console.warn(
            `envoy-ts-auth locale: invalid language code ${JSON.stringify(language)}; falling back to "${fallback}".`,
          );
        }),
      now: config.now ?? Date.now,
    };
  }

  /** Returns true only when user-management answers its health endpoint successfully. */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.config.fetch(
        this.url(this.config.healthEndpoint),
        { method: "GET" },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /** Loads an exact identity/org/app/language cache match, otherwise returns null. */
  async hydrate(
    identity: LocaleIdentity,
    language: string,
  ): Promise<LocaleCacheEnvelope | null> {
    const normalized = normalizeIdentity(identity);
    const normalizedLanguage = this.normalizeLanguageLenient(language);
    const key = this.cacheKey(normalized, normalizedLanguage);
    const raw = await this.safeGet(key);
    if (!raw) return null;
    try {
      const envelope = JSON.parse(raw) as LocaleCacheEnvelope;
      if (!this.isMatchingEnvelope(envelope, normalized, normalizedLanguage)) {
        await this.removeCacheEntry(key);
        return null;
      }
      await this.touchIndex(key);
      return envelope;
    } catch {
      await this.removeCacheEntry(key);
      return null;
    }
  }

  /**
   * Health-gated authenticated refresh with ETag support and per-request deduplication.
   * On a transient outage it returns the exact cached catalog when one exists.
   */
  async refreshEffective(
    identity: LocaleIdentity,
    language: string,
  ): Promise<LocaleRefreshResult> {
    const normalized = normalizeIdentity(identity);
    const normalizedLanguage = this.normalizeLanguageLenient(language);
    this.setActiveIdentity(normalized);
    const requestKey = this.cacheKey(normalized, normalizedLanguage);
    const existing = this.inFlight.get(requestKey);
    if (existing) return existing;

    const generation = this.sessionGeneration;
    let request: Promise<LocaleRefreshResult>;
    request = this.performEffectiveRefresh(
      normalized,
      normalizedLanguage,
      generation,
    ).finally(() => {
      if (this.inFlight.get(requestKey) === request) {
        this.inFlight.delete(requestKey);
      }
    });
    this.inFlight.set(requestKey, request);
    return request;
  }

  /** Saves the latest choice first, then attempts to reconcile it with the server. */
  async setPreferredLanguage(
    identity: LocaleIdentity,
    language: string,
  ): Promise<boolean> {
    const normalized = normalizeIdentity(identity);
    const pending: PendingLanguage = {
      schemaVersion: 1,
      ...normalized,
      language: normalizeLanguage(language),
      updatedAt: this.config.now(),
    };
    await this.config.storage.setItem(
      this.pendingKey(normalized),
      JSON.stringify(pending),
    );
    return this.reconcilePendingLanguage(normalized);
  }

  /** Replays the latest offline language choice. Returns false while still pending. */
  async reconcilePendingLanguage(identity: LocaleIdentity): Promise<boolean> {
    const normalized = normalizeIdentity(identity);
    const key = this.pendingKey(normalized);
    const existing = this.preferenceInFlight.get(key);
    if (existing) return existing;
    let request: Promise<boolean>;
    request = this.performPendingLanguageReconciliation(normalized, key).finally(
      () => {
        if (this.preferenceInFlight.get(key) === request) {
          this.preferenceInFlight.delete(key);
        }
      },
    );
    this.preferenceInFlight.set(key, request);
    return request;
  }

  private async performPendingLanguageReconciliation(
    normalized: NormalizedLocaleIdentity,
    key: string,
  ): Promise<boolean> {
    // Loop because a newer offline choice may be written while PATCH is in flight.
    for (;;) {
      const raw = await this.safeGet(key);
      if (!raw) return true;

      let pending: PendingLanguage;
      try {
        pending = JSON.parse(raw) as PendingLanguage;
        if (
          pending.schemaVersion !== 1 ||
          pending.userId !== normalized.userId ||
          pending.organizationId !== normalized.organizationId
        ) {
          await this.config.storage.removeItem(key);
          return true;
        }
        pending.language = normalizeLanguage(pending.language);
      } catch {
        await this.config.storage.removeItem(key);
        return true;
      }

      if (!(await this.checkHealth())) return false;
      const token = await this.config.getAccessToken();
      if (!token) return false;
      try {
        const response = await this.config.fetch(
          this.url(this.config.preferenceEndpoint),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preferred_language: pending.language }),
          },
        );
        if (!response.ok) return false;
        // Do not erase a newer choice that arrived while this request was running.
        const latest = await this.safeGet(key);
        if (latest === raw) {
          await this.config.storage.removeItem(key);
          return true;
        }
      } catch {
        return false;
      }
    }
  }

  /**
   * Fetches universal-login copy before authentication. The context token is
   * carried only in X-Locale-Context and is never persisted by this runtime.
   */
  async fetchAnonymousEffective(
    language: string,
    localeContextToken?: string | null,
  ): Promise<EffectiveLocale> {
    const normalizedLanguage = this.normalizeLanguageLenient(language);
    const requestKey = `${normalizedLanguage}:${localeContextToken ?? ""}`;
    const existing = this.anonymousInFlight.get(requestKey);
    if (existing) return existing;
    let request: Promise<EffectiveLocale>;
    request = this.performAnonymousEffectiveFetch(
      normalizedLanguage,
      localeContextToken,
    ).finally(() => {
      if (this.anonymousInFlight.get(requestKey) === request) {
        this.anonymousInFlight.delete(requestKey);
      }
    });
    this.anonymousInFlight.set(requestKey, request);
    return request;
  }

  private async performAnonymousEffectiveFetch(
    language: string,
    localeContextToken?: string | null,
  ): Promise<EffectiveLocale> {
    const url = new URL(this.url(this.config.anonymousEffectiveEndpoint));
    url.searchParams.set("language", language);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (localeContextToken) headers["X-Locale-Context"] = localeContextToken;
    const response = await this.config.fetch(url.toString(), {
      method: "GET",
      headers,
    });
    if (!response.ok) throw httpError("anonymous locale", response.status);
    return parseEffectiveLocale(await response.json(), this.config.application);
  }

  /** Marks an identity active and drops request state when the subject/org changes. */
  setActiveIdentity(identity: LocaleIdentity | null): void {
    const normalized = identity ? normalizeIdentity(identity) : null;
    if (!sameIdentity(this.activeIdentity, normalized)) {
      this.sessionGeneration += 1;
      this.inFlight.clear();
      this.preferenceInFlight.clear();
    }
    this.activeIdentity = normalized;
  }

  /** Call after access-token replacement so no in-flight response crosses sessions. */
  notifyTokenChanged(): void {
    this.sessionGeneration += 1;
    this.inFlight.clear();
    this.preferenceInFlight.clear();
    this.activeIdentity = null;
  }

  /** Removes all persisted locale and pending-preference state for one identity. */
  async clearIdentity(identity: LocaleIdentity): Promise<void> {
    const normalized = normalizeIdentity(identity);
    const index = await this.readIndex();
    const prefix = `${this.config.storageNamespace}:cache:${encode(normalized.userId)}:${encode(normalized.organizationId)}:`;
    const owned = index.filter((entry) => entry.key.startsWith(prefix));
    await Promise.all(owned.map((entry) => this.config.storage.removeItem(entry.key)));
    await this.config.storage.removeItem(this.pendingKey(normalized));
    await this.writeIndex(index.filter((entry) => !entry.key.startsWith(prefix)));
    if (sameIdentity(this.activeIdentity, normalized)) this.activeIdentity = null;
    this.sessionGeneration += 1;
    this.inFlight.clear();
    this.preferenceInFlight.clear();
  }

  /** Logout hook: clears the supplied (or active) identity without affecting other users. */
  async handleLogout(identity?: LocaleIdentity): Promise<void> {
    const target = identity ? normalizeIdentity(identity) : this.activeIdentity;
    if (target) await this.clearIdentity(target);
    this.activeIdentity = null;
    this.sessionGeneration += 1;
    this.inFlight.clear();
    this.preferenceInFlight.clear();
  }

  private async performEffectiveRefresh(
    identity: NormalizedLocaleIdentity,
    language: string,
    generation: number,
  ): Promise<LocaleRefreshResult> {
    const cached = await this.hydrate(identity, language);
    if (!(await this.checkHealth())) {
      if (cached) {
        this.assertCurrentSession(identity, generation);
        return { locale: cached.locale, source: "cache", notModified: false };
      }
      throw new Error("envoy-ts-auth locale: user-management is unavailable.");
    }
    await this.reconcilePendingLanguage(identity);
    const token = await this.config.getAccessToken();
    if (!token) throw new Error("envoy-ts-auth locale: authentication is required.");

    const url = new URL(this.url(this.config.effectiveEndpoint));
    url.searchParams.set("application", this.config.application);
    url.searchParams.set("language", language);
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    try {
      const response = await this.config.fetch(url.toString(), {
        method: "GET",
        headers,
      });
      if (response.status === 304 && cached) {
        this.assertCurrentSession(identity, generation);
        return { locale: cached.locale, source: "cache", notModified: true };
      }
      if (!response.ok) throw httpError("effective locale", response.status);
      const locale = parseEffectiveLocale(
        await response.json(),
        this.config.application,
      );
      const envelope: LocaleCacheEnvelope = {
        schemaVersion: 1,
        apiOrigin: this.apiOrigin(),
        application: this.config.application,
        ...identity,
        language,
        etag: response.headers.get("ETag"),
        fetchedAt: this.config.now(),
        locale,
      };
      this.assertCurrentSession(identity, generation);
      await this.persistEnvelope(envelope);
      return { locale, source: "network", notModified: false };
    } catch (error) {
      if (cached && isTransientFailure(error)) {
        this.assertCurrentSession(identity, generation);
        return { locale: cached.locale, source: "cache", notModified: false };
      }
      throw error;
    }
  }

  private assertCurrentSession(
    identity: NormalizedLocaleIdentity,
    generation: number,
  ): void {
    if (
      generation !== this.sessionGeneration ||
      !sameIdentity(this.activeIdentity, identity)
    ) {
      throw new LocaleSessionChangedError();
    }
  }

  private async persistEnvelope(envelope: LocaleCacheEnvelope): Promise<void> {
    const key = this.cacheKey(envelope, envelope.language);
    await this.config.storage.setItem(key, JSON.stringify(envelope));
    await this.touchIndex(key);
  }

  private async touchIndex(key: string): Promise<void> {
    const index = (await this.readIndex()).filter((entry) => entry.key !== key);
    index.push({ key, accessedAt: this.config.now() });
    index.sort((a, b) => b.accessedAt - a.accessedAt);
    const evicted = index.slice(this.config.maxCacheEntries);
    await Promise.all(
      evicted.map((entry) => this.config.storage.removeItem(entry.key)),
    );
    await this.writeIndex(index.slice(0, this.config.maxCacheEntries));
  }

  private async removeCacheEntry(key: string): Promise<void> {
    await this.config.storage.removeItem(key);
    const index = await this.readIndex();
    await this.writeIndex(index.filter((entry) => entry.key !== key));
  }

  private async readIndex(): Promise<CacheIndexEntry[]> {
    const raw = await this.safeGet(`${this.config.storageNamespace}:index`);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as CacheIndexEntry[];
      return Array.isArray(parsed)
        ? parsed.filter(
            (entry) =>
              entry &&
              typeof entry.key === "string" &&
              typeof entry.accessedAt === "number",
          )
        : [];
    } catch {
      return [];
    }
  }

  private async writeIndex(index: CacheIndexEntry[]): Promise<void> {
    await this.config.storage.setItem(
      `${this.config.storageNamespace}:index`,
      JSON.stringify(index),
    );
  }

  private async safeGet(key: string): Promise<string | null> {
    try {
      return await this.config.storage.getItem(key);
    } catch {
      return null;
    }
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
  private normalizeLanguageLenient(language: string): string {
    try {
      return normalizeLanguage(language);
    } catch {
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

  private cacheKey(identity: LocaleIdentity, language: string): string {
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

  private pendingKey(identity: LocaleIdentity): string {
    const normalized = normalizeIdentity(identity);
    return `${this.config.storageNamespace}:pending:${encode(normalized.userId)}:${encode(normalized.organizationId)}`;
  }

  private isMatchingEnvelope(
    envelope: LocaleCacheEnvelope,
    identity: { userId: string; organizationId: string },
    language: string,
  ): boolean {
    return (
      envelope?.schemaVersion === 1 &&
      envelope.apiOrigin === this.apiOrigin() &&
      envelope.application === this.config.application &&
      envelope.userId === identity.userId &&
      envelope.organizationId === identity.organizationId &&
      envelope.language === language &&
      isEffectiveLocale(envelope.locale, this.config.application)
    );
  }

  private url(path: string): string {
    return new URL(path, `${this.config.apiBaseUrl}/`).toString();
  }

  private apiOrigin(): string {
    return new URL(this.config.apiBaseUrl).origin;
  }
}

function parseEffectiveLocale(
  value: unknown,
  application: string,
): EffectiveLocale {
  if (!isEffectiveLocale(value, application)) {
    throw new LocalePayloadError();
  }
  return value;
}

function isEffectiveLocale(
  value: unknown,
  application: string,
): value is EffectiveLocale {
  if (!value || typeof value !== "object") return false;
  const locale = value as Partial<EffectiveLocale>;
  return (
    locale.application === application &&
    typeof locale.requested_language === "string" &&
    typeof locale.resolved_language === "string" &&
    typeof locale.revision === "string" &&
    Array.isArray(locale.available_languages) &&
    locale.available_languages.every((item) => typeof item === "string") &&
    isTranslationObject(locale.translations)
  );
}

function isTranslationObject(value: unknown): value is LocaleTranslations {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(
    (leaf) => typeof leaf === "string" || isTranslationObject(leaf),
  );
}

function normalizeIdentity(identity: LocaleIdentity): NormalizedLocaleIdentity {
  return {
    userId: normalizeSegment(String(identity.userId), "userId"),
    organizationId: normalizeSegment(
      String(identity.organizationId),
      "organizationId",
    ),
  };
}

function normalizeLanguage(language: string): string {
  const normalized = language.trim().replace(/_/g, "-").toLowerCase();
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(normalized)) {
    throw new Error("envoy-ts-auth locale: invalid language code.");
  }
  return normalized;
}

function normalizeSegment(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`envoy-ts-auth locale: ${name} is required.`);
  }
  if (
    name === "application" &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)
  ) {
    throw new Error("envoy-ts-auth locale: application must be a lowercase slug.");
  }
  return normalized;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function sameIdentity(
  left: { userId: string; organizationId: string } | null,
  right: { userId: string; organizationId: string } | null,
): boolean {
  return (
    left === right ||
    Boolean(
      left &&
        right &&
        left.userId === right.userId &&
        left.organizationId === right.organizationId,
    )
  );
}

class LocaleHttpError extends Error {
  constructor(operation: string, readonly status: number) {
    super(`envoy-ts-auth locale: ${operation} request failed (${status}).`);
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

function httpError(operation: string, status: number): Error {
  return new LocaleHttpError(operation, status);
}

function isTransientFailure(error: unknown): boolean {
  if (
    error instanceof LocalePayloadError ||
    error instanceof LocaleSessionChangedError ||
    (error instanceof Error &&
      (error.name === "AbortError" || error instanceof SyntaxError))
  ) {
    return false;
  }
  return (
    !(error instanceof LocaleHttpError) ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500
  );
}
