// components/classroom/AcademicCalendarReport.jsx

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Download, Printer, Calendar, Settings, Loader2, FileText,
  Maximize2, Minimize2, Eye, LayoutDashboard, Rows, Columns,
  GripHorizontal, Shrink, MousePointer2,
} from 'lucide-react';
import DateConverter from '@remotemerge/nepali-date-converter';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportHeader, ReportFooter } from '@/components/reports/ReportLetterhead';
import { INSTITUTE_INFO } from '@/lib/config/institute';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const NEPALI_DAYS_SHORT = ['आ', 'सो', 'म', 'बु', 'बि', 'शु', 'श'];
const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toNepaliNumber = (num) => String(num).replace(/\d/g, (d) => NEPALI_DIGITS[parseInt(d)]);

const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const addWeeks = (date, weeks) => { const r = new Date(date); r.setDate(r.getDate() + weeks * 7); return r; };
const getBsForAd = (adDate) => { try { return new DateConverter(formatDateKey(adDate)).toBs(); } catch { return null; } };
const getNepaliMonthDays = (bsYear, bsMonth) => { let c = 0; for (let d = 28; d <= 32; d++) { try { new DateConverter(`${bsYear}-${bsMonth}-${d}`).toAd(); c = d; } catch { break; } } return c; };
const getAdForBs = (bsYear, bsMonth, bsDay) => { try { const a = new DateConverter(`${bsYear}-${bsMonth}-${bsDay}`).toAd(); return new Date(a.year, a.month - 1, a.date); } catch { return null; } };

