import { promises as fs } from "node:fs";
import path from "node:path";

const MIME_BY_EXT = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".bmp", "image/bmp"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".mpeg", "audio/mpeg"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".ogg", "audio/ogg"],
  [".flac", "audio/flac"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"],
  [".mkv", "video/x-matroska"],
  [".avi", "video/x-msvideo"]
]);

export async function mediaInputToUrl(value, explicitMimeType = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error("Missing media input.");
  }

  if (isUrl(raw) || raw.startsWith("data:")) {
    return raw;
  }

  const absolutePath = path.resolve(raw);
  await assertLocalFileSize(absolutePath);
  const bytes = await fs.readFile(absolutePath);
  const mimeType = explicitMimeType || inferMimeType(absolutePath);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

async function assertLocalFileSize(filePath) {
  const maxMb = Number.parseFloat(process.env.MIMO_MAX_LOCAL_MEDIA_MB || "50");
  const maxBytes = Number.isFinite(maxMb) && maxMb > 0 ? maxMb * 1024 * 1024 : 50 * 1024 * 1024;
  const stat = await fs.stat(filePath);
  if (stat.size > maxBytes) {
    throw new Error(
      `Local media file is too large: ${filePath} is ${Math.ceil(stat.size / 1024 / 1024)}MB; limit is ${maxMb}MB. Set MIMO_MAX_LOCAL_MEDIA_MB to override.`
    );
  }
}

export function inferMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT.get(ext) || "application/octet-stream";
}

export async function writeBase64File(base64Data, outputPath, extension = "wav") {
  if (!base64Data) {
    throw new Error("MiMo response did not include audio data.");
  }

  const resolved = path.resolve(outputPath || defaultAudioPath(extension));
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, Buffer.from(base64Data, "base64"));
  return resolved;
}

export function defaultAudioPath(extension = "wav") {
  const safeExtension = String(extension || "wav").replace(/^\./, "");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(process.cwd(), "mimo-output", `mimo-tts-${stamp}.${safeExtension}`);
}

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
