/*
  Warnings:

  - A unique constraint covering the columns `[user_id,name]` on the table `Types` will be added. If there are existing duplicate values, this will fail.
  - Changed the column `applies_to` on the `Types` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- DropIndex
DROP INDEX "Types_name_key";

-- AlterTable
ALTER TABLE "Types" ALTER COLUMN "applies_to" DROP DEFAULT,
ALTER COLUMN "applies_to" SET DATA TYPE "AppliesTo"[]
USING ARRAY["applies_to"];

-- CreateIndex
CREATE UNIQUE INDEX "Types_user_id_name_key" ON "Types"("user_id", "name");
