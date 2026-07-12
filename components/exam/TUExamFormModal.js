'use client';

import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function TUExamFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    courseCode: '',
    courseId: '',
    semester: 'semester1',
    examSymbol: 'regular',
    examYear: new Date().getFullYear().toString(),
    batchId: '',
    tuExamCode: '',
    startDate: '',
    endDate: '',
    startTime: '',
    duration: '',
    fullMarks: '',
    passMarks: '',
    description: '',
    status: 'scheduled',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        courseCode: initialData.courseCode || '',
        courseId: initialData.courseId || '',
        semester: initialData.semester || 'semester1',
        examSymbol: initialData.examSymbol || 'regular',
        examYear: initialData.examYear || new Date().getFullYear().toString(),
        batchId: initialData.batchId || '',
        tuExamCode: initialData.tuExamCode || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        startTime: initialData.startTime || '',
        duration: initialData.duration || '',
        fullMarks: initialData.fullMarks || '',
        passMarks: initialData.passMarks || '',
        description: initialData.description || '',
        status: initialData.status || 'scheduled',
      });
    } else {
      setFormData({
        name: '',
        courseCode: '',
        courseId: '',
        semester: 'semester1',
        examSymbol: 'regular',
        examYear: new Date().getFullYear().toString(),
        batchId: '',
        tuExamCode: '',
        startDate: '',
        endDate: '',
        startTime: '',
        duration: '',
        fullMarks: '',
        passMarks: '',
        description: '',
        status: 'scheduled',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Exam name is required';
    if (!formData.examYear) newErrors.examYear = 'Exam year is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.fullMarks) newErrors.fullMarks = 'Full marks is required';
    if (!formData.passMarks) newErrors.passMarks = 'Pass marks is required';
    if (formData.fullMarks && formData.passMarks && Number(formData.passMarks) >= Number(formData.fullMarks)) {
      newErrors.passMarks = 'Pass marks must be less than full marks';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        examYear: Number(formData.examYear),
        fullMarks: Number(formData.fullMarks),
        passMarks: Number(formData.passMarks),
        duration: formData.duration ? Number(formData.duration) : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Icons.GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Edit TU Exam' : 'Add TU Exam'}
              </h3>
              <p className="text-xs text-gray-500">Tribhuvan University examination details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Icons.X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exam Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Exam Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., TU BCA 2nd Semester Regular Exam 2079"
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* TU Exam Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">TU Exam Code</label>
              <input
                type="text"
                value={formData.tuExamCode}
                onChange={(e) => handleChange('tuExamCode', e.target.value)}
                placeholder="e.g., TU-BCA-2079-R"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
              />
            </div>

            {/* Exam Symbol */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Exam Symbol</label>
              <select
                value={formData.examSymbol}
                onChange={(e) => handleChange('examSymbol', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="regular">Regular</option>
                <option value="back">Back</option>
                <option value="reexam">Re-Exam</option>
                <option value="improvement">Improvement</option>
                <option value="special">Special</option>
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={`semester${s}`}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Exam Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Exam Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.examYear}
                onChange={(e) => handleChange('examYear', e.target.value)}
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.examYear ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              >
                {[2075, 2076, 2077, 2078, 2079, 2080, 2081, 2082, 2083, 2084, 2085].map((y) => (
                  <option key={y} value={y}>{y} BS</option>
                ))}
              </select>
              {errors.examYear && <p className="text-xs text-red-500 mt-1">{errors.examYear}</p>}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                min={formData.startDate}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="e.g., 180"
                min="1"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Full Marks */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.fullMarks}
                onChange={(e) => handleChange('fullMarks', e.target.value)}
                placeholder="e.g., 100"
                min="1"
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.fullMarks ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.fullMarks && <p className="text-xs text-red-500 mt-1">{errors.fullMarks}</p>}
            </div>

            {/* Pass Marks */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Pass Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.passMarks}
                onChange={(e) => handleChange('passMarks', e.target.value)}
                placeholder="e.g., 40"
                min="0"
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.passMarks ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.passMarks && <p className="text-xs text-red-500 mt-1">{errors.passMarks}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Additional notes or TU-specific instructions..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Icons.Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update TU Exam' : 'Create TU Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}