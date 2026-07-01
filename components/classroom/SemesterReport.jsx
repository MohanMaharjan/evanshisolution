// components/classroom/SemesterReport.jsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Printer,
  Calendar,
  Users,
  BookOpen,
  FileText,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import DateConverter from '@remotemerge/nepali-date-converter';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const addWeeks = (date, weeks) => {
  const r = new Date(date);
  r.setDate(r.getDate() + weeks * 7);
  return r;
};

const getBsForAd = (adDate) => {
  try {
    return new DateConverter(formatDateKey(adDate)).toBs();
  } catch {
    return null;
  }
};

export default function SemesterReport({
  isOpen,
  onClose,
  batchId,
  batchInfo,
  semesterStart,
  semesterEnd,
  events,
  allEvents,
  terminalConfig,
}) {
  const [headerContent, setHeaderContent] = useState('');
  const [footerContent, setFooterContent] = useState('');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSections, setSelectedSections] = useState({
    overview: true,
    timeline: true,
    events: true,
    exams: true,
    summary: true,
  });
  const reportRef = useRef(null);

  // Load saved header/footer from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    const savedHeader = localStorage.getItem(`semester_report_header_${batchId}`);
    const savedFooter = localStorage.getItem(`semester_report_footer_${batchId}`);
    if (savedHeader) setHeaderContent(savedHeader);
    if (savedFooter) setFooterContent(savedFooter);
  }, [batchId, isOpen]);

  // Save header/footer to localStorage
  const saveHeader = () => {
    localStorage.setItem(`semester_report_header_${batchId}`, headerContent);
    setIsEditingHeader(false);
  };

  const saveFooter = () => {
    localStorage.setItem(`semester_report_footer_${batchId}`, footerContent);
    setIsEditingFooter(false);
  };

  // Build report data
  useEffect(() => {
    if (!isOpen || !semesterStart || !allEvents) return;

    const startDate = new Date(semesterStart);
    const endDate = semesterEnd ? new Date(semesterEnd) : addWeeks(startDate, terminalConfig?.semesterDuration || 16);

    // Filter events within semester range
    const semesterEvents = allEvents.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= startDate && eventDate <= endDate;
    });

    // Group events by month
    const eventsByMonth = {};
    semesterEvents.forEach((e) => {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!eventsByMonth[monthKey]) {
        eventsByMonth[monthKey] = {
          month: date.getMonth(),
          year: date.getFullYear(),
          events: [],
        };
      }
      eventsByMonth[monthKey].events.push(e);
    });

    // Sort months
    const sortedMonths = Object.keys(eventsByMonth).sort();

    // Calculate statistics
    const stats = {
      totalEvents: semesterEvents.length,
      examEvents: semesterEvents.filter((e) => e.eventType === 'exam_start' || e.eventType === 'exam_end').length,
      holidays: semesterEvents.filter((e) => e.eventType === 'holiday').length,
      semesterStartEvents: semesterEvents.filter((e) => e.eventType === 'semester_start').length,
      semesterEndEvents: semesterEvents.filter((e) => e.eventType === 'semester_end').length,
      termEvents: semesterEvents.filter((e) => 
        e.eventType === 'first_term_start' || 
        e.eventType === 'second_term_start' ||
        e.eventType === 'first_term_end' ||
        e.eventType === 'second_term_end'
      ).length,
    };

    // Get Nepali date range
    const startBs = getBsForAd(startDate);
    const endBs = getBsForAd(endDate);

    setReportData({
      startDate,
      endDate,
      startBs,
      endBs,
      events: semesterEvents,
      eventsByMonth,
      sortedMonths,
      stats,
      duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)), // Weeks
    });
    setLoading(false);
  }, [isOpen, semesterStart, semesterEnd, allEvents, terminalConfig]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = document.getElementById('report-content');
    if (!content) return;

    const styles = document.querySelectorAll('style');
    let styleText = '';
    styles.forEach((style) => {
      styleText += style.innerHTML;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Semester Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; max-width: 1200px; margin: 0 auto; }
            .report-header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
            .report-footer { border-top: 2px solid #4f46e5; padding-top: 20px; margin-top: 20px; }
            .event-item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
            .stat-label { font-size: 12px; color: #64748b; }
            .month-section { margin: 20px 0; }
            .month-title { font-size: 18px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
            ${styleText}
          </style>
        </head>
        <body>
          <div id="print-content">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const content = document.getElementById('report-content');
    if (!content) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Semester Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; max-width: 1200px; margin: 0 auto; }
            .report-header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
            .report-footer { border-top: 2px solid #4f46e5; padding-top: 20px; margin-top: 20px; }
            .event-item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
            .stat-label { font-size: 12px; color: #64748b; }
            .month-section { margin: 20px 0; }
            .month-title { font-size: 18px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Semester_Report_${batchInfo?.name || 'Batch'}_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-50/95 backdrop-blur-sm">
      <div className="min-h-screen p-4 md:p-8">
        {/* Controls */}
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText size={24} />
                  Semester Report
                </h2>
                <p className="text-white/70 text-sm">
                  {batchInfo?.name || 'Batch'} • {reportData.duration} weeks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div id="report-content" className="p-6 md:p-8" ref={reportRef}>
            {/* Header Section - Editable */}
            <div className="report-header mb-6">
              {isEditingHeader ? (
                <div className="space-y-2">
                  <textarea
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter header content..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveHeader}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
                    >
                      <Save size={14} />
                      Save Header
                    </button>
                    <button
                      onClick={() => setIsEditingHeader(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: headerContent || '<p class="text-gray-400 text-center py-4">Click the edit button to add a custom header</p>' }}
                  />
                  <button
                    onClick={() => setIsEditingHeader(true)}
                    className="absolute top-0 right-0 p-2 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Report Body */}
            <div className="report-body space-y-8">
              {/* Overview Section */}
              {selectedSections.overview && (
                <div className="section-overview">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Calendar size={20} className="text-indigo-600" />
                      Overview
                    </h3>
                    <button
                      onClick={() => toggleSection('overview')}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{reportData.duration}</div>
                      <div className="text-xs text-blue-600 font-medium">Weeks</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-purple-700">{reportData.stats.totalEvents}</div>
                      <div className="text-xs text-purple-600 font-medium">Total Events</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{reportData.stats.examEvents}</div>
                      <div className="text-xs text-green-600 font-medium">Exams</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-orange-700">{reportData.stats.holidays}</div>
                      <div className="text-xs text-orange-600 font-medium">Holidays</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <span className="ml-2 font-medium">{reportData.startDate.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <span className="ml-2 font-medium">{reportData.endDate.toLocaleDateString()}</span>
                      </div>
                      {reportData.startBs && (
                        <div>
                          <span className="text-gray-500">Nepali Start:</span>
                          <span className="ml-2 font-medium">
                            {NEPALI_MONTHS[reportData.startBs.month - 1]} {reportData.startBs.year}
                          </span>
                        </div>
                      )}
                      {reportData.endBs && (
                        <div>
                          <span className="text-gray-500">Nepali End:</span>
                          <span className="ml-2 font-medium">
                            {NEPALI_MONTHS[reportData.endBs.month - 1]} {reportData.endBs.year}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Section */}
              {selectedSections.timeline && (
                <div className="section-timeline">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Clock size={20} className="text-indigo-600" />
                      Timeline
                    </h3>
                    <button
                      onClick={() => toggleSection('timeline')}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    {reportData.sortedMonths.map((monthKey, index) => {
                      const monthData = reportData.eventsByMonth[monthKey];
                      const monthName = new Date(monthData.year, monthData.month).toLocaleString('default', { month: 'long' });
                      return (
                        <div key={monthKey} className="relative pl-10 pb-6 last:pb-0">
                          <div className="absolute left-0 top-0.5 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-500">
                            <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{monthName} {monthData.year}</h4>
                            <p className="text-sm text-gray-500">{monthData.events.length} events</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {monthData.events.slice(0, 5).map((e, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                  {e.eventType.replace('_', ' ')}
                                </span>
                              ))}
                              {monthData.events.length > 5 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-500">
                                  +{monthData.events.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Events Section */}
              {selectedSections.events && (
                <div className="section-events">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FileText size={20} className="text-indigo-600" />
                      All Events
                    </h3>
                    <button
                      onClick={() => toggleSection('events')}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Type</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Description</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.events.map((event, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-700">
                              {new Date(event.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {event.eventType.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">{event.description}</td>
                            <td className="px-4 py-2">
                              {event.isAutoGenerated ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Auto</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Manual</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Exams Summary */}
              {selectedSections.exams && (
                <div className="section-exams">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Award size={20} className="text-indigo-600" />
                      Exam Summary
                    </h3>
                    <button
                      onClick={() => toggleSection('exams')}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-purple-700">
                        {reportData.events.filter(e => e.eventType === 'exam_start').length}
                      </div>
                      <div className="text-sm text-purple-600">Exam Days</div>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-indigo-700">
                        {reportData.events.filter(e => e.eventType === 'first_term_start' || e.eventType === 'second_term_start').length}
                      </div>
                      <div className="text-sm text-indigo-600">Term Exams</div>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-pink-700">
                        {reportData.events.filter(e => e.eventType === 'result_publication').length}
                      </div>
                      <div className="text-sm text-pink-600">Results Published</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Section */}
              {selectedSections.summary && (
                <div className="section-summary">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <CheckCircle size={20} className="text-indigo-600" />
                      Summary
                    </h3>
                    <button
                      onClick={() => toggleSection('summary')}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Events:</span>
                        <span className="ml-2 font-bold text-gray-800">{reportData.stats.totalEvents}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Exams:</span>
                        <span className="ml-2 font-bold text-gray-800">{reportData.stats.examEvents}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Holidays:</span>
                        <span className="ml-2 font-bold text-gray-800">{reportData.stats.holidays}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Term Events:</span>
                        <span className="ml-2 font-bold text-gray-800">{reportData.stats.termEvents}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Section - Editable */}
            <div className="report-footer mt-8 pt-6 border-t border-gray-200">
              {isEditingFooter ? (
                <div className="space-y-2">
                  <textarea
                    value={footerContent}
                    onChange={(e) => setFooterContent(e.target.value)}
                    className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter footer content..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveFooter}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
                    >
                      <Save size={14} />
                      Save Footer
                    </button>
                    <button
                      onClick={() => setIsEditingFooter(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div 
                    className="prose max-w-none text-sm text-gray-600"
                    dangerouslySetInnerHTML={{ __html: footerContent || '<p class="text-gray-400 text-center py-2">Click the edit button to add a custom footer</p>' }}
                  />
                  <button
                    onClick={() => setIsEditingFooter(true)}
                    className="absolute top-0 right-0 p-2 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}