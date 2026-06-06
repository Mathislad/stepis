import type { MetadataRoute } from "next";

/** Manifest PWA — servi sur /manifest.webmanifest par Next. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "F5L — Console Stepis",
    short_name: "F5L",
    description: "Votre équipe d'employés IA. Console de pilotage F5L.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
