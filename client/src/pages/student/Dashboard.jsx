import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getTimeGreeting, getAttendanceColor, formatDate } from '../../utils/helpers';
import { Timer, Bell, BookOpen, ClipboardCheck, Loader2, CalendarDays } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ attendance: [], assignments: [], notices: [], upcoming: [], profile: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [attRes, asnRes, notRes, profRes] = await Promise.all([
        api.get('/student/attendance/overview').catch(() => ({ data: [] })),
        api.get('/assignments/upcoming/student').catch(() => ({ data: [] })),
        api.get('/notices').catch(() => ({ data: { pinned: [], recent: [] } })),
        api.get('/student/profile').catch(() => ({ data: null })),
      ]);
      setData({
        attendance: attRes.data || [],
        assignments: (asnRes.data || []).slice(0, 3),
        notices: [...(notRes.data.pinned || []), ...(notRes.data.recent || [])].filter(n => !n.is_read).slice(0, 3),
        unread: (notRes.data.pinned || []).concat(notRes.data.recent || []).filter(n => !n.is_read).length,
        profile: profRes.data,
      });
    } finally { setLoading(false); }
  };

  const belowAttendance = (data.attendance || []).filter(a => {
    const pct = a.total > 0 ? (a.present / a.total) * 100 : 100;
    return pct < 75;
  });

  const overallPct = data.attendance?.length > 0
    ? Math.round(data.attendance.reduce((s, a) => {
        return s + (a.total > 0 ? (a.present / a.total) * 100 : 100);
      }, 0) / data.attendance.length)
    : null;

  const pendingCount = (data.assignments || []).length;
  const profile = data.profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-niist-navy to-blue-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-black">{getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
        {profile && <p className="text-blue-300 font-mono text-sm mt-1">{profile.enrollment_no}</p>}
        <p className="text-blue-200 text-sm mt-1">{profile?.session_name || ''} {profile?.current_semester ? `| Semester ${profile.current_semester}` : ''}</p>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <>
          {/* Attendance Alerts */}
          {belowAttendance.length > 0 && (
            <div className="space-y-2">
              {belowAttendance.map(a => {
                const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
                const needed = Math.ceil((0.75 * a.total - a.present) / 0.25);
                return (
                  <div key={a.subject_id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-500 text-xl shrink-0">⚠️</span>
                    <div className="flex-1">
                      <p className="font-black text-red-800">{a.subject_name} Attendance: {pct}%</p>
                      <p className="text-red-600 text-sm font-medium">You need {needed} more class{needed > 1 ? 'es' : ''} to reach 75%</p>
                      <div className="mt-2 h-2 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Overall Attendance', value: overallPct !== null ? `${overallPct}%` : '—', icon: '📊', cls: overallPct !== null && overallPct < 75 ? 'text-red-600' : 'text-green-600' },
              { label: 'Pending Assignments', value: pendingCount, icon: '📝', cls: pendingCount > 0 ? 'text-amber-600' : 'text-green-600' },
              { label: 'Unread Notices', value: data.unread || 0, icon: '🔔', cls: data.unread > 0 ? 'text-red-600' : 'text-gray-600' },
              { label: 'Semester', value: profile?.current_semester || '—', icon: '🎓', cls: 'text-niist-blue' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Attendance Mini Cards */}
          {data.attendance?.length > 0 && (
            <div>
              <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-niist-blue" /> Subject Attendance</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {data.attendance.map(a => {
                  const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
                  const cls = getAttendanceColor(pct);
                  return (
                    <div key={a.subject_id} className={`shrink-0 rounded-xl border p-4 min-w-[140px] ${cls.bg} border-gray-100`}>
                      <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{a.subject_name}</p>
                      <p className={`text-2xl font-black mt-2 ${cls.text}`}>{pct}%</p>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cls.bar} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">{a.present}/{a.total} classes</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          {data.assignments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2"><Timer className="w-5 h-5 text-amber-500" /> Upcoming Deadlines</h2>
              <div className="space-y-3">
                {data.assignments.map(a => {
                  const diff = new Date(a.deadline) - new Date();
                  const d = Math.ceil(diff / 86400000);
                  const urgency = d <= 2 ? 'text-red-600' : d <= 5 ? 'text-amber-600' : 'text-green-600';
                  return (
                    <div key={a.ca_id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.subject_name} · Unit {a.unit_no}</p>
                      </div>
                      <span className={`font-black text-sm ${urgency}`}>{d > 0 ? `${d}d left` : 'Overdue'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Notices */}
          {data.notices.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-black text-lg text-gray-800 flex items-center gap-2"><Bell className="w-5 h-5 text-red-500" /> Recent Notices</h2>
                <a href="/student/notices" className="text-xs font-bold text-niist-blue hover:underline">View All →</a>
              </div>
              <div className="space-y-3">
                {data.notices.map(n => (
                  <div key={n.notice_id} className="border-l-4 border-l-niist-blue pl-4 py-1">
                    <p className="font-bold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
