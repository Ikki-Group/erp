/**
 * Generate a SKU in the form PREFIX-MNEMONIC-YYMMDD-RANDOM.
 *
 * @param prefix - Leading SKU segment; converted to uppercase and stripped of non-alphanumeric characters.
 * @param reference - Optional value used to derive a mnemonic: uppercased, non-alphanumeric removed, then truncated to up to 4 characters. When omitted, the mnemonic segment is excluded.
 * @returns The constructed SKU string composed of hyphen-separated segments.
 */
export function generateSku(prefix: string, reference?: string): string {
  const now = new Date()
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}${String(now.getDate()).padStart(2, '0')}`

  // 3 characters of random alphanumeric (Base36)
  const random = Math.random().toString(36).slice(2, 5).toUpperCase()

  const cleanPrefix = prefix.toUpperCase().replaceAll(/[^A-Z0-9]/g, '')
  let mnemonic = ''

  if (reference) {
    // Extract first 4 alphanumeric characters from reference
    mnemonic = reference
      .toUpperCase()
      .replaceAll(/[^A-Z0-9]/g, '')
      .slice(0, 4)
  }

  const parts = [cleanPrefix, mnemonic, datePart, random].filter(Boolean)
  return parts.join('-')
}
