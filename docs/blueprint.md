# **App Name**: Gestion Production – Axiome Central à Béton

## Core Features:

- Calendrier de Production: Affichage mensuel des jours de production, avec des marqueurs visuels pour les jours comportant des données. Permet de naviguer entre les mois et de sélectionner une date pour la saisie ou la consultation.
- Saisie des Décharges Journalières: Interface pour ajouter, visualiser et supprimer plusieurs entrées de décharge par jour. Chaque entrée inclut le type de matière, la taille du gravier (si applicable), la quantité, l'heure et des observations facultatives. La sauvegarde est automatique en local.
- Calcul Automatique des Totaux: Calcul et affichage instantané des totaux journaliers pour chaque matière (Ciment, Adjuvant, Gravier par taille), ainsi que le total général de la journée. Les totaux se mettent à jour dynamiquement.
- Génération de Rapport PDF: Permet de générer et d'exporter un rapport journalier professionnel au format PDF (A4 portrait) incluant le titre de l'entreprise, la date, le tableau des décharges, un récapitulatif des totaux et une zone de signature.
- Export/Import de Données: Fonctionnalités pour exporter toutes les données de production au format JSON pour la sauvegarde et importer des données à partir d'un fichier JSON existant.
- Stockage Local Persistant: Utilisation de IndexedDB pour stocker toutes les données de production de manière locale et persistante dans le navigateur de l'utilisateur.

## Style Guidelines:

- Primary color: A deep, professional blue (#1F59A0) representing stability and industrial reliability, derived from the core concepts of industrial sector and sober blue tones.
- Background color: A very light, desaturated blue (#F3F6F9) that provides a clean and sober foundation, visually derived from the primary blue's hue.
- Accent color: A distinguished medium indigo blue (#6666CC), analogous to the primary blue, offering visual contrast for interactive elements and highlights while maintaining professionalism.
- Body and headline font: 'Inter' (sans-serif), chosen for its modern, neutral, and highly readable characteristics, fitting a professional and clear industrial interface.
- Utilize clean, outline-style icons with a minimalist aesthetic, enhancing clarity and maintaining a modern, industrial look suitable for data entry and navigation.
- A responsive and organized layout, optimized for both PC and tablet use, prioritizing easy data input and clear presentation of totals and calendar, with minimal visual clutter.
- Implement subtle and functional animations for user feedback, such as on button clicks or data entry confirmations, ensuring a smooth and non-distracting user experience.