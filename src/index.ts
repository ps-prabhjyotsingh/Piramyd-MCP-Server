#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

const config = loadConfig();
const server = createServer(config);

const useHttp = process.argv.includes("--http");

if (useHttp) {
  const { startHttpTransport } = await import("./transport/http.js");
  await startHttpTransport(server, config);
} else {
  const { startStdioTransport } = await import("./transport/stdio.js");
  await startStdioTransport(server);
}
