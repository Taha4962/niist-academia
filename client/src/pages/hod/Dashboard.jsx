import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getTimeGreeting, getAttendanceColor, formatRelative } from '../../utils/helpers';
import {
  Users, BookOpen, AlertTriangle, ClipboardList, Rocket, Flag,
  Loader2, TrendingUp, Bell, BarChart2, UserCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const PIE_COLORS = ['#16A34A', '#F59E0B', '#DC2626'];

const HodDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attDist, setAttDist] = useState(null);
  const [marksDist, setMarksDist] = useState([]);
  const [sessionComp, setSessionComp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, attRes, marksRes, sesRes] = await Promise.all([
        api.get('/hod/stats').catch(() => ({ data: null })),
        api.get('/hod/attendance-distribution').catch(() => ({ data: null })),
        api.get('/hod/marks-distribution').catch(() => ({ data: [] })),
        api.get('/hod/session-comparison').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setAttDist(attRes.data);
      setMarksDist(marksRes.data);
      setSessionComp(sesRes.data);
    } finally { setLoading(false); }
  };

  const STAT_CARDS = stats ? [
    { label: 'Total Students', value: stats.students?.active ?? '—', sub: `${stats.students?.total ?? 0} enrolled`, icon: <Users className="w-6 h-6" />, cls: 'from-blue-900 to-blue-700' },
    { label: 'Total Faculty', value: stats.faculty?.active ?? '—', sub: `${stats.faculty?.total ?? 0} total`, icon: <UserCheck className="w-6 h-6" />, cls: 'from-indigo-900 to-indigo-700' },
    { label: 'Below 75% Attendance', value: stats.below_attendance ?? '—', sub: 'students at risk', icon: <AlertTriangle className="w-6 h-6" />, cls: stats.below_attendance > 0 ? 'from-red-800 to-red-600' : 'from-green-800 to-green-600' },
    { label: 'Pending Assignments', value: stats.pending_submissions ?? '—', sub: 'to review', icon: <ClipboardList className="w-6 h-6" />, cls: stats.pending_submissions > 0 ? 'from-amber-700 to-amber-500' : 'from-gray-700 to-gray-500' },
    { label: 'Active Projects', value: stats.projects?.teams ?? '—', sub: `${stats.projects?.projects ?? 0} sessions`, icon: <Rocket className="w-6 h-6" />, cls: 'from-purple-900 to-purple-700' },
    { label: 'Missed Milestones', value: stats.missed_milestones ?? '—', sub: 'overdue', icon: <Flag className="w-6 h-6" />, cls: stats.missed_milestones > 0 ? 'from-red-800 to-red-600' : 'from-gray-700 to-gray-500' },
  ] : [];

  const attPieData = attDist ? [
    { name: '≥75% (Good)', value: parseInt(attDist.good) || 0 },
    { name: '65–74% (Warning)', value: parseInt(attDist.warning) || 0 },
    { name: '<65% (Critical)', value: parseInt(attDist.critical) || 0 },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-niist-navy to-blue-800 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-black">{getTimeGreeting()}, Dr. {user?.name?.split(' ').pop() || 'HOD'}! 👋</h1>
        <p className="text-blue-200 font-medium mt-1">Here's the department intelligence overview for today.</p>
        <p className="text-blue-300 text-sm mt-2 font-mono">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <>
          {/* 6 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAT_CARDS.map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.cls} text-white rounded-2xl p-5 shadow-lg`}>
                <div className="opacity-80 mb-3">{s.icon}</div>
                <p className="text-3xl font-black">{s.value}</p>
                <p className="text-xs font-bold mt-1 opacity-80" style={{ lineHeight: '1.3' }}>{s.label}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Session Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-black text-lg text-gray-800">Session Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    {['Session', 'Year', 'Students', 'Avg Attendance', 'Avg Marks', 'Assignment %'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessionComp.map(s => {
                    const attPct = parseFloat(s.avg_attendance) || 0;
                    const attCls = attPct >= 75 ? 'text-green-600' : attPct >= 65 ? 'text-amber-600' : 'text-red-600';
                    const assignPct = s.total_subs > 0 ? Math.round((s.approved_subs / s.total_subs) * 100) : 0;
                    return (
                      <tr key={s.session_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{s.session_name}</td>
                        <td className="px-4 py-3 text-gray-500">{s.start_year}–{s.start_year + 4}</td>
                        <td className="px-4 py-3 font-bold text-niist-blue">{s.student_count}</td>
                        <td className={`px-4 py-3 font-bold ${attCls}`}>{attPct}%</td>
                        <td className="px-4 py-3 font-bold text-gray-700">{parseFloat(s.avg_marks) || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${assignPct}%` }} />
                            </div>
                            <span className="font-bold text-sm text-gray-700">{assignPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sessionComp.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No data available</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Distribution Pie */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-niist-blue" /> Attendance Distribution</h2>
              {attPieData.every(d => d.value === 0) ? (
                <div className="py-10 text-center text-gray-400 font-medium">No attendance data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={attPieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {attPieData.map((entry, index) => <Cell key={index} fill={PIE_COLORS[index]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Marks Performance Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-niist-blue" /> Marks Performance by Session</h2>
              {marksDist.length === 0 ? (
                <div className="py-10 text-center text-gray-400 font-medium">No marks data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={marksDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="session_name" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 30]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    <Bar dataKey="avg_mst1" name="MST 1" fill="#1E3A8A" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="avg_mst2" name="MST 2" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="avg_internal" name="Internal" fill="#93C5FD" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Add Faculty', icon: '👨🏫', href: '/hod/faculty' },
                { label: 'Upload Students', icon: '📤', href: '/hod/students' },
                { label: 'Post Notice', icon: '📢', href: '/hod/notices' },
                { label: 'Create Timetable', icon: '📅', href: '/hod/timetable' },
                { label: 'Add Holiday', icon: '🏖️', href: '/hod/holidays' },
                { label: 'Login Logs', icon: '🔒', href: '/hod/login-logs' },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-niist-blue hover:bg-blue-50/15 transition-all text-center group">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-bold text-gray-700 group-hover:text-niist-navy">{a.label}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HodDashboard;
