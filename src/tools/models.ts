import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import type { Config } from "../config.js";

export function registerModelTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_list_models",
    "List all available AI models on the Piramyd platform",
    {},
    async () => {
      try {
        const result = await piramydFetch<unknown>("/v1/models", {
          method: "GET",
          authType: "none",
          config,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.tool(
    "piramyd_get_model",
    "Get details about a specific AI model by its ID",
    { model_id: z.string().describe("The model identifier") },
    async ({ model_id }) => {
      try {
        const result = await piramydFetch<unknown>(`/v1/models/${encodeURIComponent(model_id)}`, {
          method: "GET",
          authType: "none",
          config,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.tool(
    "piramyd_list_tiers",
    "List all available subscription tiers and their features",
    {},
    async () => {
      try {
        const result = await piramydFetch<unknown>("/v1/tiers", {
          method: "GET",
          authType: "none",
          config,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.tool(
    "piramyd_get_capabilities",
    "Get the capabilities and supported features of the Piramyd API",
    {},
    async () => {
      try {
        const result = await piramydFetch<unknown>("/v1/capabilities", {
          method: "GET",
          authType: "none",
          config,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.tool(
    "piramyd_get_runtime_status",
    "Get the current runtime status of the Piramyd API infrastructure",
    {},
    async () => {
      try {
        const result = await piramydFetch<unknown>("/v1/status/runtime", {
          method: "GET",
          authType: "none",
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
