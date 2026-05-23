/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshVersion` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EmailVerification_userId_idx";

-- DropIndex
DROP INDEX "Membership_organizationId_idx";

-- DropIndex
DROP INDEX "Organization_stripeCustomerId_key";

-- DropIndex
DROP INDEX "Organization_stripeSubscriptionId_key";

-- DropIndex
DROP INDEX "PasswordReset_userId_idx";

-- DropIndex
DROP INDEX "RefreshToken_userId_idx";

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
DROP COLUMN "subscriptionStatus";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "ipAddress",
DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
DROP COLUMN "googleId",
DROP COLUMN "refreshVersion";

-- DropEnum
DROP TYPE "SubscriptionStatus";
