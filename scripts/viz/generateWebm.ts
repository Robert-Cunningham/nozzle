import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import type { TimestampedText, GenerateWebmOptions, ResolvedOptions } from "./types.js"
import { buildTimeline, getVisibleTokens } from "./timeline.js"
import { renderFrame, createRenderer, closeRenderer } from "./renderFrame.js"

// Re-export types for external use
export type { TimestampedText, GenerateWebmOptions }

// Set ffmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

/**
 * Default options for video generation.
 */
const DEFAULT_OPTIONS: ResolvedOptions = {
  width: 1280,
  height: 160,
  fps: 30,
  fontSize: 20,
  backgroundColor: "#ffffff",
  holdDuration: 1000,
}

/**
 * Resolve user options with defaults.
 */
function resolveOptions(options?: GenerateWebmOptions): ResolvedOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  }
}

/**
 * Generate a unique temporary directory path.
 */
function createTempDir(): string {
  const id = randomBytes(8).toString("hex")
  const tempDir = join(tmpdir(), `webm-gen-${id}`)
  mkdirSync(tempDir, { recursive: true })
  return tempDir
}

/**
 * Generate all frames as PNG files in a temporary directory.
 */
async function generateFrames(
  input: TimestampedText[],
  output: TimestampedText[],
  options: ResolvedOptions,
  tempDir: string,
): Promise<number> {
  const timeline = buildTimeline(input, output, options.holdDuration)
  const frameDurationMs = 1000 / options.fps
  const totalFrames = Math.ceil(timeline.totalDurationMs / frameDurationMs)

  // Create browser and page
  const { browser, page } = await createRenderer(options)

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTimeMs = frame * frameDurationMs

      const visibleInput = getVisibleTokens(timeline.inputTokens, currentTimeMs)
      const visibleOutput = getVisibleTokens(timeline.outputTokens, currentTimeMs)

      const buffer = await renderFrame(page, visibleInput, visibleOutput, options)

      // Write frame with zero-padded filename for correct ordering
      const framePath = join(tempDir, `frame-${String(frame).padStart(6, "0")}.png`)
      writeFileSync(framePath, buffer)
    }
  } finally {
    await closeRenderer(browser)
  }

  return totalFrames
}

/**
 * Encode frames to GIF using ffmpeg with palette generation for quality.
 */
async function encodeToGif(tempDir: string, outputPath: string, options: ResolvedOptions): Promise<void> {
  // Ensure output directory exists
  const outputDir = dirname(outputPath)
  if (outputDir && !existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(join(tempDir, "frame-%06d.png"))
      .inputFPS(options.fps)
      .complexFilter([`fps=${options.fps},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`])
      .outputOptions(["-loop", "0"]) // Loop forever
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run()
  })
}

/**
 * Generate a video visualizing stream transformations.
 *
 * @param input - Array of timestamped input tokens
 * @param output - Array of timestamped output tokens
 * @param outputPath - Path where the video file will be written
 * @param options - Optional configuration for video generation
 */
export async function generateWebm(
  input: TimestampedText[],
  output: TimestampedText[],
  outputPath: string,
  options?: GenerateWebmOptions,
): Promise<void> {
  const resolvedOptions = resolveOptions(options)
  const tempDir = createTempDir()

  try {
    // Generate all frames
    await generateFrames(input, output, resolvedOptions, tempDir)

    // Encode to GIF
    await encodeToGif(tempDir, outputPath, resolvedOptions)
  } finally {
    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true })
  }
}
