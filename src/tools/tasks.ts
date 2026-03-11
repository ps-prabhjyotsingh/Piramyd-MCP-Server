import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import type { Config } from "../config.js";

export function registerTaskTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_get_task",
    "Get the status and result of an async task (video/music generation). Poll this until status is 'completed' or 'failed'.",
    {
      task_id: z.string().describe("The task ID returned by an async generation tool"),
    },
    async ({ task_id }) => {
      try {
        const result = await piramydFetch<unknown>(`/v1/tasks/${encodeURIComponent(task_id)}`, {
          method: "GET",
          authType: "api-key",
          config,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
