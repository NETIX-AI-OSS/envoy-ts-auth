/** Browser authentication through a same-origin backend-for-frontend (BFF). */
export type BffAuthConfig = {
  /** Same-origin BFF base path, for example `/bff`. */
  baseUrl: string;
  /** Password login endpoint retained for applications that still expose it. */
  loginEndpoint?: string;
  /** Starts OAuth authorization-code login. The BFF, not JavaScript, owns PKCE and state. */
  authorizationEndpoint?: string;
  /** OAuth redirect URI handled by the BFF. Exposed for client/deployment configuration only. */
  callbackEndpoint?: string;
  sessionEndpoint?: string;
  userEndpoint?: string;
  logoutEndpoint?: string;
  /** Supplies the synchronizer token sent on unsafe requests. */
  getCsrfToken: () => string | Promise<string>;
  /** Injectable navigation hook for routers and tests. Defaults to `location.assign`. */
  navigate?: (url: string) => void;
};

export type BffSession<T> =
  | { authenticated: true; user: T }
  | { authenticated: false; user: null };

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class BffAuth {
  private readonly config: {
    baseUrl: string;
    loginEndpoint: string;
    authorizationEndpoint: string;
    callbackEndpoint: string;
    sessionEndpoint: string;
    userEndpoint: string;
    logoutEndpoint: string;
    getCsrfToken: () => string | Promise<string>;
    navigate?: (url: string) => void;
  };

  constructor(config: BffAuthConfig) {
    this.config = {
      loginEndpoint: "/login",
      authorizationEndpoint: "/oauth/authorize",
      callbackEndpoint: "/oauth/callback",
      sessionEndpoint: "/session",
      userEndpoint: "/me",
      logoutEndpoint: "/logout",
      ...config,
    };
    this.assertSameOrigin(this.config.baseUrl);
  }

  private browserOrigin(): string {
    const browserOrigin = globalThis.location?.origin;
    if (!browserOrigin) {
      throw new Error("envoy-ts-auth: BffAuth requires a browser origin.");
    }
    return browserOrigin;
  }

  private assertSameOrigin(input: string): URL {
    const browserOrigin = this.browserOrigin();
    const url = new URL(input, browserOrigin);
    if (url.origin !== browserOrigin) {
      throw new Error("envoy-ts-auth: BFF endpoints and return targets must be same-origin.");
    }
    return url;
  }

  private endpoint(path: string): URL {
    const base = this.config.baseUrl.replace(/\/$/, "");
    const suffix = path.startsWith("/") ? path : `/${path}`;
    return this.assertSameOrigin(`${base}${suffix}`);
  }

  private safeReturnTo(input?: string): string {
    const url = this.assertSameOrigin(input ?? globalThis.location.href);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  async request(input: string | URL, init: RequestInit = {}): Promise<Response> {
    const url = this.assertSameOrigin(input.toString());
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    if (UNSAFE_METHODS.has(method)) {
      headers.set("X-CSRFToken", await this.config.getCsrfToken());
    }
    return fetch(url, { ...init, method, headers, credentials: "same-origin" });
  }

  /**
   * Builds the same-origin entry point for authorization-code login. The BFF
   * must generate and retain state, nonce, and the PKCE verifier before it
   * redirects to the identity provider. No OAuth secret is stored in the browser.
   */
  getAuthorizationUrl(returnTo?: string): URL {
    const url = this.endpoint(this.config.authorizationEndpoint);
    url.searchParams.set("return_to", this.safeReturnTo(returnTo));
    return url;
  }

  /** Starts one-point login. An existing central IdP session avoids another password prompt. */
  startAuthorizationCodeLogin(returnTo?: string): void {
    const target = this.getAuthorizationUrl(returnTo).toString();
    const navigate = this.config.navigate ?? ((url: string) => globalThis.location.assign(url));
    navigate(target);
  }

  /** The same-origin callback URL to register for this application at the identity provider. */
  getOAuthCallbackUrl(): URL {
    return this.endpoint(this.config.callbackEndpoint);
  }

  async login(username: string, password: string): Promise<boolean> {
    const response = await this.request(this.endpoint(this.config.loginEndpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return response.ok;
  }

  async verifySession(): Promise<boolean> {
    const response = await this.request(this.endpoint(this.config.sessionEndpoint));
    return response.ok;
  }

  async getUser<T = Record<string, unknown>>(): Promise<T | null> {
    const response = await this.request(this.endpoint(this.config.userEndpoint));
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`BFF user request failed (${response.status}).`);
    return (await response.json()) as T;
  }

  /** Restores application state after the BFF callback has created its host-only session. */
  async bootstrap<T = Record<string, unknown>>(): Promise<BffSession<T>> {
    if (!(await this.verifySession())) return { authenticated: false, user: null };
    const user = await this.getUser<T>();
    return user === null
      ? { authenticated: false, user: null }
      : { authenticated: true, user };
  }

  async logout(): Promise<void> {
    const response = await this.request(this.endpoint(this.config.logoutEndpoint), {
      method: "POST",
    });
    if (!response.ok && response.status !== 401) {
      throw new Error(`BFF logout failed (${response.status}).`);
    }
  }
}
