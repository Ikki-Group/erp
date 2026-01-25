/**
 * Time utility functions
 */
export const TimeUtils = {
  /**
   * Get current timestamp in seconds
   */
  now(): number {
    return Math.floor(Date.now() / 1000)
  },

  /**
   * Parse expires-in string to seconds
   * Supported units: s (seconds), m (minutes), h (hours), d (days)
   * Default: 3600 seconds (1 hour)
   *
   * @param value - localized string (e.g. "1d", "30m")
   */
  parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/)
    if (!match) return 3600

    const num = parseInt(match[1]!, 10)
    const unit = match[2]

    switch (unit) {
      case "s":
        return num
      case "m":
        return num * 60
      case "h":
        return num * 3600
      case "d":
        return num * 86400
      default:
        return 3600
    }
  },
}
