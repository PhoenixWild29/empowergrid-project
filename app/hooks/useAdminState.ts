import { useState, useCallback } from 'react';

/**
 * WO-175: UI State Management and Navigation System
 * 
 * Custom hook for managing admin state across components
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface AdminState {
  currentUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useAdminState() {
  const [state, setState] = useState<AdminState>({
    currentUser: null,
    isLoading: false,
    error: null,
  });

  const setCurrentUser = useCallback((user: AdminUser | null) => {
    setState((prev) => ({ ...prev, currentUser: user }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    setCurrentUser,
    setLoading,
    setError,
    clearError,
  };
}

/**
 * Hook for managing form state
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const setField = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setIsDirty(false);
  }, [initialState]);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    formData,
    errors,
    isDirty,
    hasErrors,
    setField,
    setFieldError,
    clearFieldError,
    resetForm,
    setFormData,
  };
}

/**
 * Hook for managing pagination state
 */
export function usePaginationState(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages]
  );

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
  };
}

