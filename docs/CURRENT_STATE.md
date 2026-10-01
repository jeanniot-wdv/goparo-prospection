# État actuel

_Mis à jour le 2026-10-01._

## Fait

**Refonte visuelle inspirée de Primer** : poste de travail plein écran 3 colonnes
(desktop), parcours mobile liste → fiche, thèmes clair/sombre, composants
shadcn/ui (Lyra) adaptés. La recherche IA reste l'action principale ; les
métadonnées se replient sur mobile et les sorties sont annoncées par Sonner.

**Lot 1**
- Tri par priorité (formule Notion `score_priorite`).
- Deux files : Nouveaux, À compléter (tél. connu, email manquant).
- Filtres département (67 / 57 / 54), segment, franchises, enseigne (désactivé par défaut),
  recherche Nom / enseigne / commune.
- Liens de recherche (Google, Maps, annuaire-entreprises, PagesJaunes) + « Lancer la
  recherche IA » (copie le prompt, ouvre Google en mode IA — `udm=50`) ; chaque clic ouvre un nouvel onglet (Google isole sa page, impossible de la réutiliser depuis l'app).
- Pastille de priorité à 3 paliers dans la file (haute / moyenne / basse).
- Ticket enrichi : SIREN, effectif, création, NAF, dirigeant, nom légal.
- Mise au format tél. (+33 X XX XX XX XX), email, URL.
- Annulation 5 s (écriture différée).
- Bandeau de stats (traités, restant, taux, rythme, fin estimée), compteur du jour.
- « Marquer fermé » passe par un dialogue de confirmation.

**Lot 2**
- Traçabilité `traite_le` / `traite_par` (Hiba, Romain), migration appliquée le 2026-09-27.
- Page `/atelier` : progression par département, taux de réussite par segment et effectif,
  activité par jour et par personne, entonnoir `Prospection_active`, qualité des données.

**Automatisation n8n**
- Workflow externe d'enrichissement automatique (cron quotidien), corrigé le 2026-09-27 pour
  respecter la traçabilité et la sémantique de l'app (cf. `docs/ARCHITECTURE.md`).
- File dédiée « À vérifier (RGPD) » dans l'app pour valider les emails personnels détectés
  par ce workflow.

## Limites connues
- Le scan des stats est lent à froid (base entière) : premier affichage de `/atelier` et
  du bandeau lent toutes les 10 min environ (servi ensuite depuis le cache).
- Les nombres des onglets de files ignorent les filtres (ce sont des totaux globaux).
- Une écriture en attente peut être perdue si le navigateur plante dans les 5 s
  (la fiche reste alors dans la file).
- Rythme et fin estimée restent vides sans activité `traite_le` sur les 14 derniers jours
  (fenêtre glissante, `RHYTHM_WINDOW_DAYS` dans `lib/domain/stats.ts`).
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
