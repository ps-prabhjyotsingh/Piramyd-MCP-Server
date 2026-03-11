import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import { buildImageEditForm } from "../api/multipart.js";
import type { Config } from "../config.js";

export function registerImageTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_generate_image",
    "Generate images from a text prompt using the Piramyd image generation API",
    {
      prompt: z.string().describe("A text description of the desired image"),
      model: z.string().optional().describe("The image generation model to use"),
      n: z.number().int().min(1).max(10).optional().describe("Number of images to generate (1-10)"),
      size: z.string().optional().describe("Image size, e.g. '1024x1024', '512x512'"),
      quality: z.string().optional().describe("Image quality, e.g. 'standard' or 'hd'"),
      style: z.string().optional().describe("Image style, e.g. 'vivid' or 'natural'"),
      response_format: z.enum(["url", "b64_json"]).optional().default("url").describe("Response format: 'url' or 'b64_json'"),
      user: z.string().optional().describe("A unique identifier for the end-user"),
    },
    async (params) => {
      try {
        const result = await piramydFetch<unknown>("/v1/images/generations", {
          method: "POST",
          body: params,
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
    "piramyd_edit_image",
    "Edit an existing image based on a text prompt using the Piramyd image edit API. Accepts base64-encoded images.",
    {
      image: z.string().describe("Base64-encoded PNG image to edit"),
      prompt: z.string().describe("A text description of how to edit the image"),
      mask: z.string().optional().describe("Base64-encoded PNG mask image (white areas will be edited)"),
      model: z.string().optional().describe("The image editing model to use"),
      n: z.number().int().min(1).max(10).optional().describe("Number of images to generate (1-10)"),
      size: z.string().optional().describe("Image size, e.g. '1024x1024'"),
      response_format: z.enum(["url", "b64_json"]).optional().describe("Response format: 'url' or 'b64_json'"),
    },
    async (params) => {
      try {
        const formData = buildImageEditForm(params);
        const result = await piramydFetch<unknown>("/v1/images/edits", {
          method: "POST",
          formData,
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
