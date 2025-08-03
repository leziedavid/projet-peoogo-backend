-- CreateEnum
CREATE TYPE "OderPaiementStatus" AS ENUM ('EN_ATTENTE_DE_PAIEMENT', 'PAYE', 'PAYE_PARTIELLEMENT', 'ECHEC', 'ANNULE', 'REMBOURSE');

-- AlterTable
ALTER TABLE "EcommerceOrder" ADD COLUMN     "paymentStatus" "OderPaiementStatus" NOT NULL DEFAULT 'EN_ATTENTE_DE_PAIEMENT';
