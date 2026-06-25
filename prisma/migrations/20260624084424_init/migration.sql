/*
  Warnings:

  - You are about to drop the column `userLevel` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `userLevel` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "roles_userLevel_key";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "userLevel";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "userLevel";

-- DropEnum
DROP TYPE "UserLevel";
