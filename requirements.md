# Piramyd MCP Server — Requirements

## Overview
Build a TypeScript MCP (Model Context Protocol) server that wraps the Piramyd AI API (`https://api.piramyd.cloud`) for use with Claude Code CLI, Warp.dev, and other MCP-compatible clients.

## API Reference
Base URL: `https://api.piramyd.cloud`
Full docs: `https://api.piramyd.cloud/docs`

### Authentication
- **API Key**: `Authorization: Bearer <PIRAMYD_API_KEY>` or `x-api-key: <key>` — used for all generation endpoints
- **JWT Token**: `Authorization: Bearer <PIRAMYD_JWT_TOKEN>` — used for management endpoints (usage stats, subscription, API key management)

### Key Endpoints

#### Chat / Text Generation
- `POST /v1/chat/completions` — OpenAI-format chat (Bearer)
- `POST /v1/messages` — Anthropic-format chat (Bearer or x-api-key)
- `POST /v1/completions` — Legacy OpenAI format (Bearer)

#### Image Generation
- `POST /v1/images/generations` — Generate image from text (Bearer, JSON)
  - Body: `{ model, prompt, n, size, quality, aspect_ratio, resolution, response_format }`
- `POST /v1/images/edits` — Edit image with prompt (Bearer, multipart)
  - Fields: `model, prompt, image, mask, image_url, aspect_ratio, quality`

#### Video Generation
- `POST /v1/videos/generations` — Generate video from text (Bearer, JSON, async → returns task_id)
  - Body: `{ model, prompt, duration, resolution, quality }`
- `POST /v1/videos/image-to-video` — Animate image to video (Bearer, multipart, async → returns task_id)
  - Fields: `model, prompt, image/image_url, duration, resolution`

#### Audio
- `POST /v1/audio/speech` — Text-to-speech (Bearer, JSON, returns binary audio)
  - Body: `{ model, input, voice, speed, response_format }`
- `POST /v1/audio/transcriptions` — Audio transcription (Bearer, multipart)
  - Fields: `file, model, language, prompt`

#### Music
- `POST /v1/music/generations` — Generate music (Bearer, JSON, async → returns task_id)
  - Body: `{ model, prompt, duration, creativity, seed }`

#### Tasks (Async)
- `GET /v1/tasks/{task_id}` — Check async task status (Bearer)

#### Moderation
- `POST /v1/moderations` — Content safety check (Bearer)
  - Body: `{ input, model }`

#### Model Discovery
- `GET /v1/models` — List all available models
- `GET /v1/models/{model_id}` — Get model details
- `GET /v1/tiers` — Models grouped by subscription tier
- `GET /v1/capabilities` — Feature support matrix
- `GET /v1/status/runtime` — Real-time API metrics

#### Management (JWT required)
- `GET /v1/management/api-keys` — List API keys
- `POST /v1/management/api-keys` — Create API key (`{ name, is_active, rate_limit_rpm }`)
- `PUT /v1/management/api-keys/{key_id}` — Update API key
- `DELETE /v1/management/api-keys/{key_id}` — Delete API key
- `GET /v1/management/usage/stats` — Usage statistics
- `GET /v1/management/subscription` — Current subscription details

#### Auth (for initial setup only, not MCP tools)
- `POST /v1/auth/register` — Register (`{ username, email, password }`)
- `POST /v1/auth/token` — Login (`{ username, password }`) → `{ access_token, refresh_token }`
- `POST /v1/auth/refresh` — Refresh token

---

## Functional Requirements

### MCP Tools to Expose

All tools use the prefix `piramyd_` to avoid conflicts in multi-server environments.

| Tool Name | Description | Endpoint | Auth Type |
|---|---|---|---|
| `piramyd_chat` | Chat completions (OpenAI format) | `POST /v1/chat/completions` | API Key |
| `piramyd_messages` | Chat completions (Anthropic format) | `POST /v1/messages` | API Key |
| `piramyd_generate_image` | Generate image from text prompt | `POST /v1/images/generations` | API Key |
| `piramyd_edit_image` | Edit image with prompt (base64 input) | `POST /v1/images/edits` | API Key |
| `piramyd_generate_video` | Generate video from text (async) | `POST /v1/videos/generations` | API Key |
| `piramyd_animate_image` | Animate image to video (async, base64 input) | `POST /v1/videos/image-to-video` | API Key |
| `piramyd_text_to_speech` | Convert text to audio (base64 output) | `POST /v1/audio/speech` | API Key |
| `piramyd_transcribe_audio` | Transcribe audio file (base64 input) | `POST /v1/audio/transcriptions` | API Key |
| `piramyd_generate_music` | Generate music from prompt (async) | `POST /v1/music/generations` | API Key |
| `piramyd_get_task` | Poll async task status | `GET /v1/tasks/{task_id}` | API Key |
| `piramyd_moderate_content` | Check content for policy violations | `POST /v1/moderations` | API Key |
| `piramyd_list_models` | List all available models | `GET /v1/models` | None |
| `piramyd_get_model` | Get specific model details | `GET /v1/models/{model_id}` | None |
| `piramyd_list_tiers` | List models by subscription tier | `GET /v1/tiers` | None |
| `piramyd_get_capabilities` | Get feature capability matrix | `GET /v1/capabilities` | None |
| `piramyd_list_api_keys` | List API keys (management) | `GET /v1/management/api-keys` | JWT |
| `piramyd_create_api_key` | Create new API key | `POST /v1/management/api-keys` | JWT |
| `piramyd_usage_stats` | Get usage statistics | `GET /v1/management/usage/stats` | JWT |
| `piramyd_subscription` | Get subscription details | `GET /v1/management/subscription` | JWT |

