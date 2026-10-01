# Conventions

## Langue
- **Français** dans l'UI, les commentaires, les messages de commit et la doc.
- Identifiants de code en anglais ou en français selon le domaine : le vocabulaire métier
  reste en français (`fiche`, `saisie`, `traite_le`, `aCompleter`), la plomberie en anglais
  (`queryAll`, `usePendingCommits`).

## Structure
- `app/` : routes uniquement, fines. Pas de logique métier dans une route ou une page.
- `features/<domaine>/` : composants client et hooks d'un domaine (`queue`, `ticket`…).
  Un hook par fichier, nommé `useX.ts` ; un composant par fichier, en PascalCase.
- `lib/domain/` : fonctions **pures** (pas de `fetch`, pas de React). Tout ce qui décide
  d'une règle métier vit ici et est testé.
- `lib/notion/` : seul endroit qui connaît l'API Notion. Les noms de propriétés viennent
  **toujours** de `schema.ts` (`PROPS.telephone`, jamais `"telephone"` en dur).
- `lib/api/garages-client.ts` : seul endroit qui appelle `/api/*` depuis le navigateur.
- `components/ui/` : composants shadcn. On les ajoute avec `npx shadcn@latest add <nom>`
  et on préfère les réutiliser plutôt qu'écrire un composant maison.

## Règles Notion
- Ne jamais écrire dans Notion (script, test manuel, test auto) sans accord explicite.
  Les tests de bout en bout interceptent `PATCH`/`DELETE /api/garages/{id}`.
- La sémantique des sorties est centralisée dans `lib/domain/prospection-rules.ts`.
  « Oui, je le saisis » = rester sur la fiche ; seul « Non » ferme le cas.
- Filtres : 2 niveaux d'imbrication maximum (`and` racine + un `or`).
- Toute nouvelle propriété : ajout dans `schema.ts`, `mapper.ts` (+ test), et si l'app
  la crée, dans `scripts/notion-migrate.mjs` (idempotent, dry-run par défaut).

## Next 16
- Lire `node_modules/next/dist/docs/` avant d'utiliser une API Next (cf. `AGENTS.md`).
- `revalidateTag(tag, 'max')` : 2 arguments obligatoires.
- Une route ou page qui interroge Notion au rendu doit être dynamique
  (`export const dynamic = "force-dynamic"` ou `await connection()`).

## Style
- Tailwind 4 : tokens sémantiques dans `app/globals.css` (`@theme inline`, `:root`,
  `.dark`). Pas de couleur en dur dans les composants, sauf SVG statiques.
- Interface inspirée de Primer : bordures de 1 px, rayon de 6 px sur les contrôles et
  cartes, ombres uniquement sur les couches flottantes. Bleu pour les liens et le
  focus ; vert pour l'action principale ; rouge pour les erreurs et la fermeture.
- Composer les primitives shadcn/ui existantes dans `features/` ; ne pas créer de
  nouvelle primitive visuelle autonome. Tester les deux thèmes et les petits écrans.

## Tests
- Vitest (`npm test`), limité à la logique pure : `lib/**/*.test.ts`,
  `features/**/use*.test.ts` pour les reducers, `scripts/*.test.ts`.
- Un test par règle métier ; les cas « Oui/Non » des sorties sont couverts dans
  `prospection-rules.test.ts`.
- Avant un commit : `npm run lint`, `npm run typecheck`, `npm test`, et `npm run build`
  si des routes ont changé.

## Documentation
- Elle décrit le **code** (architecture, décisions, conventions, design), jamais l'état des
  données métier. Pas de nombre de fiches, taux, date de la base Notion ou autre chiffre
  qui date à la minute où il est écrit : ça se lit sur `/atelier`, pas dans `docs/`.
- Avant chaque commit qui touche l'architecture, une décision, une convention ou une
  fonctionnalité livrée : mettre à jour le fichier `docs/*.md` concerné, et `CLAUDE.md` si
  sa carte ou ses règles essentielles changent (cf. `CLAUDE.md`).
