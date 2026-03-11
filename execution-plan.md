# Piramyd MCP Server — Execution Plan

## Overview
Build a TypeScript MCP (Model Context Protocol) server wrapping the Piramyd AI API (`https://api.piramyd.cloud`) for use with Claude Code CLI (stdio), Warp.dev (HTTP/SSE), and other MCP clients.

---

## Gap Resolutions

| Gap | Decision |
|-----|----------|
| Dev script Node version | Use `tsx` devDep (not `--experimental-strip-types`) → Node 18 compatible |
| HTTP transport mode | Stateless (no session management) — simpler, Warp.dev compatible |
| Missing auth at startup | Server starts fine; tools return `isError: true` at call time if auth missing |
| update/delete API key tools | Include: `piramyd_update_api_key`, `piramyd_delete_api_key` |
| Runtime status tool | Include: `piramyd_get_runtime_status` wrapping `GET /v1/status/runtime` |
| Image edit mask param | Accept base64 string (consistent with `image` param) |
| `response_format` in generate_image | Expose as optional tool param (default: `url`) |
| Schema location | Co-locate Zod schemas inside each tool file (no separate `schemas/` dir) |
| Test suite | Out of scope for MVP — verify via MCP Inspector |
| CI/CD publishing | Out of scope |
| Logging in stdio mode | All log output to `stderr` only (never `stdout`) |

---

## Final Tool Inventory (22 tools)

| Category | Tool Name | Endpoint | Auth |
|----------|-----------|----------|------|
| Chat | `piramyd_chat` | `POST /v1/chat/completions` | API Key |
| Chat | `piramyd_messages` | `POST /v1/messages` | API Key |
| Images | `piramyd_generate_image` | `POST /v1/images/generations` | API Key |
| Images | `piramyd_edit_image` | `POST /v1/images/edits` (multipart) | API Key |
| Videos | `piramyd_generate_video` | `POST /v1/videos/generations` (async) | API Key |
| Videos | `piramyd_animate_image` | `POST /v1/videos/image-to-video` (multipart, async) | API Key |
| Audio | `piramyd_text_to_speech` | `POST /v1/audio/speech` | API Key |
| Audio | `piramyd_transcribe_audio` | `POST /v1/audio/transcriptions` (multipart) | API Key |
| Music | `piramyd_generate_music` | `POST /v1/music/generations` (async) | API Key |
| Tasks | `piramyd_get_task` | `GET /v1/tasks/{task_id}` | API Key |
| Moderation | `piramyd_moderate_content` | `POST /v1/moderations` | API Key |
| Models | `piramyd_list_models` | `GET /v1/models` | None |
| Models | `piramyd_get_model` | `GET /v1/models/{model_id}` | None |
| Models | `piramyd_list_tiers` | `GET /v1/tiers` | None |
| Models | `piramyd_get_capabilities` | `GET /v1/capabilities` | None |
| Models | `piramyd_get_runtime_status` | `GET /v1/status/runtime` | None |
| Management | `piramyd_list_api_keys` | `GET /v1/management/api-keys` | JWT |
| Management | `piramyd_create_api_key` | `POST /v1/management/api-keys` | JWT |
| Management | `piramyd_update_api_key` | `PUT /v1/management/api-keys/{key_id}` | JWT |
| Management | `piramyd_delete_api_key` | `DELETE /v1/management/api-keys/{key_id}` | JWT |
| Management | `piramyd_usage_stats` | `GET /v1/management/usage/stats` | JWT |
| Management | `piramyd_subscription` | `GET /v1/management/subscription` | JWT |

---

## Project Structure

```
piramyd-mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── requirements.md
├── execution-plan.md
└── src/
    ├── index.ts              # Entry point: shebang + transport detection
    ├── server.ts             # McpServer instance + calls registerAllTools()
    ├── config.ts             # Env loading, Config interface
    ├── transport/
    │   ├── stdio.ts          # StdioServerTransport + SIGINT handler
    │   └── http.ts           # StreamableHTTPServerTransport (stateless) + /health
    ├── api/
    │   ├── client.ts         # piramydFetch<T>(), PiramydApiError
    │   └── multipart.ts      # FormData builders for binary uploads
    └── tools/
        ├── index.ts          # registerAllTools() — conditionally registers management tools
        ├── chat.ts           # piramyd_chat, piramyd_messages
        ├── images.ts         # piramyd_generate_image, piramyd_edit_image
        ├── videos.ts         # piramyd_generate_video, piramyd_animate_image
        ├── audio.ts          # piramyd_text_to_speech, piramyd_transcribe_audio
        ├── music.ts          # piramyd_generate_music
        ├── moderation.ts     # piramyd_moderate_content
        ├── tasks.ts          # piramyd_get_task
        ├── models.ts         # 5 model/discovery tools
        └── management.ts     # 6 JWT-gated management tools
```

---

## Ordered Execution Steps

### Phase 1 — Scaffold
1. **`package.json`**
   - `"type": "module"`, `"bin": { "piramyd-mcp": "./dist/index.js" }`
   - `"engines": { "node": ">=18.0.0" }`
   - dependencies: `@modelcontextprotocol/sdk ^1.27.1`, `zod ^3.25.0`
   - devDependencies: `typescript ^5.7.0`, `@types/node ^22.0.0`, `tsx ^4.0.0`
   - scripts: `build: tsc`, `dev: tsx watch src/index.ts`, `start: node dist/index.js`, `start:http: node dist/index.js --http`, `typecheck: tsc --noEmit`

2. **`tsconfig.json`**
   - `"module": "NodeNext"`, `"moduleResolution": "NodeNext"` (required for MCP SDK subpath exports)
   - `"target": "ES2022"`, `"strict": true`, `"outDir": "./dist"`, `"rootDir": "./src"`
   - `"declaration": true`, `"sourceMap": true`, `"skipLibCheck": true`

