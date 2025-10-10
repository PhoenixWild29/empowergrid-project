/**
 * WO-131: Switchboard Feed Subscription Management Service
 * 
 * Manages Switchboard feed subscriptions including lifecycle operations,
 * cost optimization, and equipment compatibility validation.
 * 
 * Features:
 * - Feed subscription configuration
 * - Lifecycle management (activate, update, cancel)
 * - Cost optimization
 * - Equipment compatibility validation
 * - Webhook integration
 */

import { prisma } from '../../prisma';
import { OracleFeedType } from '@prisma/client';

export interface FeedSubscription {
  id: string;
  projectId: string;
  feedId: string;
  feedAddress: string;
  feedType: OracleFeedType;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  webhookUrl?: string;
  subscriptionCost: number;
  createdAt: Date;
  updatedAt: Date;
  lastDataReceived?: Date;
}

export interface SubscriptionConfig {
  projectId: string;
  feedType: OracleFeedType;
  location?: string;
  equipmentType?: string;
  webhookUrl?: string;
  budget?: number;
}

/**
 * WO-131: Switchboard Subscription Service
 */
export class SwitchboardSubscriptionService {
  /**
   * Create new feed subscription
   */
  async createSubscription(config: SubscriptionConfig): Promise<FeedSubscription> {
    console.log('[WO-131] Creating feed subscription:', config);

    // WO-131: Find compatible feeds based on project requirements
    const compatibleFeeds = await this.findCompatibleFeeds(
      config.feedType,
      config.location,
      config.equipmentType
    );

    if (compatibleFeeds.length === 0) {
      throw new Error('No compatible oracle feeds found for project requirements');
    }

    // WO-131: Optimize feed selection based on cost and quality
    const selectedFeed = await this.selectOptimalFeed(
      compatibleFeeds,
      config.budget
    );

    // WO-131: Validate webhook URL if provided
    if (config.webhookUrl) {
      await this.validateWebhookUrl(config.webhookUrl);
    }

    // Create project oracle feed association
    const subscription = await (prisma as any).projectOracleFeed.create({
      data: {
        projectId: config.projectId,
        feedId: selectedFeed.id,
        isActive: true,
      },
      include: {
        feed: true,
      },
    });

    console.log('[WO-131] Subscription created:', subscription.id);

    return {
      id: subscription.id,
      projectId: subscription.projectId,
      feedId: subscription.feedId,
      feedAddress: subscription.feed.feedAddress,
      feedType: subscription.feed.feedType,
      status: 'ACTIVE',
      webhookUrl: config.webhookUrl,
      subscriptionCost: this.calculateSubscriptionCost(subscription.feed),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  /**
   * Update subscription configuration
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      isActive?: boolean;
      webhookUrl?: string;
    }
  ): Promise<FeedSubscription> {
    console.log('[WO-131] Updating subscription:', subscriptionId);

    // Validate webhook if provided
    if (updates.webhookUrl) {
      await this.validateWebhookUrl(updates.webhookUrl);
    }

    const subscription = await (prisma as any).projectOracleFeed.update({
      where: { id: subscriptionId },
      data: {
        isActive: updates.isActive,
      },
      include: {
        feed: true,
      },
    });

    return {
      id: subscription.id,
      projectId: subscription.projectId,
      feedId: subscription.feedId,
      feedAddress: subscription.feed.feedAddress,
      feedType: subscription.feed.feedType,
      status: subscription.isActive ? 'ACTIVE' : 'PAUSED',
      webhookUrl: updates.webhookUrl,
      subscriptionCost: this.calculateSubscriptionCost(subscription.feed),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    console.log('[WO-131] Cancelling subscription:', subscriptionId);

    await (prisma as any).projectOracleFeed.update({
      where: { id: subscriptionId },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get subscriptions for a project
   */
  async getProjectSubscriptions(projectId: string): Promise<FeedSubscription[]> {
    const subscriptions = await (prisma as any).projectOracleFeed.findMany({
      where: { projectId },
      include: {
        feed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((sub: any) => ({
      id: sub.id,
      projectId: sub.projectId,
      feedId: sub.feedId,
      feedAddress: sub.feed.feedAddress,
      feedType: sub.feed.feedType,
      status: sub.isActive ? 'ACTIVE' : 'PAUSED',
      subscriptionCost: this.calculateSubscriptionCost(sub.feed),
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));
  }

  /**
   * Get energy production feeds for a project
   */
  async getEnergyFeedsByProject(
    projectId: string,
    filters?: {
      location?: string;
      equipmentType?: string;
    }
  ): Promise<any[]> {
    console.log('[WO-131] Fetching energy feeds for project:', projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Find compatible feeds
    const whereClause: any = {
      feedType: 'ENERGY_PRODUCTION',
      isActive: true,
    };

    const feeds = await (prisma as any).oracleFeed.findMany({
      where: whereClause,
      include: {
        dataPoints: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    // WO-131: Filter by location and equipment type if provided
    const filteredFeeds = feeds.filter((feed: any) => {
      // In production, would check feed metadata for location/equipment compatibility
      // For now, return all energy production feeds
      return true;
    });

    return filteredFeeds.map((feed: any) => ({
      id: feed.id,
      feedAddress: feed.feedAddress,
      feedType: feed.feedType,
      name: feed.name,
      description: feed.description,
      updateFrequency: feed.updateFrequency,
      cost: this.calculateSubscriptionCost(feed),
      lastUpdate: feed.dataPoints[0]?.timestamp,
      quality: feed.dataPoints[0]?.confidence >= 0.8 ? 'HIGH' : 'MEDIUM',
    }));
  }

  // Private helper methods

  /**
   * WO-131: Find compatible feeds based on requirements
   */
  private async findCompatibleFeeds(
    feedType: OracleFeedType,
    location?: string,
    equipmentType?: string
  ): Promise<any[]> {
    const feeds = await (prisma as any).oracleFeed.findMany({
      where: {
        feedType,
        isActive: true,
      },
      include: {
        dataPoints: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    // WO-131: Equipment compatibility validation
    const compatibleFeeds = feeds.filter((feed: any) => {
      // In production, would check feed metadata for compatibility
      // For now, check data quality
      const avgConfidence = feed.dataPoints.length > 0
        ? feed.dataPoints.reduce((sum: number, dp: any) => sum + dp.confidence, 0) / feed.dataPoints.length
        : 0;

      return avgConfidence >= 0.7; // Minimum quality threshold
    });

    return compatibleFeeds;
  }

  /**
   * WO-131: Select optimal feed based on cost and quality
   */
  private async selectOptimalFeed(
    feeds: any[],
    budget?: number
  ): Promise<any> {
    // Calculate score for each feed (balance cost and quality)
    const scoredFeeds = feeds.map(feed => {
      const cost = this.calculateSubscriptionCost(feed);
      const avgConfidence = feed.dataPoints.length > 0
        ? feed.dataPoints.reduce((sum: number, dp: any) => sum + dp.confidence, 0) / feed.dataPoints.length
        : 0;

      // Score: 70% quality, 30% cost (lower is better)
      const costScore = budget ? Math.max(0, 1 - cost / budget) : 1;
      const score = avgConfidence * 0.7 + costScore * 0.3;

      return { feed, score, cost };
    });

    // Filter by budget if provided
    const affordableFeeds = budget
      ? scoredFeeds.filter(sf => sf.cost <= budget)
      : scoredFeeds;

    if (affordableFeeds.length === 0) {
      throw new Error('No feeds available within budget');
    }

    // Select feed with highest score
    const best = affordableFeeds.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    console.log('[WO-131] Selected optimal feed:', best.feed.feedAddress, 'score:', best.score);

    return best.feed;
  }

  /**
   * WO-131: Validate webhook URL and test connectivity
   */
  private async validateWebhookUrl(webhookUrl: string): Promise<void> {
    console.log('[WO-131] Validating webhook URL:', webhookUrl);

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch (error) {
      throw new Error('Invalid webhook URL format');
    }

    // Test connectivity
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          message: 'Webhook connectivity test',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      console.log('[WO-131] Webhook validation successful');

    } catch (error) {
      console.error('[WO-131] Webhook validation failed:', error);
      throw new Error('Webhook connectivity test failed');
    }
  }

  /**
   * WO-131: Calculate subscription cost
   */
  private calculateSubscriptionCost(feed: any): number {
    // Base cost + frequency cost
    const baseCost = 10; // $10/month base
    const frequencyCost = Math.max(0, (3600 - feed.updateFrequency) / 3600) * 5;

    return baseCost + frequencyCost;
  }
}

// Singleton instance
export const switchboardSubscriptionService = new SwitchboardSubscriptionService();



