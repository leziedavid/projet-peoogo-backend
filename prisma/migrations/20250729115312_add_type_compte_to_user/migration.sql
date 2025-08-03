/*
  Warnings:

  - A unique constraint covering the columns `[numroprincipal]` on the table `Enrollements` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Enrollements" ALTER COLUMN "numroprincipal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "typeCompte" "TypeCompte";

-- CreateIndex
CREATE UNIQUE INDEX "Enrollements_numroprincipal_key" ON "Enrollements"("numroprincipal");
