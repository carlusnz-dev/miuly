/*
  Warnings:

  - You are about to drop the `Finaces` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Finaces" DROP CONSTRAINT "Finaces_bank_id_fkey";

-- DropForeignKey
ALTER TABLE "Finaces" DROP CONSTRAINT "Finaces_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Finaces" DROP CONSTRAINT "Finaces_user_id_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "Finaces";

-- CreateTable
CREATE TABLE "Finances" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "type_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Finances" ADD CONSTRAINT "Finances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finances" ADD CONSTRAINT "Finances_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "Types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finances" ADD CONSTRAINT "Finances_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "Bank"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
