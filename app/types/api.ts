// API-related TypeScript types for the Next.js application

// ---- API Response Types ----

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MeterReading {
  ts: number;
  kwh: number;
  co2: number;
  raw_wh: number;
}

// ---- Solana Actions Types ----

export interface ActionGetResponse {
  type: 'action';
  icon: string;
  title: string;
  description: string;
  label: string;
  links: {
    actions: Array<{
      label: string;
      href: string;
      parameters?: Array<{
        name: string;
        label: string;
      }>;
    }>;
  };
}

export interface ActionPostRequest {
  account: string;
  [key: string]: any;
}

export interface ActionPostResponse {
  transaction: string;
  message: string;
}

// ---- Form Types ----

export interface CreateProjectForm {
  name: string;
  description: string;
  governanceAuthority: string;
  oracleAuthority: string;
}

export interface MilestoneForm {
  index: number;
  amountLamports: string;
  kwhTarget: string;
  co2Target: string;
  payee: string;
}

export interface CreateProjectRequest {
  project: CreateProjectForm;
  milestones: MilestoneForm[];
}

// ---- Wallet Types ----

export interface WalletInfo {
  address: string;
  connected: boolean;
  connecting: boolean;
}

export interface PhantomWallet {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: string }>;
  disconnect(): Promise<void>;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

// ---- Environment Types ----

export interface AppConfig {
  rpcUrl: string;
  programId: string;
  cluster: 'devnet' | 'mainnet-beta' | 'testnet';
}

// ---- Error Types ----

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ---- Utility Types ----

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ---- Component Props Types ----

export interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    description: string;
    fundedAmount: number;
    kwhTotal: number;
    co2Total: number;
    numMilestones: number;
  };
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}