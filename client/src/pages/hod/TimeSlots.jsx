import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Clock, Plus, Edit2, Trash2, Loader2, AlertCircle 
} from 'lucide-react';

const TimeSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modal, setModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ start_time: '', end_time: '', label: '' });

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetable/slots');
      setSlots(res.data);
    } catch (err) {
      setError('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setFormData({ start_time: '09:00', end_time: '10:00', label: 'Lecture' });
    setFormError('');
    setModal(true);
  };

  const openEdit = (slot) => {
    setEditId(slot.slot_id);
    setFormData({
      start_time: slot.start_time.substring(0,5),
      end_time: slot.end_time.substring(0,5),
      label: slot.label
    });
    setFormError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.start_time >= formData.end_time) {
      return setFormError('End time must be after start time');
    }
    setFormLoading(true);
    setFormError('');
    
    try {
      if (editId) {
        await api.put(`/timetable/slots/${editId}`, formData);
      } else {
        await api.post('/timetable/slots', formData);
      }
      setModal(false);
      fetchSlots();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save time slot');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this time slot?')) return;
    try {
      await api.delete(`/timetable/slots/${id}`);
      fetchSlots();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete slot. It may be in use.');
    }
  };

  // Helper to format 24h to 12h for display
  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-niist-navy flex items-center gap-2"><Clock className="w-5 h-5"/> Class Time Slots</h2>
          <p className="text-sm text-gray-500 mt-1">Define the standard daily time periods for class scheduling</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-niist-navy hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Range</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Label</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-niist-blue" />Loading slots...</td></tr>
              ) : slots.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">No time slots configured. Add your first slot above.</td></tr>
              ) : (
                slots.map(slot => (
                  <tr key={slot.slot_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded text-sm">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {slot.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${parseInt(slot.in_use_count) > 0 ? 'bg-blue-50 text-niist-blue border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {slot.in_use_count || 0} classes mapped
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(slot)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button 
                          onClick={() => handleDelete(slot.slot_id)} 
                          disabled={parseInt(slot.in_use_count) > 0}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          title={parseInt(slot.in_use_count) > 0 ? "Cannot delete in-use slots" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-niist-navy">{editId ? 'Edit Time Slot' : 'Add Time Slot'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 py-6 space-y-4">
              {formError && <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-2 rounded flex gap-2 items-start"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{formError}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                  <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                  <input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue font-mono" />
                </div>
              </div>
              
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Label</label>
                 <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Lecture, Lab, Break" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue" />
               </div>

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 text-sm font-semibold text-white bg-niist-navy hover:bg-blue-900 rounded-lg flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TimeSlots;
