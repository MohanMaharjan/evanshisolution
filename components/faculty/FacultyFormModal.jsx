'use client';

import { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

const colors = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },
  success: { light: '#dcfce7', main: '#22c55e' },
  info: { light: '#eff6ff', main: '#3b82f6' },
  warning: { light: '#fefce8', main: '#f59e0b' },
  error: { light: '#fef2f2', main: '#ef4444' },
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
};

export default function FacultyFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    designation: '',
    qualification: '',
    specialization: '',
    status: 'active',
    joinedDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        designation: initialData.designation || '',
        qualification: initialData.qualification || '',
        specialization: initialData.specialization || '',
        status: initialData.status || 'active',
        joinedDate: initialData.joinedDate
          ? new Date(initialData.joinedDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
      setPhotoPreview(initialData.profilePicture || null);
      setCvFileName(initialData.cv ? 'Current CV' : '');
    } else {
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        designation: '',
        qualification: '',
        specialization: '',
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setCvFile(null);
      setCvFileName('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required';
    if (!form.email?.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone?.trim()) e.phone = 'Phone is required';
    else if (form.phone.replace(/\D/g, '').length < 10)
      e.phone = 'Must be 10 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Please select an image file',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Image must be less than 5MB',
        }));
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors((prev) => {
        const u = { ...prev };
        delete u.photo;
        return u;
      });
    }
  };

  const handleCVChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          cv: 'Please select PDF or Word document',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, cv: 'File must be less than 5MB' }));
        return;
      }
      setCvFile(file);
      setCvFileName(file.name);
      setErrors((prev) => {
        const u = { ...prev };
        delete u.cv;
        return u;
      });
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removeCV = () => {
    setCvFile(null);
    setCvFileName('');
    if (cvInputRef.current) cvInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('email', form.email.trim().toLowerCase());
    fd.append('phone', form.phone.replace(/\D/g, ''));
    if (form.address) fd.append('address', form.address);
    if (form.designation) fd.append('designation', form.designation);
    if (form.qualification) fd.append('qualification', form.qualification);
    if (form.specialization) fd.append('specialization', form.specialization);
    fd.append('status', form.status);
    fd.append('joinedDate', form.joinedDate);

    // Append photo if selected
    if (photoFile) {
      fd.append('profilePicture', photoFile);
    }

    // Append CV if selected
    if (cvFile) {
      fd.append('cv', cvFile);
    }

    onSubmit(fd);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const u = { ...prev };
        delete u[field];
        return u;
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border"
        style={{ borderColor: colors.primary[100] }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: colors.primary[100] }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: colors.primary[600] }}
          >
            {initialData ? 'Edit Faculty' : 'Add Faculty'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-50"
            disabled={loading}
          >
            <Icons.X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-medium mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2"
                    style={{ borderColor: colors.primary[200] }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                    style={{
                      backgroundColor: colors.primary[50],
                      borderColor: colors.primary[200],
                    }}
                  >
                    <Icons.User
                      size={32}
                      style={{ color: colors.primary[400] }}
                    />
                  </div>
                )}
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                    style={{
                      backgroundColor: colors.error.main,
                      color: 'white',
                    }}
                  >
                    <Icons.X size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photoInput"
                  disabled={loading}
                />
                <label
                  htmlFor="photoInput"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border"
                  style={{
                    borderColor: colors.primary[200],
                    color: colors.primary[600],
                  }}
                >
                  <Icons.Upload size={14} />{' '}
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.neutral[400] }}
                >
                  JPG, PNG. Max 5MB
                </p>
              </div>
            </div>
            {errors.photo && (
              <p className="text-xs text-red-500 mt-1">{errors.photo}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.name ? 'border-red-300 bg-red-50' : ''
                }`}
                placeholder="Enter full name"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.email ? 'border-red-300 bg-red-50' : ''
                }`}
                placeholder="email@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errors.phone ? 'border-red-300 bg-red-50' : ''
                }`}
                placeholder="10-digit mobile number"
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Joined Date
              </label>
              <input
                type="date"
                value={form.joinedDate}
                onChange={(e) => handleChange('joinedDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={2}
              placeholder="Residential address"
              disabled={loading}
            />
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Designation
              </label>
              <select
                value={form.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={loading}
              >
                <option value="">Select Designation</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Teaching Assistant">Teaching Assistant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Qualification
              </label>
              <input
                value={form.qualification}
                onChange={(e) => handleChange('qualification', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., PhD in CS"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Specialization
              </label>
              <input
                value={form.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g., AI, Database"
                disabled={loading}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-xs font-medium mb-2">
              CV / Resume
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCVChange}
                className="hidden"
                id="cvInput"
                disabled={loading}
              />
              <label
                htmlFor="cvInput"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border"
                style={{
                  borderColor: colors.primary[200],
                  color: colors.primary[600],
                }}
              >
                <Icons.FileText size={14} />{' '}
                {cvFileName ? 'Change CV' : 'Upload CV'}
              </label>
              {cvFileName && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    backgroundColor: colors.primary[50],
                    color: colors.primary[600],
                  }}
                >
                  <Icons.FileText size={14} />
                  <span className="truncate max-w-[200px]">{cvFileName}</span>
                  <button
                    type="button"
                    onClick={removeCV}
                    className="ml-1 hover:text-red-500"
                  >
                    <Icons.X size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: colors.neutral[400] }}>
              PDF, DOC, DOCX. Max 5MB
            </p>
            {errors.cv && (
              <p className="text-xs text-red-500 mt-1">{errors.cv}</p>
            )}
          </div>

          {/* Buttons */}
          <div
            className="flex gap-3 pt-2 border-t"
            style={{ borderColor: colors.primary[100] }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-xl text-sm"
              style={{ borderColor: colors.neutral[300] }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-white rounded-xl text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}
            >
              {loading ? (
                <>
                  <Icons.Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Save size={14} />
                  {initialData ? 'Update' : 'Create'} Faculty
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}