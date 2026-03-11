import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Config } from "../config.js";
import { createServer } from "../server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export async function startHttpTransport(config: Config): Promise<void> {
  const httpServer = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://localhost`);

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ status: "ok", server: "piramyd-mcp" }));
      return;
    }

    if (url.pathname === "/mcp") {
      // Add CORS headers to the response
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        res.setHeader(key, value);
      }

      // Stateless mode requires a fresh transport (and server) per request.
      // Reusing a stateless transport causes "Already connected" / message ID collision errors.
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      const server = createServer(config);
      await server.connect(transport);

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
      await transport.handleRequest(req, res, body);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  process.on("SIGINT", async () => {
    httpServer.close();
    process.exit(0);
  });

  httpServer.listen(config.httpPort, () => {
    process.stderr.write(`Piramyd MCP server started (HTTP mode) on port ${config.httpPort}\n`);
    process.stderr.write(`MCP endpoint: http://localhost:${config.httpPort}/mcp\n`);
    process.stderr.write(`Health check: http://localhost:${config.httpPort}/health\n`);
  });
}
