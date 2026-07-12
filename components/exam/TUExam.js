'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import TUExamFormModal from './TUExamFormModal';

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
    sky: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

// ==================== MAIN COMPONENT ====================
export default function TUExam() {
  const { can } = usePermissions();

  const hasReadPermission = can('tu_exam', 'read') || can('exams', 'read');
  const hasCreatePermission = can('tu_exam', 'create') || can('exams', 'create');
  const hasUpdatePermission = can('tu_exam', 'update') || can('exams', 'update');
  const hasDeletePermission = can('tu_exam', 'delete') || can('exams', 'delete');

  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const initialLoadDone = useRef(false);

  const showMessage = useCallback((type, title, text) => {
    setMessage({ type, title, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // ==================== FETCH ====================
  const fetchExams = useCallback(
    async (page = 1, isRefresh = false) => {
      if (!isRefresh) setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          type: 'tu',
        });
        if (search) params.append('search', search);
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (filterSemester !== 'all') params.append('semester', filterSemester);
        if (filterYear !== 'all') params.append('year', filterYear);

        const response = await fetch(`/api/exams?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch TU exams');
        const data = await response.json();

        setExams(data.exams || []);

        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.page || 1,
            totalPages: data.pagination.pages || 1,
            totalItems: data.pagination.total || 0,
            itemsPerPage: data.pagination.limit || 10,
          });
        } else {
          setPagination({
            currentPage: page,
            totalPages: Math.ceil((data.exams?.length || 0) / 10) || 1,
            totalItems: data.exams?.length || 0,
            itemsPerPage: 10,
          });
        }
      } catch (error) {
        console.error('Fetch error:', error);
        showMessage('error', 'Error', error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [search, filterStatus, filterSemester, filterYear, showMessage]
  );

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchExams(1);
    }
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) {
      const timer = setTimeout(() => fetchExams(1), 300);
      return () => clearTimeout(timer);
    }
  }, [search, filterStatus, filterSemester, filterYear]);

  // ==================== CRUD ====================
  const handleCreate = useCallback(
    async (formData) => {
      try {
        const response = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, examCategory: 'tu' }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create TU exam');
        }
        showMessage('success', 'Created', 'TU exam created successfully');
        setShowAddModal(false);
        await fetchExams(1);
      } catch (error) {
        showMessage('error', 'Error', error.message);
      }
    },
    [fetchExams, showMessage]
  );

  const handleUpdate = useCallback(
    async (formData) => {
      if (!selectedExam) return;
      try {
        const response = await fetch(`/api/exams/${selectedExam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update TU exam');
        }
        showMessage('success', 'Updated', 'TU exam updated successfully');
        setShowEditModal(false);
        setSelectedExam(null);
        await fetchExams(1);
      } catch (error) {
        showMessage('error', 'Error', error.message);
      }
    },
    [selectedExam, fetchExams, showMessage]
  );

  const handleDelete = async () => {
    if (!selectedExam) return;
    try {
      const response = await fetch(`/api/exams/${selectedExam.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete exam');
      }
      showMessage('success', 'Deleted', 'TU exam deleted successfully');
      setShowDeleteModal(false);
      setSelectedExam(null);
      await fetchExams(1);
    } catch (error) {
      showMessage('error', 'Error', error.message);
    }
  };

  const handleToggleStatus = async (exam) => {
    try {
      const newStatus = exam.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
      showMessage('success', 'Updated', `Status changed to ${newStatus}`);
      await fetchExams(1);
    } catch (error) {
      showMessage('error', 'Error', error.message);
    }
  };

  // ==================== HELPERS ====================
  const getStatusStyle = (status) => {
    const styles = {
      active: { bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
      inactive: { bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200', label: 'Inactive' },
      completed: { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200', label: 'Completed' },
      cancelled: { bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', label: 'Cancelled' },
      scheduled: { bg: 'bg-purple-50', color: 'text-purple-700', border: 'border-purple-200', label: 'Scheduled' },
    };
    return styles[status] || styles.inactive;
  };

  const getSemesterLabel = (sem) => {
    if (!sem) return 'N/A';
    const labels = {
      semester1: 'Sem 1', semester2: 'Sem 2', semester3: 'Sem 3', semester4: 'Sem 4',
      semester5: 'Sem 5', semester6: 'Sem 6', semester7: 'Sem 7', semester8: 'Sem 8',
    };
    return labels[sem] || sem;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getExamSymbolStyle = (symbol) => {
    const styles = {
      regular: { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200', label: 'Regular' },
      back: { bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200', label: 'Back' },
      reexam: { bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', label: 'Re-Exam' },
      improvement: { bg: 'bg-purple-50', color: 'text-purple-700', border: 'border-purple-200', label: 'Improvement' },
      special: { bg: 'bg-teal-50', color: 'text-teal-700', border: 'border-teal-200', label: 'Special' },
    };
    return styles[symbol] || { bg: 'bg-gray-100', color: 'text-gray-700', border: 'border-gray-200', label: symbol || 'N/A' };
  };

  // ==================== RENDER ====================
  if (!hasReadPermission) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-xl border border-red-200">
          <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-600">Access Denied</h2>
          <p className="text-red-500">You don't have permission to view TU exams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===== MESSAGE TOAST ===== */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border-l-4"
            style={{
              backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              borderLeftColor: message.type === 'success' ? '#10b981' : '#ef4444',
            }}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <Icons.AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <span className="font-semibold text-sm block text-gray-900">{message.title}</span>
                <p className="text-xs text-gray-600">{message.text}</p>
              </div>
              <button onClick={() => setMessage(null)}>
                <Icons.X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TOOLBAR ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Icons.GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">TU Examinations</h2>
              <span className="text-[11px] text-gray-500">{pagination.totalItems} exam(s) found</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchExams(1, true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-sm"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            {hasCreatePermission && (
              <button
                onClick={() => { setSelectedExam(null); setShowAddModal(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
                Add TU Exam
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search TU exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={`semester${s}`}>Semester {s}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="all">All Years</option>
            {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading && exams.length === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3 bg-gray-200" />
                  <div className="h-3 rounded w-1/2 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Exam</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Symbol</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Semester</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Year</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Schedule</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Full/Pass</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">
                        <Icons.GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No TU exams found</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first TU exam</p>
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => {
                      const ss = getStatusStyle(exam.status);
                      const sym = getExamSymbolStyle(exam.examSymbol);
                      return (
                        <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                                <Icons.GraduationCap className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{exam.name || 'N/A'}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {exam.course?.name || exam.courseCode || 'No course'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sym.bg} ${sym.color} ${sym.border}`}>
                              {sym.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {getSemesterLabel(exam.semester)}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-700">
                            {exam.examYear || 'N/A'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Icons.Calendar className="w-3 h-3 text-gray-400" />
                                {formatDate(exam.startDate)}
                              </div>
                              {exam.endDate && exam.endDate !== exam.startDate && (
                                <div className="flex items-center gap-1">
                                  <Icons.Calendar className="w-3 h-3 text-gray-400" />
                                  {formatDate(exam.endDate)}
                                </div>
                              )}
                              {exam.startTime && (
                                <div className="flex items-center gap-1">
                                  <Icons.Clock className="w-3 h-3 text-gray-400" />
                                  {exam.startTime}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold text-gray-700">{exam.fullMarks || '-'}</div>
                              <div className="text-gray-500">Pass: {exam.passMarks || '-'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(exam)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${ss.bg} ${ss.color} ${ss.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                exam.status === 'active' ? 'bg-emerald-500' :
                                exam.status === 'completed' ? 'bg-blue-500' :
                                exam.status === 'scheduled' ? 'bg-purple-500' :
                                exam.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                              }`} />
                              {ss.label}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setSelectedExam(exam); setShowViewModal(true); }} className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors" title="View">
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              {hasUpdatePermission && (
                                <button onClick={() => { setSelectedExam(exam); setShowEditModal(true); }} className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
                                  <Icons.Edit className="w-4 h-4" />
                                </button>
                              )}
                              {hasDeletePermission && (
                                <button onClick={() => { setSelectedExam(exam); setShowDeleteModal(true); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                                  <Icons.Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {exams.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icons.GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No TU exams found</p>
                </div>
              ) : (
                exams.map((exam) => {
                  const ss = getStatusStyle(exam.status);
                  const sym = getExamSymbolStyle(exam.examSymbol);
                  return (
                    <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                          <Icons.GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{exam.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sym.bg} ${sym.color} ${sym.border}`}>
                            {sym.label}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Course</span>
                          <span className="text-gray-700 truncate ml-2">{exam.course?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Semester</span>
                          <span className="text-gray-700">{getSemesterLabel(exam.semester)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Year</span>
                          <span className="text-gray-700 font-medium">{exam.examYear || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="text-gray-700">{formatDate(exam.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Marks</span>
                          <span className="font-semibold">{exam.fullMarks || '-'} / {exam.passMarks || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Status</span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ss.bg} ${ss.color} ${ss.border}`}>
                            {ss.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button onClick={() => { setSelectedExam(exam); setShowViewModal(true); }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                          <Icons.Eye className="w-4 h-4 inline mr-1" /> View
                        </button>
                        {hasUpdatePermission && (
                          <button onClick={() => { setSelectedExam(exam); setShowEditModal(true); }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                            <Icons.Edit className="w-4 h-4 inline mr-1" /> Edit
                          </button>
                        )}
                        {hasDeletePermission && (
                          <button onClick={() => { setSelectedExam(exam); setShowDeleteModal(true); }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                            <Icons.Trash2 className="w-4 h-4 inline mr-1" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {pagination.totalItems > 0 && pagination.totalPages > 1 && (
              <div className="px-4 py-3 flex justify-between items-center bg-gray-50 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} exams)
                </span>
                <div className="flex gap-2">
                  <button onClick={() => fetchExams(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Previous
                  </button>
                  <button onClick={() => fetchExams(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== FORM MODALS ===== */}
      <TUExamFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
        initialData={null}
        loading={false}
      />
      <TUExamFormModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedExam(null); }}
        onSubmit={handleUpdate}
        initialData={selectedExam}
        loading={false}
      />

      {/* ===== VIEW MODAL ===== */}
      {showViewModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">TU Exam Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <Icons.X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <h4 className="font-bold text-purple-900">{selectedExam.name}</h4>
                <p className="text-sm text-purple-600 mt-1">{selectedExam.course?.name || 'No course assigned'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Exam Symbol</label>
                  <p className="font-medium text-gray-900">{getExamSymbolStyle(selectedExam.examSymbol).label}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Semester</label>
                  <p className="font-medium text-gray-900">{getSemesterLabel(selectedExam.semester)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Exam Year</label>
                  <p className="font-medium text-gray-900">{selectedExam.examYear || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Batch</label>
                  <p className="font-medium text-gray-900">{selectedExam.batch?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Start Date</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedExam.startDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">End Date</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedExam.endDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Start Time</label>
                  <p className="font-medium text-gray-900">{selectedExam.startTime || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Duration</label>
                  <p className="font-medium text-gray-900">{selectedExam.duration ? `${selectedExam.duration} mins` : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Full Marks</label>
                  <p className="font-bold text-gray-900">{selectedExam.fullMarks || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Pass Marks</label>
                  <p className="font-bold text-gray-900">{selectedExam.passMarks || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <Badge variant={selectedExam.status === 'active' ? 'success' : selectedExam.status === 'completed' ? 'info' : selectedExam.status === 'scheduled' ? 'purple' : 'warning'}>
                    {getStatusStyle(selectedExam.status).label}
                  </Badge>
                </div>
                {selectedExam.tuExamCode && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">TU Exam Code</label>
                    <p className="font-mono text-sm text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block">{selectedExam.tuExamCode}</p>
                  </div>
                )}
                {selectedExam.description && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-700 mt-1">{selectedExam.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Icons.AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete TU Exam</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-700">
              Delete <strong>{selectedExam.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}