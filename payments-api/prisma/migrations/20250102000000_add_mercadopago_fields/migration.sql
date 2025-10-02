-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "checkoutUrl" TEXT,
ADD COLUMN     "mercadoPagoPreferenceId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_mercadoPagoPreferenceId_idx" ON "Payment"("mercadoPagoPreferenceId");
