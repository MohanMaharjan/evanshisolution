'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, ChevronLeft, ChevronRight, RefreshCw,
  X, Home, ChevronRightIcon, Shield, ShieldCheck, ShieldAlert,
  Edit2, Trash2, Key, Lock, Check, Users, LayoutGrid, List,
  Eye, Settings, BookOpen, GraduationCap, Building,
  ClipboardList, FileText, UserCog, RotateCcw, Filter, CheckCircle2,
  XCircle, CheckSquare, Square,
} from 'lucide-react';

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full ${sizeClasses[size] || 'max-w-lg'} bg-white rounded-2xl shadow-2xl overflow-hidden`}>
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="px-5 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Badge Component
function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700', success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger: 'bg-red-50 text-red-700 border border-red-200', warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200', purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200', teal: 'bg-teal-50 text-teal-700 border border-teal-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant]} ${className}`}>{children}</span>;
}

// Tabs Component
function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button key={tab.value} onClick={() => onTabChange(tab.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          {tab.icon && <tab.icon className="w-3.5 h-3.5" />}{tab.label}
        </button>
      ))}
    </div>
  );
}

const moduleIcons = {
  USER_MANAGEMENT: Users, STUDENT_MANAGEMENT: GraduationCap, FACULTY_MANAGEMENT: UserCog,
  DEPARTMENT_MANAGEMENT: Building, ROLE_MANAGEMENT: Shield, COURSE_MANAGEMENT: BookOpen,
  ATTENDANCE: ClipboardList, REPORTS: FileText, SETTINGS: Settings,
};
const moduleColors = {
  USER_MANAGEMENT: 'border-blue-200 bg-blue-50', STUDENT_MANAGEMENT: 'border-emerald-200 bg-emerald-50',
  FACULTY_MANAGEMENT: 'border-indigo-200 bg-indigo-50', DEPARTMENT_MANAGEMENT: 'border-amber-200 bg-amber-50',
  ROLE_MANAGEMENT: 'border-purple-200 bg-purple-50', COURSE_MANAGEMENT: 'border-teal-200 bg-teal-50',
  ATTENDANCE: 'border-orange-200 bg-orange-50', REPORTS: 'border-rose-200 bg-rose-50',
  SETTINGS: 'border-gray-200 bg-gray-50',
};

