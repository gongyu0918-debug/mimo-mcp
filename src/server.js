#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  formatChatResult,
  formatSearchResult,
  formatSpeechResult,
  searchWithMiMo,
  synthesizeSpeechWithMiMo,
  understandMediaWithMiMo
} from "./mimoClient.js";

const server = new McpServer({
  name: "mimo-mcp",
  version: "0.1.0"
});

server.registerTool(
  "mimo_web_search",
  {
    title: "MiMo Web Search",
    description: "Search the web with Xiaomi MiMo for fresh or time-sensitive information.",
    inputSchema: {
      query: z.string().min(1).describe("The question or search query."),
      force_search: z
        .boolean()
        .optional()
        .default(true)
        .describe("Force MiMo to run web search instead of deciding automatically."),
      max_keyword: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Max search keywords."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Max pages returned."),
      country: z.string().optional().describe("Approximate country."),
      region: z.string().optional().describe("Approximate region/state."),
      city: z.string().optional().describe("Approximate city."),
      max_completion_tokens: z
        .number()
        .int()
        .min(64)
        .max(8192)
        .optional()
        .describe("Max answer tokens."),
      temperature: z.number().min(0).max(2).optional().describe("Temperature."),
      top_p: z.number().min(0).max(1).optional().describe("Top-p."),
      system_prompt: z.string().optional().describe("System prompt."),
      include_raw: z.boolean().optional().default(false).describe("Include raw JSON.")
    }
  },
  async (input) => {
    try {
      const result = await searchWithMiMo(input);
      return {
        content: [
          {
            type: "text",
            text: formatSearchResult(result, input.include_raw)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ]
      };
    }
  }
);

const commonGenerationFields = {
  max_completion_tokens: z
    .number()
    .int()
    .min(64)
    .max(8192)
    .optional()
    .describe("Max answer tokens."),
  temperature: z.number().min(0).max(2).optional().describe("Temperature."),
  top_p: z.number().min(0).max(1).optional().describe("Top-p."),
  system_prompt: z.string().optional().describe("System prompt."),
      include_raw: z.boolean().optional().default(false).describe("Include raw JSON.")
};

function mediaToolInput(extra = {}) {
  return {
    prompt: z.string().optional().describe("Question about the media."),
    media: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe("URL, data URI, local path, or array."),
    media_url: z.string().optional().describe("Public URL or data URI."),
    media_path: z.string().optional().describe("Local file path."),
    mime_type: z.string().optional().describe("MIME type for local file."),
    model: z.string().optional().describe("Model override."),
    ...commonGenerationFields,
    ...extra
  };
}

server.registerTool(
  "mimo_image_understand",
  {
    title: "MiMo Image Understanding",
    description: "Analyze images with Xiaomi MiMo.",
    inputSchema: mediaToolInput()
  },
  async (input) => runTextTool(() => understandMediaWithMiMo("image", input), input.include_raw)
);

server.registerTool(
  "mimo_audio_understand",
  {
    title: "MiMo Audio Understanding",
    description: "Analyze or transcribe audio with Xiaomi MiMo.",
    inputSchema: mediaToolInput()
  },
  async (input) => runTextTool(() => understandMediaWithMiMo("audio", input), input.include_raw)
);

server.registerTool(
  "mimo_video_understand",
  {
    title: "MiMo Video Understanding",
    description: "Analyze video with Xiaomi MiMo.",
    inputSchema: mediaToolInput({
      fps: z.number().min(0.1).max(10).optional().describe("Frames per second."),
      media_resolution: z.enum(["default", "max"]).optional().describe("Resolution level.")
    })
  },
  async (input) => runTextTool(() => understandMediaWithMiMo("video", input), input.include_raw)
);

server.registerTool(
  "mimo_tts",
  {
    title: "MiMo Speech Synthesis",
    description: "Generate speech with Xiaomi MiMo TTS.",
    inputSchema: {
      text: z.string().min(1).describe("Text to synthesize."),
      mode: z
        .enum(["preset", "voicedesign", "voiceclone"])
        .optional()
        .default("preset")
        .describe("preset, voicedesign, or voiceclone."),
      style_prompt: z
        .string()
        .optional()
        .describe("Voice/style instruction."),
      voice: z
        .string()
        .optional()
        .describe("Built-in voice ID."),
      voice_sample: z
        .string()
        .optional()
        .describe("Voice sample URL, data URI, or local path."),
      voice_sample_mime_type: z.string().optional().describe("Voice sample MIME type."),
      format: z.enum(["wav", "pcm16"]).optional().default("wav").describe("Output format."),
      output_path: z.string().optional().describe("Audio output path."),
      model: z.string().optional().describe("Model override."),
      include_raw: z.boolean().optional().default(false).describe("Include raw metadata.")
    }
  },
  async (input) => {
    try {
      const result = await synthesizeSpeechWithMiMo(input);
      return {
        content: [
          {
            type: "text",
            text: formatSpeechResult(result, input.include_raw)
          }
        ]
      };
    } catch (error) {
      return toolError(error);
    }
  }
);

async function runTextTool(run, includeRaw = false) {
  try {
    const result = await run();
    return {
      content: [
        {
          type: "text",
          text: formatChatResult(result, includeRaw)
        }
      ]
    };
  } catch (error) {
    return toolError(error);
  }
}

function toolError(error) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: error instanceof Error ? error.message : String(error)
      }
    ]
  };
}

const transport = new StdioServerTransport();
await server.connect(transport);
