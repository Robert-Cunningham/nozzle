/**
 * A palette of 10 distinct colors designed for light backgrounds.
 * Each color is dark for good readability.
 */
export const TOKEN_COLORS = [
  "#1e40af", // Blue
  "#166534", // Green
  "#854d0e", // Amber
  "#6b21a8", // Purple
  "#155e75", // Cyan
  "#991b1b", // Red
  "#9a3412", // Orange
  "#3f6212", // Lime
  "#075985", // Sky
  "#9d174d", // Pink
] as const

/**
 * Get the color for a token at a given index.
 * Colors cycle through the palette for indices >= palette length.
 */
export function getTokenColor(index: number): string {
  return TOKEN_COLORS[index % TOKEN_COLORS.length]
}
