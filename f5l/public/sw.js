// F5L — service worker minimal (PWA installable).
// Étape 1 : pas de cache offline avancé, simple passthrough réseau + prise de
// contrôle immédiate. La stratégie de cache viendra avec l'usage mobile.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* réseau par défaut — handler présent pour l'installabilité PWA */
});
