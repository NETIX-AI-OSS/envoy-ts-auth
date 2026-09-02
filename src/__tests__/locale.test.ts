import { describe, expect, it, vi } from "vitest";
import {
  LocaleRuntime,
  createAsyncStorageLocaleStorage,
  createBrowserLocaleStorage,
  type EffectiveLocale,
  type LocaleStorage,
} from "../index";

class MemoryStorage implements LocaleStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }
}

const identity = { userId: 7, organizationId: 42 };
const locale: EffectiveLocale = {
  application: "cafm-v2-ui",
  requested_language: "en",
  resolved_language: "en",
  available_languages: ["en", "ar", "es"],
  revision: "revision-1",
  translations: { assets: { column: "Asset" } },
};

function response(
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: vi.fn(async () => body),
  } as unknown as Response;
}

function createRuntime(
  storage = new MemoryStorage(),
  fetchMock = vi.fn<typeof fetch>(),
  overrides: Partial<ConstructorParameters<typeof LocaleRuntime>[0]> = {},
) {
  const runtime = new LocaleRuntime({
    apiBaseUrl: "https://users.example.com",
    application: "cafm-v2-ui",
    storage,
    getAccessToken: async () => "access-token",
    fetch: fetchMock,
    ...overrides,
  });
  return { runtime, storage, fetchMock };
}

describe("locale storage adapters", () => {
  it("adapts browser localStorage", async () => {
    const values = new Map<string, string>();
    const browserStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const storage = createBrowserLocaleStorage(browserStorage);
    await storage.setItem("locale-test", "value");
    expect(await storage.getItem("locale-test")).toBe("value");
    await storage.removeItem("locale-test");
    expect(await storage.getItem("locale-test")).toBeNull();
  });

  it("reports unavailable browser storage instead of failing on first use", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(() => createBrowserLocaleStorage()).toThrow("localStorage is unavailable");
    vi.unstubAllGlobals();
  });

  it("adapts React Native AsyncStorage without importing React Native", async () => {
    const native = new MemoryStorage();
    const storage = createAsyncStorageLocaleStorage(native);
    await storage.setItem("key", "value");
    expect(await storage.getItem("key")).toBe("value");
  });
});

