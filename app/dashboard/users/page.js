// app/dashboard/users/page.js

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  UserPlus,
  X,
  Home,
  ChevronRightIcon,
  Users,
  RefreshCw,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import UserForm from '@/components/users/UserForm';

// ==================== MODAL COMPONENT ====================
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${sizeClasses[size] || 'max-w-lg'} bg-white rounded-2xl shadow-2xl overflow-hidden`}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="px-5 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant] || variants.default}`}
    >
      {children}
    </span>
  );
}

// ==================== TABLE COMPONENT ====================
function Table({ columns, data, isLoading, emptyMessage = 'No users found', onRowClick }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <UserPlus className="w-12 h-12 mb-3 stroke-1" />
        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50/95 backdrop-blur-sm">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.03 }}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-blue-50/30 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-5 py-3 whitespace-nowrap text-xs">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================
export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ roleId: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  // ==================== FETCH META DATA ====================
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [rolesRes, deptsRes] = await Promise.all([
          fetch('/api/roles'),
          fetch('/api/departments'),
        ]);

        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data.roles || []);
        }
        if (deptsRes.ok) {
          const data = await deptsRes.json();
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Failed to fetch meta:', error);
      }
    };
    fetchMeta();
  }, []);

  // ==================== FETCH USERS ====================
  const fetchUsers = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          search,
        });

        if (filters.roleId && filters.roleId !== '') {
          params.append('roleId', filters.roleId);
        }
        if (filters.status && filters.status !== '') {
          params.append('status', filters.status);
        }

        const response = await fetch(`/api/users?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setUsers(data.users || []);
        setPagination(
          data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
        );
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error(`Failed to load users: ${error.message}`);
        setUsers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.page, pagination.limit, search, filters]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ==================== HANDLERS ====================
  const handleRefresh = () => fetchUsers(true);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/users/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      toast.success('User deleted successfully');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData, // FormData for file upload
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user');
      }

      const data = await response.json();
      toast.success(data.message || 'User saved successfully');
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error(error.message || 'Failed to save user');
    }
  };

  // ==================== HELPERS ====================
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

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // ==================== TABLE COLUMNS ====================
  const columns = [
    {
      header: 'User',
      render: (user) => (
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-semibold shadow-sm">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                user.status === 'ACTIVE'
                  ? 'bg-emerald-500'
                  : user.status === 'SUSPENDED'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (user) => (
        <Badge variant={getRoleVariant(user.role?.name)}>
          {user.role?.name || 'No Role'}
        </Badge>
      ),
    },
    {
      header: 'Department',
      render: (user) => (
        <span className="text-xs text-gray-600">
          {user.department?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (user) => (
        <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
      ),
    },
    {
      header: 'Joined',
      render: (user) => (
        <span className="text-xs text-gray-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (user) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionMenu(actionMenu === user.id ? null : user.id);
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {actionMenu === user.id && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingUser(user);
                  setShowForm(true);
                  setActionMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Edit User
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(user);
                  setActionMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // ==================== BREADCRUMBS ====================
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'User Management', href: '/dashboard/users', icon: Users },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-4 px-4 lg:px-6">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
              )}
              <Link
                href={crumb.href}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-600 ${
                  index === breadcrumbs.length - 1
                    ? 'text-blue-600'
                    : 'text-gray-500'
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
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                <Users className="w-3 h-3" />
                {pagination.total} Total
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {users.filter((u) => u.status === 'ACTIVE').length} Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* ===== SEARCH & FILTERS ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                showFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Role
                  </label>
                  <select
                    value={filters.roleId}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, roleId: e.target.value }));
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, status: e.target.value }));
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({ roleId: '', status: '' });
                      setSearch('');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={users} isLoading={loading} />
      </div>

      {/* ===== PAGINATION ===== */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 py-3 px-6">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
            users)
          </p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from(
              { length: Math.min(pagination.totalPages, 5) },
              (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 rounded-md text-xs font-medium ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== CREATE/EDIT USER MODAL ===== */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="lg"
      >
        <UserForm
          user={editingUser}
          roles={roles}
          departments={departments}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 p-2.5 bg-red-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-800">
                Confirm Deletion
              </p>
              <p className="text-[11px] text-red-600">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Delete <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}