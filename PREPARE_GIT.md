# 🚀 Préparation pour le déploiement Git/Netlify

## ✅ Fichiers préparés

Tous les fichiers nécessaires sont prêts pour être commités dans Git :

- ✅ Configuration Netlify (`netlify.toml`)
- ✅ `.gitignore` mis à jour (exclut node_modules, .env, etc.)
- ✅ `README.md` créé
- ✅ `DEPLOY.md` avec guide complet de déploiement

## ✅ Logo configuré

Toutes les références à `logo2.png` ont été remplacées. Le fichier `logo2.png` est présent dans `app-web/public/`.

## ⚠️ IMPORTANT : Git n'est pas installé

**Git n'est pas détecté sur ton système.** Avant de continuer, tu dois :

1. **Installer Git** (voir `GIT_SETUP.md` pour les instructions détaillées)
   - Option simple : https://git-scm.com/download/win
   - OU utiliser GitHub Desktop : https://desktop.github.com/

2. **Redémarrer ton terminal** après l'installation

3. **Revenir ici** et suivre les étapes ci-dessous

## 📝 Commandes Git à exécuter

Ouvre un terminal dans le dossier `app-web` et exécute :

```bash
# 1. Initialiser Git (si pas déjà fait)
git init

# 2. Ajouter tous les fichiers
git add .

# 3. Vérifier ce qui va être commité
git status

# 4. Faire le premier commit
git commit -m "Initial commit - BreastWise ready for Netlify deployment"

# 5. Créer le repository sur GitHub (via le site web)
#    https://github.com/new

# 6. Connecter le repository local à GitHub
git remote add origin https://github.com/TON-USERNAME/breastwise-app.git
git branch -M main
git push -u origin main
```

## 🌐 Après le push vers GitHub

1. Va sur https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Connecte GitHub et sélectionne ton repository
4. Configure les variables d'environnement (voir DEPLOY.md)
5. Déploie !

## 📋 Checklist avant de pousser

- [x] Logo2.png remplacé par logo.png dans tout le code
- [ ] Vérifier que logo.png est dans `app-web/public/`
- [ ] Aucun fichier `.env.local` n'est commité
- [ ] Tous les fichiers sont sauvegardés
- [ ] Le projet build correctement en local (`npm run build`)

