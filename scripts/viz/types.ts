/**
 * A text token with its timestamp in the stream.
 */
export interface TimestampedText {
  text: string
  /** Timestamp in milliseconds */
  ts: number
}

/**
 * A labeled row of timestamped text tokens.
 */
export interface TimelineRow {
  label: string
  tokens: TimestampedText[]
}

/**
 * Options for generating the WebM video.
 */
export interface GenerateWebmOptions {
  /** Video width in pixels (default: 1280) */
  width?: number
  /** Video height in pixels (default: 360) */
  height?: number
  /** Frames per second (default: 30) */
  fps?: number
  /** Font size in pixels (default: 24) */
  fontSize?: number
  /** Background color (default: '#1e1e1e') */
  backgroundColor?: string
  /** Duration to hold after the last token appears, in ms (default: 1000) */
  holdDuration?: number
}

/**
 * Internal type for a token with its assigned color.
 */
export interface TokenWithColor extends TimestampedText {
  /** Hex color for this token */
  color: string
  /** Index of this token in its row */
  index: number
}

/**
 * A labeled row of colored tokens ready to render.
 */
export interface TokenRow {
  label: string
  tokens: TokenWithColor[]
}

/**
 * Resolved options with all defaults applied.
 */
export interface ResolvedOptions {
  width: number
  height: number
  fps: number
  fontSize: number
  backgroundColor: string
  holdDuration: number
}

/**
 * Timeline data for rendering.
 */
export interface Timeline {
  rows: TokenRow[]
  inputTokens: TokenWithColor[]
  outputTokens: TokenWithColor[]
  totalDurationMs: number
}
