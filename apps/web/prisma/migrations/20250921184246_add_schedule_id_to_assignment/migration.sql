-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "scheduleId" UUID;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
