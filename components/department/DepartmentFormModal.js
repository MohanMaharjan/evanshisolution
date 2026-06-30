'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

export default function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active',
    headOfDepartmentId: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  
  // Ref for the modal content
  const modalContentRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        status: initialData.status || 'active',
        headOfDepartmentId:
          initialData.headOfDepartmentId?.toString() ||
          initialData.headOfDepartment?.id?.toString() ||
          '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        status: 'active',
        headOfDepartmentId: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset scroll position when modal opens
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await fetch('/api/users?limit=100&status=active');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Department name must be less than 100 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'Department code must be at least 2 characters';
    } else if (formData.code.length > 20) {
      newErrors.code = 'Department code must be less than 20 characters';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code can only contain letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        headOfDepartmentId: formData.headOfDepartmentId
          ? parseInt(formData.headOfDepartmentId)
          : null,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const isDisabled = submitting || loading;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #ffedd5',
              boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div
              className="flex justify-between items-center px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid #ffedd5' }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#ea580c' }}>
                  {initialData ? 'Edit Department' : 'Create Department'}
                </h2>
                <p className="text-xs" style={{ color: '#78716c' }}>
                  {initialData 
                    ? 'Update department information' 
                    : 'Add a new department to the system'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#78716c', backgroundColor: 'transparent' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#fff7ed')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
                disabled={isDisabled}
                aria-label="Close modal"
              >
                <Icons.X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              ref={modalContentRef}
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#fed7aa #fff7ed',
              }}
            >
              <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Department Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#44403c' }}
                  >
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none transition-all ${
                      errors.name ? 'border-red-400 bg-red-50' : ''
                    }`}
                    style={{
                      borderColor: errors.name ? '#ef4444' : '#fed7aa',
                      backgroundColor: errors.name ? '#fef2f2' : '#ffffff',
                      color: '#1c1917',
                    }}
                    onFocus={(e) => {
                      if (!errors.name) {
                        e.target.style.borderColor = '#fb923c';
                        e.target.style.boxShadow = '0 0 0 3px #ffedd5';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.name) {
                        e.target.style.borderColor = '#fed7aa';
                        e.target.style.boxShadow = '';
                      }
                    }}
                    placeholder="e.g., Computer Science"
                    disabled={isDisabled}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm" style={{ color: '#ef4444' }} role="alert">
                      {errors.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: '#78716c' }}>
                    {formData.name.length}/100 characters
                  </p>
                </div>

                {/* Department Code */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#44403c' }}
                  >
                    Department Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      handleChange('code', e.target.value.toUpperCase())
                    }
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none transition-all font-mono ${
                      errors.code ? 'border-red-400 bg-red-50' : ''
                    }`}
                    style={{
                      borderColor: errors.code ? '#ef4444' : '#fed7aa',
                      backgroundColor: errors.code ? '#fef2f2' : '#ffffff',
                      color: '#1c1917',
                    }}
                    onFocus={(e) => {
                      if (!errors.code) {
                        e.target.style.borderColor = '#fb923c';
                        e.target.style.boxShadow = '0 0 0 3px #ffedd5';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.code) {
                        e.target.style.borderColor = '#fed7aa';
                        e.target.style.boxShadow = '';
                      }
                    }}
                    placeholder="e.g., CS-DEPT"
                    disabled={isDisabled}
                    aria-invalid={!!errors.code}
                    aria-describedby={errors.code ? "code-error" : undefined}
                  />
                  {errors.code && (
                    <p id="code-error" className="mt-1 text-sm" style={{ color: '#ef4444' }} role="alert">
                      {errors.code}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: '#fb923c' }}>
                    Auto-converted to uppercase. Use letters, numbers, and hyphens only.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#44403c' }}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none transition-all resize-none"
                    style={{
                      borderColor: '#fed7aa',
                      backgroundColor: '#ffffff',
                      color: '#1c1917',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fb923c';
                      e.target.style.boxShadow = '0 0 0 3px #ffedd5';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#fed7aa';
                      e.target.style.boxShadow = '';
                    }}
                    placeholder="Describe the department's purpose and scope..."
                    disabled={isDisabled}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs" style={{ color: '#78716c' }}>
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#44403c' }}
                  >
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none transition-all"
                    style={{
                      borderColor: '#fed7aa',
                      backgroundColor: '#ffffff',
                      color: '#1c1917',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fb923c';
                      e.target.style.boxShadow = '0 0 0 3px #ffedd5';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#fed7aa';
                      e.target.style.boxShadow = '';
                    }}
                    disabled={isDisabled}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Head of Department */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#44403c' }}
                  >
                    Head of Department
                  </label>
                  <select
                    value={formData.headOfDepartmentId}
                    onChange={(e) =>
                      handleChange('headOfDepartmentId', e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none transition-all"
                    style={{
                      borderColor: '#fed7aa',
                      backgroundColor: '#ffffff',
                      color: '#1c1917',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fb923c';
                      e.target.style.boxShadow = '0 0 0 3px #ffedd5';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#fed7aa';
                      e.target.style.boxShadow = '';
                    }}
                    disabled={isDisabled || fetchingUsers}
                  >
                    <option value="">None (Not Assigned)</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {fetchingUsers && (
                    <p className="mt-1 text-xs" style={{ color: '#78716c' }}>
                      <Icons.Loader2 size={12} className="inline animate-spin mr-1" />
                      Loading users...
                    </p>
                  )}
                </div>

                {/* Spacer for better scroll experience */}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer - Fixed */}
            <div
              className="px-6 py-4 flex gap-3 flex-shrink-0"
              style={{ 
                borderTop: '1px solid #ffedd5',
                backgroundColor: '#ffffff',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-xl transition-all duration-200 font-medium"
                style={{
                  borderColor: '#d6d3d1',
                  color: '#44403c',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f5f5f4')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
                disabled={isDisabled}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="flex-1 px-4 py-2 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #ea580c, #dc2626)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #f97316, #ef4444)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Icons.Loader2 size={18} className="animate-spin" />
                    {initialData ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Icons.Save size={18} />
                    {initialData ? 'Update Department' : 'Create Department'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}