export interface Config {
  apiKey: string | undefined;      // PIRAMYD_API_KEY
  jwtToken: string | undefined;    // PIRAMYD_JWT_TOKEN
  baseUrl: string;                 // PIRAMYD_API_BASE_URL, default: https://api.piramyd.cloud
  httpPort: number;                // PORT, default: 3000
}

export function loadConfig(): Config {
  return {
    apiKey: process.env.PIRAMYD_API_KEY,
    jwtToken: process.env.PIRAMYD_JWT_TOKEN,
    baseUrl: process.env.PIRAMYD_API_BASE_URL ?? "https://api.piramyd.cloud",
    httpPort: parseInt(process.env.PORT ?? "3000", 10),
  };
}
