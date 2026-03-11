import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import type { Config } from "../config.js";

interface AsyncTaskResponse {
  task_id: string;
  [key: string]: unknown;
}

export function registerMusicTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_generate_music",
    "Generate music from a text prompt using the Piramyd music generation API. Returns a task_id for async polling.",
    {
      prompt: z.string().describe("A text description of the music to generate"),
      model: z.string().optional().describe("The music generation model to use"),
      duration: z.number().optional().describe("Music duration in seconds"),
      temperature: z.number().min(0).max(1).optional().describe("Sampling temperature (0-1)"),
      top_k: z.number().int().optional().describe("Top-k sampling parameter"),
      top_p: z.number().min(0).max(1).optional().describe("Top-p nucleus sampling"),
      classifier_free_guidance: z.number().optional().describe("Classifier-free guidance scale"),
      seed: z.number().int().optional().describe("Random seed for reproducibility"),
    },
    async (params) => {
      try {
        const result = await piramydFetch<AsyncTaskResponse>("/v1/music/generations", {
          method: "POST",
          body: params,
          authType: "api-key",
          config,
        });
        return {
          content: [{
            type: "text",
            text: `Task queued successfully.\ntask_id: ${result.task_id}\n\nUse piramyd_get_task with this task_id to check status and retrieve the result when ready.`,
          }],
        };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
