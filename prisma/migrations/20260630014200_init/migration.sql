-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'dropped', 'completed');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused', 'holiday');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('regular', 'makeup', 'special', 'exam', 'holiday');

-- CreateTable
CREATE TABLE "Classroom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "semester" TEXT DEFAULT 'semester1',
    "batchId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "courseId" INTEGER,
    "facultyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "ClassroomEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "remarks" TEXT,
    "markedBy" INTEGER,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "classSessionId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSummary" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "presentCount" INTEGER NOT NULL DEFAULT 0,
    "absentCount" INTEGER NOT NULL DEFAULT 0,
    "lateCount" INTEGER NOT NULL DEFAULT 0,
    "excusedCount" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "syllabusCovered" TEXT,
    "notes" TEXT,
    "materialUrl" TEXT,
    "sessionType" "SessionType" NOT NULL DEFAULT 'regular',
    "classroomId" INTEGER NOT NULL,
    "facultyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Classroom_batchId_idx" ON "Classroom"("batchId");

-- CreateIndex
CREATE INDEX "Classroom_facultyId_idx" ON "Classroom"("facultyId");

-- CreateIndex
CREATE INDEX "Classroom_courseId_idx" ON "Classroom"("courseId");

-- CreateIndex
CREATE INDEX "Classroom_departmentId_idx" ON "Classroom"("departmentId");

-- CreateIndex
CREATE INDEX "ClassroomEnrollment_classroomId_idx" ON "ClassroomEnrollment"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomEnrollment_studentId_idx" ON "ClassroomEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomEnrollment_studentId_classroomId_key" ON "ClassroomEnrollment"("studentId", "classroomId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_classSessionId_idx" ON "Attendance"("classSessionId");

-- CreateIndex
CREATE INDEX "Attendance_classroomId_idx" ON "Attendance"("classroomId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_classSessionId_key" ON "Attendance"("studentId", "classSessionId");

-- CreateIndex
CREATE INDEX "AttendanceSummary_studentId_idx" ON "AttendanceSummary"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceSummary_classroomId_idx" ON "AttendanceSummary"("classroomId");

-- CreateIndex
CREATE INDEX "AttendanceSummary_percentage_idx" ON "AttendanceSummary"("percentage");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSummary_studentId_classroomId_key" ON "AttendanceSummary"("studentId", "classroomId");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "ClassSession"("date");

-- CreateIndex
CREATE INDEX "ClassSession_classroomId_date_idx" ON "ClassSession"("classroomId", "date");

-- CreateIndex
CREATE INDEX "ClassSession_facultyId_idx" ON "ClassSession"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_classroomId_date_startTime_key" ON "ClassSession"("classroomId", "date", "startTime");

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomEnrollment" ADD CONSTRAINT "ClassroomEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomEnrollment" ADD CONSTRAINT "ClassroomEnrollment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
