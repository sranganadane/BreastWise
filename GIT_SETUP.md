# 🚀 Guide complet : Installer Git et préparer le déploiement

## ⚠️ Étape 1 : Installer Git (si pas déjà installé)

Git n'est pas détecté sur ton système. Voici comment l'installer :

### Option A : Installer Git pour Windows

1. **Télécharge Git** :
   - Va sur https://git-scm.com/download/win
   - Télécharge la version la plus récente
   - Exécute l'installateur

2. **Configuration de l'installation** :
   - Accepte les options par défaut (recommandé)
   - Choisis "Git from the command line and also from 3rd-party software"
   - Choisis "Use bundled OpenSSH"
   - Garde les autres options par défaut

3. **Redémarre ton terminal** après l'installation

4. **Vérifie l'installation** :
   ```powershell
   git --version
   ```
   Tu devrais voir quelque chose comme : `git version 2.xx.x`

### Option B : Utiliser GitHub Desktop (plus simple, interface graphique)

1. Télécharge GitHub Desktop : https://desktop.github.com/
2. Installe et connecte-toi avec ton compte GitHub
3. Tu pourras faire les commits via l'interface graphique

---

## ✅ Étape 2 : Initialiser Git dans le projet

Une fois Git installé, ouvre un **nouveau terminal** dans le dossier `app-web` et exécute :

```powershell
# 1. Aller dans le dossier app-web
cd C:\Users\sarah\OneDrive\Documents\BREASTWISE\app-web

# 2. Initialiser Git (si pas déjà fait)
git init

# 3. Vérifier l'état
git status
```

---

## ✅ Étape 3 : Créer le premier commit

```powershell
# 1. Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# 2. Vérifier ce qui va être commité
git status

# 3. Créer le premier commit
git commit -m "Initial commit - BreastWise ready for Netlify deployment"
```

---

## ✅ Étape 4 : Créer le repository sur GitHub

1. **Va sur GitHub** : https://github.com/new
2. **Configure le repository** :
   - Repository name : `breastwise-app` (ou un autre nom si tu préfères)
   - Description : "Application BreastWise - Accompagnement pour le cancer du sein"
   - Visibilité : **Private** (recommandé pour un projet personnel)
   - **NE PAS** cocher "Add a README file" (on en a déjà un)
   - **NE PAS** cocher "Add .gitignore" (on en a déjà un)
   - Clique sur **"Create repository"**

3. **Copie l'URL du repository** (exemple : `https://github.com/TON-USERNAME/breastwise-app.git`)

---

## ✅ Étape 5 : Connecter le repository local à GitHub

```powershell
# Remplace TON-USERNAME par ton nom d'utilisateur GitHub
git remote add origin https://github.com/TON-USERNAME/breastwise-app.git

# Renommer la branche principale en 'main' (si nécessaire)
git branch -M main

# Pousser le code vers GitHub
git push -u origin main
```

**Si GitHub demande une authentification :**
- Utilise un **Personal Access Token** (pas ton mot de passe)
- Va dans GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Génère un nouveau token avec les permissions `repo`
- Utilise ce token comme mot de passe

---

## ✅ Étape 6 : Déployer sur Netlify

Une fois le code sur GitHub :

1. **Va sur Netlify** : https://app.netlify.com
2. **"Add new site"** → **"Import an existing project"**
3. **Connecte GitHub** et autorise Netlify à accéder à tes repositories
4. **Sélectionne** `breastwise-app` (ou le nom que tu as donné)
5. **Configuration** :
   - Build command : `npm run build`
   - Publish directory : `.next`
   - **Mais Netlify détecte automatiquement Next.js, donc tu n'as normalement rien à changer !**

6. **Variables d'environnement** (IMPORTANT) :
   - Va dans **Site settings** → **Environment variables**
   - Ajoute ces variables :
     ```
     NEXT_PUBLIC_SUPABASE_URL=ton_url_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_cle_anon_supabase
     ```
   - (Ces valeurs sont dans ton projet Supabase → Settings → API)

7. **Déploie !** Netlify va automatiquement build et déployer ton site

---

## 🔄 Workflow pour les mises à jour futures

À chaque fois que tu fais une modification :

```powershell
# 1. Vérifier les changements
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Créer un commit
git commit -m "Description de tes changements"

# 4. Pousser vers GitHub
git push
```

Netlify redéploiera automatiquement le site à chaque push !

---

## ❓ Problèmes courants

### "git: command not found"
→ Git n'est pas installé ou pas dans le PATH. Réinstalle Git et redémarre le terminal.

### "Permission denied"
→ Utilise un Personal Access Token au lieu de ton mot de passe GitHub.

### "Repository not found"
→ Vérifie que le nom du repository est correct et que tu as les droits d'accès.

### Build failed sur Netlify
→ Vérifie que toutes les variables d'environnement sont configurées dans Netlify.

---

## 📝 Checklist avant de pousser

- [ ] Git installé et fonctionnel (`git --version`)
- [ ] Repository Git initialisé dans `app-web`
- [ ] `.gitignore` présent et à jour
- [ ] Aucun fichier `.env.local` dans le commit
- [ ] `logo2.png` présent dans `app-web/public/`
- [ ] Le projet build correctement (`npm run build`)

---

**Une fois Git installé, relance les commandes dans l'étape 2 !**

