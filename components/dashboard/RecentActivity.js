// src/components/dashboard/RecentActivity.js

'use client';

import { formatDateTime } from '@/lib/utils';

const activities = {
  SYSTEM_ADMIN: [
    { action: 'Created new user', user: 'John Doe', time: new Date(), type: 'create' },
    { action: 'Updated role permissions', user: 'Admin Role', time: new Date(Date.now() - 3600000), type: 'update' },
    { action: 'User suspended', user: 'Jane Smith', time: new Date(Date.now() - 7200000), type: 'delete' },
    { action: 'System backup completed', user: 'System', time: new Date(Date.now() - 10800000), type: 'system' },
    { action: 'New role created', user: 'Lab Assistant', time: new Date(Date.now() - 14400000), type: 'create' },
  ],
  ADMIN: [
    { action: 'New student enrolled', user: 'Alex Johnson', time: new Date(), type: 'create' },
    { action: 'Faculty added', user: 'Dr. Sarah Wilson', time: new Date(Date.now() - 3600000), type: 'create' },
    { action: 'Course updated', user: 'CS101', time: new Date(Date.now() - 7200000), type: 'update' },
    { action: 'Exam schedule published', user: 'Mid-term 2024', time: new Date(Date.now() - 10800000), type: 'update' },
  ],
  COORDINATOR: [
    { action: 'Student attendance marked', user: 'CS-301', time: new Date(), type: 'update' },
    { action: 'Assignment submitted', user: '15 students', time: new Date(Date.now() - 3600000), type: 'create' },
    { action: 'Class schedule updated', user: 'CS Department', time: new Date(Date.now() - 7200000), type: 'update' },
  ],
  COUNSELOR: [
    { action: 'Counseling session completed', user: 'Mike Brown', time: new Date(), type: 'update' },
    { action: 'New student assigned', user: 'Emily Davis', time: new Date(Date.now() - 3600000), type: 'create' },
    { action: 'Follow-up scheduled', user: 'Chris Lee', time: new Date(Date.now() - 7200000), type: 'update' },
  ],
  LIBRARIAN: [
    { action: 'Books issued', user: '5 students', time: new Date(), type: 'create' },
    { action: 'Books returned', user: '3 students', time: new Date(Date.now() - 3600000), type: 'update' },
    { action: 'New books added', user: '12 books', time: new Date(Date.now() - 7200000), type: 'create' },
    { action: 'Overdue notification sent', user: '8 students', time: new Date(Date.now() - 10800000), type: 'system' },
  ],
  FACULTY: [
    { action: 'Attendance marked', user: 'CS-301', time: new Date(), type: 'update' },
    { action: 'Assignment graded', user: 'Lab 3', time: new Date(Date.now() - 3600000), type: 'update' },
    { action: 'Notes uploaded', user: 'Chapter 5', time: new Date(Date.now() - 7200000), type: 'create' },
  ],
  STUDENT: [
    { action: 'Assignment submitted', user: 'Lab 3', time: new Date(), type: 'create' },
    { action: 'Attendance marked', user: 'CS-301', time: new Date(Date.now() - 3600000), type: 'update' },
    { action: 'Grade published', user: 'Mid-term', time: new Date(Date.now() - 86400000), type: 'update' },
  ],
};

const typeColors = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  system: 'bg-gray-100 text-gray-700',
};

export default function RecentActivity({ userLevel }) {
  const userActivities = activities[userLevel] || activities.STUDENT;

  return (
    <div className="space-y-4">
      {userActivities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${typeColors[activity.type]}`}>
            {activity.type}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">
              {activity.action} — <span className="font-medium">{activity.user}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(activity.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}