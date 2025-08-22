/*
  Warnings:

  - You are about to drop the column `company_name` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `job_title` on the `contacts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "company_name",
DROP COLUMN "job_title";
