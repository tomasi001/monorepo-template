/*
  Warnings:

  - You are about to drop the column `stripeId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paystackReference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payment_stripeId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripeId",
ADD COLUMN     "paystackReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackReference_key" ON "Payment"("paystackReference");
