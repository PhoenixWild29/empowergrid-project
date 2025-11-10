import type { NextApiRequest } from 'next';
import { prisma, executeWithRetry } from '../prisma';

export interface EscrowConfig {
  solEscrowAddress?: string;
  usdcMintAddress?: string;
  usdcEscrowAccount?: string;
  usdcDecimals: number;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: EscrowConfig = {
  solEscrowAddress: process.env.NEXT_PUBLIC_ESCROW_WALLET,
  usdcMintAddress: process.env.NEXT_PUBLIC_USDC_MINT,
  usdcEscrowAccount: process.env.NEXT_PUBLIC_ESCROW_USDC_ACCOUNT,
  usdcDecimals: Number(process.env.NEXT_PUBLIC_USDC_DECIMALS ?? 6),
  updatedAt: new Date().toISOString(),
};

let cachedConfig: EscrowConfig = { ...DEFAULT_CONFIG };
let persistedId: string | null = null;
let initialized = false;

const mapRowToConfig = (row: any): EscrowConfig => ({
  solEscrowAddress: row?.solEscrowAddress ?? undefined,
  usdcMintAddress: row?.usdcMintAddress ?? undefined,
  usdcEscrowAccount: row?.usdcEscrowAccount ?? undefined,
  usdcDecimals: row?.usdcDecimals ?? DEFAULT_CONFIG.usdcDecimals,
  updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  updatedBy: row?.updatedBy ?? undefined,
});

const ensureConfigLoaded = async () => {
  if (initialized) return;
  initialized = true;

  if (!prisma) {
    return;
  }

  try {
    const record = await executeWithRetry(() =>
      prisma.escrowConfiguration.findFirst({ orderBy: { updatedAt: 'desc' } })
    );

    if (record) {
      persistedId = record.id;
      cachedConfig = mapRowToConfig(record);
    } else {
      const created = await executeWithRetry(() =>
        prisma.escrowConfiguration.create({
          data: {
            solEscrowAddress: DEFAULT_CONFIG.solEscrowAddress,
            usdcMintAddress: DEFAULT_CONFIG.usdcMintAddress,
            usdcEscrowAccount: DEFAULT_CONFIG.usdcEscrowAccount,
            usdcDecimals: DEFAULT_CONFIG.usdcDecimals,
            updatedBy: 'bootstrap',
          },
        })
      );
      persistedId = created.id;
      cachedConfig = mapRowToConfig(created);
    }
  } catch (error) {
    console.error('[escrowConfigStore] Failed to load configuration from database:', error);
  }
};

export const getEscrowConfig = async (): Promise<EscrowConfig> => {
  await ensureConfigLoaded();
  return cachedConfig;
};

export const updateEscrowConfig = async (
  partial: Partial<EscrowConfig>,
  options?: { actor?: string }
): Promise<EscrowConfig> => {
  await ensureConfigLoaded();

  cachedConfig = {
    ...cachedConfig,
    ...partial,
    usdcDecimals: Number(partial.usdcDecimals ?? cachedConfig.usdcDecimals ?? 6),
    updatedAt: new Date().toISOString(),
    updatedBy: options?.actor ?? 'admin-ui',
  };

  if (prisma) {
    try {
      if (persistedId) {
        const updated = await executeWithRetry(() =>
          prisma.escrowConfiguration.update({
            where: { id: persistedId as string },
            data: {
              solEscrowAddress: cachedConfig.solEscrowAddress,
              usdcMintAddress: cachedConfig.usdcMintAddress,
              usdcEscrowAccount: cachedConfig.usdcEscrowAccount,
              usdcDecimals: cachedConfig.usdcDecimals,
              updatedBy: cachedConfig.updatedBy,
            },
          })
        );
        cachedConfig = mapRowToConfig(updated);
      } else {
        const created = await executeWithRetry(() =>
          prisma.escrowConfiguration.create({
            data: {
              solEscrowAddress: cachedConfig.solEscrowAddress,
              usdcMintAddress: cachedConfig.usdcMintAddress,
              usdcEscrowAccount: cachedConfig.usdcEscrowAccount,
              usdcDecimals: cachedConfig.usdcDecimals,
              updatedBy: cachedConfig.updatedBy,
            },
          })
        );
        persistedId = created.id;
        cachedConfig = mapRowToConfig(created);
      }
    } catch (error) {
      console.error('[escrowConfigStore] Failed to persist configuration:', error);
    }
  }

  return cachedConfig;
};

export const isAdminRequest = (req: NextApiRequest): boolean => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return true;
  const headerValue = req.headers['x-admin-key'];
  if (Array.isArray(headerValue)) {
    return headerValue.includes(adminKey);
  }
  return headerValue === adminKey;
};
