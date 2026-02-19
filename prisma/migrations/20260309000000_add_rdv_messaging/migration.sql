-- P10-E: Appointment messaging (USER <-> PRO) with notification dedup (additive only)

ALTER TABLE "CitizenUser"
  ADD COLUMN IF NOT EXISTS "notificationEmailEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ProUser"
  ADD COLUMN IF NOT EXISTS "notificationEmailEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "RdvConversation" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "structureId" TEXT NOT NULL,
  "citizenUserId" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RdvConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RdvConversationMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "senderCitizenUserId" TEXT,
  "senderProUserId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RdvConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RdvNotificationLog" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'MESSAGE_EMAIL',
  "conversationId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "recipientType" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RdvNotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RdvConversation_appointmentId_key"
  ON "RdvConversation"("appointmentId");

CREATE INDEX IF NOT EXISTS "RdvConversation_structureId_lastMessageAt_idx"
  ON "RdvConversation"("structureId", "lastMessageAt");

CREATE INDEX IF NOT EXISTS "RdvConversation_citizenUserId_lastMessageAt_idx"
  ON "RdvConversation"("citizenUserId", "lastMessageAt");

CREATE INDEX IF NOT EXISTS "RdvConversationMessage_conversationId_createdAt_idx"
  ON "RdvConversationMessage"("conversationId", "createdAt");

CREATE INDEX IF NOT EXISTS "RdvConversationMessage_senderCitizenUserId_idx"
  ON "RdvConversationMessage"("senderCitizenUserId");

CREATE INDEX IF NOT EXISTS "RdvConversationMessage_senderProUserId_idx"
  ON "RdvConversationMessage"("senderProUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "RdvNotificationLog_messageId_recipientType_key"
  ON "RdvNotificationLog"("messageId", "recipientType");

CREATE INDEX IF NOT EXISTS "RdvNotificationLog_conversationId_sentAt_idx"
  ON "RdvNotificationLog"("conversationId", "sentAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvConversation_appointmentId_fkey'
  ) THEN
    ALTER TABLE "RdvConversation"
      ADD CONSTRAINT "RdvConversation_appointmentId_fkey"
      FOREIGN KEY ("appointmentId")
      REFERENCES "ProAppointment"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvConversation_structureId_fkey'
  ) THEN
    ALTER TABLE "RdvConversation"
      ADD CONSTRAINT "RdvConversation_structureId_fkey"
      FOREIGN KEY ("structureId")
      REFERENCES "Structure"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvConversation_citizenUserId_fkey'
  ) THEN
    ALTER TABLE "RdvConversation"
      ADD CONSTRAINT "RdvConversation_citizenUserId_fkey"
      FOREIGN KEY ("citizenUserId")
      REFERENCES "CitizenUser"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvConversationMessage_conversationId_fkey'
  ) THEN
    ALTER TABLE "RdvConversationMessage"
      ADD CONSTRAINT "RdvConversationMessage_conversationId_fkey"
      FOREIGN KEY ("conversationId")
      REFERENCES "RdvConversation"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvConversationMessage_senderCitizenUserId_fkey'
  ) THEN
    ALTER TABLE "RdvConversationMessage"
      ADD CONSTRAINT "RdvConversationMessage_senderCitizenUserId_fkey"
      FOREIGN KEY ("senderCitizenUserId")
      REFERENCES "CitizenUser"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvConversationMessage_senderProUserId_fkey'
  ) THEN
    ALTER TABLE "RdvConversationMessage"
      ADD CONSTRAINT "RdvConversationMessage_senderProUserId_fkey"
      FOREIGN KEY ("senderProUserId")
      REFERENCES "ProUser"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvNotificationLog_conversationId_fkey'
  ) THEN
    ALTER TABLE "RdvNotificationLog"
      ADD CONSTRAINT "RdvNotificationLog_conversationId_fkey"
      FOREIGN KEY ("conversationId")
      REFERENCES "RdvConversation"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RdvNotificationLog_messageId_fkey'
  ) THEN
    ALTER TABLE "RdvNotificationLog"
      ADD CONSTRAINT "RdvNotificationLog_messageId_fkey"
      FOREIGN KEY ("messageId")
      REFERENCES "RdvConversationMessage"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
