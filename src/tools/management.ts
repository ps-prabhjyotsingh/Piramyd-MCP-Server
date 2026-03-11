import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import type { Config } from "../config.js";

export function registerManagementTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_list_api_keys",
    "List all API keys for your Piramyd account (requires JWT authentication)",
    {},
    async () => {
      try {
        const result = await piramydFetch<unknown>("/v1/management/api-keys", {
          method: "GET",
          authType: "jwt",
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
    "piramyd_create_api_key",
    "Create a new API key for your Piramyd account (requires JWT authentication)",
    {
      name: z.string().describe("A descriptive name for the new API key"),
      permissions: z.array(z.string()).optional().describe("List of permissions to grant to this key"),
      expires_at: z.string().optional().describe("Expiration date in ISO 8601 format (optional)"),
    },
    async (params) => {
      try {
        const result = await piramydFetch<unknown>("/v1/management/api-keys", {
          method: "POST",
          body: params,
          authType: "jwt",
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
    "piramyd_update_api_key",
    "Update an existing API key (requires JWT authentication)",
    {
      key_id: z.string().describe("The ID of the API key to update"),
      name: z.string().optional().describe("New name for the API key"),
      permissions: z.array(z.string()).optional().describe("Updated list of permissions"),
      expires_at: z.string().optional().describe("New expiration date in ISO 8601 format"),
      active: z.boolean().optional().describe("Whether the key should be active"),
    },
    async ({ key_id, ...params }) => {
      try {
        const result = await piramydFetch<unknown>(`/v1/management/api-keys/${encodeURIComponent(key_id)}`, {
          method: "PUT",
          body: params,
          authType: "jwt",
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
    "piramyd_delete_api_key",
    "Delete an API key from your Piramyd account (requires JWT authentication)",
    {
      key_id: z.string().describe("The ID of the API key to delete"),
    },
    async ({ key_id }) => {
      try {
        const result = await piramydFetch<unknown>(`/v1/management/api-keys/${encodeURIComponent(key_id)}`, {
          method: "DELETE",
          authType: "jwt",
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
    "piramyd_usage_stats",
    "Get API usage statistics for your Piramyd account (requires JWT authentication)",
    {
      start_date: z.string().optional().describe("Start date for stats range (ISO 8601 format)"),
      end_date: z.string().optional().describe("End date for stats range (ISO 8601 format)"),
      granularity: z.enum(["hour", "day", "month"]).optional().describe("Time granularity for the stats"),
    },
    async (params) => {
      try {
        const searchParams = new URLSearchParams();
        if (params.start_date) searchParams.set("start_date", params.start_date);
        if (params.end_date) searchParams.set("end_date", params.end_date);
        if (params.granularity) searchParams.set("granularity", params.granularity);
        const query = searchParams.toString();
        const path = query ? `/v1/management/usage/stats?${query}` : "/v1/management/usage/stats";

        const result = await piramydFetch<unknown>(path, {
          method: "GET",
          authType: "jwt",
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
    "piramyd_subscription",
    "Get subscription details for your Piramyd account (requires JWT authentication)",
    {},
    async () => {
      try {
        const result = await piramydFetch<unknown>("/v1/management/subscription", {
          method: "GET",
          authType: "jwt",
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
