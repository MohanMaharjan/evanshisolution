'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import DepartmentFormModal from '@/components/department/DepartmentFormModal';
import CourseFormModal from '@/components/department/CourseFormModal';

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

// ==================== MAIN COMPONENT ====================
export default function Departments() {
  const { data: session } = useSession();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const hasReadPermission = can('departments', 'read');
  const hasCreatePermission = can('departments', 'create');
  const hasUpdatePermission = can('departments', 'update');
  const hasDeletePermission = can('departments', 'delete');
  const hasCourseReadPermission = can('courses', 'read');
  const hasCourseCreatePermission = can('courses', 'create');
  const hasCourseUpdatePermission = can('courses', 'update');
  const hasCourseDeletePermission = can('courses', 'delete');

  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourseFormModal, setShowCourseFormModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterCourseType, setFilterCourseType] = useState('all');
  const [filterNonCredit, setFilterNonCredit] = useState('all');

  // Track if initial load is done
  const initialLoadDone = useRef(false);

  const showMessage = useCallback((type, title, text) => {
    setMessage({ type, title, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // ==================== BREADCRUMBS ====================
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Icons.Home },
    { label: 'Department Management', href: '/dashboard/departments', icon: Icons.Building2 },
  ];

  // ==================== FETCH FUNCTIONS ====================
  const fetchDepartments = useCallback(
    async (page = 1, isRefresh = false) => {
      if (!isRefresh) setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        });
        if (search) params.append('search', search);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        
        const response = await fetch(`/api/departments?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        
        console.log('API Response:', data); // Debug log
        
        // FIXED: Properly handle pagination data
        const departmentsWithCounts = (data.departments || []).map(dept => ({
          ...dept,
          _count: {
            users: dept._count?.users || 0,
            courses: dept._count?.courses || 0,
            preadmissions: dept._count?.preadmissions || 0,
          }
        }));
        
        setDepartments(departmentsWithCounts);
        
        // FIXED: Use the pagination data from API response
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.page || data.pagination.currentPage || 1,
            totalPages: data.pagination.pages || data.pagination.totalPages || 1,
            totalItems: data.pagination.total || data.pagination.totalItems || 0,
            itemsPerPage: data.pagination.limit || data.pagination.itemsPerPage || 10,
          });
        } else {
          // Fallback: calculate from data
          setPagination({
            currentPage: page,
            totalPages: Math.ceil((data.departments?.length || 0) / 10) || 1,
            totalItems: data.departments?.length || 0,
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
    [search, selectedStatus, showMessage]
  );

  const fetchAllDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments?limit=200&status=all');
      const data = await res.json();
      if (res.ok && data.departments) {
        setAllDepartments(data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch all departments:', err);
    }
  }, []);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchDepartments(1);
      fetchAllDepartments();
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (initialLoadDone.current) {
      const timer = setTimeout(() => fetchDepartments(1), 300);
      return () => clearTimeout(timer);
    }
  }, [search, selectedStatus]);

  // ==================== COURSE FUNCTIONS ====================
  const fetchCourses = async (deptId) => {
    setLoadingCourses(true);
    try {
      const params = new URLSearchParams({ departmentId: deptId.toString() });
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err) {
      showMessage('error', 'Error', err.message);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCoursesClick = (department) => {
    setSelectedDepartment(department);
    setCourseSearch('');
    setFilterSemester('all');
    setFilterCourseType('all');
    setFilterNonCredit('all');
    fetchCourses(department.id);
    setShowCoursesModal(true);
  };

  // ==================== DEPARTMENT CRUD ====================
  const handleCreateDepartment = useCallback(
    async (formData) => {
      try {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed');
        }
        showMessage('success', 'Created', 'Department created successfully');
        setShowAddModal(false);
        await fetchDepartments(1);
        await fetchAllDepartments();
      } catch (error) {
        showMessage('error', 'Error', error.message);
      }
    },
    [fetchDepartments, fetchAllDepartments, showMessage]
  );

  const handleUpdateDepartment = useCallback(
    async (formData) => {
      if (!selectedDepartment) return;
      try {
        const response = await fetch(
          `/api/departments/${selectedDepartment.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed');
        }
        showMessage('success', 'Updated', 'Department updated successfully');
        setShowEditModal(false);
        setSelectedDepartment(null);
        await fetchDepartments(1);
        await fetchAllDepartments();
      } catch (error) {
        showMessage('error', 'Error', error.message);
      }
    },
    [selectedDepartment, fetchDepartments, fetchAllDepartments, showMessage]
  );

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    try {
      const response = await fetch(
        `/api/departments/${selectedDepartment.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed');
      }
      showMessage('success', 'Deleted', 'Department deleted successfully');
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      await fetchDepartments(1);
      await fetchAllDepartments();
    } catch (error) {
      showMessage('error', 'Error', error.message);
    }
  };

  const handleToggleStatus = async (department) => {
    try {
      const newStatus = department.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`/api/departments/${department.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to update status');
      }
      
      showMessage('success', 'Updated', `Status changed to ${newStatus}`);
      await fetchDepartments(1);
      await fetchAllDepartments();
    } catch (error) {
      console.error('Toggle status error:', error);
      showMessage('error', 'Error', error.message || 'Failed to update status');
    }
  };

  // ==================== COURSE CRUD ====================
  const handleSaveCourse = async (data) => {
    setFormLoading(true);
    try {
      if (data.isCourseImport) {
        const courseList = data.courses || [];
        let success = 0, failed = 0;
        for (const course of courseList) {
          try {
            const res = await fetch('/api/courses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(course),
            });
            if (res.ok) success++;
            else failed++;
          } catch {
            failed++;
          }
        }
        showMessage(
          'success',
          'Import Complete',
          `${success} imported${failed > 0 ? `, ${failed} failed` : ''}`
        );
      } else {
        const url = selectedCourse
          ? `/api/courses/${selectedCourse.id}`
          : '/api/courses';
        const method = selectedCourse ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed');
        }
        showMessage(
          'success',
          selectedCourse ? 'Updated' : 'Created',
          'Course saved successfully'
        );
      }
      setShowCourseFormModal(false);
      setSelectedCourse(null);
      if (selectedDepartment) {
        await fetchCourses(selectedDepartment.id);
      }
      await fetchDepartments(1);
    } catch (err) {
      showMessage('error', 'Error', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    try {
      const res = await fetch(`/api/courses/${deletingCourse.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed');
      }
      showMessage('success', 'Deleted', 'Course deleted successfully');
      setShowDeleteCourseModal(false);
      setDeletingCourse(null);
      if (selectedDepartment) {
        await fetchCourses(selectedDepartment.id);
      }
      await fetchDepartments(1);
    } catch (err) {
      showMessage('error', 'Error', err.message);
    }
  };

  // ==================== HELPERS ====================
  const getStatusStyle = (status) => {
    const styles = {
      active: {
        bg: 'bg-emerald-50',
        color: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Active',
      },
      inactive: {
        bg: 'bg-amber-50',
        color: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Inactive',
      },
      archived: {
        bg: 'bg-gray-100',
        color: 'text-gray-600',
        border: 'border-gray-200',
        label: 'Archived',
      },
    };
    return styles[status] || styles.inactive;
  };

  const getSemesterLabel = (sem) => {
    const labels = {
      semester1: 'Sem 1',
      semester2: 'Sem 2',
      semester3: 'Sem 3',
      semester4: 'Sem 4',
      semester5: 'Sem 5',
      semester6: 'Sem 6',
      semester7: 'Sem 7',
      semester8: 'Sem 8',
    };
    return labels[sem] || sem;
  };

  const getSemesterNumber = (s) => {
    if (!s) return null;
    const match = String(s).match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };
  
  const getCourseTypeStyle = (type) =>
    type === 'core'
      ? { bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200' }
      : { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200' };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (courseSearch) {
        const s = courseSearch.toLowerCase();
        if (
          !c.name?.toLowerCase().includes(s) &&
          !c.code?.toLowerCase().includes(s)
        )
          return false;
      }
      if (filterSemester !== 'all') {
        if (getSemesterNumber(c.semester) !== getSemesterNumber(filterSemester))
          return false;
      }
      if (filterCourseType !== 'all' && c.courseType !== filterCourseType)
        return false;
      if (filterNonCredit === 'yes' && !c.noncredit) return false;
      if (filterNonCredit === 'no' && c.noncredit) return false;
      return true;
    });
  }, [
    courses,
    courseSearch,
    filterSemester,
    filterCourseType,
    filterNonCredit,
  ]);

  // ==================== LOADING STATES ====================
  if (permissionsLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }
    
  if (!hasReadPermission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-xl border border-red-200">
          <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-600">Access Denied</h2>
          <p className="text-red-500">You don't have permission to view departments.</p>
        </div>
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
              {index > 0 && <Icons.ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              <Link
                href={crumb.href}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-600 ${
                  index === breadcrumbs.length - 1 ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <crumb.icon className="w-3.5 h-3.5" />
                <span>{crumb.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Department Management</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                <Icons.Building2 className="w-3 h-3" />
                Total: {pagination.totalItems}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchDepartments(1, true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-sm"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            {hasCreatePermission && (
              <button
                onClick={() => {
                  setSelectedDepartment(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
                Add Department
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* ===== MESSAGE TOAST ===== */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border-l-4"
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
                <span className="font-semibold text-sm block text-gray-900">
                  {message.title}
                </span>
                <p className="text-xs text-gray-600">{message.text}</p>
              </div>
              <button onClick={() => setMessage(null)}>
                <Icons.X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TABLE SECTION ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading && departments.length === 0 ? (
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
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Department</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Code</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Head</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Users</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Courses</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <Icons.Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No departments found</p>
                      </td>
                    </tr>
                  ) : (
                    departments.map((department) => {
                      const ss = getStatusStyle(department.status);
                      const userCount = department._count?.users || 0;
                      const courseCount = department._count?.courses || 0;
                      
                      return (
                        <tr key={department.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                {department.name?.charAt(0) || 'D'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{department.name || 'N/A'}</p>
                                {department.description && (
                                  <p className="text-xs text-gray-500 truncate">{department.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="default">{department.code}</Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 truncate">
                            {department.headOfDepartment?.name || 'Not Assigned'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-semibold text-blue-600">{userCount}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {hasCourseReadPermission ? (
                              <button
                                onClick={() => handleCoursesClick(department)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <Icons.BookOpen className="w-3.5 h-3.5" />
                                {courseCount} Courses
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">{courseCount}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(department)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${ss.bg} ${ss.color} ${ss.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                department.status === 'active' ? 'bg-emerald-500' :
                                department.status === 'inactive' ? 'bg-amber-500' : 'bg-gray-500'
                              }`} />
                              {ss.label}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedDepartment(department);
                                  setShowViewModal(true);
                                }}
                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              {hasUpdatePermission && (
                                <button
                                  onClick={() => {
                                    setSelectedDepartment(department);
                                    setShowEditModal(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                                >
                                  <Icons.Edit className="w-4 h-4" />
                                </button>
                              )}
                              {hasDeletePermission && (
                                <button
                                  onClick={() => {
                                    setSelectedDepartment(department);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                >
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
              {departments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icons.Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No departments found</p>
                </div>
              ) : (
                departments.map((department) => {
                  const ss = getStatusStyle(department.status);
                  const userCount = department._count?.users || 0;
                  const courseCount = department._count?.courses || 0;
                  
                  return (
                    <div key={department.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm">
                          {department.name?.charAt(0) || 'D'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{department.name || 'N/A'}</h3>
                          <Badge variant="default">{department.code}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Head</span>
                          <span className="text-gray-700">{department.headOfDepartment?.name || 'Not Assigned'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Users</span>
                          <span className="font-semibold text-blue-600">{userCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Courses</span>
                          <span className="font-semibold">{courseCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status</span>
                          <button
                            onClick={() => handleToggleStatus(department)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${ss.bg} ${ss.color} ${ss.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              department.status === 'active' ? 'bg-emerald-500' :
                              department.status === 'inactive' ? 'bg-amber-500' : 'bg-gray-500'
                            }`} />
                            {ss.label}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedDepartment(department);
                            setShowViewModal(true);
                          }}
                          className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Icons.Eye className="w-4 h-4 inline mr-1" />
                          View
                        </button>
                        {hasUpdatePermission && (
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowEditModal(true);
                            }}
                            className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <Icons.Edit className="w-4 h-4 inline mr-1" />
                            Edit
                          </button>
                        )}
                        {hasDeletePermission && (
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowDeleteModal(true);
                            }}
                            className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <Icons.Trash2 className="w-4 h-4 inline mr-1" />
                            Delete
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
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} departments)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchDepartments(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchDepartments(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== MODALS ===== */}
      <DepartmentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateDepartment}
        initialData={null}
        loading={false}
      />
      
      <DepartmentFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDepartment(null);
        }}
        onSubmit={handleUpdateDepartment}
        initialData={selectedDepartment}
        loading={false}
      />

      {/* ===== VIEW MODAL ===== */}
      {showViewModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowViewModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Department Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icons.X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="font-semibold text-gray-900">{selectedDepartment.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Code</label>
                  <p className="font-mono text-blue-600">{selectedDepartment.code}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <Badge variant={selectedDepartment.status === 'active' ? 'success' : 'warning'}>
                    {selectedDepartment.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Head</label>
                  <p className="text-gray-900">{selectedDepartment.headOfDepartment?.name || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center p-3 rounded-xl bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{selectedDepartment._count?.users || 0}</p>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <p className="text-2xl font-bold text-emerald-600">{selectedDepartment._count?.courses || 0}</p>
                  <p className="text-xs text-gray-500">Courses</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-50">
                  <p className="text-2xl font-bold text-purple-600">{selectedDepartment._count?.preadmissions || 0}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Icons.AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Department</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-700">
              Delete <strong>{selectedDepartment.name}</strong>?
              {selectedDepartment._count?.users > 0 && (
                <span className="block mt-2 text-red-600">
                  Warning: {selectedDepartment._count.users} user(s) assigned.
                </span>
              )}
              {selectedDepartment._count?.courses > 0 && (
                <span className="block mt-1 text-red-600">
                  Warning: {selectedDepartment._count.courses} course(s) assigned.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDepartment}
                disabled={selectedDepartment._count?.users > 0 || selectedDepartment._count?.courses > 0}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== COURSES MODAL ===== */}
      {showCoursesModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCoursesModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Courses - {selectedDepartment.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {filteredCourses.length} of {courses.length} course(s)
                </p>
              </div>
              <button
                onClick={() => setShowCoursesModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icons.X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
              <div className="relative flex-1">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[140px]"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={`semester${s}`}>Semester {s}</option>
                ))}
              </select>
              <select
                value={filterCourseType}
                onChange={(e) => setFilterCourseType(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[120px]"
              >
                <option value="all">All Types</option>
                <option value="core">Core</option>
                <option value="elective">Elective</option>
              </select>
              <select
                value={filterNonCredit}
                onChange={(e) => setFilterNonCredit(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[120px]"
              >
                <option value="all">All Courses</option>
                <option value="yes">Non-Credit</option>
                <option value="no">Credit</option>
              </select>
              {hasCourseCreatePermission && (
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setShowCourseFormModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                  Add Course
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingCourses ? (
                <div className="flex justify-center py-12">
                  <Icons.Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icons.BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">
                    {courses.length === 0 ? 'No courses found' : 'No courses match filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCourses.map((course) => {
                    const ts = getCourseTypeStyle(course.courseType);
                    return (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                            <Icons.BookOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">{course.name}</h4>
                              <Badge variant="default">{course.code}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {course.credits && (
                                <span className="text-xs text-gray-500">
                                  <Icons.Award className="w-3 h-3 inline mr-0.5" />
                                  {course.credits} credits
                                </span>
                              )}
                              <Badge variant={course.courseType === 'core' ? 'default' : 'info'}>
                                {course.courseType}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {getSemesterLabel(course.semester)}
                              </span>
                              {course.noncredit && (
                                <Badge variant="warning">Non-Credit</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {(hasCourseUpdatePermission || hasCourseDeletePermission) && (
                          <div className="flex items-center gap-1 ml-3">
                            {hasCourseUpdatePermission && (
                              <button
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setShowCourseFormModal(true);
                                }}
                                className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                              >
                                <Icons.Edit className="w-4 h-4" />
                              </button>
                            )}
                            {hasCourseDeletePermission && (
                              <button
                                onClick={() => {
                                  setDeletingCourse(course);
                                  setShowDeleteCourseModal(true);
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <Icons.Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== COURSE FORM MODAL ===== */}
      <CourseFormModal
        isOpen={showCourseFormModal}
        onClose={() => {
          setShowCourseFormModal(false);
          setSelectedCourse(null);
        }}
        onSubmit={handleSaveCourse}
        initialData={selectedCourse}
        loading={formLoading}
        departmentId={selectedDepartment?.id}
        departments={allDepartments}
      />

      {/* ===== DELETE COURSE MODAL ===== */}
      {showDeleteCourseModal && deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteCourseModal(false);
              setDeletingCourse(null);
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Icons.AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Course</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-700">
              Delete <strong>{deletingCourse.name}</strong> ({deletingCourse.code})?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteCourseModal(false);
                  setDeletingCourse(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}