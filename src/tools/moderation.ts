import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import type { Config } from "../config.js";

export function registerModerationTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_moderate_content",
    "Check whether content violates usage policies using the Piramyd moderation API",
    {
      input: z.string().describe("The text content to moderate"),
      model: z.string().optional().describe("The moderation model to use (optional)"),
    },
    async ({ input, model }) => {
      try {
        const body: Record<string, unknown> = { input };
        if (model !== undefined) body.model = model;

        const result = await piramydFetch<unknown>("/v1/moderations", {
          method: "POST",
          body,
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
