/*
  Warnings:

  - You are about to drop the column `generated_videos_count` on the `user_stats` table. All the data in the column will be lost.
  - You are about to drop the `billing_billing_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `billing_billing_freeze_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `billing_billing_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_generation_outputs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_generation_tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_purchases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "billing_billing_freeze_records" DROP CONSTRAINT "billing_billing_freeze_records_billing_account_id_fkey";

-- DropForeignKey
ALTER TABLE "billing_billing_records" DROP CONSTRAINT "billing_billing_records_billing_account_id_fkey";

-- DropForeignKey
ALTER TABLE "membership_subscription_delivery_effects" DROP CONSTRAINT "membership_subscription_delivery_effects_delivery_id_fkey";

-- DropForeignKey
ALTER TABLE "video_assets" DROP CONSTRAINT "video_assets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "video_generation_outputs" DROP CONSTRAINT "video_generation_outputs_task_id_fkey";

-- DropForeignKey
ALTER TABLE "video_generation_tasks" DROP CONSTRAINT "video_generation_tasks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "video_purchases" DROP CONSTRAINT "video_purchases_task_id_fkey";

-- DropForeignKey
ALTER TABLE "video_purchases" DROP CONSTRAINT "video_purchases_user_id_fkey";

-- AlterTable
ALTER TABLE "user_stats" DROP COLUMN "generated_videos_count";

-- DropTable
DROP TABLE "billing_billing_accounts";

-- DropTable
DROP TABLE "billing_billing_freeze_records";

-- DropTable
DROP TABLE "billing_billing_records";

-- DropTable
DROP TABLE "video_assets";

-- DropTable
DROP TABLE "video_generation_outputs";

-- DropTable
DROP TABLE "video_generation_tasks";

-- DropTable
DROP TABLE "video_purchases";

-- DropEnum
DROP TYPE "BillingAccountStatus";

-- DropEnum
DROP TYPE "BillingAccountType";

-- DropEnum
DROP TYPE "BillingBusinessType";

-- DropEnum
DROP TYPE "BillingFreezeStatus";

-- DropEnum
DROP TYPE "BillingOperationType";

-- DropEnum
DROP TYPE "BillingRecordStatus";

-- DropEnum
DROP TYPE "BillingSubAccountType";

-- DropEnum
DROP TYPE "VideoPurchaseStatus";

-- DropEnum
DROP TYPE "VideoPurchaseType";

-- DropEnum
DROP TYPE "VideoTaskType";

-- AddForeignKey
ALTER TABLE "membership_subscription_delivery_effects" ADD CONSTRAINT "membership_subscription_delivery_effects_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "membership_subscription_deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
