/**
 * Profile Form Validation Hook
 * 
 * Provides validation logic for user profile forms
 */

import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

/**
 * Profile form validation hook
 */
export function useProfileFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const rule = rules[fieldName];
    if (!rule) return null;

    // Required check
    if (rule.required && !value.trim()) {
      return `${fieldName} is required`;
    }

    // Skip other validations if empty and not required
    if (!value.trim() && !rule.required) {
      return null;
    }

    // Min length
    if (rule.minLength && value.length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters`;
    }

    // Max length
    if (rule.maxLength && value.length > rule.maxLength) {
      return `Must be ${rule.maxLength} characters or less`;
    }

    // Pattern matching
    if (rule.pattern && !rule.pattern.test(value)) {
      return `Invalid format`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  /**
   * Validate all fields
   */
  const validateAll = useCallback((values: Record<string, string>): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName] || '');
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules, validateField]);

  /**
   * Mark field as touched
   */
  const touchField = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  /**
   * Mark all fields as touched
   */
  const touchAll = useCallback((values: Record<string, string>) => {
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {});
    setTouched(allTouched);
  }, []);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear error for specific field
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateAll,
    touchField,
    touchAll,
    clearErrors,
    clearFieldError,
    reset,
  };
}

/**
 * Email validation helper
 */
export function validateEmail(email: string): string | null {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Please enter a valid email address';
}

/**
 * URL validation helper
 */
export function validateURL(url: string): string | null {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

/**
 * Username validation helper
 */
export function validateUsername(username: string): string | null {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be 30 characters or less';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
}




