export type AllowedReceiptType = "image/jpeg" | "image/png" | "application/pdf";

const SIGNATURES: Array<{ type: AllowedReceiptType; bytes: number[] }> = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // "%PDF"
];

/**
 * Inspects the actual file bytes rather than trusting the client-supplied
 * mimetype/extension, so a renamed .exe can't slip through as a receipt.
 */
export function detectReceiptType(buffer: Buffer): AllowedReceiptType | null {
  for (const sig of SIGNATURES) {
    if (buffer.length >= sig.bytes.length && sig.bytes.every((b, i) => buffer[i] === b)) {
      return sig.type;
    }
  }
  return null;
}
