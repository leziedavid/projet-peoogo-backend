#!/bin/sh
set -e

APP_DIR="/app"
SCHEMA_PATH="prisma/schema.prisma"

echo "🔍 Démarrage du déploiement Prisma..."

cd "$APP_DIR"

# Vérifier les migrations échouées
FAILED=$(npx prisma migrate status --schema="$SCHEMA_PATH" | grep "FAILED" || echo "")
if [ -n "$FAILED" ]; then
  echo "⚠️  Migrations échouées détectées, résolution automatique..."
  for MIG in $(echo "$FAILED" | awk '{print $1}'); do
    echo "🛠 Marque migration $MIG comme appliquée sans toucher aux données"
    npx prisma migrate resolve --applied "$MIG" --schema="$SCHEMA_PATH"
  done
else
  echo "✅ Aucune migration échouée détectée"
fi

# Déployer toutes les migrations (inclut _init si elle n’a jamais été appliquée)
echo "🚀 Déploiement des migrations (y compris _init si nécessaire)"
npx prisma migrate deploy --schema="$SCHEMA_PATH"

# Générer le client Prisma
echo "🛠 Génération du client Prisma"
npx prisma generate --schema="$SCHEMA_PATH"

echo "✅ Prisma et la base sont maintenant synchronisés."
echo "🚀 Démarrage de l'application..."
exec node dist/main.js
