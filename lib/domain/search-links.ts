import type { Garage } from "../types";

export function getNomAffiche(garage: Pick<Garage, "enseigne" | "nom">): string {
  return garage.enseigne && garage.enseigne.trim() !== "" ? garage.enseigne : garage.nom;
}

// Prompt copié dans le presse-papier avant d'ouvrir la recherche.
export function buildSearchPrompt(garage: Garage): string {
  return `Téléphone et email du garage ${getNomAffiche(garage)} à ${garage.commune}. Si l'email n'est pas trouvé directement, vérifie les mentions légales du site du garage s'il en a un.`.trim();
}

export interface SearchLink {
  id: "google" | "maps" | "annuaire" | "pagesjaunes";
  label: string;
  url: string;
}

export function buildSearchLinks(garage: Garage): SearchLink[] {
  const nom = getNomAffiche(garage);
  const lieu = [garage.commune, garage.cp].filter(Boolean).join(" ");
  const q = (s: string) => encodeURIComponent(s.trim());
  return [
    {
      id: "google",
      label: "Google",
      url: `https://www.google.com/search?q=${q(`"${nom}" ${lieu} téléphone email`)}`,
    },
    {
      id: "maps",
      label: "Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${q(`${nom} ${garage.adresse} ${lieu}`)}`,
    },
    {
      id: "annuaire",
      label: "Annuaire entreprises",
      url: garage.siren
        ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${garage.siren}`
        : `https://annuaire-entreprises.data.gouv.fr/rechercher?terme=${q(`${garage.nom} ${garage.cp ?? ""}`)}`,
    },
    {
      id: "pagesjaunes",
      label: "PagesJaunes",
      url: `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${q(nom)}&ou=${q(lieu)}`,
    },
  ];
}
