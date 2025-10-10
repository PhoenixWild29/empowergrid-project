/**
 * Security Settings Panel Component
 * 
 * WO-103: User-configurable security preferences
 * 
 * Features:
 * - Authentication preferences
 * - Transaction limits
 * - Notification settings
 */

'use client';

import React, { useState } from 'react';

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    mfaEnabled: true,
    mfaMethod: 'email' as 'email' | 'sms' | 'authenticator',
    mfaThreshold: 5000,
    dailyLimit: 50000,
    singleTransactionLimit: 25000,
    notifications: {
      largeTransactions: true,
      loginAttempts: true,
      securityAlerts: true,
      milestoneReleases: true,
    },
  });

  const handleSave = () => {
    // Save settings
    alert('Security settings saved!');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>⚙️</span> Security Settings
      </h3>

      {/* MFA Settings */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">Multi-Factor Authentication</h4>
        
        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
          <div>
            <div className="font-medium text-gray-900">Enable MFA for High-Value Transactions</div>
            <div className="text-sm text-gray-600">Require additional verification for security</div>
          </div>
          <input
            type="checkbox"
            checked={settings.mfaEnabled}
            onChange={(e) => setSettings({ ...settings, mfaEnabled: e.target.checked })}
            className="w-5 h-5"
          />
        </label>

        {settings.mfaEnabled && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MFA Threshold: ${settings.mfaThreshold.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={settings.mfaThreshold}
                onChange={(e) => setSettings({ ...settings, mfaThreshold: Number(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Require MFA for transactions above this amount
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred MFA Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['email', 'sms', 'authenticator'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setSettings({ ...settings, mfaMethod: method })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      settings.mfaMethod === method
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {method === 'email' ? '📧' : method === 'sms' ? '📱' : '🔑'}
                    </div>
                    <div className="text-xs font-medium capitalize">{method}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Limits */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">Transaction Limits</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Transaction Limit: ${settings.dailyLimit.toLocaleString()}
            </label>
            <input
              type="range"
              min="10000"
              max="100000"
              step="10000"
              value={settings.dailyLimit}
              onChange={(e) => setSettings({ ...settings, dailyLimit: Number(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Maximum total transactions per day
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Single Transaction Limit: ${settings.singleTransactionLimit.toLocaleString()}
            </label>
            <input
              type="range"
              min="5000"
              max="50000"
              step="5000"
              value={settings.singleTransactionLimit}
              onChange={(e) => setSettings({ ...settings, singleTransactionLimit: Number(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Maximum amount per individual transaction
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">Security Notifications</h4>
        
        <div className="space-y-2">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, [key]: e.target.checked }
                })}
                className="w-5 h-5"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Save Security Settings
      </button>
    </div>
  );
}


