# Workflow Git — Nova Delivery (à 2)

Code partagé via GitHub. Claude ne synchronise rien tout seul : c'est `git push` / `git pull`.

```
Toi  ──push──►  GitHub  ──pull──►  Collègue
Toi  ◄──pull──  GitHub  ◄──push──  Collègue
```

GitHub = point central. Jamais PC à PC.

---

## 1. Avant de coder — RÉCUPÉRER
Toujours faire ça en ouvrant le projet :
```bash
git checkout develop
git pull origin develop
```

## 2. Coder sur sa propre branche
`main` et `develop` sont protégées → on ne push pas dessus directement.
```bash
git checkout -b feature/nom-de-la-tache
```

## 3. Après modif — ENVOYER
```bash
git add .
git commit -m "ce que tu as changé"
git push origin feature/nom-de-la-tache
```

## 4. Fusionner
Sur GitHub → **Pull Request** → l'autre review → **Squash & merge** dans `develop`.

## 5. L'autre récupère
```bash
git checkout develop
git pull origin develop
```

---

## Règles
- **`git pull` AVANT de commencer**, à chaque fois.
- Pas les deux sur le même fichier en même temps.
- Conflit au pull → dire à Claude : `résous le conflit git`.
- Message de commit = clair, décrit le changement.

## Dire à Claude (dans le terminal)
- `pull les dernières modifs`
- `commit et push mes changements`
- `crée une branche feature/...`
