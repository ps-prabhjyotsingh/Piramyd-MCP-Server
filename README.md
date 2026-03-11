# Piramyd MCP Server

A TypeScript [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that wraps the [Piramyd AI API](https://api.piramyd.cloud), giving Claude Code, Warp.dev, and other MCP-compatible clients access to text, image, video, audio, and music generation — plus account management tools.

## Features

- **22 tools** covering the full Piramyd API surface
- **Two transports**: stdio (Claude Code / desktop) and HTTP+SSE (Warp.dev / web)
- **Zero extra runtime dependencies** — only `@modelcontextprotocol/sdk` and `zod`
- **Base64 file I/O** — pass images, audio, and video as base64 strings; receive binary outputs the same way
- **Async task polling** — video and music generation return a `task_id` immediately; use `piramyd_get_task` to poll

## Tools

### Chat & Text
| Tool | Description |
|------|-------------|
| `piramyd_chat` | Chat completions (OpenAI format) |
| `piramyd_messages` | Chat completions (Anthropic format) |

### Images
| Tool | Description |
|------|-------------|
| `piramyd_generate_image` | Generate an image from a text prompt |
| `piramyd_edit_image` | Edit an image with a prompt (base64 input) |

### Video
| Tool | Description |
|------|-------------|
| `piramyd_generate_video` | Generate video from text (async, returns `task_id`) |
| `piramyd_animate_image` | Animate an image to video (async, base64 input) |

### Audio
| Tool | Description |
|------|-------------|
| `piramyd_text_to_speech` | Convert text to audio (base64 output) |
| `piramyd_transcribe_audio` | Transcribe an audio file (base64 input) |

### Music
| Tool | Description |
|------|-------------|
| `piramyd_generate_music` | Generate music from a prompt (async, returns `task_id`) |

### Utilities
| Tool | Description |
|------|-------------|
| `piramyd_get_task` | Poll the status of an async task |
| `piramyd_moderate_content` | Check content against Piramyd's safety policy |

### Discovery
| Tool | Description |
|------|-------------|
| `piramyd_list_models` | List all available models |
| `piramyd_get_model` | Get details for a specific model |
| `piramyd_list_tiers` | List models grouped by subscription tier |
| `piramyd_get_capabilities` | Get the feature capability matrix |

### Management _(requires `PIRAMYD_JWT_TOKEN`)_
| Tool | Description |
|------|-------------|
| `piramyd_list_api_keys` | List your API keys |
| `piramyd_create_api_key` | Create a new API key |
| `piramyd_usage_stats` | Retrieve usage statistics |
| `piramyd_subscription` | Get current subscription details |

Management tools are only registered when `PIRAMYD_JWT_TOKEN` is set in the environment.

## Requirements

- Node.js 18+

## Installation

```bash
npm install
npm run build
```

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PIRAMYD_API_KEY` | Yes (for most tools) | — | API key for generation endpoints |
| `PIRAMYD_JWT_TOKEN` | Only for management tools | — | JWT token for management endpoints |
| `PIRAMYD_API_BASE_URL` | No | `https://api.piramyd.cloud` | Override the API base URL |
| `PORT` | No | `3000` | HTTP server port (HTTP mode only) |
| `LOG_LEVEL` | No | `error` | `silent` \| `error` \| `info` \| `debug` |

## Usage

### Claude Code CLI

Add to your `~/.claude.json` (global) or project `.mcp.json`:

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

Or with a local build:

```json
{
  "mcpServers": {
    "piramyd": {
      "command": "node",
      "args": ["/path/to/piramyd-mcp/dist/index.js"],
      "env": {
        "PIRAMYD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Warp.dev (HTTP mode)

Start the server in HTTP mode:

```bash
PIRAMYD_API_KEY=your-key node dist/index.js --http
# or
npm run start:http
```

Then connect Warp to `http://localhost:3000/mcp`.

A health check endpoint is available at `GET /health`.

### stdio (default)

```bash
PIRAMYD_API_KEY=your-key node dist/index.js
# or
npm start
```

### Development

```bash
npm run dev   # tsx watch mode
```

## Project Structure

```
src/
├── index.ts            # Entry point — transport detection
├── server.ts           # MCP server setup + tool registration
├── config.ts           # Environment loading and validation
├── api/
│   ├── client.ts       # Typed fetch wrapper (piramydFetch)
│   └── multipart.ts    # FormData builders for file upload tools
├── tools/
│   ├── index.ts        # registerAllTools() barrel
│   ├── chat.ts         # piramyd_chat, piramyd_messages
│   ├── images.ts       # piramyd_generate_image, piramyd_edit_image
│   ├── videos.ts       # piramyd_generate_video, piramyd_animate_image
│   ├── audio.ts        # piramyd_text_to_speech, piramyd_transcribe_audio
│   ├── music.ts        # piramyd_generate_music
│   ├── moderation.ts   # piramyd_moderate_content
│   ├── tasks.ts        # piramyd_get_task
│   ├── models.ts       # piramyd_list_models, piramyd_get_model
│   ├── discovery.ts    # piramyd_list_tiers, piramyd_get_capabilities
│   └── management.ts   # Management tools (JWT-gated)
└── transport/
    ├── stdio.ts        # StdioServerTransport
    └── http.ts         # StreamableHTTPServerTransport
```

## License

MIT
