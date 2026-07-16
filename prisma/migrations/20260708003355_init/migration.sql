-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CHAIRMAN');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('OK', 'WARNING', 'CRITICAL', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "portalToken" TEXT NOT NULL,
    "portalPin" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDeposit" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "depositDate" DATE NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'liter',
    "grade" "Grade",
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "editLog" JSONB NOT NULL DEFAULT '[]',
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerishableStock" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "dateIn" DATE NOT NULL,
    "shelfLifeDays" INTEGER NOT NULL,
    "expiryDate" DATE NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "StockStatus" NOT NULL DEFAULT 'OK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerishableStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "daysRemaining" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Member_portalToken_key" ON "Member"("portalToken");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDeposit_memberId_depositDate_key" ON "DailyDeposit"("memberId", "depositDate");

-- AddForeignKey
ALTER TABLE "DailyDeposit" ADD CONSTRAINT "DailyDeposit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDeposit" ADD CONSTRAINT "DailyDeposit_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
