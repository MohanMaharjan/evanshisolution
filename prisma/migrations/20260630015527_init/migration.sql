-- CreateTable
CREATE TABLE "BatchPreference" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "selectedSemester" TEXT DEFAULT 'semester1',
    "statusFilter" TEXT DEFAULT 'all',
    "classroomStatusFilter" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BatchPreference_batchId_key" ON "BatchPreference"("batchId");

-- AddForeignKey
ALTER TABLE "BatchPreference" ADD CONSTRAINT "BatchPreference_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
