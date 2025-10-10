/**
 * Reputation System Data Models
 * 
 * TypeScript interfaces for reputation tracking
 */

/**
 * Reputation Score Model
 */
export interface ReputationScore {
  userId: string;
  score: number;
  lastUpdated: Date;
  tier?: string;
  rank?: number;
}

/**
 * Reputation Activity Model
 */
export interface ReputationActivity {
  id: string;
  userId: string;
  activityType: string;
  pointsAwarded: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Activity Type Definitions
 */
export enum ActivityType {
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  PROJECT_FUNDED = 'PROJECT_FUNDED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  COMMENT_POSTED = 'COMMENT_POSTED',
  PROFILE_VERIFIED = 'PROFILE_VERIFIED',
  FIRST_LOGIN = 'FIRST_LOGIN',
  REFERRAL_SUCCESS = 'REFERRAL_SUCCESS',
  POSITIVE_REVIEW = 'POSITIVE_REVIEW',
  NEGATIVE_REVIEW = 'NEGATIVE_REVIEW',
}

/**
 * Activity Point Values
 */
export const ACTIVITY_POINTS: Record<ActivityType, number> = {
  [ActivityType.PROJECT_CREATED]: 10,
  [ActivityType.PROJECT_COMPLETED]: 25,
  [ActivityType.PROJECT_FUNDED]: 5,
  [ActivityType.MILESTONE_COMPLETED]: 15,
  [ActivityType.COMMENT_POSTED]: 1,
  [ActivityType.PROFILE_VERIFIED]: 20,
  [ActivityType.FIRST_LOGIN]: 5,
  [ActivityType.REFERRAL_SUCCESS]: 10,
  [ActivityType.POSITIVE_REVIEW]: 3,
  [ActivityType.NEGATIVE_REVIEW]: -5,
};

/**
 * Reputation Tier Definitions
 */
export interface ReputationTier {
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  icon: string;
}

export const REPUTATION_TIERS: ReputationTier[] = [
  { name: 'Legend', minScore: 1000, maxScore: Infinity, color: '#ffd700', icon: '👑' },
  { name: 'Expert', minScore: 500, maxScore: 999, color: '#9b59b6', icon: '🏆' },
  { name: 'Advanced', minScore: 250, maxScore: 499, color: '#3498db', icon: '⭐' },
  { name: 'Intermediate', minScore: 100, maxScore: 249, color: '#2ecc71', icon: '✓' },
  { name: 'Rising', minScore: 50, maxScore: 99, color: '#95a5a6', icon: '↗' },
  { name: 'Newcomer', minScore: 0, maxScore: 49, color: '#bdc3c7', icon: '🌱' },
];

/**
 * User with Reputation Data
 */
export interface UserWithReputation {
  userId: string;
  username: string;
  reputation: number;
  tier: string;
  rank: number;
  activities: ReputationActivity[];
}

/**
 * Reputation Summary
 */
export interface ReputationSummary {
  totalScore: number;
  tier: ReputationTier;
  rank: number;
  totalUsers: number;
  percentile: number;
  recentActivities: ReputationActivity[];
}

/**
 * Get tier for score
 */
export function getTierForScore(score: number): ReputationTier {
  return REPUTATION_TIERS.find(
    tier => score >= tier.minScore && score <= tier.maxScore
  ) || REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
}




