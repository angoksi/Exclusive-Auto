-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('US', 'CA', 'KR');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('COPART', 'IAAI', 'ENCAR', 'KCAR', 'AUTOWINI', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('AUCTION', 'BUY_NOW');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'SALVAGE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('VEHICLE', 'CALCULATOR', 'WIZARD', 'CONTACT');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('SENT', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "source" "Source" NOT NULL,
    "sourceId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "vin" TEXT,
    "lotNumber" TEXT,
    "platform" TEXT,
    "saleType" "SaleType" NOT NULL DEFAULT 'AUCTION',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentBid" INTEGER,
    "buyNowPrice" INTEGER,
    "priceEur" INTEGER NOT NULL DEFAULT 0,
    "bidEur" INTEGER,
    "auctionDate" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "engine" TEXT NOT NULL,
    "fuel" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "drive" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "condition" "Condition" NOT NULL DEFAULT 'GOOD',
    "primaryDamage" TEXT,
    "secondaryDamage" TEXT,
    "runsAndDrives" BOOLEAN NOT NULL DEFAULT true,
    "hasKeys" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleImage" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VehicleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleHistoryEvent" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "odometerKm" INTEGER,
    "source" TEXT,

    CONSTRAINT "VehicleHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","vehicleId")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "type" "InquiryType" NOT NULL DEFAULT 'VEHICLE',
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "userId" TEXT,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "payload" JSONB,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "managerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalEur" INTEGER NOT NULL,
    "breakdown" JSONB,
    "notes" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'SENT',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleTitle" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 1,
    "estimatedDelivery" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "location" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cover" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "city" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT NOT NULL,
    "vehicle" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedDelivery" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "origin" "Region" NOT NULL,
    "days" INTEGER NOT NULL,
    "city" TEXT,
    "imageUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletedDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE INDEX "Vehicle_region_status_published_idx" ON "Vehicle"("region", "status", "published");

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "Vehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_priceEur_idx" ON "Vehicle"("priceEur");

-- CreateIndex
CREATE INDEX "Vehicle_auctionDate_idx" ON "Vehicle"("auctionDate");

-- CreateIndex
CREATE INDEX "VehicleImage_vehicleId_position_idx" ON "VehicleImage"("vehicleId", "position");

-- CreateIndex
CREATE INDEX "VehicleHistoryEvent_vehicleId_date_idx" ON "VehicleHistoryEvent"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_vin_idx" ON "Order"("vin");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- AddForeignKey
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleHistoryEvent" ADD CONSTRAINT "VehicleHistoryEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

