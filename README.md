# Gestion Production – Axiome Central à Béton (Version Cloud)

Cette application Next.js permet de gérer les rapports journaliers de production pour une centrale à béton. Elle utilise **Firebase Firestore** pour un stockage centralisé et sécurisé dans le cloud, permettant le partage en temps réel avec les superviseurs.

## Fonctionnalités Cloud

- **Stockage Centralisé** : Les données sont stockées sur Firebase Firestore (Google Cloud).
- **Partage par Lien** : Générez un lien unique pour permettre à un supérieur de consulter vos rapports.
- **Soumission Sécurisée** : Verrouillage des rapports une fois envoyés au supérieur.
- **Multi-utilisateurs** : Accès simultané aux mêmes données pour l'employé et le supérieur.
- **Exportation PDF** : Génération de rapports professionnels directement depuis les données cloud.

## Comment sauvegarder sur GitHub

Pour mettre votre projet sur GitHub :

1. **Créer un dépôt sur GitHub** : Allez sur [github.com](https://github.com).
2. **Initialiser Git localement** :
   ```bash
   git init
   git add .
   git commit -m "Passage à la version Cloud Axiome"
   ```
3. **Lier et Envoyer** :
   ```bash
   git remote add origin <URL_DU_DEPOT>
   git branch -M main
   git push -u origin main
   ```

## Installation Locale

```bash
npm install
npm run dev
```

Les configurations Firebase sont situées dans `src/firebase/config.ts`.