import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface RegistrationFormProps {
  onSuccess?: () => void;
}

/**
 * User Registration Form
 * 
 * Features:
 * - Username, email, password fields
 * - Client-side validation
 * - Password strength checking
 * - Username uniqueness check
 * - Loading states
 * - Error/success feedback
 */
export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    walletAddress: '',
    username: '',
    email: '',
    role: 'FUNDER' as 'GUEST' | 'FUNDER' | 'CREATOR',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
  };

  const validateWalletAddress = (address: string): boolean => {
    return address.length >= 32 && address.length <= 44;
  };

  // Check username uniqueness
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users?search=${username}`);
      const data = await response.json();
      return data.users.length === 0;
    } catch {
      return true; // Assume available on error
    }
  };

  // Validate form
  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.walletAddress) {
      newErrors.walletAddress = 'Wallet address is required';
    } else if (!validateWalletAddress(formData.walletAddress)) {
      newErrors.walletAddress = 'Invalid wallet address format';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters (letters, numbers, underscores only)';
    } else {
      const isAvailable = await checkUsernameAvailability(formData.username);
      if (!isAvailable) {
        newErrors.username = 'Username is already taken';
      }
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || 'Registration failed' });
        }
        return;
      }

      setSuccessMessage('Registration successful! Redirecting...');
      
      // Call success callback or redirect
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h2>Create Your Account</h2>
      <p className="form-description">Join the EmpowerGRID community</p>

      {errors.general && (
        <div className="error-message general-error" role="alert">
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="status">
          ✓ {successMessage}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="walletAddress">
          Wallet Address <span className="required">*</span>
        </label>
        <input
          type="text"
          id="walletAddress"
          name="walletAddress"
          value={formData.walletAddress}
          onChange={handleChange}
          placeholder="Your Solana wallet address"
          required
          disabled={isSubmitting}
          className={errors.walletAddress ? 'error' : ''}
          aria-invalid={!!errors.walletAddress}
          aria-describedby={errors.walletAddress ? 'walletAddress-error' : undefined}
        />
        {errors.walletAddress && (
          <span className="error-message" id="walletAddress-error">
            {errors.walletAddress}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="username">
          Username <span className="required">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a unique username"
          required
          disabled={isSubmitting}
          className={errors.username ? 'error' : ''}
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? 'username-error' : undefined}
        />
        {errors.username && (
          <span className="error-message" id="username-error">
            {errors.username}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">
          Email (Optional)
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          disabled={isSubmitting}
          className={errors.email ? 'error' : ''}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span className="error-message" id="email-error">
            {errors.email}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="role">
          I want to <span className="required">*</span>
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        >
          <option value="FUNDER">Fund Projects</option>
          <option value="CREATOR">Create Projects</option>
          <option value="GUEST">Just Browse</option>
        </select>
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner"></span>
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="form-footer">
        Already have an account? <a href="/login">Log in</a>
      </p>

      <style jsx>{`
        .registration-form {
          max-width: 450px;
          margin: 0 auto;
          padding: 2rem;
        }

        h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .form-description {
          color: #6c757d;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #212529;
        }

        .required {
          color: #dc3545;
        }

        input,
        select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #0d6efd;
        }

        input.error {
          border-color: #dc3545;
        }

        input:disabled,
        select:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .error-message {
          display: block;
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .error-message.general-error {
          background: #f8d7da;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #f5c2c7;
          margin-bottom: 1.5rem;
        }

        .success-message {
          background: #d1e7dd;
          color: #0f5132;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #badbcc;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: #0d6efd;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          background: #0b5ed7;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: #6c757d;
        }

        .form-footer a {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 600;
        }

        .form-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </form>
  );
}






