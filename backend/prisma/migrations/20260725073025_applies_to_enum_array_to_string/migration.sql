/*
  Warnings:

  - The `applies_to` column on the `Types` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Types" DROP CONSTRAINT "Types_user_id_fkey";

-- AlterTable
ALTER TABLE "Types" DROP COLUMN "applies_to",
ADD COLUMN     "applies_to" TEXT[];

-- AddForeignKey
ALTER TABLE "Types" ADD CONSTRAINT "Types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
