/**
 * iFood Merchant API client.
 *
 * Auth: OAuth 2.0 Client Credentials grant (Partner API V2).
 * Base URL: https://merchant-api.ifood.com.br
 * Token endpoint: /authentication/v1.0/oauth/token
 *
 * The client caches the access token in memory and refreshes it 60 s before
 * `expires_in` elapses. Concurrent callers share a single in-flight token
 * request via `tokenPromise` to avoid thundering herd on cold start.
 *
 * Lazy initialization: `new IfoodClient()` does NOT throw if env vars are
 * missing — the check happens on the first `.request()` call. This keeps
 * module-level `new IfoodClient()` in each tool file safe at import time
 * (important for tests that mock env vars per case).
 */

const BASE_URL = "https://merchant-api.ifood.com.br";
const TOKEN_URL = `${BASE_URL}/authentication/v1.0/oauth/token`;
const TIMEOUT_MS = 15_000;
const TOKEN_SAFETY_WINDOW_MS = 60_000;

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export class IfoodClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string> | null = null;

  /** Reset cached token — used by tests. */
  reset(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.tokenPromise = null;
  }

  private getCredentials(): { clientId: string; clientSecret: string } {
    const clientId = process.env["IFOOD_CLIENT_ID"];
    const clientSecret = process.env["IFOOD_CLIENT_SECRET"];
    if (!clientId || !clientSecret) {
      throw new Error(
        "IFOOD_CLIENT_ID and IFOOD_CLIENT_SECRET are required. " +
          "Register an app at https://developer.ifood.com.br/ to get credentials.",
      );
    }
    return { clientId, clientSecret };
  }

  private async fetchNewToken(): Promise<string> {
    const { clientId, clientSecret } = this.getCredentials();
    const body = new URLSearchParams({
      grantType: "client_credentials",
      clientId,
      clientSecret,
    });
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `iFood token error: HTTP ${response.status}${text ? ` — ${text}` : ""}`,
      );
    }
    const data = (await response.json()) as TokenResponse;
    if (!data.access_token) {
      throw new Error("iFood token error: response missing access_token");
    }
    const ttlMs = (data.expires_in ?? 3600) * 1000 - TOKEN_SAFETY_WINDOW_MS;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + Math.max(ttlMs, 60_000);
    return data.access_token;
  }

  private async ensureToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    if (!this.tokenPromise) {
      this.tokenPromise = this.fetchNewToken().finally(() => {
        this.tokenPromise = null;
      });
    }
    return this.tokenPromise;
  }

  /**
   * Make an authenticated request against the iFood Merchant API.
   *
   * @param method HTTP verb (GET, POST, PATCH, PUT, DELETE)
   * @param path API path beginning with "/" (relative to BASE_URL)
   * @param body Optional JSON body for POST/PATCH/PUT
   * @returns Parsed JSON response, or `null` for 204 No Content
   */
  async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const token = await this.ensureToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (response.status === 204) return null;
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `iFood HTTP ${response.status} ${method} ${path}${text ? ` — ${text}` : ""}`,
        );
      }
      const contentType = response.headers.get?.("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return response.json();
      }
      const text = await response.text();
      return text ? text : null;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`iFood: request timeout (${TIMEOUT_MS / 1000}s) on ${method} ${path}`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
