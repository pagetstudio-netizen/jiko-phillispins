#!/bin/bash
# Script de déploiement Plesk
# À configurer dans Plesk : Git > Additional deploy actions

set -e

echo "==> Installation des dépendances..."
npm install --production=false

echo "==> Build de l'application..."
npm run build

echo "==> Migration de la base de données..."
npm run db:push

echo "==> Déploiement terminé !"
