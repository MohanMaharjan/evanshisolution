'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import * as Icons from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePermissions } from '@/hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function CourseFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  departmentId,
  departments = [],
}) {
  const { can } = usePermissions();

  const hasCreatePermission = can('courses', 'create');
  const hasUpdatePermission = can('courses', 'update');
  const hasDeletePermission = can('courses', 'delete');
  const hasReadPermission = can('courses', 'read');

  const canViewContent =
    hasReadPermission ||
    hasCreatePermission ||
    hasUpdatePermission ||
    hasDeletePermission;

  const [activeTab, setActiveTab] = useState('course');
  const [form, setForm] = useState({
    name: '',
    code: '',
    credits: '',
    description: '',
    lecture: '',
    tutorial: '',
    practical: '',
    noncredit: false,
    courseType: 'core',
    semester: 'semester1',
    syllabus: '',
    departmentId: '',
  });
  const [errors, setErrors] = useState({});
  const [courses, setCourses] = useState([]);
  const [excelErrors, setExcelErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    status: '',
    stage: '',
  });
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);
  const [searchName, setSearchName] = useState('');
  const [searchSemester, setSearchSemester] = useState('all');
  const [searchCourseType, setSearchCourseType] = useState('all');

  // Get the department name for display
  const selectedDepartmentName = departmentId
    ? departments.find((d) => d.id.toString() === departmentId.toString())
        ?.name || ''
    : '';

  useEffect(() => {
    if (!isOpen) return;
    const deptId = initialData?.departmentId || departmentId || '';
    setForm({
      name: initialData?.name || '',
      code: initialData?.code || '',
      credits: initialData?.credits?.toString() || '',
      description: initialData?.description || '',
      lecture: initialData?.lecture?.toString() || '',
      tutorial: initialData?.tutorial?.toString() || '',
      practical: initialData?.practical?.toString() || '',
      noncredit: initialData?.noncredit || false,
      courseType: initialData?.courseType || 'core',
      semester: initialData?.semester || 'semester1',
      syllabus: initialData?.syllabus || '',
      departmentId: deptId ? deptId.toString() : '',
    });
    setErrors({});
    setCourses([]);
    setExcelErrors([]);
    setShowPreview(false);
    setFileName('');
    setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
    setParsing(false);
    setImporting(false);
    setActiveTab('course');
    setSearchName('');
    setSearchSemester('all');
    setSearchCourseType('all');
  }, [isOpen, initialData, departmentId]);

  const isBusy = loading || importing || parsing;

  const getSemesterNumber = (semesterStr) => {
    if (!semesterStr) return null;
    const match = String(semesterStr).match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (searchName) {
        const s = searchName.toLowerCase();
        if (
          !c.name?.toLowerCase().includes(s) &&
          !c.code?.toLowerCase().includes(s)
        )
          return false;
      }
      if (searchSemester !== 'all') {
        const cn = getSemesterNumber(c.semester);
        const fn = getSemesterNumber(searchSemester);
        if (cn !== fn) return false;
      }
      if (searchCourseType !== 'all' && c.courseType !== searchCourseType)
        return false;
      return true;
    });
  }, [courses, searchName, searchSemester, searchCourseType]);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required';
    if (!form.code?.trim()) e.code = 'Code is required';
    if (!form.departmentId) e.departmentId = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isBusy) return;
    if (initialData && !hasUpdatePermission) return;
    if (!initialData && !hasCreatePermission) return;
    onSubmit({
      ...form,
      credits: form.credits ? parseInt(form.credits) : null,
      lecture: form.lecture ? parseInt(form.lecture) : null,
      tutorial: form.tutorial ? parseInt(form.tutorial) : null,
      practical: form.practical ? parseInt(form.practical) : null,
      departmentId: form.departmentId ? parseInt(form.departmentId) : null,
    });
  };

  const handleChange = (field, value) => {
    if (isBusy) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const u = { ...prev };
        delete u[field];
        return u;
      });
    }
  };

  const matchDepartment = (searchStr) => {
    if (!searchStr || !departments.length) return null;
    const search = searchStr.toLowerCase().trim();

    let match =
      departments.find((d) => d.id.toString() === search) ||
      departments.find((d) => d.name.toLowerCase().trim() === search) ||
      departments.find((d) => d.code?.toLowerCase().trim() === search);
    if (match) return match;

    const norm = (s) =>
      s
        .toLowerCase()
        .replace(/[\.\,\-\s]+/g, ' ')
        .trim();
    const ns = norm(search);
    match = departments.find(
      (d) => norm(d.name) === ns || norm(d.code || '') === ns
    );
    if (match) return match;

    match = departments.find((d) => {
      const n = d.name.toLowerCase(),
        c = (d.code || '').toLowerCase();
      return n.includes(search) || search.includes(n) || c.includes(search);
    });
    return match;
  };

  const parseSemester = (val) => {
    const s = String(val || '')
      .toLowerCase()
      .trim();
    const num = s.match(/\d+/);
    if (num) {
      const n = parseInt(num[0]);
      if (n >= 1 && n <= 8) return `semester${n}`;
    }
    return 'semester1';
  };

  const parseExcelFile = (file) => {
    if (isBusy || !hasCreatePermission) return;
    setFileName(file.name);
    setParsing(true);
    setExcelErrors([]);
    setShowPreview(false);
    setCourses([]);
    setUploadProgress({
      current: 0,
      total: 0,
      status: 'Reading file...',
      stage: 'read',
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setUploadProgress({
          current: 0,
          total: 0,
          status: 'Parsing...',
          stage: 'parse',
        });
        const wb = XLSX.read(new Uint8Array(event.target.result), {
          type: 'array',
        });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
          header: 1,
        });

        if (json.length < 2) {
          setExcelErrors(['Need header + data rows']);
          setParsing(false);
          return;
        }

        const headers = json[0].map((h) =>
          String(h || '')
            .toLowerCase()
            .trim()
        );
        const findCol = (aliases) => {
          for (const a of aliases) {
            const i = headers.findIndex((h) => h === a || h.includes(a));
            if (i !== -1) return i;
          }
          return -1;
        };

        const cols = {};
        const colDefs = {
          name: ['name', 'course name', 'course', 'title'],
          code: ['code', 'course code', 'course no', 'course number'],
          credits: ['credits', 'credit', 'credit hours'],
          description: ['description', 'desc'],
          lecture: ['lecture', 'lecture hours', 'lec'],
          tutorial: ['tutorial', 'tutorial hours', 'tut'],
          practical: ['practical', 'practical hours', 'prac', 'lab'],
          courseType: ['course type', 'type', 'category'],
          semester: ['semester', 'sem', 'term'],
          noncredit: ['non credit', 'non-credit', 'noncredit', 'audit'],
          syllabus: ['syllabus', 'syllabus url'],
          department: [
            'department',
            'dept',
            'department id',
            'department name',
          ],
        };

        Object.entries(colDefs).forEach(([k, a]) => {
          const i = findCol(a);
          if (i !== -1) cols[k] = i;
        });

        if (cols.name === undefined || cols.code === undefined) {
          setExcelErrors([
            `Missing Name/Code columns. Found: ${headers.join(', ')}`,
          ]);
          setParsing(false);
          return;
        }

        const total = json.length - 1;
        const parsed = [];
        const errors = [];
        let matched = 0;

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.every((c) => !c)) continue;

          setUploadProgress({
            current: i,
            total,
            status: `Row ${i} of ${total}`,
            stage: 'process',
          });

          const course = {
            id: Date.now() + i,
            name: '',
            code: '',
            credits: '',
            description: '',
            lecture: '',
            tutorial: '',
            practical: '',
            noncredit: false,
            courseType: 'core',
            semester: 'semester1',
            syllabus: '',
            departmentId: departmentId?.toString() || '',
            departmentName: selectedDepartmentName,
          };

          Object.entries(cols).forEach(([field, idx]) => {
            const val = row[idx];
            if (val === undefined || val === null || val === '') return;
            const s = String(val).trim();

            switch (field) {
              case 'name':
                course.name = s;
                break;
              case 'code':
                course.code = s;
                break;
              case 'credits':
              case 'lecture':
              case 'tutorial':
              case 'practical':
                course[field] = s;
                break;
              case 'description':
              case 'syllabus':
                course[field] = s;
                break;
              case 'courseType':
                course.courseType = ['elective', 'e'].includes(s.toLowerCase())
                  ? 'elective'
                  : 'core';
                break;
              case 'semester':
                course.semester = parseSemester(s);
                break;
              case 'noncredit':
                course.noncredit = ['yes', 'true', 'y', '1', '✓'].includes(
                  s.toLowerCase()
                );
                break;
              case 'department': {
                const dept = matchDepartment(s);
                if (dept) {
                  course.departmentId = dept.id.toString();
                  course.departmentName = dept.name;
                  matched++;
                } else {
                  course.departmentName = s;
                  errors.push(`Row ${i + 1}: "${s}" not found`);
                }
                break;
              }
            }
          });

          if (!course.departmentId && departmentId) {
            course.departmentId = departmentId.toString();
            course.departmentName = selectedDepartmentName;
            matched++;
          }

          if (!course.name) {
            errors.push(`Row ${i + 1}: Name required`);
            continue;
          }
          if (!course.code) {
            errors.push(`Row ${i + 1}: Code required`);
            continue;
          }
          parsed.push(course);
        }

        if (matched) errors.unshift(`✅ ${matched} auto-matched`);
        const valid = parsed.filter((c) => c.name?.trim() && c.code?.trim());

        if (!valid.length) {
          setExcelErrors(['No valid courses']);
          setParsing(false);
          return;
        }

        setCourses(valid);
        setExcelErrors(errors);
        setShowPreview(true);
        setParsing(false);
        setUploadProgress({ current: 0, total: 0, status: '', stage: '' });

        if (
          valid.filter((c) => !c.departmentId).length === 0 &&
          hasCreatePermission
        ) {
          doImport(valid);
        }
      } catch (err) {
        setExcelErrors(['Parse error: ' + err.message]);
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setExcelErrors(['Failed to read file']);
      setParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e) => {
    if (isBusy || !hasCreatePermission) return;
    const f = e.target.files[0];
    if (f) parseExcelFile(f);
  };

  const doImport = async (list) => {
    if (!hasCreatePermission) return;
    setImporting(true);
    try {
      await onSubmit({
        courses: list.map((c) => ({
          ...c,
          departmentId: parseInt(c.departmentId),
          id: undefined,
          departmentName: undefined,
        })),
        isCourseImport: true,
      });
      setTimeout(() => {
        setCourses([]);
        setShowPreview(false);
        setFileName('');
        setExcelErrors([]);
        setImporting(false);
      }, 800);
    } catch (err) {
      setExcelErrors([err.message]);
      setImporting(false);
    }
  };

  const handleManualImport = async () => {
    if (isBusy || !hasCreatePermission) return;
    const valid = filteredCourses.filter(
      (c) => c.name?.trim() && c.code?.trim()
    );
    if (!valid.length) return setExcelErrors(['No valid courses']);
    const missing = valid.filter((c) => !c.departmentId);
    if (missing.length)
      return setExcelErrors([`${missing.length} need department`]);

    setImporting(true);
    try {
      await onSubmit({
        courses: valid.map((c) => ({
          ...c,
          departmentId: parseInt(c.departmentId),
          id: undefined,
          departmentName: undefined,
        })),
        isCourseImport: true,
      });
      setCourses([]);
      setShowPreview(false);
      setFileName('');
      setExcelErrors([]);
      setImporting(false);
    } catch (err) {
      setExcelErrors([err.message]);
      setImporting(false);
    }
  };

  const handleCourseChange = (id, field, value) => {
    if (isBusy) return;
    setCourses((prev) => {
      const u = [...prev];
      const idx = u.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      u[idx] = { ...u[idx], [field]: value };
      if (field === 'departmentId') {
        u[idx].departmentName =
          departments.find((d) => d.id === parseInt(value))?.name || '';
      }
      return u;
    });
  };

  const removeCourse = (id) => {
    if (isBusy || !hasDeletePermission) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const addCourseRow = () => {
    if (isBusy || !hasCreatePermission) return;
    setCourses((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        code: '',
        credits: '',
        description: '',
        lecture: '',
        tutorial: '',
        practical: '',
        noncredit: false,
        courseType: 'core',
        semester: 'semester1',
        syllabus: '',
        departmentId: departmentId?.toString() || '',
        departmentName: selectedDepartmentName,
      },
    ]);
  };

  const downloadTemplate = () => {
    if (isBusy) return;
    const deptName = selectedDepartmentName || 'Department';
    const data = [
      [
        'Name',
        'Code',
        'Credits',
        'Lecture (hrs)',
        'Tutorial (hrs)',
        'Practical (hrs)',
        'Course Type',
        'Semester',
        'Non Credit',
        'Department',
      ],
      [
        'Data Structures',
        'CS201',
        '3',
        '3',
        '1',
        '2',
        'core',
        'Semester 3',
        'No',
        deptName,
      ],
      [
        'Database Systems',
        'CS301',
        '4',
        '3',
        '1',
        '2',
        'core',
        'Semester 5',
        'No',
        deptName,
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [35, 12, 8, 12, 12, 12, 12, 12, 10, 25].map((w) => ({
      wch: w,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'course_template.xlsx');
  };

  if (!isOpen) return null;

  if (!canViewContent) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 border border-red-200 text-center">
          <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-600">Access Denied</h2>
          <p className="text-sm mb-4 text-gray-600">
            You don't have permission to manage courses.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const progressPct =
    uploadProgress.total > 0
      ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
      : 0;
  const hasActions = hasDeletePermission;
  const totalCols = hasActions ? 9 : 8;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={isBusy ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 ${
              isBusy ? 'pointer-events-none' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading overlay */}
            {isBusy && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4 border border-gray-200 text-center">
                  <Icons.Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-bold mb-2 text-gray-900">
                    {uploadProgress.stage === 'read'
                      ? 'Reading'
                      : uploadProgress.stage === 'parse'
                      ? 'Parsing'
                      : uploadProgress.stage === 'process'
                      ? 'Processing'
                      : 'Please wait...'}
                  </h3>
                  <p className="text-sm mb-4 text-gray-500">
                    {uploadProgress.status}
                  </p>
                  {uploadProgress.total > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div
                        className="h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPct}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs font-medium text-gray-600">
                    {progressPct}%
                  </p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {initialData ? 'Edit Course' : 'Add Course'}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedDepartmentName ? (
                    <span>
                      Dept:{' '}
                      <strong className="text-blue-600">
                        {selectedDepartmentName}
                      </strong>
                    </span>
                  ) : (
                    `${departments.length} departments`
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isBusy}
              >
                <Icons.X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            {!initialData && (
              <div className="flex border-b border-gray-200 flex-shrink-0 bg-gray-50">
                <button
                  onClick={() => !isBusy && setActiveTab('course')}
                  disabled={isBusy}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'course'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icons.BookOpen className="w-4 h-4 inline mr-2" />
                  Single Course
                </button>
                {hasCreatePermission && (
                  <button
                    onClick={() => !isBusy && setActiveTab('import')}
                    disabled={isBusy}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'import'
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700'
                    } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icons.FileSpreadsheet className="w-4 h-4 inline mr-2" />
                    Import Courses
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Single Course Tab */}
              {activeTab === 'course' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Department Field */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Department <span className="text-red-500">*</span>
                    </label>
                    {departmentId && !initialData ? (
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                        {selectedDepartmentName}
                      </div>
                    ) : (
                      <select
                        value={form.departmentId}
                        onChange={(e) => handleChange('departmentId', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.departmentId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id.toString()}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.departmentId && (
                      <p className="text-xs text-red-600 mt-1">{errors.departmentId}</p>
                    )}
                  </div>

                  {/* Name and Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Course name"
                        disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.code}
                        onChange={(e) => handleChange('code', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.code ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="e.g., CS201"
                        disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                      />
                      {errors.code && (
                        <p className="text-xs text-red-600 mt-1">{errors.code}</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      rows={2}
                      placeholder="Optional"
                      disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                    />
                  </div>

                  {/* Credits, Lecture, Tutorial */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['credits', 'lecture', 'tutorial'].map((f) => (
                      <div key={f}>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 capitalize">
                          {f} (hrs)
                        </label>
                        <input
                          type="number"
                          value={form[f]}
                          onChange={(e) => handleChange(f, e.target.value)}
                          className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isBusy ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="0"
                          min="0"
                          disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Practical and Semester */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Practical (hrs)
                      </label>
                      <input
                        type="number"
                        value={form.practical}
                        onChange={(e) => handleChange('practical', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          isBusy ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="0"
                        min="0"
                        disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Semester
                      </label>
                      <select
                        value={form.semester}
                        onChange={(e) => handleChange('semester', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          isBusy ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={`semester${s}`}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Course Type and Non-Credit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Type
                      </label>
                      <select
                        value={form.courseType}
                        onChange={(e) => handleChange('courseType', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          isBusy ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                      >
                        <option value="core">Core</option>
                        <option value="elective">Elective</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.noncredit}
                          onChange={(e) => handleChange('noncredit', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                        />
                        Non-Credit
                      </label>
                    </div>
                  </div>

                  {/* Syllabus */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Syllabus URL
                    </label>
                    <input
                      value={form.syllabus}
                      onChange={(e) => handleChange('syllabus', e.target.value)}
                      className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="https://..."
                      disabled={isBusy || (!hasCreatePermission && !hasUpdatePermission)}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={isBusy}
                    >
                      Cancel
                    </button>
                    {(initialData ? hasUpdatePermission : hasCreatePermission) && (
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Icons.Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Icons.Save className="w-4 h-4" />
                            {initialData ? 'Update' : 'Add'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && hasCreatePermission && (
                <div className="space-y-4">
                  {/* Info box */}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-800">
                          Import from Excel
                        </h3>
                        <p className="text-xs mt-1 text-blue-600">
                          Required: <strong>Name, Code</strong>. Optional:{' '}
                          <strong>Department</strong>.
                          {selectedDepartmentName && (
                            <span>
                              {' '}
                              Will auto-assign to{' '}
                              <strong>{selectedDepartmentName}</strong>.
                            </span>
                          )}
                        </p>
                        <button
                          onClick={downloadTemplate}
                          disabled={isBusy}
                          className="mt-2 text-xs flex items-center gap-1 text-blue-700 hover:text-blue-800 underline disabled:opacity-50"
                        >
                          <Icons.Download className="w-3 h-3" />
                          Download Template
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excelFileInput"
                      disabled={isBusy || !hasCreatePermission}
                    />
                    <label
                      htmlFor="excelFileInput"
                      className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl transition-colors ${
                        isBusy || !hasCreatePermission
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor: isBusy ? '#d1d5db' : '#93c5fd',
                      }}
                    >
                      {isBusy ? (
                        <Icons.Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      ) : (
                        <Icons.Upload className="w-8 h-8 text-blue-400" />
                      )}
                      <span className="text-sm font-medium text-blue-600">
                        {fileName || 'Click to select Excel file'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {isBusy ? 'Processing...' : 'Auto-import on selection'}
                      </span>
                    </label>
                  </div>

                  {/* Errors */}
                  {excelErrors.length > 0 && (
                    <div className="p-3 rounded-lg max-h-32 overflow-y-auto bg-red-50 border border-red-200">
                      {excelErrors.map((err, i) => (
                        <p
                          key={i}
                          className={`text-xs flex items-center gap-1 ${
                            err.startsWith('✅')
                              ? 'font-medium text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          <Icons.AlertCircle className="w-3 h-3" />
                          {err}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Preview table */}
                  {showPreview && courses.length > 0 && (
                    <div className="space-y-3">
                      {/* Filters */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="Search by course name or code..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isBusy}
                          />
                        </div>
                        <select
                          value={searchSemester}
                          onChange={(e) => setSearchSemester(e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[140px]"
                          disabled={isBusy}
                        >
                          <option value="all">All Semesters</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={`semester${s}`}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                        <select
                          value={searchCourseType}
                          onChange={(e) => setSearchCourseType(e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[110px]"
                          disabled={isBusy}
                        >
                          <option value="all">All Types</option>
                          <option value="core">Core</option>
                          <option value="elective">Elective</option>
                        </select>
                        {hasCreatePermission && (
                          <button
                            onClick={addCourseRow}
                            disabled={isBusy}
                            className="px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1 whitespace-nowrap bg-white border border-gray-200 text-blue-600 hover:bg-gray-50 transition-colors"
                          >
                            <Icons.Plus className="w-3 h-3" />
                            Add Row
                          </button>
                        )}
                      </div>

                      {/* Count */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Showing <strong>{filteredCourses.length}</strong> of{' '}
                          <strong>{courses.length}</strong> courses
                          {(searchName ||
                            searchSemester !== 'all' ||
                            searchCourseType !== 'all') && (
                            <button
                              onClick={() => {
                                setSearchName('');
                                setSearchSemester('all');
                                setSearchCourseType('all');
                              }}
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Clear
                            </button>
                          )}
                        </p>
                      </div>

                      {/* Table */}
                      <div className="overflow-auto max-h-[40vh] border border-gray-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                            <tr>
                              {[
                                '#',
                                'Name',
                                'Code',
                                departmentId ? null : 'Dept',
                                'Credits',
                                'Type',
                                'Sem',
                                'N/C',
                                hasDeletePermission ? '' : null,
                              ]
                                .filter(Boolean)
                                .map((h) => (
                                  <th
                                    key={h}
                                    className="px-2 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                                  >
                                    {h}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCourses.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={totalCols}
                                  className="text-center py-8 text-gray-400"
                                >
                                  No courses match your search
                                </td>
                              </tr>
                            ) : (
                              filteredCourses.map((c, i) => (
                                <tr
                                  key={c.id}
                                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-2 py-1.5 text-center text-gray-400">
                                    {i + 1}
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      value={c.name}
                                      onChange={(e) =>
                                        handleCourseChange(
                                          c.id,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      disabled={isBusy || !hasUpdatePermission}
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      value={c.code}
                                      onChange={(e) =>
                                        handleCourseChange(
                                          c.id,
                                          'code',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      disabled={isBusy || !hasUpdatePermission}
                                    />
                                  </td>
                                  {!departmentId && (
                                    <td className="px-1 py-1 min-w-[120px]">
                                      <select
                                        value={c.departmentId || ''}
                                        onChange={(e) =>
                                          handleCourseChange(
                                            c.id,
                                            'departmentId',
                                            e.target.value
                                          )
                                        }
                                        className={`w-full px-1.5 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                          !c.departmentId
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-200'
                                        }`}
                                        disabled={isBusy || !hasUpdatePermission}
                                      >
                                        <option value="">--</option>
                                        {departments.map((d) => (
                                          <option key={d.id} value={d.id.toString()}>
                                            {d.name}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  )}
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={c.credits}
                                      onChange={(e) =>
                                        handleCourseChange(
                                          c.id,
                                          'credits',
                                          e.target.value
                                        )
                                      }
                                      className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      disabled={isBusy || !hasUpdatePermission}
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <select
                                      value={c.courseType}
                                      onChange={(e) =>
                                        handleCourseChange(
                                          c.id,
                                          'courseType',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      disabled={isBusy || !hasUpdatePermission}
                                    >
                                      <option value="core">Core</option>
                                      <option value="elective">Elective</option>
                                    </select>
                                  </td>
                                  <td className="px-1 py-1">
                                    <select
                                      value={c.semester}
                                      onChange={(e) =>
                                        handleCourseChange(
                                          c.id,
                                          'semester',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      disabled={isBusy || !hasUpdatePermission}
                                    >
                                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                        <option key={s} value={`semester${s}`}>
                                          S{s}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-1 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={c.noncredit}
                                      onChange={(e) =>
                                        handleCourseChange(
                                          c.id,
                                          'noncredit',
                                          e.target.checked
                                        )
                                      }
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      disabled={isBusy || !hasUpdatePermission}
                                    />
                                  </td>
                                  {hasDeletePermission && (
                                    <td className="px-1 py-1 text-center">
                                      <button
                                        onClick={() => removeCourse(c.id)}
                                        className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                                        disabled={isBusy}
                                      >
                                        <Icons.Trash2 className="w-3 h-3" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={onClose}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                        {hasCreatePermission && (
                          <button
                            onClick={handleManualImport}
                            disabled={isBusy || filteredCourses.length === 0}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {importing ? (
                              <>
                                <Icons.Loader2 className="w-4 h-4 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Icons.FileSpreadsheet className="w-4 h-4" />
                                Import{' '}
                                {
                                  filteredCourses.filter(
                                    (c) => c.name?.trim() && c.code?.trim()
                                  ).length
                                }{' '}
                                Courses
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}