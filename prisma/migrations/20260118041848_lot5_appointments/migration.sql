-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "proId" TEXT,
    "slots_json" JSONB NOT NULL DEFAULT '{}',
    "exceptions_json" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "contact_encrypted" TEXT NOT NULL,
    "contact_hash" TEXT NOT NULL,
    "first_name_encrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "proId" TEXT,
    "beneficiaryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "mode" TEXT NOT NULL,
    "lock_expires_at" TIMESTAMP(3),
    "cancel_token_hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Availability_structureId_proId_key" ON "Availability"("structureId", "proId");

-- CreateIndex
CREATE INDEX "Beneficiary_contact_hash_idx" ON "Beneficiary"("contact_hash");

-- CreateIndex
CREATE INDEX "Appointment_structureId_start_at_idx" ON "Appointment"("structureId", "start_at");

-- CreateIndex
CREATE INDEX "Appointment_proId_start_at_idx" ON "Appointment"("proId", "start_at");

-- CreateIndex
CREATE INDEX "Appointment_cancel_token_hash_idx" ON "Appointment"("cancel_token_hash");

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_proId_fkey" FOREIGN KEY ("proId") REFERENCES "ProUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_proId_fkey" FOREIGN KEY ("proId") REFERENCES "ProUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
