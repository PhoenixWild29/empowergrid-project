#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Anchor IDL
 * Run this after building the Anchor program to generate types
 */

const fs = require('fs');
const path = require('path');

const IDL_PATH = path.join(__dirname, '..', '..', 'idl', 'empower_grid.json');
const TYPES_PATH = path.join(__dirname, '..', 'types', 'generated.ts');

function generateTypesFromIDL() {
  try {
    // Read the IDL file
    const idlContent = fs.readFileSync(IDL_PATH, 'utf8');
    const idl = JSON.parse(idlContent);

    if (!idl || Object.keys(idl).length === 0) {
      console.log('IDL is empty. Please build the Anchor program first.');
      return;
    }

    // Generate TypeScript types
    let typesContent = `// Auto-generated types from Anchor IDL
// Generated on: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

import { PublicKey } from '@solana/web3.js';
import { IdlAccounts, IdlTypes } from '@coral-xyz/anchor';

export type EmpowerGridIdl = ${JSON.stringify(idl, null, 2)};

// Account types
export type State = IdlAccounts<EmpowerGridIdl>['state'];
export type Vault = IdlAccounts<EmpowerGridIdl>['vault'];
export type Project = IdlAccounts<EmpowerGridIdl>['project'];
export type Milestone = IdlAccounts<EmpowerGridIdl>['milestone'];

// Instruction types
export type InitializeInstruction = IdlTypes<EmpowerGridIdl>['initialize'];
export type CreateProjectInstruction = IdlTypes<EmpowerGridIdl>['createProject'];
export type CreateMilestoneInstruction = IdlTypes<EmpowerGridIdl>['createMilestone'];
export type FundProjectInstruction = IdlTypes<EmpowerGridIdl>['fundProject'];
export type SubmitMetricsInstruction = IdlTypes<EmpowerGridIdl>['submitMetrics'];
export type ReleaseMilestoneInstruction = IdlTypes<EmpowerGridIdl>['releaseMilestone'];
export type SetProjectAuthorityInstruction = IdlTypes<EmpowerGridIdl>['setProjectAuthority'];

// Event types
export type ProjectFundedEvent = IdlTypes<EmpowerGridIdl>['ProjectFunded'];
export type MetricsUpdatedEvent = IdlTypes<EmpowerGridIdl>['MetricsUpdated'];
export type MilestoneReleasedEvent = IdlTypes<EmpowerGridIdl>['MilestoneReleased'];

// Error types
export type ProgramError = IdlTypes<EmpowerGridIdl>['ErrorCode'];
`;

    // Write the generated types
    fs.writeFileSync(TYPES_PATH, typesContent, 'utf8');
    console.log(`✅ Types generated successfully at ${TYPES_PATH}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(
        '❌ IDL file not found. Please build the Anchor program first.'
      );
      console.log('Run: cd programs/empower_grid && anchor build');
    } else {
      console.error('❌ Error generating types:', error.message);
    }
    process.exit(1);
  }
}

// Run the generator
generateTypesFromIDL();
