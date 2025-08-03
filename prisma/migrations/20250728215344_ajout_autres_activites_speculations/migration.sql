-- CreateTable
CREATE TABLE "AutreActivite" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "activiteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "userId" TEXT NOT NULL,
    "enrollementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutreSpeculation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutreActivite" ADD CONSTRAINT "AutreActivite_activiteId_fkey" FOREIGN KEY ("activiteId") REFERENCES "Activite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreActivite" ADD CONSTRAINT "AutreActivite_enrollementId_fkey" FOREIGN KEY ("enrollementId") REFERENCES "Enrollements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreSpeculation" ADD CONSTRAINT "AutreSpeculation_speculationId_fkey" FOREIGN KEY ("speculationId") REFERENCES "Speculation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutreSpeculation" ADD CONSTRAINT "AutreSpeculation_enrollementId_fkey" FOREIGN KEY ("enrollementId") REFERENCES "Enrollements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
