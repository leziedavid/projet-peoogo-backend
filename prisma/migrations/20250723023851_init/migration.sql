-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'AGENT_ENROLEUR', 'AGENT_CONTROLE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('AGRICULTEURS', 'AQUACULTEURS', 'AUTRE_ACTEURS', 'APICULTEURS');

-- CreateEnum
CREATE TYPE "NiveauInstruction" AS ENUM ('AUCUN', 'PRIMAIRE', 'SECONDAIRE', 'SUPERIEUR', 'ALPHABETISE');

-- CreateEnum
CREATE TYPE "StatusDossier" AS ENUM ('NON_TRAITE', 'VAL', 'REJ', 'DOUBLON', 'ENCOURS', 'DEL', 'IMAGE_INCOR', 'DOUBLON_NUMBER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('IMMEDIATE', 'ON_ARRIVAL', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'PAYMENT', 'COMMISSION', 'REFUND');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'VALIDATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('HOME_DELIVERY', 'STORE_PICKUP', 'LIFT', 'PICKUP', 'DROP');

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SousPrefecture" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "SousPrefecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Localite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sousPrefectureId" TEXT NOT NULL,

    CONSTRAINT "Localite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decoupage" (
    "id" TEXT NOT NULL,
    "nombreEnroler" INTEGER,
    "districtId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "sousPrefectureId" TEXT NOT NULL,
    "localiteId" TEXT NOT NULL,

    CONSTRAINT "Decoupage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "codeGenerate" TEXT,
    "passwordGenerate" TEXT,
    "enrollementsId" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INACTIVE',
    "phoneCountryCode" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'MOBILE_MONEY',
    "rechargeType" TEXT NOT NULL DEFAULT 'WAVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountNumber" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionNumber" TEXT,
    "type" "TransactionType" NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "prixEnGros" DOUBLE PRECISION,
    "addedById" TEXT NOT NULL,
    "decoupageId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "TypeCompte" "TypeCompte" NOT NULL,
    "agent_id" TEXT NOT NULL,
    "agent_superviseur_id" TEXT,
    "user_control_id" TEXT,
    "confirm_validation_control" BOOLEAN,
    "numero_lot" TEXT,
    "validation_control" BOOLEAN,
    "date_validation_control" TIMESTAMP(3),
    "date_confirm_validation_control" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_select_lot" TEXT,
    "status_dossier" "StatusDossier",
    "time_enrolment" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "datedenaissance" TIMESTAMP(3) NOT NULL,
    "lieudenaissance" TEXT NOT NULL,
    "sexe" TEXT NOT NULL,
    "site" TEXT,
    "nationalit" TEXT,
    "situationmatrimoniale" TEXT NOT NULL,
    "niveaudinstruction" "NiveauInstruction" NOT NULL,
    "numroprincipal" TEXT NOT NULL,
    "languelocaleparle" TEXT NOT NULL,
    "autreslanguelocaleparle" TEXT,
    "decoupageId" TEXT NOT NULL,
    "campementquartier" TEXT,
    "coordonneesgeo" TEXT,
    "activitprincipaleId" TEXT,
    "spculationprincipaleId" TEXT,
    "superficiedevotreparcellecultu" DOUBLE PRECISION,
    "indiquezlasuperficieenha" DOUBLE PRECISION,
    "quantitproduction" DOUBLE PRECISION,
    "prcisezlenombre" INTEGER,
    "moyendestockage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceOrder" (
    "id" TEXT NOT NULL,
    "ordersNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "amount" DOUBLE PRECISION,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "EcommerceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceOrderItem" (
    "id" TEXT NOT NULL,
    "ecommerceOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EcommerceOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speculation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileManager" (
    "id" SERIAL NOT NULL,
    "fileCode" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "contact" TEXT,
    "email" TEXT,
    "pushOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_accountNumber_key" ON "Wallet"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionNumber_key" ON "Transaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollements_code_key" ON "Enrollements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceOrder_ordersNumber_key" ON "EcommerceOrder"("ordersNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Activite_nom_key" ON "Activite"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Speculation_nom_key" ON "Speculation"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "FileManager_fileCode_key" ON "FileManager"("fileCode");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SousPrefecture" ADD CONSTRAINT "SousPrefecture_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Localite" ADD CONSTRAINT "Localite_sousPrefectureId_fkey" FOREIGN KEY ("sousPrefectureId") REFERENCES "SousPrefecture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_sousPrefectureId_fkey" FOREIGN KEY ("sousPrefectureId") REFERENCES "SousPrefecture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_localiteId_fkey" FOREIGN KEY ("localiteId") REFERENCES "Localite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_decoupageId_fkey" FOREIGN KEY ("decoupageId") REFERENCES "Decoupage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_agent_superviseur_id_fkey" FOREIGN KEY ("agent_superviseur_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_user_control_id_fkey" FOREIGN KEY ("user_control_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_decoupageId_fkey" FOREIGN KEY ("decoupageId") REFERENCES "Decoupage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_activitprincipaleId_fkey" FOREIGN KEY ("activitprincipaleId") REFERENCES "Activite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_spculationprincipaleId_fkey" FOREIGN KEY ("spculationprincipaleId") REFERENCES "Speculation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrder" ADD CONSTRAINT "EcommerceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrder" ADD CONSTRAINT "EcommerceOrder_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrderItem" ADD CONSTRAINT "EcommerceOrderItem_ecommerceOrderId_fkey" FOREIGN KEY ("ecommerceOrderId") REFERENCES "EcommerceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrderItem" ADD CONSTRAINT "EcommerceOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
