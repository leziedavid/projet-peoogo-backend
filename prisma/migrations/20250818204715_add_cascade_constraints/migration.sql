-- DropForeignKey
ALTER TABLE "AutreActivite" DROP CONSTRAINT "AutreActivite_activiteId_fkey";

-- DropForeignKey
ALTER TABLE "AutreActivite" DROP CONSTRAINT "AutreActivite_enrollementId_fkey";

-- DropForeignKey
ALTER TABLE "AutreSpeculation" DROP CONSTRAINT "AutreSpeculation_enrollementId_fkey";

-- DropForeignKey
ALTER TABLE "AutreSpeculation" DROP CONSTRAINT "AutreSpeculation_speculationId_fkey";

-- DropForeignKey
ALTER TABLE "Decoupage" DROP CONSTRAINT "Decoupage_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Decoupage" DROP CONSTRAINT "Decoupage_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Decoupage" DROP CONSTRAINT "Decoupage_localiteId_fkey";

-- DropForeignKey
ALTER TABLE "Decoupage" DROP CONSTRAINT "Decoupage_regionId_fkey";

-- DropForeignKey
ALTER TABLE "Decoupage" DROP CONSTRAINT "Decoupage_sousPrefectureId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_regionId_fkey";

-- DropForeignKey
ALTER TABLE "EcommerceOrder" DROP CONSTRAINT "EcommerceOrder_addedById_fkey";

-- DropForeignKey
ALTER TABLE "EcommerceOrder" DROP CONSTRAINT "EcommerceOrder_userId_fkey";

-- DropForeignKey
ALTER TABLE "EcommerceOrderItem" DROP CONSTRAINT "EcommerceOrderItem_ecommerceOrderId_fkey";

-- DropForeignKey
ALTER TABLE "EcommerceOrderItem" DROP CONSTRAINT "EcommerceOrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollements" DROP CONSTRAINT "Enrollements_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "Enrollements" DROP CONSTRAINT "Enrollements_decoupageId_fkey";

-- DropForeignKey
ALTER TABLE "Localite" DROP CONSTRAINT "Localite_sousPrefectureId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_addedById_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_decoupageId_fkey";

-- DropForeignKey
ALTER TABLE "Region" DROP CONSTRAINT "Region_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Reversement" DROP CONSTRAINT "Reversement_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Reversement" DROP CONSTRAINT "Reversement_producerId_fkey";

-- DropForeignKey
ALTER TABLE "Reversement" DROP CONSTRAINT "Reversement_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Reversement" DROP CONSTRAINT "Reversement_walletId_fkey";

-- DropForeignKey
ALTER TABLE "SousPrefecture" DROP CONSTRAINT "SousPrefecture_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

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
ALTER TABLE "Enrollements" ADD CONSTRAINT "Enrollements_decoupageId_fkey" FOREIGN KEY ("decoupageId") REFERENCES "Decoupage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EcommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reversement" ADD CONSTRAINT "Reversement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
