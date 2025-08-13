-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "statut" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "District" ALTER COLUMN "statut" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Localite" ADD COLUMN     "statut" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "Region" ALTER COLUMN "statut" SET DEFAULT true;

-- AlterTable
ALTER TABLE "SousPrefecture" ADD COLUMN     "statut" BOOLEAN DEFAULT true;