const EVENT_COLORS = {
  semester_start: { bg: '#dcfce7', color: '#166534', border: '#86efac', label: 'Sem Start' },
  semester_end: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'Sem End' },
  holiday: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: 'Holiday' },
  exam_start: { bg: '#f3e8ff', color: '#6b21a5', border: '#d8b4fe', label: 'Exam' },
  exam_end: { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd', label: 'Exam End' },
  first_term_start: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', label: 'Term 1' },
  second_term_start: { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc', label: 'Term 2' },
  result_publication: { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4', label: 'Results' },
  meeting: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Meeting' },
  other: { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4', label: 'Other' },
};

const A4_DEFAULTS = {
  calendarMinHeight: 90, eventFontSize: 8, eventBadgeFontSize: 7, eventDescriptionFontSize: 8,
  eventPadding: 4, eventMargin: 1, eventGap: 6, calendarCellPadding: 1, calendarCellFontSize: 7,
  calendarColumnGap: 0.5, monthGap: 3, dayHeaderPadding: 1, dayHeaderFontSize: 6,
  headerPadding: 10, footerPadding: 6, reportTitleFontSize: 11, subtitleFontSize: 8,
  titlePadding: 12, subtitlePadding: 10, eventsSectionPadding: 5, eventsGap: 4,
  titleLineHeight: 1.7, subtitleLineHeight: 1.6, eventLineHeight: 1.6,
  eventDescLineHeight: 1.5, monthHeaderLineHeight: 1.5, dayCellLineHeight: 1.4,
  eventDescPadding: 6,
};

const A4_COMPACT = {
  calendarMinHeight: 80, eventFontSize: 7, eventBadgeFontSize: 6, eventDescriptionFontSize: 7,
  eventPadding: 2, eventMargin: 0, eventGap: 3, calendarCellPadding: 0, calendarCellFontSize: 6,
  calendarColumnGap: 0.5, monthGap: 2, dayHeaderPadding: 0, dayHeaderFontSize: 5,
  headerPadding: 4, footerPadding: 3, reportTitleFontSize: 8, subtitleFontSize: 6,
  titlePadding: 5, subtitlePadding: 4, eventsSectionPadding: 2, eventsGap: 2,
  titleLineHeight: 1.3, subtitleLineHeight: 1.2, eventLineHeight: 1.3, eventDescLineHeight: 1.2,
  monthHeaderLineHeight: 1.2, dayCellLineHeight: 1.2, eventDescPadding: 2,
};

const A4_READABLE = {
  calendarMinHeight: 120, eventFontSize: 9, eventBadgeFontSize: 8, eventDescriptionFontSize: 9,
  eventPadding: 6, eventMargin: 2, eventGap: 8, calendarCellPadding: 2, calendarCellFontSize: 8,
  calendarColumnGap: 1, monthGap: 4, dayHeaderPadding: 2, dayHeaderFontSize: 7,
  headerPadding: 12, footerPadding: 8, reportTitleFontSize: 14, subtitleFontSize: 9,
  titlePadding: 16, subtitlePadding: 12, eventsSectionPadding: 8, eventsGap: 5,
  titleLineHeight: 1.8, subtitleLineHeight: 1.7, eventLineHeight: 1.8, eventDescLineHeight: 1.7,
  monthHeaderLineHeight: 1.6, dayCellLineHeight: 1.5, eventDescPadding: 10,
};

// EXTENDED RANGE CONTROLS - from negative to very large
const SIZE_CONTROLS = [
  { key: 'calendarMinHeight', label: 'Row H', icon: Rows, min: -50, max: 500, step: 5 },
  { key: 'monthGap', label: 'M Gap', icon: GripHorizontal, min: -10, max: 30, step: 1 },
  { key: 'calendarColumnGap', label: 'C Gap', icon: Columns, min: -5, max: 10, step: 0.5 },
  { key: 'eventFontSize', label: 'Evt F', min: -10, max: 40, step: 0.5 },
  { key: 'eventBadgeFontSize', label: 'Badge', min: -10, max: 35, step: 0.5 },
  { key: 'eventDescriptionFontSize', label: 'Desc F', min: -10, max: 40, step: 0.5 },
  { key: 'eventPadding', label: 'E Pad', min: -10, max: 30, step: 1 },
  { key: 'eventGap', label: 'E Gap', min: -10, max: 30, step: 1 },
  { key: 'eventMargin', label: 'E Mgn', min: -10, max: 20, step: 1 },
  { key: 'calendarCellPadding', label: 'CellP', min: -10, max: 15, step: 1 },
  { key: 'calendarCellFontSize', label: 'DayF', min: -10, max: 30, step: 0.5 },
  { key: 'dayHeaderFontSize', label: 'HdrF', min: -10, max: 25, step: 0.5 },
  { key: 'dayHeaderPadding', label: 'HdrP', min: -10, max: 15, step: 1 },
  { key: 'reportTitleFontSize', label: 'TitF', min: -10, max: 50, step: 1 },
  { key: 'subtitleFontSize', label: 'SubF', min: -10, max: 35, step: 0.5 },
  { key: 'titlePadding', label: 'T Pad', min: -20, max: 60, step: 1 },
  { key: 'subtitlePadding', label: 'S Pad', min: -20, max: 50, step: 1 },
  { key: 'eventsSectionPadding', label: 'EvSP', min: -10, max: 35, step: 1 },
  { key: 'headerPadding', label: 'H Pad', min: -10, max: 50, step: 1 },
  { key: 'footerPadding', label: 'F Pad', min: -10, max: 40, step: 1 },
  { key: 'titleLineHeight', label: 'TitLH', min: -2, max: 6, step: 0.1 },
  { key: 'subtitleLineHeight', label: 'SubLH', min: -2, max: 5, step: 0.1 },
  { key: 'eventLineHeight', label: 'EvtLH', min: -2, max: 6, step: 0.1 },
  { key: 'eventDescLineHeight', label: 'DscLH', min: -2, max: 5, step: 0.1 },
  { key: 'eventDescPadding', label: 'DscPad', min: -10, max: 40, step: 1 },
];

export default function AcademicCalendarReport({
  isOpen, onClose, batchId, batchInfo, semesterStart, semesterEnd,
  events, allEvents, terminalConfig, institute, referenceNo,
}) {
  const instituteInfo = { ...INSTITUTE_INFO, ...(institute || {}) };

  const [scale, setScale] = useState(1.0);
  // START WITH COMPACT BY DEFAULT
  const [baseSizes, setBaseSizes] = useState({ ...A4_COMPACT });

  const sizes = useMemo(() => {
    const result = {};
    for (const key of Object.keys(A4_DEFAULTS)) {
      result[key] = Math.round(baseSizes[key] * scale * 100) / 100;
    }
    return result;
  }, [baseSizes, scale]);

  const updateBase = useCallback((key, value) => {
    setBaseSizes((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale((prev) => {
          const delta = e.deltaY > 0 ? -0.04 : 0.04;
          return Math.max(0.1, Math.min(5.0, parseFloat((prev + delta).toFixed(2))));
        });
      }
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, []);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSizeControls, setShowSizeControls] = useState(false);
  const [includeEnglish, setIncludeEnglish] = useState(false);
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [includeGlobalEvents, setIncludeGlobalEvents] = useState(true);
  const [showGroupedExams, setShowGroupedExams] = useState(true);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const reportRef = useRef(null);

  const applyPreset = useCallback((preset, newScale = 1.0) => {
    setBaseSizes({ ...preset });
    setScale(newScale);
    if (preset === A4_COMPACT) setIncludeEnglish(false);
    if (preset === A4_READABLE) setIncludeEnglish(true);
  }, []);

  // Reset goes to COMPACT
  const resetSizes = useCallback(() => {
    setBaseSizes({ ...A4_COMPACT });
    setScale(1.0);
    setIncludeEnglish(false);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const batchResponse = await fetch(`/api/academic-calendar?batchId=${batchId}&limit=500`);
      if (!batchResponse.ok) return [];
      const batchEvents = (await batchResponse.json()).events || [];
      const globalResponse = await fetch(`/api/academic-calendar?limit=500`);
      if (!globalResponse.ok) return batchEvents;
      const globalEvents = ((await globalResponse.json()).events || []).filter(e => !e.batchId);
      return [...batchEvents, ...globalEvents];
    } catch { return []; }
  }, [batchId]);

  useEffect(() => {
    if (!isOpen || !semesterStart || !batchId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const fetched = await fetchEvents();
        if (!mounted) return;
        const list = fetched.length ? fetched : (allEvents || events || []);
        if (!list.length) {
          setReportData({ startDate: new Date(semesterStart), endDate: semesterEnd ? new Date(semesterEnd) : addWeeks(new Date(semesterStart), 16), startBs: null, endBs: null, months: [], events: [], stats: { totalEvents: 0, examEvents: 0, holidays: 0, termEvents: 0, resultEvents: 0, globalEvents: 0, batchEvents: 0 }, totalMonths: 0 });
          if (mounted) setLoading(false);
          return;
        }
        const start = new Date(semesterStart); start.setHours(0, 0, 0, 0);
        const end = semesterEnd ? new Date(semesterEnd) : addWeeks(start, terminalConfig?.semesterDuration || 16);
        end.setHours(23, 59, 59, 999);
        const sBs = getBsForAd(start), eBs = getBsForAd(end);
        if (!sBs || !eBs) { if (mounted) setLoading(false); return; }
        const inRange = list.filter(e => { const ed = new Date(e.date); return ed >= start && ed <= end; });
        const months = [];
        let y = sBs.year, m = sBs.month;
        while (y < eBs.year || (y === eBs.year && m <= eBs.month)) {
          const dim = getNepaliMonthDays(y, m);
          const mEvts = inRange.filter(e => {
            const eb = getBsForAd(new Date(e.date));
            if (!eb || eb.year !== y || eb.month !== m) return false;
            if (e.batchId === parseInt(batchId)) return true;
            return !e.batchId && includeGlobalEvents;
          });
          const days = [];
          for (let d = 1; d <= dim; d++) {
            const ad = getAdForBs(y, m, d);
            if (!ad) continue;
            const dk = formatDateKey(ad);
            const dEvts = inRange.filter(e => {
              if (formatDateKey(new Date(e.date)) !== dk) return false;
              if (e.batchId === parseInt(batchId)) return true;
              return !e.batchId && includeGlobalEvents;
            });
            const dow = ad.getDay();
            days.push({ bsDay: d, adDate: ad, dayOfWeek: dow, isWeekend: dow === 6, events: dEvts, hasEvents: !!dEvts.length, hasGlobalEvent: dEvts.some(e => !e.batchId), hasBatchEvent: dEvts.some(e => e.batchId), isToday: dk === formatDateKey(new Date()) });
          }
          months.push({ bsYear: y, bsMonth: m, bsMonthName: NEPALI_MONTHS[m - 1], daysInMonth: dim, days, events: mEvts, batchEventCount: mEvts.filter(e => e.batchId).length, globalEventCount: mEvts.filter(e => !e.batchId).length, eventCount: mEvts.length });
          m++; if (m > 12) { m = 1; y++; }
        }
        const stats = { totalEvents: inRange.length, examEvents: inRange.filter(e => e.eventType === 'exam_start' || e.eventType === 'exam_end').length, holidays: inRange.filter(e => e.eventType === 'holiday').length, termEvents: inRange.filter(e => e.eventType === 'first_term_start' || e.eventType === 'second_term_start').length, resultEvents: inRange.filter(e => e.eventType === 'result_publication').length, globalEvents: inRange.filter(e => !e.batchId).length, batchEvents: inRange.filter(e => e.batchId).length };
        if (mounted) setReportData({ startDate: start, endDate: end, startBs: sBs, endBs: eBs, months, events: inRange, stats, totalMonths: months.length });
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [isOpen, semesterStart, semesterEnd, allEvents, events, batchId, terminalConfig, includeGlobalEvents, fetchEvents]);

  const getEventColor = (type) => EVENT_COLORS[type] || EVENT_COLORS.other;

  const getGroupedEvents = (events) => {
    const groups = []; let cur = null;
    events.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(ev => {
      const isExam = ['exam_start', 'exam_end', 'first_term_start', 'second_term_start'].includes(ev.eventType);
      if (isExam && showGroupedExams) {
        if (!cur || ev.eventType === 'first_term_start' || ev.eventType === 'second_term_start') {
          cur = { type: 'exam_group', label: ev.description?.match(/Terminal \d+/)?.[0] || 'Terminal', events: [], startDate: ev.date, endDate: ev.date };
          groups.push(cur);
        }
        cur.events.push(ev);
        if (ev.date > cur.endDate) cur.endDate = ev.date;
      } else { groups.push({ type: 'single', event: ev }); cur = null; }
    });
    return groups;
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const content = document.getElementById('report-content');
      if (!content) throw new Error('Report content not found');
      const [omh, oov, oh] = [content.style.maxHeight, content.style.overflow, content.style.height];
      content.style.maxHeight = 'none'; content.style.overflow = 'visible'; content.style.height = 'auto';
      await new Promise(r => setTimeout(r, 500));
      const canvas = await html2canvas(content, {
        scale: 4, useCORS: true, logging: false, backgroundColor: '#ffffff',
        imageTimeout: 0, windowWidth: content.scrollWidth, windowHeight: content.scrollHeight,
        onclone: (cd) => {
          const cc = cd.getElementById('report-content');
          if (cc) { cc.style.maxHeight = 'none'; cc.style.overflow = 'visible'; cc.style.height = 'auto'; }
          const ft = cd.querySelector('[data-footer]');
          if (ft) { ft.style.display = 'block'; ft.style.visibility = 'visible'; ft.style.position = 'relative'; }
        }
      });
      content.style.maxHeight = omh; content.style.overflow = oov; content.style.height = oh;
      const img = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: false });
      const pw = pdf.internal.pageSize.getWidth(), ph = (canvas.height * pw) / canvas.width;
      let left = ph, pos = 0;
      pdf.addImage(img, 'PNG', 0, pos, pw, ph, undefined, 'FAST');
      left -= ph;
      while (left > 0) { pos = left - ph; pdf.addPage(); pdf.addImage(img, 'PNG', 0, pos, pw, ph, undefined, 'FAST'); left -= ph; }
      const blob = pdf.output('blob');
      setPdfBlobUrl(URL.createObjectURL(blob)); setShowPDFPreview(true);
    } catch (e) { console.error(e); alert('PDF generation failed.'); }
    finally { setGeneratingPDF(false); }
  };

  const downloadPDF = () => {
    if (pdfBlobUrl) {
      const a = document.createElement('a'); a.href = pdfBlobUrl;
      a.download = `Academic_Calendar_${batchInfo?.name || 'Batch'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };
  const printPDF = () => { if (pdfBlobUrl) { const w = window.open(pdfBlobUrl, '_blank'); if (w) w.onload = () => w.print(); } };
  const handleClose = useCallback(() => { setShowPDFPreview(false); if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); } onClose(); }, [onClose, pdfBlobUrl]);

  if (!isOpen) return null;
  if (loading) return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"><div className="bg-white rounded-2xl p-6"><Loader2 size={32} className="animate-spin text-teal-600 mx-auto" /><p className="mt-3 text-sm text-gray-600">Loading…</p></div></div>;
  if (!reportData) return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"><div className="bg-white rounded-2xl p-6 max-w-md text-center"><Calendar size={48} className="text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-bold">No Data</h3><button onClick={handleClose} className="px-4 py-2 bg-teal-600 text-white rounded-lg mt-4">Close</button></div></div>;

  const scalePercent = Math.round(scale * 100);

  // Determine which preset is active for button highlighting
  const isCompact = JSON.stringify(baseSizes) === JSON.stringify(A4_COMPACT);
  const isReadable = JSON.stringify(baseSizes) === JSON.stringify(A4_READABLE);

  return (
    <>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-100/95 backdrop-blur-sm">
        <div className="min-h-screen p-2 md:p-3 flex flex-col">

          {/* TOOLBAR */}
          <div className="no-print max-w-[210mm] mx-auto mb-2 flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl shadow-lg p-2 w-full">
            <div className="flex items-center gap-2">
              <button onClick={handleClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={14} className="text-slate-500" /></button>
              <div className="h-5 w-px bg-slate-200" />
              <div>
                <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={12} className="text-teal-600" />
                  Calendar: {batchInfo?.name || 'Batch'}
                  <span className="text-[10px] font-normal text-slate-500">({reportData.totalMonths}m · {reportData.stats.totalEvents} events)</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => applyPreset(A4_COMPACT)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 border transition-colors ${isCompact ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}><Shrink size={10} />Compact</button>
              <button onClick={() => applyPreset(A4_READABLE)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 border transition-colors ${isReadable ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}><Eye size={10} />Readable</button>
              <button onClick={() => setShowSizeControls(!showSizeControls)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 border ${showSizeControls ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}><LayoutDashboard size={10} />Fine-Tune</button>
              <button onClick={() => setShowSettings(!showSettings)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 border ${showSettings ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}><Settings size={10} />Filter</button>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 px-1.5 py-0.5">
                <button onClick={() => setScale(p => Math.max(0.1, parseFloat((p - 0.1).toFixed(2))))} className="p-0.5 hover:bg-slate-200 rounded"><Minimize2 size={10} /></button>
                <span className="text-[10px] font-mono font-semibold text-slate-700 min-w-[32px] text-center">{scalePercent}%</span>
                <button onClick={() => setScale(p => Math.min(5.0, parseFloat((p + 0.1).toFixed(2))))} className="p-0.5 hover:bg-slate-200 rounded"><Maximize2 size={10} /></button>
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <button onClick={generatePDF} disabled={generatingPDF} className="px-2.5 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-[10px] font-medium disabled:opacity-50 flex items-center gap-1">{generatingPDF ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}PDF</button>
              <button onClick={generatePDF} disabled={generatingPDF} className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"><Download size={12} /></button>
            </div>
          </div>

          {/* ZOOM HINT */}
          <div className="no-print max-w-[210mm] mx-auto mb-1.5 w-full">
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
              <MousePointer2 size={9} />
              <span>Hold <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[8px] font-mono font-bold text-slate-500">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[8px] font-mono font-bold text-slate-500">Scroll</kbd> to zoom</span>
            </div>
          </div>

          {/* FINE-TUNE PANEL */}
          {showSizeControls && (
            <div className="no-print max-w-[210mm] mx-auto mb-2 bg-white rounded-xl shadow-lg p-3 w-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-slate-700">Fine-Tune Layout (Extended Range)</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowGroupedExams(!showGroupedExams)} className={`text-[9px] px-2 py-0.5 rounded-md font-medium ${showGroupedExams ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{showGroupedExams ? '◆ Grouped' : '◇ List'}</button>
                  <button onClick={resetSizes} className="text-[9px] text-teal-600 hover:text-teal-800 font-semibold">Reset</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {SIZE_CONTROLS.map((ctrl) => {
                  const Icon = ctrl.icon;
                  const computedVal = sizes[ctrl.key];
                  const baseVal = baseSizes[ctrl.key];
                  return (
                    <div key={ctrl.key} className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                      <label className="flex items-center justify-between text-[8px] font-medium text-slate-500 mb-1">
                        <span className="flex items-center gap-0.5">{Icon && <Icon size={8} className="text-slate-400" />}{ctrl.label}</span>
                        <span className={`font-mono font-bold ${computedVal < 0 ? 'text-red-500' : 'text-slate-700'}`}>{computedVal.toFixed(1)}</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateBase(ctrl.key, Math.max(ctrl.min, parseFloat((baseVal - ctrl.step).toFixed(2))))} className="p-0.5 bg-white rounded border border-slate-200 hover:bg-slate-100"><Minimize2 size={7} className="text-slate-500" /></button>
                        <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={baseVal} onChange={e => updateBase(ctrl.key, parseFloat(e.target.value))} className="w-full h-1 accent-teal-500 cursor-pointer" />
                        <button onClick={() => updateBase(ctrl.key, Math.min(ctrl.max, parseFloat((baseVal + ctrl.step).toFixed(2))))} className="p-0.5 bg-white rounded border border-slate-200 hover:bg-slate-100"><Maximize2 size={7} className="text-slate-500" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FILTER PANEL */}
          {showSettings && (
            <div className="no-print max-w-[210mm] mx-auto mb-2 bg-white rounded-xl shadow-lg p-3 w-full">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"><input type="checkbox" checked={includeEnglish} onChange={e => setIncludeEnglish(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600" />English Dates</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"><input type="checkbox" checked={includeWeekends} onChange={e => setIncludeWeekends(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600" />Weekends</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"><input type="checkbox" checked={includeGlobalEvents} onChange={e => setIncludeGlobalEvents(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600" />Global</label>
              </div>
            </div>
          )}

          {/* REPORT CONTENT - rest remains the same */}
          <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-xl overflow-visible flex-1 flex flex-col">
            <div id="report-content" ref={reportRef} style={{ padding: `${Math.max(0, sizes.headerPadding)}px`, overflow: 'visible', maxHeight: 'none', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: `${Math.max(0, sizes.titlePadding)}px 0` }}>
                  <ReportHeader
                    institute={instituteInfo}
                    reportTitle="📅 Academic Calendar"
                    referenceNo={referenceNo}
                    titleFontSize={Math.max(1, sizes.reportTitleFontSize)}
                    subtitleFontSize={Math.max(1, sizes.subtitleFontSize)}
                    subtitle={
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${Math.max(0, sizes.eventGap)}px`, padding: `${Math.max(0, sizes.eventPadding)}px 0px`, lineHeight: `${sizes.subtitleLineHeight}` }}>
                        <span style={{ fontWeight: 600 }}>{batchInfo?.name || 'Batch'}</span>
                        <span style={{ color: '#94a3b8' }}>•</span>
                        <span>{reportData.totalMonths} months</span>
                        <span style={{ color: '#94a3b8' }}>•</span>
                        <span>{reportData.stats.totalEvents} events</span>
                        {reportData.stats.globalEvents > 0 && <span style={{ color: '#3b82f6', fontWeight: 500 }}>({reportData.stats.globalEvents} global)</span>}
                      </span>
                    }
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: `${sizes.monthGap}px`, flex: 1 }}>
                  {reportData.months.map((month, mi) => {
                    const fdom = month.days[0]?.dayOfWeek || 0;
                    const groupedEvents = getGroupedEvents(month.events);
                    return (
                      <div key={mi} style={{ display: 'flex', gap: `${sizes.monthGap}px`, minHeight: `${Math.max(10, sizes.calendarMinHeight)}px`, alignItems: 'stretch', pageBreakInside: 'avoid' }}>
                        <div style={{ flex: '0 0 50%', border: '1px solid #e2e8f0', borderRadius: '3px', overflow: 'hidden', background: '#fff' }}>
                          <div style={{ background: 'linear-gradient(135deg,#f0fdfa,#f1f5f9)', padding: `${Math.max(0, sizes.dayHeaderPadding)}px ${Math.max(0, sizes.eventsSectionPadding) + 2}px`, fontWeight: 700, fontSize: `${Math.max(6, sizes.reportTitleFontSize - 2)}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', lineHeight: `${sizes.monthHeaderLineHeight}` }}>
                            <span style={{ color: '#0f766e' }}>{month.bsMonthName} {toNepaliNumber(month.bsYear)}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {month.batchEventCount > 0 && <span style={{ fontSize: '7px', background: '#f3e8ff', padding: '1px 5px', borderRadius: '4px', color: '#6b21a5', fontWeight: 600 }}>{month.batchEventCount}</span>}
                              {month.globalEventCount > 0 && <span style={{ fontSize: '7px', background: '#dbeafe', padding: '1px 5px', borderRadius: '4px', color: '#1e40af', fontWeight: 600 }}>+{month.globalEventCount}</span>}
                            </div>
                          </div>
                          <div style={{ padding: `${Math.max(0, sizes.calendarCellPadding)}px` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: `${sizes.calendarColumnGap}px` }}>
                              {NEPALI_DAYS_SHORT.map((d, i) => (<div key={i} style={{ fontWeight: 700, textAlign: 'center', padding: `${Math.max(0, sizes.dayHeaderPadding)}px 0`, background: '#f8fafc', fontSize: `${Math.max(4, sizes.dayHeaderFontSize)}px`, color: '#0f766e', lineHeight: `${sizes.dayCellLineHeight}` }}>{d}</div>))}
                              {Array.from({ length: fdom }).map((_, i) => (<div key={`e-${i}`} style={{ padding: `${Math.max(0, sizes.calendarCellPadding)}px`, minHeight: '16px', background: '#fafafa' }} />))}
                              {month.days.map((day, di) => {
                                if (!includeWeekends && day.isWeekend) return <div key={di} style={{ padding: `${Math.max(0, sizes.calendarCellPadding)}px`, minHeight: '16px', background: '#fafafa' }} />;
                                let bg = '#fff';
                                if (day.isWeekend) bg = '#fef2f2'; else if (day.isToday) bg = '#fef9c3'; else if (day.hasGlobalEvent && day.hasBatchEvent) bg = '#e0f2fe'; else if (day.hasGlobalEvent) bg = '#eff6ff'; else if (day.hasBatchEvent) bg = '#f0fdf4';
                                return (<div key={di} style={{ padding: `${Math.max(0, sizes.calendarCellPadding)}px ${Math.max(0, sizes.calendarCellPadding) + 1}px`, minHeight: '16px', background: bg, fontSize: '6px', position: 'relative', border: day.hasGlobalEvent ? '1px solid #93c5fd' : '1px solid transparent', borderRadius: '2px' }}>
                                  <div style={{ fontWeight: 600, fontSize: `${Math.max(4, sizes.calendarCellFontSize)}px`, lineHeight: `${sizes.dayCellLineHeight}` }}>
                                    <span>{toNepaliNumber(day.bsDay)}</span>
                                    {includeEnglish && <span style={{ fontSize: `${Math.max(3, sizes.calendarCellFontSize - 2)}px`, color: '#94a3b8', marginLeft: '1px' }}>{day.adDate.getDate()}</span>}
                                  </div>
                                  {(day.hasBatchEvent || day.hasGlobalEvent) && <div style={{ display: 'flex', gap: '1px', marginTop: '1px', justifyContent: 'center' }}>
                                    {day.hasBatchEvent && <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />}
                                    {day.hasGlobalEvent && <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />}
                                  </div>}
                                </div>);
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Events Panel */}
                        <div style={{ flex: '0 0 50%', border: '1px solid #e2e8f0', borderRadius: '3px', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(135deg,#f0fdfa,#f1f5f9)', padding: `${Math.max(0, sizes.dayHeaderPadding)}px ${Math.max(0, sizes.eventsSectionPadding) + 2}px`, fontWeight: 700, fontSize: `${Math.max(6, sizes.reportTitleFontSize - 2)}px`, borderBottom: '1px solid #e2e8f0', lineHeight: `${sizes.monthHeaderLineHeight}`, color: '#334155' }}>Events</div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${Math.max(0, sizes.eventsSectionPadding)}px`, gap: `${sizes.eventsGap}px`, minHeight: 0 }}>
                            {groupedEvents.length > 0 ? groupedEvents.map((group, gIdx) => {
                              if (group.type === 'exam_group') {
                                const sBs = getBsForAd(new Date(group.startDate)), eBs = getBsForAd(new Date(group.endDate));
                                return (
                                  <div key={gIdx} style={{ display: 'flex', gap: `${sizes.eventGap}px`, fontSize: `${Math.max(4, sizes.eventFontSize)}px`, padding: `${Math.max(0, sizes.eventPadding)}px ${Math.max(0, sizes.eventDescPadding)}px`, borderRadius: '4px', borderLeft: '3px solid #8b5cf6', backgroundColor: '#f5f3ff', color: '#6b21a5', lineHeight: `${sizes.eventLineHeight}` }}>
                                    <span style={{ fontWeight: 800, fontSize: `${Math.max(4, sizes.eventFontSize)}px`, minWidth: '22px', textAlign: 'center', background: '#ddd6fe', padding: '2px 6px', borderRadius: '3px', flexShrink: 0, lineHeight: `${sizes.eventLineHeight}` }}>
                                      {sBs ? toNepaliNumber(sBs.date) : new Date(group.startDate).getDate()}{eBs && sBs?.date !== eBs?.date ? `-${toNepaliNumber(eBs.date)}` : ''}
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: `${Math.max(4, sizes.eventBadgeFontSize)}px`, textTransform: 'uppercase', flexShrink: 0, lineHeight: `${sizes.eventLineHeight}` }}>{group.label}</span>
                                    <span style={{ fontWeight: 500, fontSize: `${Math.max(4, sizes.eventDescriptionFontSize)}px`, flex: 1, lineHeight: `${sizes.eventLineHeight}`, paddingTop: '1px', paddingBottom: '1px' }}>
                                      {group.events.filter(e => e.eventType === 'exam_start').length} exam days
                                    </span>
                                  </div>
                                );
                              }
                              const ev = group.event, c = getEventColor(ev.eventType), isG = !ev.batchId;
                              const ed2 = new Date(ev.date), ebs = getBsForAd(ed2);
                              return (
                                <div key={gIdx} style={{ display: 'flex', gap: `${sizes.eventGap}px`, fontSize: `${Math.max(4, sizes.eventFontSize)}px`, padding: `${Math.max(0, sizes.eventPadding)}px ${Math.max(0, sizes.eventDescPadding)}px`, margin: `${sizes.eventMargin}px 0`, borderRadius: '4px', borderLeft: `3px solid ${isG ? '#3b82f6' : c.border}`, backgroundColor: isG ? '#eff6ff' : c.bg, color: isG ? '#1e40af' : c.color, lineHeight: `${sizes.eventLineHeight}` }}>
                                  <span style={{ fontWeight: 800, fontSize: `${Math.max(4, sizes.eventFontSize)}px`, minWidth: '22px', textAlign: 'center', background: isG ? '#bfdbfe' : c.border, padding: '2px 6px', borderRadius: '3px', flexShrink: 0, lineHeight: `${sizes.eventLineHeight}` }}>
                                    {ebs ? toNepaliNumber(ebs.date) : ed2.getDate()}
                                  </span>
                                  <span style={{ fontSize: `${Math.max(4, sizes.eventBadgeFontSize)}px`, fontWeight: 800, textTransform: 'uppercase', flexShrink: 0, lineHeight: `${sizes.eventLineHeight}` }}>
                                    {isG ? 'G' : (c.label || ev.eventType)}
                                  </span>
                                  <span style={{ fontWeight: 500, fontSize: `${Math.max(4, sizes.eventDescriptionFontSize)}px`, flex: 1, lineHeight: `${sizes.eventLineHeight}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {ev.description || ''}
                                  </span>
                                </div>
                              );
                            }) : <div style={{ textAlign: 'center', padding: '16px', color: '#cbd5e1', fontSize: '9px', fontStyle: 'italic' }}>No events</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div data-footer style={{ flexShrink: 0, marginTop: `${Math.max(0, sizes.footerPadding)}px`, paddingTop: `${Math.max(0, sizes.footerPadding)}px` }}>
                <ReportFooter institute={instituteInfo} note={<>{batchInfo?.name || 'Batch'} • Academic Calendar</>} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF PREVIEW */}
      {showPDFPreview && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText size={20} className="text-teal-600" />PDF Preview</h3>
              <div className="flex items-center gap-2">
                {pdfBlobUrl && <><button onClick={printPDF} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center gap-1.5"><Printer size={14} />Print</button><button onClick={downloadPDF} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1.5"><Download size={14} />Download</button></>}
                <button onClick={() => { setShowPDFPreview(false); setPdfBlobUrl(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} className="text-slate-500" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 rounded-b-2xl">
              {generatingPDF ? <div className="flex flex-col items-center justify-center h-full gap-3"><Loader2 size={48} className="animate-spin text-teal-600" /><p className="text-sm text-slate-500">Generating…</p></div> : pdfBlobUrl ? <iframe src={pdfBlobUrl} className="w-full h-full min-h-[600px] rounded-lg border-0" /> : <div className="flex items-center justify-center h-full text-slate-400">No PDF</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}