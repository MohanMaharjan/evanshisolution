'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import DateConverter from '@remotemerge/nepali-date-converter';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toNepaliNumber = (num) => String(num).replace(/\d/g, (d) => NEPALI_DIGITS[parseInt(d)]);

const INSTITUTE_INFO = {
  name: 'Asian College of Higher Studies',
  shortName: 'ACHS',
  location: 'Ekantakuna, Lalitpur',
  logo: '/logo.png',
  phone: '+977-1-5912727',
  email: 'info@achsnepal.edu.np',
  website: 'www.achsnepal.edu.np',
};

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

// ==================== NEW EXAM TYPE MODAL ====================
function NewExamTypeModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({ name: '', code: '', weightage: '', description: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setFormData({ name: '', code: '', weightage: '', description: '' }); setErrors({}); }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.code.trim()) newErrors.code = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/exam-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          weightage: formData.weightage || null,
          description: formData.description.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create exam type');
      onCreated(result);
      onClose();
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><Icons.PlusCircle className="w-5 h-5 text-green-600" /></div>
            <div><h2 className="text-lg font-bold">New Exam Type</h2></div>
          </div>
          <button onClick={onClose}><Icons.X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && <div className="p-3 bg-red-50 rounded-lg text-red-600 text-sm">{errors.submit}</div>}
          <div>
            <label className="block text-xs font-semibold mb-1">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" placeholder="e.g., Mid-Term" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Code *</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" placeholder="e.g., MID" maxLength={10} />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Weightage (%)</label>
            <input type="number" value={formData.weightage} onChange={(e) => setFormData(prev => ({ ...prev, weightage: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" placeholder="e.g., 25" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2} className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 text-sm">
              {isSubmitting ? <><Icons.Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Icons.Plus className="w-4 h-4" />Create</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==================== EXAM TYPE SELECTOR ====================
function ExamTypeSelector({ value, onChange, examTypes, onAddNew, errors }) {
  return (
    <div className="flex gap-1.5">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm ${errors ? 'border-red-300' : 'border-gray-200'}`}>
        <option value="">Select Exam Type</option>
        {examTypes.map(type => <option key={type.id} value={type.id}>{type.name} {type.weightage ? `(${type.weightage}%)` : ''}</option>)}
      </select>
      <button type="button" onClick={onAddNew} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 flex-shrink-0">
        <Icons.Plus size={16} /><span className="text-xs hidden sm:inline">New</span>
      </button>
    </div>
  );
}

// ==================== SCHEDULING METHOD MODAL ====================
function SchedulingMethodModal({ isOpen, onClose, batch, onSelect }) {
  if (!isOpen) return null;
  const methods = [
    { id: 'individual', title: 'Individual Exam', description: 'Create a single exam with full control over classroom, marks and timing.', icon: Icons.FileText, gradient: 'from-blue-500 to-cyan-600', bgGradient: 'from-blue-50 to-cyan-50', borderColor: 'border-blue-200' },
    { id: 'bulk', title: 'Bulk Schedule', description: 'Schedule exams across multiple classrooms at once.', icon: Icons.Zap, gradient: 'from-amber-500 to-orange-600', bgGradient: 'from-amber-50 to-orange-50', borderColor: 'border-amber-200' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Choose Method</h2>
          <button onClick={onClose}><Icons.X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <motion.div key={method.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSelect(method.id)}
                className={`cursor-pointer rounded-xl border-2 ${method.borderColor} bg-gradient-to-r ${method.bgGradient} p-5`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center`}><Icon className="w-7 h-7 text-white" /></div>
                  <div><h3 className="text-base font-bold">{method.title}</h3><p className="text-sm text-gray-600">{method.description}</p></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================
function addHoursToTime(time, hours) {
  const [h, m] = time.split(':').map(Number);
  let newH = h + hours;
  if (newH >= 24) newH = newH % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDaysToDate(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatTime24(timeStr) {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const [hours, minutes] = timeStr.split(':');
  return `${hours.padStart(2, '0')}:${minutes}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getNepaliDate(dateStr) {
  if (!dateStr) return '';
  try {
    const converter = new DateConverter(new Date(dateStr));
    const bs = converter.toBs();
    return `${NEPALI_MONTHS[bs.month - 1]} ${toNepaliNumber(bs.date)}, ${toNepaliNumber(bs.year)}`;
  } catch { return ''; }
}

// Check if a date falls on Saturday or Sunday
function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Get day name for display
function getDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Check if date is a holiday
async function checkHoliday(dateStr, batchId) {
  try {
    const res = await fetch(`/api/calendar/check-holiday?date=${dateStr}&batchId=${batchId || ''}`);
    if (res.ok) {
      const data = await res.json();
      return data.isHoliday;
    }
  } catch (error) {
    console.error('Error checking holiday:', error);
  }
  return false;
}

// ==================== INDIVIDUAL EXAM FORM MODAL ====================
function ExamFormModal({ isOpen, onClose, onSubmit, initialData, classrooms, examTypes = [], onAddExamType, existingExamTypes = [], batchId }) {
  const [formData, setFormData] = useState({
    name: '', examTypeId: '', examYear: new Date().getFullYear().toString(),
    startDate: '', startTime: '07:00', endTime: '10:00',
    classroomId: '', fullMarks: '100', passMarks: '40', description: '', status: 'scheduled',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateValidation, setDateValidation] = useState({ isValid: true, message: '' });
  const [isCheckingDate, setIsCheckingDate] = useState(false);
  const isEdit = !!initialData?.id;

  const activeClassrooms = useMemo(() => classrooms.filter(c => c.status?.toLowerCase() === 'active'), [classrooms]);

  const availableExamTypes = useMemo(() => {
    if (isEdit) return examTypes;
    return examTypes.filter(type => !existingExamTypes.includes(type.id.toString()));
  }, [examTypes, existingExamTypes, isEdit]);

  const isDuplicateType = useMemo(() => {
    if (isEdit) return false;
    if (!formData.examTypeId) return false;
    return existingExamTypes.includes(formData.examTypeId.toString());
  }, [formData.examTypeId, existingExamTypes, isEdit]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData && initialData.id) {
      setFormData({
        name: initialData.name || '',
        examTypeId: initialData.examTypeId || '',
        examYear: initialData.examYear || new Date().getFullYear().toString(),
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : initialData.date ? initialData.date.split('T')[0] : '',
        startTime: initialData.startTime ? formatTime24(initialData.startTime) : '07:00',
        endTime: initialData.endTime ? formatTime24(initialData.endTime) : '10:00',
        classroomId: initialData.classroomId ? String(initialData.classroomId) : '',
        fullMarks: initialData.fullMarks || '100',
        passMarks: initialData.passMarks || '40',
        description: initialData.description || '',
        status: initialData.status || 'scheduled',
      });
    } else {
      setFormData({
        name: '', examTypeId: '', examYear: new Date().getFullYear().toString(),
        startDate: '', startTime: '07:00', endTime: '10:00',
        classroomId: '', fullMarks: '100', passMarks: '40', description: '', status: 'scheduled',
      });
    }
    setErrors({});
    setDateValidation({ isValid: true, message: '' });
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.examTypeId && !isEdit) {
      const examType = examTypes.find(et => et.id.toString() === formData.examTypeId.toString());
      if (examType) setFormData(prev => ({ ...prev, name: examType.name }));
    }
  }, [formData.examTypeId, examTypes, isEdit]);

  const validateDate = async (dateStr) => {
    if (!dateStr) {
      setDateValidation({ isValid: true, message: '' });
      return true;
    }
    setIsCheckingDate(true);
    let isValid = true;
    let message = '';
    if (isWeekend(dateStr)) {
      isValid = false;
      message = `${getDayName(dateStr)} is a weekend. Exams cannot be scheduled on weekends.`;
    }
    if (isValid) {
      const isHoliday = await checkHoliday(dateStr, batchId);
      if (isHoliday) {
        isValid = false;
        message = 'This date is a holiday. Exams cannot be scheduled on holidays.';
      }
    }
    setDateValidation({ isValid, message });
    setIsCheckingDate(false);
    return isValid;
  };

  const handleExamTypeChange = (value) => {
    setFormData(prev => ({ ...prev, examTypeId: value }));
    if (errors.examTypeId) setErrors(prev => { const n = { ...prev }; delete n.examTypeId; return n; });
  };

  const handleClassroomChange = (value) => {
    setFormData(prev => ({ ...prev, classroomId: value }));
    if (errors.classroomId) setErrors(prev => { const n = { ...prev }; delete n.classroomId; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.examTypeId) newErrors.examTypeId = 'Please select an exam type';
    else if (isDuplicateType) newErrors.examTypeId = 'An exam of this type already exists for this batch.';
    if (!formData.startDate) newErrors.startDate = 'Required';
    else if (!dateValidation.isValid) newErrors.startDate = dateValidation.message;
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) newErrors.endTime = 'End time must be after start time';
    if (!formData.classroomId) newErrors.classroomId = 'Please select a classroom';
    if (!formData.fullMarks || parseInt(formData.fullMarks) <= 0) newErrors.fullMarks = 'Full marks must be greater than 0';
    if (!formData.passMarks || parseInt(formData.passMarks) <= 0) newErrors.passMarks = 'Pass marks must be greater than 0';
    if (formData.fullMarks && formData.passMarks && parseInt(formData.passMarks) > parseInt(formData.fullMarks)) newErrors.passMarks = 'Pass marks cannot exceed full marks';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id,
        name: formData.name,
        examTypeId: formData.examTypeId,
        examYear: formData.examYear,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        classroomId: formData.classroomId,
        fullMarks: formData.fullMarks,
        passMarks: formData.passMarks,
        description: formData.description,
        status: formData.status,
      });
      onClose();
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Icons.BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{isEdit ? 'Edit Exam' : 'Schedule Internal Exam'}</h3>
              {formData.startDate && <p className="text-xs text-gray-500">{formatDateShort(formData.startDate)}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <div className="flex items-center gap-2"><Icons.AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{errors.submit}</span></div>
              </div>
            )}

            {!isEdit && existingExamTypes.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <Icons.AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Already scheduled exam types for this batch:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {examTypes.filter(type => existingExamTypes.includes(type.id.toString())).map(type => (
                    <span key={type.id} className="px-2 py-0.5 bg-white border border-amber-200 rounded text-xs text-amber-700">
                      {type.name} {type.weightage ? `(${type.weightage}%)` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Exam Type *
                {!isEdit && availableExamTypes.length === 0 && examTypes.length > 0 && (
                  <span className="text-amber-500 ml-1">(All types already scheduled)</span>
                )}
              </label>
              <div className="flex gap-1.5">
                <select value={formData.examTypeId} onChange={(e) => handleExamTypeChange(e.target.value)}
                  className={`flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm ${errors.examTypeId ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  disabled={!isEdit && availableExamTypes.length === 0}>
                  <option value="">{!isEdit && availableExamTypes.length === 0 && examTypes.length > 0 ? 'All exam types already scheduled' : 'Select Exam Type'}</option>
                  {(isEdit ? examTypes : availableExamTypes).map(type => (
                    <option key={type.id} value={type.id}>{type.name} {type.weightage ? `(${type.weightage}%)` : ''}</option>
                  ))}
                </select>
                <button type="button" onClick={onAddExamType} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 flex-shrink-0">
                  <Icons.Plus size={16} /><span className="text-xs hidden sm:inline">New</span>
                </button>
              </div>
              {errors.examTypeId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icons.AlertCircle className="w-3 h-3" />{errors.examTypeId}</p>}
              {isDuplicateType && !errors.examTypeId && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Icons.AlertTriangle className="w-3 h-3" />This exam type is already scheduled for this batch</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.name ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
                placeholder="e.g., Internal Assessment - Mathematics" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Year (BS)</label>
              <select value={formData.examYear} onChange={(e) => setFormData(prev => ({ ...prev, examYear: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {[2079, 2080, 2081, 2082, 2083, 2084, 2085].map(y => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
              <input type="date" value={formData.startDate} 
                onChange={async (e) => {
                  const dateValue = e.target.value;
                  setFormData(prev => ({ ...prev, startDate: dateValue }));
                  await validateDate(dateValue);
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.startDate || !dateValidation.isValid ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
                min={new Date().toISOString().split('T')[0]} />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              {isCheckingDate && <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><Icons.Loader2 className="w-3 h-3 animate-spin" />Checking date...</p>}
              {!dateValidation.isValid && !errors.startDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icons.AlertCircle className="w-3 h-3" />{dateValidation.message}</p>}
              {formData.startDate && dateValidation.isValid && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Icons.CheckCircle className="w-3 h-3" />{getDayName(formData.startDate)} - Available</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time *</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))} 
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.startTime ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`} />
                {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">End Time *</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))} 
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.endTime ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`} />
                {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Active Classroom * {activeClassrooms.length === 0 && <span className="text-amber-500 ml-1">(No active classrooms available)</span>}
              </label>
              <select value={formData.classroomId} onChange={(e) => handleClassroomChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.classroomId ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
                disabled={activeClassrooms.length === 0}>
                <option value="">{activeClassrooms.length === 0 ? 'No active classrooms available' : 'Select Active Classroom'}</option>
                {activeClassrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.code} {c.capacity ? `(Capacity: ${c.capacity})` : ''} {c.building ? `- ${c.building}` : ''}</option>
                ))}
              </select>
              {errors.classroomId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icons.AlertCircle className="w-3 h-3" />{errors.classroomId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Marks *</label>
                <input type="number" value={formData.fullMarks} onChange={(e) => setFormData(prev => ({ ...prev, fullMarks: e.target.value }))} 
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.fullMarks ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`} min="1" placeholder="100" />
                {errors.fullMarks && <p className="text-xs text-red-500 mt-1">{errors.fullMarks}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pass Marks *</label>
                <input type="number" value={formData.passMarks} onChange={(e) => setFormData(prev => ({ ...prev, passMarks: e.target.value }))} 
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.passMarks ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`} min="1" placeholder="40" />
                {errors.passMarks && <p className="text-xs text-red-500 mt-1">{errors.passMarks}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Optional notes..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting || isDuplicateType || activeClassrooms.length === 0 || !dateValidation.isValid || isCheckingDate} 
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              title={isDuplicateType ? 'Cannot schedule duplicate exam type' : activeClassrooms.length === 0 ? 'No active classrooms available' : !dateValidation.isValid ? 'Invalid date selected' : ''}>
              {isSubmitting && <Icons.Loader2 className="w-4 h-4 animate-spin" />}{isEdit ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==================== 2-D EXAM ROUTINE VIEW ====================
function ExamRoutineView({ exams, batchName, onClose, examTypes = [] }) {
  const [filterType, setFilterType] = useState('all');
  
  // Get unique exam types from exams
  const availableExamTypes = useMemo(() => {
    if (!exams || exams.length === 0) return [];
    const typeMap = new Map();
    exams.forEach(exam => {
      const typeId = exam.examTypeId?.toString();
      const typeName = exam.examType?.name || exam.name;
      if (typeId && !typeMap.has(typeId)) {
        typeMap.set(typeId, { id: typeId, name: typeName });
      }
    });
    return Array.from(typeMap.values());
  }, [exams]);

  // Filter exams by selected type
  const filteredExams = useMemo(() => {
    if (!exams || exams.length === 0) return [];
    if (filterType === 'all') return exams;
    return exams.filter(exam => exam.examTypeId?.toString() === filterType);
  }, [exams, filterType]);

  const routineData = useMemo(() => {
    if (!filteredExams || filteredExams.length === 0) return { dates: [], timeSlots: [], examsByTimeAndDate: {} };
    const dateSet = new Set();
    const examsByTimeAndDate = {};

    filteredExams.forEach(exam => {
      const dateKey = exam.startDate || exam.examDate || exam.date;
      const timeKey = exam.startTime && exam.endTime ? `${exam.startTime}-${exam.endTime}` : null;
      if (dateKey && timeKey) {
        dateSet.add(dateKey);
        examsByTimeAndDate[`${timeKey}|${dateKey}`] = exam;
      }
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
    const timeSlotMap = new Map();
    filteredExams.forEach(exam => {
      if (exam.startTime && exam.endTime) {
        const key = `${exam.startTime}-${exam.endTime}`;
        if (!timeSlotMap.has(key)) timeSlotMap.set(key, { startTime: exam.startTime, endTime: exam.endTime });
      }
    });
    const sortedTimeSlots = Array.from(timeSlotMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { dates: sortedDates, timeSlots: sortedTimeSlots, examsByTimeAndDate, exams: filteredExams };
  }, [filteredExams]);

  const { dates, timeSlots, examsByTimeAndDate } = routineData;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getExamForSlot = (timeSlot, date) => {
    return examsByTimeAndDate[`${timeSlot.startTime}-${timeSlot.endTime}|${date}`] || null;
  };

  const getPrintContent = () => {
    const currentDate = new Date();
    const reportDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const filterLabel = filterType !== 'all' ? ` - ${availableExamTypes.find(t => t.id === filterType)?.name || ''}` : '';
    
    const timeSlotsHTML = timeSlots.map((timeSlot) => `
      <th style="border: 1px solid #0d9488; padding: 8px 6px; font-weight: 600; text-align: center; min-width: 110px; background-color: #0f766e; color: white;">
        <div style="font-size: 10px;">${formatTimeDisplay(timeSlot.startTime)}</div>
        <div style="font-size: 9px; opacity: 0.75;">to</div>
        <div style="font-size: 10px;">${formatTimeDisplay(timeSlot.endTime)}</div>
        <div style="font-size: 8px; opacity: 0.6; margin-top: 2px;">${formatTime24(timeSlot.startTime)}-${formatTime24(timeSlot.endTime)}</div>
      </th>
    `).join('');

    const rowsHTML = dates.length === 0 ? `
      <tr><td colspan="${timeSlots.length + 1}" style="text-align: center; padding: 32px 0; color: #6b7280; font-size: 14px;">No exam schedule data available</td></tr>
    ` : dates.map((date, rowIdx) => {
      const bgColor = rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff';
      const cellsHTML = timeSlots.map((timeSlot) => {
        const exam = getExamForSlot(timeSlot, date);
        if (exam) {
          return `
            <td style="border: 1px solid #d1d5db; padding: 6px 4px; text-align: left; vertical-align: top; background-color: #f0fdfa;">
              <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 6px; height: 100%;">
                <p style="font-weight: 600; font-size: 10px; line-height: 1.2; color: #0f766e; margin: 0;">${exam.examType?.name || exam.name}</p>
                <p style="font-size: 9px; margin: 2px 0 0 0; color: #4b5563;">🏛 ${exam.classroom?.name || `Room ${exam.classroomId}`}</p>
                ${exam.classroom?.capacity ? `<p style="font-size: 8px; color: #9ca3af; margin: 2px 0 0 0;">Cap: ${exam.classroom.capacity}</p>` : ''}
              </div>
            </td>
          `;
        }
        return `<td style="border: 1px solid #d1d5db; padding: 6px 4px; text-align: center; vertical-align: top; color: #d1d5db; font-size: 10px;">—</td>`;
      }).join('');

      return `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px 6px; font-weight: 500; color: #374151; vertical-align: top; min-width: 100px;">
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 600;">📅</span>
              <span style="font-size: 10px; font-weight: 600;">${formatDateShort(date)}</span>
            </div>
            <div style="font-size: 9px; color: #9ca3af; margin-left: 16px;">${getNepaliDate(date)}</div>
          </td>
          ${cellsHTML}
        </tr>
      `;
    }).join('');

    return `
      <div style="max-width: 900px; margin: 0 auto; padding: 24px; background: white; font-family: system-ui, -apple-system, sans-serif;">
        <div style="border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="flex-shrink: 0; width: 56px;">
              <img src="${INSTITUTE_INFO.logo}" alt="${INSTITUTE_INFO.name}" style="height: 56px; object-fit: contain;" onerror="this.style.display='none'" />
            </div>
            <div style="flex: 1; text-align: center;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f766e; margin: 0; line-height: 1.2;">${INSTITUTE_INFO.name}</h2>
              <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0;">${INSTITUTE_INFO.location}</p>
            </div>
            <div style="flex-shrink: 0; width: 56px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 10px; color: #9ca3af; margin: 0;"><span style="font-weight: 500; color: #6b7280;">Ref:</span> ..........</p>
            <p style="font-size: 10px; color: #9ca3af; margin: 0;"><span style="font-weight: 500; color: #6b7280;">Date:</span> ${reportDate}</p>
          </div>
          <h3 style="font-size: 16px; font-weight: 700; text-align: center; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin: 8px 0 0 0;">EXAMINATION ROUTINE${filterLabel}</h3>
          ${batchName ? `<p style="text-align: center; font-size: 13px; color: #4b5563; margin: 4px 0 0 0; font-weight: 500;">${batchName}</p>` : ''}
        </div>
        <div style="overflow-x: auto; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 11px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="border: 1px solid #0d9488; padding: 8px 6px; font-weight: 600; text-align: left; min-width: 100px;">
                  <div style="font-size: 10px; opacity: 0.75;">Date</div>
                  <div style="font-size: 10px; opacity: 0.75;">Time →</div>
                </th>
                ${timeSlotsHTML}
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>
        <div style="border-top: 2px solid #0f766e; padding-top: 12px; text-align: center;">
          <p style="font-size: 11px; font-weight: 600; color: #374151; margin: 0;">${INSTITUTE_INFO.name}</p>
          <p style="font-size: 9px; color: #6b7280; margin: 2px 0 0 0;">${INSTITUTE_INFO.location}</p>
          <div style="display: flex; justify-content: center; gap: 12px; font-size: 9px; color: #9ca3af; margin-top: 4px; flex-wrap: wrap;">
            ${INSTITUTE_INFO.phone ? `<span>📞 ${INSTITUTE_INFO.phone}</span>` : ''}
            ${INSTITUTE_INFO.email ? `<span>✉️ ${INSTITUTE_INFO.email}</span>` : ''}
            ${INSTITUTE_INFO.website ? `<span>🌐 ${INSTITUTE_INFO.website}</span>` : ''}
          </div>
          <p style="font-size: 8px; color: #d1d5db; margin-top: 4px;">This is a computer-generated report</p>
        </div>
      </div>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Routine - ${batchName || INSTITUTE_INFO.shortName}</title>
          <style>
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            @media print { @page { size: A4 portrait; margin: 12mm; } body { margin: 0; padding: 0; } }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>${getPrintContent()}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 300); };
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = getPrintContent();
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '794px';
      document.body.appendChild(tempDiv);

      tempDiv.querySelectorAll('*').forEach(el => {
        const style = el.getAttribute('style');
        if (style && (style.includes('lab(') || style.includes('lch(') || style.includes('oklch('))) {
          el.setAttribute('style', style.replace(/lab\([^)]+\)/g, '#6b7280').replace(/lch\([^)]+\)/g, '#6b7280').replace(/oklch\([^)]+\)/g, '#6b7280'));
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff', allowTaint: true, logging: false, windowWidth: 794 });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      const fileNameSafeBatch = (batchName || 'exam-routine').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      pdf.save(`${fileNameSafeBatch}-routine.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF generation failed. Opening print dialog instead.');
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-white">
      <div id="exam-routine-print" className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border no-print">
          <Icons.Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Filter by Exam Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Exams ({exams?.length || 0})</option>
            {availableExamTypes.map(type => {
              const count = exams.filter(e => e.examTypeId?.toString() === type.id).length;
              return (
                <option key={type.id} value={type.id}>
                  {type.name} ({count})
                </option>
              );
            })}
          </select>
          {filterType !== 'all' && (
            <button
              onClick={() => setFilterType('all')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <Icons.X className="w-3 h-3" /> Clear
            </button>
          )}
          <Badge variant="info" className="ml-auto">{filteredExams.length} Exams</Badge>
        </div>

        {/* Header */}
        <div className="border-b-2 border-teal-700 pb-3 mb-4">
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0">
              <img src={INSTITUTE_INFO.logo} alt={`${INSTITUTE_INFO.name} logo`} className="h-14 md:h-16 object-contain"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div className="w-12 h-12 rounded-lg bg-teal-600 to-emerald-600 items-center justify-center hidden">
                <Icons.GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-lg md:text-xl font-bold text-teal-700 leading-tight">{INSTITUTE_INFO.name}</h2>
              <p className="text-xs md:text-sm text-gray-500">{INSTITUTE_INFO.location}</p>
            </div>
            <div className="flex-shrink-0" style={{ width: '56px' }}>
              <div className="h-14 md:h-16 invisible">
                <img src={INSTITUTE_INFO.logo} alt="" className="h-14 md:h-16 object-contain opacity-0" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
            <p className="text-[10px] md:text-xs text-gray-400"><span className="font-medium text-gray-500">Ref:</span> ..........</p>
            <p className="text-[10px] md:text-xs text-gray-400"><span className="font-medium text-gray-500">Date:</span> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <h3 className="text-base md:text-lg font-bold text-center text-teal-700 uppercase tracking-wide mt-2">
            EXAMINATION ROUTINE
            {filterType !== 'all' && <span className="block text-sm font-normal normal-case text-gray-500">- {availableExamTypes.find(t => t.id === filterType)?.name}</span>}
          </h3>
          {batchName && <p className="text-center text-sm text-gray-600 mt-1 font-medium">{batchName}</p>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300 text-[11px] md:text-xs">
            <thead>
              <tr className="bg-teal-700 text-white">
                <th className="border border-teal-600 px-2 py-2 font-semibold text-left min-w-[100px]">
                  <div className="text-[10px] opacity-75">Date</div>
                  <div className="text-[10px] opacity-75">Time →</div>
                </th>
                {timeSlots.map((timeSlot, idx) => (
                  <th key={idx} className="border border-teal-600 px-2 py-2 font-semibold text-center min-w-[110px]">
                    <div className="text-[10px]">{formatTimeDisplay(timeSlot.startTime)}</div>
                    <div className="text-[9px] opacity-75">to</div>
                    <div className="text-[10px]">{formatTimeDisplay(timeSlot.endTime)}</div>
                    <div className="text-[8px] opacity-60 mt-0.5">{formatTime24(timeSlot.startTime)}-{formatTime24(timeSlot.endTime)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.length === 0 ? (
                <tr><td colSpan={timeSlots.length + 1} className="text-center py-8 text-gray-500 text-sm">
                  {filterType !== 'all' ? 'No exams found for this type' : 'No exam schedule data available'}
                </td></tr>
              ) : (
                dates.map((date, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-2 py-2 font-medium text-gray-700 align-top min-w-[100px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <Icons.Calendar className="w-3 h-3 text-teal-600 flex-shrink-0" />
                          <span className="text-[10px] font-semibold">{formatDateShort(date)}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 ml-4">{getNepaliDate(date)}</div>
                      </div>
                    </td>
                    {timeSlots.map((timeSlot, colIdx) => {
                      const exam = getExamForSlot(timeSlot, date);
                      return (
                        <td key={colIdx} className="border border-gray-300 px-1.5 py-1.5 text-center align-top min-h-[70px]">
                          {exam ? (
                            <div className="bg-teal-50 border border-teal-200 rounded-md p-1.5 text-left h-full">
                              <p className="font-semibold text-[10px] leading-tight text-teal-700 truncate">{exam.examType?.name || exam.name}</p>
                              <p className="text-[9px] mt-0.5 text-gray-600 flex items-center gap-1">
                                <Icons.Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{exam.classroom?.name || `Room ${exam.classroomId}`}</span>
                              </p>
                              {exam.classroom?.capacity && <p className="text-[8px] text-gray-400 mt-0.5">Cap: {exam.classroom.capacity}</p>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-teal-700 pt-3 text-center">
          <p className="text-[11px] font-semibold text-gray-700">{INSTITUTE_INFO.name}</p>
          <p className="text-[9px] text-gray-500">{INSTITUTE_INFO.location}</p>
          <div className="flex justify-center gap-3 text-[9px] text-gray-400 mt-1 flex-wrap">
            {INSTITUTE_INFO.phone && <span>📞 {INSTITUTE_INFO.phone}</span>}
            {INSTITUTE_INFO.email && <span>✉️ {INSTITUTE_INFO.email}</span>}
            {INSTITUTE_INFO.website && <span>🌐 {INSTITUTE_INFO.website}</span>}
          </div>
          <p className="text-[8px] text-gray-300 mt-1">This is a computer-generated report</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center p-4 border-t bg-gray-50 no-print">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Icons.Info className="w-3.5 h-3.5" />
          <span>Page size: A4 Portrait • {dates.length} days • {timeSlots.length} time slots{filterType !== 'all' ? ' • Filtered' : ''}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} disabled={isGeneratingPdf}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            {isGeneratingPdf ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Icons.Download className="w-4 h-4" /> Download PDF</>}
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center gap-2">
            <Icons.Printer className="w-4 h-4" /> Print Routine
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <Icons.X className="w-4 h-4" /> Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== BULK EXAM SCHEDULER MODAL ====================
function BulkExamSchedulerModal({ isOpen, onClose, onSubmit, classrooms, batchId, departmentId, isLoading, examTypes = [], onAddExamType, existingExams = [] }) {
  const [selectedExamType, setSelectedExamType] = useState('');
  const [examName, setExamName] = useState('');
  const [examSchedule, setExamSchedule] = useState({});
  const [errors, setErrors] = useState({});
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkStartTime, setBulkStartTime] = useState('07:00');
  const [dateValidation, setDateValidation] = useState({ isValid: true, message: '' });
  const [isCheckingDate, setIsCheckingDate] = useState(false);

  const activeClassrooms = useMemo(() => classrooms.filter(c => c.status?.toLowerCase() === 'active'), [classrooms]);

  const existingExamTypes = useMemo(() => {
    if (!existingExams || existingExams.length === 0) return new Set();
    return new Set(existingExams.map(exam => exam.examTypeId?.toString()));
  }, [existingExams]);

  const availableExamTypes = useMemo(() => {
    return examTypes.filter(type => !existingExamTypes.has(type.id.toString()));
  }, [examTypes, existingExamTypes]);

  const hasExistingExams = useMemo(() => {
    if (!selectedExamType || !existingExams || existingExams.length === 0) return false;
    return existingExams.some(exam => exam.examTypeId?.toString() === selectedExamType.toString());
  }, [selectedExamType, existingExams]);

  useEffect(() => {
    if (selectedExamType) {
      const examType = examTypes.find(et => et.id.toString() === selectedExamType.toString());
      if (examType) setExamName(examType.name);
    } else setExamName('');
  }, [selectedExamType, examTypes]);

  const reflowDates = useCallback((schedule, startDate, startTime) => {
    if (!startDate || !startTime) return schedule;
    const updatedSchedule = { ...schedule };
    const sortedIds = Object.keys(updatedSchedule);
    let dayOffset = 0;
    sortedIds.forEach((classroomId) => {
      const entry = updatedSchedule[classroomId];
      if (!entry.skipped) {
        updatedSchedule[classroomId] = { ...entry, date: addDaysToDate(startDate, dayOffset), startTime, endTime: addHoursToTime(startTime, 3) };
        dayOffset++;
      } else {
        updatedSchedule[classroomId] = { ...entry, date: '', startTime: '', endTime: '' };
      }
    });
    return updatedSchedule;
  }, []);

  useEffect(() => {
    if (isOpen && activeClassrooms.length > 0) {
      const initialSchedule = {};
      activeClassrooms.forEach((classroom) => {
        initialSchedule[classroom.id] = {
          classroomId: classroom.id, classroomName: classroom.name || classroom.code,
          building: classroom.building || 'Main', capacity: classroom.capacity,
          date: '', startTime: '', endTime: '', skipped: false,
        };
      });
      setExamSchedule(initialSchedule);
      setErrors({}); setSelectedExamType(''); setExamName('');
      setBulkStartDate(''); setBulkStartTime('07:00');
      setDateValidation({ isValid: true, message: '' });
    }
  }, [isOpen, activeClassrooms]);

  useEffect(() => {
    if (bulkStartDate && bulkStartTime && Object.keys(examSchedule).length > 0) {
      setExamSchedule(prev => reflowDates(prev, bulkStartDate, bulkStartTime));
    }
  }, [bulkStartDate, bulkStartTime, reflowDates]);

  const validateBulkDate = async (dateStr) => {
    if (!dateStr) {
      setDateValidation({ isValid: true, message: '' });
      return true;
    }
    setIsCheckingDate(true);
    let isValid = true;
    let message = '';
    if (isWeekend(dateStr)) {
      isValid = false;
      message = `${getDayName(dateStr)} is a weekend. Exams cannot be scheduled on weekends.`;
    }
    if (isValid) {
      const isHoliday = await checkHoliday(dateStr, batchId);
      if (isHoliday) {
        isValid = false;
        message = 'This date is a holiday. Exams cannot be scheduled on holidays.';
      }
    }
    setDateValidation({ isValid, message });
    setIsCheckingDate(false);
    return isValid;
  };

  const handleScheduleChange = (classroomId, field, value) => {
    setExamSchedule(prev => {
      const updated = { ...prev, [classroomId]: { ...prev[classroomId], [field]: value } };
      if (field === 'startTime' && value) updated[classroomId].endTime = addHoursToTime(value, 3);
      return updated;
    });
    if (errors[`${classroomId}-${field}`]) {
      setErrors(prev => { const n = { ...prev }; delete n[`${classroomId}-${field}`]; return n; });
    }
  };

  const toggleSkipClassroom = (classroomId) => {
    setExamSchedule(prev => {
      const updated = { ...prev, [classroomId]: { ...prev[classroomId], skipped: !prev[classroomId].skipped } };
      if (bulkStartDate && bulkStartTime) return reflowDates(updated, bulkStartDate, bulkStartTime);
      return updated;
    });
  };

  const clearAllSchedules = () => {
    setExamSchedule(prev => {
      const c = { ...prev };
      Object.keys(c).forEach(id => { c[id] = { ...c[id], date: '', startTime: '', endTime: '', skipped: false }; });
      return c;
    });
    setBulkStartDate(''); setBulkStartTime('07:00'); setErrors({});
    setDateValidation({ isValid: true, message: '' });
  };

  const validateSchedule = () => {
    const newErrors = {};
    let isValid = true;
    if (!selectedExamType) { newErrors.examType = 'Select an exam type'; isValid = false; }
    if (hasExistingExams) { newErrors.examType = 'An exam of this type already exists for this batch.'; isValid = false; }
    if (!bulkStartDate) { newErrors.bulkStartDate = 'Start date is required'; isValid = false; }
    else if (!dateValidation.isValid) { newErrors.bulkStartDate = dateValidation.message; isValid = false; }
    if (!bulkStartTime) { newErrors.bulkStartTime = 'Start time is required'; isValid = false; }
    const scheduled = Object.values(examSchedule).filter(s => !s.skipped && s.date && s.startTime && s.endTime);
    if (scheduled.length === 0) { newErrors.submit = 'Schedule at least one exam'; isValid = false; }
    scheduled.forEach(s => {
      if (s.startTime && s.endTime && s.startTime >= s.endTime) {
        newErrors[`${s.classroomId}-endTime`] = 'Invalid time'; isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateSchedule()) return;
    const scheduled = Object.values(examSchedule).filter(s => !s.skipped && s.date && s.startTime && s.endTime);
    const examsToCreate = scheduled.map(s => ({
      name: examName, examTypeId: parseInt(selectedExamType), batchId, departmentId,
      startDate: s.date, startTime: s.startTime, endTime: s.endTime,
      classroomId: parseInt(s.classroomId), status: 'scheduled',
    }));
    await onSubmit(examsToCreate);
  };

  if (!isOpen) return null;

  const skippedCount = Object.values(examSchedule).filter(s => s.skipped).length;
  const scheduledCount = Object.values(examSchedule).filter(s => !s.skipped && s.date && s.startTime && s.endTime).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl p-6">
          <div className="absolute right-4 top-4"><button onClick={onClose}><Icons.X size={20} /></button></div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Icons.CalendarDays className="text-blue-600" size={20} />Bulk Exam Scheduler</h3>
          
          {errors.submit && <div className="mt-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">{errors.submit}</div>}
          
          {existingExams && existingExams.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <Icons.AlertTriangle size={16} />
                <span className="text-sm font-medium">Existing Exams for this Batch</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {existingExams.map((exam, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-white rounded-lg text-xs text-amber-700 border border-amber-200">
                    {exam.examType?.name || exam.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Exam Type *
                    {availableExamTypes.length === 0 && examTypes.length > 0 && <span className="text-xs text-amber-600 ml-2">(All exam types already scheduled)</span>}
                  </label>
                  <select value={selectedExamType} onChange={(e) => { setSelectedExamType(e.target.value); if (errors.examType) setErrors(prev => { const n = { ...prev }; delete n.examType; return n; }); }}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${errors.examType ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    disabled={availableExamTypes.length === 0}>
                    <option value="">{availableExamTypes.length === 0 && examTypes.length > 0 ? 'All exam types already scheduled' : 'Select Exam Type'}</option>
                    {availableExamTypes.map(type => (<option key={type.id} value={type.id}>{type.name} {type.weightage ? `(${type.weightage}%)` : ''}</option>))}
                  </select>
                  {errors.examType && <p className="text-xs text-red-600 mt-1">{errors.examType}</p>}
                  {existingExamTypes.size > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Already scheduled:</p>
                      <div className="flex flex-wrap gap-1">
                        {examTypes.filter(type => existingExamTypes.has(type.id.toString())).map(type => (
                          <span key={type.id} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs line-through">{type.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Exam Name <span className="text-xs text-gray-400">(Auto)</span></label>
                  <input type="text" value={examName} disabled className="w-full rounded-md border bg-gray-100 px-3 py-2 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
            
            {activeClassrooms.length > 0 && (
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 text-sm mb-2">Active Classrooms ({activeClassrooms.length})</h4>
                <div className="flex flex-wrap gap-2">{activeClassrooms.map(c => <span key={c.id} className="px-2.5 py-1 bg-white rounded-lg text-xs text-emerald-700 border">{c.name || c.code}{c.capacity && ` (${c.capacity})`}</span>)}</div>
              </div>
            )}
            
            {Object.keys(examSchedule).length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 text-sm mb-3">Bulk Date & Time Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Start Date *</label>
                    <input type="date" value={bulkStartDate} 
                      onChange={async (e) => { const val = e.target.value; setBulkStartDate(val); await validateBulkDate(val); }}
                      className={`w-full rounded-md border px-3 py-2 text-sm bg-white ${errors.bulkStartDate || !dateValidation.isValid ? 'border-red-300' : 'border-blue-300'}`}
                      min={new Date().toISOString().split('T')[0]} />
                    {errors.bulkStartDate && <p className="text-xs text-red-600 mt-1">{errors.bulkStartDate}</p>}
                    {isCheckingDate && <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><Icons.Loader2 className="w-3 h-3 animate-spin" />Checking date...</p>}
                    {!dateValidation.isValid && !errors.bulkStartDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icons.AlertCircle className="w-3 h-3" />{dateValidation.message}</p>}
                    {bulkStartDate && dateValidation.isValid && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Icons.CheckCircle className="w-3 h-3" />{getDayName(bulkStartDate)} - Available</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Start Time *</label>
                    <input type="time" value={bulkStartTime} onChange={(e) => setBulkStartTime(e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm bg-white ${errors.bulkStartTime ? 'border-red-300' : 'border-blue-300'}`} />
                    {errors.bulkStartTime && <p className="text-xs text-red-600 mt-1">{errors.bulkStartTime}</p>}
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={clearAllSchedules} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Clear All</button>
                    <span className="text-sm text-blue-700 ml-auto">{scheduledCount} scheduled{skippedCount > 0 ? ` • ${skippedCount} skipped` : ''}</span>
                  </div>
                </div>
              </div>
            )}
            
            {Object.keys(examSchedule).length > 0 && (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Classroom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Start Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">End Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase">Skip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.values(examSchedule).map((schedule) => (
                      <tr key={schedule.classroomId} className={`hover:bg-gray-50 ${schedule.skipped ? 'bg-gray-100 opacity-50' : schedule.date && schedule.startTime ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-3 font-medium"><div>{schedule.classroomName}</div><div className="text-xs text-gray-400">{schedule.building}</div></td>
                        <td className="px-4 py-3 text-sm">{schedule.capacity}</td>
                        <td className="px-4 py-3"><input type="date" value={schedule.date} onChange={(e) => handleScheduleChange(schedule.classroomId, 'date', e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" disabled={schedule.skipped} min={new Date().toISOString().split('T')[0]} /></td>
                        <td className="px-4 py-3"><input type="time" value={schedule.startTime} onChange={(e) => handleScheduleChange(schedule.classroomId, 'startTime', e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" disabled={schedule.skipped} /></td>
                        <td className="px-4 py-3"><input type="time" value={schedule.endTime} className="w-full rounded border px-2 py-1.5 text-sm bg-gray-50" disabled readOnly /></td>
                        <td className="px-4 py-3">{schedule.skipped ? <span className="text-gray-400 text-sm">Skipped</span> : schedule.date && schedule.startTime ? <span className="text-green-600 text-sm"><Icons.CheckCircle size={14} className="inline mr-1" />Scheduled</span> : <span className="text-gray-400 text-sm">Pending</span>}</td>
                        <td className="px-4 py-3 text-center"><button onClick={() => toggleSkipClassroom(schedule.classroomId)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${schedule.skipped ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>{schedule.skipped ? 'Include' : 'Skip'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex flex-row-reverse gap-3 border-t pt-4">
              <button onClick={handleSubmit} 
                disabled={isLoading || scheduledCount === 0 || !selectedExamType || hasExistingExams || activeClassrooms.length === 0 || !dateValidation.isValid || isCheckingDate} 
                className="px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
                title={hasExistingExams ? 'This exam type already exists for this batch' : activeClassrooms.length === 0 ? 'No active classrooms available' : !dateValidation.isValid ? 'Invalid date selected' : ''}>
                {isLoading ? <><Icons.Loader2 size={16} className="animate-spin" />Scheduling...</> : <><Icons.Calendar size={16} />Schedule {scheduledCount} Exams</>}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 bg-white border text-gray-900 rounded-md text-sm">Cancel</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== SCHEDULED EXAMS MODAL ====================
function ScheduledExamsModal({ isOpen, onClose, exams, isLoading, onRefresh, batchName, examTypes = [] }) {
  const [viewMode, setViewMode] = useState('list');

  const groupedExams = useMemo(() => {
    if (!exams || exams.length === 0) return {};
    return exams.reduce((acc, exam) => {
      const key = exam.examType?.name || exam.name || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(exam);
      return acc;
    }, {});
  }, [exams]);

  if (!isOpen) return null;

  if (viewMode === 'routine') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 pt-8">
          <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
            <ExamRoutineView exams={exams} batchName={batchName} onClose={() => setViewMode('list')} examTypes={examTypes} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <div><h3 className="text-lg font-semibold flex items-center gap-2"><Icons.ClipboardList className="text-emerald-600" size={20} />Scheduled Exams</h3>{batchName && <p className="text-sm text-gray-500 mt-1">{batchName}</p>}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('routine')} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 flex items-center gap-1.5"><Icons.LayoutGrid className="w-3.5 h-3.5" /> Routine View</button>
              <button onClick={onRefresh} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.RefreshCw className="w-4 h-4 text-gray-400" /></button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.X size={20} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Icons.Loader2 className="w-8 h-8 animate-spin text-emerald-600" /><span className="ml-3 text-gray-500">Loading...</span></div>
            ) : !exams || exams.length === 0 ? (
              <div className="text-center py-12"><Icons.Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-lg font-medium text-gray-500">No exams scheduled yet</p></div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="info">{exams.length} Total Exams</Badge>
                  <div className="flex gap-2">
                    {Object.entries(exams.reduce((acc, exam) => { const s = exam.status?.toLowerCase() || 'scheduled'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})).map(([status, count]) => (
                      <Badge key={status} variant={status === 'completed' ? 'success' : status === 'ongoing' ? 'warning' : status === 'cancelled' ? 'danger' : 'info'}>{count} {status}</Badge>
                    ))}
                  </div>
                </div>
                {Object.entries(groupedExams).map(([examType, examsList]) => (
                  <div key={examType} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Icons.BookOpen className="w-5 h-5 text-white" /></div><div><h4 className="font-semibold text-sm">{examType}</h4><p className="text-xs text-gray-500">{examsList.length} exam{examsList.length > 1 ? 's' : ''}</p></div></div>
                    <div className="space-y-2">
                      {examsList.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((exam) => (
                        <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border hover:border-emerald-200 transition-colors p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0"><Icons.Calendar className="w-6 h-6 text-emerald-600" /></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-sm">{exam.classroom?.name || `Classroom ${exam.classroomId}`}</p></div>
                                <div className="flex items-center gap-1 mb-1"><Icons.CalendarDays className="w-4 h-4 text-emerald-600" /><span className="text-sm font-medium text-gray-700">Exam Date: {formatDateDisplay(exam.startDate || exam.examDate || exam.date)}</span></div>
                                <div className="flex items-center gap-1 mb-1"><Icons.Clock className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-600">Time: {formatTimeDisplay(exam.startTime)} - {formatTimeDisplay(exam.endTime)}</span></div>
                                {exam.classroom?.building && <div className="flex items-center gap-1 mb-1"><Icons.Building2 className="w-4 h-4 text-purple-600" /><span className="text-sm text-gray-600">{exam.classroom.building}</span></div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-2">{exam.classroom?.capacity && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded whitespace-nowrap">Cap: {exam.classroom.capacity}</span>}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function InternalExam() {
  const { can } = usePermissions();
  const hasReadPermission = can('internal_exam', 'read') || can('exams', 'read');

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedBatchData, setSelectedBatchData] = useState(null);
  const [terminalDates, setTerminalDates] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [message, setMessage] = useState(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExamFormModal, setShowExamFormModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showNewExamTypeModal, setShowNewExamTypeModal] = useState(false);
  const [showScheduledExamsModal, setShowScheduledExamsModal] = useState(false);
  const [methodBatch, setMethodBatch] = useState(null);

  const showMessage = useCallback((type, title, text) => {
    setMessage({ type, title, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const fetchDepartments = async () => {
    try { const res = await fetch('/api/departments'); if (!res.ok) throw new Error('Failed'); const data = await res.json(); setDepartments(data.departments || []); } catch (error) { showMessage('error', 'Error', 'Failed to load departments'); }
  };

  const fetchExamTypes = async () => {
    try { const res = await fetch('/api/exam-types'); if (res.ok) { const data = await res.json(); setExamTypes(data.examTypes || data || []); } } catch (error) { console.error('Error fetching exam types:', error); }
  };

  const fetchBatches = useCallback(async (deptId) => {
    if (!deptId) { setBatches([]); setSelectedBatch(null); return; }
    setIsLoadingBatches(true);
    try { const res = await fetch(`/api/batches?departmentId=${deptId}`); if (!res.ok) throw new Error('Failed'); const data = await res.json(); setBatches(data.batches || []); } catch (error) { showMessage('error', 'Error', 'Failed to load batches'); }
    finally { setIsLoadingBatches(false); }
  }, [showMessage]);

  const fetchScheduledExams = useCallback(async (batchId) => {
    if (!batchId) { setScheduledExams([]); return; }
    setIsLoadingExams(true);
    try { const res = await fetch(`/api/exams?batchId=${batchId}`); if (res.ok) { const data = await res.json(); setScheduledExams(data.exams || data.data || []); } } catch (error) { console.error('Error fetching scheduled exams:', error); }
    finally { setIsLoadingExams(false); }
  }, []);

  const fetchBatchDetails = useCallback(async (batchId) => {
    if (!batchId) return;
    setIsLoading(true);
    try {
      const batchData = batches.find(b => b.id.toString() === batchId.toString());
      if (batchData) setSelectedBatchData(batchData);
      const datesRes = await fetch(`/api/batches/${batchId}/terminal-dates`);
      if (datesRes.ok) { const d = await datesRes.json(); if (d.success) setTerminalDates(d); }
      const cRes = await fetch(`/api/classrooms?batchId=${batchId}&status=active`);
      if (cRes.ok) { const d = await cRes.json(); setClassrooms((d.classrooms || d.data || []).filter(c => c.status?.toLowerCase() === 'active')); }
      await fetchScheduledExams(batchId);
    } catch (error) { console.error('Error:', error); }
    finally { setIsLoading(false); }
  }, [batches, fetchScheduledExams]);

  useEffect(() => { fetchDepartments(); fetchExamTypes(); }, []);
  useEffect(() => { if (selectedDepartment) fetchBatches(selectedDepartment); }, [selectedDepartment, fetchBatches]);
  useEffect(() => { if (selectedBatch) fetchBatchDetails(selectedBatch); else setScheduledExams([]); }, [selectedBatch, fetchBatchDetails]);

  const activeClassrooms = useMemo(() => classrooms.filter(c => c.status?.toLowerCase() === 'active'), [classrooms]);
  const departmentId = useMemo(() => selectedDepartment ? parseInt(selectedDepartment) : selectedBatchData?.departmentId || null, [selectedDepartment, selectedBatchData]);

  const handleOpenMethodModal = (batch) => { setMethodBatch(batch); setShowMethodModal(true); };

  const handleMethodSelect = (method) => {
    setShowMethodModal(false);
    setSelectedBatch(methodBatch.id);
    if (method === 'individual') {
      setSelectedExam({});
      setTimeout(() => setShowExamFormModal(true), 200);
    } else if (method === 'bulk') {
      setTimeout(() => setShowBulkModal(true), 200);
    }
  };

  const handleCreateOrUpdateExam = async (examData) => {
    try {
      const url = examData.id ? `/api/exams/${examData.id}` : '/api/exams';
      const method = examData.id ? 'PUT' : 'POST';
      const payload = {
        name: examData.name,
        examTypeId: parseInt(examData.examTypeId),
        batchId: selectedBatch,
        departmentId: departmentId,
        startDate: examData.startDate,
        startTime: examData.startTime,
        endTime: examData.endTime,
        classroomId: examData.classroomId ? parseInt(examData.classroomId) : undefined,
        fullMarks: Number(examData.fullMarks) || 100,
        passMarks: Number(examData.passMarks) || 40,
        description: examData.description,
        status: examData.status || 'scheduled',
      };
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save exam');
      showMessage('success', 'Success', examData.id ? 'Exam updated' : 'Exam created');
      setSelectedExam(null);
      setShowExamFormModal(false);
      await fetchBatchDetails(selectedBatch);
    } catch (error) {
      showMessage('error', 'Error', error.message);
      throw error;
    }
  };

  const handleBulkSchedule = async (examsToCreate) => {
    setIsLoading(true);
    try {
      for (const exam of examsToCreate) {
        const res = await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exam) });
        if (!res.ok) throw new Error('Failed');
      }
      showMessage('success', 'Success', `Scheduled ${examsToCreate.length} exams`);
      setShowBulkModal(false);
      await fetchBatchDetails(selectedBatch);
    } catch (error) { showMessage('error', 'Error', error.message); }
    finally { setIsLoading(false); }
  };

  const handleExamTypeCreated = (newType) => { setExamTypes(prev => [newType, ...prev]); showMessage('success', 'Created', `"${newType.name}" created`); };
  const handleViewScheduledExams = (batch) => { setSelectedBatch(batch.id); setShowScheduledExamsModal(true); };

  const getBatchStatusColor = (status) => ({ active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Icons.CheckCircle } })[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Icons.Circle };
  const getRandomGradient = (i) => ['from-emerald-500 to-teal-600', 'from-blue-500 to-cyan-600', 'from-purple-500 to-pink-600', 'from-amber-500 to-orange-600'][i % 4];

  if (!hasReadPermission) {
    return <div className="flex items-center justify-center py-16"><div className="text-center p-8 bg-red-50 rounded-xl"><Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" /><h2 className="text-xl font-bold text-red-600">Access Denied</h2></div></div>;
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {message && (
          <motion.div key="toast-message" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 right-4 z-50 max-w-sm">
            <div className={`px-4 py-3 rounded-xl shadow-lg border-l-4 ${message.type === 'success' ? 'bg-emerald-50 border-l-emerald-500' : 'bg-red-50 border-l-red-500'}`}>
              <div className="flex items-center gap-3">
                {message.type === 'success' ? <Icons.CheckCircle className="w-5 h-5 text-emerald-500" /> : <Icons.AlertCircle className="w-5 h-5 text-red-500" />}
                <div><span className="font-semibold text-sm">{message.title}</span><p className="text-xs">{message.text}</p></div>
                <button onClick={() => setMessage(null)}><Icons.X className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Icons.BookOpen className="w-6 h-6 text-white" /></div><div><h2 className="text-xl font-bold">Internal Examinations</h2></div></div>
        <div className="mb-4"><label className="block text-xs font-semibold mb-2">Select Department</label><select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"><option value="">Choose department...</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        {selectedDepartment && (
          <div>
            <div className="flex items-center justify-between mb-3"><label className="text-xs font-semibold">Select Batch</label>{isLoadingBatches && <span className="text-xs text-gray-400"><Icons.Loader2 className="w-3 h-3 animate-spin inline" /> Loading...</span>}</div>
            {batches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {batches.map((batch, index) => {
                  const isSelected = selectedBatch === batch.id;
                  const sc = getBatchStatusColor(batch.status);
                  const Icon = sc.icon;
                  return (
                    <motion.div key={batch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02 }}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}
                      onClick={() => setSelectedBatch(isSelected ? null : batch.id)}>
                      {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center"><Icons.Check className="w-3.5 h-3.5 text-white" /></div>}
                      <div className="flex items-start gap-3 mb-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center`}><Icons.Users className="w-5 h-5 text-white" /></div><div><h4 className="font-semibold text-sm truncate">{batch.name}</h4></div></div>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${sc.bg} ${sc.text}`}><Icon className="w-3 h-3" />{batch.status || 'Active'}</div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenMethodModal(batch); }} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-lg hover:from-emerald-700 flex items-center justify-center gap-2"><Icons.PlusCircle className="w-4 h-4" />Create</button>
                        <button onClick={(e) => { e.stopPropagation(); handleViewScheduledExams(batch); }} className="px-3 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"><Icons.Eye className="w-4 h-4" />View</button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : <div className="text-center py-8 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500">No batches found</p></div>}
          </div>
        )}
      </div>

      {selectedBatch && (
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold flex items-center gap-2"><Icons.Building2 className="w-4 h-4 text-emerald-600" />Active Classrooms</h3><Badge variant={activeClassrooms.length > 0 ? 'success' : 'warning'}>{activeClassrooms.length} Active</Badge></div>
          {activeClassrooms.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">{activeClassrooms.map(c => <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" /><div><p className="text-xs font-medium truncate">{c.name || c.code}</p>{c.capacity && <p className="text-[10px]">Cap: {c.capacity}</p>}</div></div>)}</div>
          ) : <div className="text-center py-4 bg-amber-50 rounded-lg"><p className="text-sm text-amber-700">No active classrooms</p></div>}
        </div>
      )}

      {selectedBatch && terminalDates?.terminals && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Icons.Calendar className="w-4 h-4" />Examination Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{terminalDates.terminals.map((t, i) => <div key={i} className="bg-white rounded-xl p-3 border"><p className="font-medium text-sm">{t.terminalName}</p><div className="text-xs text-gray-500 mt-1"><p>Start: {formatDateDisplay(t.startDate)}</p><p>End: {formatDateDisplay(t.endDate)}</p><p>Duration: {t.examDays} days</p></div></div>)}</div>
        </div>
      )}

      <AnimatePresence>
        {showMethodModal && (
          <SchedulingMethodModal key="method-modal" isOpen={showMethodModal} onClose={() => setShowMethodModal(false)} batch={methodBatch} onSelect={handleMethodSelect} />
        )}
        {showExamFormModal && (
          <ExamFormModal
            key="exam-form-modal"
            isOpen={showExamFormModal}
            onClose={() => { setShowExamFormModal(false); setSelectedExam(null); }}
            onSubmit={handleCreateOrUpdateExam}
            initialData={selectedExam}
            classrooms={classrooms}
            examTypes={examTypes}
            onAddExamType={() => setShowNewExamTypeModal(true)}
            existingExamTypes={scheduledExams.map(exam => exam.examTypeId?.toString()).filter(Boolean)}
            batchId={selectedBatch}
          />
        )}
        {showBulkModal && (
          <BulkExamSchedulerModal 
            key="bulk-modal" 
            isOpen={showBulkModal} 
            onClose={() => setShowBulkModal(false)} 
            onSubmit={handleBulkSchedule} 
            classrooms={classrooms} 
            batchId={selectedBatch} 
            departmentId={departmentId} 
            isLoading={isLoading} 
            examTypes={examTypes} 
            onAddExamType={() => setShowNewExamTypeModal(true)} 
            existingExams={scheduledExams}
          />
        )}
        {showNewExamTypeModal && (
          <NewExamTypeModal key="new-exam-type-modal" isOpen={showNewExamTypeModal} onClose={() => setShowNewExamTypeModal(false)} onCreated={handleExamTypeCreated} />
        )}
        {showScheduledExamsModal && (
          <ScheduledExamsModal key="scheduled-exams-modal" isOpen={showScheduledExamsModal} onClose={() => setShowScheduledExamsModal(false)} exams={scheduledExams} isLoading={isLoadingExams} onRefresh={() => fetchScheduledExams(selectedBatch)} batchName={selectedBatchData?.name} examTypes={examTypes} />
        )}
      </AnimatePresence>
    </div>
  );
}