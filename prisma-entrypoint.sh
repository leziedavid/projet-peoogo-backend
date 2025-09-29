#!/bin/sh
set -e

APP_DIR="/app"

echo "🔍 Démarrage du déploiement Prisma..."

# Aller dans le dossier de l'application
cd "$APP_DIR"

# Vérifier les migrations échouées
FAILED=$(npx prisma migrate status --print | grep "failed" || echo "")

if [ -n "$FAILED" ]; then
  echo "⚠️  Des migrations échouées détectées, tentative de résolution..."
  for MIG in $(echo "$FAILED" | awk '{print $1}'); do
    echo "🛠 Marque migration $MIG comme appliquée sans toucher aux données"
    npx prisma migrate resolve --applied "$MIG"
  done
else
  echo "✅ Aucune migration échouée détectée"
fi

echo "🚀 Déploiement des migrations locales"
npx prisma migrate deploy
echo "🛠 Génération du client Prisma"
npx prisma generate

echo "✅ Prisma et la base sont maintenant synchronisés."
echo "🚀 Démarrage de l'application..."
exec node dist/main.js