---

## Technical Requirements

### Stack
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 18+ (native fetch, FormData, crypto)
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.x
- **Schema validation**: `zod` ^3.25
- **No extra HTTP framework**: use MCP SDK's built-in Hono for HTTP transport

### Transport Support
1. **stdio** (default) — for Claude Code CLI and desktop apps
2. **HTTP with SSE** (`--http` flag or `PIRAMYD_MCP_TRANSPORT=http`) — for Warp.dev and web clients
   - Binds on `PORT` env var (default 3000)
   - Endpoint: `POST /mcp`, `GET /mcp` (SSE)
   - Health check: `GET /health`

### Configuration (Environment Variables)
| Variable | Required | Default | Description |
|---|---|---|---|
| `PIRAMYD_API_KEY` | At least one of these | — | API key for generation endpoints |
| `PIRAMYD_JWT_TOKEN` | At least one of these | — | JWT for management endpoints |
| `PIRAMYD_API_BASE_URL` | No | `https://api.piramyd.cloud` | Override API base URL |
| `PORT` | No | `3000` | HTTP server port (HTTP mode only) |
| `LOG_LEVEL` | No | `error` | `silent\|error\|info\|debug` |

### File Input/Output
- All file inputs (images, audio, video) accepted as **base64-encoded strings** in tool parameters
- Binary outputs (TTS audio) returned as **base64-encoded data URI** in tool result text
- For URL-based inputs (`image_url`), accept raw URLs as strings

### Error Handling
- Zod validation errors → human-readable field-level messages, returned as `isError: true` MCP response
- API errors (4xx/5xx) → `PiramydApiError` with `status` and `message`, surfaced via `isError: true`
- Rate limit (429) → include `Retry-After` header value in error message
- Management tools called without JWT → immediate error (no network call), clear message
- Async tools (video, music) → return `task_id` immediately with polling instructions; no blocking

---

## Project Structure

```
piramyd-mcp/
├── src/
│   ├── index.ts              # Entry point with shebang, transport detection
│   ├── server.ts             # McpServer instantiation + registerAllTools()
│   ├── config.ts             # Env loading, validation, Config interface
│   ├── transport/
│   │   ├── stdio.ts          # StdioServerTransport
│   │   └── http.ts           # StreamableHTTPServerTransport
│   ├── api/
│   │   ├── client.ts         # piramydFetch() typed wrapper
│   │   └── multipart.ts      # FormData builders for file upload tools
│   ├── tools/
│   │   ├── index.ts          # registerAllTools() barrel
│   │   ├── chat.ts           # piramyd_chat, piramyd_messages
│   │   ├── images.ts         # piramyd_generate_image, piramyd_edit_image
│   │   ├── videos.ts         # piramyd_generate_video, piramyd_animate_image
│   │   ├── audio.ts          # piramyd_text_to_speech, piramyd_transcribe_audio
│   │   ├── music.ts          # piramyd_generate_music
│   │   ├── moderation.ts     # piramyd_moderate_content
│   │   ├── tasks.ts          # piramyd_get_task
│   │   ├── models.ts         # piramyd_list_models, piramyd_get_model
│   │   ├── discovery.ts      # piramyd_list_tiers, piramyd_get_capabilities
│   │   └── management.ts     # piramyd_list_api_keys, piramyd_create_api_key, piramyd_usage_stats, piramyd_subscription
│   └── schemas/              # Optional: co-locate schemas with tools or separate
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

### Build Setup
```json
// package.json
{
  "name": "piramyd-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": { "piramyd-mcp": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "dev": "node --watch --experimental-strip-types src/index.ts",
    "start": "node dist/index.js",
    "start:http": "node dist/index.js --http"
  },
  "engines": { "node": ">=18.0.0" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.27.1",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

---

## Non-Functional Requirements

- **No streaming** in tool responses (MCP tools are request/response, not streaming)
- **No auth tools** as MCP tools — login/register is done once via env vars
- **Conditional management tools** — only registered if `PIRAMYD_JWT_TOKEN` is set
- **Publishable to npm** as `piramyd-mcp` with `npx piramyd-mcp` support
- **Zero extra runtime dependencies** beyond MCP SDK and Zod

---

## Installation & Usage

### Claude Code CLI
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

### Warp.dev (HTTP mode)
```bash
PIRAMYD_API_KEY=your-key npx piramyd-mcp --http
# Connect Warp to http://localhost:3000/mcp
```

### Manual (local build)
```bash
npm install
npm run build
PIRAMYD_API_KEY=your-key node dist/index.js         # stdio
PIRAMYD_API_KEY=your-key node dist/index.js --http  # HTTP
```

---

## Verification Plan

1. `npm run build` — no TypeScript errors
2. `PIRAMYD_API_KEY=test node dist/index.js` — server starts, no crash
3. Use MCP Inspector (`npx @modelcontextprotocol/inspector`) to verify all tools are registered and schemas are valid
4. Test `piramyd_list_models` (no auth) — verify model list returned
5. Test `piramyd_chat` with a real API key — verify chat response
6. Test `piramyd_generate_image` — verify image URL returned
7. Test `piramyd_text_to_speech` — verify base64 audio data returned
8. Test HTTP mode: start with `--http`, hit `GET /health`, connect MCP Inspector via HTTP
9. Test `piramyd_usage_stats` with `PIRAMYD_JWT_TOKEN` set
10. Verify error handling: call management tool without JWT, call chat with invalid key
