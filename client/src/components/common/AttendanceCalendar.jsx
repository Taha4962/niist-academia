import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';

const AttendanceCalendar = ({ student_id, subject_id, subject_name, onMonthChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState({ attendance: [], holidays: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!student_id || !subject_id) return;
      try {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        if (onMonthChange) onMonthChange(month, year);
        
        const res = await api.get(`/attendance/calendar/${student_id}/${subject_id}/${month}/${year}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentDate, student_id, subject_id]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getStatusForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const holiday = data.holidays.find(h => h.date.startsWith(dateStr));
    if (holiday) return { type: 'holiday', title: holiday.title };
    
    const att = data.attendance.find(a => a.date.startsWith(dateStr));
    if (att) return { type: att.status };
    
    // Future date
    const reqDate = new Date(dateStr);
    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);
    if (reqDate > todayObj) return { type: 'future' };

    return null; // Empty (no class happened)
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-niist-navy hidden sm:block truncate max-w-[200px]">{subject_name || 'Calendar'}</h3>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black text-gray-800 tracking-wide w-32 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <div className="p-4 sm:p-6 pb-2">
          
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-lg bg-gray-50/50"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getStatusForDay(day);
              
              let bgColor = 'bg-gray-50 hover:bg-gray-100 border-gray-100'; // No class
              let textColor = 'text-gray-600';
              let badge = null;

              if (status) {
                if (status.type === 'present') {
                  bgColor = 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer';
                  textColor = 'text-green-700 font-bold';
                  badge = <div className="w-2 h-2 rounded-full bg-green-500 mx-auto mt-1"></div>;
                } else if (status.type === 'absent') {
                  bgColor = 'bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer';
                  textColor = 'text-red-700 font-bold';
                  badge = <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-1"></div>;
                } else if (status.type === 'late') {
                  bgColor = 'bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer';
                  textColor = 'text-amber-700 font-bold';
                  badge = <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mt-1"></div>;
                } else if (status.type === 'holiday') {
                  bgColor = 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer';
                  textColor = 'text-blue-700 font-bold';
                  badge = <div className="text-[8px] sm:text-[10px] text-blue-500 mx-auto mt-0.5 uppercase tracking-tighter truncate px-1">HOL</div>;
                } else if (status.type === 'future') {
                  bgColor = 'bg-white opacity-50';
                  textColor = 'text-gray-300';
                }
              }

              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={day} 
                  onClick={() => status && status.type !== 'future' ? setSelectedDay({ day, status }) : null}
                  className={`relative aspect-square rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all ${bgColor} ${isToday ? 'ring-2 ring-niist-blue ring-offset-1' : ''}`}
                >
                  <span className={`text-sm sm:text-base ${textColor}`}>{day}</span>
                  {badge}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-xs font-semibold text-gray-500 border-t border-gray-100 pt-4">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /> Present</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Absent</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /> Late</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-200" /> Holiday</span>
          </div>

        </div>
      )}

      {/* Detail Popup */}
      {selectedDay && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-in zoom-in-95 relative">
             <button onClick={() => setSelectedDay(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl leading-none">&times;</button>
             
             <h4 className="font-bold text-gray-900 text-lg mb-4">
               {selectedDay.day} {currentDate.toLocaleString('default', { month: 'short' })} {currentDate.getFullYear()}
             </h4>
             
             {selectedDay.status.type === 'holiday' ? (
               <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                 <span className="text-3xl mb-2 block">🎉</span>
                 <p className="font-bold text-blue-900">{selectedDay.status.title}</p>
                 <p className="text-sm text-blue-600 mt-1">Official Holiday</p>
               </div>
             ) : (
               <div className={`p-4 rounded-xl text-center border ${
                 selectedDay.status.type === 'present' ? 'bg-green-50 border-green-200 text-green-800' :
                 selectedDay.status.type === 'absent' ? 'bg-red-50 border-red-200 text-red-800' :
                 'bg-amber-50 border-amber-200 text-amber-800'
               }`}>
                 <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Status Recorded</p>
                 <p className="text-2xl font-black capitalize">{selectedDay.status.type}</p>
                 <p className="text-sm font-semibold mt-2 opacity-90">{subject_name}</p>
               </div>
             )}
           </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceCalendar;
