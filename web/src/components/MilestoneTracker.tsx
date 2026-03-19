import React, { useState, useEffect } from 'react';
import { Milestone, getMilestones, completeMilestone } from '../api';

interface MilestoneTrackerProps {
  projectId: string;
  ownerWallet: string;
  walletPublicKey: string | null;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ projectId, ownerWallet, walletPublicKey }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const isOwner = walletPublicKey === ownerWallet;

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        const data = await getMilestones(projectId, walletPublicKey);
        setMilestones(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load milestones');
      } finally {
        setLoading(false);
      }
    };
    fetchMilestones();
  }, [projectId, walletPublicKey]);

  const handleProofChange = (milestoneId: string, url: string) => {
    setProofUrls(prev => ({ ...prev, [milestoneId]: url }));
  };

  const handleComplete = async (milestoneId: string) => {
    const proofUrl = proofUrls[milestoneId];
    if (!proofUrl || !walletPublicKey) return;

    try {
      await completeMilestone(milestoneId, proofUrl, walletPublicKey);
      // Refresh milestones
      const data = await getMilestones(projectId, walletPublicKey);
      setMilestones(data);
      // Clear input
      setProofUrls(prev => { const n = {...prev}; delete n[milestoneId]; return n; });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete milestone');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading milestones...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h4 style={{ margin: '0 0 16px 0', color: '#fff' }}>Milestones</h4>
      {milestones.map((milestone) => (
        <div key={milestone.id} style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '500' }}>{milestone.title}</span>
            <span style={{ 
              backgroundColor: milestone.status === 'completed' ? '#22c55e' : milestone.status === 'in_progress' ? '#eab308' : '#6b7280',
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '6px', 
              fontSize: '0.85em',
              fontWeight: 'bold'
            }}>
              {milestone.status.toUpperCase()}
            </span>
          </div>
          {milestone.proof_url && (
            <a 
              href={milestone.proof_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9em' }}
            >
              View Proof →
            </a>
          )}
          {isOwner && milestone.status !== 'completed' && (
            <div style={{ marginTop: '12px' }}>
              <input 
                type="url" 
                placeholder="Enter proof URL (e.g., IPFS or Arweave)"
                value={proofUrls[milestone.id] || ''}
                onChange={(e) => handleProofChange(milestone.id, e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  backgroundColor: '#1e1e1e', 
                  border: '1px solid #555', 
                  color: 'white', 
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  marginBottom: '8px'
                }} 
              />
              <button 
                onClick={() => handleComplete(milestone.id)}
                disabled={!proofUrls[milestone.id]}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: proofUrls[milestone.id] ? '#3b82f6' : '#4b5563', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: proofUrls[milestone.id] ? 'pointer' : 'not-allowed' 
                }}
              >
                Mark Complete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MilestoneTracker;
