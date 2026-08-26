import { beforeEach, describe, expect, it, vi } from "vitest";

import { BffAuth } from "../bff";

describe("BffAuth", () => {
  beforeEach(() => {
    vi.stubGlobal("location", new URL("https://app.example.com/dashboard"));
    vi.stubGlobal("fetch", vi.fn());
  });

  it("rejects cross-origin BFF endpoints", () => {
    expect(
      () => new BffAuth({ baseUrl: "https://auth.example.com", getCsrfToken: () => "csrf" }),
    ).toThrow("same-origin");
  });

  it("sends same-origin credentials and CSRF without exposing a token", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf-token" });

    await auth.logout();

    expect(fetch).toHaveBeenCalledWith(
      new URL("https://app.example.com/bff/logout"),
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: expect.any(Headers),
      }),
    );
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("X-CSRFToken")).toBe("csrf-token");
    expect("getToken" in auth).toBe(false);
  });

  it("loads the current user through the BFF session", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 7 }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf" });

    await expect(auth.getUser()).resolves.toEqual({ id: 7 });
  });

  it("starts authorization-code login through the same-origin BFF", () => {
    const navigate = vi.fn();
    const auth = new BffAuth({
      baseUrl: "/bff/auth",
      getCsrfToken: () => "csrf",
      navigate,
    });

    auth.startAuthorizationCodeLogin("/reports?period=week#chart");

    expect(navigate).toHaveBeenCalledWith(
      "https://app.example.com/bff/auth/oauth/authorize?return_to=%2Freports%3Fperiod%3Dweek%23chart",
    );
    expect(auth.getOAuthCallbackUrl().toString()).toBe(
      "https://app.example.com/bff/auth/oauth/callback",
    );
  });

  it("does not allow an external post-login return target", () => {
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf" });

    expect(() => auth.getAuthorizationUrl("https://evil.example/steal"))
      .toThrow("same-origin");
  });

  it("bootstraps an authenticated BFF session without exposing tokens", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 7, name: "Ada" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf" });

    await expect(auth.bootstrap()).resolves.toEqual({
      authenticated: true,
      user: { id: 7, name: "Ada" },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not request user data when no BFF session exists", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf" });

    await expect(auth.bootstrap()).resolves.toEqual({
      authenticated: false,
      user: null,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
