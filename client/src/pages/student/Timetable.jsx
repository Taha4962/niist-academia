import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Timetable = () => {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Typical college days mapping
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tableRes, slotsRes] = await Promise.all([
        api.get('/timetable/student/mine').catch(() => ({ data: [] })),
        api.get('/timetable/slots').catch(() => ({ data: [] }))
      ]);
      
      setTimetableData(tableRes.data || []);
      
      // Setup time slots either from DB or basic defaults
      if (slotsRes.data && slotsRes.data.length > 0) {
        setTimeSlots(slotsRes.data.sort((a,b) => a.start_time.localeCompare(b.start_time)));
      } else {
        setTimeSlots([
          { slot_id: 1, label: '9:00 - 10:00' },
          { slot_id: 2, label: '10:00 - 11:00' },
          { slot_id: 3, label: '11:15 - 12:15' },
          { slot_id: 4, label: '12:15 - 1:15' },
          { slot_id: 5, label: '2:00 - 3:00' },
          { slot_id: 6, label: '3:00 - 4:00' },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  // Color mapping logic for subjects
  const colors = [
    'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
    'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
    'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
    'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300',
    'bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300',
    'bg-cyan-100 border-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300',
  ];
  
  const getSubjectColor = (subjectName) => {
    if (!subjectName) return '';
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
        hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getCellData = (day, slot_id) => {
    return timetableData.find(t => t.day === day && t.slot_id === slot_id);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-6 space-y-4">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800"></div>
      </div>
    );
  }

  // Handle completely empty/unpublished timetable gracefully
  if (timetableData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <h1 className="text-2xl font-bold dark:text-white mb-6">My Timetable</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Timetable Not Published Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Your department has not published the routine for this semester yet. Check back later or contact your HOD.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 overflow-x-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Weekly Timetable</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-[800px]">
        <table className="w-full text-center table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="w-24 p-4 border-r dark:border-gray-700 text-gray-500 font-medium">Time / Day</th>
              {days.map(day => (
                <th 
                  key={day} 
                  className={`p-4 font-semibold border-r last:border-0 dark:border-gray-700 ${day === todayStr ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, index) => (
              <tr key={index} className="border-b dark:border-gray-700 last:border-0">
                <td className="p-3 border-r dark:border-gray-700 font-medium text-sm text-gray-500 bg-gray-50/50 dark:bg-gray-900/50">
                  {slot.label}
                </td>
                
                {days.map(day => {
                  const entry = getCellData(day, slot.slot_id);
                  const isToday = day === todayStr;
                  
                  if (!entry) {
                    return (
                      <td key={`${day}-${slot.slot_id}`} className={`p-2 border-r dark:border-gray-700 last:border-0 ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <div className="h-full min-h-[80px] rounded border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-center">
                          <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={`${day}-${slot.slot_id}`} className={`p-2 border-r dark:border-gray-700 last:border-0 align-top ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                      <div 
                        className={`group relative h-full min-h-[80px] rounded-lg border p-3 flex flex-col justify-center transition-all hover:scale-[1.02] hover:shadow-md cursor-help ${getSubjectColor(entry.subject_name)}`}
                        title={`${entry.subject_name} • ${entry.faculty_name} • Room ${entry.room_no}`}
                      >
                        <div className="font-bold text-sm leading-tight mb-1 line-clamp-2">{entry.subject_name}</div>
                        <div className="text-xs opacity-90 mt-auto font-medium">{entry.faculty_name}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">Room {entry.room_no || 'TBA'}</div>
                        
                        {/* Hover Popup Detail (Css only tooltip approx) */}
                        <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 text-white p-3 rounded shadow-lg text-xs w-48 z-10 -bottom-2 translate-y-full left-1/2 -translate-x-1/2">
                          <div className="font-bold mb-1">{entry.subject_name} ({entry.subject_code})</div>
                          <div>Prof. {entry.faculty_name}</div>
                          <div>Room: {entry.room_no}</div>
                          <div className="mt-1 pt-1 border-t border-gray-700 text-gray-300">{slot.label}</div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timetable;
