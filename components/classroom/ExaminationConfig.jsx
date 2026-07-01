// components/classroom/ExaminationConfig.jsx

'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';

export default function ExaminationConfig({ batch, batchId, onSave, onClose, isOpen }) {
  const [config, setConfig] = useState({
    termCount: 2,
    termWeeks: [7, 12],
    examDays: 5,
    semesterDuration: 16,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Use batchId if available, otherwise use batch.id
  const effectiveBatchId = batchId || batch?.id;

  // Fetch config when modal opens
  useEffect(() => {
    if (effectiveBatchId && isOpen) {
      fetchConfig();
    }
  }, [effectiveBatchId, isOpen]);

  const fetchConfig = async () => {
    if (!effectiveBatchId) {
      console.warn('No batch ID available for fetching config');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/terminal-config?batchId=${effectiveBatchId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      }
    } catch (err) {
      setError('Failed to load configuration');
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!effectiveBatchId) {
      setError('No batch ID available');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/terminal-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: effectiveBatchId,
          termCount: config.termCount,
          termWeeks: config.termWeeks,
          examDays: config.examDays,
          semesterDuration: config.semesterDuration,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save config');
      }

      if (onSave) {
        onSave(data.config);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const addTermWeek = () => {
    const lastWeek = config.termWeeks[config.termWeeks.length - 1] || 7;
    setConfig({
      ...config,
      termWeeks: [...config.termWeeks, lastWeek + 5],
    });
  };

  const removeTermWeek = (index) => {
    if (config.termWeeks.length <= 1) return;
    const newWeeks = config.termWeeks.filter((_, i) => i !== index);
    setConfig({ ...config, termWeeks: newWeeks });
  };

  const updateTermWeek = (index, value) => {
    const newWeeks = [...config.termWeeks];
    newWeeks[index] = parseInt(value) || 0;
    setConfig({ ...config, termWeeks: newWeeks });
  };

  const batchName = batch?.name || (batchId ? `Batch #${batchId}` : 'Batch');

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Terminal Exam Configuration</h2>
            <p className="text-sm text-gray-500">{batchName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Semester Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester Duration (weeks)
            </label>
            <input
              type="number"
              min="8"
              max="24"
              value={config.semesterDuration}
              onChange={(e) => setConfig({ ...config, semesterDuration: parseInt(e.target.value) || 16 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 16 weeks</p>
          </div>

          {/* Number of Term Exams */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Terminal Exams
            </label>
            <select
              value={config.termCount}
              onChange={(e) => {
                const count = parseInt(e.target.value);
                const currentWeeks = config.termWeeks;
                let newWeeks = [...currentWeeks];
                if (count > currentWeeks.length) {
                  const lastWeek = currentWeeks[currentWeeks.length - 1] || 7;
                  for (let i = currentWeeks.length; i < count; i++) {
                    newWeeks.push(lastWeek + (i - currentWeeks.length + 1) * 5);
                  }
                } else {
                  newWeeks = currentWeeks.slice(0, count);
                }
                setConfig({
                  ...config,
                  termCount: count,
                  termWeeks: newWeeks,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {[1, 2, 3, 4].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Exam' : 'Exams'}
                </option>
              ))}
            </select>
          </div>

          {/* Term Weeks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Exam Week Numbers
              </label>
              <button
                onClick={addTermWeek}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <Plus size={16} /> Add Week
              </button>
            </div>
            <div className="space-y-2">
              {config.termWeeks.map((week, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={config.semesterDuration - 1}
                    value={week}
                    onChange={(e) => updateTermWeek(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Week ${index + 1}`}
                  />
                  <button
                    onClick={() => removeTermWeek(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={config.termWeeks.length <= 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Specify the week numbers when terminal exams should start
            </p>
          </div>

          {/* Exam Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Days per Terminal
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.examDays}
              onChange={(e) => setConfig({ ...config, examDays: parseInt(e.target.value) || 5 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Number of exam days for each terminal</p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Semester Duration: {config.semesterDuration} weeks</p>
              <p>• Number of Terminals: {config.termCount}</p>
              <p>• Exam Weeks: {config.termWeeks.join(', ')}</p>
              <p>• Exam Days per Terminal: {config.examDays}</p>
              <p className="text-xs text-gray-500 mt-2">
                Total exam days: {config.termCount * config.examDays}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}