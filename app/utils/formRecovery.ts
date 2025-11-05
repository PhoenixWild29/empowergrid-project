/**
 * Form Recovery Utilities
 * 
 * Functions for saving and loading form draft data from localStorage
 * to support form recovery when users return to incomplete forms
 */

export interface DraftData<T = any> {
  data: T;
  currentStep: number;
  timestamp: number;
}

/**
 * Save draft data to localStorage
 */
export async function saveDraft<T = any>(
  key: string,
  draft: DraftData<T>
): Promise<void> {
  try {
    const serialized = JSON.stringify(draft);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to save draft:', error);
    throw error;
  }
}

/**
 * Load draft data from localStorage
 */
export function loadDraft<T = any>(key: string): DraftData<T> | null {
  try {
    const serialized = localStorage.getItem(key);
    
    if (!serialized) {
      return null;
    }

    const draft = JSON.parse(serialized) as DraftData<T>;
    
    // Check if draft is too old (e.g., older than 7 days)
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const age = Date.now() - draft.timestamp;
    
    if (age > MAX_AGE) {
      // Draft is too old, remove it
      clearDraft(key);
      return null;
    }

    return draft;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

/**
 * Clear draft data from localStorage
 */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

/**
 * Check if a draft exists
 */
export function hasDraft(key: string): boolean {
  try {
    const draft = localStorage.getItem(key);
    return draft !== null;
  } catch (error) {
    console.error('Failed to check for draft:', error);
    return false;
  }
}

/**
 * Get draft age in milliseconds
 */
export function getDraftAge(key: string): number | null {
  const draft = loadDraft(key);
  
  if (!draft) {
    return null;
  }

  return Date.now() - draft.timestamp;
}

/**
 * Format draft age as human-readable string
 */
export function formatDraftAge(key: string): string | null {
  const age = getDraftAge(key);
  
  if (age === null) {
    return null;
  }

  const seconds = Math.floor(age / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  return 'just now';
}

/**
 * Clear all drafts (for cleanup)
 */
export function clearAllDrafts(): void {
  try {
    const keys = Object.keys(localStorage);
    const draftKeys = keys.filter((key) => key.endsWith('_draft'));
    
    draftKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear all drafts:', error);
  }
}

export default {
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
  getDraftAge,
  formatDraftAge,
  clearAllDrafts,
};






