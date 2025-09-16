-- CreateEnum
CREATE TYPE "TypeFile" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Slider" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publicite" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "smallTitle" TEXT,
    "description" TEXT,
    "files" TEXT,
    "typeFiles" "TypeFile" NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publicite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglage" (
    "id" TEXT NOT NULL,
    "footerDescription" TEXT,
    "assistanceLine" TEXT,
    "emplacement" TEXT,
    "email" TEXT,
    "fbUrl" TEXT,
    "linkedinUrl" TEXT,
    "xUrl" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Slider" ADD CONSTRAINT "Slider_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicite" ADD CONSTRAINT "Publicite_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reglage" ADD CONSTRAINT "Reglage_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
