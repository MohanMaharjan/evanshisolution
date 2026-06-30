/*
  Warnings:

  - You are about to drop the `student` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive');

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_batchId_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_userId_fkey";

-- DropTable
DROP TABLE "student";

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "enrollmentNo" TEXT,
    "rollNo" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "profilePicture" TEXT,
    "status" "Status" NOT NULL DEFAULT 'active',
    "inactiveDate" TIMESTAMP(3),
    "examRollNumber" TEXT,
    "enrollmentDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "bloodGroup" TEXT,
    "guardianName" TEXT,
    "guardianContact" TEXT,
    "guardianEmail" TEXT,
    "emergencyContact" TEXT,
    "userId" INTEGER,
    "batchId" INTEGER,
    "departmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Student_enrollmentNo_key" ON "Student"("enrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_examRollNumber_key" ON "Student"("examRollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_batchId_idx" ON "Student"("batchId");

-- CreateIndex
CREATE INDEX "Student_enrollmentNo_idx" ON "Student"("enrollmentNo");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
