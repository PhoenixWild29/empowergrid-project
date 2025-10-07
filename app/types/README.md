# TypeScript Types

This directory contains TypeScript type definitions for the EmpowerGRID application.

## Files

- `program.ts` - Core program types manually defined from Rust structs
- `api.ts` - API and component-related types
- `index.ts` - Central exports and utility functions
- `generated.ts` - Auto-generated types from Anchor IDL (created after building)

## Generating Types

After building the Anchor program, run:

```bash
npm run gen:types
```

This will generate `generated.ts` with types automatically derived from the IDL.

## Manual Types vs Generated Types

- **Manual types** (`program.ts`, `api.ts`) - Hand-written for clarity and documentation
- **Generated types** (`generated.ts`) - Auto-generated from IDL for accuracy

Use manual types for application logic and generated types for direct Anchor interactions.

## Usage

```typescript
import {
  Project,
  Milestone,
  CreateProjectInstruction,
  lamportsToSol,
  formatPublicKey,
} from '../types';

// Use in components
interface ProjectCardProps {
  project: Project;
}

// Utility functions
const solAmount = lamportsToSol(project.fundedAmount);
const shortKey = formatPublicKey(project.creator);
```
