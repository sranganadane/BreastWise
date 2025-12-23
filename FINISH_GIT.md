# ✅ Configuration Git - Dernière étape

## 🎉 Félicitations !

Git fonctionne maintenant et le repository a été initialisé. Il ne reste plus qu'à configurer ton identité Git.

## 📝 Étape finale : Configurer ton identité Git

Ouvre un terminal dans le dossier `app-web` et exécute ces commandes **en remplaçant par tes vraies informations** :

```powershell
# Ajouter Git au PATH pour cette session
$env:Path += ";C:\Program Files\Git\bin"

# Configurer ton nom (remplace par ton nom GitHub)
git config --global user.name "Ton Nom"

# Configurer ton email (remplace par l'email de ton compte GitHub)
git config --global user.email "ton-email@example.com"
```

**Exemple :**
```powershell
$env:Path += ";C:\Program Files\Git\bin"
git config --global user.name "Sarah"
git config --global user.email "sarah@example.com"
```

## ✅ Ensuite, créer le commit

Une fois l'identité configurée, crée le commit :

```powershell
$env:Path += ";C:\Program Files\Git\bin"
cd C:\Users\sarah\OneDrive\Documents\BREASTWISE\app-web
git commit -m "Initial commit - BreastWise ready for Netlify deployment"
```

## 📤 Créer le repository sur GitHub

1. Va sur https://github.com/new
2. Repository name : `breastwise-app`
3. Description : "Application BreastWise - Accompagnement pour le cancer du sein"
4. Visibilité : Private ou Public (selon ton choix)
5. **NE PAS** cocher "Add a README file"
6. **NE PAS** cocher "Add .gitignore"
7. Clique sur **"Create repository"**
8. **Copie l'URL** du repository (exemple : `https://github.com/TON-USERNAME/breastwise-app.git`)

## 🔗 Connecter et pousser vers GitHub

```powershell
$env:Path += ";C:\Program Files\Git\bin"
cd C:\Users\sarah\OneDrive\Documents\BREASTWISE\app-web

# Remplace TON-USERNAME par ton nom d'utilisateur GitHub
git remote add origin https://github.com/TON-USERNAME/breastwise-app.git

# Renommer la branche en 'main'
git branch -M main

# Pousser le code
git push -u origin main
```

**Si GitHub demande une authentification :**
- Utilise un **Personal Access Token** (pas ton mot de passe)
- Va dans GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Génère un nouveau token avec la permission `repo`
- Utilise ce token comme mot de passe

---

## 🔧 Note importante : Ajouter Git au PATH de façon permanente

Pour éviter d'avoir à ajouter Git au PATH à chaque fois, tu peux :

1. Cherche "variables d'environnement" dans le menu Démarrer
2. Clique sur "Modifier les variables d'environnement système"
3. Clique sur "Variables d'environnement"
4. Sous "Variables système", sélectionne "Path" et clique sur "Modifier"
5. Clique sur "Nouveau" et ajoute : `C:\Program Files\Git\bin`
6. Clique sur "OK" partout
7. **Redémarre ton terminal**

Ensuite, tu pourras utiliser `git` directement sans ajouter au PATH !



