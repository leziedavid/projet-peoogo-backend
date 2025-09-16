-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Publicite" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Reglage" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Slider" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "Partenaire" (
    "id" TEXT NOT NULL,
    "libeller" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partenaire_pkey" PRIMARY KEY ("id")
);
