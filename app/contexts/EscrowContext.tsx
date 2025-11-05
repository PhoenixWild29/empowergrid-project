/**
 * Escrow Context - Centralized State Management
 * 
 * WO-115: Escrow State Management with React Context
 * 
 * Features:
 * - Global state for active contracts, user positions, funding status
 * - Action methods for contract interactions
 * - Optimistic updates with rollback capability
 * - Error recovery mechanisms
 * - State persistence across sessions
 * - Real-time event synchronization
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// WO-115: Escrow State Interface
interface EscrowState {
  contracts: Record<string, EscrowContract>;
  userPositions: Record<string, UserPosition>;
  pendingTransactions: Record<string, PendingTransaction>;
  isLoading: boolean;
  error: string | null;
  lastSync: number;
}

interface EscrowContract {
  id: string;
  contractId: string;
  projectId: string;
  projectTitle: string;
  fundingTarget: number;
  currentBalance: number;
  status: 'INITIALIZED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EMERGENCY_STOPPED';
  milestones: MilestoneInfo[];
  deposits: DepositInfo[];
  createdAt: string;
  updatedAt: string;
}

interface MilestoneInfo {
  id: string;
  title: string;
  status: string;
  targetAmount: number;
  energyTarget?: number;
  progress: number;
}

interface DepositInfo {
  id: string;
  amount: number;
  transactionHash: string;
  status: string;
  createdAt: string;
}

interface UserPosition {
  contractId: string;
  role: 'creator' | 'funder';
  totalInvested?: number;
  expectedReturns?: number;
  milestonesPaid?: number;
}

interface PendingTransaction {
  id: string;
  type: 'CREATE_CONTRACT' | 'DEPOSIT' | 'VERIFY_MILESTONE';
  contractId?: string;
  data: any;
  timestamp: number;
}

// WO-115: Action Types
type EscrowAction =
  | { type: 'SET_CONTRACTS'; payload: EscrowContract[] }
  | { type: 'ADD_CONTRACT'; payload: EscrowContract }
  | { type: 'UPDATE_CONTRACT'; payload: { contractId: string; updates: Partial<EscrowContract> } }
  | { type: 'REMOVE_CONTRACT'; payload: string }
  | { type: 'ADD_PENDING_TRANSACTION'; payload: PendingTransaction }
  | { type: 'COMPLETE_TRANSACTION'; payload: string }
  | { type: 'ROLLBACK_TRANSACTION'; payload: string }
  | { type: 'UPDATE_MILESTONE'; payload: { contractId: string; milestoneId: string; updates: any } }
  | { type: 'ADD_DEPOSIT'; payload: { contractId: string; deposit: DepositInfo } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SYNC_BLOCKCHAIN_STATE'; payload: any }
  | { type: 'CLEAR_STATE' };

// WO-115: Initial State
const initialState: EscrowState = {
  contracts: {},
  userPositions: {},
  pendingTransactions: {},
  isLoading: false,
  error: null,
  lastSync: 0,
};

// WO-115: Reducer with Optimistic Updates and Rollback
function escrowReducer(state: EscrowState, action: EscrowAction): EscrowState {
  switch (action.type) {
    case 'SET_CONTRACTS':
      const contractsMap: Record<string, EscrowContract> = {};
      action.payload.forEach(contract => {
        contractsMap[contract.contractId] = contract;
      });
      return {
        ...state,
        contracts: contractsMap,
        isLoading: false,
        lastSync: Date.now(),
      };

    case 'ADD_CONTRACT':
      return {
        ...state,
        contracts: {
          ...state.contracts,
          [action.payload.contractId]: action.payload,
        },
      };

    case 'UPDATE_CONTRACT':
      const existingContract = state.contracts[action.payload.contractId];
      if (!existingContract) return state;

      return {
        ...state,
        contracts: {
          ...state.contracts,
          [action.payload.contractId]: {
            ...existingContract,
            ...action.payload.updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };

    case 'REMOVE_CONTRACT':
      const { [action.payload]: removed, ...remainingContracts } = state.contracts;
      return {
        ...state,
        contracts: remainingContracts,
      };

    case 'ADD_PENDING_TRANSACTION':
      return {
        ...state,
        pendingTransactions: {
          ...state.pendingTransactions,
          [action.payload.id]: action.payload,
        },
      };

    case 'COMPLETE_TRANSACTION':
      const { [action.payload]: completed, ...remainingPending } = state.pendingTransactions;
      return {
        ...state,
        pendingTransactions: remainingPending,
      };

    case 'ROLLBACK_TRANSACTION':
      // WO-115: Rollback failed transaction
      const tx = state.pendingTransactions[action.payload];
      if (!tx) return state;

      // Remove pending transaction
      const { [action.payload]: failed, ...remainingTx } = state.pendingTransactions;

      // Revert optimistic updates if needed
      // (Specific rollback logic would depend on transaction type)

      return {
        ...state,
        pendingTransactions: remainingTx,
        error: 'Transaction failed and was rolled back',
      };

    case 'UPDATE_MILESTONE':
      const contract = state.contracts[action.payload.contractId];
      if (!contract) return state;

      return {
        ...state,
        contracts: {
          ...state.contracts,
          [action.payload.contractId]: {
            ...contract,
            milestones: contract.milestones.map(m =>
              m.id === action.payload.milestoneId
                ? { ...m, ...action.payload.updates }
                : m
            ),
          },
        },
      };

    case 'ADD_DEPOSIT':
      const depositContract = state.contracts[action.payload.contractId];
      if (!depositContract) return state;

      return {
        ...state,
        contracts: {
          ...state.contracts,
          [action.payload.contractId]: {
            ...depositContract,
            deposits: [...depositContract.deposits, action.payload.deposit],
            currentBalance: depositContract.currentBalance + action.payload.deposit.amount,
          },
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SYNC_BLOCKCHAIN_STATE':
      // WO-115: Sync with real-time blockchain events
      return {
        ...state,
        ...action.payload,
        lastSync: Date.now(),
      };

    case 'CLEAR_STATE':
      return initialState;

    default:
      return state;
  }
}

// WO-115: Context Definition
interface EscrowContextType {
  state: EscrowState;
  actions: {
    createContract: (params: any) => Promise<void>;
    fundContract: (contractId: string, amount: number) => Promise<void>;
    verifyMilestone: (contractId: string, milestoneId: string) => Promise<void>;
    refreshContracts: () => Promise<void>;
    clearError: () => void;
  };
}

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

// WO-115: Escrow Provider Component
export function EscrowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(escrowReducer, initialState);

  // WO-115: Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('escrowState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'SET_CONTRACTS', payload: Object.values(parsed.contracts || {}) });
      } catch (error) {
        console.error('[WO-115] Failed to load saved state:', error);
      }
    }
  }, []);

  // WO-115: Persist state to localStorage on changes
  useEffect(() => {
    if (Object.keys(state.contracts).length > 0) {
      localStorage.setItem('escrowState', JSON.stringify({
        contracts: state.contracts,
        userPositions: state.userPositions,
        lastSync: state.lastSync,
      }));
    }
  }, [state.contracts, state.userPositions, state.lastSync]);

  // WO-115: Action Methods

  const createContract = useCallback(async (params: any) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // WO-115: Optimistic update
    const optimisticTx: PendingTransaction = {
      id: `tx_${Date.now()}`,
      type: 'CREATE_CONTRACT',
      data: params,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_PENDING_TRANSACTION', payload: optimisticTx });

    try {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        dispatch({ type: 'ADD_CONTRACT', payload: data.contract });
        dispatch({ type: 'COMPLETE_TRANSACTION', payload: optimisticTx.id });
      } else {
        throw new Error(data.message || 'Contract creation failed');
      }
    } catch (error) {
      // WO-115: Rollback on error
      dispatch({ type: 'ROLLBACK_TRANSACTION', payload: optimisticTx.id });
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fundContract = useCallback(async (contractId: string, amount: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // WO-115: Optimistic update
    const optimisticTx: PendingTransaction = {
      id: `tx_${Date.now()}`,
      type: 'DEPOSIT',
      contractId,
      data: { amount },
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_PENDING_TRANSACTION', payload: optimisticTx });

    // Optimistically update balance
    dispatch({
      type: 'UPDATE_CONTRACT',
      payload: {
        contractId,
        updates: { currentBalance: (state.contracts[contractId]?.currentBalance || 0) + amount },
      },
    });

    try {
      const response = await fetch(`/api/escrow/${contractId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, walletAddress: 'current-wallet' }),
      });

      const data = await response.json();

      if (data.success) {
        // Update with confirmed data
        dispatch({
          type: 'ADD_DEPOSIT',
          payload: {
            contractId,
            deposit: data.deposit,
          },
        });
        dispatch({ type: 'COMPLETE_TRANSACTION', payload: optimisticTx.id });
      } else {
        throw new Error(data.message || 'Deposit failed');
      }
    } catch (error) {
      // WO-115: Rollback on error
      dispatch({
        type: 'UPDATE_CONTRACT',
        payload: {
          contractId,
          updates: { currentBalance: (state.contracts[contractId]?.currentBalance || 0) - amount },
        },
      });
      dispatch({ type: 'ROLLBACK_TRANSACTION', payload: optimisticTx.id });
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.contracts]);

  const verifyMilestone = useCallback(async (contractId: string, milestoneId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(`/api/escrow/${contractId}/milestones/${milestoneId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        // Update milestone status
        dispatch({
          type: 'UPDATE_MILESTONE',
          payload: {
            contractId,
            milestoneId,
            updates: { status: 'RELEASED', progress: 100 },
          },
        });
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const refreshContracts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch('/api/escrow/user/contracts');
      const data = await response.json();

      if (data.success) {
        dispatch({ type: 'SET_CONTRACTS', payload: data.contracts });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh contracts' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const contextValue: EscrowContextType = {
    state,
    actions: {
      createContract,
      fundContract,
      verifyMilestone,
      refreshContracts,
      clearError,
    },
  };

  return (
    <EscrowContext.Provider value={contextValue}>
      {children}
    </EscrowContext.Provider>
  );
}

// WO-115: Custom Hook for consuming context
export function useEscrow() {
  const context = useContext(EscrowContext);
  
  if (!context) {
    throw new Error('useEscrow must be used within EscrowProvider');
  }
  
  return context;
}

// WO-115: Selector hooks for specific data
export function useContract(contractId: string) {
  const { state } = useEscrow();
  return state.contracts[contractId] || null;
}

export function useUserPosition(contractId: string) {
  const { state } = useEscrow();
  return state.userPositions[contractId] || null;
}

export function usePendingTransactions() {
  const { state } = useEscrow();
  return Object.values(state.pendingTransactions);
}




