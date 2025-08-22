/*
  Warnings:

  - A unique constraint covering the columns `[transactionNumber]` on the table `Reversement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionNumber` to the `Reversement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reversement" ADD COLUMN     "transactionNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reversement_transactionNumber_key" ON "Reversement"("transactionNumber");
