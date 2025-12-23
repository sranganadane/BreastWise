# BreastWise - Application Web

Application d'accompagnement pour les femmes dans leur parcours du cancer du sein.

## 🚀 Technologies

- **Next.js 16** (React Framework)
- **TypeScript** (Typage statique)
- **Tailwind CSS** (Styling)
- **Supabase** (Backend & Base de données)

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## 🏗️ Build

```bash
npm run build
npm start
```

## 📝 Variables d'environnement

Crée un fichier `.env.local` avec :

```
NEXT_PUBLIC_SUPABASE_URL=ton_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_cle_supabase
```

## 🌐 Déploiement

### Netlify

1. Connecte ton repository GitHub à Netlify
2. Configure les variables d'environnement dans Netlify Dashboard
3. Le build se fera automatiquement

### Configuration Netlify

- **Build command** : `npm run build`
- **Publish directory** : `.next` (géré automatiquement par le plugin Next.js)
- **Base directory** : `.` (si le repo est directement dans app-web)

## 📚 Structure du projet

- `app/` - Pages Next.js (App Router)
- `lib/` - Utilitaires et clients Supabase
- `types/` - Types TypeScript
- `public/` - Fichiers statiques
- `supabase/migrations/` - Migrations SQL

## 🔒 Sécurité

⚠️ Ne jamais commiter les fichiers `.env*` contenant les clés secrètes.



