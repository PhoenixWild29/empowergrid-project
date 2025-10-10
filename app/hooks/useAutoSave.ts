/**
 * useAutoSave Hook
 * 
 * Automatically saves form data to localStorage at regular intervals
 * and after specific events (like step completion)
 * 
 * Features:
 * - Saves every N seconds (configurable)
 * - Saves on step changes
 * - Debouncing to prevent excessive saves
 * - Returns saving status and last saved timestamp
 */

import { useEffect, useRef, useState } from 'react';
import { saveDraft } from '../utils/formRecovery';

export interface UseAutoSaveOptions {
  data: any;
  currentStep: number;
  storageKey: string;
  interval?: number; // milliseconds
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: number | null;
  forceSave: () => void;
}

export function useAutoSave({
  data,
  currentStep,
  storageKey,
  interval = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const previousStepRef = useRef(currentStep);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');

  // Save function
  const save = async () => {
    if (!enabled) return;

    const currentDataStr = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentDataStr === lastDataRef.current) {
      return;
    }

    setIsSaving(true);

    try {
      await saveDraft(storageKey, {
        data,
        currentStep,
        timestamp: Date.now(),
      });
      
      setLastSaved(Date.now());
      lastDataRef.current = currentDataStr;
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Force save (exposed to component)
  const forceSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  };

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    saveTimeoutRef.current = setInterval(() => {
      save();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [data, currentStep, interval, enabled]);

  // Save when step changes
  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      save();
      previousStepRef.current = currentStep;
    }
  }, [currentStep]);

  // Save on unmount (cleanup)
  useEffect(() => {
    return () => {
      if (enabled) {
        // Save one last time on unmount
        saveDraft(storageKey, {
          data,
          currentStep,
          timestamp: Date.now(),
        }).catch((error) => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    forceSave,
  };
}

export default useAutoSave;




