#!/usr/bin/env node
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverPath = fileURLToPath(new URL("../src/server.js", import.meta.url));

const tokenPlanOnly = isTokenPlan(process.env) && !process.env.MIMO_WEB_SEARCH_API_KEY;

const cases = [
  {
    name: "web_search",
    tool: "mimo_web_search",
    skip: tokenPlanOnly
      ? "Token Plan keys do not currently support MiMo web_search in this MCP without MIMO_WEB_SEARCH_API_KEY."
      : "",
    args: {
      query: "Find the official Xiaomi MiMo Token Plan and Web Search documentation needed to configure a Claude Code MCP server. Return the key implementation facts for a developer.",
      force_search: true,
      max_keyword: 2,
      limit: 2,
      max_completion_tokens: 512
    }
  },
  {
    name: "image_understand",
    tool: "mimo_image_understand",
    args: {
      media_url: "https://example-files.cnbj1.mi-fds.com/example-files/image/image_example.png",
      prompt: "Describe this image in one concise paragraph.",
      max_completion_tokens: 512
    }
  },
  {
    name: "audio_understand",
    tool: "mimo_audio_understand",
    args: {
      media_url: "https://example-files.cnbj1.mi-fds.com/example-files/audio/audio_example.wav",
      prompt: "Transcribe or describe the audio in one concise sentence.",
      max_completion_tokens: 512
    }
  },
  {
    name: "video_understand",
    tool: "mimo_video_understand",
    args: {
      media_url: "https://example-files.cnbj1.mi-fds.com/example-files/video/video_example.mp4",
      prompt: "Describe the video and mention its audio briefly.",
      fps: 1,
      media_resolution: "default",
      max_completion_tokens: 512
    }
  },
  {
    name: "tts_preset",
    tool: "mimo_tts",
    args: {
      mode: "preset",
      voice: "mimo_default",
      text: "这是一段小米 MiMo MCP 预设音色冒烟测试音频。",
      format: "wav",
      output_path: "mimo-output/smoke-preset.wav"
    }
  },
  {
    name: "tts_voicedesign",
    tool: "mimo_tts",
    args: {
      mode: "voicedesign",
      style_prompt: "年轻男声，清晰自然，语速中等，像在做简短播报。",
      text: "这是一段小米 MiMo MCP 音色设计冒烟测试音频。",
      format: "wav",
      output_path: "mimo-output/smoke-voicedesign.wav"
    }
  },
  {
    name: "tts_voiceclone",
    tool: "mimo_tts",
    args: {
      mode: "voiceclone",
      voice_sample: "mimo-output/smoke-preset.wav",
      text: "这是一段小米 MiMo MCP 音色克隆冒烟测试音频。",
      format: "wav",
      output_path: "mimo-output/smoke-voiceclone.wav"
    }
  }
];

const client = new Client({ name: "mimo-mcp-all-smoke", version: "0.1.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  env: process.env
});

const results = [];

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = new Set(tools.tools.map((tool) => tool.name));
  for (const expected of ["mimo_web_search", "mimo_image_understand", "mimo_audio_understand", "mimo_video_understand", "mimo_tts"]) {
    if (!names.has(expected)) {
      throw new Error(`Missing MCP tool: ${expected}`);
    }
  }

  for (const testCase of cases) {
    if (testCase.skip) {
      results.push({
        name: testCase.name,
        ok: true,
        skipped: true,
        reason: testCase.skip
      });
      console.log(`skip ${testCase.name}: ${testCase.skip}`);
      continue;
    }

    const started = Date.now();
    try {
      const result = await client.callTool({
        name: testCase.tool,
        arguments: testCase.args
      });
      const text = result.content
        ?.filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n") || "";
      const outputPath = extractOutputPath(text);
      const fileOk = outputPath ? existsSync(outputPath) : undefined;

      if (result.isError) {
        throw new Error(text || "Tool returned isError=true");
      }
      if (testCase.name.startsWith("tts_") && !fileOk) {
        throw new Error(`TTS output file missing. Tool text: ${text}`);
      }

      results.push({
        name: testCase.name,
        ok: true,
        ms: Date.now() - started,
        outputPath,
        preview: compact(text)
      });
      console.log(`ok ${testCase.name} ${Date.now() - started}ms`);
    } catch (error) {
      results.push({
        name: testCase.name,
        ok: false,
        ms: Date.now() - started,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`fail ${testCase.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} finally {
  await client.close().catch(() => {});
}

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}

function extractOutputPath(text) {
  const match = text.match(/Audio written to:\s*(.+)/);
  return match?.[1]?.trim();
}

function compact(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 500);
}

function isTokenPlan(env) {
  const plan = String(env.MIMO_PLAN || "").trim().toLowerCase().replace(/_/g, "-");
  return plan === "token-plan" || String(env.MIMO_API_KEY || "").startsWith("tp-");
}
