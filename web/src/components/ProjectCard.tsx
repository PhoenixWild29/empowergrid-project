import React, { useState } from 'react';
import { Project } from '../api';
import MilestoneTracker from './MilestoneTracker';
import EscrowPanel from './EscrowPanel';

interface ProjectCardProps {
  project: Project;
  walletPublicKey: string | null;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, walletPublicKey }) => {
  const [expanded, setExpanded] = useState(false);
  const truncatedWallet = `${project.owner_wallet.slice(0, 8)}...${project.owner_wallet.slice(-4)}`;
  const fundingSOL = (project.total_funding / 1e9).toFixed(2);
  const statusColor = project.status === 'active' ? '#22c55e' : project.status === 'completed' ? '#3b82f6' : '#ef4444';

  return (
    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '20px', backgroundColor: '#1e1e1e' }}>
      <div 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} 
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4em' }}>{project.title}</h3>
          <p style={{ margin: '0 0 12px 0', opacity: 0.8, lineHeight: 1.4 }}>{project.description}</p>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.9em', opacity: 0.7 }}>
            <span>Owner: {truncatedWallet}</span>
            <span>Funding: {fundingSOL} SOL</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px' }}>
          <span style={{ 
            backgroundColor: statusColor, 
            color: 'white', 
            padding: '4px 12px', 
            borderRadius: '12px', 
            fontSize: '0.8em',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            {project.status.toUpperCase()}
          </span>
          <span style={{ fontSize: '1.5em', opacity: 0.6, marginTop: '4px' }}>{expanded ? '−' : '+'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #333' }}>
          <MilestoneTracker projectId={project.id} ownerWallet={project.owner_wallet} walletPublicKey={walletPublicKey} />
          <EscrowPanel projectId={project.id} walletPublicKey={walletPublicKey} />
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
