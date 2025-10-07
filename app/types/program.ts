// TypeScript types generated from EmpowerGRID Anchor IDL
// These types correspond to the Rust program structures in lib.rs

import { PublicKey } from '@solana/web3.js';

// ---- Account Types ----

export interface State {
  authority: PublicKey;
  projectCount: number;
}

export interface Vault {
  bump: number;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  creator: PublicKey;
  governanceAuthority: PublicKey;
  oracleAuthority: PublicKey;
  vault: PublicKey;
  vaultBump: number;
  fundedAmount: number; // in lamports
  kwhTotal: number;
  co2Total: number;
  lastMetricsRoot: number[]; // [u8; 32]
  numMilestones: number;
}

export interface Milestone {
  project: PublicKey;
  index: number;
  amountLamports: number;
  kwhTarget: number;
  co2Target: number;
  payee: PublicKey;
  released: boolean;
}

// ---- Event Types ----

export interface ProjectFundedEvent {
  project: PublicKey;
  funder: PublicKey;
  amount: number;
}

export interface MetricsUpdatedEvent {
  project: PublicKey;
  kwhTotal: number;
  co2Total: number;
}

export interface MilestoneReleasedEvent {
  project: PublicKey;
  index: number;
  amount: number;
  payee: PublicKey;
}

// ---- Instruction Types ----

export interface InitializeInstruction {
  // No additional parameters needed
}

export interface CreateProjectInstruction {
  name: string;
  description: string;
  governanceAuthority: PublicKey;
  oracleAuthority: PublicKey;
}

export interface CreateMilestoneInstruction {
  index: number;
  amountLamports: number;
  kwhTarget: number;
  co2Target: number;
  payee: PublicKey;
}

export interface FundProjectInstruction {
  amount: number; // in lamports
}

export interface SubmitMetricsInstruction {
  kwhDelta: number;
  co2Delta: number;
  newRoot?: number[]; // Optional [u8; 32]
}

export interface ReleaseMilestoneInstruction {
  // No additional parameters needed - uses milestone account
}

export interface SetProjectAuthorityInstruction {
  newGovernanceAuthority: PublicKey;
}

// ---- Program Type ----

export interface EmpowerGridProgram {
  // Instructions
  initialize: (ctx: any) => Promise<void>;
  createProject: (ctx: any, params: CreateProjectInstruction) => Promise<void>;
  createMilestone: (
    ctx: any,
    params: CreateMilestoneInstruction
  ) => Promise<void>;
  fundProject: (ctx: any, params: FundProjectInstruction) => Promise<void>;
  submitMetrics: (ctx: any, params: SubmitMetricsInstruction) => Promise<void>;
  releaseMilestone: (ctx: any) => Promise<void>;
  setProjectAuthority: (
    ctx: any,
    params: SetProjectAuthorityInstruction
  ) => Promise<void>;

  // Accounts
  state: {
    fetch: (address: PublicKey) => Promise<State>;
  };
  project: {
    fetch: (address: PublicKey) => Promise<Project>;
  };
  milestone: {
    fetch: (address: PublicKey) => Promise<Milestone>;
  };
}

// ---- Utility Types ----

export interface ProjectWithMilestones extends Project {
  milestones: Milestone[];
}

export interface ProjectSummary {
  id: number;
  name: string;
  description: string;
  fundedAmount: number;
  kwhTotal: number;
  co2Total: number;
  numMilestones: number;
  progress: number; // percentage
}

// ---- Error Types ----

export enum ProgramError {
  NumericalOverflow = 'Numerical overflow occurred.',
  Unauthorized = 'Unauthorized',
  StringTooLong = 'String too long.',
  InvalidMilestone = 'Invalid milestone account.',
  MetricThresholdNotMet = 'Metric threshold not met.',
  InsufficientFunds = 'Insufficient funds in vault.',
  AlreadyReleased = 'Milestone already released.',
  InvalidAmount = 'Invalid amount.',
}

// ---- PDA Derivation Functions ----

export const findProjectPDA = (
  state: PublicKey,
  creator: PublicKey,
  projectId: number,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('project'),
      state.toBuffer(),
      creator.toBuffer(),
      Buffer.from(projectId.toString()),
    ],
    programId
  );
};

export const findVaultPDA = (
  project: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), project.toBuffer()],
    programId
  );
};

export const findMilestonePDA = (
  project: PublicKey,
  index: number,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('milestone'), project.toBuffer(), Buffer.from([index])],
    programId
  );
};
