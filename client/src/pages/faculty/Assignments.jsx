import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  BookOpen, Plus, Loader2, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, AlertCircle, Eye, Pencil, Trash2, X,
  Bot, Users, Timer
} from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  resubmitted: 'bg-purple-100 text-purple-700',
};

const Countdown = ({ deadline }) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('text-gray-400');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setLabel('Expired'); setColor('text-gray-400'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 3) { setLabel(`${d}d ${h}h left`); setColor('text-green-600'); }
      else if (d >= 1) { setLabel(`${d}d ${h}h left`); setColor('text-amber-500'); }
      else { setLabel(`${h}h ${m}m left`); setColor('text-red-600'); }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return <span className={`text-xs font-bold ${color}`}>{label}</span>;
};

const FacultyAssignments = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSaId, setSelectedSaId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(null); // ca_id
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Create Form
  const [form, setForm] = useState({ unit_no: '1', title: '', description: '', deadline: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiCount, setAiCount] = useState(5);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchSubjects(); }, []);
  useEffect(() => { if (selectedSaId) fetchAssignments(selectedSaId); }, [selectedSaId]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSaId(res.data[0].sa_id);
    } catch (err) { console.error(err); }
  };

  const fetchAssignments = async (sa_id) => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments/${sa_id}`);
      setAssignments(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSubmissions = useCallback(async (ca_id) => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/assignments/${ca_id}/submissions`);
      setSubmissions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingSubmissions(false); }
  }, []);

  useEffect(() => {
    if (showSubmissions) fetchSubmissions(showSubmissions);
  }, [showSubmissions, fetchSubmissions]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/assignments', { ...form, sa_id: selectedSaId });
      setShowCreate(false);
      setForm({ unit_no: '1', title: '', description: '', deadline: '' });
      fetchAssignments(selectedSaId);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setCreating(false); }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/assignments/ai-generate', {
        sa_id: selectedSaId, unit_no: form.unit_no, topic: aiTopic, difficulty: aiDifficulty, count: aiCount
      });
      const questions = res.data.questions || [];
      setForm(f => ({ ...f, description: questions.join('\n\n') }));
    } catch (err) { alert('AI generation failed'); }
    finally { setAiLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/assignments/${showDeleteConfirm.ca_id}`);
      setShowDeleteConfirm(null);
      fetchAssignments(selectedSaId);
    } catch (err) { alert(err.response?.data?.message || 'Cannot delete'); }
  };

  const handleSubmissionAction = async (submission_id, action, reason = '') => {
    try {
      await api.put(`/assignments/submissions/${submission_id}`, { action, rejection_reason: reason });
      fetchSubmissions(showSubmissions);
    } catch (err) { alert('Action failed'); }
  };

  // Group by unit
  const byUnit = {};
  for (let i = 1; i <= 6; i++) byUnit[i] = [];
  assignments.forEach(a => byUnit[a.unit_no]?.push(a));

  const currentSub = subjects.find(s => String(s.sa_id) === String(selectedSaId));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-niist-navy">Assignments</h1>
          <p className="text-gray-500 font-medium">Manage unit-wise assignments and submissions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-niist-navy text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-900 transition-colors shadow-md">
          <Plus className="w-5 h-5" /> Create Assignment
        </button>
      </div>

      {/* Subject Selector */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 flex-wrap">
        <label className="font-bold text-gray-700">Subject:</label>
        <select className="form-select max-w-sm font-medium" value={selectedSaId} onChange={e => setSelectedSaId(e.target.value)}>
          {subjects.map(s => <option key={s.sa_id} value={s.sa_id}>{s.subject_name} ({s.session_name})</option>)}
        </select>
        {currentSub && <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{currentSub.subject_code}</span>}
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          {[1,2,3,4,5,6].map(unit => {
            const unitAssignments = byUnit[unit] || [];
            return (
              <div key={unit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                    <span className="bg-niist-blue text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">U{unit}</span>
                    Unit {unit}
                  </h3>
                  <span className="text-xs font-bold text-gray-400">{unitAssignments.length} Assignments</span>
                </div>

                <div className="p-4 sm:p-6">
                  {unitAssignments.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                      <p className="text-gray-400 font-bold mb-3">No assignments for Unit {unit}</p>
                      <button onClick={() => { setForm(f => ({...f, unit_no: String(unit)})); setShowCreate(true); }} className="text-niist-blue font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg">
                        + Create Assignment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {unitAssignments.map(a => {
                        const approved = parseInt(a.approved_count);
                        const total = parseInt(a.total_students) || 1;
                        const pct = Math.round((approved / total) * 100);
                        return (
                          <div key={a.ca_id} className="border border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h4 className="font-black text-gray-900 text-lg">{a.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1"><Timer className="w-3.5 h-3.5 text-gray-400" /> <Countdown deadline={a.deadline} /></div>
                                  <span className="text-xs text-gray-400 font-medium">{new Date(a.deadline).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => setShowSubmissions(a.ca_id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-niist-navy text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors">
                                  <Users className="w-3.5 h-3.5" /> Submissions
                                </button>
                                <button onClick={() => setShowDeleteConfirm(a)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 grid grid-cols-4 gap-3">
                              {[['Approved', approved, 'text-green-600'], [parseInt(a.pending_count), parseInt(a.pending_count), 'text-gray-400'], [parseInt(a.submitted || 0), parseInt(a.submitted || 0), 'text-blue-600'], [parseInt(a.rejected_count), parseInt(a.rejected_count), 'text-red-600']].map(([label, val, color]) => (
                                <div key={label} className="text-center bg-gray-50 py-2 px-3 rounded-lg">
                                  <div className={`text-xl font-black ${color}`}>{val}</div>
                                  <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-right text-gray-400 font-bold mt-1">{approved}/{total} approved</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-gray-900">Create Assignment</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Unit Number *</label>
                  <select className="form-select" value={form.unit_no} onChange={e => setForm(f => ({...f, unit_no: e.target.value}))} required>
                    {[1,2,3,4,5,6].map(u => <option key={u} value={u}>Unit {u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Deadline *</label>
                  <input type="datetime-local" required className="form-input" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} />
                </div>
              </div>

              <div>
                <label className="form-label">Assignment Title *</label>
                <input type="text" required className="form-input" placeholder="e.g. Normalization Worksheet" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0">Questions / Description *</label>
                  <button type="button" onClick={() => setShowAiPanel(v => !v)} className="flex items-center gap-1.5 text-xs font-bold text-niist-blue bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Bot className="w-3.5 h-3.5" /> {showAiPanel ? 'Hide AI' : 'Generate with AI'}
                  </button>
                </div>

                {showAiPanel && (
                  <div className="mb-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="form-label">Topic</label>
                        <input type="text" className="form-input" placeholder="e.g. Normalization, SQL Joins..." value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Questions</label>
                        <input type="number" className="form-input" min={1} max={10} value={aiCount} onChange={e => setAiCount(parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {['Easy', 'Medium', 'Hard'].map(d => (
                        <button key={d} type="button" onClick={() => setAiDifficulty(d)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${aiDifficulty === d ? 'bg-niist-navy text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={handleAiGenerate} disabled={aiLoading || !aiTopic} className="w-full flex items-center justify-center gap-2 bg-niist-blue text-white py-2 rounded-lg font-bold disabled:opacity-50">
                      {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating (15–25 secs)...</> : <><Bot className="w-4 h-4" /> Generate</>}
                    </button>
                  </div>
                )}

                <textarea
                  required rows={8} className="form-input resize-y font-mono text-sm" placeholder="Type questions manually or use AI above..."
                  value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Submission Tracker</h3>
              <button onClick={() => setShowSubmissions(null)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingSubmissions ? (
                <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-niist-blue mx-auto" /></div>
              ) : (
                <div className="space-y-3">
                  {submissions.map(sub => (
                    <div key={sub.submission_id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900">{sub.name}</p>
                        <p className="font-mono text-xs text-gray-500">{sub.enrollment_no}</p>
                        {sub.submitted_on && <p className="text-xs text-gray-400 mt-0.5">{new Date(sub.submitted_on).toLocaleString()}</p>}
                        {sub.rejection_reason && <p className="text-xs text-red-500 font-semibold mt-1">Reason: {sub.rejection_reason}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[sub.status] || ''}`}>{sub.status}</span>
                        {sub.status === 'pending' && (
                          <button onClick={() => handleSubmissionAction(sub.submission_id, 'tick')} className="px-3 py-1.5 bg-niist-navy text-white text-xs font-bold rounded-lg hover:bg-blue-900">✓ Mark</button>
                        )}
                        {(sub.status === 'submitted' || sub.status === 'resubmitted') && (<>
                          <button onClick={() => handleSubmissionAction(sub.submission_id, 'approve')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700">✅ Approve</button>
                          <button onClick={() => setShowRejectModal(sub)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600">❌ Reject</button>
                        </>)}
                        {sub.status === 'rejected' && (
                          <button onClick={() => handleSubmissionAction(sub.submission_id, 'resubmit_tick')} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700">↩ Resubmit</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">Reject Submission?</h3>
            <p className="text-gray-500 text-sm font-medium mb-4">Student: <strong className="text-gray-800">{showRejectModal.name}</strong></p>
            <textarea rows={3} className="form-input resize-none mb-4" placeholder="Provide rejection reason (required)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button
                disabled={!rejectReason}
                onClick={() => { handleSubmissionAction(showRejectModal.submission_id, 'reject', rejectReason); setShowRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-black text-xl text-gray-900 mb-2">Delete Assignment?</h3>
            <p className="text-gray-500 text-sm mb-6">{showDeleteConfirm.title}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAssignments;
