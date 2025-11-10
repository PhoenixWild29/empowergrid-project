-- Create enums
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');
CREATE TYPE "ActivityCategory" AS ENUM ('FUNDING', 'MILESTONE', 'GOVERNANCE', 'IMPACT');
CREATE TYPE "RecommendationCategory" AS ENUM ('INVESTOR', 'DEVELOPER', 'VALIDATOR');

-- Activity events table
CREATE TABLE "ActivityEvent" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "ActivitySeverity" NOT NULL DEFAULT 'INFO',
    "category" "ActivityCategory" NOT NULL DEFAULT 'IMPACT',
    "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "metadata" JSONB,
    "acknowledgedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "ActivityEvent_category_idx" ON "ActivityEvent" ("category");
CREATE INDEX "ActivityEvent_severity_idx" ON "ActivityEvent" ("severity");
CREATE INDEX "ActivityEvent_occurredAt_idx" ON "ActivityEvent" ("occurredAt" DESC);

-- Notification preferences table
CREATE TABLE "NotificationPreference" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "categories" JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference" ("userId");

-- Recommendation snapshots table
CREATE TABLE "RecommendationSnapshot" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT,
    "category" "RecommendationCategory" NOT NULL DEFAULT 'INVESTOR',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "metadata" JSONB
);

CREATE INDEX "RecommendationSnapshot_userId_idx" ON "RecommendationSnapshot" ("userId");
CREATE INDEX "RecommendationSnapshot_category_idx" ON "RecommendationSnapshot" ("category");
