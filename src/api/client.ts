import type { Config } from "../config.js";

export class PiramydApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PiramydApiError";
  }
}

export interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  formData?: FormData;
  authType?: "api-key" | "jwt" | "none";
  returnBinary?: boolean;
  config: Config;
}

export async function piramydFetch<T>(
  path: string,
  options: FetchOptions,
): Promise<T> {
  const { method, body, formData, authType = "none", returnBinary = false, config } = options;

  const url = `${config.baseUrl}${path}`;

  const headers: Record<string, string> = {};

  if (authType === "api-key") {
    if (!config.apiKey) {
      throw new PiramydApiError(401, "PIRAMYD_API_KEY environment variable is not set");
    }
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  } else if (authType === "jwt") {
    if (!config.jwtToken) {
      throw new PiramydApiError(401, "PIRAMYD_JWT_TOKEN environment variable is not set");
    }
    headers["Authorization"] = `Bearer ${config.jwtToken}`;
  }

  const fetchInit: RequestInit = { method };

  if (formData) {
    fetchInit.body = formData;
    fetchInit.headers = headers;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    fetchInit.headers = headers;
    fetchInit.body = JSON.stringify(body);
  } else {
    fetchInit.headers = headers;
  }

  const response = await fetch(url, fetchInit);

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const msg = retryAfter
        ? `Rate limited. Retry after ${retryAfter} seconds.`
        : "Rate limited.";
      throw new PiramydApiError(429, msg);
    }

    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json() as { error?: { message?: string }; message?: string };
      errorMessage = errorBody?.error?.message ?? errorBody?.message ?? errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    throw new PiramydApiError(response.status, errorMessage);
  }

  if (returnBinary) {
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { data: base64 } as T;
  }

  return response.json() as Promise<T>;
}