export default function RolesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formType, setFormType] = useState('role');
  const [viewMode, setViewMode] = useState('card');
  const [isFiltered, setIsFiltered] = useState(false);
  const [lastUpdatedItem, setLastUpdatedItem] = useState(null);
  const [selectAllState, setSelectAllState] = useState({});

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([fetch('/api/roles'), fetch('/api/permissions')]);
      if (rolesRes.ok) setRoles((await rolesRes.json()).roles || []);
      if (permsRes.ok) setPermissions((await permsRes.json()).permissions || []);
      setIsFiltered(false); setLastUpdatedItem(null); setSelectAllState({});
    } catch (error) { console.error('Failed to fetch data:', error); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const handleRefresh = () => fetchData(true);

  const showOnlyItem = (item, type, isUpdate) => {
    if (type === 'role') setRoles(prev => isUpdate ? prev.map(r => r.id === item.id ? item : r) : [item, ...prev]);
    else setPermissions(prev => isUpdate ? prev.map(p => p.id === item.id ? item : p) : [item, ...prev]);
    setIsFiltered(true); setLastUpdatedItem({ ...item, type });
  };

  const handleCreateRole = () => { setEditingRole(null); setFormType('role'); setShowForm(true); };
  const handleEditRole = (role) => { setEditingRole(role); setFormType('role'); setShowForm(true); };
  const handleDeleteRole = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/roles/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) { setDeleteConfirm(null); setRoles(prev => prev.filter(r => r.id !== deleteConfirm.id)); }
    } catch (error) { console.error('Delete failed:', error); }
  };
  const handleRoleSubmit = async (formData) => {
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { const data = await res.json(); showOnlyItem(data.role, 'role', !!editingRole); setShowForm(false); setEditingRole(null); }
    } catch (error) { console.error('Submit failed:', error); }
  };

  const handleCreatePermission = () => { setEditingPermission(null); setFormType('permission'); setShowForm(true); };
  const handleEditPermission = (perm) => { setEditingPermission(perm); setFormType('permission'); setShowForm(true); };
  const handleDeletePermission = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/permissions/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) { setDeleteConfirm(null); setPermissions(prev => prev.filter(p => p.id !== deleteConfirm.id)); }
    } catch (error) { console.error('Delete failed:', error); }
  };
  const handlePermissionSubmit = async (formData) => {
    try {
      const url = editingPermission ? `/api/permissions/${editingPermission.id}` : '/api/permissions';
      const method = editingPermission ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { const data = await res.json(); showOnlyItem(data.permission, 'permission', !!editingPermission); setShowForm(false); setEditingPermission(null); }
    } catch (error) { console.error('Submit failed:', error); }
  };

  const handleTogglePermission = async (roleId, permissionId, isAssigned) => {
    try {
      if (isAssigned) {
        await fetch(`/api/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/roles/${roleId}/permissions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionId }) });
      }
      fetchData(true);
    } catch (error) { console.error('Toggle failed:', error); }
  };

  // Batch assign/remove permissions for a role
  const handleBatchToggle = async (roleId, permissionIds, assign) => {
    try {
      await Promise.all(permissionIds.map(permissionId =>
        fetch(assign ? `/api/roles/${roleId}/permissions` : `/api/roles/${roleId}/permissions/${permissionId}`, {
          method: assign ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: assign ? JSON.stringify({ permissionId }) : undefined,
        })
      ));
      fetchData(true);
    } catch (error) { console.error('Batch toggle failed:', error); }
  };

  // Select all permissions for a module for a specific role
  const handleSelectAllModule = async (roleId, module, perms) => {
    const unassignedPerms = perms.filter(p => !roleHasPermission(roleId, p.id));
    if (unassignedPerms.length > 0) {
      await handleBatchToggle(roleId, unassignedPerms.map(p => p.id), true);
    }
  };

  // Deselect all permissions for a module for a specific role
  const handleDeselectAllModule = async (roleId, module, perms) => {
    const assignedPerms = perms.filter(p => roleHasPermission(roleId, p.id));
    if (assignedPerms.length > 0) {
      await handleBatchToggle(roleId, assignedPerms.map(p => p.id), false);
    }
  };

  // Select all permissions for a role
  const handleSelectAllForRole = async (roleId) => {
    const unassigned = permissions.filter(p => !roleHasPermission(roleId, p.id));
    if (unassigned.length > 0) {
      await handleBatchToggle(roleId, unassigned.map(p => p.id), true);
    }
  };

  // Deselect all permissions for a role
  const handleDeselectAllForRole = async (roleId) => {
    const assigned = permissions.filter(p => roleHasPermission(roleId, p.id));
    if (assigned.length > 0) {
      await handleBatchToggle(roleId, assigned.map(p => p.id), false);
    }
  };

  const roleHasPermission = (roleId, permId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.permissions?.some(rp => rp.permissionId === permId);
  };

  const getActionColor = (action) => ({ CREATE: 'success', READ: 'info', UPDATE: 'warning', DELETE: 'danger' }[action] || 'default');

  const filteredRoles = roles.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesRoleFilter = !roleFilter || r.name.toLowerCase().includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRoleFilter;
  });

  const filteredPermissions = permissions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.module.toLowerCase().includes(search.toLowerCase());
    const matchesModule = !moduleFilter || p.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Roles & Permissions', href: '/dashboard/roles', icon: Shield },
  ];
  const tabs = [
    { value: 'roles', label: 'Roles', icon: Shield },
    { value: 'permissions', label: 'Permissions', icon: Key },
    { value: 'assignment', label: 'Assignment', icon: Lock },
  ];
  const modules = ['USER_MANAGEMENT', 'STUDENT_MANAGEMENT', 'FACULTY_MANAGEMENT', 'DEPARTMENT_MANAGEMENT', 'ROLE_MANAGEMENT', 'COURSE_MANAGEMENT', 'ATTENDANCE', 'REPORTS', 'SETTINGS'];

  return (
    <div className="space-y-4 px-4 lg:px-6">
      {/* Header */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />}
              <Link href={crumb.href} className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-600 ${index === breadcrumbs.length - 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                {crumb.icon && <crumb.icon className="w-3.5 h-3.5" />}<span>{crumb.label}</span>
              </Link>
            </div>
          ))}
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div><h1 className="text-xl font-bold text-gray-900">Roles & Permissions</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[11px] font-medium"><Shield className="w-3 h-3" />{roles.length} Roles</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium"><Key className="w-3 h-3" />{permissions.length} Permissions</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFiltered && (
              <button onClick={() => { setIsFiltered(false); setLastUpdatedItem(null); setSearch(''); setRoleFilter(''); setModuleFilter(''); fetchData(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 hover:bg-amber-100"><RotateCcw className="w-3.5 h-3.5" />Show All</button>
            )}
            <button onClick={handleRefresh} disabled={refreshing || loading} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {activeTab === 'roles' && (
              <button onClick={handleCreateRole} className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700"><Plus className="w-3.5 h-3.5" />Create Role</button>
            )}
            {activeTab === 'permissions' && (
              <button onClick={handleCreatePermission} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"><Plus className="w-3.5 h-3.5" />Create Permission</button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs, Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === 'permissions' && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><List className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              <Filter className="w-3.5 h-3.5" />Filters
            </button>
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeTab === 'assignment' && (
                    <div><label className="block text-[10px] font-medium text-gray-500 mb-1">Filter by Role</label>
                      <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Roles</option>{roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select></div>
                  )}
                  {activeTab === 'permissions' && (
                    <div><label className="block text-[10px] font-medium text-gray-500 mb-1">Filter by Module</label>
                      <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Modules</option>{modules.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                      </select></div>
                  )}
                  <div className="flex items-end"><button onClick={() => { setRoleFilter(''); setModuleFilter(''); setSearch(''); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 w-full">Clear Filters</button></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? <div className="flex justify-center items-center py-16"><div className="w-8 h-8 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
          : filteredRoles.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Shield className="w-12 h-12 mb-3 stroke-1" /><p className="text-sm font-medium text-gray-500">No roles found</p></div>
          : <table className="min-w-full divide-y divide-gray-200"><thead><tr className="bg-gray-50/80">{['Role', 'Permissions', 'Users', 'Created', 'Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-100">{filteredRoles.map((role, i) => (
              <motion.tr key={role.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`hover:bg-purple-50/30 transition-colors ${lastUpdatedItem?.id === role.id && lastUpdatedItem?.type === 'role' ? 'bg-purple-50/50 ring-1 ring-purple-200' : ''}`}>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-purple-600" /></div><div><p className="text-xs font-medium text-gray-900">{role.name}</p>{role.description && <p className="text-[10px] text-gray-500">{role.description}</p>}</div></div></td>
                <td className="px-5 py-3"><span className="text-xs text-gray-600">{role.permissions?.length || 0}</span></td>
                <td className="px-5 py-3"><span className="text-xs text-gray-600">{role.users?.length || 0}</span></td>
                <td className="px-5 py-3"><span className="text-xs text-gray-500">{new Date(role.createdAt).toLocaleDateString()}</span></td>
                <td className="px-5 py-3"><div className="flex items-center gap-1"><button onClick={() => handleEditRole(role)} className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setDeleteConfirm({ ...role, type: 'role' })} className="p-1.5 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
              </motion.tr>
            ))}</tbody></table>}
        </div>
      )}

      {/* Permissions Tab - Card View */}
      {activeTab === 'permissions' && viewMode === 'card' && (
        <div className="space-y-5">
          {loading ? <div className="flex justify-center items-center py-16 bg-white rounded-xl border border-gray-200"><div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          : Object.keys(groupedPermissions).length === 0 ? <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400"><Key className="w-12 h-12 mb-3 stroke-1" /><p className="text-sm font-medium text-gray-500">No permissions found</p></div>
          : Object.entries(groupedPermissions).map(([module, perms]) => {
              const ModuleIcon = moduleIcons[module] || Settings;
              return (
                <motion.div key={module} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className={`px-5 py-3 border-b ${moduleColors[module] || 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center"><ModuleIcon className="w-4 h-4 text-gray-600" /></div><div><h3 className="text-xs font-semibold text-gray-900">{module.replace(/_/g, ' ')}</h3><p className="text-[10px] text-gray-500">{perms.length} permission{perms.length !== 1 ? 's' : ''}</p></div></div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {perms.map(perm => (
                      <div key={perm.id} className={`group relative p-3 rounded-lg border transition-all hover:shadow-sm ${lastUpdatedItem?.id === perm.id && lastUpdatedItem?.type === 'permission' ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-start justify-between mb-1.5"><Badge variant={getActionColor(perm.action)}>{perm.action}</Badge><div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditPermission(perm)} className="p-1 rounded text-blue-600 hover:bg-blue-50"><Edit2 className="w-3 h-3" /></button><button onClick={() => setDeleteConfirm({ ...perm, type: 'permission' })} className="p-1 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button></div></div>
                        <p className="text-xs font-medium text-gray-900 truncate">{perm.name}</p>
                        {perm.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{perm.description}</p>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* Permissions Tab - List View */}
      {activeTab === 'permissions' && viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? <div className="flex justify-center items-center py-16"><div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          : filteredPermissions.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Key className="w-12 h-12 mb-3 stroke-1" /><p className="text-sm font-medium text-gray-500">No permissions found</p></div>
          : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead><tr className="bg-gray-50/80">{['Permission', 'Module', 'Action', 'Description', 'Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-100">{filteredPermissions.map((perm, i) => (
              <motion.tr key={perm.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`hover:bg-blue-50/30 transition-colors ${lastUpdatedItem?.id === perm.id && lastUpdatedItem?.type === 'permission' ? 'bg-blue-50/50 ring-1 ring-blue-200' : ''}`}>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Key className="w-4 h-4 text-blue-600" /></div><p className="text-xs font-medium text-gray-900">{perm.name}</p></div></td>
                <td className="px-5 py-3"><span className="text-xs text-gray-600">{perm.module?.replace(/_/g, ' ')}</span></td>
                <td className="px-5 py-3"><Badge variant={getActionColor(perm.action)}>{perm.action}</Badge></td>
                <td className="px-5 py-3"><span className="text-xs text-gray-500 truncate max-w-[200px] block">{perm.description || '—'}</span></td>
                <td className="px-5 py-3"><div className="flex items-center gap-1"><button onClick={() => handleEditPermission(perm)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setDeleteConfirm({ ...perm, type: 'permission' })} className="p-1.5 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
              </motion.tr>
            ))}</tbody></table></div>}
        </div>
      )}

      {/* Assignment Tab */}
      {activeTab === 'assignment' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? <div className="flex justify-center items-center py-16"><div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
          : (
            <div className="overflow-auto max-h-[calc(100vh-280px)]">
              <table className="min-w-full divide-y divide-gray-200 border-collapse">
                <thead className="sticky top-0 z-20">
                  {/* Module Header Row with Select All */}
                  <tr className="bg-gray-100/95 backdrop-blur-sm">
                    <th className="sticky left-0 z-30 bg-gray-100/95 backdrop-blur-sm px-3 py-1 text-left text-[9px] font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-200 min-w-[140px]">
                      <span>Role / Module</span>
                    </th>
                    {Object.entries(groupedPermissions).map(([module, perms], mi, ma) => {
                      const ModuleIcon = moduleIcons[module] || Settings;
                      return (
                        <th key={module} colSpan={perms.length} className={`px-1 py-1 text-center ${mi !== ma.length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                          <div className="flex items-center justify-center gap-1">
                            <ModuleIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-[8px] font-semibold text-gray-600">{module.replace(/_/g, ' ')}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                  {/* Role Row with Select All per module */}
                  <tr className="bg-gray-50/95 backdrop-blur-sm">
                    <th className="sticky left-0 z-30 bg-gray-50/95 backdrop-blur-sm px-3 py-1 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[140px]">
                      <div className="flex flex-col"><span>Role Name</span><span className="text-[7px] font-normal text-gray-400">Assigned</span></div>
                    </th>
                    {Object.entries(groupedPermissions).map(([module, perms], mi, ma) => (
                      <th key={module} colSpan={perms.length} className={`px-1 py-1 text-center ${mi !== ma.length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1">
                            {filteredRoles.length > 0 && (
                              <>
                                <button onClick={() => {
                                  const roleId = filteredRoles[0]?.id;
                                  if (roleId) handleSelectAllModule(roleId, module, perms);
                                }} className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50" title={`Select all ${module}`}>
                                  <CheckSquare className="w-3 h-3" />
                                </button>
                                <button onClick={() => {
                                  const roleId = filteredRoles[0]?.id;
                                  if (roleId) handleDeselectAllModule(roleId, module, perms);
                                }} className="p-0.5 rounded text-red-600 hover:bg-red-50" title={`Deselect all ${module}`}>
                                  <Square className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                          <span className="text-[7px] text-gray-400">Select All</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* Permission Sub-Header Row */}
                  <tr className="bg-gray-50/95 backdrop-blur-sm">
                    <th className="sticky left-0 z-30 bg-gray-50/95 backdrop-blur-sm px-3 py-1 text-left border-r border-gray-200 min-w-[140px]">
                      <div className="flex items-center gap-1">
                        <button onClick={() => {
                          const roleId = filteredRoles[0]?.id;
                          if (roleId) handleSelectAllForRole(roleId);
                        }} className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50" title="Select all for role">
                          <CheckSquare className="w-3 h-3" />
                        </button>
                        <button onClick={() => {
                          const roleId = filteredRoles[0]?.id;
                          if (roleId) handleDeselectAllForRole(roleId);
                        }} className="p-0.5 rounded text-red-600 hover:bg-red-50" title="Deselect all for role">
                          <Square className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                    {Object.entries(groupedPermissions).map(([module, perms], mi, ma) =>
                      perms.map((perm, pi) => (
                        <th key={perm.id} className={`px-1 py-0.5 text-center min-w-[45px] ${pi === perms.length - 1 && mi !== ma.length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                          <div className="flex flex-col items-center gap-0">
                            <Badge variant={getActionColor(perm.action)} className="text-[6px] px-1 py-0">{perm.action}</Badge>
                            <span className="text-[6px] text-gray-400 leading-tight truncate max-w-[40px]" title={perm.name}>{perm.name.replace(module + '_', '').replace(/_/g, ' ')}</span>
                          </div>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRoles.map((role, i) => (
                    <motion.tr key={role.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-gray-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-gray-200 min-w-[140px]">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col min-w-0">
                            <p className="text-[10px] font-medium text-gray-900 truncate">{role.name}</p>
                            <span className="text-[8px] text-gray-400">{role.permissions?.length || 0}/{permissions.length}</span>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                            <button onClick={() => handleSelectAllForRole(role.id)} className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50" title="Select All">
                              <CheckSquare className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeselectAllForRole(role.id)} className="p-0.5 rounded text-red-600 hover:bg-red-50" title="Deselect All">
                              <Square className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      {Object.entries(groupedPermissions).map(([module, perms], mi, ma) =>
                        perms.map((perm, pi) => {
                          const isAssigned = role.permissions?.some(rp => rp.permissionId === perm.id);
                          return (
                            <td key={perm.id} className={`px-1 py-1.5 text-center ${pi === perms.length - 1 && mi !== ma.length - 1 ? 'border-r-2 border-gray-300' : 'border-r border-gray-100'}`}>
                              <button onClick={() => handleTogglePermission(role.id, perm.id, isAssigned)}
                                className={`w-4 h-4 rounded flex items-center justify-center transition-all ${isAssigned ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-400'}`}
                                title={`${isAssigned ? 'Remove' : 'Assign'} ${perm.name}`}>
                                {isAssigned ? <Check className="w-2.5 h-2.5" /> : <span className="text-[7px] leading-none text-gray-300">○</span>}
                              </button>
                            </td>
                          );
                        })
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showForm && formType === 'role'} onClose={() => { setShowForm(false); setEditingRole(null); }} title={editingRole ? 'Edit Role' : 'Create Role'} size="lg">
        <RoleForm role={editingRole} onSubmit={handleRoleSubmit} onCancel={() => { setShowForm(false); setEditingRole(null); }} />
      </Modal>
      <Modal isOpen={showForm && formType === 'permission'} onClose={() => { setShowForm(false); setEditingPermission(null); }} title={editingPermission ? 'Edit Permission' : 'Create Permission'} size="lg">
        <PermissionForm permission={editingPermission} onSubmit={handlePermissionSubmit} onCancel={() => { setShowForm(false); setEditingPermission(null); }} />
      </Modal>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={`Delete ${deleteConfirm?.type}`} size="sm">
        <div className="space-y-3"><div className="flex items-center gap-2.5 p-2.5 bg-red-50 rounded-lg"><div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><ShieldAlert className="w-4 h-4 text-red-600" /></div><div><p className="text-xs font-medium text-red-800">Confirm Deletion</p><p className="text-[11px] text-red-600">This action cannot be undone</p></div></div>
        <p className="text-xs text-gray-600">Delete <strong>{deleteConfirm?.name}</strong>?</p>
        <div className="flex justify-end gap-2 pt-1"><button onClick={() => setDeleteConfirm(null)} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">Cancel</button><button onClick={() => deleteConfirm?.type === 'role' ? handleDeleteRole() : handleDeletePermission()} className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Delete</button></div></div>
      </Modal>
    </div>
  );
}

// Role Form Component
function RoleForm({ role, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: role?.name || '', description: role?.description || '' });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-gray-700 mb-1">Role Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Administrator" /></div>
      <div><label className="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Brief description" /></div>
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" className="px-4 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">{role ? 'Update' : 'Create'} Role</button></div>
    </form>
  );
}

// Permission Form Component
function PermissionForm({ permission, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: permission?.name || '', description: permission?.description || '', module: permission?.module || '', action: permission?.action || 'READ' });
  const modules = ['USER_MANAGEMENT', 'STUDENT_MANAGEMENT', 'FACULTY_MANAGEMENT', 'DEPARTMENT_MANAGEMENT', 'ROLE_MANAGEMENT', 'COURSE_MANAGEMENT', 'ATTENDANCE', 'REPORTS', 'SETTINGS'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
  const actionColors = { CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-300', READ: 'bg-blue-50 text-blue-700 border-blue-300', UPDATE: 'bg-amber-50 text-amber-700 border-amber-300', DELETE: 'bg-red-50 text-red-700 border-red-300' };
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-gray-700 mb-1">Permission Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., CREATE_USER" /></div>
      <div><label className="block text-xs font-medium text-gray-700 mb-1">Description</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="What this permission allows" /></div>
      <div><label className="block text-xs font-medium text-gray-700 mb-1">Module *</label><div className="flex flex-wrap gap-1.5">{modules.map(mod => (<button key={mod} type="button" onClick={() => setForm({...form, module: mod})} className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${form.module === mod ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{mod.replace(/_/g, ' ')}</button>))}</div></div>
      <div><label className="block text-xs font-medium text-gray-700 mb-1">Action *</label><div className="flex gap-2">{actions.map(action => (<button key={action} type="button" onClick={() => setForm({...form, action})} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${form.action === action ? actionColors[action] + ' shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{action}</button>))}</div></div>
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">{permission ? 'Update' : 'Create'} Permission</button></div>
    </form>
  );
}