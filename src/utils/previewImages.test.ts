import {
  getPreviewImageFromDisplayName,
  getPreviewImageUrl,
  isValidCardFormat,
  parseCardIdentifier
} from "./previewImages";

// Test the utility functions
console.log("Testing card image utilities:");

// Test 1: Basic URL generation
const url1 = getPreviewImageUrl("SVI", "86");
console.log("URL for SVI 86:", url1);
// Expected: https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SVI/SVI_086_R_EN_LG.png

// Test 2: Parse card identifier
const parsed1 = parseCardIdentifier("Gardevoir ex (SVI 86)");
console.log("Parsed SVI 86:", parsed1);
// Expected: { setCode: 'SVI', cardNumber: '86' }

// Test 3: Full display name to URL
const url2 = getPreviewImageFromDisplayName("Gardevoir ex (SVI 86)");
console.log("Full URL for Gardevoir ex:", url2);

// Test 4: Test various formats
const testCards = [
  "Munkidori (TWM 95)",
  "Ralts (SVI 84)",
  "Kirlia (SVI 85)",
  "Professor's Research (JTG 155)",
  "Iono (PAL 185)",
  "Psychic Energy (SVE 13)",
  "Invalid Card Name",
  "Another Card (INVALID)"
];

testCards.forEach((card) => {
  const isValid = isValidCardFormat(card);
  const url = getPreviewImageFromDisplayName(card);
  console.log(`${card}: Valid=${isValid}, URL=${url}`);
});
