/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `p2pTransfer` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `p2pTransfer` table. All the data in the column will be lost.
  - Added the required column `receiverId` to the `p2pTransfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `p2pTransfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "p2pTransfer" DROP CONSTRAINT "p2pTransfer_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "p2pTransfer" DROP CONSTRAINT "p2pTransfer_toUserId_fkey";

-- AlterTable
ALTER TABLE "p2pTransfer" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "receiverId" INTEGER NOT NULL,
ADD COLUMN     "senderId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "p2pTransfer" ADD CONSTRAINT "p2pTransfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2pTransfer" ADD CONSTRAINT "p2pTransfer_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
