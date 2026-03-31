import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, AlertTriangle, Loader2, TrendingDown } from 'lucide-react';

const AttendanceOverview = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/attendance/hod/overview');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-niist-navy">Attendance Overview</h1>
          <p className="text-gray-500 font-medium">Department-wide session attendance metrics</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
      ) : data.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-xl border border-gray-100 shadow-sm">
           <p className="text-gray-500 font-bold">No attendance data collected yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(session => {
             const avg = parseFloat(session.avg_attendance) || 0;
             const isCritical = avg < 70;
             
             return (
               <div key={session.session_id} className={`bg-white rounded-2xl shadow-sm border ${isCritical ? 'border-red-200' : 'border-gray-100'} overflow-hidden`}>
                 <div className={`p-5 ${isCritical ? 'bg-red-50' : 'bg-gray-50'} border-b ${isCritical ? 'border-red-100' : 'border-gray-100'}`}>
                   <h3 className="text-lg font-black text-gray-900 group-hover:text-niist-blue transition-colors mb-1">
                     {session.session_name}
                   </h3>
                   <div className="flex items-center gap-1.5 text-gray-500 font-bold text-sm">
                     <Users className="w-4 h-4"/> {session.total_students} Students Assigned
                   </div>
                 </div>
                 
                 <div className="p-6">
                   <div className="mb-6 text-center">
                     <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Average Attendance</p>
                     <div className={`text-5xl font-black ${avg >= 75 ? 'text-green-500' : avg >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                       {avg}%
                     </div>
                   </div>

                   <div className="space-y-3">
                     <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg text-red-900 border border-red-100">
                       <span className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4 text-red-500"/> Below 75%</span>
                       <span className="font-black text-lg">{session.below_75_count}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg text-red-900 border border-red-200 shadow-sm">
                       <span className="flex items-center gap-2 font-bold"><TrendingDown className="w-4 h-4 text-red-600"/> Critical (&lt;60%)</span>
                       <span className="font-black text-lg">{session.critical_count}</span>
                     </div>
                   </div>
                 </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceOverview;
