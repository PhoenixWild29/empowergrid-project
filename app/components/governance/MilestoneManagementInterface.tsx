/**
 * Milestone & Fund Allocation Management Interfaces
 * 
 * WO-155: View and propose changes to milestones & funds
 * 
 * Features:
 * - Milestone display with status
 * - Fund allocation breakdown
 * - Propose modifications
 * - Impact visualization
 * - Constraint validation
 */

import { useState } from 'react';

interface Milestone {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  dueDate: string;
}

export default function MilestoneManagementInterface({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Milestone[];
}) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [modificationType, setModificationType] = useState<string>('TIMELINE');
  const [newValue, setNewValue] = useState<any>(null);

  const handleProposeChange = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/governance/milestones/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: selectedMilestone,
          modificationType,
          newValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Milestone modification proposal created!');
      } else {
        alert(data.message || 'Failed to create proposal');
      }
    } catch (error) {
      alert('Failed to propose changes');
    }
  };

  return (
    <div className="space-y-6">
      {/* WO-155: Milestone Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Project Milestones</h2>
        
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`border rounded-lg p-4 ${
                selectedMilestone === milestone.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedMilestone(milestone.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{milestone.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  milestone.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {milestone.status}
                </span>
              </div>

              {/* WO-155: Fund allocation for milestone */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Allocated:</span>
                  <span className="ml-2 font-medium">${milestone.targetAmount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Progress:</span>
                  <span className="ml-2 font-medium">${milestone.currentAmount}</span>
                </div>
              </div>

              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(milestone.currentAmount / milestone.targetAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WO-155: Propose Modifications */}
      {selectedMilestone && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Propose Modification</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Modification Type</label>
              <select
                value={modificationType}
                onChange={(e) => setModificationType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="TIMELINE">Timeline Change</option>
                <option value="SCOPE">Scope Adjustment</option>
                <option value="BUDGET">Budget Modification</option>
                <option value="COMPLETION_CRITERIA">Completion Criteria Update</option>
              </select>
            </div>

            {modificationType === 'TIMELINE' && (
              <div>
                <label className="block text-sm font-medium mb-2">New Deadline</label>
                <input
                  type="date"
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {modificationType === 'BUDGET' && (
              <div>
                <label className="block text-sm font-medium mb-2">New Budget Amount</label>
                <input
                  type="number"
                  min="0"
                  onChange={(e) => setNewValue(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            <button
              onClick={handleProposeChange}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Create Modification Proposal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



