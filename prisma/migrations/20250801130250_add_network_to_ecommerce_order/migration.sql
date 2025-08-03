-- CreateEnum
CREATE TYPE "Network" AS ENUM ('MOOV', 'ORANGE', 'MTN', 'WAVE');

-- AlterTable
ALTER TABLE "EcommerceOrder" ADD COLUMN     "network" "Network";
