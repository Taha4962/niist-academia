import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import AttendanceCalendar from '../../components/common/AttendanceCalendar';
import { 
  Calendar, CheckSquare, Search, Info, Check, X, AlertCircle, 
  Loader2, Save, UserX, Clock, MapPin, Edit3
} from 'lucide-react';

const FacultyAttendance = () => {
  const [searchParams] = useSearchParams();
  const defaultSaId = searchParams.get('sa') || '';

  const [subjects, setSubjects] = useState([]);
  const [selectedSaId, setSelectedSaId] = useState(defaultSaId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: 'present'|'absent'|'late' }
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayMsg, setHolidayMsg] = useState('');
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'calendar'

  // Fetch subjects to populate dropdown
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await api.get('/faculty/subjects');
        setSubjects(res.data);
        if (res.data.length > 0 && !selectedSaId) setSelectedSaId(res.data[0].sa_id.toString());
      } catch (err) { console.error(err); }
    };
    fetchSubs();
  }, []);

  // Fetch students & attendance for selected date/subject
  useEffect(() => {
    if (!selectedSaId || !date) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/attendance/${selectedSaId}/${date}`);
        setIsHoliday(res.data.is_holiday);
        setHolidayMsg(res.data.holiday_name || '');
        setAlreadyMarked(res.data.already_marked);
        setStudents(res.data.students || []);
        
        if (!res.data.is_holiday) {
          const defaultAtt = {};
          res.data.students.forEach(st => {
            defaultAtt[st.student_id] = st.status || 'present';
          });
          setAttendance(defaultAtt);
          setEditMode(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSaId, date]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const newAtt = {};
    students.forEach(st => newAtt[st.student_id] = status);
    setAttendance(newAtt);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const payload = {
        sa_id: selectedSaId,
        date,
        attendance: Object.keys(attendance).map(sid => ({
          student_id: sid,
          status: attendance[sid]
        }))
      };
      
      const res = await api.post('/attendance/mark', payload);
      alert(`Attendance saved. Marked: ${res.data.marked}. Automated Alerts Generated: ${res.data.alerts}`);
      setAlreadyMarked(true);
      setEditMode(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const isToday = date === new Date().toISOString().split('T')[0];
  const activeSubjectData = subjects.find(s => s.sa_id.toString() === selectedSaId);
  const selectedSubjectId = activeSubjectData?.subject_id;

  const counts = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    late: Object.values(attendance).filter(v => v === 'late').length,
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.enrollment_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Top Banner & Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-niist-navy flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-niist-blue" /> Mark Attendance
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Select a subject and date to record attendance</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select 
            value={selectedSaId} 
            onChange={e => setSelectedSaId(e.target.value)}
            className="flex-1 lg:w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-niist-blue transition-all"
          >
            <option value="" disabled>Select Subject</option>
            {subjects.map(s => (
              <option key={s.sa_id} value={s.sa_id}>{s.subject_name} ({s.subject_code})</option>
            ))}
          </select>
          
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            max={new Date().toISOString().split('T')[0]} // Cannot mark future
            className="flex-1 lg:w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-niist-blue transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('mark')} 
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mark' ? 'border-niist-blue text-niist-blue' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Marking Interface
        </button>
        <button 
          onClick={() => setActiveTab('calendar')} 
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-niist-blue text-niist-blue' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Calendar Overview
        </button>
      </div>

      {/* TABS */}
      {activeTab === 'mark' && (
        <div className="space-y-6">
          
          {/* Status Banners */}
          {isHoliday ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-white rounded-full"><Calendar className="w-5 h-5 text-blue-500"/></div>
              <div>
                <strong className="block text-lg">Official Holiday</strong>
                <span>{holidayMsg} — No attendance required today.</span>
              </div>
            </div>
          ) : alreadyMarked && !editMode ? (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full"><Check className="w-5 h-5 text-green-500" strokeWidth={3}/></div>
                <div>
                  <strong className="block text-lg">Attendance Saved</strong>
                  <span className="text-sm font-medium">Record exists for this date.</span>
                </div>
              </div>
              {isToday ? (
                <button onClick={() => setEditMode(true)} className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg font-bold border border-green-200 hover:bg-green-100 transition-colors shadow-sm">
                  <Edit3 className="w-4 h-4"/> Edit Today
                </button>
              ) : (
                <span className="text-sm font-bold px-3 py-1 bg-white rounded text-gray-600 border border-gray-200">Locked (Past Date)</span>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-4 z-20">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                
                <div className="flex items-center gap-2 overflow-hidden">
                  <Search className="w-5 h-5 text-gray-400 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search students by name or ID..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none p-0 w-full md:w-64"
                  />
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-lg border border-gray-200 shrink-0">
                  <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-500 hover:text-white rounded font-bold text-xs uppercase tracking-wider transition-colors">Mark All Present</button>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div className="flex gap-4 text-xs font-bold px-2">
                    <span className="text-green-600">P: {counts.present}</span>
                    <span className="text-red-500">A: {counts.absent}</span>
                    <span className="text-amber-500">L: {counts.late}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Student List */}
          {!isHoliday && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               {loading ? (
                 <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>
               ) : (
                 <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                   {filteredStudents.length === 0 ? (
                     <div className="py-12 text-center text-gray-500">No students found matching your search.</div>
                   ) : (
                     filteredStudents.map((st, i) => {
                       const status = attendance[st.student_id] || 'present';
                       const disabled = alreadyMarked && !editMode;
                       
                       return (
                         <div key={st.student_id} className={`flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors ${disabled ? 'opacity-70' : ''}`}>
                           <div className="flex items-center gap-4">
                             <div className="w-8 text-center text-gray-400 font-bold text-sm">{i + 1}</div>
                             <div className="w-10 h-10 rounded-full bg-blue-100 text-niist-blue flex items-center justify-center font-bold text-sm shrink-0">
                               {st.name.charAt(0)}
                             </div>
                             <div>
                               <p className="font-bold text-gray-900 leading-tight">{st.name}</p>
                               <p className="font-mono text-[11px] text-gray-500 font-bold mt-0.5">{st.enrollment_no}</p>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                             <button
                               disabled={disabled}
                               onClick={() => handleStatusChange(st.student_id, 'present')}
                               className={`px-4 py-2 flex items-center justify-center rounded font-bold transition-all text-sm w-12 ${status === 'present' ? 'bg-green-500 text-white shadow-sm ring-2 ring-green-200 ring-offset-1' : 'text-gray-500 hover:bg-white disabled:hover:bg-transparent'}`}
                             >
                               P
                             </button>
                             <button
                               disabled={disabled}
                               onClick={() => handleStatusChange(st.student_id, 'absent')}
                               className={`px-4 py-2 flex items-center justify-center rounded font-bold transition-all text-sm w-12 ${status === 'absent' ? 'bg-red-500 text-white shadow-sm ring-2 ring-red-200 ring-offset-1' : 'text-gray-500 hover:bg-white disabled:hover:bg-transparent'}`}
                             >
                               A
                             </button>
                             <button
                               disabled={disabled}
                               onClick={() => handleStatusChange(st.student_id, 'late')}
                               className={`px-4 py-2 flex items-center justify-center rounded font-bold transition-all text-sm w-12 ${status === 'late' ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-200 ring-offset-1' : 'text-gray-500 hover:bg-white disabled:hover:bg-transparent'}`}
                             >
                               L
                             </button>
                           </div>
                         </div>
                       )
                     })
                   )}
                 </div>
               )}
               
               {/* Save Action Bar */}
               {(!alreadyMarked || editMode) && students.length > 0 && (
                 <div className="bg-gray-50 border-t border-gray-200 p-5 flex justify-between items-center sticky bottom-0 z-20">
                   <div className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                     <Info className="w-4 h-4"/> Save will record {students.length} entries directly to DB
                   </div>
                   <div className="flex gap-3">
                     {editMode && <button onClick={() => setEditMode(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>}
                     <button 
                       onClick={saveAttendance}
                       disabled={saving}
                       className="flex items-center gap-2 bg-niist-navy text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-900 transition-colors disabled:opacity-70 shadow-md"
                     >
                       {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} 
                       {editMode ? 'Update Attendance' : 'Save Attendance'}
                     </button>
                   </div>
                 </div>
               )}
             </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && activeSubjectData && (
         <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
             <Info className="w-6 h-6 text-niist-blue shrink-0" />
             <p className="font-medium text-gray-700 leading-relaxed text-sm">
               This calendar provides a global view of the attendance schedule for this subject. It merges the college holiday calendar with the days you conducted classes.
             </p>
           </div>
           
           <AttendanceCalendar 
              subject_id={selectedSubjectId} 
              subject_name={`${activeSubjectData.subject_name} (${activeSubjectData.session_name})`}
              student_id={students.length > 0 ? students[0].student_id : null} // faculty sees the pattern, we pass a student dummy ID or we adapt the calendar to not need student_id if faculty just wants to see dates. For now, passing first student gives the marking pattern.
           />
         </div>
      )}
      
    </div>
  );
};

export default FacultyAttendance;
