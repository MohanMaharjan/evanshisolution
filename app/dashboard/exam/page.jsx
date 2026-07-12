'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import InternalExam from '@/components/exam/InternalExam';
import TUExam from '@/components/exam/TUExam';

const tabs = [
  {
    id: 'internal',
    label: 'Internal Exam',
    icon: Icons.FileText,
    description: 'Manage internal college examinations',
    color: 'blue',
  },
  {
    id: 'tu',
    label: 'TU Exam',
    icon: Icons.GraduationCap,
    description: 'Manage Tribhuvan University examinations',
    color: 'purple',
  },
];

export default function ExamPage() {
  const [activeTab, setActiveTab] = useState('internal');
  const { can, isLoading: permissionsLoading } = usePermissions();

  const hasInternalRead = can('internal_exam', 'read') || can('exams', 'read');
  const hasTURead = can('tu_exam', 'read') || can('exams', 'read');
  const hasAnyAccess = hasInternalRead || hasTURead;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Icons.Home },
    { label: 'Examinations', href: '/dashboard/exam', icon: Icons.ClipboardList },
  ];

  if (permissionsLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!hasAnyAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-xl border border-red-200">
          <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-600">Access Denied</h2>
          <p className="text-red-500">You don't have permission to view examinations.</p>
        </div>
      </div>
    );
  }

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="space-y-4 px-4 lg:px-6">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && <Icons.ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              <Link
                href={crumb.href}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-600 ${
                  index === breadcrumbs.length - 1 ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <crumb.icon className="w-3.5 h-3.5" />
                <span>{crumb.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Examination Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage internal and university examinations
            </p>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="mt-4 flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled =
              (tab.id === 'internal' && !hasInternalRead) ||
              (tab.id === 'tu' && !hasTURead);

            if (isDisabled) return null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }
                `}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'internal' && <InternalExam />}
          {activeTab === 'tu' && <TUExam />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}