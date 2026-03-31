import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar as CalendarIcon, Plus, Trash2, Loader2, 
  MapPin, Clock, Flag, AlertCircle, Sun
} from 'lucide-react';

const AcademicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSession, setSelectedSession] = useState('all');
  const [modal, setModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    event_type: 'event',
    session_id: ''
  });

  const sessions = [
    { id: '4', name: '2022-2026' },
    { id: '3', name: '2023-2027' },
    { id: '2', name: '2024-2028' },
    { id: '1', name: '2025-2029' },
  ];

  const eventTypes = [
    { id: 'semester_start', label: 'Semester Start', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'semester_end', label: 'Semester End', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'mst_1', label: 'Mid-Sem Test 1', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'mst_2', label: 'Mid-Sem Test 2', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'holiday_standalone', label: 'Holiday', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'event', label: 'Campus Event', color: 'bg-blue-100 text-blue-700 border-blue-200' }
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/calendar/events?session_id=${selectedSession}`);
      setEvents(res.data);
    } catch (err) {
      setError('Failed to load academic calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/calendar/events', formData);
      setModal(false);
      setFormData({ title: '', start_date: '', end_date: '', event_type: 'event', session_id: '' });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, source) => {
    if(!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/calendar/events/${source}/${id}`);
      fetchEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const getTypeStyle = (type, isHolidayMode) => {
    if (isHolidayMode) return eventTypes.find(t => t.id === 'holiday_standalone')?.color;
    const found = eventTypes.find(t => t.id === type);
    return found ? found.color : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getLabel = (type, isHolidayMode) => {
    if (isHolidayMode) return 'Holiday';
    const found = eventTypes.find(t => t.id === type);
    return found ? found.label : 'Event';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysDiff = (start, end) => {
    if (!end || start === end) return 1;
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
      
      {/* LEFT: CALENDAR FEED */}
      <div className="flex-1 space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-niist-navy flex items-center gap-2">
              <CalendarIcon className="w-5 h-5"/> Academic Calendar
            </h2>
            <p className="text-sm text-gray-500 mt-1">Timeline of all academic activities and holidays</p>
          </div>
          
          <div className="flex gap-3">
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue font-medium bg-gray-50">
              <option value="all">Company/Global Wide</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto mb-4" /></div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No events found for this view.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-blue-100 ml-3 pl-6 space-y-8">
              {events.map((ev, i) => {
                const isHol = ev.source === 'holiday';
                const style = getTypeStyle(ev.type, isHol);
                const label = getLabel(ev.type, isHol);
                const days = getDaysDiff(ev.start_date, ev.end_date);
                
                return (
                  <div key={`${ev.source}-${ev.id}`} className="relative group">
                    <span className="absolute -left-8 w-4 h-4 rounded-full bg-white border-4 border-niist-blue top-1 ring-4 ring-white"></span>
                    
                    <div className="bg-gray-50 border border-gray-100 hover:border-blue-200 rounded-xl p-4 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style}`}>
                            {label}
                          </span>
                          {days > 1 && <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded flex items-center gap-1"><Clock className="w-3 h-3"/> {days} Days</span>}
                        </div>
                        <button onClick={() => handleDelete(ev.id, ev.source)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{ev.title}</h3>
                      <div className="text-sm font-semibold text-niist-navy/70 flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(ev.start_date)} {ev.end_date && ev.end_date !== ev.start_date ? ` - ${formatDate(ev.end_date)}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: QUICK ADD & WIDGET */}
      <div className="w-full lg:w-80 space-y-4 shrink-0">
        <button onClick={() => setModal(true)} className="w-full flex items-center justify-center gap-2 bg-niist-navy hover:bg-blue-900 text-white p-4 rounded-xl font-bold shadow-sm transition-colors text-lg">
          <Plus className="w-5 h-5"/> Add Event / Holiday
        </button>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
           <Sun className="absolute -right-4 -top-4 w-24 h-24 text-amber-500/10" />
           <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3"><Flag className="w-5 h-5"/> Upcoming Holiday</h3>
           {events.filter(e => e.source === 'holiday' && new Date(e.start_date) >= new Date()).length > 0 ? (
             <div>
               <p className="font-black text-2xl text-amber-600 leading-tight mb-1">
                 {events.filter(e => e.source === 'holiday' && new Date(e.start_date) >= new Date())[0].title}
               </p>
               <p className="text-amber-800 font-medium">
                 {formatDate(events.filter(e => e.source === 'holiday' && new Date(e.start_date) >= new Date())[0].start_date)}
               </p>
             </div>
           ) : (
             <p className="text-sm text-amber-700 font-medium">No upcoming holidays scheduled.</p>
           )}
        </div>
      </div>

      {/* ADD MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-niist-navy">Add Event / Holiday</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-gray-50/50">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title <span className="text-red-500">*</span></label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Diwali Break, MST 1..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue bg-white" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type <span className="text-red-500">*</span></label>
                <select required value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue bg-white font-medium">
                  {eventTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue bg-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date (Optional)</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} min={formData.start_date} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue bg-white text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Session</label>
                <select value={formData.session_id} onChange={e => setFormData({...formData, session_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue bg-white">
                  <option value="">Global (Applies to all)</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">If blank, this event/holiday applies across the entire college.</p>
              </div>

              <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg mr-2">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2 text-sm font-bold text-white bg-niist-navy hover:bg-blue-900 rounded-lg flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademicCalendar;
