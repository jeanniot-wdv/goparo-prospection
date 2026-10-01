import type { MetadataRoute } from "next";

// Installable comme une app (plein écran, sans barre d'adresse).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Goparo Prospection",
    short_name: "Goparo",
    description: "Saisie des coordonnées des garages",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
