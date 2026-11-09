-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amountBDT" DECIMAL(12,2),
ADD COLUMN     "attempts" JSONB,
ADD COLUMN     "bankTranId" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(10,4),
ADD COLUMN     "method" TEXT,
ADD COLUMN     "refundAmountBDT" DECIMAL(12,2),
ADD COLUMN     "refundRefId" TEXT,
ADD COLUMN     "refundStatus" TEXT;
