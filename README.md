# NOVA DELIVERY

Livraison de repas et de colis sur la Petite-Côte (Mbour, Saly, Ngaparou, Somone).
Les règles du projet sont dans [CLAUDE.md](CLAUDE.md). À lire avant de coder.

## Installer le projet (Windows)

Prérequis : Node.js LTS, pnpm (`npm i -g pnpm`), Git.

```powershell
git clone https://github.com/basketballer1314-commits/nova-delivery.git
cd nova-delivery
pnpm install
copy apps\mobile\.env.example apps\mobile\.env
```

## Lancer l'app mobile sur un téléphone

```powershell
.\tunnel.ps1          # QR code à scanner avec Expo Go (SDK 54)
.\tunnel.ps1 -Clear   # même chose en vidant le cache
```

Expo Go pour SDK 54 : https://expo.dev/go (le Play Store propose seulement la dernière version).

## Travailler à deux

- `main` = version stable, `develop` = travail en cours. Les deux sont protégées :
  on ne pousse jamais directement dessus.
- Une branche par tâche, créée depuis `develop` : `feat/…`, `fix/…`, `chore/…` (ex. `feat/ecran-otp`).
- On ouvre une Pull Request vers `develop` ; l'autre personne relit et valide avant la fusion.
- Avant de commencer : `git switch develop` puis `git pull`.
- Messages de commit clairs, en français : `feat(mobile): écran de saisie du numéro`.
- **Jamais de secret dans Git** : le dépôt est public. Les fichiers `.env` restent sur votre machine,
  les clés se partagent hors de GitHub (gestionnaire de mots de passe).

## Structure

```
apps/mobile     Expo (client + mode livreur)
apps/web        Next.js (admin, resto, suivi) — à venir
packages/       code partagé — à venir
supabase/       base de données — à venir
```
