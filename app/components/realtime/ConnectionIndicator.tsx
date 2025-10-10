/**
 * ConnectionIndicator Component
 * 
 * WO-89: WebSocket connection status indicator
 * Shows current connection status with visual cues
 */

'use client';

import React from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';

export default function ConnectionIndicator() {
  const { connectionStatus, isConnected } = useRealtime();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Offline';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-xs font-medium text-gray-700">{getStatusText()}</span>
      {isConnected && (
        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )}
    </div>
  );
}

