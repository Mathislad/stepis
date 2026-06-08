"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker minimal (PWA installable). Production uniquement
 * pour ne pas gêner le HMR en développement.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* enregistrement best-effort */
    });
  }, []);

  return null;
}
