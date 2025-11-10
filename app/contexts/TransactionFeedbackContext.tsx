import { createContext, ReactNode, useContext, useMemo, useRef, useState } from 'react';
import { Connection, clusterApiUrl, Commitment } from '@solana/web3.js';
import { useToast } from '../components/ToastContainer';

export type TransactionStatus = 'pending' | 'success' | 'error';

export interface TransactionRecord {
  id: string;
  title: string;
  description?: string;
  status: TransactionStatus;
  signature?: string;
  createdAt: string;
  updatedAt: string;
  explorerUrl?: string;
  error?: string;
}

export interface TrackTransactionOptions {
  title: string;
  description?: string;
  signature?: string;
  signaturePromise?: Promise<string>;
  explorerUrl?: string;
  connection?: Connection;
  commitment?: Commitment;
  simulate?: boolean;
  successDelayMs?: number;
  simulateError?: boolean;
}

interface TransactionFeedbackContextValue {
  transactions: TransactionRecord[];
  trackTransaction: (options: TrackTransactionOptions) => Promise<TransactionRecord>;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
}

const TransactionFeedbackContext = createContext<TransactionFeedbackContextValue | null>(null);

const createConnection = () => {
  if (typeof window === 'undefined') return null;
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet');
  return new Connection(endpoint, 'confirmed');
};

const createRecord = (partial: Partial<TransactionRecord>): TransactionRecord => {
  const now = new Date().toISOString();
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: partial.title ?? 'Transaction',
    description: partial.description,
    status: partial.status ?? 'pending',
    signature: partial.signature,
    explorerUrl: partial.explorerUrl,
    createdAt: now,
    updatedAt: now,
    error: partial.error,
  };
};

export function TransactionFeedbackProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const connectionRef = useRef<Connection | null>(null);
  const toast = useToast();

  const ensureConnection = () => {
    if (connectionRef.current) return connectionRef.current;
    const conn = createConnection();
    connectionRef.current = conn;
    return conn;
  };

  const updateRecord = (id: string, updater: (record: TransactionRecord) => TransactionRecord) => {
    setTransactions(prev => prev.map(record => (record.id === id ? updater(record) : record)));
  };

  const trackTransaction = async ({
    title,
    description,
    signature,
    signaturePromise,
    explorerUrl,
    connection,
    commitment = 'confirmed',
    simulate,
    successDelayMs = 1500,
    simulateError,
  }: TrackTransactionOptions): Promise<TransactionRecord> => {
    const baseRecord = createRecord({ title, description, status: 'pending', signature, explorerUrl });
    setTransactions(prev => [baseRecord, ...prev]);

    if (typeof window !== 'undefined') {
      toast.info(`${title}`, description ? description : 'Transaction submitted');
    }

    const resolveSignature = async (): Promise<string> => {
      if (signature) return signature;
      if (signaturePromise) return await signaturePromise;
      if (simulate) return `SIMULATED_${baseRecord.id}`;
      throw new Error('No signature or signaturePromise provided');
    };

    try {
      const finalSignature = await resolveSignature();
      updateRecord(baseRecord.id, record => ({ ...record, signature: finalSignature, updatedAt: new Date().toISOString() }));

      if (simulate) {
        await new Promise(resolve => setTimeout(resolve, successDelayMs));
        if (simulateError) {
          throw new Error('Simulated transaction failure');
        }
        updateRecord(baseRecord.id, record => ({
          ...record,
          status: 'success',
          updatedAt: new Date().toISOString(),
        }));
        if (typeof window !== 'undefined') {
          toast.success(`${title} confirmed`, description);
        }
        return {
          ...baseRecord,
          status: 'success',
          signature: finalSignature,
          updatedAt: new Date().toISOString(),
        };
      }

      const conn = connection ?? ensureConnection();
      if (!conn) {
        throw new Error('Unable to initialise Solana connection');
      }

      await conn.confirmTransaction({ signature: finalSignature }, commitment);

      updateRecord(baseRecord.id, record => ({
        ...record,
        status: 'success',
        signature: finalSignature,
        updatedAt: new Date().toISOString(),
      }));

      if (typeof window !== 'undefined') {
        toast.success(`${title} confirmed`, description);
      }

      return {
        ...baseRecord,
        status: 'success',
        signature: finalSignature,
        updatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[transactions] trackTransaction failed', error);
      const message = error?.message || 'Transaction failed';
      updateRecord(baseRecord.id, record => ({
        ...record,
        status: 'error',
        error: message,
        updatedAt: new Date().toISOString(),
      }));
      if (typeof window !== 'undefined') {
        toast.error(`${title} failed`, message);
      }
      return {
        ...baseRecord,
        status: 'error',
        error: message,
        updatedAt: new Date().toISOString(),
      };
    }
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(record => record.id !== id));
  };

  const clearTransactions = () => setTransactions([]);

  const value = useMemo<TransactionFeedbackContextValue>(() => ({
    transactions,
    trackTransaction,
    removeTransaction,
    clearTransactions,
  }), [transactions]);

  return (
    <TransactionFeedbackContext.Provider value={value}>
      {children}
    </TransactionFeedbackContext.Provider>
  );
}

export const useTransactionFeedback = () => {
  const context = useContext(TransactionFeedbackContext);
  if (!context) {
    throw new Error('useTransactionFeedback must be used within a TransactionFeedbackProvider');
  }
  return context;
};
