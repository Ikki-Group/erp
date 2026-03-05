/**
 * Utility to generate a unique and informative SKU.
 * Format: [PREFIX]-[MNEMONIC]-[YYMMDD]-[RANDOM]
 * Example: MAT-GULA-260306-X8YP
 */
export function generateSku(prefix: string, reference?: string): string {
  const now = new Date()
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1
  ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  // 3 characters of random alphanumeric (Base36)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()

  const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '')
  let mnemonic = ''

  if (reference) {
    // Extract first 4 alphanumeric characters from reference
    mnemonic = reference
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4)
  }

  const parts = [cleanPrefix, mnemonic, datePart, random].filter(Boolean)
  return parts.join('-')
}
