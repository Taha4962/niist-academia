import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const NoticeBoard = () => {
  const [notices, setNotices] = useState({ pinned: [], recent: [] });
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', content: '', target_type: 'department',
    session_id: '', subject_id: '', is_pinned: false, expires_at: ''
  });

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices({
        pinned: res.data.pinned || [],
        recent: res.data.recent || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const sesRes = await api.get('/sessions');
      setSessions(sesRes.data);
      const subRes = await api.get('/subjects');
      setSubjects(subRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.is_pinned && notices.pinned.length >= 3 && !editingId) {
      alert('Maximum 3 pinned notices allowed.');
      return;
    }
    
    try {
      if (editingId) {
        await api.put(`/notices/${editingId}`, formData);
      } else {
        await api.post('/notices', formData);
      }
      setShowModal(false);
      setFormData({
        title: '', content: '', target_type: 'department',
        session_id: '', subject_id: '', is_pinned: false, expires_at: ''
      });
      setEditingId(null);
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notice?')) {
      try {
        await api.delete(`/notices/${id}`);
        fetchNotices();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openEdit = (notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      target_type: notice.target_type,
      session_id: notice.session_id || '',
      subject_id: notice.subject_id || '',
      is_pinned: notice.is_pinned,
      expires_at: notice.expires_at ? notice.expires_at.split('T')[0] : ''
    });
    setEditingId(notice.notice_id);
    setShowModal(true);
  };

  const NoticeCard = ({ notice }) => (
    <div className={`p-5 rounded-lg border ${notice.is_pinned ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'} shadow-sm relative`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg dark:text-gray-100 flex items-center gap-2">
          {notice.is_pinned && <span className="text-orange-500">📌</span>}
          {notice.title}
          {notice.is_auto && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">Auto</span>}
        </h3>
        <div className="flex gap-2 text-sm">
          <button onClick={() => openEdit(notice)} className="text-blue-600 hover:text-blue-800">Edit</button>
          <button onClick={() => handleDelete(notice.notice_id)} className="text-red-600 hover:text-red-800">Delete</button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-4">{notice.content}</p>
      
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span>Target: <span className="capitalize">{notice.target_type}</span></span>
        <span>By: {notice.faculty_name || 'HOD'}</span>
        <span>Date: {new Date(notice.created_at).toLocaleDateString()}</span>
        {notice.read_count !== undefined && (
          <span className="font-medium text-green-600 dark:text-green-400">Reads: {notice.read_count}</span>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading notices...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Notice Board</h1>
        <button onClick={() => { setEditingId(null); setShowModal(true); }} className="bg-niist-navy text-white px-4 py-2 rounded shadow hover:bg-niist-navy/90">
          + Post Notice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-200 border-b pb-2">📌 Pinned Notices ({notices.pinned.length}/3)</h2>
          <div className="space-y-4">
            {notices.pinned.length === 0 ? <p className="text-gray-500">No pinned notices.</p> : notices.pinned.map(n => <NoticeCard key={n.notice_id} notice={n} />)}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-200 border-b pb-2">🕒 Recent Notices</h2>
          <div className="space-y-4">
            {notices.recent.length === 0 ? <p className="text-gray-500">No recent notices.</p> : notices.recent.map(n => <NoticeCard key={n.notice_id} notice={n} />)}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editingId ? 'Edit Notice' : 'Post Notice'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Title</label>
                <input required type="text" className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Content</label>
                <textarea required rows="4" className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Target</label>
                <select className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.target_type} onChange={e => setFormData({...formData, target_type: e.target.value})}>
                  <option value="department">Department</option>
                  <option value="session">Session</option>
                  <option value="subject">Subject</option>
                </select>
              </div>

              {formData.target_type === 'session' && (
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Select Session</label>
                  <select required className="w-full border rounded p-2 dark:bg-gray-700" value={formData.session_id} onChange={e => setFormData({...formData, session_id: e.target.value})}>
                    <option value="">-- Choose --</option>
                    {sessions.map(s => <option key={s.session_id} value={s.session_id}>{s.session_name}</option>)}
                  </select>
                </div>
              )}

              {formData.target_type === 'subject' && (
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Select Subject</label>
                  <select required className="w-full border rounded p-2 dark:bg-gray-700" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}>
                    <option value="">-- Choose --</option>
                    {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="pin" checked={formData.is_pinned} onChange={e => setFormData({...formData, is_pinned: e.target.checked})} />
                <label htmlFor="pin" className="text-sm font-medium dark:text-gray-300">Pin Notice (Max 3)</label>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300">Expiry Date (Optional)</label>
                <input type="date" className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
