-- CreateTable ConversationLog (Audit & Amélioration RAG)
CREATE TABLE IF NOT EXISTS "ConversationLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "intent" TEXT,
    "searchMode" TEXT NOT NULL DEFAULT 'rag',
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,

    CONSTRAINT "ConversationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConversationLog_createdAt_idx" ON "ConversationLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ConversationLog_searchMode_idx" ON "ConversationLog"("searchMode");
