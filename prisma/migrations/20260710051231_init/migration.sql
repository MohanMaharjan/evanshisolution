/*
  Warnings:

  - You are about to drop the column `status` on the `ExamType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExamType" DROP COLUMN "status";

-- DropEnum
DROP TYPE "ExamTypeStatus";
