-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);
