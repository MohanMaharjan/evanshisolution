// src/app/dashboard/profile/page.js

'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Home,
  ChevronRightIcon,
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Building2,
  BadgeCheck,
  Camera,
  Save,
  X,
  Upload,
  Loader2,
} from 'lucide-react';

// ==================== BADGE COMPONENT ====================
function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

// ==================== MAIN PROFILE COMPONENT ====================
export default function ProfilePage() {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const user = session?.user;
  const isLoading = status === 'loading';

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  // ==================== BREADCRUMBS ====================
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Profile Settings', href: '/dashboard/profile', icon: User },
  ];

  // ==================== HELPERS ====================
  const getInitials = useCallback((firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }, []);

  const getStatusVariant = (status) => {
    const map = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      SUSPENDED: 'danger',
    };
    return map[status] || 'default';
  };

  const getRoleVariant = (roleName) => {
    const map = {
      'System Administrator': 'danger',
      Administrator: 'purple',
      Coordinator: 'info',
      Counselor: 'teal',
      Librarian: 'indigo',
      Faculty: 'indigo',
      Student: 'default',
    };
    return map[roleName] || 'default';
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const getStrengthColor = (strength) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
    return colors[strength - 1] || 'bg-gray-300';
  };

  const getStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong'];
    return labels[strength - 1] || 'Very Weak';
  };

  // ==================== PROFILE EDIT HANDLERS ====================
  const handleEditStart = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    setProfileErrors({});
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setProfileData({ firstName: '', lastName: '', email: '' });
    setAvatarPreview(null);
    setAvatarFile(null);
    setProfileErrors({});
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (profileData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!profileData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (profileData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!profileData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 

const handleProfileSubmit = async (e) => {
  e.preventDefault();
  if (!validateProfileForm()) return;

  setSaving(true);

  try {
    const formData = new FormData();
    formData.append('firstName', profileData.firstName.trim());
    formData.append('lastName', profileData.lastName.trim());
    formData.append('email', profileData.email.trim());
    if (avatarFile) formData.append('avatar', avatarFile);

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update profile');
    }

    const data = await response.json();

    // Update session
    await updateSession({
      user: {
        ...session.user,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        name: `${data.user.firstName} ${data.user.lastName}`,
        avatar: data.user.avatar,
      },
    });

    toast.success('Profile updated successfully!');
    
    // Use router.replace for clean navigation without history
    router.replace('/dashboard/profile');
    
  } catch (error) {
    console.error('Profile update error:', error);
    toast.error(error.message || 'Failed to update profile');
    setSaving(false);
  }
};

  // ==================== PASSWORD HANDLERS ====================
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (field === 'newPassword') setPasswordStrength(checkPasswordStrength(value));
    if (passwordErrors[field]) setPasswordErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.newPassword = 'Password is too weak';
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (passwordData.currentPassword && passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to change password');
      }

      toast.success('Password changed successfully! Redirecting to login...');
      
      setTimeout(() => signOut({ callbackUrl: '/login' }), 1500);

    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setPasswordStrength(0);
  };

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4 px-4 lg:px-6">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />}
              <Link
                href={crumb.href}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-600 ${
                  index === breadcrumbs.length - 1 ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {crumb.icon && <crumb.icon className="w-3.5 h-3.5" />}
                <span>{crumb.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                <User className="w-3 h-3" />
                My Account
              </span>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleEditStart}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              <Camera className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ===== PROFILE INFO CARD ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleProfileSubmit}
                className="space-y-6"
              >
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white"
                      />
                    ) : user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Current"
                        className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                        {getInitials(profileData.firstName, profileData.lastName)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Photo
                    </button>
                    {(avatarPreview || user?.avatar) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => {
                        setProfileData((prev) => ({ ...prev, firstName: e.target.value }));
                        if (profileErrors.firstName) setProfileErrors((prev) => ({ ...prev, firstName: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
                        profileErrors.firstName
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter first name"
                    />
                    {profileErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{profileErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => {
                        setProfileData((prev) => ({ ...prev, lastName: e.target.value }));
                        if (profileErrors.lastName) setProfileErrors((prev) => ({ ...prev, lastName: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
                        profileErrors.lastName
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter last name"
                    />
                    {profileErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{profileErrors.lastName}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => {
                        setProfileData((prev) => ({ ...prev, email: e.target.value }));
                        if (profileErrors.email) setProfileErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
                        profileErrors.email
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter email address"
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{profileErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar Section */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {user?.avatar ? (
                        <img
                          key={user.avatar} // This forces React to re-mount the image when src changes
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white fallback-avatar ${
                          user?.avatar ? 'hidden' : 'flex'
                        }`}
                      >
                        {getInitials(user?.firstName, user?.lastName)}
                      </div>
                      <span
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                          user?.status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : user?.status === 'SUSPENDED'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={getRoleVariant(user?.role?.name)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user?.role?.name || 'No Role'}
                        </Badge>
                        <Badge variant={getStatusVariant(user?.status)}>
                          {user?.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {user?.status === 'SUSPENDED' && <XCircle className="w-3 h-3 mr-1" />}
                          {user?.status === 'INACTIVE' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {user?.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase font-medium">Email</p>
                          <p className="text-xs text-gray-900 truncate">{user?.email || '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase font-medium">Department</p>
                          <p className="text-xs text-gray-900 truncate">{user?.department?.name || '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase font-medium">Member Since</p>
                          <p className="text-xs text-gray-900">
                            {user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <BadgeCheck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase font-medium">Account ID</p>
                          <p className="text-xs text-gray-900 font-mono">{user?.id || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== PASSWORD CHANGE SECTION ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Password & Security</h3>
                <p className="text-xs text-gray-500">Update your password to keep your account secure</p>
              </div>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            )}
          </div>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <form onSubmit={handlePasswordSubmit} className="pt-4 border-t border-gray-100">
                  <div className="space-y-4 max-w-md">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className={`w-full px-3 py-2 pr-10 bg-gray-50 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
                            passwordErrors.currentPassword
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-indigo-500'
                          }`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className={`w-full px-3 py-2 pr-10 bg-gray-50 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
                            passwordErrors.newPassword
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-indigo-500'
                          }`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {passwordData.newPassword && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  level <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500">
                            Password strength:{' '}
                            <span className={`font-medium ${passwordStrength >= 3 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {getStrengthLabel(passwordStrength)}
                            </span>
                          </p>
                        </div>
                      )}

                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                      )}

                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-medium text-gray-500 mb-1">Requirements:</p>
                        {[
                          { label: 'At least 8 characters', met: passwordData.newPassword.length >= 8 },
                          { label: 'Uppercase & lowercase letters', met: /[a-z]/.test(passwordData.newPassword) && /[A-Z]/.test(passwordData.newPassword) },
                          { label: 'At least one number', met: /\d/.test(passwordData.newPassword) },
                          { label: 'At least one special character', met: /[^a-zA-Z\d]/.test(passwordData.newPassword) },
                        ].map((req, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            {req.met ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-300" />
                            )}
                            <span className={`text-[10px] ${req.met ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className={`w-full px-3 py-2 pr-10 bg-gray-50 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
                            passwordErrors.confirmPassword
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-indigo-500'
                          }`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Update Password
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordCancel}
                      disabled={changingPassword}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">Important</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        After changing your password, you will be automatically logged out and redirected to the sign-in page.
                      </p>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== SECURITY TIPS ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Security Tips</h3>
              <p className="text-xs text-gray-500">Best practices for a secure account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Strong Passwords', description: 'Use a mix of letters, numbers, and special characters', icon: Lock, color: 'indigo' },
              { title: 'Unique Passwords', description: 'Avoid reusing passwords from other accounts', icon: Shield, color: 'blue' },
              { title: 'Regular Updates', description: 'Change your password every 90 days', icon: CheckCircle2, color: 'emerald' },
            ].map((tip, index) => (
              <div key={index} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className={`w-8 h-8 rounded-lg bg-${tip.color}-50 flex items-center justify-center mb-3`}>
                  <tip.icon className={`w-4 h-4 text-${tip.color}-600`} />
                </div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">{tip.title}</h4>
                <p className="text-[11px] text-gray-500">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}