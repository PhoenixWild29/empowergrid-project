/**
 * Time-Locked Operation Display
 * 
 * WO-107: Countdown timers and execution schedules
 */

import React, { useState, useEffect } from 'react';
import { getRemainingTime } from '../../lib/services/timeLockService';

interface TimeLockedOperationDisplayProps {
  timeLockId: string;
  compact?: boolean;
}

export default function TimeLockedOperationDisplay({ 
  timeLockId, 
  compact = false 
}: TimeLockedOperationDisplayProps) {
  const [remainingTime, setRemainingTime] = useState<any>(null);

  // WO-107: Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = getRemainingTime(timeLockId);
      setRemainingTime(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [timeLockId]);

  if (!remainingTime) {
    return null;
  }

  // WO-107: Compact display
  if (compact) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded">
        <span className="text-blue-600">🔒</span>
        <span className="text-sm text-blue-800 font-medium">
          {remainingTime.humanReadable}
        </span>
      </div>
    );
  }

  // WO-107: Full display with visual progress
  const totalSeconds = remainingTime.days * 24 * 60 * 60 + 
                       remainingTime.hours * 60 * 60 + 
                       remainingTime.minutes * 60 + 
                       remainingTime.seconds;
  const elapsedPercentage = totalSeconds > 0 ? 100 - ((totalSeconds / (24 * 60 * 60)) * 100) : 100;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-3xl">🔒</span>
        <div>
          <h3 className="text-lg font-semibold text-blue-900">Time-Locked Operation</h3>
          <p className="text-sm text-blue-700">Execution scheduled after security delay</p>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{remainingTime.days}</div>
          <div className="text-xs text-gray-600">Days</div>
        </div>
        <div className="bg-white rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{remainingTime.hours % 24}</div>
          <div className="text-xs text-gray-600">Hours</div>
        </div>
        <div className="bg-white rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{remainingTime.minutes % 60}</div>
          <div className="text-xs text-gray-600">Minutes</div>
        </div>
        <div className="bg-white rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{remainingTime.seconds % 60}</div>
          <div className="text-xs text-gray-600">Seconds</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: Math.min(elapsedPercentage, 100) + '%' }}
          ></div>
        </div>
      </div>

      <div className="text-sm text-blue-800 text-center">
        {totalSeconds > 0 ? (
          <span>⏳ {remainingTime.humanReadable} remaining</span>
        ) : (
          <span className="font-bold">✓ Ready for execution</span>
        )}
      </div>
    </div>
  );
}



