import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Pin, Bell, Plus, Loader2, X, Globe, Users, BookOpen, CheckCircle } from 'lucide-react';

const TARGET_ICONS = { department: Globe, session: Users, subject: BookOpen };
const TARGET_LABELS = { department: 'All Department', session: 'Specific Session', subject: 'Specific Subject' };

const FacultyNoticeBoard = () => {
  const [pinned, setPinned] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', target_type: 'department', session_id: '', subject_id: '', is_pinned: false, expires_at: '' });
  const [posting, setPosting] = useState(false);
  const [pinErr, setPinErr] = useState(null);

  useEffect(() => { fetchNotices(); fetchSessions(); fetchSubjects(); }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notices');
      setPinned(res.data.pinned || []);
      setRecent(res.data.recent || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSessions = async () => { try { const r = await api.get('/hod/sessions'); setSessions(r.data); } catch {} };
  const fetchSubjects = async () => { try { const r = await api.get('/faculty/subjects'); setSubjects(r.data); } catch {} };

  const handlePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPinErr(null);
    try {
      await api.post('/notices', form);
      setShowPost(false);
      setForm({ title: '', content: '', target_type: 'department', session_id: '', subject_id: '', is_pinned: false, expires_at: '' });
      fetchNotices();
    } catch (err) {
      if (err.response?.data?.error) setPinErr(err.response.data);
      else alert(err.response?.data?.message || 'Failed');
    }
    finally { setPosting(false); }
  };

  const handlePin = async (notice_id, is_pinned) => {
    try {
      await api.put(`/notices/${notice_id}/pin`, { is_pinned });
      fetchNotices();
    } catch (err) { alert(err.response?.data?.error || 'Pin limit reached'); }
  };

  const handleDelete = async (notice_id) => {
    if (!confirm('Delete this notice?')) return;
    await api.delete(`/notices/${notice_id}`);
    fetchNotices();
  };

  const TargetBadge = ({ t }) => {
    const Icon = TARGET_ICONS[t] || Globe;
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full uppercase tracking-widest"><Icon className="w-2.5 h-2.5" />{TARGET_LABELS[t]}</span>;
  };

  const NoticeCard = ({ n, pinnable = true }) => (
    <div className={`bg-white rounded-xl border shadow-sm p-5 relative ${n.is_pinned ? 'border-amber-200' : 'border-gray-100'}`}>
      {n.is_pinned && <Pin className="absolute top-4 right-4 w-4 h-4 text-amber-500" />}
      {n.is_auto && <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full mr-2 border border-blue-100">AUTO</span>}
      <h3 className="font-black text-gray-900 mb-1">{n.title}</h3>
      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{n.content}</p>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TargetBadge t={n.target_type} />
          <span className="text-xs text-gray-400 font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {n.read_count !== undefined && <span className="text-xs font-bold text-gray-400">{n.read_count} read</span>}
          {pinnable && (
            <button onClick={() => handlePin(n.notice_id, !n.is_pinned)} className="text-xs font-bold px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors">
              {n.is_pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          <button onClick={() => handleDelete(n.notice_id)} className="text-xs font-bold px-2 py-1 rounded border border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-600 transition-colors">Del</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-niist-navy">Notice Board</h1>
          <p className="text-gray-500 font-medium">Broadcast announcements to students</p>
        </div>
        <button onClick={() => setShowPost(true)} className="bg-niist-navy text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-900 transition-colors shadow-md">
          <Plus className="w-5 h-5" /> Post Notice
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <div>
              <h2 className="font-black text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">
                <Pin className="w-4 h-4 text-amber-500" /> Pinned ({pinned.length}/3)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map(n => <NoticeCard key={n.notice_id} n={n} />)}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-black text-gray-700 mb-3 uppercase tracking-widest text-xs">Recent Notices</h2>
            {recent.length === 0 && pinned.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl border border-gray-100 shadow-sm">
                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-400">No notices yet. Post your first one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recent.map(n => <NoticeCard key={n.notice_id} n={n} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Notice Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 flex justify-between items-center p-6 z-10">
              <h3 className="text-xl font-black text-gray-900">Post New Notice</h3>
              <button onClick={() => setShowPost(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePost} className="p-6 space-y-4">
              {pinErr && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <p className="font-bold text-amber-800 text-sm mb-2">Maximum 3 pinned notices. Unpin one:</p>
                  {pinErr.pinned?.map(p => (
                    <div key={p.notice_id} className="flex justify-between items-center text-xs font-medium text-amber-700 py-1">
                      <span>{p.title}</span>
                      <button type="button" onClick={async () => { await api.put(`/notices/${p.notice_id}/pin`, { is_pinned: false }); setPinErr(null); }} className="px-2 py-0.5 bg-amber-100 rounded text-amber-800 font-bold hover:bg-amber-200">Unpin</button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="form-label">Notice Title *</label>
                <input required type="text" className="form-input" placeholder="e.g. MST 2 Exam Schedule" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">Content *</label>
                <textarea required rows={4} className="form-input resize-y" value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">Target Audience *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['department', 'session', 'subject'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({...f, target_type: t}))}
                      className={`py-2 text-xs font-bold rounded-lg border transition-colors capitalize ${form.target_type === t ? 'bg-niist-navy text-white border-niist-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                      {TARGET_LABELS[t]}
                    </button>
                  ))}
                </div>

                {form.target_type === 'session' && (
                  <select className="form-select mt-2" value={form.session_id} onChange={e => setForm(f => ({...f, session_id: e.target.value}))}>
                    <option value="">Select Session</option>
                    {sessions.map(s => <option key={s.session_id} value={s.session_id}>{s.session_name}</option>)}
                  </select>
                )}
                {form.target_type === 'subject' && (
                  <select className="form-select mt-2" value={form.subject_id} onChange={e => setForm(f => ({...f, subject_id: e.target.value}))}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({...f, is_pinned: e.target.checked}))} className="w-4 h-4 rounded" />
                  <span className="font-bold text-gray-700 text-sm">Pin this notice</span>
                </label>
                <div className="flex-1">
                  <label className="form-label text-xs">Expires (optional)</label>
                  <input type="date" className="form-input" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPost(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={posting} className="btn-primary">
                  {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyNoticeBoard;
