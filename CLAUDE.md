@AGENTS.md

# Goparo Prospection

Outil interne : compléter à la main les coordonnées des garages de la base Notion
« Grand Est ». Notion est la seule source de vérité (pas de BDD).

## Carte
- `app/` routes (UI + `/api`), fines · `features/<domaine>/` UI client + hooks
- `lib/domain/` logique pure testée · `lib/notion/` accès Notion (`schema.ts` = noms des propriétés)
- `components/ui/` shadcn/ui (preset Lyra) · `scripts/notion-migrate.mjs` migration du schéma

## Commandes
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` ·
`npm run notion:migrate` (dry-run ; `-- --apply` pour écrire)

## Règles essentielles
- **Ne jamais écrire dans Notion** (script, test manuel ou automatisé) sans accord explicite.
  Les tests navigateur doivent intercepter `PATCH`/`DELETE /api/garages/{id}`.
- **Sémantique Oui/Non** des bandeaux « Email / Téléphone trouvé ? » : « Oui, je le saisis »
  reste sur la fiche sans rien écrire ; seul « Non » coche la case `_non_trouve` et sort.
  Source : `lib/domain/prospection-rules.ts` (+ tests).
- Next 16 : lire `node_modules/next/dist/docs/` avant d'utiliser une API ; `revalidateTag`
  prend 2 arguments.
- UI : réutiliser les composants shadcn avant d'en écrire un ; demander avant tout choix de
  design ouvert. Filets : `trait*`, jamais `border-trait` (cn() le supprime).
- Français dans l'UI, les commentaires et les commits.

@docs/ARCHITECTURE.md
@docs/CONVENTIONS.md
@docs/DESIGN_KIT.md
@docs/DECISIONS.md
@docs/CURRENT_STATE.md
