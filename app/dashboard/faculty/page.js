'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePermissions } from '@/hooks/usePermissions';
import FacultyFormModal from '@/components/faculty/FacultyFormModal';

// ==================== BADGE ====================
function Badge({ children, variant = 'default' }) {
  const v = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    slate: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${v[variant] || v.default}`}>
      {children}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Icons.Loader2 className="w-8 h-8 animate-spin text-slate-500" />
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <Icons.Users className="w-14 h-14 mx-auto mb-4 text-slate-300" />
      <p className="text-lg font-medium text-slate-500">
        {hasFilters ? 'No faculty match your filters' : 'No faculty found'}
      </p>
      {hasFilters && <p className="text-sm mt-1">Try adjusting your search criteria</p>}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md p-8 bg-red-50 rounded-xl border border-red-200">
        <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2 text-red-600">Access Denied</h2>
        <p className="text-red-500">You don't have permission to view faculty.</p>
      </div>
    </div>
  );
}

// ==================== MAIN ====================
export default function Faculty() {
  const { data: session } = useSession();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const hasReadPermission = can('faculty', 'read');
  const hasCreatePermission = can('faculty', 'create');
  const hasUpdatePermission = can('faculty', 'update');
  const hasDeletePermission = can('faculty', 'delete');

  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Import
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef(null);

  const showMessage = useCallback((type, title, text) => {
    setMessage({ type, title, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // ==================== FETCH ====================
  const fetchFaculty = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '1000' });
      const res = await fetch(`/api/faculty?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setFaculty(data.faculty || []);
    } catch (err) {
      showMessage('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => { if (hasReadPermission) fetchFaculty(); }, [hasReadPermission]);

  // ==================== CLIENT-SIDE FILTERING ====================
  useEffect(() => {
    let result = [...faculty];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(f =>
        f.name?.toLowerCase().includes(s) ||
        f.email?.toLowerCase().includes(s) ||
        f.phone?.toLowerCase().includes(s) ||
        f.designation?.toLowerCase().includes(s) ||
        f.specialization?.toLowerCase().includes(s)
      );
    }

    if (selectedStatus !== 'all') {
      result = result.filter(f => f.status === selectedStatus);
    }

    if (selectedDesignation !== 'all') {
      result = result.filter(f => f.designation === selectedDesignation);
    }

    setFilteredFaculty(result);
  }, [faculty, search, selectedStatus, selectedDesignation]);

  // ==================== CRUD ====================
  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/faculty', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Created', 'Faculty created successfully');
      setShowAddModal(false);
      fetchFaculty();
    } catch (err) { showMessage('error', 'Error', err.message); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (formData) => {
    if (!selectedFaculty) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/faculty/${selectedFaculty.id}`, { method: 'PUT', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Updated', 'Faculty updated');
      setShowEditModal(false);
      setSelectedFaculty(null);
      fetchFaculty();
    } catch (err) { showMessage('error', 'Error', err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedFaculty) return;
    try {
      const res = await fetch(`/api/faculty/${selectedFaculty.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showMessage('success', 'Deleted', 'Faculty deleted');
      setShowDeleteModal(false);
      setSelectedFaculty(null);
      fetchFaculty();
    } catch (err) { showMessage('error', 'Error', err.message); }
  };

  // ==================== EXPORT ====================
  const handleExport = () => {
    const data = filteredFaculty.length > 0 ? filteredFaculty : faculty;
    if (!data.length) { showMessage('error', 'No Data', 'Nothing to export'); return; }

    const exportData = data.map((f, i) => ({
      'S.No': i + 1,
      'Name': f.name || '',
      'Email': f.email || '',
      'Phone': f.phone || '',
      'Designation': f.designation || '',
      'Qualification': f.qualification || '',
      'Specialization': f.specialization || '',
      'Address': f.address || '',
      'Status': f.status || '',
      'Joined Date': f.joinedDate ? new Date(f.joinedDate).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [6,25,30,15,25,20,25,30,12,15].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty');
    XLSX.writeFile(wb, `faculty_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    showMessage('success', 'Exported', `${data.length} faculty exported`);
  };

  // ==================== TEMPLATE ====================
  const downloadTemplate = () => {
    const templateData = [
      { 'Name': 'John Doe', 'Email': 'john@example.com', 'Phone': '9801234567', 'Designation': 'Professor', 'Qualification': 'PhD in CS', 'Specialization': 'AI', 'Address': 'Kathmandu', 'Status': 'active', 'Joined Date': '2024-01-15' },
      { 'Name': 'Jane Smith', 'Email': 'jane@example.com', 'Phone': '9801234568', 'Designation': 'Associate Professor', 'Qualification': 'PhD in Math', 'Specialization': 'Statistics', 'Address': 'Lalitpur', 'Status': 'active', 'Joined Date': '2023-06-01' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [25,30,15,25,30,30,30,12,15].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'faculty_import_template.xlsx');
    showMessage('success', 'Downloaded', 'Template downloaded');
  };

  // ==================== IMPORT ====================
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportErrors([]);
    setImportData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wb = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (!json.length) { setImportErrors(['No data found']); return; }

        const errors = [];
        const parsed = json.map((row, i) => {
          const f = {
            id: Date.now() + i,
            name: String(row['Name'] || row['name'] || '').trim(),
            email: String(row['Email'] || row['email'] || '').trim().toLowerCase(),
            phone: String(row['Phone'] || row['phone'] || '').replace(/\D/g, ''),
            designation: String(row['Designation'] || row['designation'] || '').trim(),
            qualification: String(row['Qualification'] || row['qualification'] || '').trim(),
            specialization: String(row['Specialization'] || row['specialization'] || '').trim(),
            address: String(row['Address'] || row['address'] || '').trim(),
            status: String(row['Status'] || row['status'] || 'active').trim().toLowerCase(),
            joinedDate: String(row['Joined Date'] || row['joinedDate'] || '').trim(),
          };
          const rn = i + 2;
          if (!f.name) errors.push(`Row ${rn}: Name required`);
          if (!f.email) errors.push(`Row ${rn}: Email required`);
          if (!f.phone || f.phone.length < 10) errors.push(`Row ${rn}: Valid phone required`);
          return f;
        }).filter(f => f.name && f.email && f.phone.length >= 10);

        setImportData(parsed);
        setImportErrors(errors);
      } catch (err) { setImportErrors(['Parse error: ' + err.message]); }
    };
    reader.onerror = () => setImportErrors(['Failed to read file']);
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (!importData.length) { setImportErrors(['No valid data']); return; }
    setImporting(true);
    setImportProgress({ current: 0, total: importData.length });

    let success = 0, failed = 0;
    for (let i = 0; i < importData.length; i++) {
      setImportProgress({ current: i + 1, total: importData.length });
      const f = importData[i];
      try {
        const fd = new FormData();
        fd.append('name', f.name); fd.append('email', f.email); fd.append('phone', f.phone);
        if (f.designation) fd.append('designation', f.designation);
        if (f.qualification) fd.append('qualification', f.qualification);
        if (f.specialization) fd.append('specialization', f.specialization);
        if (f.address) fd.append('address', f.address);
        if (f.status) fd.append('status', f.status);
        if (f.joinedDate) fd.append('joinedDate', f.joinedDate);
        const res = await fetch('/api/faculty', { method: 'POST', body: fd });
        if (res.ok) success++; else failed++;
      } catch { failed++; }
    }

    showMessage(success > 0 ? 'success' : 'error', 'Import Complete', `${success} imported${failed ? `, ${failed} failed` : ''}`);
    setImporting(false);
    if (success > 0) { setShowImportModal(false); setImportData([]); setImportFileName(''); fetchFaculty(); }
  };

  // ==================== HELPERS ====================
  const getStatusStyle = (s) => ({
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    on_leave: 'bg-blue-50 text-blue-700 border-blue-200',
    retired: 'bg-slate-100 text-slate-500 border-slate-200',
  }[s] || 'bg-slate-100 text-slate-600 border-slate-200');

  const getStatusDot = (s) => ({
    active: 'bg-emerald-500', inactive: 'bg-slate-400', on_leave: 'bg-blue-500', retired: 'bg-slate-400',
  }[s] || 'bg-slate-400');

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  // ==================== RENDER ====================
  if (permissionsLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <div className="h-16 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!hasReadPermission) return <AccessDenied />;

  return (
    <div className="space-y-4 px-4 lg:px-6 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <nav className="flex items-center gap-1.5 mb-2">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
            <Icons.Home className="w-3.5 h-3.5" />Dashboard
          </Link>
          <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <Icons.Users className="w-3.5 h-3.5" />Faculty Management
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Faculty Management</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium mt-1">
              <Icons.Users className="w-3 h-3" />{filteredFaculty.length} of {faculty.length} faculty
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={fetchFaculty} className="btn-secondary">
              <Icons.RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
            <button onClick={handleExport} className="btn-slate">
              <Icons.Download className="w-3.5 h-3.5" />Export
            </button>
            <button onClick={downloadTemplate} className="btn-outline">
              <Icons.FileSpreadsheet className="w-3.5 h-3.5" />Template
            </button>
            {hasCreatePermission && (
              <>
                <button onClick={() => setShowImportModal(true)} className="btn-indigo">
                  <Icons.Upload className="w-3.5 h-3.5" />Import
                </button>
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  <Icons.Plus className="w-3.5 h-3.5" />Add Faculty
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search name, email, phone..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
          </div>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Status</option>
            <option value="active">Active</option><option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option><option value="retired">Retired</option>
          </select>
          <select value={selectedDesignation} onChange={e => setSelectedDesignation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Senior Lecturer">Senior Lecturer</option>
            <option value="Teaching Assistant">Teaching Assistant</option>
          </select>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border-l-4"
            style={{ backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2', borderLeftColor: message.type === 'success' ? '#22c55e' : '#ef4444' }}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <Icons.CheckCircle className="w-5 h-5 text-emerald-500" /> : <Icons.AlertCircle className="w-5 h-5 text-red-500" />}
              <div><span className="font-semibold text-sm block text-slate-800">{message.title}</span><p className="text-xs text-slate-600">{message.text}</p></div>
              <button onClick={() => setMessage(null)}><Icons.X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Faculty Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? <LoadingSpinner /> : filteredFaculty.length === 0 ? (
          <EmptyState hasFilters={!!(search || selectedStatus !== 'all' || selectedDesignation !== 'all')} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-left">Faculty</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-left">phone</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-left">Contact</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFaculty.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {f.profilePicture ? (
                            <img src={f.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-slate-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {f.name?.charAt(0) || 'F'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{f.name}</p>
                            {f.specialization && <p className="text-xs text-slate-400">{f.specialization}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{f.phone || 'N/A'}</p>
                        {f.qualification && <p className="text-xs text-slate-400">{f.qualification}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p className="text-slate-600">{f.email}</p>
                          <p className="text-slate-400">{f.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(f.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(f.status)}`} />
                          {f.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedFaculty(f); setShowViewModal(true); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View">
                            <Icons.Eye className="w-4 h-4" />
                          </button>
                          {hasUpdatePermission && (
                            <button onClick={() => { setSelectedFaculty(f); setShowEditModal(true); }}
                              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
                              <Icons.Edit className="w-4 h-4" />
                            </button>
                          )}
                          {hasDeletePermission && (
                            <button onClick={() => { setSelectedFaculty(f); setShowDeleteModal(true); }}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                              <Icons.Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {filteredFaculty.map(f => (
                <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    {f.profilePicture ? (
                      <img src={f.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-slate-600 flex items-center justify-center text-white text-lg font-bold">
                        {f.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{f.name}</h3>
                      <p className="text-xs text-slate-500">{f.designation}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(f.status)}`}>
                      <span className={`w-1 h-1 rounded-full mr-1 ${getStatusDot(f.status)}`} />
                      {f.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="text-slate-600">{f.email}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="text-slate-600">{f.phone}</span></div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => { setSelectedFaculty(f); setShowViewModal(true); }}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">View</button>
                    {hasUpdatePermission && (
                      <button onClick={() => { setSelectedFaculty(f); setShowEditModal(true); }}
                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Edit</button>
                    )}
                    {hasDeletePermission && (
                      <button onClick={() => { setSelectedFaculty(f); setShowDeleteModal(true); }}
                        className="py-2 px-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer info */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Showing {filteredFaculty.length} of {faculty.length} faculty members
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <FacultyFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleCreate} initialData={null} loading={formLoading} />
      <FacultyFormModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedFaculty(null); }} onSubmit={handleUpdate} initialData={selectedFaculty} loading={formLoading} />

      {/* View Modal */}
      {showViewModal && selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowViewModal(false)}>
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">Faculty Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                {selectedFaculty.profilePicture ? (
                  <img src={selectedFaculty.profilePicture} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-slate-600 flex items-center justify-center text-white text-2xl font-bold">{selectedFaculty.name?.charAt(0)}</div>
                )}
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{selectedFaculty.name}</h4>
                  <p className="text-slate-500">{selectedFaculty.designation}</p>
                  <Badge variant="success">{selectedFaculty.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-400">Email</label><p className="font-medium text-slate-700">{selectedFaculty.email}</p></div>
                <div><label className="text-xs text-slate-400">Phone</label><p className="font-medium text-slate-700">{selectedFaculty.phone}</p></div>
                <div><label className="text-xs text-slate-400">Qualification</label><p className="text-slate-600">{selectedFaculty.qualification || 'N/A'}</p></div>
                <div><label className="text-xs text-slate-400">Specialization</label><p className="text-slate-600">{selectedFaculty.specialization || 'N/A'}</p></div>
                <div><label className="text-xs text-slate-400">Joined Date</label><p className="text-slate-600">{formatDate(selectedFaculty.joinedDate)}</p></div>
                <div><label className="text-xs text-slate-400">Address</label><p className="text-slate-600">{selectedFaculty.address || 'N/A'}</p></div>
              </div>
              {selectedFaculty.cv && (
                <a href={selectedFaculty.cv} target="_blank" className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:underline">
                  <Icons.FileText className="w-4 h-4" />View CV Document
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center"><Icons.AlertTriangle className="w-6 h-6 text-red-500" /></div>
              <div><h3 className="text-lg font-bold text-slate-800">Delete Faculty</h3><p className="text-sm text-slate-500">This cannot be undone</p></div>
            </div>
            <p className="mb-5 text-sm text-slate-600">Delete <strong>{selectedFaculty.name}</strong>? This also removes the user account.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !importing && setShowImportModal(false)}>
          <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div><h3 className="text-lg font-bold text-slate-800">Import Faculty</h3><p className="text-xs text-slate-500">Excel (.xlsx, .xls, .csv)</p></div>
              <button onClick={() => !importing && setShowImportModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {importData.length === 0 ? (
                <>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 flex items-start gap-3">
                    <Icons.Info className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-800">Instructions</h4>
                      <ul className="text-xs text-indigo-700 mt-1 space-y-1">
                        <li>Required: <strong>Name</strong>, <strong>Email</strong>, <strong>Phone</strong></li>
                        <li>Optional: Designation, Qualification, Specialization, Address, Status, Joined Date</li>
                        <li>Default password = phone number</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><Icons.FileSpreadsheet className="w-5 h-5 text-indigo-600" /></div>
                      <div><h4 className="text-sm font-semibold text-indigo-800">Template</h4><p className="text-xs text-indigo-600">Sample Excel file</p></div>
                    </div>
                    <button onClick={downloadTemplate} className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"><Icons.Download className="w-3.5 h-3.5 inline mr-1.5" />Download</button>
                  </div>

                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" id="importFile" />
                  <label htmlFor="importFile" className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center"><Icons.Upload className="w-8 h-8 text-indigo-500" /></div>
                    <div className="text-center"><p className="text-sm font-medium text-slate-600">Click to select file</p><p className="text-xs text-slate-400 mt-1">or drag and drop</p></div>
                    {importFileName && <p className="text-xs text-indigo-600 font-medium">{importFileName}</p>}
                  </label>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{importData.length} faculty ready</span>
                    <button onClick={() => { setImportData([]); setImportErrors([]); setImportFileName(''); }} className="text-red-500 text-sm hover:underline">Clear</button>
                  </div>
                  {importErrors.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg max-h-32 overflow-y-auto">
                      {importErrors.map((err, i) => <p key={i} className="text-xs text-amber-700"><Icons.AlertCircle className="w-3 h-3 inline mr-1" />{err}</p>)}
                    </div>
                  )}
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0"><tr><th className="px-3 py-2 text-left font-semibold text-slate-600">#</th><th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th><th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th><th className="px-3 py-2 text-left font-semibold text-slate-600">Phone</th><th className="px-3 py-2 text-left font-semibold text-slate-600">Designation</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {importData.map((f, i) => (
                          <tr key={f.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-700">{f.name}</td>
                            <td className="px-3 py-2 text-slate-600">{f.email}</td>
                            <td className="px-3 py-2 text-slate-600">{f.phone}</td>
                            <td className="px-3 py-2 text-slate-600">{f.designation || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500"><span>Importing...</span><span className="font-medium text-indigo-600">{importProgress.current}/{importProgress.total}</span></div>
                      <div className="w-full bg-slate-200 rounded-full h-2"><div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} /></div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50" disabled={importing}>Cancel</button>
                    <button onClick={handleImportSubmit} disabled={importing}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                      {importing ? <><Icons.Loader2 className="w-4 h-4 animate-spin" />Importing...</> : <><Icons.Upload className="w-4 h-4" />Import {importData.length}</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .btn-secondary { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 600; border-radius: 0.5rem; transition: all 0.2s; }
        .btn-secondary:hover { background: #e2e8f0; }
        .btn-slate { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; background: #475569; color: white; font-size: 0.75rem; font-weight: 600; border-radius: 0.5rem; transition: all 0.2s; }
        .btn-slate:hover { background: #334155; }
        .btn-outline { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; background: white; color: #475569; font-size: 0.75rem; font-weight: 600; border-radius: 0.5rem; border: 1px solid #cbd5e1; transition: all 0.2s; }
        .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; }
        .btn-indigo { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; background: #6366f1; color: white; font-size: 0.75rem; font-weight: 600; border-radius: 0.5rem; transition: all 0.2s; }
        .btn-indigo:hover { background: #4f46e5; }
        .btn-primary { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; background: #0f172a; color: white; font-size: 0.75rem; font-weight: 600; border-radius: 0.5rem; transition: all 0.2s; }
        .btn-primary:hover { background: #1e293b; }
      `}</style>
    </div>
  );
}