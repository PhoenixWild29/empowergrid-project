import type { NextApiRequest } from 'next';

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

let currentConfig: EscrowConfig = { ...DEFAULT_CONFIG };

export const getEscrowConfig = (): EscrowConfig => currentConfig;

export const updateEscrowConfig = (
  partial: Partial<EscrowConfig>,
  options?: { actor?: string }
): EscrowConfig => {
  currentConfig = {
    ...currentConfig,
    ...partial,
    usdcDecimals: Number(partial.usdcDecimals ?? currentConfig.usdcDecimals ?? 6),
    updatedAt: new Date().toISOString(),
    updatedBy: options?.actor ?? 'admin-ui',
  };

  return currentConfig;
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
