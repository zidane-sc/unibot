-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[];
