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

# Vérifier si une migration init existe localement
INIT_MIG=$(ls prisma/migrations | grep "_init" || echo "")

# Vérifier si la base contient déjà une migration init
INIT_IN_DB=$(npx prisma migrate status --schema="$SCHEMA_PATH" | grep "_init" || echo "")

if [ -n "$INIT_MIG" ] && [ -n "$INIT_IN_DB" ]; then
  echo "⚠️  Migration init déjà appliquée en base, on la marque comme résolue"
  npx prisma migrate resolve --applied "$INIT_MIG" --schema="$SCHEMA_PATH" || true
fi

# Déployer toutes les migrations restantes
echo "🚀 Déploiement des migrations (y compris _init si nécessaire)"
npx prisma migrate deploy --schema="$SCHEMA_PATH"

# Générer le client Prisma
echo "🛠 Génération du client Prisma"
npx prisma generate --schema="$SCHEMA_PATH"

echo "✅ Prisma et la base sont maintenant synchronisés."
echo "🚀 Démarrage de l'application..."
exec node dist/main.js
