/*
  Warnings:

  - You are about to drop the `faculty` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FacultyStatus" AS ENUM ('active', 'inactive');

-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_userId_fkey";

-- DropTable
DROP TABLE "faculty";

-- CreateTable
CREATE TABLE "Faculty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cv" TEXT,
    "designation" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "profilePicture" TEXT,
    "status" "FacultyStatus" NOT NULL DEFAULT 'active',
    "userId" INTEGER,
    "userDepartmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_phone_key" ON "Faculty"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_userId_key" ON "Faculty"("userId");

-- CreateIndex
CREATE INDEX "Faculty_userDepartmentId_idx" ON "Faculty"("userDepartmentId");

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_userDepartmentId_fkey" FOREIGN KEY ("userDepartmentId") REFERENCES "user_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
