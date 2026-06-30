-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('core', 'elective');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('semester1', 'semester2', 'semester3', 'semester4', 'semester5', 'semester6', 'semester7', 'semester8');

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER,
    "description" TEXT,
    "lecture" INTEGER,
    "tutorial" INTEGER,
    "practical" INTEGER,
    "noncredit" BOOLEAN NOT NULL DEFAULT false,
    "courseType" "CourseType" NOT NULL DEFAULT 'core',
    "semester" "Semester" NOT NULL DEFAULT 'semester1',
    "syllabus" TEXT,
    "departmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseList" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "semester" "Semester" NOT NULL DEFAULT 'semester1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BatchToDepartment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BatchToDepartment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_departmentId_idx" ON "Course"("departmentId");

-- CreateIndex
CREATE INDEX "Course_code_idx" ON "Course"("code");

-- CreateIndex
CREATE INDEX "CourseList_batchId_idx" ON "CourseList"("batchId");

-- CreateIndex
CREATE INDEX "CourseList_courseId_idx" ON "CourseList"("courseId");

-- CreateIndex
CREATE INDEX "CourseList_semester_idx" ON "CourseList"("semester");

-- CreateIndex
CREATE UNIQUE INDEX "CourseList_batchId_courseId_semester_key" ON "CourseList"("batchId", "courseId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_name_key" ON "Batch"("name");

-- CreateIndex
CREATE INDEX "Batch_name_idx" ON "Batch"("name");

-- CreateIndex
CREATE INDEX "_BatchToDepartment_B_index" ON "_BatchToDepartment"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseList" ADD CONSTRAINT "CourseList_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseList" ADD CONSTRAINT "CourseList_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseList" ADD CONSTRAINT "CourseList_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchToDepartment" ADD CONSTRAINT "_BatchToDepartment_A_fkey" FOREIGN KEY ("A") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchToDepartment" ADD CONSTRAINT "_BatchToDepartment_B_fkey" FOREIGN KEY ("B") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
