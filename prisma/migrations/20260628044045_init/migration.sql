-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('active', 'inactive', 'archived');

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "DepartmentStatus" NOT NULL DEFAULT 'active';
