# 🚀 Déploiement — Bal Promotion 56

## ÉTAPE 1 — Firebase (5 min)

1. Va sur **console.firebase.google.com**
2. **Ajouter un projet** → nom : `bal-promo-56` → Créer
3. Menu gauche → **Firestore Database** → Créer → **Mode test** → `europe-west1` → Activer
4. Icône ⚙️ → Paramètres → **Vos applications** → icône `</>` → nom : `bal56` → Enregistrer
5. **Copie le bloc `firebaseConfig`** affiché → colle-le dans `src/lib/firebase.js` (remplace les VOTRE_...)
6. Firestore → **Règles** → colle :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```
→ Publier

---

## ÉTAPE 2 — GitHub (2 min)

1. **github.com** → New repository → nom : `bal-promo-56` → Public → Create
2. Sur la page vide → **"uploading an existing file"**
3. Glisse **TOUT le dossier** `bal56-react` dedans (ou utilise GitHub Desktop)
4. Commit : `Initial commit` → Commit changes

---

## ÉTAPE 3 — Vercel (2 min)

1. **vercel.com** → Add New Project → importe `bal-promo-56`
2. Framework Preset : **Vite**
3. Build Command : `npm run build`
4. Output Directory : `dist`
5. → **Deploy**

Ton site est en ligne sur `https://bal-promo-56.vercel.app` 🎉

---

## IDENTIFIANTS ADMIN

| Rôle | Login | Mot de passe |
|------|-------|-------------|
| PCO | `pco2026admin` | `Bal56#Med2026` |
| Yarabe | `yarabe2026` | `Yarabe#Bal56` |
| Assassy | `assassy2026` | `Assassy#Bal56` |

---

## IDENTIFIANTS ÉTUDIANTS
Chaque étudiant crée lui-même son PIN à la première connexion.
Il suffit de chercher son nom → sélectionner → créer un PIN 4 chiffres.
