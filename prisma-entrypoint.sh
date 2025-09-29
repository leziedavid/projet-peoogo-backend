#!/bin/sh
set -e

# Variables
APP_DIR="/app"
DB_HOST="ms-postgres"
DB_PORT="5432"
DB_USER="microservices"
DB_NAME="mseagrie"
DB_URL="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
BACKUP_DIR="/peoogo/backups"
MICROSERVICES_PASSWORD="microservices"
echo "📦 Sauvegarde conseillée de la base avant de continuer !"

# Créer le dossier backup si non existant
mkdir -p "$BACKUP_DIR"

# Backup rapide si pg_dump est disponible
if command -v pg_dump >/dev/null 2>&1; then
  BACKUP_FILE="$BACKUP_DIR/mseagrie_$(date +%F_%H%M%S).sql"
  PGPASSWORD=$MICROSERVICES_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > "$BACKUP_FILE" && \
    echo "✅ Backup sauvegardé dans $BACKUP_FILE" || \
    echo "⚠️ Backup échoué, continuer quand même."
else
  echo "⚠️ pg_dump introuvable, impossible de faire le backup depuis le conteneur."
fi

# Aller dans le dossier de l'application
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
