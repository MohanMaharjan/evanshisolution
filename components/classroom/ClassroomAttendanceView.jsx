// components/classroom/ClassroomAttendanceView.jsx
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

const API_URL = '/api';

const CustomModal = ({ isOpen, onClose, onConfirm, title, message, type = 'confirm' }) => {
  if (!isOpen) return null;
  const getIcon = () => {
    switch (type) {
      case 'success': return <Icons.CheckCircle className="text-green-500" size={48} />;
      case 'error': return <Icons.XCircle className="text-red-500" size={48} />;
      case 'warning': return <Icons.AlertTriangle className="text-yellow-500" size={48} />;
      default: return <Icons.HelpCircle className="text-blue-500" size={48} />;
    }
  };
  const getButtonColor = () => {
    switch (type) {
      case 'success': return 'bg-green-600 hover:bg-green-700';
      case 'error': return 'bg-red-600 hover:bg-red-700';
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700';
      default: return 'bg-slate-600 hover:bg-slate-700';
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">{getIcon()}</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-600 mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                {type === 'confirm' && <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>}
                <button onClick={async () => { if (onConfirm) await onConfirm(); onClose(); }} className={`px-4 py-2 text-white rounded-lg ${getButtonColor()}`}>{type === 'confirm' ? 'Confirm' : 'OK'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function ClassroomAttendanceView({ classroom, theme = 'slate' }) {
  const [activeTab, setActiveTab] = useState('students');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', syllabusCovered: '' });
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDate, setEditingDate] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });
  const [editingRemark, setEditingRemark] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const remarkInputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const isSlate = theme === 'slate';
  const t = {
    gradient: isSlate ? 'from-slate-500 to-slate-700' : 'from-orange-500 to-red-500',
    accent: isSlate ? 'slate' : 'orange',
    accentHover: isSlate ? 'hover:bg-slate-50' : 'hover:bg-orange-50/30',
    accentTableHeader: isSlate ? 'bg-slate-50' : 'bg-orange-50',
    accentTableHeaderText: isSlate ? 'text-slate-700' : 'text-orange-700',
    accentText: isSlate ? 'text-slate-600' : 'text-orange-600',
    accentBorder: isSlate ? 'border-slate-600' : 'border-orange-600',
  };

  // ==================== REST API HELPER (FIXED) ====================
  const api = useCallback(async (endpoint, options = {}) => {
    const fetchOptions = {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
    };

    // Only set body for methods that support it
    if (options.body) {
      fetchOptions.body = options.body;
    }

    const res = await fetch(API_URL + endpoint, fetchOptions);

    // Handle non-JSON responses
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || 'OK' };
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  }, []);

  useEffect(() => { if (successMessage) { const tmr = setTimeout(() => setSuccessMessage(null), 3000); return () => clearTimeout(tmr); } }, [successMessage]);
  useEffect(() => { if (errorMessage) { const tmr = setTimeout(() => setErrorMessage(null), 3000); return () => clearTimeout(tmr); } }, [errorMessage]);
  useEffect(() => { if (editingRemark && remarkInputRef.current) { remarkInputRef.current.focus(); } }, [editingRemark]);

  // ==================== FETCH SESSIONS ====================
  const fetchSessions = useCallback(async () => {
    try {
      const data = await api('/class-sessions?classroomId=' + classroom.id);
      setSessions(data.classSessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setErrorMessage(err.message);
    }
  }, [classroom.id, api]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ==================== ACTIVE STUDENTS ====================
  const getActiveStudentsSorted = useCallback(() => {
    const active = (classroom.students || classroom.enrolledStudents || []).filter(
      (s) => s.status === 'active' || s.enrollmentStatus === 'active'
    );
    return [...active].sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
  }, [classroom]);

  const activeStudents = useMemo(() => getActiveStudentsSorted(), [getActiveStudentsSorted]);
  const activeStudentIds = useMemo(() => new Set(activeStudents.map((s) => s.id)), [activeStudents]);

  // ==================== FILTERED ATTENDANCE DATA ====================
  const filteredAttendanceData = useMemo(() => {
    if (!sessions.length) return { students: [], sessionDates: [], sessionIsoDates: [], sessionMap: {} };
    let fs = sessions;
    if (fromDate) fs = fs.filter((s) => new Date(s.date) >= new Date(fromDate));
    if (toDate) fs = fs.filter((s) => new Date(s.date) <= new Date(toDate + 'T23:59:59'));
    const byStudent = {};
    const sessionMap = {};
    fs.forEach((session) => {
      const dateStr = new Date(session.date).toLocaleDateString();
      sessionMap[dateStr] = session.id;
      (session.attendances || []).forEach((att) => {
        if (!activeStudentIds.has(att.studentId)) return;
        if (!byStudent[att.studentId]) {
          const st = activeStudents.find((s) => s.id === att.studentId);
          byStudent[att.studentId] = { studentId: att.studentId, studentName: st?.name || 'Unknown', rollNumber: st?.rollNo || '-', attendances: {}, remarks: {}, attendanceIds: {}, presentCount: 0, totalSessions: 0 };
        }
        byStudent[att.studentId].attendances[dateStr] = att.status;
        byStudent[att.studentId].remarks[dateStr] = att.remarks || '';
        byStudent[att.studentId].attendanceIds[dateStr] = att.id;
        byStudent[att.studentId].totalSessions++;
        if (att.status === 'present') byStudent[att.studentId].presentCount++;
      });
    });
    const sDates = [...new Set(fs.map((s) => new Date(s.date).toLocaleDateString()))].sort((a, b) => new Date(a) - new Date(b));
    const sIso = [...new Set(fs.map((s) => new Date(s.date).toISOString().split('T')[0]))].sort();
    const stats = Object.values(byStudent).map((s) => ({ ...s, percentage: s.totalSessions > 0 ? (s.presentCount / s.totalSessions) * 100 : 0 }));
    activeStudents.forEach((s) => { if (!byStudent[s.id]) stats.push({ studentId: s.id, studentName: s.name, rollNumber: s.rollNo || '-', attendances: {}, remarks: {}, attendanceIds: {}, presentCount: 0, totalSessions: 0, percentage: 0 }); });
    stats.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    return { students: stats, sessionDates: sDates, sessionIsoDates: sIso, sessionMap };
  }, [sessions, fromDate, toDate, activeStudents, activeStudentIds]);

  const filteredStudents = useMemo(() => {
    const q = attendanceSearchQuery.toLowerCase().trim();
    if (!q) return filteredAttendanceData.students;
    return filteredAttendanceData.students.filter((s) => (s.studentName || '').toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q));
  }, [filteredAttendanceData.students, attendanceSearchQuery]);

  const dailySummary = useMemo(() => {
    const summary = {};
    filteredAttendanceData.sessionDates.forEach((date) => {
      let present = 0, absent = 0;
      filteredStudents.forEach((student) => { const status = student.attendances[date]; if (status === 'present') present++; else if (status === 'absent') absent++; });
      summary[date] = { present, absent, total: present + absent };
    });
    return summary;
  }, [filteredStudents, filteredAttendanceData.sessionDates]);

  const isValidDate = (dateStr) => { if (!dateStr) return false; const selectedDate = new Date(dateStr + 'T00:00:00'); const today = new Date(); today.setHours(0, 0, 0, 0); return selectedDate <= today; };

  const initializeAttendanceList = useCallback(() => {
    setStudentAttendance(getActiveStudentsSorted().map((s) => ({ studentId: s.id, studentName: s.name, rollNumber: s.rollNo || s.rollNumber, status: 'present', remarks: '' })));
  }, [getActiveStudentsSorted]);

  const handleEditSession = useCallback((isoDate) => {
    const session = sessions.find((s) => new Date(s.date).toISOString().split('T')[0] === isoDate);
    if (!session) return;
    setEditingSessionId(session.id);
    setIsEditMode(true);
    setEditingDate(new Date(isoDate).toLocaleDateString());
    const list = (session.attendances || []).map((att) => {
      const student = activeStudents.find((s) => s.id === att.studentId);
      return { studentId: att.studentId, studentName: student?.name || 'Unknown', rollNumber: student?.rollNo || '-', status: att.status, remarks: att.remarks || '' };
    });
    activeStudents.forEach((s) => { if (!list.find((l) => l.studentId === s.id)) list.push({ studentId: s.id, studentName: s.name, rollNumber: s.rollNo || s.rollNumber, status: 'present', remarks: '' }); });
    list.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    setStudentAttendance(list);
    setAttendanceForm({ date: isoDate, startTime: '', endTime: '', syllabusCovered: session.syllabusCovered || '' });
    setShowAttendanceModal(true);
  }, [sessions, activeStudents]);

  const handleDeleteSession = useCallback(async (isoDate, displayDate) => {
    const session = sessions.find((s) => new Date(s.date).toISOString().split('T')[0] === isoDate);
    if (!session?.id) return;
    setModal({ isOpen: true, type: 'warning', title: 'Delete Session', message: `Delete attendance for ${displayDate}?`, onConfirm: async () => {
      try { await api('/class-sessions/' + session.id, { method: 'DELETE' }); setSuccessMessage('Deleted!'); fetchSessions(); } catch (err) { setErrorMessage(err.message); }
    }});
  }, [api, sessions, fetchSessions]);

  const handleStatusClick = (studentId, date, currentStatus) => {
    if (currentStatus === 'absent') { setEditingRemark({ studentId, date }); const student = filteredStudents.find((s) => s.studentId === studentId); setRemarkText(student?.remarks[date] || ''); }
  };

  const saveInlineRemark = async () => {
    if (!editingRemark) return;
    const { studentId, date } = editingRemark;
    const sessionId = filteredAttendanceData.sessionMap[date];
    if (!sessionId) { setErrorMessage('Session not found'); return; }
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) { setErrorMessage('Session not found'); return; }
      const updatedAttendances = (session.attendances || []).map((att) => ({
        studentId: att.studentId, status: att.status,
        remarks: att.studentId === studentId ? remarkText : att.remarks || '',
      }));
      await api('/class-sessions/' + sessionId, { method: 'PUT', body: JSON.stringify({ attendances: updatedAttendances, date, title: session.title || `Session - ${date}` }) });
      setSuccessMessage('Remark saved!');
      setEditingRemark(null); setRemarkText('');
      fetchSessions();
    } catch (err) { setErrorMessage(err.message); }
  };

  const cancelInlineRemark = () => { setEditingRemark(null); setRemarkText(''); };

  const saveAttendance = async () => {
    if (!attendanceForm.date) { setErrorMessage('Please select a date'); return; }
    if (!isValidDate(attendanceForm.date)) { setErrorMessage('Cannot mark attendance for future dates'); return; }
    setSubmitting(true);
    try {
      const d = new Date(attendanceForm.date).toISOString().split('T')[0];
      const body = {
        date: d,
        startTime: attendanceForm.startTime || null,
        endTime: attendanceForm.endTime || null,
        syllabusCovered: attendanceForm.syllabusCovered || '',
        title: `Session - ${new Date(d).toLocaleDateString()}`,
        classroomId: classroom.id,
        facultyId: classroom.facultyId,
        attendances: studentAttendance.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
      };

      if (isEditMode && editingSessionId) {
        await api('/class-sessions/' + editingSessionId, { method: 'PUT', body: JSON.stringify(body) });
        setSuccessMessage('Attendance updated!');
      } else {
        await api('/class-sessions', { method: 'POST', body: JSON.stringify(body) });
        setSuccessMessage('Attendance marked!');
      }

      setShowAttendanceModal(false);
      resetForm();
      fetchSessions();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => { setAttendanceForm({ date: todayStr, startTime: '', endTime: '', syllabusCovered: '' }); setIsEditMode(false); setEditingSessionId(null); setEditingDate(''); setStudentAttendance([]); };

  const toggleAttendance = (sid) => setStudentAttendance((prev) => prev.map((s) => s.studentId === sid ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s));
  const markAllPresent = () => setStudentAttendance((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  const markAllAbsent = () => setStudentAttendance((prev) => prev.map((s) => ({ ...s, status: 'absent' })));
  const updateRemarks = (sid, r) => setStudentAttendance((prev) => prev.map((s) => s.studentId === sid ? { ...s, remarks: r } : s));

  const exportCSV = () => {
    if (!filteredStudents.length || !filteredAttendanceData.sessionDates.length) { setErrorMessage('No data'); return; }
    const h = ['Student', 'Roll No', ...filteredAttendanceData.sessionDates.flatMap((d) => [`${d} Status`, `${d} Remarks`]), 'Present', 'Total', '%'];
    const rows = filteredStudents.map((st) => {
      let pc = 0;
      const sts = filteredAttendanceData.sessionDates.flatMap((d) => { const status = st.attendances[d]; const remark = st.remarks[d] || ''; if (status === 'present') { pc++; return ['P', remark]; } return ['A', remark]; });
      return [st.studentName, st.rollNumber || '-', ...sts, pc, st.totalSessions, st.percentage.toFixed(1)];
    });
    const csv = [h, ...rows].map((r) => r.join(',')).join('\n');
    const b = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `attendance_${classroom.name}_${new Date().toLocaleDateString()}.csv`; a.click();
    setSuccessMessage('Exported!');
  };

  const getStatusBadge = (p) => { if (p >= 75) return 'bg-green-100 text-green-800'; if (p >= 60) return 'bg-yellow-100 text-yellow-800'; if (p >= 40) return 'bg-orange-100 text-orange-800'; return 'bg-red-100 text-red-800'; };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6 pb-6">
      <AnimatePresence>
        {successMessage && (<motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="fixed top-20 right-6 z-50 bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-lg shadow-lg"><div className="flex items-center gap-2"><Icons.CheckCircle size={20} className="text-green-500" /><span className="font-medium">{successMessage}</span><button onClick={() => setSuccessMessage(null)} className="ml-auto"><Icons.X size={16} /></button></div></motion.div>)}
      </AnimatePresence>
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="fixed top-20 right-6 z-50 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg shadow-lg"><div className="flex items-center gap-2"><Icons.AlertCircle size={20} className="text-red-500" /><span className="font-medium">{errorMessage}</span><button onClick={() => setErrorMessage(null)} className="ml-auto"><Icons.X size={16} /></button></div></motion.div>)}
      </AnimatePresence>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className={`bg-gradient-to-r ${t.gradient} px-6 py-6`}>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div><h1 className="text-3xl font-bold text-white">{classroom.name}</h1><p className="text-white/80 text-lg">{classroom.course?.name || 'No Course'}</p>{classroom.course?.code && <p className="text-white/60 text-sm">Code: {classroom.course.code}</p>}</div>
            <div className="flex gap-3"><button onClick={() => { resetForm(); initializeAttendanceList(); setShowAttendanceModal(true); }} className="px-4 py-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 font-medium flex items-center gap-2 shadow-md"><Icons.CheckSquare size={18} /> Take Attendance</button></div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ icon: Icons.User, color: 'bg-blue-100 text-blue-600', label: 'Faculty', value: classroom.faculty?.name || 'N/A' },{ icon: Icons.GraduationCap, color: 'bg-green-100 text-green-600', label: 'Batch', value: classroom.batch?.name || 'N/A' },{ icon: Icons.Users, color: 'bg-purple-100 text-purple-600', label: 'Students', value: activeStudents.length },{ icon: Icons.Calendar, color: 'bg-amber-100 text-amber-600', label: 'Sessions', value: sessions.length }].map((s, i) => (<div key={i} className="flex items-center gap-3"><div className={`w-12 h-12 ${s.color.split(' ')[0]} rounded-xl flex items-center justify-center`}><s.icon size={22} className={s.color.split(' ')[1]} /></div><div><p className="text-xs text-slate-500">{s.label}</p><p className="font-semibold">{s.value}</p></div></div>))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b px-6"><div className="flex gap-8">{[{ id: 'students', icon: Icons.Users, label: 'Students', count: activeStudents.length },{ id: 'attendance', icon: Icons.Clipboard, label: 'Attendance Report' }].map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === tab.id ? `${t.accentText} ${t.accentBorder}` : 'text-slate-500 border-transparent hover:text-slate-700'}`}><tab.icon size={16} /> {tab.label} {tab.count !== undefined && `(${tab.count})`}</button>))}</div></div>
        <div className="p-6">
          {activeTab === 'students' && (
            <div>
              {activeStudents.length > 0 ? (
                <div className="overflow-x-auto"><table className="w-full"><thead className={t.accentTableHeader}><tr>{['Roll No','Name','Email','Status'].map((h) => (<th key={h} className={`text-left py-3 px-4 text-sm font-semibold ${t.accentTableHeaderText}`}>{h}</th>))}</tr></thead><tbody>{activeStudents.map((s) => (<tr key={s.id} className={`border-b ${t.accentHover}`}><td className="py-3 px-4 text-sm font-mono">{s.rollNo || s.rollNumber || '-'}</td><td className="py-3 px-4 font-medium">{s.name}</td><td className="py-3 px-4 text-sm">{s.email}</td><td className="py-3 px-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span></td></tr>))}</tbody></table></div>
              ) : (<div className="text-center py-12"><Icons.Users size={48} className="text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No active students enrolled.</p></div>)}
            </div>
          )}
          {activeTab === 'attendance' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"><h3 className="text-lg font-semibold">Attendance Report</h3><button onClick={exportCSV} disabled={!filteredStudents.length} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"><Icons.Download size={18} /> Export</button></div>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[150px]"><label className="block text-sm font-medium text-slate-700 mb-1">From</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={todayStr} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div className="flex-1 min-w-[150px]"><label className="block text-sm font-medium text-slate-700 mb-1">To</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} max={todayStr} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <button onClick={() => { setFromDate(''); setToDate(''); }} className="px-4 py-2 text-slate-600 border rounded-lg hover:bg-slate-100"><Icons.X size={16} /> Clear</button>
                </div>
                <div className="mt-4 relative"><Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search student..." value={attendanceSearchQuery} onChange={(e) => setAttendanceSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500" /></div>
              </div>
              {filteredAttendanceData.sessionDates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className={t.accentTableHeader}><tr><th className={`text-left py-3 px-4 text-sm font-semibold border-b ${t.accentTableHeaderText}`}>Student</th><th className={`text-left py-3 px-4 text-sm font-semibold border-b ${t.accentTableHeaderText}`}>Roll No</th>{filteredAttendanceData.sessionDates.map((date, i) => (<th key={date} className={`text-center py-2 px-2 text-xs font-semibold border-b min-w-[160px] ${t.accentTableHeaderText}`}><div className="flex flex-col items-center gap-2"><span>{new Date(filteredAttendanceData.sessionIsoDates[i]).getDate()}/{new Date(filteredAttendanceData.sessionIsoDates[i]).getMonth() + 1}</span><div className="flex items-center gap-1.5"><button onClick={(e) => { e.stopPropagation(); handleEditSession(filteredAttendanceData.sessionIsoDates[i]); }} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 border border-blue-200"><Icons.Edit2 size={11} /> Edit</button><button onClick={(e) => { e.stopPropagation(); handleDeleteSession(filteredAttendanceData.sessionIsoDates[i], date); }} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-50 text-red-700 rounded-md hover:bg-red-100 border border-red-200"><Icons.Trash2 size={11} /> Del</button></div></div></th>))}<th className="text-center py-3 px-3 text-sm font-semibold border-b bg-blue-50">Total</th><th className="text-center py-3 px-3 text-sm font-semibold border-b bg-green-50">%</th></tr></thead>
                    <tbody>{filteredStudents.map((student) => { let pc = 0; return (<tr key={student.studentId} className={`border-b ${t.accentHover}`}><td className="py-3 px-4 font-medium">{student.studentName}</td><td className="py-3 px-4 text-sm font-mono">{student.rollNumber || '-'}</td>{filteredAttendanceData.sessionDates.map((date, i) => { const status = student.attendances[date]; const remark = student.remarks[date]; if (status === 'present') pc++; const isEditingThis = editingRemark?.studentId === student.studentId && editingRemark?.date === date; return (<td key={i} className={`text-center py-2 px-2 text-sm ${status === 'present' ? 'bg-green-50' : status === 'absent' ? 'bg-red-50' : 'bg-slate-50'}`}>{isEditingThis ? (<div className="flex flex-col gap-2"><span className="font-bold text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">A</span><textarea ref={remarkInputRef} value={remarkText} onChange={(e) => setRemarkText(e.target.value)} className="w-full text-xs border rounded p-1 resize-none" rows={2} placeholder="Enter reason..." /><div className="flex gap-1 justify-center"><button onClick={(e) => { e.stopPropagation(); saveInlineRemark(); }} className="px-2 py-0.5 text-[10px] bg-green-600 text-white rounded hover:bg-green-700">Save</button><button onClick={(e) => { e.stopPropagation(); cancelInlineRemark(); }} className="px-2 py-0.5 text-[10px] bg-slate-400 text-white rounded hover:bg-slate-500">Cancel</button></div></div>) : (<div className={`flex flex-col items-center gap-1 ${status === 'absent' ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={(e) => { e.stopPropagation(); handleStatusClick(student.studentId, date, status); }}><span className={`font-bold text-xs px-2 py-0.5 rounded-full ${status === 'present' ? 'bg-green-100 text-green-700' : status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{status === 'present' ? 'P' : status === 'absent' ? 'A' : '-'}</span>{remark && <span className={`text-[10px] leading-tight max-w-[120px] break-words ${status === 'present' ? 'text-green-600' : 'text-red-600'}`}>{remark}</span>}{status === 'absent' && !remark && <span className="text-[10px] text-slate-400 italic">Click to add remark</span>}</div>)}</td>); })}<td className="text-center py-3 px-3 text-sm font-bold bg-blue-50">{pc}</td><td className="text-center py-3 px-3 text-sm font-bold"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(student.percentage)}`}>{student.percentage.toFixed(1)}%</span></td></tr>); })}</tbody>
                    <tfoot>
                      <tr className="bg-green-50 border-t-2 border-green-200"><td className="py-3 px-4 font-semibold text-sm text-green-700" colSpan={2}>Present</td>{filteredAttendanceData.sessionDates.map((date) => (<td key={date} className="text-center py-3 px-2 text-sm font-bold text-green-700 bg-green-50">{dailySummary[date]?.present || 0}</td>))}<td className="text-center py-3 px-3 text-sm font-bold bg-green-50"></td><td className="text-center py-3 px-3 text-sm font-bold bg-green-50"></td></tr>
                      <tr className="bg-red-50"><td className="py-3 px-4 font-semibold text-sm text-red-700" colSpan={2}>Absent</td>{filteredAttendanceData.sessionDates.map((date) => (<td key={date} className="text-center py-3 px-2 text-sm font-bold text-red-700 bg-red-50">{dailySummary[date]?.absent || 0}</td>))}<td className="text-center py-3 px-3 text-sm font-bold bg-red-50"></td><td className="text-center py-3 px-3 text-sm font-bold bg-red-50"></td></tr>
                      <tr className="bg-slate-100 border-t-2 border-slate-300"><td className="py-3 px-4 font-semibold text-sm text-slate-700" colSpan={2}>Total</td>{filteredAttendanceData.sessionDates.map((date) => (<td key={date} className="text-center py-3 px-2 text-sm font-bold text-slate-700 bg-slate-100">{dailySummary[date]?.total || 0}</td>))}<td className="text-center py-3 px-3 text-sm font-bold bg-slate-100">{filteredStudents.length}</td><td className="text-center py-3 px-3 text-sm font-bold bg-slate-100"></td></tr>
                    </tfoot>
                  </table>
                </div>
              ) : (<div className="text-center py-12"><Icons.Clipboard size={48} className="text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No attendance records found.</p><button onClick={() => { initializeAttendanceList(); setShowAttendanceModal(true); }} className={`mt-4 px-4 py-2 bg-gradient-to-r ${t.gradient} text-white rounded-lg hover:opacity-90 shadow-lg`}>Take First Attendance</button></div>)}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={() => setShowAttendanceModal(false)}>
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-5xl w-full my-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center px-6 py-4 border-b"><div><h2 className="text-xl font-bold">{isEditMode ? 'Edit Attendance' : 'Take Attendance'}</h2><p className="text-sm text-slate-500">{classroom.name} - {isEditMode ? editingDate : new Date().toLocaleDateString()}</p></div><button onClick={() => { setShowAttendanceModal(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg"><Icons.X size={20} /></button></div>
                <div className="p-6">
                  <div className="bg-slate-50 rounded-lg p-4 mb-6"><h3 className="font-semibold mb-3">Session Details</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={attendanceForm.date} onChange={(e) => { const newDate = e.target.value; if (!isValidDate(newDate)) { setErrorMessage('Cannot select future dates'); return; } setAttendanceForm({ ...attendanceForm, date: newDate }); }} max={todayStr} className="w-full px-3 py-2 border rounded-lg" /><p className="text-xs text-slate-500 mt-1">Only today and past dates</p></div><div><label className="block text-sm font-medium mb-1">Start</label><input type="time" value={attendanceForm.startTime} onChange={(e) => setAttendanceForm({ ...attendanceForm, startTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">End</label><input type="time" value={attendanceForm.endTime} onChange={(e) => setAttendanceForm({ ...attendanceForm, endTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div></div><div className="mt-3"><label className="block text-sm font-medium mb-1">Syllabus Covered</label><textarea rows={2} value={attendanceForm.syllabusCovered} onChange={(e) => setAttendanceForm({ ...attendanceForm, syllabusCovered: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Topics covered..." /></div></div>
                  <div className="flex justify-between items-center mb-4"><h3 className="font-semibold">Students</h3><div className="flex gap-2"><button onClick={markAllPresent} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg"><Icons.CheckSquare size={14} /> All Present</button><button onClick={markAllAbsent} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg"><Icons.X size={14} /> All Absent</button></div></div>
                  <div className="border rounded-lg overflow-hidden"><table className="w-full"><thead className="bg-slate-50"><tr><th className="py-2 px-4 text-left text-sm">Roll No</th><th className="py-2 px-4 text-left text-sm">Name</th><th className="py-2 px-4 text-center text-sm w-24">Status</th><th className="py-2 px-4 text-left text-sm">Remarks</th></tr></thead><tbody>{studentAttendance.map((s) => (<tr key={s.studentId} className="border-t hover:bg-slate-50"><td className="py-2 px-4 text-sm">{s.rollNumber || '-'}</td><td className="py-2 px-4 font-medium">{s.studentName}</td><td className="py-2 px-4 text-center"><button onClick={() => toggleAttendance(s.studentId)} className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status.toUpperCase()}</button></td><td className="py-2 px-4"><input type="text" value={s.remarks} onChange={(e) => updateRemarks(s.studentId, e.target.value)} className="w-full px-2 py-1 text-sm border rounded" placeholder="Add remarks..." /></td></tr>))}</tbody></table></div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg flex justify-between items-center"><div className="flex gap-4 text-sm"><span>Total: <strong>{studentAttendance.length}</strong></span><span>Present: <strong className="text-green-600">{studentAttendance.filter((s) => s.status === 'present').length}</strong></span><span>Absent: <strong className="text-red-600">{studentAttendance.filter((s) => s.status === 'absent').length}</strong></span></div><div className="flex gap-3"><button onClick={() => { setShowAttendanceModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg" disabled={submitting}>Cancel</button><button onClick={saveAttendance} disabled={submitting} className={`px-4 py-2 bg-gradient-to-r ${t.gradient} text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2`}>{submitting ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Save size={18} />}{submitting ? 'Saving...' : 'Save Attendance'}</button></div></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}