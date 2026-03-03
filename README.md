# Gestion Production – Axiome Central à Béton

Cette application Next.js permet de gérer les rapports journaliers de production pour une centrale à béton. Elle fonctionne localement avec IndexedDB et permet l'exportation en PDF et JSON.

## Comment sauvegarder sur GitHub

Pour mettre votre projet sur GitHub, suivez ces étapes dans votre terminal :

1.  **Créer un dépôt sur GitHub** : Allez sur [github.com](https://github.com) et créez un nouveau dépôt vide (ne cochez pas "Initialize this repository with a README").
2.  **Initialiser Git localement** (si ce n'est pas déjà fait) :
    ```bash
    git init
    ```
3.  **Ajouter les fichiers** :
    ```bash
    git add .
    ```
4.  **Faire le premier commit** :
    ```bash
    git commit -m "Initialisation du projet Axiome Production"
    ```
5.  **Lier au dépôt GitHub** :
    Remplacez `<URL_DU_DEPOT>` par l'URL de votre dépôt GitHub (ex: `https://github.com/votre-nom/votre-projet.git`).
    ```bash
    git remote add origin <URL_DU_DEPOT>
    ```
6.  **Envoyer le code** :
    ```bash
    git branch -M main
    git push -u origin main
    ```

## Fonctionnalités

- Saisie des décharges (Ciment, Gravier, Adjuvant).
- Calcul automatique des totaux par type de matière.
- Génération de rapports PDF professionnels.
- Sauvegarde et Restauration des données via fichiers JSON.
- Interface adaptée aux mobiles.

## Installation Locale

```bash
npm install
npm run dev
```
