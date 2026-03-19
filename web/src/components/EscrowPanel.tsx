import React, { useState } from 'react';
import { fundEscrow, getEscrowStatus } from '../api';
import { Escrow } from '../api';

interface EscrowPanelProps {
  projectId: string;
  walletPublicKey: string | null;
}

const EscrowPanel: React.FC<EscrowPanelProps> = ({ projectId, walletPublicKey }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);

  const handleFund = async () => {
    if (!walletPublicKey || !amount) return;
    setLoading(true);
    setResult(null);
    try {
      const numAmount = parseFloat(amount) * 1_000_000_000; // SOL to lamports
      const newEscrow = await fundEscrow(projectId, numAmount, walletPublicKey);
      setEscrow(newEscrow);
      setResult(`Successfully funded! Escrow ID: ${newEscrow.id}`);
    } catch (err) {
      setResult(err instanceof Error ? `Funding failed: ${err.message}` : 'Funding failed');
    } finally {
      setLoading(false);
    }
  };

  if (!walletPublicKey) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #444' }}>
        Connect your wallet to fund this project.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#fff' }}>Fund Project</h4>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: result ? '16px' : 0 }}>
        <input 
          type="number" 
          placeholder="0.0"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            backgroundColor: '#1e1e1e', 
            border: '1px solid #555', 
            color: 'white', 
            borderRadius: '8px',
            fontSize: '16px'
          }} 
        />
        <span style={{ minWidth: '40px', color: '#888', fontSize: '14px' }}>SOL</span>
        <button 
          onClick={handleFund}
          disabled={loading || parseFloat(amount || '0') <= 0}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: parseFloat(amount || '0') > 0 ? '#10b981' : '#4b5563', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '16px',
            cursor: parseFloat(amount || '0') > 0 ? 'pointer' : 'not-allowed',
            fontWeight: '500'
          }}
        >
          {loading ? 'Funding...' : 'Fund'}
        </button>
      </div>
      {result && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: result.includes('failed') ? '#fef2f2' : '#f0fdf4', 
          borderRadius: '8px', 
          border: `1px solid ${result.includes('failed') ? '#fecaca' : '#bbf7d0'}`,
          color: result.includes('failed') ? '#dc2626' : '#166534'
        }}>
          {result}
        </div>
      )}
      {escrow && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #555' }}>
          <strong>Escrow Status:</strong> {escrow.status} | Amount: {(escrow.amount / 1e9).toFixed(4)} SOL
        </div>
      )}
    </div>
  );
};

export default EscrowPanel;
