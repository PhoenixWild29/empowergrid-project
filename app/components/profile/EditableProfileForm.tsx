import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

interface ProfileFormData {
  username: string;
  email: string;
  bio: string;
  website: string;
  avatar: string;
}

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Editable Profile Form
 * 
 * Features:
 * - Pre-populated with current user data
 * - Real-time client-side validation
 * - Unsaved changes tracking
 * - Navigation warning for unsaved changes
 * - Cancel functionality
 * - Success/error feedback
 * - Character limits with counters
 */
export default function EditableProfileForm() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    bio: '',
    website: '',
    avatar: '',
  });

  const [originalData, setOriginalData] = useState<ProfileFormData>({
    username: '',
    email: '',
    bio: '',
    website: '',
    avatar: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Load user data
  useEffect(() => {
    if (user) {
      const userData = {
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
        avatar: user.avatar || '',
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(
      (key) => formData[key as keyof ProfileFormData] !== originalData[key as keyof ProfileFormData]
    );
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  // Warn before navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Please enter a valid email address';
  };

  const validateUsername = (username: string): string | null => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username must be 30 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const validateBio = (bio: string): string | null => {
    if (bio.length > 500) return 'Bio must be 500 characters or less';
    return null;
  };

  const validateWebsite = (website: string): string | null => {
    if (!website) return null;
    try {
      new URL(website);
      return null;
    } catch {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };

  // Validate field
  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'username':
        return validateUsername(value);
      case 'bio':
        return validateBio(value);
      case 'website':
        return validateWebsite(value);
      default:
        return null;
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof ProfileFormData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setGeneralError('');

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {});
    setTouched(allTouched);

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const fieldErrors: ValidationErrors = {};
          data.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setGeneralError(data.error || 'Failed to update profile');
        }
        return;
      }

      // Update original data to new values
      setOriginalData(formData);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setGeneralError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }

    setFormData(originalData);
    setErrors({});
    setTouched({});
    setSuccessMessage('');
    setGeneralError('');
  };

  if (!isAuthenticated) {
    return (
      <div className="not-authenticated">
        <p>Please log in to edit your profile.</p>
      </div>
    );
  }

  return (
    <div className="editable-profile-form">
      {generalError && (
        <div className="alert alert-error" role="alert">
          ⚠️ {generalError}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="status">
          ✓ {successMessage}
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="alert alert-warning">
          💡 You have unsaved changes
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Username */}
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
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={errors.username && touched.username ? 'error' : ''}
            aria-invalid={!!(errors.username && touched.username)}
            aria-describedby={errors.username && touched.username ? 'username-error' : undefined}
          />
          {errors.username && touched.username && (
            <span className="error-message" id="username-error" role="alert">
              {errors.username}
            </span>
          )}
          <span className="help-text">
            3-30 characters, letters, numbers, and underscores only
          </span>
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={errors.email && touched.email ? 'error' : ''}
            aria-invalid={!!(errors.email && touched.email)}
            aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
          />
          {errors.email && touched.email && (
            <span className="error-message" id="email-error" role="alert">
              {errors.email}
            </span>
          )}
          <span className="help-text">
            Used for notifications and account recovery
          </span>
        </div>

        {/* Bio */}
        <div className="form-group">
          <label htmlFor="bio">
            Bio
            <span className={`char-counter ${formData.bio.length > 500 ? 'error' : ''}`}>
              {formData.bio.length}/500
            </span>
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            rows={4}
            maxLength={500}
            className={errors.bio && touched.bio ? 'error' : ''}
            placeholder="Tell others about yourself..."
            aria-invalid={!!(errors.bio && touched.bio)}
            aria-describedby={errors.bio && touched.bio ? 'bio-error' : undefined}
          />
          {errors.bio && touched.bio && (
            <span className="error-message" id="bio-error" role="alert">
              {errors.bio}
            </span>
          )}
        </div>

        {/* Website */}
        <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            placeholder="https://yourwebsite.com"
            className={errors.website && touched.website ? 'error' : ''}
            aria-invalid={!!(errors.website && touched.website)}
            aria-describedby={errors.website && touched.website ? 'website-error' : undefined}
          />
          {errors.website && touched.website && (
            <span className="error-message" id="website-error" role="alert">
              {errors.website}
            </span>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isSubmitting || !hasUnsavedChanges}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={isSubmitting || !hasUnsavedChanges || Object.keys(errors).some(k => errors[k])}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .editable-profile-form {
          max-width: 600px;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .alert-error {
          background: #f8d7da;
          color: #842029;
          border: 1px solid #f5c2c7;
        }

        .alert-success {
          background: #d1e7dd;
          color: #0f5132;
          border: 1px solid #badbcc;
        }

        .alert-warning {
          background: #fff3cd;
          color: #664d03;
          border: 1px solid #ffecb5;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #212529;
        }

        .required {
          color: #dc3545;
        }

        .char-counter {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: normal;
        }

        .char-counter.error {
          color: #dc3545;
        }

        input,
        textarea {
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        input:focus,
        textarea:focus {
          outline: none;
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
        }

        input.error,
        textarea.error {
          border-color: #dc3545;
        }

        input.error:focus,
        textarea.error:focus {
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }

        input:disabled,
        textarea:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .error-message::before {
          content: '⚠';
        }

        .help-text {
          color: #6c757d;
          font-size: 0.85rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e9ecef;
        }

        .cancel-button,
        .save-button {
          flex: 1;
          padding: 1rem;
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

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-button {
          background: #198754;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #157347;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
        }

        .save-button:disabled {
          opacity: 0.5;
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

        .not-authenticated {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}






