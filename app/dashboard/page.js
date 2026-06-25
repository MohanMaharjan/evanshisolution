// src/app/dashboard/page.js

'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivity from '@/components/dashboard/RecentActivity';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Dashboard configs based on user level
const dashboardConfigs = {
  SYSTEM_ADMIN: {
    title: 'System Administration',
    stats: [
      { label: 'Total Users', value: '1,247', icon: Users, color: 'bg-blue-500', change: '+12%' },
      { label: 'Students', value: '892', icon: GraduationCap, color: 'bg-green-500', change: '+8%' },
      { label: 'Faculty', value: '156', icon: Briefcase, color: 'bg-purple-500', change: '+3%' },
      { label: 'Active Sessions', value: '234', icon: Activity, color: 'bg-orange-500', change: '+15%' },
    ],
  },
  ADMIN: {
    title: 'Admin Dashboard',
    stats: [
      { label: 'Total Students', value: '892', icon: GraduationCap, color: 'bg-green-500', change: '+8%' },
      { label: 'Faculty', value: '156', icon: Briefcase, color: 'bg-purple-500', change: '+3%' },
      { label: 'Departments', value: '12', icon: BookOpen, color: 'bg-blue-500', change: '0%' },
      { label: 'Active Courses', value: '245', icon: Calendar, color: 'bg-orange-500', change: '+5%' },
    ],
  },
  COORDINATOR: {
    title: 'Coordinator Dashboard',
    stats: [
      { label: 'My Students', value: '156', icon: GraduationCap, color: 'bg-green-500', change: '+4%' },
      { label: 'Faculty Members', value: '18', icon: Briefcase, color: 'bg-purple-500', change: '0%' },
      { label: 'Active Classes', value: '24', icon: Calendar, color: 'bg-blue-500', change: '+2' },
      { label: 'Pending Tasks', value: '8', icon: Clock, color: 'bg-orange-500', change: '-3' },
    ],
  },
  COUNSELOR: {
    title: 'Counselor Dashboard',
    stats: [
      { label: 'Assigned Students', value: '127', icon: GraduationCap, color: 'bg-green-500', change: '+5%' },
      { label: 'Today Sessions', value: '6', icon: Calendar, color: 'bg-blue-500', change: '+2' },
      { label: 'Pending Follow-ups', value: '15', icon: Clock, color: 'bg-orange-500', change: '-2' },
      { label: 'Cases Resolved', value: '43', icon: TrendingUp, color: 'bg-purple-500', change: '+8%' },
    ],
  },
  LIBRARIAN: {
    title: 'Library Dashboard',
    stats: [
      { label: 'Total Books', value: '45,678', icon: BookOpen, color: 'bg-blue-500', change: '+156' },
      { label: 'Issued Today', value: '89', icon: Activity, color: 'bg-green-500', change: '+12' },
      { label: 'Overdue', value: '23', icon: Clock, color: 'bg-red-500', change: '-5' },
      { label: 'Returns Today', value: '67', icon: TrendingUp, color: 'bg-purple-500', change: '+8' },
    ],
  },
  FACULTY: {
    title: 'Faculty Dashboard',
    stats: [
      { label: 'My Classes', value: '6', icon: Calendar, color: 'bg-blue-500', change: '0' },
      { label: 'My Students', value: '245', icon: GraduationCap, color: 'bg-green-500', change: '+3%' },
      { label: 'Today Classes', value: '4', icon: Clock, color: 'bg-orange-500', change: '+1' },
      { label: 'Pending Grades', value: '32', icon: BookOpen, color: 'bg-purple-500', change: '-8' },
    ],
  },
  STUDENT: {
    title: 'Student Dashboard',
    stats: [
      { label: 'Enrolled Courses', value: '6', icon: BookOpen, color: 'bg-blue-500', change: '0' },
      { label: 'Attendance', value: '87%', icon: Activity, color: 'bg-green-500', change: '+2%' },
      { label: 'CGPA', value: '8.5', icon: TrendingUp, color: 'bg-purple-500', change: '+0.2' },
      { label: 'Upcoming Exams', value: '3', icon: Calendar, color: 'bg-orange-500', change: '-1' },
    ],
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const userLevel = session?.user?.userLevel || 'STUDENT';
  const config = dashboardConfigs[userLevel];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session?.user?.firstName}! Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        {config.stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <RecentActivity userLevel={userLevel} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions userLevel={userLevel} />
        </motion.div>
      </div>
    </div>
  );
}

function QuickActions({ userLevel }) {
  const actions = {
    SYSTEM_ADMIN: [
      { name: 'Add New User', href: '/dashboard/users/new', color: 'bg-blue-500' },
      { name: 'Manage Roles', href: '/dashboard/roles', color: 'bg-purple-500' },
      { name: 'View Logs', href: '/dashboard/logs', color: 'bg-orange-500' },
      { name: 'System Settings', href: '/dashboard/settings', color: 'bg-gray-500' },
    ],
    ADMIN: [
      { name: 'Add Student', href: '/dashboard/students', color: 'bg-green-500' },
      { name: 'Add Faculty', href: '/dashboard/faculty', color: 'bg-purple-500' },
      { name: 'View Reports', href: '/dashboard/reports', color: 'bg-blue-500' },
      { name: 'Manage Users', href: '/dashboard/users', color: 'bg-orange-500' },
    ],
    COORDINATOR: [
      { name: 'View Students', href: '/dashboard/students', color: 'bg-green-500' },
      { name: 'View Faculty', href: '/dashboard/faculty', color: 'bg-purple-500' },
      { name: 'Generate Report', href: '/dashboard/reports', color: 'bg-blue-500' },
    ],
    COUNSELOR: [
      { name: 'My Students', href: '/dashboard/students', color: 'bg-green-500' },
      { name: 'Schedule Session', href: '/dashboard/counseling', color: 'bg-blue-500' },
      { name: 'View Reports', href: '/dashboard/reports', color: 'bg-purple-500' },
    ],
    LIBRARIAN: [
      { name: 'Add Book', href: '/dashboard/library/books', color: 'bg-green-500' },
      { name: 'Issue Book', href: '/dashboard/library/issued', color: 'bg-blue-500' },
      { name: 'View Reports', href: '/dashboard/reports', color: 'bg-purple-500' },
    ],
    FACULTY: [
      { name: 'Take Attendance', href: '/dashboard/attendance', color: 'bg-green-500' },
      { name: 'View Students', href: '/dashboard/students', color: 'bg-blue-500' },
      { name: 'My Classes', href: '/dashboard/classes', color: 'bg-purple-500' },
    ],
    STUDENT: [
      { name: 'View Courses', href: '/dashboard/courses', color: 'bg-blue-500' },
      { name: 'My Attendance', href: '/dashboard/attendance', color: 'bg-green-500' },
      { name: 'My Grades', href: '/dashboard/grades', color: 'bg-purple-500' },
    ],
  };

  const userActions = actions[userLevel] || [];

  return (
    <div className="space-y-3">
      {userActions.map((action) => (
        <a
          key={action.name}
          href={action.href}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
            <div className="w-3 h-3 bg-white/80 rounded-full" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {action.name}
          </span>
        </a>
      ))}
    </div>
  );
}