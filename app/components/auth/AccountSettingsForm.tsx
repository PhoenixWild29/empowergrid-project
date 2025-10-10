import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Account Settings Form
 * 
 * Features:
 * - Update email, bio, website, social links
 * - Change password confirmation
 * - Loading states
 * - Success/error feedback
 * - Confirmation dialogs for sensitive changes
 */
export default function AccountSettingsForm() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
      });
    }
  }, [user]);

  // Validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWebsite = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validate
    const newErrors: Record<string, string> = {};

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.website && !validateWebsite(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || 'Update failed' });
        }
        return;
      }

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Redirect to homepage after deletion
        window.location.href = '/';
      } else {
        const data = await response.json();
        setErrors({ general: data.error || 'Failed to delete account' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    }
    
    setShowDeleteConfirm(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="not-authenticated">
        <p>Please log in to access account settings.</p>
      </div>
    );
  }

  return (
    <div className="account-settings-form">
      <h2>Account Settings</h2>
      <p className="form-description">Manage your profile and account preferences</p>

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

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Profile Information</h3>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={isSubmitting}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="bio">
              Bio
              <span className="char-count">
                {formData.bio.length}/500
              </span>
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
              className={errors.bio ? 'error' : ''}
            />
            {errors.bio && (
              <span className="error-message">{errors.bio}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              disabled={isSubmitting}
              className={errors.website ? 'error' : ''}
            />
            {errors.website && (
              <span className="error-message">{errors.website}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
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

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <p>Once you delete your account, there is no going back.</p>
        <button
          className="delete-button"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </button>
      </div>

      {showDeleteConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} />
          <div className="confirm-modal" role="dialog" aria-modal="true">
            <h3>Delete Account?</h3>
            <p>
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleDeleteAccount}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .account-settings-form {
          max-width: 600px;
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

        .form-section {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-section h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #212529;
        }

        .char-count {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: normal;
        }

        input,
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        input:focus,
        textarea:focus {
          outline: none;
          border-color: #0d6efd;
        }

        input.error,
        textarea.error {
          border-color: #dc3545;
        }

        input:disabled,
        textarea:disabled {
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

        .form-actions {
          display: flex;
          gap: 1rem;
        }

        .submit-button {
          flex: 1;
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
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .danger-zone {
          background: #fff5f5;
          border: 2px solid #f8d7da;
          border-radius: 12px;
          padding: 2rem;
          margin-top: 3rem;
        }

        .danger-zone h3 {
          color: #dc3545;
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .danger-zone p {
          color: #842029;
          margin-bottom: 1rem;
        }

        .delete-button {
          padding: 0.75rem 1.5rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-button:hover {
          background: #bb2d3b;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
        }

        .confirm-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          z-index: 9999;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .confirm-modal h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #dc3545;
        }

        .confirm-modal p {
          color: #495057;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
        }

        .cancel-button,
        .confirm-delete-button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover {
          background: #5a6268;
        }

        .confirm-delete-button {
          background: #dc3545;
          color: white;
        }

        .confirm-delete-button:hover {
          background: #bb2d3b;
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




