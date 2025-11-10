export type ActivitySeverity = 'info' | 'success' | 'warning' | 'critical';
export type ActivityCategory = 'funding' | 'milestone' | 'governance' | 'impact';

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  severity: ActivitySeverity;
  category: ActivityCategory;
  occurredAt: string;
  metadata?: Record<string, any>;
  acknowledgedAt?: string | null;
}

export interface RecommendationCard {
  id: string;
  title: string;
  summary: string;
  actionLabel: string;
  href: string;
  score: number;
  category: 'investor' | 'developer' | 'validator';
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
    webhook: boolean;
  };
  categories: ActivityCategory[];
  updatedAt: string;
}
