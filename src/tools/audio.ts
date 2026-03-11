import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { piramydFetch, PiramydApiError } from "../api/client.js";
import { buildAudioTranscriptionForm } from "../api/multipart.js";
import type { Config } from "../config.js";

export function registerAudioTools(server: McpServer, config: Config): void {
  server.tool(
    "piramyd_text_to_speech",
    "Convert text to speech audio using the Piramyd TTS API. Returns base64-encoded audio data.",
    {
      model: z.string().describe("The TTS model to use"),
      input: z.string().describe("The text to convert to speech"),
      voice: z.string().describe("The voice to use for synthesis"),
      speed: z.number().min(0.25).max(4.0).optional().describe("Speech speed (0.25-4.0, default 1.0)"),
      response_format: z.enum(["mp3", "opus", "aac", "flac", "wav", "pcm"]).optional().describe("Audio format (default: mp3)"),
    },
    async ({ model, input, voice, speed, response_format }) => {
      try {
        const { data: base64Audio } = await piramydFetch<{ data: string }>("/v1/audio/speech", {
          method: "POST",
          body: { model, input, voice, speed, response_format },
          authType: "api-key",
          returnBinary: true,
          config,
        });
        return {
          content: [{
            type: "text",
            text: `data:audio/${response_format ?? "mp3"};base64,${base64Audio}`,
          }],
        };
      } catch (err) {
        const message = err instanceof PiramydApiError ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.tool(
    "piramyd_transcribe_audio",
    "Transcribe audio to text using the Piramyd transcription API. Accepts base64-encoded audio.",
    {
      file: z.string().describe("Base64-encoded audio file to transcribe"),
      model: z.string().describe("The transcription model to use"),
      language: z.string().optional().describe("Language of the audio (ISO-639-1 code, e.g. 'en')"),
      prompt: z.string().optional().describe("Optional context/prompt to guide transcription"),
      response_format: z.enum(["json", "text", "srt", "verbose_json", "vtt"]).optional().describe("Output format (default: json)"),
      temperature: z.number().min(0).max(1).optional().describe("Sampling temperature (0-1)"),
      filename: z.string().optional().describe("Original filename with extension (e.g. 'audio.wav') to set correct MIME type"),
    },
    async (params) => {
      try {
        const formData = buildAudioTranscriptionForm(params);
        const result = await piramydFetch<unknown>("/v1/audio/transcriptions", {
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
