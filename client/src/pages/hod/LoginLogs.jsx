import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, Loader2, ChevronLeft, ChevronRight, Filter, Search, AlertTriangle } from 'lucide-react';

const STATUS_BADGE = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const formatRelative = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} mins ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const LoginLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const [filters, setFilters] = useState({ role: '', status: '', from_date: '', to_date: '', search: '' });
  const [failedAlerts, setFailedAlerts] = useState([]);

  useEffect(() => { fetchLogs(); }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/hod/login-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);

      // Detect suspicious activity (>5 failed for same email in 24h)
      const failedMap = {};
      (res.data.logs || []).filter(l => l.status === 'failed').forEach(l => {
        failedMap[l.email] = (failedMap[l.email] || 0) + 1;
      });
      setFailedAlerts(Object.entries(failedMap).filter(([email, count]) => count >= 5).map(([email, count]) => ({ email, count })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const failedToday = logs.filter(l => l.status === 'failed' && (Date.now() - new Date(l.logged_at).getTime()) < 86400000).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-niist-navy flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-niist-blue" /> Login Logs</h1>
          <p className="text-gray-500 font-medium">Security activity across the system</p>
        </div>
        {failedToday > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-sm">
            ⚠️ {failedToday} failed login{failedToday > 1 ? 's' : ''} in last 24h
          </div>
        )}
      </div>

      {/* Suspicious Activity Alerts */}
      {failedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="font-black text-red-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Suspicious Activity Detected</p>
          {failedAlerts.map(a => (
            <p key={a.email} className="text-sm font-medium text-red-700">
              • {a.email} — {a.count} failed login attempts
            </p>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select className="form-select" value={filters.role} onChange={e => { setFilters(f => ({...f,role:e.target.value})); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
            <option value="hod">HOD</option>
          </select>
          <select className="form-select" value={filters.status} onChange={e => { setFilters(f => ({...f,status:e.target.value})); setPage(1); }}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <input type="date" className="form-input" value={filters.from_date} onChange={e => { setFilters(f => ({...f,from_date:e.target.value})); setPage(1); }} placeholder="From Date" />
          <input type="date" className="form-input" value={filters.to_date} onChange={e => { setFilters(f => ({...f,to_date:e.target.value})); setPage(1); }} placeholder="To Date" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="form-input pl-9" placeholder="Search by email..." value={filters.search} onChange={e => { setFilters(f => ({...f,search:e.target.value})); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  {['Time', 'User', 'Role', 'IP Address', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log, i) => (
                  <tr key={log.log_id || i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-600" title={new Date(log.logged_at).toLocaleString()}>
                        {formatRelative(log.logged_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 text-sm">{log.user_name || '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{log.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{log.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">{log.ip_address || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[log.status] || ''}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-medium">No logs found with current filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-gray-700">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginLogs;
