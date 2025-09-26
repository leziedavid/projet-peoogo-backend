#!/bin/sh
set -e

echo "🔍 Vérification des migrations Prisma..."

# Vérifier si une migration a échoué
FAILED=$(npx prisma migrate status | grep "failed" || true)

if [ ! -z "$FAILED" ]; then
  echo "⚠️  Des migrations échouées détectées, tentative de résolution..."
  for MIG in $(echo "$FAILED" | awk '{print $1}'); do
    echo "🛠 Résolution de la migration $MIG"
    npx prisma migrate resolve --rolled-back "$MIG"
  done
fi

# Déployer les migrations valides
npx prisma migrate deploy

# Regénérer Prisma Client (sécurité)
npx prisma generate

echo "✅ Migrations Prisma OK, démarrage de l'app..."
exec node dist/main.js
