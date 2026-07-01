// components/classroom/CalendarModal.jsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalExamConfigModal from './ExaminationConfig';
import SemesterReport from './SemesterReport';
import DateConverter from '@remotemerge/nepali-date-converter';
import {
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Edit2,
  Trash2,
  FileText,
  Printer,
  Calendar,
  Play,
  StopCircle,
  Sun,
  BookOpen,
  FileCheck,
  Award,
  Users,
  Circle,
  AlertTriangle,
  Settings,
} from 'lucide-react';

// Nepali month names (index 0 = Baisakh)
const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];
const NEPALI_DAYS = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];
const NEPALI_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toNepaliNumber = (num) => String(num).replace(/\d/g, (d) => NEPALI_DIGITS[parseInt(d)]);

const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};
const formatDisplayDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
const formatShortAd = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Nepal weekend: Saturday only
const isWeekend = (date) => new Date(date).getDay() === 6;
const addDays = (date, days) => {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
};
const addWeeks = (date, weeks) => addDays(date, weeks * 7);
const getSunday = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

// AD -> BS
const getBsForAd = (adDate) => {
  try {
    return new DateConverter(formatDateKey(adDate)).toBs();
  } catch {
    return null;
  }
};

// BS -> AD
const getAdForBs = (bsYear, bsMonth, bsDay) => {
  try {
    const ad = new DateConverter(`${bsYear}-${bsMonth}-${bsDay}`).toAd();
    return new Date(ad.year, ad.month - 1, ad.date);
  } catch {
    return null;
  }
};

