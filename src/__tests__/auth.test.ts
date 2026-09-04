import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  Auth,
  isSessionError,
  __setDefaultRetrySleepForTests,
  type AuthConfig,
} from '../index'

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}))

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

const baseConfig: AuthConfig = {
  COOKIE_TOKEN_TTL: '300',
  COOKIE_REFRESH_TTL: '86400',
  COOKIE_SECURE: true,
  COOKIE_DOMAIN: '.example.com',
  BASE_DOMAIN: 'example.com',
  CURRENT_APP_DOMAIN: 'app.example.com',
  LOGIN_PAGE_URL: 'https://auth.example.com/login',
  AUTH_BASE_URL: 'https://auth.example.com',
  LAUNCHPAD_PAGE_URL: 'https://app.example.com',
  REFRESH_ENDPOINT: '/auth/token/refresh/',
  VERIFY_ENDPOINT: '/auth/token/verify/',
  TOKEN_ENDPOINT: '/auth/token/',
  ALLOW_INSECURE_BROWSER_TOKEN_STORAGE: true,
}

function stubLocation(url: string) {
  const parsed = new URL(url)
  const locationMock = {
    href: parsed.toString(),
    search: parsed.search,
    hostname: parsed.hostname,
    replace: vi.fn(),
  } as unknown as Location

  vi.stubGlobal('location', locationMock)
  return locationMock
}

