/**
 * Wallet Preferences Utility
 * 
 * Manages wallet preferences in localStorage
 */

const STORAGE_KEYS = {
  PREFERRED_WALLET: 'empowergrid_preferred_wallet',
  WALLET_HISTORY: 'empowergrid_wallet_history',
  AUTO_CONNECT: 'empowergrid_auto_connect',
};

export interface WalletPreference {
  walletName: string;
  lastConnected: string;
  autoConnect: boolean;
}

/**
 * Save preferred wallet
 */
export function savePreferredWallet(walletName: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.PREFERRED_WALLET, walletName);
  
  // Update history
  const history = getWalletHistory();
  const updatedHistory = [
    {
      walletName,
      lastConnected: new Date().toISOString(),
      autoConnect: getAutoConnectPreference(),
    },
    ...history.filter(h => h.walletName !== walletName).slice(0, 4), // Keep last 5
  ];
  
  localStorage.setItem(STORAGE_KEYS.WALLET_HISTORY, JSON.stringify(updatedHistory));
}

/**
 * Get preferred wallet
 */
export function getPreferredWallet(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.PREFERRED_WALLET);
}

/**
 * Get wallet history
 */
export function getWalletHistory(): WalletPreference[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = localStorage.getItem(STORAGE_KEYS.WALLET_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Set auto-connect preference
 */
export function setAutoConnectPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT, enabled ? 'true' : 'false');
}

/**
 * Get auto-connect preference
 */
export function getAutoConnectPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT) === 'true';
}

/**
 * Clear wallet preferences
 */
export function clearWalletPreferences(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.PREFERRED_WALLET);
  localStorage.removeItem(STORAGE_KEYS.WALLET_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.AUTO_CONNECT);
}




