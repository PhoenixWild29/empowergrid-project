import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getEscrowConfig } from './escrowConfigStore';
import { prisma, executeWithRetry } from '../prisma';

export interface BalanceAlert {
  level: 'warning' | 'critical';
  message: string;
}

export interface EscrowHealthSnapshot {
  solBalance?: number;
  usdcBalance?: number;
  alerts: BalanceAlert[];
  timestamp: string;
  cluster: string;
  endpoint: string;
}

const getThreshold = (envKey: string, fallbackKey: string, defaultValue: number): number => {
  const direct = process.env[envKey];
  if (direct) return Number(direct);
  const fallback = process.env[fallbackKey];
  if (fallback) return Number(fallback);
  return defaultValue;
};

const SOL_THRESHOLD = getThreshold('ESCROW_SOL_THRESHOLD', 'NEXT_PUBLIC_ESCROW_SOL_THRESHOLD', 1);
const USDC_THRESHOLD = getThreshold('ESCROW_USDC_THRESHOLD', 'NEXT_PUBLIC_ESCROW_USDC_THRESHOLD', 1000);

export const checkEscrowHealth = async (): Promise<EscrowHealthSnapshot> => {
  const config = await getEscrowConfig();
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || process.env.SOLANA_CLUSTER || 'devnet';
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl(cluster as any);
  const connection = new Connection(endpoint, 'confirmed');

  let solBalance: number | undefined;
  let usdcBalance: number | undefined;
  const alerts: BalanceAlert[] = [];

  if (config.solEscrowAddress) {
    try {
      const solLamports = await connection.getBalance(new PublicKey(config.solEscrowAddress));
      solBalance = solLamports / 1_000_000_000;
      if (solBalance < SOL_THRESHOLD) {
        alerts.push({
          level: solBalance <= SOL_THRESHOLD / 2 ? 'critical' : 'warning',
          message: `SOL balance ${solBalance.toFixed(4)} below threshold (${SOL_THRESHOLD}).`,
        });
      }
    } catch (error) {
      console.error('[escrowHealth] Failed to fetch SOL balance:', error);
    }
  }

  if (config.usdcEscrowAccount) {
    try {
      const tokenAccount = new PublicKey(config.usdcEscrowAccount);
      const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
      const decimals = config.usdcDecimals ?? 6;
      const uiAmount = tokenBalance.value.uiAmount ?? Number(tokenBalance.value.amount) / Math.pow(10, decimals);
      usdcBalance = Number(uiAmount.toFixed(2));
      if (usdcBalance < USDC_THRESHOLD) {
        alerts.push({
          level: usdcBalance <= USDC_THRESHOLD / 2 ? 'critical' : 'warning',
          message: `USDC balance ${usdcBalance.toFixed(2)} below threshold (${USDC_THRESHOLD}).`,
        });
      }
    } catch (error) {
      console.error('[escrowHealth] Failed to fetch USDC balance:', error);
    }
  }

  const snapshot: EscrowHealthSnapshot = {
    solBalance,
    usdcBalance,
    alerts,
    timestamp: new Date().toISOString(),
    cluster,
    endpoint,
  };

  if (prisma) {
    try {
      await executeWithRetry(() =>
        prisma.escrowHealthLog.create({
          data: {
            solBalance,
            usdcBalance,
            alerts: alerts.length ? alerts : undefined,
            cluster,
            endpoint,
          },
        })
      );
    } catch (error) {
      console.error('[escrowHealth] Failed to persist health snapshot:', error);
    }
  }

  return snapshot;
};

export const dispatchAlerts = async (snapshot: EscrowHealthSnapshot) => {
  if (!snapshot.alerts.length) return;
  const webhook = process.env.ESCROW_ALERT_WEBHOOK;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Escrow Monitor] ${snapshot.alerts.map(alert => alert.message).join(' | ')}`,
        details: snapshot,
      }),
    });
  } catch (error) {
    console.error('[escrowHealth] Failed to dispatch alert webhook:', error);
  }
};
