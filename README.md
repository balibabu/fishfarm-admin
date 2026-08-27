# Fish Farm Admin

Content management panel for the Fish Farm website. Vanilla JS + Vite + Tailwind v4, Firebase Auth + Firestore, Cloudinary for image uploads. Deployed on GitHub Pages.

## Features

- Email/password login (Firebase Authentication)
- Settings editor — farm details, contact, hero content (writes to `site/settings`)
- Fish Varieties CRUD with reorder (writes to `fishes` collection)
- Gallery CRUD with reorder (writes to `gallery` collection)
- Videos CRUD with YouTube link auto-parsing and thumbnail preview (writes to `videos` collection)
- Image uploads to Cloudinary (unsigned preset) with manual URL fallback

## Setup

### 1. Firebase

1. In the [Firebase Console](https://console.firebase.google.com) open project `merofishfarm`
2. Register a Web app (Project settings → General → Your apps) if none exists
3. Copy the config values into `src/services/firebase.js`
4. Enable **Authentication → Sign-in method → Email/password**, then add your admin user under Users
5. Create **Firestore Database**
6. Deploy the rules from [`firestore.rules`](./firestore.rules):

   ```bash
   firebase deploy --only firestore:rules
   ```

   Rules: public read, writes require any signed-in admin account.

### 2. Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Settings → Upload → Add upload preset
3. Set **Signing Mode: Unsigned**
4. Restrict: image format only, max size ~10 MB
5. Put your cloud name and the preset name into `src/services/cloudinary.js`

If left unconfigured, the image picker falls back to URL paste only.

### 3. Seed initial content

Copies the website's hardcoded data into Firestore so the site can go fully dynamic:

```bash
FIREBASE_API_KEY=... FIREBASE_AUTH_DOMAIN=... FIREBASE_PROJECT_ID=... \
FIREBASE_STORAGE_BUCKET=... FIREBASE_MESSAGING_SENDER_ID=... FIREBASE_APP_ID=... \
npm run seed
```

Or enter everything manually through the admin UI.

### 4. Website connection

Paste the same Firebase config into `fishfarm-website/src/services/cms.js` — the site starts reading from Firestore (with hardcoded data as fallback).

## Development

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

1. Push this folder's contents as its own repo (e.g. `fishfarm-admin`) — the workflow file is at `.github/workflows/deploy-pages.yml`
2. Repo Settings → Pages → Source: **GitHub Actions**
3. Push to `main` — the site deploys to `https://<user>.github.io/fishfarm-admin/`

`base` is already set to `/fishfarm-admin/` in `vite.config.js`; adjust if the repo name differs.
