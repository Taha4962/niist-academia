import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getTimeGreeting, formatDate } from '../../utils/helpers';
import { BookOpen, ClipboardList, Calendar, Timer, Loader2, AlertTriangle } from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [subRes, asnRes, ttRes] = await Promise.all([
        api.get('/faculty/subjects').catch(() => ({ data: [] })),
        api.get('/assignments/upcoming/faculty').catch(() => ({ data: [] })),
        api.get('/timetable').catch(() => ({ data: [] })),
      ]);
      setSubjects(subRes.data || []);
      setUpcoming((asnRes.data || []).slice(0, 5));
      setTimetable((ttRes.data || []).filter(t => t.day_of_week === today));
    } finally { setLoading(false); }
  };

  const todaySchedule = timetable.sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-niist-navy to-blue-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-black">{getTimeGreeting()}, Prof. {user?.name?.split(' ').pop() || 'Faculty'}! 👋</h1>
        <p className="text-blue-200 text-sm mt-2 font-mono">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <>
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-lg text-gray-800 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-niist-blue" /> Today's Schedule — <span className="text-niist-blue">{today}</span>
            </h2>
            {todaySchedule.length === 0 ? (
              <p className="py-6 text-center text-gray-400 font-medium">No classes today 🎉</p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="bg-niist-navy text-white text-center px-3 py-2 rounded-lg shrink-0">
                      <p className="text-xs font-mono font-bold">{t.start_time?.slice(0, 5)}</p>
                      <p className="text-[10px] text-blue-300 font-mono">{t.end_time?.slice(0, 5)}</p>
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{t.subject_name}</p>
                      <p className="text-xs text-gray-500">{t.session_name} · {t.room_no || 'Room TBD'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Subjects */}
          <div>
            <h2 className="font-black text-lg text-gray-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-niist-blue" /> My Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(s => (
                <div key={s.sa_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-niist-blue/30 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-gray-900">{s.subject_name}</p>
                      <p className="text-xs font-mono text-gray-400">{s.subject_code}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">Sem {s.semester}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">{s.session_name}</span>
                    <a href={`/faculty/attendance`} className="text-niist-blue font-bold hover:underline">Open →</a>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && <p className="text-gray-400 font-medium col-span-3 py-6 text-center">No subjects assigned yet.</p>}
            </div>
          </div>

          {/* Upcoming Assignment Deadlines */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2"><Timer className="w-5 h-5 text-amber-500" /> Upcoming Assignment Deadlines</h2>
              <div className="space-y-3">
                {upcoming.map(a => {
                  const diff = new Date(a.deadline) - new Date();
                  const d = Math.ceil(diff / 86400000);
                  const urgency = d <= 2 ? 'text-red-600' : d <= 5 ? 'text-amber-600' : 'text-green-600';
                  return (
                    <div key={a.ca_id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.subject_name} · {a.submitted_count ?? 0} submitted</p>
                      </div>
                      <span className={`font-black text-sm shrink-0 ml-4 ${urgency}`}>{d > 0 ? `${d}d left` : 'Overdue'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyDashboard;
