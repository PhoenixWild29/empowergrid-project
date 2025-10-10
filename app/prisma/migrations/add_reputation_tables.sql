-- Migration: Add Reputation System Tables
-- Creates tables for tracking user reputation scores and activities

-- Create ReputationScore table
CREATE TABLE IF NOT EXISTS "reputation_scores" (
  "user_id" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "last_updated" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tier" VARCHAR(50),
  "rank" INTEGER,
  
  CONSTRAINT "reputation_scores_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "reputation_scores_user_fkey" FOREIGN KEY ("user_id") 
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "reputation_scores_score_check" CHECK ("score" >= 0)
);

-- Create ReputationActivity table
CREATE TABLE IF NOT EXISTS "reputation_activities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "activity_type" VARCHAR(255) NOT NULL,
  "points_awarded" INTEGER NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "reputation_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reputation_activities_user_fkey" FOREIGN KEY ("user_id") 
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_reputation_scores_score" ON "reputation_scores"("score" DESC);
CREATE INDEX IF NOT EXISTS "idx_reputation_scores_tier" ON "reputation_scores"("tier");

CREATE INDEX IF NOT EXISTS "idx_reputation_activities_user" ON "reputation_activities"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reputation_activities_type" ON "reputation_activities"("activity_type");
CREATE INDEX IF NOT EXISTS "idx_reputation_activities_created" ON "reputation_activities"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_reputation_activities_user_type" ON "reputation_activities"("user_id", "activity_type");

-- Create function to update reputation score from activities
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert reputation score
  INSERT INTO reputation_scores (user_id, score, last_updated)
  VALUES (NEW.user_id, NEW.points_awarded, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    score = reputation_scores.score + NEW.points_awarded,
    last_updated = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reputation on new activity
CREATE TRIGGER trigger_update_reputation
  AFTER INSERT ON reputation_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_score();

-- Create function to get reputation tier
CREATE OR REPLACE FUNCTION get_reputation_tier(score INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
  IF score >= 1000 THEN RETURN 'Legend';
  ELSIF score >= 500 THEN RETURN 'Expert';
  ELSIF score >= 250 THEN RETURN 'Advanced';
  ELSIF score >= 100 THEN RETURN 'Intermediate';
  ELSIF score >= 50 THEN RETURN 'Rising';
  ELSE RETURN 'Newcomer';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(user_id_param TEXT)
RETURNS TABLE (
  rank BIGINT,
  total_users BIGINT,
  percentile NUMERIC
) AS $$
DECLARE
  user_score INTEGER;
BEGIN
  -- Get user's score
  SELECT score INTO user_score
  FROM reputation_scores
  WHERE user_id = user_id_param;
  
  -- If no score found, return NULL
  IF user_score IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate rank and total
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) + 1 FROM reputation_scores WHERE score > user_score) as rank,
    (SELECT COUNT(*) FROM reputation_scores) as total_users,
    ROUND(
      ((SELECT COUNT(*) FROM reputation_scores WHERE score <= user_score)::NUMERIC / 
       (SELECT COUNT(*) FROM reputation_scores)::NUMERIC) * 100,
      2
    ) as percentile;
END;
$$ LANGUAGE plpgsql;




