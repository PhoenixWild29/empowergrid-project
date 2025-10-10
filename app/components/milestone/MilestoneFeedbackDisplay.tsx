/**
 * Milestone Feedback Display
 * 
 * WO-113: Display verification outcomes and feedback
 */

import React from 'react';

interface MilestoneFeedbackDisplayProps {
  result: any;
}

export default function MilestoneFeedbackDisplay({ result }: MilestoneFeedbackDisplayProps) {
  const isVerified = result.verified;
  const isRejected = result.status === 'FAILED';

  return (
    <div className={'rounded-lg border-2 p-6 ' + (
      isVerified ? 'bg-green-50 border-green-300' :
      isRejected ? 'bg-red-50 border-red-300' :
      'bg-yellow-50 border-yellow-300'
    )}>
      <div className="flex items-start space-x-4">
        <div className="text-4xl">
          {isVerified ? '✅' : isRejected ? '❌' : '⏳'}
        </div>
        <div className="flex-1">
          <h4 className={'text-lg font-bold ' + (
            isVerified ? 'text-green-900' :
            isRejected ? 'text-red-900' :
            'text-yellow-900'
          )}>
            {isVerified ? 'Verification Successful!' :
             isRejected ? 'Verification Failed' :
             'Verification In Progress'}
          </h4>

          <p className={'mt-2 ' + (
            isVerified ? 'text-green-800' :
            isRejected ? 'text-red-800' :
            'text-yellow-800'
          )}>
            {result.verificationResult}
          </p>

          {/* Details */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.energyProduced !== undefined && (
              <div>
                <div className="text-xs text-gray-600">Energy Produced</div>
                <div className="font-bold text-gray-900">{result.energyProduced.toLocaleString()} kWh</div>
              </div>
            )}

            {result.energyTarget && (
              <div>
                <div className="text-xs text-gray-600">Target Energy</div>
                <div className="font-bold text-gray-900">{result.energyTarget.toLocaleString()} kWh</div>
              </div>
            )}

            {result.oracleConfidence !== undefined && (
              <div>
                <div className="text-xs text-gray-600">Oracle Confidence</div>
                <div className="font-bold text-gray-900">
                  {(result.oracleConfidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>

          {/* Verification ID */}
          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Verification ID</div>
            <div className="font-mono text-sm text-gray-900">{result.id}</div>
          </div>

          {/* Next Steps */}
          {isVerified && (
            <div className="mt-4 p-3 bg-green-100 rounded border border-green-200">
              <div className="text-sm font-medium text-green-900">✓ Next Steps</div>
              <div className="text-sm text-green-800 mt-1">
                Funds will be automatically released to the project. Check your escrow dashboard for release status.
              </div>
            </div>
          )}

          {isRejected && result.rejectionReason && (
            <div className="mt-4 p-3 bg-red-100 rounded border border-red-200">
              <div className="text-sm font-medium text-red-900">Rejection Reason</div>
              <div className="text-sm text-red-800 mt-1">{result.rejectionReason}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



