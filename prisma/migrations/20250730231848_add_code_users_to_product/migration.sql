/*
  Warnings:

  - Added the required column `codeUsers` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disponibleDe` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disponibleJusqua` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleType` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeActeur` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeCompte" ADD VALUE 'REVENDEUR';
ALTER TYPE "TypeCompte" ADD VALUE 'TRANSFORMATEUR';
ALTER TYPE "TypeCompte" ADD VALUE 'ACHETEUR';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "autreImage" TEXT,
ADD COLUMN     "codeUsers" TEXT NOT NULL,
ADD COLUMN     "disponibleDe" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "disponibleJusqua" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "saleType" TEXT NOT NULL,
ADD COLUMN     "typeActeur" "TypeCompte" NOT NULL;
