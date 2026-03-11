import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { registerModelTools } from "./models.js";
import { registerChatTools } from "./chat.js";
import { registerTaskTools } from "./tasks.js";
import { registerModerationTools } from "./moderation.js";
import { registerImageTools } from "./images.js";
import { registerAudioTools } from "./audio.js";
import { registerVideoTools } from "./videos.js";
import { registerMusicTools } from "./music.js";
import { registerManagementTools } from "./management.js";

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
