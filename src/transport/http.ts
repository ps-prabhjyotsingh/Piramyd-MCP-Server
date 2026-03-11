import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";

export async function startHttpTransport(server: McpServer, config: Config): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost`);

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: "piramyd-mcp" }));
      return;
    }

    if (url.pathname === "/mcp") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
      await transport.handleRequest(req, res, body);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  process.on("SIGINT", async () => {
    httpServer.close();
    await server.close();
    process.exit(0);
  });

  httpServer.listen(config.httpPort, () => {
    process.stderr.write(`Piramyd MCP server started (HTTP mode) on port ${config.httpPort}\n`);
    process.stderr.write(`MCP endpoint: http://localhost:${config.httpPort}/mcp\n`);
    process.stderr.write(`Health check: http://localhost:${config.httpPort}/health\n`);
  });
}
