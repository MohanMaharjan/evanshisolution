/*
  Warnings:

  - You are about to drop the `faculty_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('active', 'inactive', 'completed');

-- DropForeignKey
ALTER TABLE "faculty_profiles" DROP CONSTRAINT "faculty_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_userId_fkey";

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "status" "BatchStatus" NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE "faculty_profiles";

-- DropTable
DROP TABLE "student_profiles";

-- CreateTable
CREATE TABLE "student" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "enrollmentNo" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT,
    "bloodGroup" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "currentSemester" INTEGER,
    "departmentId" INTEGER NOT NULL,
    "program" TEXT,
    "batchId" INTEGER,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "specialization" TEXT,
    "dateOfJoining" TIMESTAMP(3) NOT NULL,
    "qualification" TEXT,
    "experience" INTEGER,
    "bio" TEXT,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_userId_key" ON "student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_rollNumber_key" ON "student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollmentNo_key" ON "student"("enrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_userId_key" ON "faculty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_employeeId_key" ON "faculty"("employeeId");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
