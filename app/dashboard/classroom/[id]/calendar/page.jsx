// app/dashboard/classroom/[id]/calendar/page.jsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

const API_URL = '/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EVENT_COLORS = {
  academic: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  exam: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' },
  holiday: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  event: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  meeting: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  assignment: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
};

const EVENT_TYPES = [
  { value: 'academic', label: 'Academic' },
  { value: 'exam', label: 'Exam' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'event', label: 'Event' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'assignment', label: 'Assignment' },
];

const SEMESTERS = [
  { key: 'semester1', label: 'Semester 1' },
  { key: 'semester2', label: 'Semester 2' },
  { key: 'semester3', label: 'Semester 3' },
  { key: 'semester4', label: 'Semester 4' },
  { key: 'semester5', label: 'Semester 5' },
  { key: 'semester6', label: 'Semester 6' },
  { key: 'semester7', label: 'Semester 7' },
  { key: 'semester8', label: 'Semester 8' },
];

function EventFormModal({ isOpen, onClose, onSave, event, semester }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'academic', date: '', startTime: '', endTime: '',
    isRecurring: false, recurringDays: [], semester: 'all',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '', description: event.description || '', type: event.type || 'academic',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        startTime: event.startTime || '', endTime: event.endTime || '',
        isRecurring: event.isRecurring || false, recurringDays: event.recurringDays || [],
        semester: event.semester || semester || 'all',
      });
    } else {
      setForm({
        title: '', description: '', type: 'academic', date: new Date().toISOString().split('T')[0],
        startTime: '', endTime: '', isRecurring: false, recurringDays: [],
        semester: semester || 'all',
      });
    }
  }, [event, semester, isOpen]);

  if (!isOpen) return null;

  const toggleRecurringDay = (day) => {
    setForm((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day) ? prev.recurringDays.filter((d) => d !== day) : [...prev.recurringDays, day],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{event ? 'Edit Event' : 'Add Event'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><Icons.X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Event title" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Event description..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300">{EVENT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Semester</label><select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300"><option value="all">All Semesters (Global)</option>{SEMESTERS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Date *</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Start</label><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">End</label><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300" /></div>
          </div>
          <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500" /><span className="text-xs font-medium text-slate-600">Recurring Weekly</span></label></div>
          {form.isRecurring && (<div><label className="block text-xs font-medium text-slate-600 mb-2">Repeat on</label><div className="flex flex-wrap gap-1">{WEEKDAYS.map((day) => (<button key={day} onClick={() => toggleRecurringDay(day)} className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${form.recurringDays.includes(day) ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{day.slice(0, 3)}</button>))}</div></div>)}
        </div>
        <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.title || !form.date} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <><Icons.Loader2 size={14} className="animate-spin" />Saving...</> : (event ? 'Update' : 'Add Event')}</button>
        </div>
      </div>
    </div>
  );
}

export default function ClassroomCalendarPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const classroomId = params?.id;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [viewMode, setViewMode] = useState('month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [message, setMessage] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState(null);

  const showToast = useCallback((type, title, text) => {
    setMessage({ type, title, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const api = useCallback(async (endpoint, options = {}) => {
    try {
      const fetchOptions = {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      };
      
      if (options.method && options.method !== 'GET') {
        fetchOptions.method = options.method;
      }
      
      if (options.body) {
        fetchOptions.method = fetchOptions.method || 'POST';
        fetchOptions.body = options.body;
      }

      const res = await fetch(API_URL + endpoint, fetchOptions);
      const text = await res.text();
      let data = {};
      
      if (text) {
        try { data = JSON.parse(text); } catch { data = { message: text }; }
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error('API Error:', endpoint, err);
      throw err;
    }
  }, []);

  // Fetch classroom
  useEffect(() => {
    if (!classroomId) return;
    api('/classrooms/' + classroomId)
      .then((data) => setClassroom(data.classroom))
      .catch((e) => console.error('Failed to fetch classroom:', e));
  }, [classroomId, api]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api('/calendar-events?classroomId=' + classroomId);
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
      setError(e.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [api, classroomId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const saveEvent = async (formData) => {
    try {
      const body = JSON.stringify({
        ...formData,
        classroomId: classroomId ? parseInt(classroomId) : null,
      });
      
      if (editingEvent) {
        await api('/calendar-events/' + editingEvent.id, { method: 'PUT', body });
        showToast('success', 'Updated', 'Event updated');
      } else {
        await api('/calendar-events', { method: 'POST', body });
        showToast('success', 'Created', 'Event added');
      }
      setEditingEvent(null);
      fetchEvents();
    } catch (e) { showToast('error', 'Error', e.message); }
  };

  const deleteEvent = async (event) => {
    if (!confirm('Delete "' + event.title + '"?')) return;
    try {
      await api('/calendar-events/' + event.id, { method: 'DELETE' });
      showToast('success', 'Deleted', 'Event deleted');
      fetchEvents();
    } catch (e) { showToast('error', 'Error', e.message); }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const filteredEvents = useMemo(() => {
    if (selectedSemester === 'all') return events;
    return events.filter((event) => event.semester === 'all' || event.semester === selectedSemester);
  }, [events, selectedSemester]);

  const getEventsForDate = useCallback((dateStr) => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [filteredEvents]);

  const navigateMonth = (dir) => setCurrentDate(new Date(year, month + dir, 1));

  const openAddEvent = () => { setEditingEvent(null); setShowEventForm(true); };
  const openEditEvent = (event) => { setEditingEvent(event); setShowEventForm(true); };

  const upcomingEvents = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.date); eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEvents]);

  const todayEvents = useMemo(() => {
    return filteredEvents.filter((event) => new Date(event.date).toISOString().split('T')[0] === today);
  }, [filteredEvents, today]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Toast */}
        {message && (
          <div className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl shadow-lg border-l-4 animate-slide-in-left ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-500' : message.type === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <Icons.CheckCircle size={18} className="text-emerald-500" /> : message.type === 'warning' ? <Icons.AlertTriangle size={18} className="text-amber-500" /> : <Icons.AlertCircle size={18} className="text-red-500" />}
              <div><span className="font-semibold text-sm block text-slate-800">{message.title}</span><p className="text-xs text-slate-600">{message.text}</p></div>
              <button onClick={() => setMessage(null)}><Icons.X size={16} className="text-slate-400" /></button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="sticky top-0 z-30 -mx-4 -mt-6 px-4 pt-6 pb-4 bg-slate-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Gradient bar */}
            <div className="h-1 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 bg-[length:200%_100%] animate-gradient-shift" />
            
            <div className="px-4 lg:px-6 py-4">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 mb-2">
                <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                  <Icons.Home className="w-3.5 h-3.5" />Dashboard
                </button>
                <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button onClick={() => router.push('/dashboard/classroom')} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                  <Icons.BookOpen className="w-3.5 h-3.5" />Classrooms
                </button>
                <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                {classroom && (
                  <>
                    <button onClick={() => router.push('/dashboard/classroom/' + classroomId)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                      {classroom.name}
                    </button>
                    <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </>
                )}
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Icons.CalendarDays className="w-3.5 h-3.5" />Academic Calendar
                </span>
              </nav>

              {/* Title Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    {classroom ? `${classroom.name} - Academic Calendar` : 'Academic Calendar'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {classroom?.course && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
                        <Icons.BookOpen className="w-3 h-3" />{classroom.course.name}
                      </span>
                    )}
                    {classroom?.semester && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                        <Icons.Layers className="w-3 h-3" />{SEMESTERS.find(s => s.key === classroom.semester)?.label || classroom.semester}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">
                      <Icons.Calendar className="w-3 h-3" />{filteredEvents.length} Events
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/dashboard/classroom/' + classroomId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Icons.ArrowLeft size={14} /> Back to Classroom
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/classroom')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Icons.BookOpen size={14} /> All Classrooms
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {[{ key: 'month', icon: Icons.Calendar, label: 'Month' },{ key: 'week', icon: Icons.LayoutGrid, label: 'Week' },{ key: 'list', icon: Icons.List, label: 'List' }].map((v) => (
              <button key={v.key} onClick={() => setViewMode(v.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === v.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}><v.icon size={14} className="inline mr-1" />{v.label}</button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 flex-wrap">
            {EVENT_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600">
                <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[t.value].dot}`} />{t.label}
              </div>
            ))}
          </div>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
            <option value="all">All Semesters</option>
            {SEMESTERS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
          </select>
          <button onClick={openAddEvent} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 flex items-center gap-1.5"><Icons.Plus size={14} />Add Event</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Icons.CalendarDays, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Total Events', value: filteredEvents.length },
            { icon: Icons.CalendarCheck, bg: 'bg-emerald-50', color: 'text-emerald-600', label: "Today's Events", value: todayEvents.length },
            { icon: Icons.Clock, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Upcoming (7 days)', value: upcomingEvents.length },
            { icon: Icons.Layers, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Viewing', value: selectedSemester === 'all' ? 'All Semesters' : SEMESTERS.find(s => s.key === selectedSemester)?.label || 'All' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}><s.icon size={20} className={s.color} /></div><div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-800">{s.value}</p></div></div>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={fetchEvents} className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="flex justify-center py-12"><Icons.Loader2 size={32} className="animate-spin text-slate-400" /></div>
        )}

        {/* Calendar Views */}
        {!loading && !error && (
          <>
            {viewMode === 'month' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-slate-200"><Icons.ChevronLeft size={18} /></button>
                  <h2 className="text-lg font-bold text-slate-800">{MONTHS[month]} {year}</h2>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Today</button>
                    <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-slate-200"><Icons.ChevronRight size={18} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-200">{DAYS.map((day) => (<div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-r border-slate-200 last:border-r-0">{day}</div>))}</div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDay }).map((_, i) => (<div key={'e-' + i} className="min-h-[100px] border-r border-b border-slate-100 bg-slate-50/30 p-2" />))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = getEventsForDate(dateStr);
                    const isToday = dateStr === today;
                    return (
                      <div key={day} className="min-h-[100px] border-r border-b border-slate-100 p-2 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={openAddEvent}>
                        <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>{day}</span>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => {
                            const c = EVENT_COLORS[event.type] || EVENT_COLORS.event;
                            return (<div key={event.id} onClick={(e) => { e.stopPropagation(); openEditEvent(event); }} className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer ${c.bg} ${c.text} border ${c.border}`}>{event.title}</div>);
                          })}
                          {dayEvents.length > 3 && <p className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50"><h3 className="font-semibold text-slate-800">All Events</h3></div>
                <div className="divide-y divide-slate-100">
                  {filteredEvents.length === 0 ? (<div className="text-center py-12 text-slate-400"><Icons.Calendar size={48} className="mx-auto mb-3" /><p className="text-sm">No events found</p></div>) : (
                    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event) => {
                      const c = EVENT_COLORS[event.type] || EVENT_COLORS.event;
                      return (
                        <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}><Icons.Calendar size={18} className={c.text} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><h4 className="font-medium text-sm text-slate-800">{event.title}</h4><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${c.bg} ${c.text}`}>{event.type}</span></div>
                            {event.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{event.description}</p>}
                            <p className="text-[11px] text-slate-400 mt-0.5">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}{event.startTime && ` • ${event.startTime}`}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditEvent(event)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Icons.Edit2 size={14} /></button>
                            <button onClick={() => deleteEvent(event)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Icons.Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <button onClick={() => setCurrentDate(new Date(year, month, currentDate.getDate() - 7))} className="p-2 rounded-lg hover:bg-slate-200"><Icons.ChevronLeft size={18} /></button>
                  <h3 className="font-semibold text-slate-800 text-sm">Week of {new Date(year, month, currentDate.getDate() - currentDate.getDay() + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
                  <button onClick={() => setCurrentDate(new Date(year, month, currentDate.getDate() + 7))} className="p-2 rounded-lg hover:bg-slate-200"><Icons.ChevronRight size={18} /></button>
                </div>
                <div className="divide-y divide-slate-100">
                  {WEEKDAYS.map((dayName, idx) => {
                    const dayOffset = idx - currentDate.getDay() + 1;
                    const date = new Date(year, month, currentDate.getDate() + dayOffset);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayEvents = getEventsForDate(dateStr);
                    const isToday = dateStr === today;
                    return (
                      <div key={dayName} className="flex min-h-[70px]">
                        <div className={`w-20 sm:w-24 flex-shrink-0 p-3 border-r border-slate-100 flex flex-col items-center justify-center ${isToday ? 'bg-slate-100' : ''}`}>
                          <span className="text-xs text-slate-500">{dayName}</span><span className={`text-xl font-bold ${isToday ? 'text-slate-800' : 'text-slate-600'}`}>{date.getDate()}</span>
                        </div>
                        <div className="flex-1 p-2 space-y-1">
                          {dayEvents.map((event) => {
                            const c = EVENT_COLORS[event.type] || EVENT_COLORS.event;
                            return (<div key={event.id} onClick={() => openEditEvent(event)} className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${c.bg} ${c.text} border ${c.border}`}>{event.title}</div>);
                          })}
                          {dayEvents.length === 0 && <p className="text-xs text-slate-300 italic p-2">No events</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingEvents.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Icons.Clock size={16} className="text-amber-500" />Upcoming Events (Next 7 Days)</h3>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => {
                    const c = EVENT_COLORS[event.type] || EVENT_COLORS.event;
                    return (
                      <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => openEditEvent(event)}>
                        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                        <div className="flex-1"><p className="text-sm font-medium text-slate-800">{event.title}</p><p className="text-[11px] text-slate-500">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Event Form Modal */}
      <EventFormModal isOpen={showEventForm} onClose={() => { setShowEventForm(false); setEditingEvent(null); }} onSave={saveEvent} event={editingEvent} semester={selectedSemester !== 'all' ? selectedSemester : null} />

      <style jsx>{`
        @keyframes gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient-shift { animation: gradient-shift 4s ease infinite; }
        @keyframes slide-in-left { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-left { animation: slide-in-left .3s ease-out; }
      `}</style>
    </div>
  );
}