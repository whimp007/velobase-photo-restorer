-- CreateEnum
CREATE TYPE "RestorationMode" AS ENUM ('RESTORE', 'ENHANCE', 'COLORIZE', 'RESTORE_COLORIZE');

-- CreateEnum
CREATE TYPE "RestorationStatus" AS ENUM ('PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "restorations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" "RestorationMode" NOT NULL,
    "status" "RestorationStatus" NOT NULL DEFAULT 'PROCESSING',
    "batch_id" TEXT,
    "original_key" TEXT,
    "original_url" TEXT,
    "restored_key" TEXT,
    "restored_url" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restorations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restorations_user_id_created_at_idx" ON "restorations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "restorations_batch_id_idx" ON "restorations"("batch_id");

-- AddForeignKey
ALTER TABLE "restorations" ADD CONSTRAINT "restorations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
