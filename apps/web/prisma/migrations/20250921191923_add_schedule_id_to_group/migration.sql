-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "scheduleId" UUID;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
