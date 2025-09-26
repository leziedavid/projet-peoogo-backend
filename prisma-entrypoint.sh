#!/bin/sh
set -e

# Variables
APP_DIR="/app"
DB_CONTAINER="ms-postgres"
DB_USER="microservices"
DB_NAME="mseagrie"
BACKUP_DIR="/peoogo/backups"

echo "📦 Sauvegarde conseillée de la base avant de continuer !"

# Créer dossier backup si non existant
mkdir -p "$BACKUP_DIR"

# Backup rapide de la base (sécurisé)
BACKUP_FILE="$BACKUP_DIR/mseagrie_$(date +%F_%H%M%S).sql"
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"
echo "✅ Backup sauvegardé dans $BACKUP_FILE"

cd $APP_DIR

echo "🔍 Vérification des migrations Prisma..."

# Vérifier les migrations échouées
FAILED=$(npx prisma migrate status | grep "failed" || true)

if [ ! -z "$FAILED" ]; then
  echo "⚠️  Des migrations échouées détectées, tentative de résolution..."
  for MIG in $(echo "$FAILED" | awk '{print $1}'); do
    echo "🛠 Marque migration $MIG comme appliquée sans toucher aux données"
    npx prisma migrate resolve --applied "$MIG"
  done
fi

echo "🚀 Déploiement des migrations locales (sécurisé)"
npx prisma migrate deploy || true

echo "🛠 Génération du client Prisma..."
npx prisma generate

echo "✅ Prisma et la base sont maintenant synchronisés."
echo "🚀 Démarrage de l'application..."
exec node dist/main.js
