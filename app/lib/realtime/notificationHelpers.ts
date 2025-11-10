/**
 * Notification Helpers
 * 
 * Utility functions to emit real-time notifications for milestones and transactions
 */

import { NotificationPayload, NotificationEvent } from './socketServer';

/**
 * Emit a milestone verification notification
 */
export async function emitMilestoneVerified(
  userId: string,
  projectId: string,
  milestoneId: string,
  projectTitle: string,
  milestoneTitle: string
): Promise<void> {
  await emitNotification({
    userId,
    notification: {
      type: 'milestone:verified',
      title: 'Milestone Verified',
      message: `${milestoneTitle} for ${projectTitle} has been verified by validators.`,
      severity: 'success',
      projectId,
      milestoneId,
      timestamp: Date.now(),
    },
  });
}

/**
 * Emit a milestone delay notification
 */
export async function emitMilestoneDelayed(
  userId: string,
  projectId: string,
  milestoneId: string,
  projectTitle: string,
  milestoneTitle: string,
  reason?: string
): Promise<void> {
  await emitNotification({
    userId,
    notification: {
      type: 'milestone:delayed',
      title: 'Milestone Delayed',
      message: `${milestoneTitle} for ${projectTitle} has been delayed.${reason ? ` Reason: ${reason}` : ''}`,
      severity: 'warning',
      projectId,
      milestoneId,
      timestamp: Date.now(),
    },
  });
}

/**
 * Emit a milestone release notification
 */
export async function emitMilestoneReleased(
  userId: string,
  projectId: string,
  milestoneId: string,
  projectTitle: string,
  milestoneTitle: string,
  amount: number,
  currency: string = 'USDC'
): Promise<void> {
  await emitNotification({
    userId,
    notification: {
      type: 'milestone:released',
      title: 'Funds Released',
      message: `${amount} ${currency} released for ${milestoneTitle} in ${projectTitle}.`,
      severity: 'success',
      projectId,
      milestoneId,
      metadata: { amount, currency },
      timestamp: Date.now(),
    },
  });
}

/**
 * Emit a transaction confirmed notification
 */
export async function emitTransactionConfirmed(
  userId: string,
  transactionHash: string,
  amount: number,
  currency: string = 'USDC',
  projectTitle?: string
): Promise<void> {
  await emitNotification({
    userId,
    notification: {
      type: 'transaction:confirmed',
      title: 'Transaction Confirmed',
      message: projectTitle
        ? `Your ${amount} ${currency} investment in ${projectTitle} has been confirmed.`
        : `Your ${amount} ${currency} transaction has been confirmed.`,
      severity: 'success',
      transactionHash,
      metadata: { amount, currency },
      timestamp: Date.now(),
    },
  });
}

/**
 * Emit a transaction failed notification
 */
export async function emitTransactionFailed(
  userId: string,
  transactionHash: string,
  reason: string
): Promise<void> {
  await emitNotification({
    userId,
    notification: {
      type: 'transaction:failed',
      title: 'Transaction Failed',
      message: `Your transaction failed: ${reason}`,
      severity: 'error',
      transactionHash,
      metadata: { reason },
      timestamp: Date.now(),
    },
  });
}

/**
 * Emit a project funded notification
 */
export async function emitProjectFunded(
  projectId: string,
  projectTitle: string,
  amount: number,
  currency: string = 'USDC'
): Promise<void> {
  await emitNotification({
    room: `project:${projectId}`,
    notification: {
      type: 'project:funded',
      title: 'Project Funded',
      message: `${projectTitle} received ${amount} ${currency} in funding.`,
      severity: 'info',
      projectId,
      metadata: { amount, currency },
      timestamp: Date.now(),
    },
  });
}

/**
 * Internal helper to emit notifications via API
 */
async function emitNotification(options: {
  userId?: string;
  room?: string;
  notification: Omit<NotificationPayload, 'timestamp'> & { timestamp?: number };
}): Promise<void> {
  try {
    const response = await fetch('/api/realtime/emit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: options.userId,
        room: options.room,
        notification: {
          ...options.notification,
          timestamp: options.notification.timestamp || Date.now(),
        },
      }),
    });

    if (!response.ok) {
      console.error('[Notification] Failed to emit notification', await response.text());
    }
  } catch (error) {
    console.error('[Notification] Error emitting notification', error);
    // Don't throw - notifications are non-critical
  }
}

