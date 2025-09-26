-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'AGENT_ENROLEUR', 'AGENT_CONTROLE', 'PRODUCTEUR');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('AGRICULTEURS', 'AQUACULTEURS', 'AUTRE_ACTEURS', 'APICULTEURS', 'REVENDEUR', 'TRANSFORMATEUR', 'ACHETEUR', 'RELAIS', 'SUPPERVISEUR', 'UTILISATEUR', 'ADMINISTRATEUR', 'ELEVEURS');

-- CreateEnum
CREATE TYPE "NiveauInstruction" AS ENUM ('AUCUN', 'PRIMAIRE', 'SECONDAIRE', 'SUPERIEUR', 'ALPHABETISE', 'UNIVERSITAIRE', 'SAIS_LIRE_ET_ECRIRE');

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
CREATE TYPE "OderPaiementStatus" AS ENUM ('EN_ATTENTE_DE_PAIEMENT', 'PAYE', 'PAYE_PARTIELLEMENT', 'ECHEC', 'ANNULE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('MOOV', 'ORANGE', 'MTN', 'WAVE');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('HOME_DELIVERY', 'STORE_PICKUP', 'LIFT', 'PICKUP', 'DROP');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('user', 'support');

-- CreateEnum
CREATE TYPE "ContactObjet" AS ENUM ('achat_produits', 'vente_produits', 'formation_agricole', 'financement_agricole', 'equipements_agricoles', 'conseil_technique', 'certification_bio', 'transformation_produits', 'marche_producteurs', 'innovation_agricole', 'partenariat_cooperatives', 'assurance_agricole', 'autre');

-- CreateEnum
CREATE TYPE "TypeFile" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN DEFAULT true,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN DEFAULT true,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN DEFAULT true,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SousPrefecture" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN DEFAULT true,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "SousPrefecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Localite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" BOOLEAN DEFAULT true,
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
    "typeCompte" "TypeCompte",
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
    "imageUrl" TEXT,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "prixEnGros" DOUBLE PRECISION,
    "paymentMethod" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "typeActeur" "TypeCompte" NOT NULL,
    "disponibleDe" TIMESTAMP(3) NOT NULL,
    "disponibleJusqua" TIMESTAMP(3) NOT NULL,
    "image" TEXT,
    "autreImage" TEXT,
    "codeUsers" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "confirm_validation_control" BOOLEAN DEFAULT false,
    "numero_lot" TEXT,
    "validation_control" BOOLEAN DEFAULT false,
    "date_validation_control" TIMESTAMP(3),
    "date_confirm_validation_control" TIMESTAMP(3),
    "commentaire_controle" TEXT,
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
    "numroprincipal" TEXT,
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
CREATE TABLE "AutreActivite" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "activiteId" TEXT NOT NULL,
    "userId" TEXT,
    "enrollementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutreActivite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutreSpeculation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "speculationId" TEXT NOT NULL,
    "userId" TEXT,
    "enrollementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutreSpeculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceOrder" (
    "id" TEXT NOT NULL,
    "ordersNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "OderPaiementStatus" NOT NULL DEFAULT 'EN_ATTENTE_DE_PAIEMENT',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "network" "Network",
    "paiementNumber" TEXT,
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
    "reverser" INTEGER DEFAULT 0,

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
    "filePath" TEXT,
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

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "text" TEXT,
    "imageUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender" "MessageSender" NOT NULL,
    "senderId" TEXT NOT NULL,
    "repliedToId" TEXT,
    "lastOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reversement" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformCommission" DOUBLE PRECISION NOT NULL,
    "producerEarnings" DOUBLE PRECISION NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reversement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "nomPrenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "objets" "ContactObjet" NOT NULL,
    "contents" TEXT NOT NULL,
    "source" TEXT DEFAULT 'contact_form_agricole',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slider" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "label" TEXT,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
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
    "headerLogo" TEXT,
    "footerLogo" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "PaymentMethodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Decoupage_districtId_regionId_departmentId_sousPrefectureId_key" ON "Decoupage"("districtId", "regionId", "departmentId", "sousPrefectureId", "localiteId");

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
CREATE UNIQUE INDEX "Enrollements_numroprincipal_key" ON "Enrollements"("numroprincipal");

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceOrder_ordersNumber_key" ON "EcommerceOrder"("ordersNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Activite_nom_key" ON "Activite"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Speculation_nom_key" ON "Speculation"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "FileManager_fileCode_key" ON "FileManager"("fileCode");

-- CreateIndex
CREATE UNIQUE INDEX "Reversement_transactionId_key" ON "Reversement"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reversement_transactionNumber_key" ON "Reversement"("transactionNumber");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SousPrefecture" ADD CONSTRAINT "SousPrefecture_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Localite" ADD CONSTRAINT "Localite_sousPrefectureId_fkey" FOREIGN KEY ("sousPrefectureId") REFERENCES "SousPrefecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_sousPrefectureId_fkey" FOREIGN KEY ("sousPrefectureId") REFERENCES "SousPrefecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoupage" ADD CONSTRAINT "Decoupage_localiteId_fkey" FOREIGN KEY ("localiteId") REFERENCES "Localite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_decoupageId_fkey" FOREIGN KEY ("decoupageId") REFERENCES "Decoupage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_agent_superviseur_id_fkey" FOREIGN KEY ("agent_superviseur_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_user_control_id_fkey" FOREIGN KEY ("user_control_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_decoupageId_fkey" FOREIGN KEY ("decoupageId") REFERENCES "Decoupage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_activitprincipaleId_fkey" FOREIGN KEY ("activitprincipaleId") REFERENCES "Activite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_spculationprincipaleId_fkey" FOREIGN KEY ("spculationprincipaleId") REFERENCES "Speculation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreActivite" ADD CONSTRAINT "AutreActivite_activiteId_fkey" FOREIGN KEY ("activiteId") REFERENCES "Activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreActivite" ADD CONSTRAINT "AutreActivite_enrollementId_fkey" FOREIGN KEY ("enrollementId") REFERENCES "Enrollements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreSpeculation" ADD CONSTRAINT "AutreSpeculation_speculationId_fkey" FOREIGN KEY ("speculationId") REFERENCES "Speculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreSpeculation" ADD CONSTRAINT "AutreSpeculation_enrollementId_fkey" FOREIGN KEY ("enrollementId") REFERENCES "Enrollements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrder" ADD CONSTRAINT "EcommerceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrder" ADD CONSTRAINT "EcommerceOrder_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrderItem" ADD CONSTRAINT "EcommerceOrderItem_ecommerceOrderId_fkey" FOREIGN KEY ("ecommerceOrderId") REFERENCES "EcommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcommerceOrderItem" ADD CONSTRAINT "EcommerceOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_repliedToId_fkey" FOREIGN KEY ("repliedToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EcommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slider" ADD CONSTRAINT "Slider_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicite" ADD CONSTRAINT "Publicite_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reglage" ADD CONSTRAINT "Reglage_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