describe('Auth', () => {
  let retrySleep: ReturnType<typeof vi.fn>

  beforeEach(() => {
    Auth.reset()
    vi.resetAllMocks()
    vi.unstubAllGlobals()
    // Swap real setTimeout-based retry sleep for an instant spy in tests.
    retrySleep = vi.fn(async () => {})
    __setDefaultRetrySleepForTests(retrySleep)
  })

  // ── Initialization ────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('preserves the legacy shared-cookie browser flow by default during migration', () => {
      const config = { ...baseConfig }
      delete config.ALLOW_INSECURE_BROWSER_TOKEN_STORAGE

      expect(() => Auth.initialize(config)).not.toThrow()
    })
    it('rejects JavaScript-readable browser token APIs after explicit BFF cutover', () => {
      expect(() =>
        Auth.initialize({ ...baseConfig, BROWSER_SESSION_MODE: 'bff-only' })
      ).toThrow('disabled in bff-only mode')
    })
    it('does not apply the browser cutover to React Native', () => {
      expect(() =>
        Auth.initialize({
          ...baseConfig,
          NATIVE_PLATFORM: true,
          BROWSER_SESSION_MODE: 'bff-only',
        })
      ).not.toThrow()
    })
    it('rejects an unknown browser migration mode at runtime', () => {
      expect(() =>
        Auth.initialize({
          ...baseConfig,
          BROWSER_SESSION_MODE: 'bff-onyl',
        } as unknown as AuthConfig)
      ).toThrow('BROWSER_SESSION_MODE')
    })
    it('throws when required config properties are missing', () => {
      const incomplete = { ...baseConfig } as Partial<AuthConfig>
      delete incomplete.AUTH_BASE_URL
      expect(() => Auth.initialize(incomplete as AuthConfig)).toThrow('AUTH_BASE_URL')
    })

    it('throws if called twice without reset', () => {
      Auth.initialize(baseConfig)
      expect(() => Auth.initialize(baseConfig)).toThrow('already initialized')
    })

    it('throws when current app domain is deeper than one subdomain under the base domain', () => {
      expect(() =>
        Auth.initialize({
          ...baseConfig,
          CURRENT_APP_DOMAIN: 'deep.app.example.com',
        })
      ).toThrow('CURRENT_APP_DOMAIN')
    })
  })

  describe('getInstance', () => {
    it('throws if not initialized', () => {
      expect(() => Auth.getInstance()).toThrow('not initialized')
    })

    it('returns an instance after initialization', () => {
      Auth.initialize(baseConfig)
      expect(Auth.getInstance()).toBeDefined()
    })
  })

  describe('reset', () => {
    it('allows re-initialization', () => {
      Auth.initialize(baseConfig)
      Auth.reset()
      expect(() => Auth.initialize(baseConfig)).not.toThrow()
    })
  })

  // ── Storage helpers ───────────────────────────────────────────────────────

  describe('allCookies', () => {
    it('returns unavailable on native platform', () => {
      Auth.initialize({ ...baseConfig, NATIVE_PLATFORM: true })
      expect(Auth.getInstance().allCookies()).toEqual({ message: 'Unavailable' })
    })

    it('parses document.cookie on web platform', () => {
      Auth.initialize(baseConfig)
      document.cookie = 'token=abc123'
      const result = Auth.getInstance().allCookies() as Record<string, string>
      expect(result['token']).toBe('abc123')
    })
  })

  describe('isKeyPresent', () => {
    it('returns true when key exists in document.cookie', async () => {
      Auth.initialize(baseConfig)
      document.cookie = 'mykey=myvalue'
      expect(await Auth.getInstance().isKeyPresent('mykey')).toBe(true)
    })

    it('returns false when key is absent', async () => {
      Auth.initialize(baseConfig)
      expect(await Auth.getInstance().isKeyPresent('nonexistent_key_xyz')).toBe(false)
    })
  })

  // ── Token lifecycle ───────────────────────────────────────────────────────

  describe('getToken', () => {
    it('verifies an existing token and returns it', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('stored-token')
      global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true })

      expect(await auth.getToken()).toBe('stored-token')
    })

    it('calls reviveToken when no token is present', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(false)
      vi.spyOn(auth, 'reviveToken').mockResolvedValue(undefined)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('revived-token')

      await auth.getToken()
      expect(auth.reviveToken).toHaveBeenCalled()
    })

    it('returns cached token on subsequent calls within cache window', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('cached-token')
      global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true })

      await auth.getToken()
      await auth.getToken()

      // fetch called only once; second call hits the in-memory cache
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('invalidates the cache when another login replaces the stored token', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue')
        .mockResolvedValueOnce('first-account-token')
        .mockResolvedValueOnce('second-account-token')
        .mockResolvedValueOnce('second-account-token')
      global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true })

      expect(await auth.getToken()).toBe('first-account-token')
      expect(await auth.getToken()).toBe('second-account-token')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('fails closed when verify and refresh calls fail at the network layer', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue')
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce('stored-refresh')
      vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      const clearCookies = vi.spyOn(auth, 'clearCookies')
      // Safari's failed-fetch wording; a rejection here becomes unhandled.
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Load failed'))

      await expect(auth.getToken()).resolves.toBeNull()
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(clearCookies).toHaveBeenCalled()
    })

    it('does not reread an unverified token after refresh fails', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      const getKeyValue = vi.spyOn(auth, 'getKeyValue')
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce('stored-refresh')
      vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({ ok: false, status: 401 })

      expect(await auth.getToken()).toBeNull()
      expect(getKeyValue).toHaveBeenCalledTimes(2)
    })

    it('clears a server-rejected access token without attempting refresh on 403', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('revoked-token')
      const clearCookies = vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      const redirect = vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 })

      expect(await auth.getToken()).toBeNull()
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(clearCookies).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('reviveToken', () => {
    it('returns failure status when no refresh token is present', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(false)

      expect(await auth.reviveToken()).toMatchObject({ status: 'failed' })
    })

    it('returns failure when refresh token value is null', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue(null)

      expect(await auth.reviveToken()).toMatchObject({ status: 'failed' })
    })

    it('updates access token on successful refresh', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('my-refresh-token')
      const setKeyValue = vi.spyOn(auth, 'setKeyValue').mockResolvedValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access: 'new-access-token' }),
      })

      const result = await auth.reviveToken()
      expect(result).toBe('new-access-token')
      expect(setKeyValue).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'token', value: 'new-access-token' })
      )
    })

    it('persists a rotated refresh token', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('old-refresh-token')
      const setKeyValue = vi.spyOn(auth, 'setKeyValue').mockResolvedValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access: 'new-access-token', refresh: 'new-refresh-token' }),
      })

      await auth.reviveToken()

      expect(setKeyValue).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'refresh', value: 'new-refresh-token' })
      )
    })

    it('clears the entire session when refresh is rejected', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('bad-refresh-token')
      const clearCookies = vi.spyOn(auth, 'clearCookies')
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      expect(await auth.reviveToken()).toEqual({ status: 503 })
      expect(clearCookies).toHaveBeenCalled()
    })
  })

  // ── Auth actions ──────────────────────────────────────────────────────────

  // ── Cookie policy ─────────────────────────────────────────────────────────

  describe('cookie policy', () => {
    function stubFetch() {
      const fetchMock = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ access: 'access-tok', refresh: 'refresh-tok' }),
      })
      global.fetch = fetchMock
      return fetchMock
    }

    function expectEveryCallOmitsCookies(fetchMock: ReturnType<typeof vi.fn>) {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(0)
      for (const [, init] of fetchMock.mock.calls) {
        expect(init).toMatchObject({ credentials: 'omit' })
      }
    }

    it('omits credentials when obtaining tokens', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'setKeyValue').mockResolvedValue(undefined)
      vi.spyOn(auth, 'redirectToSourcePage').mockReturnValue(undefined)
      const fetchMock = stubFetch()

      await auth.login('user', 'pass')

      expectEveryCallOmitsCookies(fetchMock)
    })

    it('omits credentials when refreshing', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('refresh-tok')
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'setKeyValue').mockResolvedValue(undefined)
      const fetchMock = stubFetch()

      await auth.reviveToken()

      expectEveryCallOmitsCookies(fetchMock)
    })

    it('omits credentials when verifying', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('access-tok')
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      const fetchMock = stubFetch()

      await auth.verifyToken()

      expectEveryCallOmitsCookies(fetchMock)
    })

    it('omits credentials when revoking on logout', async () => {
      Auth.initialize({ ...baseConfig, LOGOUT_ENDPOINT: '/auth/logout/' })
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('access-tok')
      vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      const fetchMock = stubFetch()

      await auth.logout()

      expectEveryCallOmitsCookies(fetchMock)
    })
  })

  describe('login', () => {
    it('sets token cookies and returns true on success', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      const setKeyValue = vi.spyOn(auth, 'setKeyValue').mockResolvedValue(undefined)
      vi.spyOn(auth, 'redirectToSourcePage').mockReturnValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ access: 'access-tok', refresh: 'refresh-tok' }),
      })

      expect(await auth.login('user', 'pass')).toBe(true)
      expect(setKeyValue).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'token', value: 'access-tok' })
      )
      expect(setKeyValue).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'refresh', value: 'refresh-tok' })
      )
    })

    it('invalidates the previous account cache before storing a new login', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('old-token')
      vi.spyOn(auth, 'setKeyValue').mockResolvedValue(undefined)
      vi.spyOn(auth, 'redirectToSourcePage').mockReturnValue(undefined)
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, username: 'old-account' }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ access: 'new-access', refresh: 'new-refresh' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 2, username: 'new-account' }),
        })

      expect(await auth.getUser()).toMatchObject({ id: 1 })
      expect(await auth.login('new-account', 'password')).toBe(true)
      expect(await auth.getUser()).toMatchObject({ id: 2 })
    })

    it('returns false when response is missing the refresh token', async () => {
      Auth.initialize(baseConfig)
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ access: 'access-tok' }),
      })

      expect(await Auth.getInstance().login('user', 'pass')).toBe(false)
    })
  })

  describe('logout', () => {
    it('clears storage then redirects', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      const clearCookies = vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      const redirect = vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)

      await auth.logout()
      expect(clearCookies).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalled()
    })

    it('revokes the server session when an endpoint is configured', async () => {
      Auth.initialize({ ...baseConfig, LOGOUT_ENDPOINT: '/auth/logout/' })
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getKeyValue')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      const clearCookies = vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

      await auth.logout()

      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.example.com/auth/logout/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
          body: JSON.stringify({ refresh: 'refresh-token' }),
        })
      )
      expect(clearCookies).toHaveBeenCalled()
    })

    it('still clears local state when server revocation fails', async () => {
      Auth.initialize({ ...baseConfig, LOGOUT_ENDPOINT: '/auth/logout/' })
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getKeyValue')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      const clearCookies = vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      global.fetch = vi.fn().mockRejectedValue(new TypeError('offline'))

      await expect(auth.logout()).resolves.toBeUndefined()
      expect(clearCookies).toHaveBeenCalled()
    })
  })

  describe('redirects', () => {
    it('includes continue when the current app URL matches the configured app domain', () => {
      Auth.initialize(baseConfig)
      const locationMock = stubLocation('https://app.example.com/workspace?tab=1')

      Auth.getInstance().redirectToLoginPage()

      const redirected = new URL(locationMock.href)
      expect(redirected.origin + redirected.pathname).toBe('https://auth.example.com/login')
      expect(redirected.searchParams.get('continue')).toBe(
        'https://app.example.com/workspace?tab=1'
      )
    })

    it('omits continue when the current URL is deeper than one subdomain under the base domain', () => {
      Auth.initialize(baseConfig)
      const locationMock = stubLocation('https://deep.app.example.com/workspace')

      Auth.getInstance().redirectToLoginPage()

      const redirected = new URL(locationMock.href)
      expect(redirected.origin + redirected.pathname).toBe('https://auth.example.com/login')
      expect(redirected.searchParams.has('continue')).toBe(false)
    })

    it('redirects to a validated continue URL on the base domain', () => {
      Auth.initialize(baseConfig)
      const locationMock = stubLocation('https://auth.example.com/login?continue=https%3A%2F%2Fexample.com%2Fhome')

      Auth.getInstance().redirectToSourcePage()

      expect(locationMock.replace).toHaveBeenCalledWith('https://example.com/home')
    })

    it('redirects to a validated continue URL on a single-level subdomain', () => {
      Auth.initialize(baseConfig)
      const locationMock = stubLocation('https://auth.example.com/login?continue=https%3A%2F%2Fuser.example.com%2Fhome')

      Auth.getInstance().redirectToSourcePage()

      expect(locationMock.replace).toHaveBeenCalledWith('https://user.example.com/home')
    })

    it('falls back to launchpad when continue points to a deeper subdomain', () => {
      Auth.initialize(baseConfig)
      const locationMock = stubLocation(
        'https://auth.example.com/login?continue=https%3A%2F%2Fdeep.app.example.com%2Fhome'
      )

      Auth.getInstance().redirectToSourcePage()

      expect(locationMock.replace).toHaveBeenCalledWith('https://app.example.com')
    })

    it('falls back to launchpad when continue uses a non-https scheme', () => {
      Auth.initialize(baseConfig)
      const locationMock = stubLocation(
        'https://auth.example.com/login?continue=http%3A%2F%2Fapp.example.com%2Fhome'
      )

      Auth.getInstance().redirectToSourcePage()

      expect(locationMock.replace).toHaveBeenCalledWith('https://app.example.com')
    })
  })

  // ── isLoggedIn redirect ───────────────────────────────────────────────────

  describe('isLoggedIn', () => {
    it('redirects to a validated continue URL when already logged in', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      const locationMock = stubLocation(
        'https://auth.example.com/login?continue=https%3A%2F%2Fapp.example.com%2Fdashboard'
      )

      await auth.isLoggedIn()

      expect(locationMock.replace).toHaveBeenCalledWith('https://app.example.com/dashboard')
    })

    it('falls back to launchpad when continue is on a foreign domain', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      const locationMock = stubLocation(
        'https://auth.example.com/login?continue=https%3A%2F%2Fevil.com%2Fphish'
      )

      await auth.isLoggedIn()

      expect(locationMock.replace).toHaveBeenCalledWith('https://app.example.com')
    })
  })

  // ── User info ─────────────────────────────────────────────────────────────

  describe('getUser', () => {
    it('fetches user from the API and returns data', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, username: 'testuser' }),
      })

      expect(await auth.getUser()).toEqual({ id: 1, username: 'testuser' })
    })

    it('returns cached user on subsequent calls within cache window', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      })

      await auth.getUser()
      await auth.getUser()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('does not return the previous account when shared storage changes', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue')
        .mockResolvedValueOnce('first-account-token')
        .mockResolvedValueOnce('second-account-token')
        .mockResolvedValueOnce('second-account-token')
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, username: 'first-account' }),
        })
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 2, username: 'second-account' }),
        })

      expect(await auth.getUser()).toMatchObject({ id: 1 })
      expect(await auth.getUser()).toMatchObject({ id: 2 })
    })

    it('propagates a 403 (permission denied) without redirecting or clearing cookies', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      const redirect = vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      const clearCookies = vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 })

      expect(await auth.getUser()).toBeNull()
      expect(redirect).not.toHaveBeenCalled()
      expect(clearCookies).not.toHaveBeenCalled()
      // 403 is a deterministic, non-retryable failure - only one attempt.
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('propagates a 5xx without redirecting to login, after exhausting retries', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      const redirect = vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      expect(await auth.getUser()).toBeNull()
      expect(redirect).not.toHaveBeenCalled()
      // 1 initial attempt + 2 retries (default cap) = 3 total.
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('retries a transient 500 then succeeds', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, username: 'testuser' }) })

      expect(await auth.getUser()).toEqual({ id: 1, username: 'testuser' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('gives up after the retry cap on repeated 5xx', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      expect(await auth.getUser()).toBeNull()
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('retries on 429 and respects Retry-After', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: { get: (name: string) => (name === 'Retry-After' ? '1' : null) },
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })

      expect(await auth.getUser()).toEqual({ id: 1 })
      expect(global.fetch).toHaveBeenCalledTimes(2)
      // Retry-After: 1 (second) -> 1000ms, bounded by the 2000ms cap.
      expect(retrySleep).toHaveBeenCalledWith(1000)
    })

    it('does not retry a network throw with AbortError', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      global.fetch = vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))

      expect(await auth.getUser()).toBeUndefined()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('keeps the login redirect for a 401 (session problem)', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('stale-token')
      const redirect = vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      const clearCookies = vi.spyOn(auth, 'clearCookies').mockResolvedValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 })

      await auth.getUser()
      expect(redirect).toHaveBeenCalled()
      expect(clearCookies).toHaveBeenCalled()
      // 401 is a deterministic, non-retryable failure - only one attempt.
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('resolves permission checks to false on 403 instead of redirecting', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getToken').mockResolvedValue('valid-token')
      const redirect = vi.spyOn(auth, 'redirectToLoginPage').mockReturnValue(undefined)
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 })

      expect(await auth.getPermissions()).toBeUndefined()
      expect(await auth.hasPermission('tag-view')).toBe(false)
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('isSessionError', () => {
    it('treats only 401 as a session error', () => {
      expect(isSessionError(401)).toBe(true)
      expect(isSessionError(403)).toBe(false)
      expect(isSessionError(429)).toBe(false)
      expect(isSessionError(500)).toBe(false)
      expect(isSessionError(200)).toBe(false)
    })
  })

  describe('getPermissions', () => {
    it('returns deduped permissions from groups_detailed', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getUser').mockResolvedValue({
        groups_detailed: {
          admin: { permissions: ['read', 'write'] },
          viewer: { permissions: ['read'] },
        },
      })

      expect(await auth.getPermissions()).toEqual(['read', 'write'])
    })

    it('returns empty array when user has no groups_detailed', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getUser').mockResolvedValue({ id: 1 })

      expect(await auth.getPermissions()).toEqual([])
    })

    it('unions top-level permissions with group-derived permissions', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getUser').mockResolvedValue({
        permissions: ['tag-view', 'gateway-config-apply'],
        groups_detailed: { admin: { permissions: ['tag-edit', 'tag-view'] } },
      })

      // direct + group, normalized + deduped (tag-view appears in both)
      expect(await auth.getPermissions()).toEqual(['tag-view', 'gateway-config-apply', 'tag-edit'])
    })

    it('normalises legacy module.codename entries to bare codenames', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getUser').mockResolvedValue({ permissions: ['Tags.tag-view', 'haystack.read'] })

      expect(await auth.getPermissions()).toEqual(['tag-view', 'read'])
    })
  })

  describe('hasPermission', () => {
    it('reflects the canonical permission list', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getUser').mockResolvedValue({ permissions: ['tag-view', 'tag-edit'] })

      expect(await auth.hasPermission('tag-edit')).toBe(true)
      expect(await auth.hasPermission('tag-delete')).toBe(false)
      expect(await auth.hasAnyPermission(['nope', 'tag-view'])).toBe(true)
      expect(await auth.hasAllPermissions(['tag-view', 'tag-delete'])).toBe(false)
      expect(await auth.hasAllPermissions(['tag-view', 'tag-edit'])).toBe(true)
    })
  })

  // POST call sites must never auto-retry; only the idempotent GET does.
  describe('single-attempt POST call sites', () => {
    it('login does not retry on a 503', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      await auth.login('user', 'pass')
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('reviveToken does not retry on a 503', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('my-refresh-token')
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      await auth.reviveToken()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('verifyToken does not retry on a 503', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'isKeyPresent').mockResolvedValue(true)
      vi.spyOn(auth, 'getKeyValue').mockResolvedValue('stored-token')
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      await auth.verifyToken()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGroups', () => {
    it('returns group names from groups_detailed', async () => {
      Auth.initialize(baseConfig)
      const auth = Auth.getInstance()
      vi.spyOn(auth, 'getUser').mockResolvedValue({
        groups_detailed: { admin: {}, viewer: {} },
      })

      expect(await auth.getGroups()).toEqual(['admin', 'viewer'])
    })
  })
})
