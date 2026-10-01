# Goparo Prospection

Outil interne pour compléter à la main les coordonnées (téléphone, email, site) des garages
de la base Notion « Grand Est ». On recherche les coordonnées, on les saisit
puis on passe au garage suivant. Un **tableau de bord** suit l'avancement de l'équipe.

Next.js 16 · React 19 · Tailwind 4 · shadcn/ui · API Notion. Pas de base de données :
Notion est la source de vérité.

## Installation

```bash
npm install
cp .env.local.example .env.local   # puis renseigner les variables
npm run dev                         # http://localhost:3000
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `NOTION_API_KEY` | clé d'intégration Notion (lecture + écriture sur la base) |
| `NOTION_DATA_SOURCE_ID` | identifiant de la data source « Grand Est » (API `2025-09-03`) |

Elles ne sont lues que côté serveur (routes `/api`).

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sans émission |
| `npm test` | tests Vitest (logique pure) |
| `npm run notion:migrate` | migration du schéma Notion (dry-run) |

## Migration Notion

L'app a besoin de trois propriétés dans la base : `traite_le` (date), `traite_par`
(select Hiba / Romain) et `score_priorite` (formule de priorité).

```bash
npm run notion:migrate              # affiche ce qui manque, n'écrit rien
npm run notion:migrate -- --apply   # crée les propriétés manquantes
```

Le script est idempotent et ne modifie aucune fiche. Il a été appliqué le 2026-09-27.

## Déploiement

N'importe quel hébergeur Next.js (Vercel par exemple) : définir les deux variables
d'environnement, puis `npm run build`. L'app n'a **pas d'authentification** : ne pas
exposer l'URL publiquement.

## Utilisation

1. Choisir qui est au poste (Hiba ou Romain) : le nom est enregistré avec chaque fiche traitée.
2. Choisir une file (Nouveaux, À compléter ou RGPD) et filtrer si besoin.
3. Sur la fiche : **Lancer la recherche IA** (C, ouvre Google en mode IA), saisir tél. / email / site (T / E / W),
   puis **Terminer** (⌘↵), **Rien trouvé** (N), **Passer** (P) ou **Marquer fermé** (confirmation).
4. Chaque sortie peut être annulée pendant 5 s (U).
5. Le thème initial suit le système ; le bouton d'en-tête permet de passer du clair au sombre.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) : couches, flux, cache, schéma Notion, files et sorties
- [Décisions](docs/DECISIONS.md) : les choix et leurs raisons (ADR)
- [Conventions](docs/CONVENTIONS.md) : structure, règles Notion, tests
- [Design kit](docs/DESIGN_KIT.md) : tokens, typographie, composants, raccourcis
- [État actuel](docs/CURRENT_STATE.md) : fait, limites, à venir
