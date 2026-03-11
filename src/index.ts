#!/usr/bin/env node
import { loadConfig } from "./config.js";

const config = loadConfig();

const useHttp = process.argv.includes("--http");

if (useHttp) {
  const { startHttpTransport } = await import("./transport/http.js");
  await startHttpTransport(config);
} else {
  const { createServer } = await import("./server.js");
  const { startStdioTransport } = await import("./transport/stdio.js");
  const server = createServer(config);
  await startStdioTransport(server);
}
