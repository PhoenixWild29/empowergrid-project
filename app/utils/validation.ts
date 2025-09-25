import { z } from 'zod';

// Custom validation functions
const isValidSolanaAddress = (address: string): boolean => {
  try {
    // Basic Solana address validation (32 bytes, base58 encoded)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
};

const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000 && Number.isFinite(amount);
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validation schemas
export const solanaAddressSchema = z
  .string()
  .min(32, 'Solana address must be at least 32 characters')
  .max(44, 'Solana address must be at most 44 characters')
  .refine(isValidSolanaAddress, 'Invalid Solana address format');

export const amountSchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .positive('Amount must be greater than 0')
  .max(1000, 'Amount cannot exceed 1000 SOL')
  .refine(isValidAmount, 'Invalid amount');

export const solAmountSchema = z
  .string()
  .transform((val) => parseFloat(val))
  .pipe(amountSchema);

export const projectNameSchema = z
  .string()
  .min(3, 'Project name must be at least 3 characters')
  .max(64, 'Project name must be at most 64 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name contains invalid characters');

export const projectDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(256, 'Description must be at most 256 characters');

export const kwhTargetSchema = z
  .number()
  .int('kWh target must be a whole number')
  .positive('kWh target must be greater than 0')
  .max(1000000, 'kWh target cannot exceed 1,000,000');

export const co2TargetSchema = z
  .number()
  .positive('CO₂ target must be greater than 0')
  .max(1000000, 'CO₂ target cannot exceed 1,000,000 kg');

export const payeeAddressSchema = solanaAddressSchema;

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(isValidUrl, 'Invalid URL');

// Form schemas
export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
  governanceAuthority: solanaAddressSchema.optional(),
  oracleAuthority: solanaAddressSchema.optional(),
});

export const milestoneSchema = z.object({
  index: z.number().int().min(0),
  amountLamports: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(amountSchema)
    .transform((val) => Math.floor(val * 1_000_000_000)), // Convert to lamports
  kwhTarget: kwhTargetSchema,
  co2Target: co2TargetSchema,
  payee: payeeAddressSchema,
});

export const createProjectWithMilestonesSchema = z.object({
  project: createProjectSchema,
  milestones: z
    .array(milestoneSchema)
    .min(1, 'At least one milestone is required')
    .max(10, 'Cannot have more than 10 milestones'),
});

// API schemas
export const fundProjectSchema = z.object({
  projectId: solanaAddressSchema,
  amount: solAmountSchema,
  funderAddress: solanaAddressSchema,
});

export const meterReadingSchema = z.object({
  ts: z.number().int().positive(),
  kwh: z.number().nonnegative(),
  co2: z.number().nonnegative(),
  raw_wh: z.number().int().nonnegative(),
});

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Validation helper functions
export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: any
): { success: true; data: T } | { success: false; errors: ValidationError[] } => {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ValidationError[] = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return { success: false, errors };
};

export const validateForm = <T>(
  schema: z.ZodSchema<T>,
  formData: any
): { success: true; data: T } | { success: false; errors: ValidationError[] } => {
  return validateField(schema, formData);
};

// Error formatting
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map((error) => `${error.field}: ${error.message}`).join('\n');
};

export const formatApiError = (error: ApiError): string => {
  return error.message || 'An unexpected error occurred';
};

// Common validation patterns
export const validateSolanaAddress = (address: string): boolean => {
  return isValidSolanaAddress(address);
};

export const validateFundingAmount = (amount: number): boolean => {
  return isValidAmount(amount);
};

export const validateProjectName = (name: string): boolean => {
  const result = projectNameSchema.safeParse(name);
  return result.success;
};

export const validateProjectDescription = (description: string): boolean => {
  const result = projectDescriptionSchema.safeParse(description);
  return result.success;
};