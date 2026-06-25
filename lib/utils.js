// lib/utils.js

/**
 * Format a date to a readable string
 */
export function formatDateTime(date) {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffInMs = now - dateObj;
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);
  
  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date to a simple date string
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to a time string
 */
export function formatTime(date) {
  if (!date) return 'N/A';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get initials from a name
 */
export function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?';
  const first = firstName || '';
  const last = lastName || '';
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
}

/**
 * Get status color class
 */
export function getStatusColor(status) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get role badge color
 */
export function getRoleColor(role) {
  switch (role) {
    case 'SYSTEM_ADMIN':
      return 'bg-purple-100 text-purple-800';
    case 'ADMIN':
      return 'bg-blue-100 text-blue-800';
    case 'COORDINATOR':
      return 'bg-indigo-100 text-indigo-800';
    case 'FACULTY':
      return 'bg-teal-100 text-teal-800';
    case 'STUDENT':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get color class for user level badge
 */
export function getUserLevelColor(level) {
  switch (level) {
    case 'SYSTEM_ADMIN':
      return 'bg-red-100 text-red-800';
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800';
    case 'COORDINATOR':
      return 'bg-blue-100 text-blue-800';
    case 'COUNSELOR':
      return 'bg-green-100 text-green-800';
    case 'LIBRARIAN':
      return 'bg-yellow-100 text-yellow-800';
    case 'FACULTY':
      return 'bg-indigo-100 text-indigo-800';
    case 'STUDENT':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get display label for user level
 */
export function getUserLevelLabel(level) {
  const labels = {
    SYSTEM_ADMIN: 'System Admin',
    ADMIN: 'Administrator',
    COORDINATOR: 'Coordinator',
    COUNSELOR: 'Counselor',
    LIBRARIAN: 'Librarian',
    FACULTY: 'Faculty',
    STUDENT: 'Student',
  };
  return labels[level] || level;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Generate a random color
 */
export function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}