# Design kit — Goparo sur une base Primer

L'interface s'inspire de la lisibilité et de la densité de GitHub/Primer, adaptées au
travail de prospection. Les parcours et les termes restent ceux de Goparo.

## Couleurs et thèmes

Les tokens de `app/globals.css` définissent les deux thèmes. Le mode initial suit le
système ; le bouton d'en-tête permet un choix explicite mémorisé localement.

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| `background` | `#ffffff` | `#0d1117` | page et poste |
| `card` | `#ffffff` | `#161b22` | fiches, métriques, menus |
| `inset` | `#f6f8fa` | `#010409` | fond derrière les panneaux |
| `foreground` | `#1f2328` | `#e6edf3` | texte principal |
| `muted-foreground` | `#59636e` | `#9198a1` | texte secondaire |
| `border` | `#d1d9e0` | `#30363d` | séparateurs de 1 px |
| `link` / `ring` | `#0969da` | `#4493f8` | liens, sélection, focus |
| `primary` | `#1f883d` | `#238636` | recherche IA, action dominante |
| `destructive` | `#cf222e` | `#f85149` | fermeture et erreurs |
| `attention` | `#9a6700` | `#d29922` | priorité haute, vigilance |

Le vert de l'action principale est réservé à « Lancer la recherche IA » dans la
fiche. « Terminer » est une action secondaire forte ; l'état enregistré peut
utiliser le vert de succès. Le bleu signale les liens et la sélection. Le rouge
est réservé aux erreurs et à « Marquer fermé ».

## Typographie et surfaces

- Police système pour l'interface, corps de 14 px, métadonnées de 12 px.
- Police monospace seulement pour les identifiants, raccourcis et données dont
  l'alignement des chiffres aide la lecture.
- Grille d'espacement de 8 px, contrôles de 32 à 40 px sur ordinateur et cibles
  confortables sur mobile.
- Boutons, champs et cartes : rayon de 6 px. Pastilles : rayon complet.
- Bordures de 1 px pour les surfaces au repos ; ombres réservées aux éléments
  flottants (dialogues, info-bulles, toasts).
- Focus clavier : anneau bleu visible. Animations courtes et désactivées si
  `prefers-reduced-motion` est actif.

## Poste de travail

Sur ordinateur : en-tête commun, filtres à gauche, file au centre et fiche à
droite. La fiche s'ouvre sans quitter la file. La liste indique la priorité et
le nombre de coordonnées connues ; la ligne active a un fond et un repère bleus.

Sur mobile : liste puis fiche plein écran. Dans la fiche, identité et lieu
précèdent la recherche IA. Les métadonnées sont disponibles dans une section
repliable. Les coordonnées viennent ensuite. La barre de sortie reste fixe en
bas, à portée du pouce. Les sources de recherche secondaires défilent sur une
ligne horizontale.

La sortie d'une fiche affiche un toast Sonner avec « Annuler » pendant 5 s. Il
n'y a plus de tampon ni d'animation de ticket. « Marquer fermé » ouvre un
`AlertDialog` shadcn ; après confirmation, la même annulation de 5 s s'applique.

## Tableau de bord

`/atelier` utilise les mêmes tokens et des `Card` shadcn. Les graphiques
shadcn Chart/Recharts utilisent le bleu, le vert et un neutre pour distinguer
les séries ; chaque graphique conserve sa vue tableau. Les tableaux peuvent
défiler horizontalement sur écran étroit.

## Composants

Les primitives viennent de `components/ui/` (shadcn/ui, preset Lyra adapté au
thème). Les composants de `features/` composent ces primitives pour les
besoins métier ; aucune nouvelle primitive visuelle autonome n'est créée.
Le thème partage `ThemeToggle` entre le poste et le tableau de bord.

## Raccourcis

J/K ou flèches : naviguer · C : recherche IA · T/E/W : saisir tél./email/site ·
⌘↵ : terminer · N : rien trouvé ou répondre non · O : répondre oui ·
P : passer · U : annuler · / : rechercher · F : plein écran · Échap : revenir.
Les indications de touche sont masquées sur écran tactile.
