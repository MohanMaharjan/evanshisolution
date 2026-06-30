// app/dashboard/classroom/[id]/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import * as Icons from 'lucide-react';
import ClassroomAttendanceView from '@/components/classroom/ClassroomAttendanceView';

const API_URL = '/api';

export default function ClassroomDetailsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(API_URL + endpoint, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  }, []);

  useEffect(() => {
    if (!params?.id) return;

    const fetchClassroomData = async () => {
      setLoading(true);
      setError(null);

      try {
        const classroomId = parseInt(params.id);

        // Fetch classroom details
        const classroomData = await api('/classrooms/' + classroomId);
        const cls = classroomData.classroom;

        if (!cls) {
          setError('not_found');
          return;
        }

        // Fetch batch students if batchId exists
        let students = [];
        if (cls.batchId) {
          try {
            const studentsData = await api('/batches/' + cls.batchId + '/students?status=active');
            students = (studentsData.students || [])
              .map((s) => ({
                id: s.id,
                name: s.name || 'Unknown',
                email: s.email || '',
                phone: s.phone || '',
                rollNo: s.rollNo || '-',
                status: s.status,
                department: s.department || null,
              }))
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          } catch (e) {
            console.warn('Failed to fetch batch students:', e);
          }
        }

        setClassroom({ ...cls, students });
      } catch (err) {
        console.error('Error fetching classroom:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [params?.id, api]);

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Icons.Loader2 size={32} className="animate-spin text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading classroom...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (error === 'not_found') {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Icons.AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Classroom Not Found</h2>
          <p className="text-slate-500 mb-4">The classroom you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/classroom"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Icons.ArrowLeft size={16} /> Back to Classrooms
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <Icons.AlertTriangle size={32} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/classroom"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Icons.ArrowLeft size={16} /> Back to Classrooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard/classroom"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 transition-colors"
          >
            <Icons.ArrowLeft size={18} /> Back to Classrooms
          </Link>

          {classroom && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Classroom</span>
              <Icons.ChevronRight size={14} />
              <span className="text-slate-700 font-medium">{classroom.name}</span>
            </div>
          )}
        </div>

        {/* Classroom Header Info */}
        {classroom && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                  <Icons.BookOpen size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{classroom.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-slate-600">{classroom.code || 'No Code'}</span>
                    {classroom.course && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm text-slate-600">{classroom.course.name}</span>
                      </>
                    )}
                    {classroom.semester && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm text-slate-600 capitalize">
                          {classroom.semester.replace('semester', 'Semester ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {classroom.faculty && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Faculty</p>
                    <p className="text-sm font-medium text-slate-800">{classroom.faculty.name}</p>
                    {classroom.faculty.email && (
                      <p className="text-xs text-slate-500">{classroom.faculty.email}</p>
                    )}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-slate-500">Students</p>
                  <p className="text-sm font-medium text-slate-800">
                    {classroom.students?.length || 0} Active
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Capacity</p>
                  <p className="text-sm font-medium text-slate-800">
                    {classroom.capacity || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance View Component */}
        {classroom && (
          <ClassroomAttendanceView classroom={classroom} theme="slate" />
        )}
      </div>
    </div>
  );
}