/*
  Warnings:

  - The `applies_to` column on the `Types` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `user_id` to the `Types` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AppliesTo" AS ENUM ('FINANCES', 'TASK');

-- AlterTable
ALTER TABLE "Types" ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "applies_to",
ADD COLUMN     "applies_to" "AppliesTo" NOT NULL DEFAULT 'FINANCES';

-- AddForeignKey
ALTER TABLE "Types" ADD CONSTRAINT "Types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
