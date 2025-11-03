/**
 * Generate a unique ID using timestamp + random string
 * This ensures uniqueness even when multiple IDs are generated in quick succession
 */
let idCounter = 0

export function generateUniqueId(prefix: string = ""): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const counter = (idCounter++).toString(36)

  return prefix ? `${prefix}-${timestamp}-${counter}-${random}` : `${timestamp}-${counter}-${random}`
}

/**
 * Generate a UUID-like ID (if crypto.randomUUID is available)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback to custom implementation
  return generateUniqueId()
}
