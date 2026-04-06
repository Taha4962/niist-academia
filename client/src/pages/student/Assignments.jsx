import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, CheckCircle2, XCircle, Loader2, BookOpen, Timer } from 'lucide-react';

const STATUS_BADGES = {
  pending: { label: '⏳ Pending', cls: 'bg-gray-100 text-gray-600' },
  submitted: { label: '🔵 Submitted', cls: 'bg-blue-100 text-blue-700' },
  approved: { label: '✅ Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '❌ Rejected', cls: 'bg-red-50 text-red-700 border border-red-200' },
  resubmitted: { label: '↩️ Resubmitted', cls: 'bg-purple-100 text-purple-700' },
};

const Countdown = ({ deadline }) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('text-gray-400');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setLabel('Expired'); setColor('text-gray-400'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 3) { setLabel(`${d}d ${h}h left`); setColor('text-green-600'); }
      else if (d >= 1) { setLabel(`${d}d ${h}h left`); setColor('text-amber-500'); }
      else { setLabel(`${h}h ${m}m left`); setColor('text-red-600'); }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [deadline]);
  return <span className={`text-xs font-bold ${color} flex items-center gap-1`}><Timer className="w-3 h-3" />{label}</span>;
};

const StudentAssignments = () => {
  const [data, setData] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, uRes] = await Promise.all([
          api.get('/assignments/student/all'),
          api.get('/assignments/upcoming/student')
        ]);
        setData(aRes.data);
        setUpcoming(uRes.data);

        // Group by subject
        const subjects = [...new Set(aRes.data.map(a => a.subject_code))];
        if (subjects.length > 0) setActiveSubject(subjects[0]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const assignments = data.filter(a => a.subject_code === activeSubject);
  // Group by unit
  const byUnit = {};
  for (let i = 1; i <= 6; i++) byUnit[i] = [];
  assignments.forEach(a => { if (byUnit[a.unit_no]) byUnit[a.unit_no].push(a); });

  const subjects = [...new Map(data.map(a => [a.subject_code, { code: a.subject_code, name: a.subject_name }])).values()];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-black text-niist-navy">My Assignments</h1>
        <p className="text-gray-500 font-medium">Track your submissions and deadlines</p>
      </div>

      {/* Upcoming Widget */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2"><Timer className="w-5 h-5 text-red-500" /> Upcoming Deadlines</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {upcoming.slice(0, 3).map(u => (
              <div key={u.ca_id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveDetail(u)}>
                <p className="font-black text-gray-900 text-sm leading-tight mb-1">{u.title}</p>
                <p className="text-xs text-gray-500 mb-2">📚 {u.subject_name}</p>
                <Countdown deadline={u.deadline} />
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : subjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border shadow-sm">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-1">No Assignments Yet</h3>
          <p className="text-gray-500">Your faculty haven't posted any assignments.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subject Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {subjects.map(s => (
              <button key={s.code} onClick={() => setActiveSubject(s.code)}
                className={`whitespace-nowrap pb-4 px-6 font-bold border-b-2 transition-colors ${activeSubject === s.code ? 'border-niist-navy text-niist-navy' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {s.name}
              </button>
            ))}
          </div>

          {/* By Unit */}
          {[1,2,3,4,5,6].map(unit => {
            const unitA = byUnit[unit] || [];
            if (unitA.length === 0) return null;
            return (
              <div key={unit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
                  <span className="bg-niist-blue text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black">U{unit}</span>
                  <h3 className="font-black text-lg text-gray-800">Unit {unit}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {unitA.map(a => {
                    const badge = STATUS_BADGES[a.status] || STATUS_BADGES.pending;
                    return (
                      <div key={a.ca_id} className="p-5 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setActiveDetail(a)}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-black text-gray-900">{a.title}</h4>
                            <p className="text-sm text-gray-500 font-medium">By {a.faculty_name}</p>
                            <Countdown deadline={a.deadline} />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          </div>
                        </div>
                        {a.status === 'rejected' && a.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-xs font-bold text-red-700">❌ Rejection Reason: {a.rejection_reason}</p>
                            <p className="text-xs text-red-500 font-medium mt-0.5">Please resubmit to your faculty.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {activeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-gray-400 font-bold uppercase tracking-widest">{activeDetail.subject_code} · Unit {activeDetail.unit_no}</span>
                <h3 className="text-xl font-black text-gray-900 mt-1">{activeDetail.title}</h3>
                <p className="text-sm text-gray-500 font-medium">By {activeDetail.faculty_name} · {new Date(activeDetail.deadline).toLocaleString()}</p>
              </div>
              <button onClick={() => setActiveDetail(null)} className="text-gray-400 hover:text-red-500 shrink-0 ml-4"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-5">
              {activeDetail.description && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Assignment Questions</h4>
                  <div className="bg-gray-50 rounded-xl p-5 font-mono text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                    {activeDetail.description}
                  </div>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="font-bold text-blue-900 mb-1">📋 Submission Instructions</p>
                <p className="text-blue-700 text-sm font-medium">Submit your answers physically to <strong>{activeDetail.faculty_name}</strong> before the deadline. Once submitted, the faculty will mark it in the system.</p>
              </div>
              {activeDetail.status === 'rejected' && activeDetail.rejection_reason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                  <p className="font-bold text-red-800 mb-1">❌ Your Submission Was Rejected</p>
                  <p className="text-red-600 text-sm font-medium">Reason: {activeDetail.rejection_reason}</p>
                  <p className="text-red-500 text-sm mt-1 font-medium">Please resubmit to your faculty.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
