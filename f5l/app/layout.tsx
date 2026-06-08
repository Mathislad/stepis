import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/pwa/RegisterSW";

function metadataBase(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  applicationName: "F5L",
  title: "F5L — Console Stepis",
  description: "Votre équipe d'employés IA. Console de pilotage F5L.",
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "F5L",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="app-bg min-h-screen">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
