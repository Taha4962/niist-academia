import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, Loader2, Plus, Edit2, Trash2, 
  Send, AlertCircle, X, MapPin, CheckCircle2
} from 'lucide-react';

const Timetable = () => {
  const [slots, setSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSession, setSelectedSession] = useState('1'); 
  const [selectedSemester, setSelectedSemester] = useState('1');

  const [modal, setModal] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({ sa_id: '', room_no: '', slot_id: null, day: '' });
  
  const sessions = [
    { id: '4', name: '2022-2026' },
    { id: '3', name: '2023-2027' },
    { id: '2', name: '2024-2028' },
    { id: '1', name: '2025-2029' },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [slotsRes, assignRes, timeRes] = await Promise.all([
        api.get('/timetable/slots'),
        api.get(`/hod/subject-assignments?session_id=${selectedSession}&semester=${selectedSemester}`),
        api.get(`/timetable/${selectedSession}/${selectedSemester}`)
      ]);
      
      setSlots(slotsRes.data);
      setAssignments(assignRes.data);
      setTimetable(timeRes.data);
    } catch (err) {
      setError('Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSession, selectedSemester]);

  const openAddModal = (slot, day) => {
    setConflictError(null);
    setFormData({ sa_id: '', room_no: '', slot_id: slot.slot_id, day });
    setModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setConflictError(null);
    
    try {
      await api.post('/timetable', {
        ...formData,
        session_id: selectedSession,
        semester: selectedSemester
      });
      setModal(false);
      fetchData();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.conflict) {
        setConflictError(err.response.data.conflict);
      } else {
        alert(err.response?.data?.message || 'Failed to add class');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Remove this class?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to remove class');
    }
  };

  const publishTimetable = async () => {
    if(!window.confirm(`Publish timetable for Semester ${selectedSemester}? Notifications will be sent to faculty and students.`)) return;
    
    try {
      setLoading(true);
      await api.post('/timetable/publish', { session_id: selectedSession, semester: selectedSemester });
      fetchData(); // refresh to update UI badges
    } catch (err) {
      alert('Failed to publish timetable');
      setLoading(false);
    }
  };

  const getEntry = (slot_id, day) => {
    return timetable.find(t => t.slot_id === slot_id && t.day === day);
  };

  const isPublished = timetable.length > 0 && timetable[0].is_published;

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  // derived selected subject for auto-populating faculty name in modal
  const selectedAssignment = assignments.find(a => a.sa_id === parseInt(formData.sa_id));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-niist-navy flex items-center gap-2">
            <Calendar className="w-5 h-5"/> Timetable Editor
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold text-gray-500">Status:</span>
            {timetable.length === 0 ? (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Empty</span>
            ) : isPublished ? (
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Published</span>
            ) : (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">Draft</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue font-medium bg-gray-50">
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue font-medium bg-gray-50">
            {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
          </select>
          <button 
            onClick={publishTimetable}
            disabled={timetable.length === 0 || isPublished}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:hover:bg-green-600"
          >
            <Send className="w-4 h-4" /> {isPublished ? 'Published' : 'Publish Timetable'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>
      ) : loading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-niist-blue mb-4" />
          <p className="text-gray-500 font-medium">Loading timetable...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border-collapse table-fixed w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-32 px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Time / Day</th>
                  {days.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-40">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slots.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500">No time slots defined. Please configure them in Time Slots mapping.</td></tr>
                ) : (
                  slots.map(slot => (
                    <tr key={slot.slot_id}>
                      <td className="px-3 py-4 border-r border-gray-200 bg-gray-50 text-center">
                        <div className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1">{slot.label}</div>
                        <div className="text-[11px] font-mono text-gray-500 leading-tight">
                          {formatTime(slot.start_time)}<br/>to<br/>{formatTime(slot.end_time)}
                        </div>
                      </td>
                      {days.map(day => {
                        const entry = getEntry(slot.slot_id, day);
                        return (
                          <td key={day} className="p-2 border border-gray-100 h-28 align-top relative group">
                            {entry ? (
                              <div className="h-full bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-col relative transition-all group-hover:shadow-md">
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded shadow-sm">
                                  {/* <button className="text-amber-600 hover:text-amber-800 p-0.5"><Edit2 className="w-3.5 h-3.5"/></button> */}
                                  <button onClick={() => handleDelete(entry.timetable_id)} className="text-red-500 hover:text-red-700 p-0.5"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                                <div className="font-bold text-niist-navy text-sm leading-tight truncate" title={entry.subject_name}>{entry.subject_name}</div>
                                <div className="text-[10px] font-mono font-semibold text-gray-500 mt-0.5 uppercase">{entry.subject_code}</div>
                                <div className="mt-auto pt-2 text-xs font-medium text-gray-700 truncate">{entry.faculty_name}</div>
                                <div className="text-xs text-niist-blue font-semibold flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3"/> {entry.room_no}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openAddModal(slot, day)} className="flex items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-niist-blue hover:border-niist-blue hover:bg-blue-50 transition-colors">
                                  <Plus className="w-6 h-6" />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD CLASS MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-niist-navy p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Schedule Class</h3>
              <button onClick={() => setModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Conflict Error UI */}
              {conflictError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4 shadow-sm animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                    <AlertCircle className="w-5 h-5" /> Scheduling Conflict
                  </div>
                  <p className="text-sm text-red-600 leading-snug">
                    <strong className="text-red-800">{conflictError.faculty_name}</strong> already has a class at this time:
                  </p>
                  <ul className="text-xs text-red-700 mt-2 space-y-1 bg-red-100/50 p-2 rounded list-disc pl-4 font-medium">
                    <li>Subject: {conflictError.subject_name}</li>
                    <li>Session: {conflictError.session_name}</li>
                    <li>Time: {conflictError.day} at {formatTime(conflictError.time)}</li>
                  </ul>
                  <p className="text-xs text-red-500 mt-2 italic">Please choose a different time or different faculty.</p>
                </div>
              )}

              <div className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-bold text-gray-700">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-niist-blue"/> {formData.day}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-niist-blue"/> {formatTime(slots.find(s=>s.slot_id === formData.slot_id)?.start_time || '00:00')}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject (Assigned in Sem {selectedSemester})</label>
                {assignments.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">No subjects assigned for this session & semester yet.</div>
                ) : (
                  <select required value={formData.sa_id} onChange={e => setFormData({...formData, sa_id: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue text-sm">
                    <option value="" disabled>Select a subject...</option>
                    {assignments.map(a => (
                      <option key={a.sa_id} value={a.sa_id}>{a.subject_name} ({a.subject_code})</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedAssignment && (
                <div className="bg-blue-50/50 p-3 rounded border border-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-niist-blue border border-blue-100 shadow-sm shrink-0">
                    {selectedAssignment.faculty_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Faculty</p>
                    <p className="text-sm font-bold text-niist-navy leading-none">{selectedAssignment.faculty_name}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Room Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><MapPin className="w-4 h-4"/></div>
                  <input required value={formData.room_no} onChange={e => setFormData({...formData, room_no: e.target.value})} placeholder="e.g. CSE-101" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue uppercase" />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
                <button type="submit" disabled={formLoading || assignments.length === 0} className="w-full px-4 py-3 text-sm font-bold text-white bg-niist-navy hover:bg-blue-900 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Timetable;
