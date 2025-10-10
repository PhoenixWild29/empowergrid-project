/**
 * Security Audit Trail Component
 * 
 * WO-103: Comprehensive security event logging
 * 
 * Features:
 * - Security event history
 * - Authentication attempts
 * - Transaction validations
 * - IP address tracking
 */

'use client';

import React, { useState } from 'react';

interface AuditEvent {
  id: string;
  type: 'auth' | 'transaction' | 'security' | 'config';
  action: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  ipAddress: string;
  location?: string;
  details?: string;
}

export default function SecurityAuditTrail() {
  const [filter, setFilter] = useState<'all' | 'auth' | 'transaction' | 'security'>('all');

  // Mock audit events
  const auditEvents: AuditEvent[] = [
    {
      id: '1',
      type: 'transaction',
      action: 'Investment Transaction',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      ipAddress: '192.168.1.1',
      location: 'New York, US',
      details: 'Funded project #123 with $5,000',
    },
    {
      id: '2',
      type: 'auth',
      action: 'MFA Verification',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      ipAddress: '192.168.1.1',
      location: 'New York, US',
      details: 'Email verification code verified',
    },
    {
      id: '3',
      type: 'security',
      action: 'Wallet Verification',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      ipAddress: '192.168.1.1',
      location: 'New York, US',
    },
    {
      id: '4',
      type: 'auth',
      action: 'Login Attempt',
      status: 'failed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      ipAddress: '10.0.0.1',
      location: 'Unknown',
      details: 'Invalid credentials',
    },
  ];

  const filteredEvents = filter === 'all' 
    ? auditEvents 
    : auditEvents.filter(e => e.type === filter);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>📋</span> Security Audit Trail
        </h3>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'auth', 'transaction', 'security'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No security events found</p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {event.type === 'auth' ? '🔐' :
                     event.type === 'transaction' ? '💰' :
                     event.type === 'security' ? '🛡️' :
                     '⚙️'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{event.action}</div>
                    <div className="text-xs text-gray-500">
                      {event.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  event.status === 'success' ? 'bg-green-100 text-green-700' :
                  event.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {event.status}
                </span>
              </div>

              <div className="ml-11 space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">IP:</span>
                  <span className="font-mono">{event.ipAddress}</span>
                  {event.location && (
                    <>
                      <span>•</span>
                      <span>{event.location}</span>
                    </>
                  )}
                </div>
                {event.details && (
                  <div className="text-gray-500">{event.details}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


