-- Add feedback columns to ConversationLog
ALTER TABLE "ConversationLog" ADD COLUMN IF NOT EXISTS "rating" INTEGER;
ALTER TABLE "ConversationLog" ADD COLUMN IF NOT EXISTS "userComment" TEXT;

-- Index for filtering negative feedback
CREATE INDEX IF NOT EXISTS "ConversationLog_rating_idx" ON "ConversationLog"("rating");