3. **`.env.example`** — document all env vars with descriptions

4. **`.gitignore`** — `node_modules/`, `dist/`, `.env`

5. **Install deps**: `npm install`

### Phase 2 — Config & API Client
6. **`src/config.ts`**
   ```typescript
   export interface Config {
     apiKey: string | undefined;      // PIRAMYD_API_KEY
     jwtToken: string | undefined;    // PIRAMYD_JWT_TOKEN
     baseUrl: string;                 // PIRAMYD_API_BASE_URL, default: https://api.piramyd.cloud
     httpPort: number;                // PORT, default: 3000
   }
   export function loadConfig(): Config
   ```

7. **`src/api/client.ts`**
   - `PiramydApiError extends Error` with `status: number`, `message: string`
   - `piramydFetch<T>(path, { method, body?, formData?, authType?, returnBinary? }): Promise<T>`
   - Auth header logic: `"api-key"` → `Authorization: Bearer <apiKey>`, `"jwt"` → `Authorization: Bearer <jwtToken>`, `"none"` → no header
   - 429 handling: parse `Retry-After` header, include in error message
   - Binary mode (`returnBinary: true`): returns `{ data: string }` where `data` is base64-encoded response body

8. **`src/api/multipart.ts`**
   - `buildImageEditForm(params)` — decodes base64 image + optional mask to `Blob`, appends to `FormData`
   - `buildAnimateImageForm(params)` — same for video animation
   - `buildAudioTranscriptionForm(params)` — decodes base64 audio to `Blob`
   - All use native `FormData` + `Blob` (Node 18+)

### Phase 3 — Tools (simplest → most complex)
9. **`src/tools/models.ts`** — 5 GET tools, no/optional auth, Zod input schemas inline

10. **`src/tools/chat.ts`** — 2 tools; force `stream: false` in both schemas

11. **`src/tools/tasks.ts`** — 1 tool; `{ task_id: z.string() }` input

12. **`src/tools/moderation.ts`** — 1 tool; `{ input: z.string(), model: z.string().optional() }`

13. **`src/tools/images.ts`** — 2 tools; `piramyd_edit_image` uses `buildImageEditForm()`

14. **`src/tools/audio.ts`**
    - `piramyd_text_to_speech`: uses `returnBinary: true`, returns `data:audio/mp3;base64,...` text block
    - `piramyd_transcribe_audio`: uses `buildAudioTranscriptionForm()`

15. **`src/tools/videos.ts`** — 2 async tools; return `{ content: [{ type: "text", text: "Task started. task_id: <id>. Use piramyd_get_task to poll status." }] }`

16. **`src/tools/music.ts`** — 1 async tool; same async pattern as videos

17. **`src/tools/management.ts`** — 6 tools using `authType: "jwt"` in all calls

### Phase 4 — Server & Transports
18. **`src/tools/index.ts`**
    ```typescript
    export function registerAllTools(server: McpServer, config: Config): void {
      registerModelTools(server, config);
      registerChatTools(server, config);
      registerTaskTools(server, config);
      registerModerationTools(server, config);
      registerImageTools(server, config);
      registerAudioTools(server, config);
      registerVideoTools(server, config);
      registerMusicTools(server, config);
      if (config.jwtToken) registerManagementTools(server, config);
    }
    ```

19. **`src/server.ts`**
    ```typescript
    export function createServer(config: Config): McpServer {
      const server = new McpServer({ name: "piramyd", version: "1.0.0" });
      registerAllTools(server, config);
      return server;
    }
    ```

20. **`src/transport/stdio.ts`** — `StdioServerTransport`, `await server.connect(transport)`, handle `SIGINT`

21. **`src/transport/http.ts`** — stateless `StreamableHTTPServerTransport`; use built-in Hono from MCP SDK; add `GET /health` route; bind on `config.httpPort`

22. **`src/index.ts`**
    ```typescript
    #!/usr/bin/env node
    // detect transport, load config, create server, start transport
    ```

### Phase 5 — Verification
23. `npm run build` — zero errors
24. `node dist/index.js` — starts, exits cleanly on SIGINT
25. `npx @modelcontextprotocol/inspector node dist/index.js` — all 22 tools visible
26. Test each tool category with MCP Inspector
27. HTTP mode: `node dist/index.js --http`, test `/health`, connect Inspector via HTTP

---

## Key Design Patterns

### Tool handler template
```typescript
server.tool(
  "piramyd_example",
  "Description for the AI agent",
  { param: z.string().describe("What this param does") },
  async ({ param }) => {
    try {
      const result = await piramydFetch<ResponseType>("/v1/endpoint", {
        method: "POST",
        body: { param },
        authType: "api-key",
        config,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      const message = err instanceof PiramydApiError ? err.message : String(err);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  }
);
```

### Async task pattern
```typescript
// For video/music generation
return {
  content: [{
    type: "text",
    text: `Task queued successfully.\ntask_id: ${result.task_id}\n\nUse piramyd_get_task with this task_id to check status and retrieve the result when ready.`
  }]
};
```

### Binary output pattern (TTS)
```typescript
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
    text: `data:audio/${response_format ?? "mp3"};base64,${base64Audio}`
  }]
};
```

---

## Claude Code CLI Configuration
Add to `~/.claude.json` or project `.mcp.json`:
```json
{
  "mcpServers": {
    "piramyd": {
      "command": "npx",
      "args": ["piramyd-mcp"],
      "env": {
        "PIRAMYD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Warp.dev HTTP Configuration
```bash
PIRAMYD_API_KEY=your-key npx piramyd-mcp --http
# Connect Warp to: http://localhost:3000/mcp
```
