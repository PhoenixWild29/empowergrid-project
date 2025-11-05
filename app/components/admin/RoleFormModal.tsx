import React, { useState, useEffect } from 'react';

interface RoleFormData {
  name: string;
  description: string;
  parentRoleId?: string;
}

interface RoleFormModalProps {
  isOpen: boolean;
  editingRole?: { id: string; name: string; description: string; parentRoleId?: string } | null;
  onClose: () => void;
  onSave: (data: RoleFormData, roleId?: string) => Promise<void>;
}

/**
 * Role Form Modal
 * 
 * Features:
 * - Create new roles
 * - Edit existing roles
 * - Validation (name max 50 chars, description max 200 chars)
 * - Error handling
 * - Loading states
 */
export default function RoleFormModal({
  isOpen,
  editingRole,
  onClose,
  onSave,
}: RoleFormModalProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    parentRoleId: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load editing role data
  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name,
        description: editingRole.description,
        parentRoleId: editingRole.parentRoleId,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parentRoleId: undefined,
      });
    }
    setErrors({});
  }, [editingRole, isOpen]);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Role name must be 50 characters or less';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.name)) {
      newErrors.name = 'Role name can only contain letters, numbers, underscores, and spaces';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await onSave(formData, editingRole?.id);
      onClose();
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to save role' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="role-form-modal">
        <div className="modal-header">
          <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          <button onClick={onClose} className="close-btn" disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && (
              <div className="error-message general" role="alert">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">
                Role Name <span className="required">*</span>
                <span className="char-count">{formData.name.length}/50</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={50}
                disabled={isSubmitting}
                className={errors.name ? 'error' : ''}
                placeholder="Enter role name..."
                required
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
                <span className="char-count">{formData.description.length}/200</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={200}
                rows={3}
                disabled={isSubmitting}
                className={errors.description ? 'error' : ''}
                placeholder="Describe this role's purpose..."
              />
              {errors.description && (
                <span className="error-message">{errors.description}</span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                editingRole ? 'Update Role' : 'Create Role'
              )}
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9998;
          }

          .role-form-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e9ecef;
          }

          .modal-header h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
          }

          .close-btn:hover:not(:disabled) {
            color: #212529;
          }

          .modal-body {
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

          .required {
            color: #dc3545;
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
            opacity: 0.6;
          }

          .error-message {
            color: #dc3545;
            font-size: 0.85rem;
            display: block;
            margin-top: 0.25rem;
          }

          .error-message.general {
            background: #f8d7da;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          .cancel-button,
          .save-button {
            padding: 0.75rem 1.5rem;
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

          .cancel-button:hover:not(:disabled) {
            background: #5a6268;
          }

          .save-button {
            background: #0d6efd;
            color: white;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .save-button:hover:not(:disabled) {
            background: #0b5ed7;
          }

          .cancel-button:disabled,
          .save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}






