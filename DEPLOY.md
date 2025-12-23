# Guide de déploiement BreastWise sur Netlify

## 📋 Pré-requis

- Compte GitHub (gratuit)
- Compte Netlify (gratuit)
- Compte Supabase (gratuit)

## 🔧 Étapes de déploiement

### 1. Initialiser Git (si pas déjà fait)

```bash
cd app-web
git init
git add .
git commit -m "Initial commit - BreastWise ready for deployment"
```

### 2. Créer le repository GitHub

1. Va sur https://github.com/new
2. Nom du repository : `breastwise-app` (ou le nom de ton choix)
3. Choisis **Public** ou **Private**
4. **Ne coche PAS** "Initialize with README"
5. Clique sur "Create repository"

### 3. Connecter et pousser vers GitHub

```bash
git remote add origin https://github.com/TON-USERNAME/breastwise-app.git
git branch -M main
git push -u origin main
```

*(Remplace TON-USERNAME par ton nom d'utilisateur GitHub)*

### 4. Déployer sur Netlify

1. Va sur https://app.netlify.com
2. Clique sur **"Add new site"** → **"Import an existing project"**
3. Choisis **GitHub** et autorise Netlify
4. Sélectionne ton repository `breastwise-app`

### 5. Configuration Netlify

Netlify devrait détecter automatiquement Next.js. Si ce n'est pas le cas, configure manuellement :

- **Base directory** : `.` (ou laisse vide si tout est à la racine)
- **Build command** : `npm run build`
- **Publish directory** : `.next` (géré automatiquement par le plugin Next.js)

### 6. Ajouter les variables d'environnement

Dans Netlify Dashboard → **Site settings** → **Environment variables**, ajoute :

- `NEXT_PUBLIC_SUPABASE_URL` = ton URL Supabase (trouvable dans Supabase Dashboard → Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta clé anonyme Supabase

### 7. Configurer Supabase pour Netlify

Dans Supabase Dashboard :

1. **Settings** → **API** → **Site URL** :
   - Ajoute ton URL Netlify : `https://ton-site.netlify.app`

2. **Authentication** → **URL Configuration** → **Redirect URLs** :
   - Ajoute : `https://ton-site.netlify.app/**`
   - Ajoute aussi : `https://ton-site.netlify.app` (sans /**)

### 8. Déployer

1. Clique sur **"Deploy site"** dans Netlify
2. Attends que le build se termine (2-5 minutes)
3. Ton site sera disponible sur `https://ton-site.netlify.app`

## ✅ Vérifications après déploiement

- [ ] Le site se charge correctement
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] Les données se sauvegardent dans Supabase
- [ ] Le dashboard affiche les données

## 🔄 Déploiements automatiques

À chaque push sur la branche `main`, Netlify redéploiera automatiquement ton site.

## 🐛 En cas de problème

- Vérifie les logs de build dans Netlify Dashboard
- Vérifie que les variables d'environnement sont bien configurées
- Vérifie que Supabase accepte les requêtes depuis ton domaine Netlify



