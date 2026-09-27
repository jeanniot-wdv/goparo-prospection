# Design kit — « Ticket d'atelier »

Le métier, c'est le garage : le vocabulaire visuel vient de l'atelier (ordre de réparation,
étiquette, tampon, signalétique), en rendu imprimé et épuré. Chaque garage est un ticket
qu'on traite puis qu'on tamponne.

## Couleurs (`app/globals.css`)

| Token | Hex | Rôle |
|---|---|---|
| `ciment` | #EDEAE4 | fond de page (jamais de blanc pur) |
| `papier` | #F7F5F1 | tickets, panneaux, champs |
| `encre` | #151515 | texte, filets pleins 1,5 px, actions secondaires fortes |
| `signal` | #FF4F1A | **une seule action principale par écran** (« Lancer la recherche ») |
| `marque` | #347FAD | bleu Goparo, **réservé aux données enregistrées** |
| `mute` | #8A857C | libellés, métadonnées |
| `filet` | #CFC9BE | séparateurs discrets, grilles de graphiques |
| `voile` | #E2DDD4 | pistes, survols, squelettes |
| `alerte` | #B42A12 | erreurs, « Fermé » |

Tokens shadcn mappés : `primary` = signal, `secondary` = encre, `border`/`input` = encre,
`ring` = signal, `muted` = voile, `radius` = 0. Mode clair uniquement.

Graphiques : série 1 `marque`, série 2 `signal` (validées CVD), piste `voile`, grille `filet`.

## Typographie
- **Archivo** variable (axe `wdth` 62–125) : UI en largeur normale ; titres en
  `font-expanded` (wdth 125) **Black, majuscules** ; noms en liste en `font-condensed`.
- **Geist Mono** : toutes les données (n° de ticket, tél., email, CP, SIREN, compteurs).
  On distingue d'un coup d'œil une donnée de l'interface.
- `etiquette` : petites capitales espacées (10,5 px, 0,14 em), pour les libellés.

## Principes
- Pas d'ombres portées : profondeur par filets pleins (`trait`) et aplats.
- Pas d'arrondis (preset shadcn Lyra), sauf pastilles de filtres mobiles.
- Filet de découpe pointillé (`decoupe`) sous l'en-tête du ticket, comme une souche.
- Hachures (`hachures`) pour les zones vides ou en attente.

## Composants
shadcn/ui : Button (variante `xl` pour le geste principal), Badge, Checkbox, RadioGroup,
Tabs (`line`), Toggle / ToggleGroup, Input, Kbd, Spinner, Skeleton, Tooltip, Progress,
Alert, Table, Chart, Sonner (toasts à l'encre, action orange).

Maison, faute d'équivalent :
- **Slot** : emplacement d'une coordonnée.
- **HoldButton** : Button shadcn + anneau de progression.
- **Stamp** : tampon encreur (filtre SVG de texture).

## États d'un emplacement (Slot)

| État | Rendu |
|---|---|
| vide | pointillés `mute`, « + à trouver », touche en mono |
| saisie | trait encre, champ mono intégré, aide « ↵ valider · Échap annuler » ; erreur en `alerte` |
| rempli | trait plein `marque`, ✓, valeur mono bleue, × pour effacer |
| existant | fond `marque` 5 %, « Déjà dans Notion » (file À compléter) |
| attention | clignote en `signal` quand le bandeau « … trouvé ? » le désigne |

## Animations
- `tampon` (420 ms) : le tampon tombe en s'inclinant à −7°, visible 650 ms.
- `sortie` (320 ms) : le ticket glisse vers la gauche.
- `clignote` : emplacement désigné par le bandeau.
- `monte` : apparition des bandeaux.
Toutes désactivées sous `prefers-reduced-motion`.

Tampons : ENRICHI (bleu, À prospecter), À ENRICHIR (encre), FERMÉ (alerte).

## Mise en page
- Desktop (≥ 1024 px) : grille `h-dvh` 3 colonnes `200px / 1fr / 1.3fr` — filtres, file, ticket.
  Le ticket s'ouvre sans quitter la liste.
- Mobile : liste puis ticket plein écran ; barre de sortie fixe en bas (2 boutons à
  portée de pouce) ; filtres en pastilles défilables ; « Fermé » dans le corps du ticket.
- Plein écran : bouton ⛶ (API Fullscreen) et manifest `display: standalone`.

## Raccourcis clavier

| Touche | Action |
|---|---|
| J / K (↓ / ↑) | garage suivant / précédent |
| C | lancer la recherche (copie le prompt, ouvre Google) |
| T / E / W | saisir tél. / email / site |
| ⌘↵ (Ctrl+↵) | terminer |
| N | rien trouvé, ou « Non, introuvable » dans le bandeau |
| O | « Oui, je le saisis » dans le bandeau |
| P | passer |
| U | annuler la dernière sortie |
| / | rechercher dans la file |
| F | plein écran |
| Échap | fermer le bandeau / la saisie, revenir à la liste (mobile) |

Les touches s'affichent en mono à côté des boutons, et sont masquées sur écran tactile.
