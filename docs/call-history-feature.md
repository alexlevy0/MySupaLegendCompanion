# Fonctionnalité : Historique des Appels

## Description

La fonctionnalité d'historique des appels permet aux utilisateurs de consulter l'historique complet des appels reçus par chaque senior. Cette fonctionnalité est accessible depuis la liste des seniors.

## Comment accéder à l'historique des appels

1. Dans la liste des seniors, appuyez longuement sur une carte de senior
2. Un menu d'actions s'affiche
3. Sélectionnez "📞 Historique appels"
4. Une modal s'ouvre avec l'historique complet des appels

## Informations affichées

Pour chaque appel, les informations suivantes sont disponibles :

### Informations de base
- **Date et heure** de l'appel
- **Statut** : Terminé ✅, Manqué ❌, Programmé 🕒, En cours 📞
- **Durée** de l'appel (format: Xm Ys)

### Informations détaillées
- **Humeur détectée** : Affichée avec un emoji correspondant
  - 😊 Joyeux
  - 😢 Triste
  - 😟 Anxieux
  - 😐 Neutre
  - 🙂 Autre

- **Score de qualité** : Barre de progression colorée
  - Vert (>70%) : Excellente qualité
  - Orange (40-70%) : Qualité moyenne
  - Rouge (<40%) : Qualité faible

- **Résumé de la conversation** : Un bref résumé textuel de la conversation

## Tri et organisation

Les appels sont triés par date décroissante (les plus récents en premier).

## États possibles

- **Liste vide** : Message "Aucun appel enregistré pour le moment"
- **Chargement** : Indicateur de chargement pendant la récupération des données
- **Erreur** : Alerte en cas d'erreur de chargement

## Données de test

Pour tester la fonctionnalité avec des données de démonstration :

```bash
npm run seed:calls
```

Cette commande génère entre 5 et 10 appels aléatoires pour chaque senior existant, avec :
- Des dates réparties sur les 30 derniers jours
- Des statuts variés (complété, manqué, programmé)
- Des durées entre 2 et 20 minutes
- Des humeurs et scores de qualité aléatoires
- Des résumés de conversation réalistes

## Architecture technique

### Composants
- `CallHistoryModal` : Composant modal principal
- Utilise `getSeniorCalls` du service d'appels

### Types
- `Call` : Type défini dans `utils/database.types.ts`
- `Senior` : Type pour les informations du senior

### Styling
- Design cohérent avec le reste de l'application
- Modal avec overlay semi-transparent
- Cards pour chaque appel avec bordures arrondies
- Couleurs adaptatives selon le thème