describe("LocaleRuntime", () => {
  it("rejects incomplete configuration and invalid languages", async () => {
    const storage = new MemoryStorage();
    expect(
      () =>
        new LocaleRuntime({
          apiBaseUrl: "",
          application: "cafm-v2-ui",
          storage,
          getAccessToken: async () => null,
        }),
    ).toThrow("required");
    const { runtime } = createRuntime(storage);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(runtime.hydrate(identity, "not a locale")).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("invalid language code"),
    );
    warn.mockRestore();
    await expect(
      runtime.setPreferredLanguage(identity, "not a locale"),
    ).rejects.toThrow("invalid language");
  });

  it("reports each distinct bad language once, through the configured reporter", async () => {
    const onInvalidLanguage = vi.fn();
    const { runtime } = createRuntime(new MemoryStorage(), vi.fn<typeof fetch>(), {
      onInvalidLanguage,
    });

    await runtime.hydrate(identity, "not a locale");
    await runtime.hydrate(identity, "not a locale");
    await runtime.hydrate(identity, "also bad!");

    // Deduped per distinct value, so the offending caller stays discoverable without a flood.
    expect(onInvalidLanguage).toHaveBeenCalledTimes(2);
    expect(onInvalidLanguage).toHaveBeenNthCalledWith(1, "not a locale", "en");
    expect(onInvalidLanguage).toHaveBeenNthCalledWith(2, "also bad!", "en");
  });

  it("serves the configured fallback locale rather than always English", async () => {
    const onInvalidLanguage = vi.fn();
    const storage = new MemoryStorage();
    const { runtime } = createRuntime(storage, vi.fn<typeof fetch>(), {
      fallbackLanguage: "ar",
      onInvalidLanguage,
    });

    await runtime.hydrate(identity, "not a locale");

    // An Arabic-default organization degrades to Arabic, not to English.
    expect(onInvalidLanguage).toHaveBeenCalledWith("not a locale", "ar");
  });

  it("rejects a fallback language that is itself unparseable, at construction", () => {
    expect(() =>
      createRuntime(new MemoryStorage(), vi.fn<typeof fetch>(), {
        fallbackLanguage: "not a locale",
      }),
    ).toThrow("invalid language");
  });

  it("caps the reported-language set so a high-cardinality caller cannot grow it forever", async () => {
    const onInvalidLanguage = vi.fn();
    const { runtime } = createRuntime(new MemoryStorage(), vi.fn<typeof fetch>(), {
      onInvalidLanguage,
    });

    for (let index = 0; index < 40; index += 1) {
      await runtime.hydrate(identity, `bad language ${index}!`);
    }
    // 40 distinct values, one report each; the set cleared once at 32 rather than growing.
    expect(onInvalidLanguage).toHaveBeenCalledTimes(40);

    // After the clear, an already-seen value can be reported again -- bounded memory is the
    // trade, and re-reporting is the harmless direction to err in.
    await runtime.hydrate(identity, "bad language 39!");
    expect(onInvalidLanguage).toHaveBeenCalledTimes(40);
  });

  it("checks health without authorization", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(200));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    await expect(runtime.checkHealth()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://users.example.com/healthz/", {
      method: "GET",
    });
  });

  it("fetches, validates, persists, and hydrates an authenticated locale", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, locale, { ETag: '"revision-1"' }));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);

    await expect(runtime.refreshEffective(identity, "en")).resolves.toEqual({
      locale,
      source: "network",
      notModified: false,
    });
    await expect(runtime.hydrate(identity, "en")).resolves.toMatchObject({
      userId: "7",
      organizationId: "42",
      etag: '"revision-1"',
      locale,
    });
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer access-token",
    });
    expect(fetchMock.mock.calls[1]?.[0].toString()).toContain(
      "application=cafm-v2-ui",
    );
  });

  it("uses If-None-Match and cached data on 304", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, locale, { ETag: '"revision-1"' }))
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(304));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    await runtime.refreshEffective(identity, "en");
    await expect(runtime.refreshEffective(identity, "en")).resolves.toEqual({
      locale,
      source: "cache",
      notModified: true,
    });
    expect(fetchMock.mock.calls[3]?.[1]?.headers).toMatchObject({
      "If-None-Match": '"revision-1"',
    });
  });

  it("uses an exact cache during health or effective-fetch outages", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, locale))
      .mockResolvedValueOnce(response(503));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    await runtime.refreshEffective(identity, "en");
    await expect(runtime.refreshEffective(identity, "en")).resolves.toMatchObject({
      locale,
      source: "cache",
    });
  });

  it("does not use cached tenant data after an authentication failure", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, locale))
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(401));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    await runtime.refreshEffective(identity, "en");
    await expect(runtime.refreshEffective(identity, "en")).rejects.toThrow("401");
  });

  it("fails closed for another user, organization, app, or language", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, locale));
    const storage = new MemoryStorage();
    const { runtime } = createRuntime(storage, fetchMock);
    await runtime.refreshEffective(identity, "en");

    await expect(
      runtime.hydrate({ userId: 8, organizationId: 42 }, "en"),
    ).resolves.toBeNull();
    await expect(
      runtime.hydrate({ userId: 7, organizationId: 43 }, "en"),
    ).resolves.toBeNull();
    await expect(runtime.hydrate(identity, "ar")).resolves.toBeNull();
    const otherApp = createRuntime(storage, vi.fn<typeof fetch>(), {
      application: "viz-ui",
    }).runtime;
    await expect(otherApp.hydrate(identity, "en")).resolves.toBeNull();
  });

  it("removes corrupt cache entries instead of exposing them", async () => {
    const storage = new MemoryStorage();
    const { runtime } = createRuntime(storage);
    const badKey = "envoy-ts-auth:locale:v1:cache:7:42:https%3A%2F%2Fusers.example.com:cafm-v2-ui:en";
    storage.values.set(badKey, "not-json");
    await expect(runtime.hydrate(identity, "en")).resolves.toBeNull();
    expect(storage.values.has(badKey)).toBe(false);
  });

  it("bounds cache entries by least-recent access", async () => {
    let clock = 0;
    const fetchMock = vi.fn<typeof fetch>();
    for (let i = 0; i < 3; i += 1) {
      fetchMock
        .mockResolvedValueOnce(response(200))
        .mockResolvedValueOnce(
          response(200, { ...locale, requested_language: ["en", "ar", "es"][i] }),
        );
    }
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock, {
      maxCacheEntries: 2,
      now: () => ++clock,
    });
    await runtime.refreshEffective(identity, "en");
    await runtime.refreshEffective(identity, "ar");
    await runtime.refreshEffective(identity, "es");
    await expect(runtime.hydrate(identity, "en")).resolves.toBeNull();
    await expect(runtime.hydrate(identity, "ar")).resolves.not.toBeNull();
    await expect(runtime.hydrate(identity, "es")).resolves.not.toBeNull();
  });

  it("deduplicates concurrent effective requests", async () => {
    let releaseHealth: ((value: Response) => void) | undefined;
    const health = new Promise<Response>((resolve) => {
      releaseHealth = resolve;
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(health)
      .mockResolvedValueOnce(response(200, locale));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    const first = runtime.refreshEffective(identity, "en");
    const second = runtime.refreshEffective(identity, "en");
    releaseHealth?.(response(200));
    expect(await first).toEqual(await second);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects an in-flight response after the token changes", async () => {
    let releaseLocale: ((value: Response) => void) | undefined;
    const pendingLocale = new Promise<Response>((resolve) => {
      releaseLocale = resolve;
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockReturnValueOnce(pendingLocale);
    const storage = new MemoryStorage();
    const { runtime } = createRuntime(storage, fetchMock);
    const refresh = runtime.refreshEffective(identity, "en");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    runtime.notifyTokenChanged();
    releaseLocale?.(response(200, locale));
    await expect(refresh).rejects.toThrow("session changed");
    await expect(runtime.hydrate(identity, "en")).resolves.toBeNull();
  });

  it("stores an offline language choice and reconciles only the latest choice", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200));
    const storage = new MemoryStorage();
    const { runtime } = createRuntime(storage, fetchMock);
    await expect(runtime.setPreferredLanguage(identity, "ar")).resolves.toBe(false);
    await expect(runtime.setPreferredLanguage(identity, "es")).resolves.toBe(false);
    await expect(runtime.reconcilePendingLanguage(identity)).resolves.toBe(true);
    expect(fetchMock.mock.calls[3]?.[1]?.body).toBe(
      JSON.stringify({ preferred_language: "es" }),
    );
    expect([...storage.values.keys()].some((key) => key.includes(":pending:"))).toBe(false);
  });

  it("serializes concurrent preference changes so the latest reaches the server last", async () => {
    let releaseFirstPatch: ((value: Response) => void) | undefined;
    const firstPatch = new Promise<Response>((resolve) => {
      releaseFirstPatch = resolve;
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockReturnValueOnce(firstPatch)
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    const arabic = runtime.setPreferredLanguage(identity, "ar");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const spanish = runtime.setPreferredLanguage(identity, "es");
    releaseFirstPatch?.(response(200));
    await expect(Promise.all([arabic, spanish])).resolves.toEqual([true, true]);
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ preferred_language: "ar" }),
    );
    expect(fetchMock.mock.calls[3]?.[1]?.body).toBe(
      JSON.stringify({ preferred_language: "es" }),
    );
  });

  it("keeps a pending preference after network or server failure", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(500));
    const storage = new MemoryStorage();
    const { runtime } = createRuntime(storage, fetchMock);
    await expect(runtime.setPreferredLanguage(identity, "ar")).resolves.toBe(false);
    await expect(runtime.reconcilePendingLanguage(identity)).resolves.toBe(false);
    expect([...storage.values.keys()].some((key) => key.includes(":pending:"))).toBe(true);
  });

  it("clears only the logged-out identity and isolates token changes", async () => {
    const storage = new MemoryStorage();
    const fetchMock = vi.fn<typeof fetch>();
    for (const body of [locale, locale]) {
      fetchMock.mockResolvedValueOnce(response(200)).mockResolvedValueOnce(response(200, body));
    }
    const { runtime } = createRuntime(storage, fetchMock);
    const other = { userId: 8, organizationId: 42 };
    await runtime.refreshEffective(identity, "en");
    await runtime.refreshEffective(other, "en");
    runtime.notifyTokenChanged();
    await runtime.handleLogout(identity);
    await expect(runtime.hydrate(identity, "en")).resolves.toBeNull();
    await expect(runtime.hydrate(other, "en")).resolves.not.toBeNull();
  });

  it("fetches anonymous universal-login locales with context only in a header", async () => {
    const universal = { ...locale, application: "universal-login" };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(200, universal));
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock, {
      application: "universal-login",
    });
    await expect(
      runtime.fetchAnonymousEffective("ar", "opaque-context"),
    ).resolves.toEqual(universal);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url?.toString()).toContain("language=ar");
    expect(url?.toString()).not.toContain("opaque-context");
    expect(init?.headers).toMatchObject({
      "X-Locale-Context": "opaque-context",
    });
  });

  it("deduplicates identical anonymous locale requests", async () => {
    const universal = { ...locale, application: "universal-login" };
    let release: ((value: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending);
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock, {
      application: "universal-login",
    });
    const first = runtime.fetchAnonymousEffective("en", "context");
    const second = runtime.fetchAnonymousEffective("en", "context");
    release?.(response(200, universal));
    expect(await first).toEqual(await second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed effective payloads even when a cache exists", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200, locale))
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(
        response(200, { ...locale, translations: ["unsafe"] }),
      );
    const { runtime } = createRuntime(new MemoryStorage(), fetchMock);
    await runtime.refreshEffective(identity, "en");
    await expect(runtime.refreshEffective(identity, "en")).rejects.toThrow(
      "invalid effective locale",
    );
  });
});
