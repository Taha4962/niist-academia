import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AttendanceSummaryCard from '../../components/common/AttendanceSummaryCard';
import AttendanceCalendar from '../../components/common/AttendanceCalendar';
import { CheckSquare, AlertTriangle, Loader2, Calendar } from 'lucide-react';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubjectId, setActiveSubjectId] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/attendance/summary/${user.student_id}`);
        setSummary(res.data);
        if (res.data.length > 0) setActiveSubjectId(res.data[0].subject_id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.student_id) fetchSummary();
  }, [user]);

  // Calculations
  const totalClasses = summary.reduce((acc, curr) => acc + parseInt(curr.total_classes), 0);
  const totalPresent = summary.reduce((acc, curr) => acc + parseInt(curr.present_count) + parseInt(curr.late_count), 0);
  const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalPresent / totalClasses) * 100);
  
  const overallColor = overallPercentage >= 75 ? 'text-green-600' : overallPercentage >= 65 ? 'text-amber-500' : 'text-red-600';
  const overallBg = overallPercentage >= 75 ? 'bg-green-50' : overallPercentage >= 65 ? 'bg-amber-50' : 'bg-red-50';
  
  const lowAttendanceSubjects = summary.filter(s => parseFloat(s.percentage) < 75 && parseInt(s.total_classes) > 0);

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Overall Card */}
        <div className={`w-full md:w-1/3 rounded-2xl shadow-sm border p-6 flex flex-col items-center justify-center text-center ${overallBg} ${overallPercentage >= 75 ? 'border-green-100' : 'border-red-100'}`}>
           <CheckSquare className={`w-10 h-10 mb-2 ${overallColor}`} />
           <p className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-1">Overall Attendance</p>
           <h2 className={`text-5xl font-black ${overallColor}`}>{overallPercentage}%</h2>
           <p className="text-sm font-semibold mt-2 text-gray-600">
             {totalPresent} / {totalClasses} Classes Attended
           </p>
        </div>

        {/* Alerts / Info Card */}
        <div className="w-full md:w-2/3 flex flex-col justify-center space-y-3">
          {loading ? (
             <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-niist-blue mx-auto"/></div>
          ) : lowAttendanceSubjects.length === 0 ? (
             <div className="bg-white border text-center border-green-200 rounded-xl p-6 h-full flex flex-col items-center justify-center shadow-sm">
               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-3"><CheckSquare className="w-6 h-6"/></div>
               <h3 className="font-bold text-green-800 text-lg">Great Job!</h3>
               <p className="text-green-600 font-medium">Your attendance is above 75% in all active subjects.</p>
             </div>
          ) : (
             lowAttendanceSubjects.map(sub => {
               const needed = Math.ceil((3 * parseInt(sub.absent_count) - parseInt(sub.present_count)));
               return (
                 <div key={sub.subject_id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 items-center shadow-sm relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                   <div className="p-3 bg-white rounded-full text-red-500 shrink-0"><AlertTriangle className="w-6 h-6"/></div>
                   <div>
                     <h4 className="font-bold text-red-900 leading-tight block">Warning: {sub.subject_name}</h4>
                     <p className="text-sm text-red-700 font-medium mt-0.5">
                       Currently at <strong>{sub.percentage}%</strong>. You must attend the next <strong>{needed > 0 ? needed : 1}</strong> classes to bypass the 75% limit.
                     </p>
                   </div>
                 </div>
               )
             })
          )}
        </div>
      </div>

      <div className="h-px bg-gray-200 w-full my-8"></div>

      {loading ? null : summary.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold text-lg">No Attendance Data Found</p>
          <p className="text-sm text-gray-400">Your faculty has not marked attendance for any class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {summary.map(sub => (
            <AttendanceSummaryCard 
               key={sub.subject_id}
               subject_name={sub.subject_name}
               subject_code={sub.subject_code}
               total={sub.total_classes}
               present={sub.present_count}
               absent={sub.absent_count}
               late={sub.late_count}
               percentage={sub.percentage}
               onClick={() => setActiveSubjectId(sub.subject_id)}
            />
          ))}
        </div>
      )}

      {/* Detail Calendar View */}
      {activeSubjectId && (
        <div className="mt-8">
           <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-4">
             {summary.map(sub => (
               <button 
                 key={sub.subject_id}
                 onClick={() => setActiveSubjectId(sub.subject_id)}
                 className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors shadow-sm ${
                   activeSubjectId === sub.subject_id 
                   ? 'bg-niist-navy text-white' 
                   : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                 }`}
               >
                 {sub.subject_code} Timeline
               </button>
             ))}
           </div>
           
           <AttendanceCalendar 
              subject_id={activeSubjectId}
              student_id={user.student_id}
              subject_name={summary.find(s => s.subject_id === activeSubjectId)?.subject_name}
           />
        </div>
      )}

    </div>
  );
};

export default StudentAttendance;
