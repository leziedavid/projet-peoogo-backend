-- CreateEnum
CREATE TYPE "ContactObjet" AS ENUM ('achat_produits', 'vente_produits', 'formation_agricole', 'financement_agricole', 'equipements_agricoles', 'conseil_technique', 'certification_bio', 'transformation_produits', 'marche_producteurs', 'innovation_agricole', 'partenariat_cooperatives', 'assurance_agricole', 'autre');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "nomPrenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "objets" "ContactObjet" NOT NULL,
    "contents" TEXT NOT NULL,
    "source" TEXT DEFAULT 'contact_form_agricole',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
