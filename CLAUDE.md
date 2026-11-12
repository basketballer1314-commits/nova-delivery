# NOVA DELIVERY — règles du projet

## Produit
App de livraison de repas et de colis sur la Petite-Côte (Sénégal) : Mbour, Saly, Ngaparou, Somone.
Une seule app mobile avec un mode Client et un mode Livreur (activé seulement pour un livreur approuvé).
Web : back-office (/admin), espace restaurant PWA (/resto), suivi destinataire public (/suivi/[token]).
Le nom "NOVA" est provisoire : nom, logo et couleurs sont des paramètres (app.config.ts + table settings), jamais codés en dur.

## Structure du monorepo
```
apps/
  mobile/        Expo + React Native : app client + mode livreur (une seule app)
  web/           Next.js : back-office (/admin), espace restaurant PWA (/resto),
                 page de suivi destinataire (/suivi/[token])
packages/
  shared/        types générés depuis Supabase, schémas zod, textes FR/EN
  ui-tokens/     couleurs, espaces, rayons, typo de la charte
supabase/
  migrations/    schéma SQL versionné
  functions/     Edge Functions (devis, création de commande, dispatch, push…)
  tests/         tests pgTAP des règles de sécurité (RLS)
  seed.sql       zones Mbour/Saly/Ngaparou/Somone, grille de prix, données de test
CLAUDE.md        ce fichier
```

## Stack
- Monorepo pnpm + Turborepo. TypeScript strict partout.
- Mobile : Expo (dernière SDK stable), Expo Router, development build (pas Expo Go),
  Zustand, TanStack Query (persisté), react-hook-form + zod, i18next (fr, en),
  react-native-maps, expo-location, expo-task-manager, expo-notifications, expo-image,
  phosphor-react-native (style fill), @expo-google-fonts (Poppins, Inter).
- Web : Next.js App Router + Tailwind, même jeu de tokens.
- Backend : Supabase (Postgres + PostGIS, Auth téléphone, Realtime, Storage, Edge Functions Deno, pg_cron).
- Environnements : Supabase local (Docker) ou projet nova-staging. Jamais de clé de production dans le terminal.

## Règles non négociables
1. Les prix, commissions et gains sont calculés UNIQUEMENT côté serveur (Edge Function ou fonction SQL)
   et figés sur la commande (pricing_snapshot). L'app affiche, ne calcule jamais.
2. RLS activée sur toutes les tables. Aucune clé service_role dans apps/mobile ni dans le code client web.
3. Toute opération d'argent : clé d'idempotence, écriture au registre en partie double (ledger_entries),
   inscription au journal d'audit.
4. Montants en FCFA, entiers (integer), jamais de décimales. Affichage "4 500 FCFA" (espace insécable).
5. Chaque changement de statut va dans status_history (auteur, date, position si dispo).
6. Téléphones au format E.164 (+221…).
7. Toute nouvelle table ou colonne passe par une migration dans supabase/migrations, puis on régénère
   les types : supabase gen types typescript --local > packages/shared/src/database.types.ts
8. Textes de l'interface uniquement via i18n (fr + en), vouvoiement, phrases courtes, boutons qui
   commencent par un verbe ("Commander", "Payer 5 600 FCFA").

## Règles métier clés (dossier v2)
- Zones : 1 Mbour, 2 Saly, 3 Ngaparou, 4 Somone, 5 Malicounda/Warang/Nianing (désactivée au départ).
- Colis (jusqu'à 5 kg) : même zone 1 000, voisine 1 500, +1 zone 2 000, Mbour↔Somone 2 500.
- Frais livraison repas : même zone 700, voisine 1 000, deux zones 1 500, Mbour↔Somone 2 000.
- Livreur 80 % / plateforme 20 % sur course et frais de livraison. Suppléments attente, nuit (+300 après 22 h),
  pluie : 100 % livreur. Colis 5–15 kg : +500.
- Commission restaurant : 5 % le premier mois, puis 10 % (taux par restaurant, avec dates de validité).
- Frais de service repas : 100 FCFA (offerts à la 1re commande).
- Contre-remboursement : max(200 ; 1 %), réservé aux comptes vérifiés, plafond 100 000 FCFA, reversé J+1.
- Espèces : plafond livreur 30 000 FCFA (au-delà : BLOQUÉ_CAISSE), nouveau client limité à 15 000 FCFA
  tant qu'il n'a pas 3 commandes réussies.
- Offre de course : 45 s pour accepter, une offre à la fois au lancement.
- Un livreur ne peut pas prendre une mission liée à sa propre commande (RG-02).

## Design (charte v1.0)
- Couleurs : navy 900 #0E2A47 (texte, mode livreur), orange 500 #FF6B35 (marque, tuile repas avec texte navy),
  orange 600 #D04318 (boutons principaux, texte blanc), orange 700 #A8360F (liens, prix promo),
  lagune 500 #0FA3A3 (tuile colis), lagune 600 #0A8384 (bouton colis), sable 100 #F7F1E8,
  gris 100 #EBEEF2, 200 #D9DEE5, 500 #617086, 600 #4F5D70.
  États : succès #0F7B45, alerte #F4B400, erreur #C2183C.
- INTERDIT : texte blanc sur orange 500 (contraste 2,8:1).
- Espacements multiples de 4 : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Marges d'écran 20.
- Rayons : xs 6, sm 10, md 16, lg 20, xl 28, pill 999. Boutons en pilule, hauteurs 56 / 48 / 40.
- Typo : Poppins (titres, boutons), Inter (texte, prix en chiffres tabulaires). Corps 16 minimum.
- Zones tactiles 48 dp minimum. Une seule action principale orange par écran, en bas.
- Toute icône a un libellé (sauf fermer, retour, favori). Un état = couleur + icône + mot.
- Mode livreur : fond navy 900, onglet actif orange 500.

## Façon de travailler
- Propose un plan avant de coder. Petites étapes, un commit par étape.
- Écris des tests pour tout calcul d'argent et toute règle RLS.
- Si une règle de ce fichier semble bloquer, demande-moi au lieu de la contourner.

## Collaboration git (à 2 — voir WORKFLOW-GIT.md)
- Branches `main` et `develop` PROTÉGÉES, squash merge. Jamais de push direct dessus.
- Toujours `git pull origin develop` avant de coder.
- Travailler sur une branche `feature/...`, puis Pull Request vers `develop`.

## Après CHAQUE modification de code
Dès qu'une modif de fichier est terminée, Claude DOIT :
1. Proposer de commiter.
2. Donner le message de commit exact : `git commit -m "<description claire du changement>"`
   (décrit le vrai changement, pas "update"/"fix"). Ex : `git commit -m "ajout bouton paiement sur ecran commande"`.
3. Après OK : `git add .` puis `git commit -m "<description>"`.
4. Demander si on push sur la branche feature.
