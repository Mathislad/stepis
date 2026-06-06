import QRCode from "qrcode";

/** URL publique d'une carte (absolue, scannable). */
export function getCardUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/carte/${token}`;
}

/** QR code de la carte en `data:image/png;base64` (généré côté serveur). */
export async function generateQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(getCardUrl(token), {
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
