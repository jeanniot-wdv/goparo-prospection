# Architecture

Outil interne pour compléter à la main les coordonnées (tél., email, site) des garages
de la base Notion « Grand Est ». Next 16 (App Router, Turbopack), React 19, Tailwind 4,
shadcn/ui. **Pas de base de données propre : Notion est la seule source de vérité.**

## Couches

```
app/                      routes (UI + API), aucune logique métier
  page.tsx                → <Workspace/> (poste de travail)
  atelier/page.tsx        tableau de bord, composant serveur (lit le cache de stats)
  api/garages/route.ts    GET  file paginée
  api/garages/[id]/route.ts PATCH (écriture) · DELETE (« fermé », PATCH côté Notion)
  api/stats/route.ts      GET  stats agrégées (cache)
features/                 UI par domaine, composants client + hooks
  workspace/  queue/  ticket/  stats/  atelier/  operator/
components/ui/            composants shadcn/ui (preset Lyra), adaptés au thème
lib/
  types.ts                Garage, UpdateGaragePayload, Operator, Queue…
  domain/                 logique pure, testée (aucun appel réseau)
    prospection-rules.ts  sorties de fiche → propriétés Notion (sémantique Oui/Non)
    normalize.ts          mise au format tél. / email / URL
    priority.ts           barème du score (miroir de la formule Notion)
    search-links.ts       prompt de recherche, liens Google / Maps / annuaire / PagesJaunes
    stats.ts              computeStats (agrégats), applySession (correction client)
  notion/                 accès Notion (serveur, sauf filters/payload qui sont purs)
    client.ts             fetch, en-têtes, NotionError, queryAll paginé
    schema.ts             noms des propriétés (seul endroit où ils apparaissent)
    mapper.ts             page Notion → Garage
    filters.ts            filtre + tri Notion d'une file, (dé)sérialisation des paramètres
    payload.ts            UpdateGaragePayload → propriétés Notion (+ traçabilité)
    garages.ts            listQueue, getCachedStats (unstable_cache)
  api/garages-client.ts   seul point d'entrée réseau côté navigateur
scripts/notion-migrate.mjs  ajoute traite_le / traite_par / score_priorite (idempotent)
```

## Flux de données

**File** : `useGarageQueue` → `GET /api/garages?queue=…&dept=…&q=…` → `listQueue` →
`POST /data_sources/{id}/query` (filtre `buildQueueFilter`, tri `score_priorite` desc puis
`Nom`, 20 par page). La pagination se fait par curseur Notion ; un sentinel en bas de
liste déclenche la page suivante.

**Sortie d'un ticket** :
1. `Ticket` calcule le PATCH avec `resolveExit(kind, fiche)` et pose le tampon (650 ms).
2. `Workspace` retire la fiche de la file (optimiste) et passe à la suivante.
3. `usePendingCommits` attend **5 s** (toast « Annuler ») puis envoie
   `PATCH /api/garages/{id}` avec `operator` (ou `DELETE` pour « fermé »).
   « Annuler » ne touche pas Notion : la fiche et sa saisie reviennent dans la file.
   Au `pagehide`, tout ce qui attend part immédiatement en `fetch(…, { keepalive: true })`.
4. La route écrit dans Notion puis appelle `revalidateTag("garages-stats", "max")`.

**Stats** : `getCachedStats` scanne toute la base (≈ 42 appels, ≈ 23 s) avec
`filter_properties` limité aux propriétés utiles, agrège avec `computeStats` et met en
cache **l'objet agrégé seulement** (tag `garages-stats`, `revalidate: 600`). Après une
écriture, la revalidation est « stale-while-revalidate » : le client ajoute donc les
sorties de sa session postérieures à `generatedAt` (`applySession`).

## Cache

| Donnée | Où | Durée | Invalidation |
|---|---|---|---|
| Stats agrégées | `unstable_cache` (Data Cache) | 10 min | `revalidateTag('garages-stats','max')` à chaque PATCH/DELETE |
| File | aucune (`cache: "no-store"`) | — | — |

`/api/stats` est `force-dynamic` et `/atelier` appelle `connection()` : aucun scan Notion
au build. `revalidateTag` exige 2 arguments en Next 16.

## Schéma Notion

API `2025-09-03`, requêtes sur la **data source** (`NOTION_DATA_SOURCE_ID`).

| Champ app (`Garage`) | Propriété Notion | Type | Écrite par l'app |
|---|---|---|---|
| nom | `Nom` | title | |
| enseigne | `enseigne` | rich_text | |
| adresse, commune | `adresse`, `commune` | rich_text | |
| cp | `CP` | number | |
| dirigeant | `dirigeant` | rich_text | |
| segment | `segment` | select (structure_employeuse, solo_non_employeur) | |
| franchiseSuspectee | `franchise_suspectee` | select (oui, non) | |
| siren | `siren` | number (zéros de tête restitués) | |
| effectif | `effectif` | select (00, 01, 02, 03, NN) | |
| naf | `naf` | select (45.20A, 45.20B) | |
| dateCreation | `date_creation` | date | |
| telephone | `telephone` | phone_number | ✔ |
| email | `email` | email | ✔ |
| siteWeb | `site_web` | url | ✔ |
| telNonTrouve / emailNonTrouve | `tel_non_trouve` / `email_non_trouve` | checkbox | ✔ |
| — | `Email_type` | select (Pro, Personnel, Inconnu) | ✔ |
| statutActivite | `Statut_activite` | select (actif, fermé, inconnu) | ✔ |
| — | `Confiance` | select (haute, moyenne, faible) | ✔ |
| prospectionActive | `Prospection_active` | select (À enrichir, À prospecter, …) | ✔ |
| notesIa | `notes_ia` | rich_text | ✔ |
| scorePriorite | `score_priorite` | **formula** (migration) | |
| traiteLe | `traite_le` | **date** (migration), jour de Paris | ✔ |
| traitePar | `traite_par` | **select Hiba / Romain** (migration) | ✔ |

## Files

| File | Filtre Notion |
|---|---|
| Nouveaux | `telephone` vide · `email` vide · `tel_non_trouve` = false · `email_non_trouve` = false |
| À compléter | `telephone` non vide · `email` vide · `Prospection_active` = À enrichir · `traite_le` vide |

Filtres communs : segment, franchises masquées (par défaut), enseigne uniquement (désactivé
par défaut), département par plage de CP (67 = 67000–67999), recherche `or` sur
`Nom`/`enseigne`/`commune`. Notion limite l'imbrication à 2 niveaux : un `and` racine avec
au plus un `or`.

## Sorties de fiche → propriétés

| Sortie | Quand | Propriétés écrites (+ `traite_le`, `traite_par`) | Tampon |
|---|---|---|---|
| Terminer (`complet`) | tél. et email connus | saisie + Email_type Pro, Statut inconnu, Confiance haute, **À prospecter** | ENRICHI |
| Email introuvable | tél. seul, « Email trouvé ? » → Non | saisie + `email_non_trouve`, Email_type Inconnu, **À enrichir** | À ENRICHIR |
| Tél. introuvable | email seul, « Téléphone trouvé ? » → Non | saisie + `tel_non_trouve`, **À prospecter** | ENRICHI |
| Rien trouvé (`aucune`) | rien trouvé | les deux cases, **À enrichir** | À ENRICHIR |
| Fermé | appui long 1,2 s | Statut fermé, **Pas intéressé**, les deux cases | FERMÉ |
| Passer | — | site web seul s'il a été saisi, **sans** traçabilité | — |

« Oui, je le saisis » ne sort pas : le bandeau se ferme et l'emplacement manquant s'ouvre.
