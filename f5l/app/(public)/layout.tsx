import type { ReactNode } from "react";

/**
 * Layout du SITE PUBLIC (ce que voient les clients du commerce).
 * Thème CLAIR distinct du dashboard sombre : on enveloppe dans un conteneur
 * pleine hauteur en `colorScheme: light` qui recouvre le fond sombre du body.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        colorScheme: "light",
        background: "#f6f6f7",
        color: "#18181b",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
