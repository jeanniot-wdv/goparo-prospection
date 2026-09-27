# État actuel

_Mis à jour le 2026-09-27._

## Fait

**Refonte « Ticket d'atelier »** : poste de travail plein écran 3 colonnes (desktop) et
parcours mobile au pouce, sur shadcn/ui (Lyra).

**Lot 1**
- Tri par priorité (formule Notion `score_priorite`).
- Deux files : Nouveaux, À compléter (≈ 186 fiches tél. sans email).
- Filtres département (67 / 57 / 54), segment, franchises, enseigne (désactivé par défaut),
  recherche Nom / enseigne / commune.
- Liens de recherche (Google, Maps, annuaire-entreprises, PagesJaunes) + « Lancer la
  recherche IA » (copie le prompt, ouvre Google en mode IA — `udm=50`).
- Pastille de priorité à 3 paliers dans la file (haute / moyenne / basse), sur les tons
  neutres du système.
- Ticket enrichi : SIREN, effectif, création, NAF, dirigeant, nom légal.
- Mise au format tél. (+33 X XX XX XX XX), email, URL.
- Annulation 5 s (écriture différée).
- Bandeau de stats (traités, restant, taux, rythme, fin estimée), compteur du jour.
- Texte « Fermé » corrigé (plus de mention de corbeille) ; confirmation remplacée par
  l'appui long.

**Lot 2**
- Traçabilité `traite_le` / `traite_par` (Hiba, Romain), migration appliquée le 2026-09-27.
- Page `/atelier` : progression par département, taux de réussite par segment et effectif,
  activité par jour et par personne, entonnoir `Prospection_active`, qualité des données.

## Chiffres au 2026-09-27
4 169 fiches · 409 traitées (toutes « avant suivi ») · 3 760 restantes · 186 à compléter ·
84 CP hors zone · 9 sans CP · 148 sans dirigeant · 13 numéros en doublon.

## Limites connues
- Le scan des stats prend ≈ 23 s à froid : premier affichage de `/atelier` et du bandeau
  lent toutes les 10 min environ (servi ensuite depuis le cache).
- Les nombres des onglets de files ignorent les filtres (ce sont des totaux globaux).
- Une écriture en attente peut être perdue si le navigateur plante dans les 5 s
  (la fiche reste alors dans la file).
- Les 409 fiches traitées avant le suivi n'ont ni date ni auteur.
- Rythme et fin estimée restent vides tant qu'aucune fiche n'a de `traite_le`.
- `unstable_cache` est déprécié au profit de `use cache` (Cache Components) en Next 16.

## À venir (hors périmètre des lots 1-2)
- **Mot de passe** / protection de l'accès (cf. ADR 7).
- **Lot 3** : suggestions IA (`telephone_suggere`, `email_suggere`), relances Brevo
  (`Brevo_contact_id`, `Dernier_contact`, `Prochaine_relance`).

## Dette technique
- Pas de tests de composants ni de bout en bout versionnés (les parcours ont été vérifiés
  avec Playwright hors dépôt, écritures Notion interceptées).
- `score_priorite` : le script de migration ne met pas à jour une formule existante.
- Pas de gestion hors ligne.
