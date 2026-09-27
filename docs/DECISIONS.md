# Décisions (ADR)

Format court : contexte → décision → conséquences. Les plus récentes en bas.

## 1. Notion reste la source de vérité
**Contexte** : une base Notion existante, déjà utilisée par le reste de l'équipe.
**Décision** : pas de base de données ni de state manager. L'app lit et écrit Notion via
l'API ; l'état client tient dans des hooks (`useReducer` pour le ticket).
**Conséquences** : aucune synchro à maintenir ; les agrégats sont coûteux (l'API ne calcule
rien, un scan complet est coûteux), d'où l'ADR 5.

## 2. Score de priorité en formule Notion
**Contexte** : la file est paginée par Notion ; un tri côté client ne verrait que la page chargée.
**Décision** : propriété formula `score_priorite` (créée par `scripts/notion-migrate.mjs`),
triée côté Notion (desc, puis `Nom`). Barème : employeuse +3 · effectif 03/02/01 +3/+2/+1 ·
enseigne +2 · création < 2024 +1 · création ≥ 2025 −2.
**Conséquences** : `lib/domain/priority.ts` en est le miroir JS ; un test vérifie que la
formule du script est identique. Modifier le barème = modifier les deux puis relancer la migration
(le script ne met pas à jour une formule existante : la modifier dans Notion ou supprimer la propriété).

## 3. File « À compléter » par `traite_le`, pas par le texte des notes
**Contexte** : des fiches ont un tél. sans email, avec une note libre du type « email non
recherché » — trop fragile pour servir de filtre.
**Décision** : file = tél. non vide · email vide · À enrichir · `traite_le` vide. Toute fiche
traitée dans l'app reçoit `traite_le` et sort d'elle-même de la file.
**Conséquences** : pas de dépendance à un texte libre fragile.

## 4. Écriture différée pour l'annulation
**Contexte** : il faut pouvoir annuler une sortie, sans écrire un « undo » dans Notion.
**Décision** : l'écriture part après 5 s ; « Annuler » (bouton du toast ou touche U) remet la
fiche et sa saisie dans la file. `pagehide` envoie immédiatement ce qui attend avec
`fetch(…, { keepalive: true })`.
**Conséquences** : si le navigateur est tué brutalement (crash, batterie), une écriture en
attente peut être perdue. Accepté : la fiche reste alors simplement dans la file.

## 5. Stats agrégées en cache, corrigées côté client
**Décision** : `unstable_cache` sur l'objet agrégé (quelques Ko, jamais les fiches), tag
`garages-stats`, `revalidate: 600`, invalidé par `revalidateTag(tag, 'max')` à chaque écriture.
Le client ajoute les sorties de sa session postérieures au calcul (`applySession`).
**Conséquences** : `unstable_cache` est remplacé par `use cache` en Next 16 ; migration à
prévoir si Cache Components est activé.

## 6. Opérateur en localStorage
**Décision** : « Qui est au poste ? » (Hiba / Romain) obligatoire avant la première action,
mémorisé par appareil (`localStorage`, avec repli en mémoire si bloqué), envoyé avec chaque
écriture → `traite_par`.
**Conséquences** : déclaratif, pas une authentification. Ajouter une personne = option du
select `traite_par` + `OPERATORS` dans `lib/types.ts`.

## 7. Pas d'authentification pour l'instant
**Contexte** : outil interne à deux personnes. Le mot de passe est hors périmètre des lots 1-2.
**Conséquences** : l'URL de déploiement ne doit pas être publique ; la clé Notion reste
côté serveur (routes API), jamais exposée au navigateur.

## 8. `DELETE` pour « fermé »
**Décision** : le verbe HTTP est conservé pour compatibilité, mais côté Notion c'est un PATCH
(statut fermé, Pas intéressé, deux cases cochées). Rien n'est archivé ni supprimé.

## 9. shadcn/ui, preset Lyra
**Décision** : composants shadcn/ui (Radix, preset Lyra : coins carrés, pensé pour le mono),
tokens mappés sur la palette « Ticket d'atelier ». Composant maison seulement quand shadcn n'a
pas d'équivalent (`HoldButton`, `Stamp`, `Slot`).
**Conséquences** : les fichiers de `components/ui` sont à nous et peuvent être retouchés
(ex. `button.tsx` : filet 1,5 px, taille `xl`). `cn` vient du paquet `cn` (shadcn).

## 10. Graphiques : shadcn Chart (Recharts)
**Contexte** : le plan initial prévoyait du SVG maison ; la règle « shadcn d'abord » a primé.
**Décision** : shadcn Chart. Palette validée par le script de la skill dataviz (bleu Goparo /
orange signal, ΔE CVD 19,4). Chaque graphique a sa vue tableau.
**Conséquences** : dépendance `recharts`, chargée uniquement sur `/atelier`.

## 11. Automatisation n8n : même traçabilité que l'app, file dédiée pour le RGPD
**Contexte** : un workflow n8n externe enrichit automatiquement les fiches (cron quotidien),
en écrivant dans la même base Notion. Un premier audit (2026-09-27) a montré qu'il pouvait
retraiter des fiches déjà traitées par un humain, laisser des fiches orphelines (aucune case
`_non_trouve` cochée alors que rien n'est trouvé), et ne posait jamais `traite_le`/`traite_par`
(travail invisible dans `/atelier`).
**Décision** : le workflow filtre désormais sur `traite_le` vide comme l'app, écrit
`traite_le`/`traite_par = "Automatisation"` sur chaque fiche traitée, coche les deux cases
`_non_trouve` quand rien n'est trouvé, et pose `Prospection_active = "À vérifier (RGPD)"`
(plutôt que « À prospecter ») quand l'email trouvé semble personnel. L'app expose une file
dédiée `a-verifier-rgpd` pour qu'un humain valide ces fiches avant prospection ; il n'y a pas
de sortie de ticket dédiée, la fiche s'ouvre avec tél./email déjà remplis et se traite comme
n'importe quelle fiche complète.
**Conséquences** : `traitePar` a un type dédié (`TraitePar = Operator | "Automatisation"`,
distinct d'`Operator` qui reste réservé au sélecteur « Qui est au poste ? ») ; les stats par
personne (`parOperateur`, `aujourdhuiParOperateur`) et le graphique d'activité de `/atelier`
distinguent Hiba, Romain et Automatisation (couleur neutre `mute`, pas une des deux couleurs
réservées aux personnes). Aucun verrou entre l'app et le workflow : le risque de collision
reste écarté par le filtre `traite_le` et l'horaire (7h).
