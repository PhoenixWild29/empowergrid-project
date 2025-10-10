/**
 * Time-Lock Service
 * 
 * WO-99: Time-locked execution for emergency fund releases
 * 
 * Features:
 * - Configurable time-lock delays
 * - Time-lock status tracking
 * - Automatic execution after delay
 * - Time-lock cancellation
 */

export interface TimeLock {
  id: string;
  operationType: 'EMERGENCY_RELEASE' | 'CONTRACT_TERMINATION' | 'PARAMETER_UPDATE';
  contractId: string;
  proposedAt: Date;
  executionTime: Date;
  delaySeconds: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
  proposer: string;
  data: any;
}

// WO-99: In-memory time-lock storage (production would use database)
const timeLocks: Map<string, TimeLock> = new Map();

/**
 * WO-99: Create a new time-lock
 */
export async function createTimeLock(
  contractId: string,
  operationType: TimeLock['operationType'],
  proposer: string,
  data: any,
  delaySeconds: number = 24 * 60 * 60 // Default 24 hours
): Promise<TimeLock> {
  const id = `timelock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const proposedAt = new Date();
  const executionTime = new Date(proposedAt.getTime() + delaySeconds * 1000);

  const timeLock: TimeLock = {
    id,
    operationType,
    contractId,
    proposedAt,
    executionTime,
    delaySeconds,
    status: 'PENDING',
    proposer,
    data,
  };

  timeLocks.set(id, timeLock);

  console.log('[WO-99] Created time-lock:', id, 'execution at:', executionTime.toISOString());

  return timeLock;
}

/**
 * WO-99: Check if time-lock has matured (can be executed)
 */
export function isTimeLockMatured(timeLockId: string): boolean {
  const timeLock = timeLocks.get(timeLockId);
  
  if (!timeLock) {
    return false;
  }

  if (timeLock.status !== 'PENDING') {
    return false;
  }

  return new Date() >= timeLock.executionTime;
}

/**
 * WO-99: Get time-lock status
 */
export function getTimeLock(timeLockId: string): TimeLock | null {
  return timeLocks.get(timeLockId) || null;
}

/**
 * WO-99: Mark time-lock as executed
 */
export function markTimeLockExecuted(timeLockId: string): void {
  const timeLock = timeLocks.get(timeLockId);
  
  if (timeLock) {
    timeLock.status = 'EXECUTED';
    console.log('[WO-99] Time-lock executed:', timeLockId);
  }
}

/**
 * WO-99: Cancel time-lock
 */
export async function cancelTimeLock(
  timeLockId: string,
  canceller: string,
  reason: string
): Promise<void> {
  const timeLock = timeLocks.get(timeLockId);
  
  if (!timeLock) {
    throw new Error('Time-lock not found');
  }

  if (timeLock.status !== 'PENDING') {
    throw new Error(`Cannot cancel time-lock with status: ${timeLock.status}`);
  }

  timeLock.status = 'CANCELLED';
  
  console.log('[WO-99] Time-lock cancelled:', timeLockId, 'by:', canceller, 'reason:', reason);
}

/**
 * WO-99: Get remaining time until execution
 */
export function getRemainingTime(timeLockId: string): {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  humanReadable: string;
} {
  const timeLock = timeLocks.get(timeLockId);
  
  if (!timeLock) {
    return {
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      humanReadable: 'Time-lock not found',
    };
  }

  const now = new Date();
  const remainingMs = timeLock.executionTime.getTime() - now.getTime();
  
  if (remainingMs <= 0) {
    return {
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      humanReadable: 'Ready for execution',
    };
  }

  const seconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const humanReadable = days > 0
    ? `${days} day(s), ${hours % 24} hour(s)`
    : hours > 0
    ? `${hours} hour(s), ${minutes % 60} minute(s)`
    : minutes > 0
    ? `${minutes} minute(s), ${seconds % 60} second(s)`
    : `${seconds} second(s)`;

  return {
    seconds,
    minutes,
    hours,
    days,
    humanReadable,
  };
}

/**
 * WO-99: Get all time-locks for a contract
 */
export function getContractTimeLocks(contractId: string): TimeLock[] {
  return Array.from(timeLocks.values()).filter(
    tl => tl.contractId === contractId
  );
}

/**
 * WO-99: Clean up expired time-locks
 */
export function cleanupExpiredTimeLocks(): number {
  let cleaned = 0;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const [id, timeLock] of timeLocks.entries()) {
    if (timeLock.status === 'EXECUTED' && timeLock.executionTime < oneDayAgo) {
      timeLocks.delete(id);
      cleaned++;
    }
  }

  console.log('[WO-99] Cleaned up', cleaned, 'expired time-locks');
  return cleaned;
}



