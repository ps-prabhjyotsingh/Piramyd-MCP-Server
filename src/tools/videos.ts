import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import { buildAnimateImageForm } from "../api/multipart.js";
import type { Config } from "../config.js";

interface AsyncTaskResponse {
  task_id: string;
  [key: string]: unknown;
}

export function registerVideoTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_generate_video",
    "Generate a video from a text prompt using the Piramyd video generation API. Returns a task_id for async polling.",
    {
      prompt: z.string().describe("A text description of the video to generate"),
      model: z.string().optional().describe("The video generation model to use"),
      duration: z.number().optional().describe("Video duration in seconds"),
      fps: z.number().int().optional().describe("Frames per second"),
      width: z.number().int().optional().describe("Video width in pixels"),
      height: z.number().int().optional().describe("Video height in pixels"),
      negative_prompt: z.string().optional().describe("What to avoid in the video"),
      seed: z.number().int().optional().describe("Random seed for reproducibility"),
    },
    async (params) => {
      try {
        const result = await piramydFetch<AsyncTaskResponse>("/v1/videos/generations", {
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

  server.tool(
    "piramyd_animate_image",
    "Animate a static image into a video using the Piramyd image-to-video API. Accepts base64-encoded image. Returns a task_id for async polling.",
    {
      image: z.string().describe("Base64-encoded image to animate"),
      model: z.string().optional().describe("The animation model to use"),
      prompt: z.string().optional().describe("Optional text prompt to guide animation"),
      duration: z.number().optional().describe("Video duration in seconds"),
      fps: z.number().int().optional().describe("Frames per second"),
      motion_bucket_id: z.number().int().optional().describe("Motion intensity (1-255, higher = more motion)"),
      cond_aug: z.number().optional().describe("Conditioning augmentation factor"),
    },
    async (params) => {
      try {
        const formData = buildAnimateImageForm(params);
        const result = await piramydFetch<AsyncTaskResponse>("/v1/videos/image-to-video", {
          method: "POST",
          formData,
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
