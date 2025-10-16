# Plateforme de business en ligne autonome

Cette application fournit un tableau de bord complet (HTML, CSS, JavaScript) avec une API Node.js/Express et une base SQLite pour gérer un écosystème de business numérique automatisé.

## Fonctionnalités

- Visualisation des métriques clés (commandes, revenus, produits, clients)
- Gestion des produits numériques et des clients
- Enregistrement de paiements via Mobile Money (Orange Money, MTN MoMo, Wave, Free Money, PayDunya)
- Suivi des commandes et des campagnes marketing
- Automatisation simulée créant de nouvelles campagnes et micro-projets autour des meilleurs produits
- Base de données SQLite initialisée avec des données de démonstration

## Prérequis

- Node.js 18+
- npm

## Installation

```bash
npm install
npm run init-db
npm start
```

Le serveur Express écoute sur `http://localhost:3000` et sert automatiquement l'interface front-end.

## Structure principale

- `public/` : fichiers statiques (HTML, CSS, JS)
- `server.js` : API REST et logique métier
- `db/schema.sql` & `db/seed.sql` : création et population de la base de données
- `scripts/initDb.js` : script Node pour (ré)initialiser la base SQLite

## Notes

- La route `POST /api/automation/run` illustre l'exécution automatique d'analyses pour générer de nouvelles campagnes et projets.
- Adaptez les intégrations paiements réelles (webhooks, API) en complétant la table `payments` et en ajoutant les appels nécessaires dans `server.js`.
