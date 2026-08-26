/** Browser authentication through a same-origin backend-for-frontend (BFF). */
export type BffAuthConfig = {
  /** Same-origin BFF base path, for example `/bff`. */
  baseUrl: string;
  loginEndpoint?: string;
  sessionEndpoint?: string;
  userEndpoint?: string;
  logoutEndpoint?: string;
  /** Supplies the synchronizer token sent on unsafe requests. */
  getCsrfToken: () => string | Promise<string>;
};

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class BffAuth {
  private readonly config: Required<Omit<BffAuthConfig, "getCsrfToken">> &
    Pick<BffAuthConfig, "getCsrfToken">;

  constructor(config: BffAuthConfig) {
    this.config = {
      loginEndpoint: "/login",
      sessionEndpoint: "/session",
      userEndpoint: "/me",
      logoutEndpoint: "/logout",
      ...config,
    };
    this.assertSameOrigin(this.config.baseUrl);
  }

  private assertSameOrigin(input: string): URL {
    const browserOrigin = globalThis.location?.origin;
    if (!browserOrigin) {
      throw new Error("envoy-ts-auth: BffAuth requires a browser origin.");
    }
    const url = new URL(input, browserOrigin);
    if (url.origin !== browserOrigin) {
      throw new Error("envoy-ts-auth: BFF endpoints must be same-origin.");
    }
    return url;
  }

  private endpoint(path: string): string {
    const base = this.config.baseUrl.replace(/\/$/, "");
    const suffix = path.startsWith("/") ? path : `/${path}`;
    return this.assertSameOrigin(`${base}${suffix}`).toString();
  }

  async request(input: string, init: RequestInit = {}): Promise<Response> {
    const url = this.assertSameOrigin(input);
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    if (UNSAFE_METHODS.has(method)) {
      headers.set("X-CSRFToken", await this.config.getCsrfToken());
    }
    return fetch(url, { ...init, method, headers, credentials: "same-origin" });
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

  async logout(): Promise<void> {
    const response = await this.request(this.endpoint(this.config.logoutEndpoint), {
      method: "POST",
    });
    if (!response.ok && response.status !== 401) {
      throw new Error(`BFF logout failed (${response.status}).`);
    }
  }
}
