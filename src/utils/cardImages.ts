/**
 * Constructs the image URL for a Pokémon card from Limitless TCG CDN
 * @param setCode - The set code (e.g., "SVI", "TWM")
 * @param cardNumber - The card number (e.g., "86", "95")
 * @returns The full URL to the card image
 */
export function getCardImageUrl(setCode: string, cardNumber: string): string {
  // Format: https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/{SET}/{SET}_{NUMBER}_R_EN_LG.png
  const paddedNumber = cardNumber.padStart(3, "0"); // Ensure 3 digits
  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${setCode}/${setCode}_${paddedNumber}_R_EN_LG.png`;
}

/**
 * Extracts set code and card number from a card display name
 * @param displayName - Card name in format "Card Name (SET NUMBER)"
 * @returns Object with setCode and cardNumber, or null if parsing fails
 */
export function parseCardIdentifier(
  displayName: string
): { setCode: string; cardNumber: string } | null {
  // Match pattern: "Card Name (SET NUMBER)" - handle various formats
  const match = displayName.match(/\(([A-Z0-9]+)\s+(\d+[a-zA-Z]*)\)$/);
  if (!match) {
    return null;
  }

  const [, setCode, cardNumber] = match;

  // Clean card number - remove any letters at the end (like "86a" -> "86")
  const cleanNumber = cardNumber.replace(/[a-zA-Z]+$/, "");

  if (!cleanNumber || !setCode) {
    return null;
  }

  return { setCode: setCode.toUpperCase(), cardNumber: cleanNumber };
}

/**
 * Gets the full image URL from a card display name
 * @param displayName - Card name in format "Card Name (SET NUMBER)"
 * @returns The image URL or null if parsing fails
 */
export function getCardImageFromDisplayName(
  displayName: string
): string | null {
  const parsed = parseCardIdentifier(displayName);
  if (!parsed) {
    return null;
  }

  return getCardImageUrl(parsed.setCode, parsed.cardNumber);
}

/**
 * Validates if a card name has the expected format for image preview
 * @param displayName - Card name to validate
 * @returns true if the name has the expected format
 */
export function isValidCardFormat(displayName: string): boolean {
  return parseCardIdentifier(displayName) !== null;
}
