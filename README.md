# potentiel-integration-enedis

## Description

L'automatisation des imports de date de mise en service avec Enedis nécessite un échange de fichiers via un bucket S3. Ceci est dû aux contraintes de sécurité d'Enedis.

Cette intégration effectue les tâches suivantes

1. en mode `export` (fréquence ~mensuelle)

- récupération des dossiers de raccordements depuis l'API Potentiel
- génération d'un fichier CSV et upload dans S3
- notification par email qu'un fichier est disponible

2. en mode `import` (fréquence ~quotidienne)

- récupération du fichier CSV d'import (complété par Enedis) depuis S3
- pour chaque dossier de raccordement, mise à jour de la date de mise en service, et éventuellement correction de la référence dossier

## Utilisation

```bash
npm run build
npm run start:export
npm run start:import
```
