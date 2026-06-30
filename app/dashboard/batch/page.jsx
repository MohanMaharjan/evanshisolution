'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import BatchFormModal from '@/components/batch/BatchFormModal';
import StudentFormModal from '@/components/batch/StudentFormModal';

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

// ==================== SKELETON ====================
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ==================== LOADING SPINNER ====================
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Icons.Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}

// ==================== EMPTY STATE ====================
function EmptyState({ hasFilters, message }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Icons.Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="text-lg font-medium">{message || (hasFilters ? 'No batches match your filters' : 'No batches found')}</p>
      {hasFilters && <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>}
    </div>
  );
}

// ==================== ACCESS DENIED ====================
function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md p-8 bg-red-50 rounded-xl border border-red-200">
        <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2 text-red-600">Access Denied</h2>
        <p className="text-red-500">You don't have permission to view batches.</p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function Batches() {
  const { data: session } = useSession();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const hasReadPermission = can('batches', 'read');
  const hasCreatePermission = can('batches', 'create');
  const hasUpdatePermission = can('batches', 'update');
  const hasDeletePermission = can('batches', 'delete');

  // Data
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Pagination (batches only)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Batch modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Student modals
  const [showStudentsListModal, setShowStudentsListModal] = useState(false);
  const [showStudentFormModal, setShowStudentFormModal] = useState(false);
  const [showStudentDeleteConfirm, setShowStudentDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Toast
  const showMessage = useCallback((type, title, text) => {
    setMessage({ type, title, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Icons.Home },
    { label: 'Batch Management', href: '/dashboard/batches', icon: Icons.Layers },
  ];

  // ==================== FETCH BATCHES ====================
  const fetchBatches = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10', sortBy, sortOrder });
      if (search) params.append('search', search);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedDepartment !== 'all') params.append('departmentId', selectedDepartment);

      const res = await fetch(`/api/batches?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) { showMessage('error', 'Session Expired', 'Please login again'); return; }
        if (res.status === 403) { setError('access-denied'); return; }
        throw new Error(data.error || 'Failed to fetch batches');
      }

      setBatches(data.batches || []);
      setPagination({ currentPage: data.pagination.page || 1, totalPages: data.pagination.pages || 1, totalItems: data.pagination.total || 0, itemsPerPage: data.pagination.limit || 10 });
    } catch (err) {
      showMessage('error', 'Error', err.message);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus, selectedDepartment, sortBy, sortOrder, showMessage]);

  // ==================== FETCH DEPARTMENTS ====================
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments?limit=200&status=active');
      const data = await res.json();
      if (res.ok && data.departments) setDepartments(data.departments);
    } catch (err) { console.error('Failed to fetch departments:', err); }
  }, []);

  // ==================== FETCH BATCH STUDENTS (No Pagination) ====================
  const fetchBatchStudents = async (batchId, searchTerm = '') => {
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (searchTerm) params.append('search', searchTerm);
      const res = await fetch(`/api/batches/${batchId}/students?${params.toString()}`);
      const data = await res.json();
      if (res.ok) { setBatchStudents(data.students || []); }
      else { throw new Error(data.error || 'Failed to fetch students'); }
    } catch (err) {
      showMessage('error', 'Error', err.message);
      setBatchStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => { if (hasReadPermission) { fetchBatches(1); fetchDepartments(); } }, [hasReadPermission]);
  useEffect(() => {
    if (hasReadPermission) { const t = setTimeout(() => fetchBatches(1), 300); return () => clearTimeout(t); }
  }, [search, selectedStatus, selectedDepartment, sortBy, sortOrder]);

  // ==================== BATCH CRUD ====================
  const handleCreateBatch = async (formData) => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/batches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Created', 'Batch created successfully');
      setShowAddModal(false);
      fetchBatches(1);
    } catch (err) { showMessage('error', 'Error', err.message); }
    finally { setFormLoading(false); }
  };

  const handleUpdateBatch = async (formData) => {
    if (!selectedBatch) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/batches/${selectedBatch.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Updated', 'Batch updated successfully');
      setShowEditModal(false); setSelectedBatch(null);
      fetchBatches(pagination.currentPage);
    } catch (err) { showMessage('error', 'Error', err.message); }
    finally { setFormLoading(false); }
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;
    try {
      const res = await fetch(`/api/batches/${selectedBatch.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Deleted', 'Batch deleted successfully');
      setShowDeleteModal(false); setSelectedBatch(null);
      fetchBatches(1);
    } catch (err) { showMessage('error', 'Error', err.message); }
  };

  const handleToggleStatus = async (batch) => {
    try {
      const newStatus = batch.status === 'active' ? 'inactive' : batch.status === 'inactive' ? 'completed' : 'active';
      const res = await fetch(`/api/batches/${batch.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Updated', `Status changed to ${newStatus}`);
      fetchBatches(pagination.currentPage);
    } catch (err) { showMessage('error', 'Error', err.message); }
  };

  // ==================== STUDENT OPERATIONS ====================
  const handleViewStudents = (batch) => {
    setSelectedBatch(batch);
    setStudentSearch('');
    fetchBatchStudents(batch.id, '');
    setShowStudentsListModal(true);
  };

  const handleAddStudents = () => {
    setShowStudentsListModal(false);
    setShowStudentFormModal(true);
  };

  const handleStudentSaved = () => {
    fetchBatches(pagination.currentPage);
    if (selectedBatch) fetchBatchStudents(selectedBatch.id, studentSearch);
  };

  const handleRequestDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowStudentDeleteConfirm(true);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete || !selectedBatch) return;
    setDeletingStudent(true);
    try {
      const res = await fetch(`/api/batches/${selectedBatch.id}/students/${studentToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Removed', `${studentToDelete.name} removed from batch`);
      setShowStudentDeleteConfirm(false); setStudentToDelete(null);
      fetchBatchStudents(selectedBatch.id, studentSearch);
      fetchBatches(pagination.currentPage);
    } catch (err) { showMessage('error', 'Error', err.message); }
    finally { setDeletingStudent(false); }
  };

  const handleCancelDeleteStudent = () => {
    setShowStudentDeleteConfirm(false);
    setStudentToDelete(null);
  };

  // ==================== HELPERS ====================
  const getStatusStyle = (status) => {
    const s = {
      active: { bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200', label: 'Active', dot: 'bg-emerald-500' },
      inactive: { bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200', label: 'Inactive', dot: 'bg-amber-500' },
      completed: { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200', label: 'Completed', dot: 'bg-blue-500' },
    };
    return s[status] || s.inactive;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  // ==================== RENDER ====================
  if (permissionsLoading) return <div className="space-y-4 px-4 lg:px-6 animate-pulse"><Skeleton className="h-16 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!hasReadPermission) return <AccessDenied />;

  return (
    <div className="space-y-4 px-4 lg:px-6">
      {/* Header */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((c, i) => (
            <div key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <Icons.ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              <Link href={c.href} className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-600 ${i === breadcrumbs.length - 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                <c.icon className="w-3.5 h-3.5" /><span>{c.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Batch Management</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium mt-1">
              <Icons.Layers className="w-3 h-3" />Total: {pagination.totalItems}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchBatches(1)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-sm">
              <Icons.RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
            {hasCreatePermission && (
              <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
                <Icons.Plus className="w-3.5 h-3.5" />Add Batch
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search batches..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="completed">Completed</option>
          </select>
          <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [b, o] = e.target.value.split('-'); setSortBy(b); setSortOrder(o); }} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option value="createdAt-desc">Newest First</option><option value="createdAt-asc">Oldest First</option><option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border-l-4"
            style={{ backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', borderLeftColor: message.type === 'success' ? '#10b981' : '#ef4444' }}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <Icons.CheckCircle className="w-5 h-5 text-emerald-500" /> : <Icons.AlertCircle className="w-5 h-5 text-red-500" />}
              <div><span className="font-semibold text-sm block text-gray-900">{message.title}</span><p className="text-xs text-gray-600">{message.text}</p></div>
              <button onClick={() => setMessage(null)}><Icons.X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? <LoadingSpinner /> :
         error === 'access-denied' ? <div className="text-center py-12 text-gray-500"><Icons.Lock className="w-12 h-12 mx-auto mb-3 text-red-300" /><p className="text-lg font-medium text-red-600">Server denied access</p></div> :
         batches.length === 0 ? <EmptyState hasFilters={!!(search || selectedStatus !== 'all' || selectedDepartment !== 'all')} /> : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Batch</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Duration</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Department</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Students</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => {
                    const ss = getStatusStyle(batch.status);
                    const sc = batch._count?.students || 0;
                    return (
                      <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">{batch.name?.charAt(0) || 'B'}</div><p className="font-medium text-gray-900">{batch.name}</p></div></td>
                        <td className="px-4 py-4"><div className="text-xs"><p className="text-gray-600">{formatDate(batch.startDate)}</p><p className="text-gray-400">to {formatDate(batch.endDate)}</p></div></td>
                        <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{batch.departments?.slice(0, 2).map(d => <Badge key={d.id} variant="info">{d.code || d.name}</Badge>)}{batch.departments?.length > 2 && <Badge variant="default">+{batch.departments.length - 2}</Badge>}</div></td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => handleViewStudents(batch)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                            <Icons.Users className="w-3.5 h-3.5" />{sc} Students
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => handleToggleStatus(batch)} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${ss.bg} ${ss.color} ${ss.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ss.dot}`} />{ss.label}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedBatch(batch); setShowViewModal(true); }} className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors" title="View"><Icons.Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleViewStudents(batch)} className="p-2 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors" title="Students"><Icons.Users className="w-4 h-4" /></button>
                            {hasUpdatePermission && <button onClick={() => { setSelectedBatch(batch); setShowEditModal(true); }} className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors" title="Edit"><Icons.Edit className="w-4 h-4" /></button>}
                            {hasDeletePermission && <button onClick={() => { setSelectedBatch(batch); setShowDeleteModal(true); }} disabled={sc > 0} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={sc > 0 ? 'Remove students first' : 'Delete'}><Icons.Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {batches.map(batch => {
                const ss = getStatusStyle(batch.status);
                const sc = batch._count?.students || 0;
                return (
                  <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm">{batch.name?.charAt(0) || 'B'}</div>
                      <div className="flex-1 min-w-0"><h3 className="font-semibold text-gray-900 truncate">{batch.name}</h3><div className="flex flex-wrap gap-1 mt-1">{batch.departments?.map(d => <Badge key={d.id} variant="info">{d.code || d.name}</Badge>)}</div></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-700">{formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Students</span><button onClick={() => handleViewStudents(batch)} className="font-semibold text-blue-600">{sc}</button></div>
                      <div className="flex justify-between"><span className="text-gray-500">Status</span><button onClick={() => handleToggleStatus(batch)} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ss.bg} ${ss.color} ${ss.border}`}><span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ss.dot}`} />{ss.label}</button></div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button onClick={() => { setSelectedBatch(batch); setShowViewModal(true); }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"><Icons.Eye className="w-4 h-4 inline mr-1" />View</button>
                      <button onClick={() => handleViewStudents(batch)} className="flex-1 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"><Icons.Users className="w-4 h-4 inline mr-1" />Students</button>
                      {hasUpdatePermission && <button onClick={() => { setSelectedBatch(batch); setShowEditModal(true); }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"><Icons.Edit className="w-4 h-4 inline mr-1" />Edit</button>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Batch Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-t border-gray-200">
                <span className="text-xs text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => fetchBatches(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                  <button onClick={() => fetchBatches(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== BATCH MODALS ===== */}
      <BatchFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleCreateBatch} initialData={null} loading={formLoading} departments={departments} />
      <BatchFormModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedBatch(null); }} onSubmit={handleUpdateBatch} initialData={selectedBatch} loading={formLoading} departments={departments} />

      {/* View Batch Modal */}
      {showViewModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900">Batch Details</h3><button onClick={() => setShowViewModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><Icons.X className="w-5 h-5 text-gray-500" /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-500">Name</label><p className="font-semibold text-gray-900">{selectedBatch.name}</p></div>
                <div><label className="text-xs font-medium text-gray-500">Status</label><Badge variant={selectedBatch.status === 'active' ? 'success' : 'warning'}>{selectedBatch.status}</Badge></div>
                <div><label className="text-xs font-medium text-gray-500">Start Date</label><p className="text-gray-900">{formatDate(selectedBatch.startDate)}</p></div>
                <div><label className="text-xs font-medium text-gray-500">End Date</label><p className="text-gray-900">{formatDate(selectedBatch.endDate)}</p></div>
              </div>
              {selectedBatch.departments?.length > 0 && <div><label className="text-xs font-medium text-gray-500">Departments</label><div className="flex flex-wrap gap-1 mt-1">{selectedBatch.departments.map(d => <Badge key={d.id} variant="info">{d.name}</Badge>)}</div></div>}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center p-3 rounded-xl bg-blue-50"><p className="text-2xl font-bold text-blue-600">{selectedBatch._count?.students || 0}</p><p className="text-xs text-gray-500">Students</p></div>
                <div className="text-center p-3 rounded-xl bg-teal-50"><p className="text-2xl font-bold text-teal-600">{selectedBatch._count?.departments || 0}</p><p className="text-xs text-gray-500">Departments</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Batch Modal */}
      {showDeleteModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center"><Icons.AlertTriangle className="w-6 h-6 text-red-600" /></div><div><h3 className="text-lg font-bold text-gray-900">Delete Batch</h3><p className="text-sm text-gray-500">This action cannot be undone</p></div></div>
            <p className="mb-4 text-sm text-gray-700">Are you sure you want to delete <strong>{selectedBatch.name}</strong>?</p>
            <div className="flex gap-3 justify-end"><button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button><button onClick={handleDeleteBatch} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">Delete Batch</button></div>
          </div>
        </div>
      )}

      {/* ===== STUDENTS LIST MODAL (Scroll, No Pagination) ===== */}
      {showStudentsListModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowStudentsListModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div><h3 className="text-lg font-bold text-gray-900">Students - {selectedBatch.name}</h3><p className="text-xs text-gray-500">{batchStudents.length} student(s) in this batch</p></div>
              <button onClick={() => setShowStudentsListModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><Icons.X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <div className="relative flex-1">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Search students..." value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); fetchBatchStudents(selectedBatch.id, e.target.value); }}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <button onClick={handleAddStudents} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                <Icons.UserPlus className="w-3.5 h-3.5" />Add Students
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingStudents ? <LoadingSpinner /> :
               batchStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icons.Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">{studentSearch ? 'No students match your search' : 'No students in this batch'}</p>
                  {!studentSearch && <button onClick={handleAddStudents} className="mt-3 text-blue-600 text-sm font-medium hover:underline">Add students now</button>}
                </div>
              ) : (
                <div className="space-y-2">
                  {batchStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{student.name?.charAt(0) || 'S'}</div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{student.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            {student.email && <span>{student.email}</span>}
                            {student.enrollmentNo && <span>• {student.enrollmentNo}</span>}
                            {student.rollNo && <span>• Roll: {student.rollNo}</span>}
                            {student.phone && <span>• {student.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.department && <Badge variant="info">{student.department.code || student.department.name}</Badge>}
                        <Badge variant={student.status === 'active' ? 'success' : 'warning'}>{student.status}</Badge>
                        <button onClick={() => handleRequestDeleteStudent(student)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Remove from batch"><Icons.UserMinus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-xl">
              <span className="text-xs text-gray-500">{batchStudents.length} student(s){studentSearch && ' found'}</span>
              <button onClick={() => setShowStudentsListModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STUDENT DELETE CONFIRMATION ===== */}
      {showStudentDeleteConfirm && studentToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelDeleteStudent} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center"><Icons.AlertTriangle className="w-6 h-6 text-red-600" /></div><div><h3 className="text-lg font-bold text-gray-900">Remove Student</h3><p className="text-sm text-gray-500">This will remove the student from this batch</p></div></div>
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{studentToDelete.name?.charAt(0) || 'S'}</div>
                <div><p className="font-semibold text-sm text-gray-900">{studentToDelete.name}</p><div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">{studentToDelete.email && <span>{studentToDelete.email}</span>}{studentToDelete.rollNo && <span>• {studentToDelete.rollNo}</span>}{studentToDelete.enrollmentNo && <span>• {studentToDelete.enrollmentNo}</span>}</div></div>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-700">Are you sure you want to remove <strong>{studentToDelete.name}</strong> from batch <strong>{selectedBatch?.name}</strong>?<span className="block mt-2 text-amber-600 text-xs">The student record will not be deleted, only unlinked from this batch.</span></p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCancelDeleteStudent} disabled={deletingStudent} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleConfirmDeleteStudent} disabled={deletingStudent} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {deletingStudent ? <><Icons.Loader2 className="w-4 h-4 animate-spin" />Removing...</> : <><Icons.UserMinus className="w-4 h-4" />Remove Student</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== STUDENT FORM MODAL ===== */}
      {showStudentFormModal && selectedBatch && (
        <StudentFormModal
          isOpen={showStudentFormModal}
          onClose={() => { setShowStudentFormModal(false); if (selectedBatch) { setShowStudentsListModal(true); fetchBatchStudents(selectedBatch.id, studentSearch); } }}
          batchId={selectedBatch.id}
          batchName={selectedBatch.name}
          batchDepartments={selectedBatch.departments || []}
          onSaved={handleStudentSaved}
          showMessage={showMessage}
        />
      )}
    </div>
  );
}