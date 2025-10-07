import { useState, useCallback } from 'react';
import { z } from 'zod';
import { validateField } from '../utils/validation';

interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
}

interface UseFormValidationOptions<T> {
  initialData: T;
  schema: z.ZodSchema<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialData,
  schema,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isValid: false,
    isSubmitting: false,
  });

  const validateForm = useCallback(() => {
    const result = schema.safeParse(formState.data);
    if (result.success) {
      setFormState(prev => ({
        ...prev,
        errors: {},
        isValid: true,
      }));
      return { success: true, data: result.data };
    } else {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormState(prev => ({
        ...prev,
        errors,
        isValid: false,
      }));
      return { success: false, errors };
    }
  }, [formState.data, schema]);

  const validateFieldUtil = useCallback(
    (fieldName: string, value: any) => {
      const result = validateField(schema, { [fieldName]: value });
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: result.success
            ? ''
            : result.errors.map(e => e.message).join(', '),
        },
      }));
      return result;
    },
    [schema]
  );

  const setFieldValue = useCallback(
    (fieldName: string, value: any) => {
      setFormState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          [fieldName]: value,
        },
      }));

      if (validateOnChange) {
        validateFieldUtil(fieldName, value);
      }
    },
    [validateOnChange, validateFieldUtil]
  );

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error,
      },
    }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: fieldName in prev.errors ? '' : prev.errors[fieldName],
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const validation = validateForm();

      if (!validation.success) {
        return; // Don't submit if validation failed
      }

      setFormState(prev => ({ ...prev, isSubmitting: true }));

      try {
        if (onSubmit) {
          await onSubmit(validation.data!);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        // Error handling will be done by error boundary or toast
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [validateForm, onSubmit]
  );

  const resetForm = useCallback(() => {
    setFormState({
      data: initialData,
      errors: {},
      isValid: false,
      isSubmitting: false,
    });
  }, [initialData]);

  return {
    // State
    data: formState.data,
    errors: formState.errors,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,

    // Actions
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField: validateFieldUtil,
    validateForm,
    handleSubmit,
    resetForm,
  };
}
