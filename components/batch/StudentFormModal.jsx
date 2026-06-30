'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import * as Icons from 'lucide-react';
import * as XLSX from 'xlsx';

const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
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
  },
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  enrollmentNo: '',
  rollNo: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  guardianName: '',
  guardianContact: '',
  guardianEmail: '',
  emergencyContact: '',
  examRollNumber: '',
  departmentId: '',
};

const emptyStudent = {
  id: 0,
  name: '',
  email: '',
  phone: '',
  rollNo: '',
  enrollmentNo: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  guardianName: '',
  guardianContact: '',
  guardianEmail: '',
  emergencyContact: '',
  examRollNumber: '',
  departmentId: '',
  departmentName: '',
};

export default function StudentFormModal({
  isOpen,
  onClose,
  batchId,
  batchName,
  batchDepartments = [],
  onSaved,
  showMessage,
}) {
  const [activeTab, setActiveTab] = useState('single');
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [students, setStudents] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState({
    current: 0, total: 0, status: '', stage: '',
  });
  const fileInputRef = useRef(null);
  const [searchName, setSearchName] = useState('');
  
  // Local toast for inline errors
  const [localToast, setLocalToast] = useState(null);

  const showLocalToast = (type, message) => {
    setLocalToast({ type, message });
    setTimeout(() => setLocalToast(null), 5000);
  };

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm });
    setErrors({});
    setSavedCount(0);
    setStudents([]);
    setImportErrors([]);
    setShowPreview(false);
    setFileName('');
    setActiveTab('single');
    setSearchName('');
    setLocalToast(null);
    setLoadingDepts(true);

    if (batchDepartments?.length > 0) {
      setDepartments(batchDepartments);
      setForm(prev => ({ ...emptyForm, departmentId: batchDepartments[0].id.toString() }));
      setLoadingDepts(false);
    } else {
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const res = await fetch('/api/departments?limit=200&status=active');
      const data = await res.json();
      if (res.ok && data.departments) {
        setDepartments(data.departments);
        if (data.departments.length > 0) {
          setForm(prev => ({ ...prev, departmentId: data.departments[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      showLocalToast('error', 'Failed to load departments');
    } finally {
      setLoadingDepts(false);
    }
  };

  // ==================== VALIDATION ====================
  const validate = (studentData = form) => {
    const e = {};
    if (!studentData.name?.trim()) e.name = 'Name is required';
    if (!studentData.email?.trim()) {
      e.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(studentData.email)) {
      e.email = 'Invalid email format';
    }
    if (!studentData.phone?.trim()) {
      e.phone = 'Phone is required';
    } else if (studentData.phone.replace(/\D/g, '').length < 10) {
      e.phone = 'Must be at least 10 digits';
    }
    if (!studentData.rollNo?.trim()) e.rollNo = 'Roll number is required';
    if (!studentData.departmentId) e.departmentId = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const u = { ...prev }; delete u[field]; return u; });
  };

  // ==================== SAVE SINGLE STUDENT ====================
  const saveStudent = async (closeAfter = false) => {
    if (!batchId) {
      showLocalToast('error', 'No batch selected');
      return;
    }
    if (!validate()) {
      showLocalToast('error', 'Please fix the validation errors');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        students: [{
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.replace(/\D/g, ''),
          rollNo: form.rollNo.trim(),
          address: form.address?.trim() || null,
          enrollmentNo: form.enrollmentNo?.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          bloodGroup: form.bloodGroup || null,
          guardianName: form.guardianName?.trim() || null,
          guardianContact: form.guardianContact?.trim() || null,
          guardianEmail: form.guardianEmail?.trim() || null,
          emergencyContact: form.emergencyContact?.trim() || null,
          examRollNumber: form.examRollNumber?.trim() || null,
          departmentId: parseInt(form.departmentId),
        }],
      };

      const res = await fetch(`/api/batches/${batchId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      setSavedCount(prev => prev + 1);
      showMessage?.('success', 'Success', `${form.name} saved successfully`);
      showLocalToast('success', `${form.name} added successfully`);
      setForm(prev => ({ ...emptyForm, departmentId: prev.departmentId }));
      setErrors({});
      onSaved?.();
      if (closeAfter) onClose();
    } catch (err) {
      showLocalToast('error', err.message);
      showMessage?.('error', 'Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==================== EXCEL PARSING ====================
  const matchDepartment = (searchStr) => {
    if (!searchStr || !departments.length) return null;
    const search = searchStr.toLowerCase().trim();
    const exact = departments.find(d =>
      d.id.toString() === search ||
      d.name.toLowerCase().trim() === search ||
      d.code?.toLowerCase().trim() === search
    );
    if (exact) return exact;
    return departments.find(d => {
      const n = d.name.toLowerCase();
      return n.includes(search) || search.includes(n);
    }) || null;
  };

  const parseExcel = (file) => {
    setFileName(file.name);
    setImportErrors([]);
    setShowPreview(false);
    setStudents([]);
    setUploadProgress({ current: 0, total: 0, status: 'Reading file...', stage: 'read' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setUploadProgress({ current: 0, total: 0, status: 'Parsing...', stage: 'parse' });
        const wb = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

        if (json.length < 2) {
          setImportErrors(['File must have header row and at least one data row']);
          setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
          return;
        }

        const headers = json[0].map(h => String(h || '').toLowerCase().trim());

        const findCol = (aliases) => {
          for (const a of aliases) {
            const i = headers.findIndex(h => h === a || h.includes(a));
            if (i !== -1) return i;
          }
          return -1;
        };

        const cols = {};
        const colDefs = {
          name: ['name', 'student name', 'full name'],
          email: ['email', 'e-mail', 'mail'],
          phone: ['phone', 'mobile', 'contact', 'telephone'],
          rollNo: ['roll no', 'roll', 'roll number', 'rollno'],
          enrollmentNo: ['enrollment no', 'enrollment', 'enrollno'],
          address: ['address', 'location'],
          dateOfBirth: ['date of birth', 'dob', 'birth date'],
          gender: ['gender', 'sex'],
          bloodGroup: ['blood group', 'blood', 'bloodgroup'],
          guardianName: ['guardian name', 'guardian', 'parent name'],
          guardianContact: ['guardian contact', 'guardian phone', 'parent contact'],
          guardianEmail: ['guardian email', 'parent email'],
          emergencyContact: ['emergency contact', 'emergency'],
          examRollNumber: ['exam roll number', 'exam roll no', 'exam roll'],
          department: ['department', 'dept', 'department id', 'department name'],
        };

        Object.entries(colDefs).forEach(([k, a]) => {
          const i = findCol(a);
          if (i !== -1) cols[k] = i;
        });

        if (cols.name === undefined) {
          setImportErrors(['Missing "Name" column. Found headers: ' + headers.join(', ')]);
          setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
          return;
        }

        const total = json.length - 1;
        const parsed = [];
        const errors = [];
        let matched = 0;

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.every(c => !c)) continue;

          setUploadProgress({ current: i, total, status: `Processing row ${i} of ${total}`, stage: 'process' });

          const s = { ...emptyStudent, id: Date.now() + i };

          Object.entries(cols).forEach(([field, idx]) => {
            const val = row[idx];
            if (val === undefined || val === null || val === '') return;
            const str = String(val).trim();

            if (field === 'dateOfBirth' && typeof row[idx] === 'number') {
              const d = XLSX.SSF.parse_date_code(row[idx]);
              if (d) s[field] = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            } else if (field === 'department') {
              const dept = matchDepartment(str);
              if (dept) {
                s.departmentId = dept.id.toString();
                s.departmentName = dept.name;
                matched++;
              } else {
                s.departmentName = str;
                errors.push(`Row ${i + 1}: Department "${str}" not found`);
              }
            } else {
              s[field] = str;
            }
          });

          if (!s.departmentId && departments.length > 0) {
            s.departmentId = departments[0].id.toString();
            s.departmentName = departments[0].name;
            matched++;
          }

          if (!s.name) {
            errors.push(`Row ${i + 1}: Name is required`);
            continue;
          }

          parsed.push(s);
        }

        if (matched) errors.unshift(`✅ ${matched} department(s) auto-matched`);
        setStudents(parsed);
        setImportErrors(errors);
        setShowPreview(true);
        setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
        showLocalToast('success', `Parsed ${parsed.length} students from file`);
      } catch (err) {
        setImportErrors(['Parse error: ' + err.message]);
        setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
        showLocalToast('error', 'Failed to parse file: ' + err.message);
      }
    };

    reader.onerror = () => {
      setImportErrors(['Failed to read file']);
      setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
      showLocalToast('error', 'Failed to read file');
    };

    reader.readAsArrayBuffer(file);
  };

  // ==================== IMPORT STUDENTS ====================
  const handleImportStudents = async () => {
    if (!batchId) {
      showLocalToast('error', 'No batch selected');
      return;
    }
    const valid = students.filter(s => s.name?.trim());
    if (!valid.length) {
      setImportErrors(['No valid students to import']);
      showLocalToast('error', 'No valid students to import');
      return;
    }

    setImporting(true);
    setUploadProgress({ current: 0, total: valid.length, status: 'Importing...', stage: 'import' });

    let success = 0, failed = 0;

    for (let i = 0; i < valid.length; i++) {
      const s = valid[i];
      setUploadProgress({
        current: i + 1,
        total: valid.length,
        status: `Saving ${i + 1} of ${valid.length}...`,
        stage: 'import',
      });

      try {
        const payload = {
          students: [{
            name: s.name.trim(),
            email: s.email?.trim() || `${s.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: (s.phone || '').replace(/\D/g, '') || '0000000000',
            rollNo: s.rollNo?.trim() || `TEMP-${Date.now()}`,
            address: s.address?.trim() || null,
            enrollmentNo: s.enrollmentNo?.trim() || null,
            dateOfBirth: s.dateOfBirth || null,
            gender: s.gender || null,
            bloodGroup: s.bloodGroup || null,
            guardianName: s.guardianName?.trim() || null,
            guardianContact: s.guardianContact?.trim() || null,
            guardianEmail: s.guardianEmail?.trim() || null,
            emergencyContact: s.emergencyContact?.trim() || null,
            examRollNumber: s.examRollNumber?.trim() || null,
            departmentId: s.departmentId ? parseInt(s.departmentId) : (departments[0]?.id || null),
          }],
        };

        const res = await fetch(`/api/batches/${batchId}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    const msg = `${success} imported${failed > 0 ? `, ${failed} failed` : ''}`;
    showMessage?.('success', 'Import Complete', msg);
    showLocalToast(failed > 0 ? 'warning' : 'success', msg);

    setStudents([]);
    setShowPreview(false);
    setFileName('');
    setImporting(false);
    setUploadProgress({ current: 0, total: 0, status: '', stage: '' });
    onSaved?.();
  };

  // ==================== HELPERS ====================
  const handleFileUpload = (e) => {
    const f = e.target.files?.[0];
    if (f) parseExcel(f);
  };

  const handleStudentChange = (id, field, value) => {
    setStudents(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'departmentId') {
        const dept = departments.find(d => d.id.toString() === value.toString());
        updated[idx].departmentName = dept?.name || '';
      }
      return updated;
    });
  };

  const removeStudent = (id) => setStudents(prev => prev.filter(s => s.id !== id));

  const filteredStudents = useMemo(() => {
    if (!searchName) return students;
    const s = searchName.toLowerCase();
    return students.filter(st =>
      st.name?.toLowerCase().includes(s) ||
      st.email?.toLowerCase().includes(s) ||
      st.rollNo?.toLowerCase().includes(s)
    );
  }, [students, searchName]);

  const downloadTemplate = () => {
    const data = [
      ['Name', 'Email', 'Phone', 'Roll No', 'Enrollment No', 'Address', 'Date of Birth', 'Gender', 'Blood Group', 'Guardian Name', 'Guardian Contact', 'Guardian Email', 'Emergency Contact', 'Exam Roll Number', 'Department'],
      ['John Doe', 'john@example.com', '9801234567', 'B001', 'ENR001', 'Kathmandu', '2000-01-15', 'Male', 'A+', 'Jane Doe', '9801234568', 'jane@example.com', '9801234569', 'EXM001', departments[0]?.name || ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [25, 30, 15, 12, 12, 25, 12, 8, 8, 25, 15, 30, 15, 15, 20].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  if (!isOpen) return null;

  const progressPct = uploadProgress.total > 0
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  const isBusy = saving || importing;

  // ==================== RENDER ====================
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />

      <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border ${isBusy ? 'pointer-events-none' : ''}`}
        style={{ borderColor: colors.primary[100] }}>

        {/* Inline Toast Notification (Foreground) */}
        {localToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2"
            style={{
              backgroundColor: localToast.type === 'success' ? colors.success.light : 
                              localToast.type === 'error' ? colors.error.light : colors.warning.light,
              color: localToast.type === 'success' ? '#166534' : 
                     localToast.type === 'error' ? '#991b1b' : '#92400e',
              border: `1px solid ${localToast.type === 'success' ? '#86efac' : 
                                     localToast.type === 'error' ? '#fca5a5' : '#fde68a'}`,
            }}>
            {localToast.type === 'success' ? <Icons.CheckCircle size={16} /> :
             localToast.type === 'error' ? <Icons.AlertCircle size={16} /> :
             <Icons.AlertTriangle size={16} />}
            {localToast.message}
            <button onClick={() => setLocalToast(null)} className="ml-2 hover:opacity-70">
              <Icons.X size={14} />
            </button>
          </div>
        )}

        {/* Loading Overlay (only for saving/importing, not errors) */}
        {isBusy && (
          <div className="absolute inset-0 bg-white/60 z-40 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border text-center" style={{ borderColor: colors.primary[100] }}>
              <Icons.Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: colors.primary[500] }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: colors.primary[600] }}>
                {uploadProgress.stage === 'import' ? 'Importing Students' : 'Saving...'}
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.neutral[500] }}>{uploadProgress.status}</p>
              {uploadProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className="h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${colors.primary[500]}, ${colors.primary[600]})` }} />
                </div>
              )}
              <p className="text-xs font-medium" style={{ color: colors.neutral[600] }}>{progressPct}%</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b flex-shrink-0" style={{ borderColor: colors.primary[100] }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.primary[600] }}>
              Add Students - {batchName || `Batch #${batchId}`}
            </h2>
            <p className="text-xs" style={{ color: colors.neutral[500] }}>
              {departments.length} department(s) | {savedCount} added this session
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-blue-50 transition-colors" disabled={isBusy}>
            <Icons.X size={20} style={{ color: colors.neutral[500] }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: colors.primary[100] }}>
          {['single', 'import'].map(tab => (
            <button key={tab}
              onClick={() => !isBusy && setActiveTab(tab)}
              disabled={isBusy}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 -mb-[1px]' : 'text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab ? { borderBottomColor: colors.primary[500], color: colors.primary[600] } : {}}>
              {tab === 'single' ? <><Icons.UserPlus size={16} className="inline mr-2" />Single Student</> :
                <><Icons.FileSpreadsheet size={16} className="inline mr-2" />Import from Excel</>}
            </button>
          ))}
        </div>

        {/* ===== SINGLE STUDENT TAB ===== */}
        {activeTab === 'single' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">Department <span className="text-red-500">*</span></label>
                {loadingDepts ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.Loader2 size={12} className="animate-spin" /> Loading...</div>
                ) : (
                  <select value={form.departmentId}
                    onChange={e => handleChange('departmentId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.departmentId ? 'border-red-300 bg-red-50' : 'border-gray-300'} ${isBusy ? 'opacity-50' : ''}`}
                    disabled={isBusy}>
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id.toString()}>{d.name} {d.code ? `(${d.code})` : ''}</option>
                    ))}
                  </select>
                )}
                {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId}</p>}
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'name', label: 'Name', type: 'text', placeholder: 'Full name' },
                  { field: 'phone', label: 'Phone', type: 'text', placeholder: '10-digit number' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1 text-gray-700">{label} <span className="text-red-500">*</span></label>
                    <input type={type} value={form[field]}
                      onChange={e => handleChange(field, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'} ${isBusy ? 'opacity-50' : ''}`}
                      placeholder={placeholder} disabled={isBusy} />
                    {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              {/* Email & Roll No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
                  { field: 'rollNo', label: 'Roll No', type: 'text', placeholder: 'Roll number' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1 text-gray-700">{label} <span className="text-red-500">*</span></label>
                    <input type={type} value={form[field]}
                      onChange={e => handleChange(field, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'} ${isBusy ? 'opacity-50' : ''}`}
                      placeholder={placeholder} disabled={isBusy} />
                    {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">Address</label>
                <input type="text" value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isBusy ? 'opacity-50' : ''}`}
                  placeholder="Address" disabled={isBusy} />
              </div>

              {/* Enrollment No & Exam Roll No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'enrollmentNo', label: 'Enrollment No', placeholder: 'Enrollment number' },
                  { field: 'examRollNumber', label: 'Exam Roll No', placeholder: 'Exam roll number' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1 text-gray-700">{label}</label>
                    <input type="text" value={form[field]}
                      onChange={e => handleChange(field, e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isBusy ? 'opacity-50' : ''}`}
                      placeholder={placeholder} disabled={isBusy} />
                  </div>
                ))}
              </div>

              {/* DOB, Gender, Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth}
                    onChange={e => handleChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isBusy ? 'opacity-50' : ''}`}
                    disabled={isBusy} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">Gender</label>
                  <select value={form.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isBusy ? 'opacity-50' : ''}`}
                    disabled={isBusy}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">Blood Group</label>
                  <input type="text" value={form.bloodGroup}
                    onChange={e => handleChange('bloodGroup', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isBusy ? 'opacity-50' : ''}`}
                    placeholder="e.g., A+" disabled={isBusy} />
                </div>
              </div>

              {/* Guardian Information */}
              <div className="border-t pt-4" style={{ borderColor: colors.primary[100] }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: colors.primary[600] }}>Guardian Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['guardianName', 'guardianContact', 'guardianEmail', 'emergencyContact'].map(field => (
                    <div key={field}>
                      <label className="block text-xs font-medium mb-1 text-gray-700 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input type={field.includes('Email') ? 'email' : 'text'} value={form[field]}
                        onChange={e => handleChange(field, e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isBusy ? 'opacity-50' : ''}`}
                        placeholder={field.replace(/([A-Z])/g, ' $1').trim()} disabled={isBusy} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between px-4 sm:px-6 py-4 border-t flex-shrink-0 bg-gray-50" style={{ borderColor: colors.primary[100] }}>
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors" disabled={isBusy}>
                Cancel
              </button>
              <div className="flex gap-3">
                <button onClick={() => saveStudent(false)} disabled={isBusy}
                  className="px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? <><Icons.Loader2 size={16} className="animate-spin" /> Saving...</> : <><Icons.Save size={16} /> Save & Add Next</>}
                </button>
                <button onClick={() => saveStudent(true)} disabled={isBusy}
                  className="px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  <Icons.CheckCircle size={16} /> Save & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== IMPORT TAB ===== */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: colors.info.light }}>
              <div className="flex items-start gap-3">
                <Icons.Info size={20} style={{ color: colors.info.main }} />
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: colors.info.main }}>Import from Excel</h3>
                  <p className="text-xs mt-1" style={{ color: colors.neutral[600] }}>
                    Required: <strong>Name</strong>.
                    {departments.length > 0 && <span> Auto-assigns to <strong>{departments[0].name}</strong> if missing.</span>}
                  </p>
                  <button onClick={downloadTemplate} disabled={isBusy}
                    className="mt-2 text-xs flex items-center gap-1 underline hover:no-underline" style={{ color: colors.info.main }}>
                    <Icons.Download size={12} /> Download Template
                  </button>
                </div>
              </div>
            </div>

            <div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" id="excelFileInput" disabled={isBusy} />
              <label htmlFor="excelFileInput"
                className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl transition-all ${isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-blue-50 hover:border-blue-300'}`}
                style={{ borderColor: isBusy ? colors.neutral[300] : colors.primary[200] }}>
                {isBusy ? <Icons.Loader2 size={32} className="animate-spin" style={{ color: colors.primary[400] }} /> :
                  <Icons.Upload size={32} style={{ color: colors.primary[400] }} />}
                <span className="text-sm font-medium" style={{ color: colors.primary[600] }}>
                  {fileName || 'Click to select Excel file (.xlsx, .xls, .csv)'}
                </span>
              </label>
            </div>

            {importErrors.length > 0 && (
              <div className="p-3 rounded-lg max-h-32 overflow-y-auto" style={{ backgroundColor: colors.error.light }}>
                {importErrors.map((e, i) => (
                  <p key={i} className={`text-xs flex items-start gap-1 ${e.startsWith('✅') ? 'text-green-600 font-medium' : 'text-red-600'}`}>
                    <Icons.AlertCircle size={12} className="inline mt-0.5 flex-shrink-0" /> {e}
                  </p>
                ))}
              </div>
            )}

            {showPreview && students.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: colors.neutral[700] }}>
                    {filteredStudents.length} of {students.length} students
                  </h3>
                  <div className="relative">
                    <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2" size={12} style={{ color: colors.neutral[400] }} />
                    <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)}
                      className="w-48 pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500" placeholder="Search..." disabled={isBusy} />
                  </div>
                </div>

                <div className="overflow-auto max-h-[35vh] border rounded-xl" style={{ borderColor: colors.primary[100] }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10" style={{ backgroundColor: colors.primary[50] }}>
                      <tr>
                        {['#', 'Name', 'Email', 'Phone', 'Roll No', 'Dept', 'Gender', ''].map(h => (
                          <th key={h} className="px-2 py-2 text-left font-semibold" style={{ color: colors.primary[700] }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, i) => (
                        <tr key={s.id} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: `1px solid ${colors.primary[100]}` }}>
                          <td className="px-2 py-1.5 text-center" style={{ color: colors.neutral[400] }}>{i + 1}</td>
                          <td className="px-1 py-1"><input value={s.name} onChange={e => handleStudentChange(s.id, 'name', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs" disabled={isBusy} /></td>
                          <td className="px-1 py-1"><input value={s.email} onChange={e => handleStudentChange(s.id, 'email', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs" disabled={isBusy} /></td>
                          <td className="px-1 py-1"><input value={s.phone} onChange={e => handleStudentChange(s.id, 'phone', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs" disabled={isBusy} /></td>
                          <td className="px-1 py-1"><input value={s.rollNo} onChange={e => handleStudentChange(s.id, 'rollNo', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs" disabled={isBusy} /></td>
                          <td className="px-1 py-1 min-w-[100px]">
                            <select value={s.departmentId || ''} onChange={e => handleStudentChange(s.id, 'departmentId', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs" disabled={isBusy}>
                              <option value="">--</option>
                              {departments.map(d => <option key={d.id} value={d.id.toString()}>{d.name}</option>)}
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <select value={s.gender} onChange={e => handleStudentChange(s.id, 'gender', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs" disabled={isBusy}>
                              <option value="">-</option>
                              <option value="Male">M</option>
                              <option value="Female">F</option>
                            </select>
                          </td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => removeStudent(s.id)} className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors" disabled={isBusy}>
                              <Icons.Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors" disabled={isBusy}>
                    Cancel
                  </button>
                  <button onClick={handleImportStudents} disabled={isBusy || students.length === 0}
                    className="flex-1 px-4 py-2 text-white rounded-xl text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {importing ? <><Icons.Loader2 size={16} className="animate-spin" /> Importing...</> :
                      <><Icons.FileSpreadsheet size={16} /> Import {students.filter(s => s.name?.trim()).length} Students</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}