const EVENT_TYPES = [
  { value: 'semester_start', label: 'Semester Start', color: 'from-green-500 to-emerald-600', Icon: Play, bgColor: 'bg-green-100', textColor: 'text-green-800' },
  { value: 'semester_end', label: 'Semester End', color: 'from-red-500 to-rose-600', Icon: StopCircle, bgColor: 'bg-red-100', textColor: 'text-red-800' },
  { value: 'holiday', label: 'Holiday', color: 'from-orange-500 to-amber-600', Icon: Sun, bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  { value: 'first_term_start', label: 'First Term', color: 'from-blue-500 to-cyan-600', Icon: BookOpen, bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  { value: 'second_term_start', label: 'Second Term', color: 'from-indigo-500 to-blue-600', Icon: BookOpen, bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  { value: 'exam_start', label: 'Terminal Exam', color: 'from-purple-500 to-violet-600', Icon: FileText, bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  { value: 'exam_end', label: 'Exam End', color: 'from-violet-500 to-purple-600', Icon: FileCheck, bgColor: 'bg-violet-100', textColor: 'text-violet-800' },
  { value: 'result_publication', label: 'Results', color: 'from-pink-500 to-rose-600', Icon: Award, bgColor: 'bg-pink-100', textColor: 'text-pink-800' },
  { value: 'meeting', label: 'Meeting', color: 'from-gray-500 to-slate-600', Icon: Users, bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  { value: 'other', label: 'Other', color: 'from-teal-500 to-cyan-600', Icon: Circle, bgColor: 'bg-teal-100', textColor: 'text-teal-800' },
];

const FALLBACK_BS = { year: 2082, month: 1 };

export default function CalendarModal({ 
  classroomId, 
  batchId, 
  isOpen, 
  onClose,
  semesterStartDate: propSemesterStartDate,
  semesterEndDate: propSemesterEndDate,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayBs = getBsForAd(today) || FALLBACK_BS;

  const [bsYear, setBsYear] = useState(todayBs.year);
  const [bsMonth, setBsMonth] = useState(todayBs.month);

  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [viewMode, setViewMode] = useState('calendar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [showTerminalConfig, setShowTerminalConfig] = useState(false);
  const [showSemesterReport, setShowSemesterReport] = useState(false);
  const [terminalConfig, setTerminalConfig] = useState({
    termCount: 2,
    termWeeks: [7, 12],
    examDays: 5,
    semesterDuration: 16,
  });
  const [eventForm, setEventForm] = useState({
    id: null,
    date: '',
    eventType: 'other',
    description: '',
    batchId: batchId || '',
  });
  const [semesterStartDate, setSemesterStartDate] = useState(propSemesterStartDate || null);
  const [semesterEndDate, setSemesterEndDate] = useState(propSemesterEndDate || null);

  const isGlobalCalendar = !batchId;
  const isBatchCalendar = !!batchId;

  // ==================== BS MONTH GEOMETRY ====================
  const monthInfo = useMemo(() => {
    let daysInMonth = 28;
    for (let d = 28; d <= 32; d++) {
      try {
        new DateConverter(`${bsYear}-${bsMonth}-${d}`).toAd();
        daysInMonth = d;
      } catch {
        break;
      }
    }
    const firstAd = getAdForBs(bsYear, bsMonth, 1) || today;
    const lastAd = getAdForBs(bsYear, bsMonth, daysInMonth) || today;
    return { daysInMonth, startDayOfWeek: firstAd.getDay(), firstAd, lastAd };
  }, [bsYear, bsMonth]);

  // ==================== FETCH BATCH INFO ====================
  const fetchBatchInfo = useCallback(async () => {
    if (!batchId) {
      setBatchInfo({ id: null, name: 'Global Calendar' });
      return;
    }
    try {
      const r = await fetch(`/api/batches/${batchId}`);
      if (r.ok) {
        const d = await r.json();
        setBatchInfo(d.batch || d);
      } else {
        setBatchInfo({ id: parseInt(batchId), name: 'Batch #' + batchId });
      }
    } catch {
      setBatchInfo({ id: parseInt(batchId), name: 'Batch #' + batchId });
    }
  }, [batchId]);

  // ==================== FETCH TERMINAL CONFIG ====================
  const fetchTerminalConfig = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await fetch(`/api/terminal-config?batchId=${batchId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.config;
        if (c) {
          setTerminalConfig({
            termCount: c.termCount || 2,
            termWeeks: Array.isArray(c.termWeeks)
              ? c.termWeeks
              : typeof c.termWeeks === 'string'
              ? JSON.parse(c.termWeeks)
              : [7, 12],
            examDays: c.examDays || 5,
            semesterDuration: c.semesterDuration || 16,
          });
        }
      }
    } catch (e) {
      console.error('Error fetching terminal config:', e);
    }
  }, [batchId]);

  // ==================== FETCH EVENTS ====================
  const fetchEvents = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const monthStart = monthInfo.firstAd;
      const monthEnd = monthInfo.lastAd;
      const startStr = formatDateKey(monthStart);
      const endStr = formatDateKey(monthEnd);
      
      let allFetchedEvents = [];
      
      if (isBatchCalendar) {
        const [batchResponse, globalResponse] = await Promise.all([
          fetch(`/api/academic-calendar?startDate=${startStr}&endDate=${endStr}&batchId=${batchId}`),
          fetch(`/api/academic-calendar?startDate=${startStr}&endDate=${endStr}`),
        ]);
        
        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          allFetchedEvents = [...(batchData.events || [])];
        }
        
        if (globalResponse.ok) {
          const globalData = await globalResponse.json();
          const globalEvents = (globalData.events || []).filter(e => !e.batchId);
          allFetchedEvents = [...allFetchedEvents, ...globalEvents];
        }
      } else {
        const response = await fetch(`/api/academic-calendar?startDate=${startStr}&endDate=${endStr}`);
        if (response.ok) {
          const data = await response.json();
          allFetchedEvents = (data.events || []).filter(e => !e.batchId);
        }
      }
      
      const em = {};
      allFetchedEvents.forEach((e) => {
        const dk = formatDateKey(new Date(e.date));
        if (!em[dk]) em[dk] = [];
        em[dk].push(e);
      });
      setEvents(em);
      setAllEvents(allFetchedEvents);
      
      // Find semester start and end from events
      const semStart = allFetchedEvents.find(e => e.eventType === 'semester_start');
      const semEnd = allFetchedEvents.find(e => e.eventType === 'semester_end');
      if (semStart) setSemesterStartDate(new Date(semStart.date));
      if (semEnd) setSemesterEndDate(new Date(semEnd.date));
      
    } catch (e) {
      console.error('fetchEvents error:', e);
      setErrorMessage('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [monthInfo, batchId, isOpen, isBatchCalendar]);

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        await Promise.all([
          fetchBatchInfo(),
          fetchTerminalConfig(),
        ]);
        await fetchEvents();
      };
      loadData();
    }
  }, [isOpen, fetchBatchInfo, fetchTerminalConfig, fetchEvents]);

  // ==================== HOLIDAY HELPER ====================
  const isHolidayDate = useCallback(
    (date) => {
      const dk = formatDateKey(date);
      return allEvents.some((e) => formatDateKey(new Date(e.date)) === dk && e.eventType === 'holiday');
    },
    [allEvents]
  );

  // ==================== AUTO-GENERATE ====================
  const autoGenerateSemesterDates = useCallback(
    async (semesterStartEvent) => {
      if (!batchId || !semesterStartEvent) return false;
      setAutoGenerating(true);
      try {
        const startDate = new Date(semesterStartEvent.date);
        startDate.setHours(0, 0, 0, 0);
        const semesterEndDate = addWeeks(startDate, terminalConfig.semesterDuration);
        const eventsToCreate = [];

        eventsToCreate.push({
          date: formatDateKey(semesterEndDate),
          eventType: 'semester_end',
          description: `Semester End (${terminalConfig.semesterDuration} weeks)`,
          batchId: parseInt(batchId),
          isAutoGenerated: true,
        });

        for (let t = 0; t < terminalConfig.termCount; t++) {
          const weekNum = terminalConfig.termWeeks[t] || 7 + t * 5;
          const termWeekStart = addWeeks(startDate, weekNum);
          const termSunday = getSunday(termWeekStart);
          const termEventType = t === 0 ? 'first_term_start' : t === 1 ? 'second_term_start' : 'exam_start';

          eventsToCreate.push({
            date: formatDateKey(termSunday),
            eventType: termEventType,
            description: `Terminal ${t + 1} Exam (Week ${weekNum})`,
            batchId: parseInt(batchId),
            isAutoGenerated: true,
          });

          let examDayCount = 0;
          let dayOffset = 0;
          const maxDaysToCheck = 30;
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          while (examDayCount < terminalConfig.examDays && dayOffset < maxDaysToCheck) {
            const examDate = addDays(termSunday, dayOffset);
            const dayOfWeek = examDate.getDay();
            const isWorkingDay = dayOfWeek >= 0 && dayOfWeek <= 5;
            const isHoliday = isHolidayDate(examDate);

            if (isWorkingDay && !isHoliday) {
              eventsToCreate.push({
                date: formatDateKey(examDate),
                eventType: 'exam_start',
                description: `Terminal ${t + 1} - ${dayNames[dayOfWeek]} (Day ${examDayCount + 1})`,
                batchId: parseInt(batchId),
                isAutoGenerated: true,
                isTermExam: true,
              });
              examDayCount++;
            }
            dayOffset++;
          }

          const lastExam = [...eventsToCreate].reverse().find(
            (e) => e.isTermExam && e.description.includes(`Terminal ${t + 1}`)
          );
          if (lastExam) {
            eventsToCreate.push({
              date: lastExam.date,
              eventType: 'exam_end',
              description: `Terminal ${t + 1} Exam End`,
              batchId: parseInt(batchId),
              isAutoGenerated: true,
            });
          }
        }

        let successCount = 0;
        for (const event of eventsToCreate) {
          try {
            const response = await fetch('/api/academic-calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event),
            });
            if (response.ok) successCount++;
          } catch (e) {
            console.error('Error creating event:', e);
          }
          await new Promise((r) => setTimeout(r, 50));
        }
        return successCount > 0;
      } catch (e) {
        console.error('Auto-gen error:', e);
        setErrorMessage('Generation failed: ' + e.message);
        return false;
      } finally {
        setAutoGenerating(false);
      }
    },
    [batchId, terminalConfig, isHolidayDate]
  );

  // ==================== DELETE & REGENERATE ====================
  const deleteAllEventsForBatch = async () => {
    if (!batchId) return false;
    try {
      const res = await fetch(`/api/academic-calendar?batchId=${batchId}&limit=500`);
      if (!res.ok) return false;
      const data = await res.json();
      const allBatchEvents = (data.events || []).filter((e) => e.batchId === parseInt(batchId));
      const semStart = allBatchEvents.find((e) => e.eventType === 'semester_start');
      if (!semStart) return false;

      const startDt = new Date(semStart.date);
      startDt.setHours(0, 0, 0, 0);
      const endDt = addWeeks(startDt, terminalConfig.semesterDuration);

      const toDelete = allBatchEvents.filter((e) => {
        if (e.eventType === 'semester_start') return false;
        if (!e.isAutoGenerated) return false;
        const ed = new Date(e.date);
        return ed >= startDt && ed <= endDt;
      });

      for (const e of toDelete) {
        await fetch(`/api/academic-calendar?id=${e.id}`, { method: 'DELETE' });
      }
      return true;
    } catch (e) {
      console.error('Delete error:', e);
      return false;
    }
  };

  const regenerateAllEvents = useCallback(async () => {
    if (!batchId) return;
    const semStart = allEvents.find(
      (e) => e.eventType === 'semester_start' && e.batchId === parseInt(batchId)
    );
    if (!semStart) {
      setErrorMessage('Add Semester Start first.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setAutoGenerating(true);
    try {
      await deleteAllEventsForBatch();
      await new Promise((r) => setTimeout(r, 500));
      await autoGenerateSemesterDates(semStart);
      await new Promise((r) => setTimeout(r, 500));
      await fetchEvents();
      setSuccessMessage('Events regenerated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setErrorMessage('Failed: ' + e.message);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setAutoGenerating(false);
    }
  }, [batchId, allEvents, terminalConfig, autoGenerateSemesterDates, fetchEvents]);

  // ==================== NAVIGATION ====================
  const prevMonth = () => {
    let m = bsMonth - 1, y = bsYear;
    if (m < 1) { m = 12; y -= 1; }
    setBsYear(y);
    setBsMonth(m);
  };
  const nextMonth = () => {
    let m = bsMonth + 1, y = bsYear;
    if (m > 12) { m = 1; y += 1; }
    setBsYear(y);
    setBsMonth(m);
  };
  const goToToday = () => {
    const bs = getBsForAd(today) || FALLBACK_BS;
    setBsYear(bs.year);
    setBsMonth(bs.month);
  };

  const handleDateClick = (day) => {
    const adDate = getAdForBs(bsYear, bsMonth, day);
    if (adDate) setSelectedDate(formatDateKey(adDate));
  };
  const handleDateDoubleClick = (day) => {
    const adDate = getAdForBs(bsYear, bsMonth, day);
    if (!adDate) return;
    const dk = formatDateKey(adDate);
    setSelectedDate(dk);
    setEventForm({ id: null, date: dk, eventType: 'other', description: '', batchId: batchId || '' });
    setShowEventModal(true);
  };

  const getEventsForDate = (day) => {
    const adDate = getAdForBs(bsYear, bsMonth, day);
    if (!adDate) return [];
    return events[formatDateKey(adDate)] || [];
  };
  const getEventTypeDetails = (et) => EVENT_TYPES.find((e) => e.value === et) || EVENT_TYPES[9];
  const selectedDateEvents = selectedDate ? events[selectedDate] || [] : [];

  const bsHeaderLabel = `${NEPALI_MONTHS[bsMonth - 1]} ${toNepaliNumber(bsYear)}`;
  const adRangeLabel = `${formatShortAd(monthInfo.firstAd)} – ${formatShortAd(monthInfo.lastAd)}`;

  // ==================== EVENT HANDLERS ====================
  const handleSaveEvent = async () => {
    if (!eventForm.description.trim()) {
      setErrorMessage('Enter description');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...eventForm,
        date: eventForm.date,
        batchId: isGlobalCalendar ? null : batchId ? parseInt(batchId) : null,
      };
      const res = await fetch('/api/academic-calendar', {
        method: eventForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm.id ? { ...body, id: eventForm.id } : body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed');
      }
      setShowEventModal(false);
      const saved = await res.json();
      const savedData = saved.event || saved;

      if (!eventForm.id && eventForm.eventType === 'semester_start' && isBatchCalendar && savedData) {
        setSuccessMessage('Generating schedule...');
        setTimeout(() => setSuccessMessage(null), 2000);
        await autoGenerateSemesterDates(savedData);
        await fetchEvents();
        setSuccessMessage('Semester & exams generated!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSuccessMessage(eventForm.id ? 'Updated!' : 'Created!');
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchEvents();
      }
    } catch (e) {
      setErrorMessage(e.message);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEditEvent = (event) => {
    setEventForm({
      id: event.id,
      date: formatDateKey(new Date(event.date)),
      eventType: event.eventType,
      description: event.description,
      batchId: event.batchId || batchId || '',
    });
    setShowEventModal(true);
  };

  // ==================== DELETE FUNCTIONS ====================
  const handleDeleteEvent = (id) => {
    const event = allEvents.find((e) => e.id === id);
    if (event?.eventType === 'semester_start' && isBatchCalendar) {
      setDeleteTargetType('semester_start');
    } else {
      setDeleteTargetType('single');
    }
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!deleteTargetId) return;
    
    try {
      if (deleteTargetType === 'semester_start') {
        const semStart = allEvents.find(e => e.id === deleteTargetId);
        if (!semStart) {
          setErrorMessage('Semester start event not found');
          setTimeout(() => setErrorMessage(null), 3000);
          setDeleteTargetId(null);
          setDeleteTargetType(null);
          return;
        }

        const response = await fetch(`/api/academic-calendar?batchId=${batchId}&limit=500`);
        if (!response.ok) {
          throw new Error('Failed to fetch all batch events');
        }
        const data = await response.json();
        const allBatchEvents = data.events || [];

        const semesterStartDate = new Date(semStart.date);
        const semesterEndDate = addWeeks(semesterStartDate, terminalConfig.semesterDuration);
        
        const eventsToDeleteSet = new Set();
        
        allBatchEvents.forEach((e) => {
          if (e.id === deleteTargetId) return;
          const eventDate = new Date(e.date);
          if (eventDate >= semesterStartDate && eventDate <= semesterEndDate) {
            eventsToDeleteSet.add(e.id);
          }
        });

        allBatchEvents.forEach((e) => {
          if (e.id === deleteTargetId) return;
          if (e.isAutoGenerated === true) {
            eventsToDeleteSet.add(e.id);
          }
        });

        allBatchEvents.forEach((e) => {
          if (e.id === deleteTargetId) return;
          const description = e.description || '';
          const eventType = e.eventType || '';
          if (description.includes('Terminal') || 
              description.includes('Exam') ||
              description.includes('Day') ||
              eventType === 'exam_start' ||
              eventType === 'exam_end' ||
              eventType === 'first_term_start' ||
              eventType === 'second_term_start' ||
              eventType === 'semester_end') {
            eventsToDeleteSet.add(e.id);
          }
        });

        const uniqueEventsToDelete = Array.from(eventsToDeleteSet).map(id => 
          allBatchEvents.find(e => e.id === id)
        ).filter(Boolean);

        if (uniqueEventsToDelete.length === 0) {
          await fetch(`/api/academic-calendar?id=${deleteTargetId}`, { method: 'DELETE' });
          setSuccessMessage('Semester start deleted (no associated events found)');
        } else {
          let deletedCount = 0;
          let failedCount = 0;
          
          for (const event of uniqueEventsToDelete) {
            try {
              const deleteResponse = await fetch(`/api/academic-calendar?id=${event.id}`, { 
                method: 'DELETE' 
              });
              if (deleteResponse.ok) {
                deletedCount++;
              } else {
                failedCount++;
              }
            } catch (err) {
              failedCount++;
              console.error('Error deleting event:', err);
            }
            await new Promise(r => setTimeout(r, 100));
          }
          
          await fetch(`/api/academic-calendar?id=${deleteTargetId}`, { method: 'DELETE' });
          setSuccessMessage(`Deleted ${deletedCount + 1} events${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
        }
      } else {
        await fetch(`/api/academic-calendar?id=${deleteTargetId}`, { method: 'DELETE' });
        setSuccessMessage('Event deleted!');
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchEvents();
    } catch (e) {
      console.error('Delete error:', e);
      setErrorMessage('Delete failed: ' + e.message);
      setTimeout(() => setErrorMessage(null), 3000);
    }
    
    setDeleteTargetId(null);
    setDeleteTargetType(null);
  };

  const handlePrint = () => window.print();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-4 md:inset-8 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between flex-shrink-0 print:hidden ${
            isGlobalCalendar
              ? 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
          }`}
        >
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-white/80 hover:text-white p-2 cursor-pointer">
              <X size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">
                <CalendarDays size={24} className="inline mr-2" />
                {isGlobalCalendar ? 'Global Calendar' : `Batch Calendar`}
              </h2>
              <p className="text-white/70 text-sm">
                {batchInfo ? `Batch: ${batchInfo.name}` : isGlobalCalendar ? 'All Batches' : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
                  viewMode === 'calendar' ? 'bg-white text-indigo-600' : 'text-white/70'
                }`}
              >
                Month
              </button>
              {isBatchCalendar && (
                <button
                  onClick={() => setViewMode('report')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
                    viewMode === 'report' ? 'bg-white text-indigo-600' : 'text-white/70'
                  }`}
                >
                  Semester View
                </button>
              )}
            </div>
            {isBatchCalendar && (
              <>
                <button
                  onClick={() => setShowTerminalConfig(true)}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm flex items-center gap-1 cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <Settings size={14} /> Terminals
                </button>
                <button
                  onClick={() => setShowSemesterReport(true)}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm flex items-center gap-1 cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <FileText size={14} /> Report
                </button>
              </>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm flex items-center gap-1 cursor-pointer"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 right-6 z-50 bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-lg shadow-lg print:hidden"
            >
              <CheckCircle size={18} className="inline mr-2" />
              {successMessage}
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 right-6 z-50 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg shadow-lg print:hidden"
            >
              <AlertCircle size={18} className="inline mr-2" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {autoGenerating && (
          <div className="absolute inset-0 bg-white/80 z-40 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Regenerating schedule...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{bsHeaderLabel}</h3>
                    <p className="text-xs text-gray-400 leading-tight">{adRangeLabel}</p>
                  </div>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar size={14} /> Today
                  </button>
                  <button
                    onClick={() => {
                      const dk = formatDateKey(today);
                      setSelectedDate(dk);
                      setEventForm({ id: null, date: dk, eventType: 'other', description: '', batchId: batchId || '' });
                      setShowEventModal(true);
                    }}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {NEPALI_DAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`px-1 py-2 text-center border-y ${
                      i === 6 ? 'bg-red-100 text-red-500' : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <div className="text-xs font-semibold">{d}</div>
                    <div className="text-[9px] uppercase opacity-70">{NEPALI_DAYS_EN[i]}</div>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthInfo.startDayOfWeek }).map((_, i) => (
                  <div key={`e-${i}`} className="min-h-[100px] bg-gray-50/30 rounded-lg" />
                ))}
                {Array.from({ length: monthInfo.daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const adDate = getAdForBs(bsYear, bsMonth, day);
                  const dayEvents = getEventsForDate(day);
                  const isSelected = adDate && selectedDate === formatDateKey(adDate);
                  const isToday = adDate && formatDateKey(adDate) === formatDateKey(today);
                  const isWknd = adDate ? isWeekend(adDate) : false;
                  const hasHoliday = dayEvents.some((e) => e.eventType === 'holiday');
                  const hasExam = dayEvents.some((e) => e.eventType === 'exam_start');
                  const isAdMonthStart = adDate && adDate.getDate() === 1;
                  const hasBatchEvent = dayEvents.some((e) => e.batchId);
                  const hasGlobalEvent = dayEvents.some((e) => !e.batchId);

                  return (
                    <motion.div
                      key={day}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleDateClick(day)}
                      onDoubleClick={() => handleDateDoubleClick(day)}
                      className={`min-h-[100px] p-2 rounded-lg cursor-pointer relative ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 shadow-lg bg-indigo-50'
                          : hasHoliday
                          ? 'bg-orange-100 border-2 border-orange-400'
                          : isToday
                          ? 'bg-yellow-50 border-2 border-yellow-400'
                          : hasExam
                          ? 'bg-purple-50 border-2 border-purple-400'
                          : isWknd
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-white border border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span
                          className={`text-sm font-bold ${
                            isToday
                              ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                              : isWknd
                              ? 'text-red-500'
                              : 'text-gray-700'
                          }`}
                        >
                          {toNepaliNumber(day)}
                        </span>
                        <div className="flex items-center gap-1">
                          {adDate && (
                            <span
                              className={`text-[10px] leading-none ${
                                isAdMonthStart ? 'font-semibold text-indigo-500' : 'text-gray-400'
                              }`}
                              title={formatShortAd(adDate)}
                            >
                              {isAdMonthStart
                                ? adDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : adDate.getDate()}
                            </span>
                          )}
                          {hasGlobalEvent && isBatchCalendar && (
                            <span className="text-[8px] text-blue-500" title="Global event">🌐</span>
                          )}
                          {hasBatchEvent && isBatchCalendar && (
                            <span className="text-[8px] text-purple-500" title="Batch event">📋</span>
                          )}
                        </div>
                      </div>
                      {hasHoliday && <span className="text-[8px] ml-0.5">🏖</span>}
                      {hasExam && <span className="text-[8px] ml-0.5">📝</span>}
                      {dayEvents.slice(0, 3).map((event, idx) => {
                        const et = getEventTypeDetails(event.eventType);
                        return (
                          <div
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md truncate bg-gradient-to-r ${et.color} text-white mt-0.5 ${
                              !event.batchId && isBatchCalendar ? 'opacity-75 border border-white/30' : ''
                            }`}
                          >
                            {event.description.substring(0, 14)}
                            {!event.batchId && isBatchCalendar && (
                              <span className="ml-1 text-[8px]">🌐</span>
                            )}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-gray-500 mt-1">+{dayEvents.length - 3} more</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto p-4 print:hidden">
              <h3 className="text-sm font-semibold mb-0.5">
                <Info size={14} className="inline mr-1" />
                {selectedDate
                  ? (() => {
                      const bs = getBsForAd(new Date(selectedDate + 'T00:00:00'));
                      return bs
                        ? `${NEPALI_MONTHS[bs.month - 1]} ${toNepaliNumber(bs.date)}, ${toNepaliNumber(bs.year)} BS`
                        : formatDisplayDate(new Date(selectedDate + 'T00:00:00'));
                    })()
                  : 'Select a date'}
              </h3>
              {selectedDate && (
                <p className="text-xs text-gray-400 mb-3 ml-5">
                  {formatDisplayDate(new Date(selectedDate + 'T00:00:00'))}
                </p>
              )}
              {selectedDate &&
                selectedDateEvents.map((event, i) => {
                  const et = getEventTypeDetails(event.eventType);
                  const isGlobal = !event.batchId;
                  return (
                    <div key={i} className={`${et.bgColor} rounded-lg p-3 border mb-2 ${isGlobal && isBatchCalendar ? 'border-blue-300' : ''}`}>
                      <div className="flex items-center gap-2">
                        <et.Icon size={14} className={et.textColor} />
                        <span className={`text-xs font-medium ${et.textColor}`}>{et.label}</span>
                        {isGlobal && isBatchCalendar && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">Global</span>
                        )}
                        {event.batchId && isBatchCalendar && (
                          <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded">Batch</span>
                        )}
                        {event.isAutoGenerated && (
                          <span className="text-[10px] bg-amber-100 text-amber-600 px-1 rounded">Auto</span>
                        )}
                        {event.isTermExam && (
                          <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded">Exam</span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{event.description}</p>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-xs text-gray-500 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center print:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowEventModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 mx-4"
            >
              <h3 className="text-lg font-bold mb-4">{eventForm.id ? 'Edit' : 'Add'} Event</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Type</label>
                  <select
                    value={eventForm.eventType}
                    onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et.value} value={et.value}>
                        {et.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  {eventForm.date &&
                    (() => {
                      const bs = getBsForAd(new Date(eventForm.date + 'T00:00:00'));
                      return bs ? (
                        <p className="text-sm text-indigo-600 font-medium mb-1">
                          {NEPALI_MONTHS[bs.month - 1]} {toNepaliNumber(bs.date)}, {toNepaliNumber(bs.year)} BS
                        </p>
                      ) : null;
                    })()}
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Gregorian (AD) — used for storage</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                {eventForm.eventType === 'semester_start' && isBatchCalendar && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <Info size={12} className="inline mr-1" />
                      Auto-generates terminal exams and semester end based on config.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTargetId(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 mx-4"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                {deleteTargetType === 'semester_start' ? 'Delete All Events?' : 'Delete Event?'}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {deleteTargetType === 'semester_start'
                  ? `This will delete the semester start and ALL associated events for this semester.`
                  : 'This cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Terminal Config Modal */}
        <TerminalExamConfigModal
          isOpen={showTerminalConfig}
          onClose={() => {
            setShowTerminalConfig(false);
            fetchEvents();
          }}
          onSave={async (config) => {
            setTerminalConfig(config);
            await fetchEvents();
          }}
          batchId={batchId}
          batch={batchInfo}
        />

        {/* Semester Report Modal */}
        <SemesterReport
          isOpen={showSemesterReport}
          onClose={() => setShowSemesterReport(false)}
          batchId={batchId}
          batchInfo={batchInfo}
          semesterStart={semesterStartDate}
          semesterEnd={semesterEndDate}
          events={events}
          allEvents={allEvents}
          terminalConfig={terminalConfig}
        />

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .fixed.inset-0.z-50 {
              visibility: visible;
              position: absolute;
              inset: 0 !important;
            }
            .fixed.inset-0.z-50 * {
              visibility: visible;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
}