import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import type { Config } from "../config.js";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).describe("The role of the message author"),
  content: z.string().describe("The content of the message"),
});

export function registerChatTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_chat",
    "Send a chat completion request to the Piramyd AI API (OpenAI-compatible format)",
    {
      model: z.string().describe("The model to use for completion"),
      messages: z.array(MessageSchema).describe("Array of messages in the conversation"),
      max_tokens: z.number().int().positive().optional().describe("Maximum tokens to generate"),
      temperature: z.number().min(0).max(2).optional().describe("Sampling temperature (0-2)"),
      top_p: z.number().min(0).max(1).optional().describe("Top-p nucleus sampling"),
      frequency_penalty: z.number().min(-2).max(2).optional().describe("Frequency penalty (-2 to 2)"),
      presence_penalty: z.number().min(-2).max(2).optional().describe("Presence penalty (-2 to 2)"),
      stop: z.union([z.string(), z.array(z.string())]).optional().describe("Stop sequences"),
      n: z.number().int().positive().optional().describe("Number of completions to generate"),
      user: z.string().optional().describe("A unique identifier for the end-user"),
    },
    async (params) => {
      try {
        const result = await piramydFetch<unknown>("/v1/chat/completions", {
          method: "POST",
          body: { ...params, stream: false },
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

  server.tool(
    "piramyd_messages",
    "Send a message request to the Piramyd AI API (Anthropic-compatible format)",
    {
      model: z.string().describe("The model to use"),
      messages: z.array(MessageSchema).describe("Array of messages in the conversation"),
      max_tokens: z.number().int().positive().describe("Maximum tokens to generate"),
      system: z.string().optional().describe("System prompt"),
      temperature: z.number().min(0).max(1).optional().describe("Sampling temperature (0-1)"),
      top_p: z.number().min(0).max(1).optional().describe("Top-p nucleus sampling"),
      top_k: z.number().int().positive().optional().describe("Top-k sampling"),
    },
    async (params) => {
      try {
        const result = await piramydFetch<unknown>("/v1/messages", {
          method: "POST",
          body: { ...params, stream: false },
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
