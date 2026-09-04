-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "customerName" TEXT,
    "itemCount" INTEGER NOT NULL,
    "monthlyPaise" INTEGER NOT NULL,
    "downPaymentPaise" INTEGER NOT NULL,
    "cashbackPaise" INTEGER NOT NULL,
    "totalPayablePaise" INTEGER NOT NULL,
    "firstEmiOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "variantLabel" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "emiPlanId" TEXT NOT NULL,
    "planTitle" TEXT NOT NULL,
    "fundName" TEXT NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPricePaise" INTEGER NOT NULL,
    "monthlyPaise" INTEGER NOT NULL,
    "downPaymentPaise" INTEGER NOT NULL,
    "cashbackPaise" INTEGER NOT NULL,
    "totalPayablePaise" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_key" ON "orders"("reference");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
