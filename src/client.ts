const BASE_URL = "https://merchant-api.ifood.com.br";
const TOKEN_URL = "https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token";
const TIMEOUT = 15_000;

export class IfoodClient {
  private ifood_client_id: string;
  private ifood_client_secret: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor() {
    this.ifood_client_id = process.env.IFOOD_CLIENT_ID ?? "";
    this.ifood_client_secret = process.env.IFOOD_CLIENT_SECRET ?? "";
    if (!this.ifood_client_id || !this.ifood_client_secret) {
      throw new Error("Environment variable(s) IFOOD_CLIENT_ID and IFOOD_CLIENT_SECRET required. See https://developer.ifood.com.br/docs/");
    }
  }

  private async ensureToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: this.ifood_client_id, client_secret: this.ifood_client_secret }),
    });
    if (!response.ok) throw new Error(`iFood token error: ${response.status}`);
    const data = await response.json() as { access_token: string; expires_in?: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;
    return this.accessToken;
  }

  async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const token = await this.ensureToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`iFood HTTP ${response.status}: ${text}`);
      }
      return response.json();
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("iFood: request timeout (15s).");
      }
      throw error;
    }
  }
}
