import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Rocket, Plus, Users, CheckCircle, XCircle, Clock, AlertTriangle,
  Loader2, X, Edit2, Trash2, ChevronDown, ChevronUp, Eye, EyeOff,
  UserPlus, UserMinus, Calendar, Timer
} from 'lucide-react';

const MILESTONE_STATUS = {
  completed: { icon: <CheckCircle className="w-5 h-5 text-green-500" />, cls: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  missed: { icon: <XCircle className="w-5 h-5 text-red-500" />, cls: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  pending: { icon: <Clock className="w-5 h-5 text-gray-400" />, cls: 'text-gray-500', badge: 'bg-gray-100 text-gray-600' },
};

const getDaysLeft = (deadline) => {
  const diff = new Date(deadline) - new Date();
  if (diff < 0) return { label: `${Math.ceil(-diff / 86400000)}d overdue`, cls: 'text-red-500', overdue: true };
  const d = Math.ceil(diff / 86400000);
  if (d <= 3) return { label: `${d}d left`, cls: 'text-amber-500', overdue: false };
  return { label: `${d}d left`, cls: 'text-green-600', overdue: false };
};

const FacultyProjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [allFaculty, setAllFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // Session students
  const [sessionStudents, setSessionStudents] = useState([]);

  // Modals
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showBulkMilestone, setShowBulkMilestone] = useState(false);
  const [showEditMilestone, setShowEditMilestone] = useState(null);
  const [showEditTeam, setShowEditTeam] = useState(null);

  // Forms
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });
  const [teamForm, setTeamForm] = useState({ team_name: '', guide_faculty_id: '', selected_students: [] });
  const [teamSearch, setTeamSearch] = useState('');
  const [milestoneForm, setMilestoneForm] = useState({ title: '', deadline: '' });
  const [bulkMilestones, setBulkMilestones] = useState(Array(5).fill(null).map(() => ({ title: '', deadline: '' })));

  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchSessionData(activeSession.session_id);
    }
  }, [activeSession]);

  const fetchInitialData = async () => {
    try {
      const [subRes, facRes] = await Promise.all([
        api.get('/faculty/subjects'),
        api.get('/hod/faculty')
      ]);
      const allSubjects = subRes.data;
      setSubjects(allSubjects);
      setAllFaculty(facRes.data);

      // Build unique sessions list with semester info
      const seen = new Set();
      const uniqueSessions = [];
      for (const s of allSubjects) {
        if (!seen.has(s.session_id) && s.semester >= 5) {
          seen.add(s.session_id);
          uniqueSessions.push({ session_id: s.session_id, session_name: s.session_name, semester: s.semester });
        }
      }
      setSessions(uniqueSessions);
      if (uniqueSessions.length > 0) setActiveSession(uniqueSessions[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSessionData = useCallback(async (session_id) => {
    try {
      const [projRes, studRes] = await Promise.all([
        api.get(`/projects/${session_id}`),
        api.get(`/projects/session-students/${session_id}`)
      ]);
      const projs = projRes.data;
      if (projs.length > 0) {
        setProject(projs[0]);
        fetchTeamsAndMilestones(projs[0].project_id);
      } else {
        setProject(null);
        setTeams([]);
        setMilestones([]);
      }
      setSessionStudents(studRes.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchTeamsAndMilestones = async (pid) => {
    const [tRes, mRes] = await Promise.all([
      api.get(`/projects/${pid}/teams`),
      api.get(`/projects/${pid}/milestones`)
    ]);
    setTeams(tRes.data);
    setMilestones(mRes.data);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/projects', {
        ...projectForm,
        session_id: activeSession.session_id,
        semester: activeSession.semester
      });
      setProject(res.data);
      setShowCreateProject(false);
      setProjectForm({ title: '', description: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error creating project'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await api.put(`/projects/${project.project_id}/toggle`, { is_enabled: !project.is_enabled });
      setProject(res.data.project);
    } catch (err) { alert('Toggle failed'); }
    finally { setToggling(false); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/projects/${project.project_id}/teams`, {
        team_name: teamForm.team_name,
        guide_faculty_id: teamForm.guide_faculty_id || null,
        student_ids: teamForm.selected_students.map(s => s.student_id)
      });
      setShowCreateTeam(false);
      setTeamForm({ team_name: '', guide_faculty_id: '', selected_students: [] });
      fetchTeamsAndMilestones(project.project_id);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/projects/${project.project_id}/milestones`, milestoneForm);
      setShowAddMilestone(false);
      setMilestoneForm({ title: '', deadline: '' });
      fetchTeamsAndMilestones(project.project_id);
    } catch (err) { alert('Error'); }
    finally { setSaving(false); }
  };

  const handleBulkMilestones = async (e) => {
    e.preventDefault();
    const valid = bulkMilestones.filter(m => m.title && m.deadline);
    if (valid.length === 0) return alert('Add at least one milestone');
    setSaving(true);
    try {
      await api.post(`/projects/${project.project_id}/milestones`, { milestones: valid });
      setShowBulkMilestone(false);
      setBulkMilestones(Array(5).fill(null).map(() => ({ title: '', deadline: '' })));
      fetchTeamsAndMilestones(project.project_id);
    } catch (err) { alert('Error'); }
    finally { setSaving(false); }
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/projects/milestones/${showEditMilestone.milestone_id}`, {
        title: showEditMilestone.title,
        deadline: showEditMilestone.deadline,
      });
      setShowEditMilestone(null);
      fetchTeamsAndMilestones(project.project_id);
    } catch (err) { alert('Update failed'); }
    finally { setSaving(false); }
  };

  const handleMilestoneStatus = async (milestone_id, status) => {
    try {
      await api.put(`/projects/milestones/${milestone_id}`, { status });
      fetchTeamsAndMilestones(project.project_id);
    } catch (err) { alert('Error'); }
  };

  const handleDeleteMilestone = async (milestone_id) => {
    if (!confirm('Delete this milestone?')) return;
    try {
      await api.delete(`/projects/milestones/${milestone_id}`);
      fetchTeamsAndMilestones(project.project_id);
    } catch (err) { alert(err.response?.data?.message || 'Cannot delete'); }
  };

  const handleRemoveMember = async (team_id, student_id) => {
    if (!confirm('Remove this student from the team?')) return;
    await api.delete(`/projects/teams/${team_id}/members/${student_id}`);
    fetchTeamsAndMilestones(project.project_id);
  };

  const filteredStudents = sessionStudents.filter(s => {
    if (!teamSearch) return true;
    return s.name.toLowerCase().includes(teamSearch.toLowerCase()) || s.enrollment_no.includes(teamSearch);
  }).filter(s => !teamForm.selected_students.find(sel => sel.student_id === s.student_id));

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-niist-navy flex items-center gap-2">
            <Rocket className="w-6 h-6 text-niist-blue" /> Project Module
          </h1>
          <p className="text-gray-500 font-medium">Manage batch projects, teams and milestones</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <>
          {/* Session Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {subjects.filter(s => s.semester < 5).slice(0, 1).map(() => (
              <div key="info" className="px-6 pb-4 text-sm text-gray-400 font-medium italic">Project module requires Semester 5+</div>
            ))}
            {sessions.map(s => (
              <button key={s.session_id}
                onClick={() => setActiveSession(s)}
                className={`whitespace-nowrap pb-4 px-6 font-bold border-b-2 transition-colors ${activeSession?.session_id === s.session_id ? 'border-niist-navy text-niist-navy' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {s.session_name} <span className="text-xs font-mono ml-1 opacity-60">Sem {s.semester}</span>
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="px-6 pb-4 text-sm text-gray-400 font-medium">You have no 3rd/4th year sessions assigned.</div>
            )}
          </div>

          {activeSession && (
            <div className="space-y-6">
              {!project ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <Rocket className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Project Created</h3>
                  <p className="text-gray-500 mb-6">Create a project for {activeSession.session_name} batch</p>
                  <button onClick={() => setShowCreateProject(true)} className="bg-niist-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-md">
                    + Create Project
                  </button>
                </div>
              ) : (
                <>
                  {/* Project Header Card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-black text-niist-navy">{project.title}</h2>
                        {project.description && <p className="text-gray-600 mt-2 leading-relaxed">{project.description}</p>}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full border border-blue-100">{activeSession.session_name}</span>
                          <span className="bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded-full">Semester {project.semester}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap shrink-0">
                        <button onClick={handleToggle} disabled={toggling}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${project.is_enabled ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                          {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : project.is_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          {project.is_enabled ? 'Visible to Students' : 'Hidden from Students'}
                        </button>
                        <button onClick={() => { setProjectForm({ title: project.title, description: project.description }); setShowEditProject(true); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      {[
                        { label: 'Teams', value: project.team_count || 0, cls: 'text-niist-blue' },
                        { label: 'Students', value: project.member_count || 0, cls: 'text-purple-600' },
                        { label: 'Milestones', value: `${project.completed_milestones || 0}/${project.total_milestones || 0}`, cls: 'text-green-600' },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                          <div className={`text-2xl font-black ${s.cls}`}>{s.value}</div>
                          <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teams Section */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-gray-100">
                      <h3 className="font-black text-lg text-gray-800">Project Teams</h3>
                      <button onClick={() => setShowCreateTeam(true)} className="bg-niist-navy text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-900 transition-colors flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Create Team
                      </button>
                    </div>
                    <div className="p-5">
                      {teams.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 font-bold">No teams created yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {teams.map(team => (
                            <div key={team.team_id} className="border border-gray-100 rounded-xl p-5 hover:border-blue-200 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-black text-gray-900">{team.team_name}</h4>
                                  {team.guide_name && <p className="text-xs text-gray-500 font-medium mt-0.5">🎓 Guide: {team.guide_name}</p>}
                                </div>
                                <button onClick={() => setShowEditTeam(team)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                              </div>
                              <div className="space-y-2">
                                {team.members?.map(m => (
                                  <div key={m.student_id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                      <span className="w-7 h-7 rounded-full bg-niist-navy text-white text-[10px] font-black flex items-center justify-center shrink-0">{getInitials(m.name)}</span>
                                      <div>
                                        <p className="text-sm font-bold text-gray-800 leading-none">{m.name}</p>
                                        <p className="text-[10px] font-mono text-gray-400">{m.enrollment_no}</p>
                                      </div>
                                    </div>
                                    <button onClick={() => handleRemoveMember(team.team_id, m.student_id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all">
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestones Timeline */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-gray-100">
                      <h3 className="font-black text-lg text-gray-800">Project Timeline</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setShowBulkMilestone(true)} className="px-4 py-2 rounded-lg font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                          + Add Multiple
                        </button>
                        <button onClick={() => setShowAddMilestone(true)} className="bg-niist-navy text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-900 transition-colors flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> Add Milestone
                        </button>
                      </div>
                    </div>
                    <div className="p-5">
                      {milestones.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 font-bold">No milestones added yet</p>
                        </div>
                      ) : (
                        <div className="relative space-y-3">
                          {milestones.map((m, idx) => {
                            const isOverdue = m.status === 'pending' && new Date(m.deadline) < new Date();
                            const effectiveStatus = isOverdue ? 'overdue' : m.status;
                            const statusInfo = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.pending;
                            const days = getDaysLeft(m.deadline);
                            return (
                              <div key={m.milestone_id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${effectiveStatus === 'overdue' ? 'border-amber-200 bg-amber-50/20' : effectiveStatus === 'completed' ? 'border-green-100 bg-green-50/10' : effectiveStatus === 'missed' ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
                                <div className="shrink-0">{statusInfo.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900">{m.title}</p>
                                  <p className="text-xs text-gray-500">{new Date(m.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-amber-100 text-amber-700' : statusInfo.badge}`}>
                                    {isOverdue ? 'Overdue' : m.status}
                                  </span>
                                  <span className={`text-xs font-bold ${days.cls}`}>{days.label}</span>
                                  {m.status === 'pending' && (
                                    <button onClick={() => handleMilestoneStatus(m.milestone_id, 'completed')} className="px-2 py-1 text-xs bg-green-600 text-white rounded font-bold hover:bg-green-700">✓ Done</button>
                                  )}
                                  <button onClick={() => setShowEditMilestone({ ...m, deadline: m.deadline.split('T')[0] })} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteMilestone(m.milestone_id)} disabled={m.status === 'completed'} className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ─────── MODALS ─────── */}

      {/* Create Project */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Create Project</h3>
              <button onClick={() => setShowCreateProject(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div><label className="form-label">Project Title *</label><input required className="form-input" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} placeholder="Smart Campus Management System" /></div>
              <div><label className="form-label">Description</label><textarea rows={3} className="form-input resize-none" value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><span className="font-bold text-gray-600">Session:</span> <span className="text-gray-800">{activeSession?.session_name}</span></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="font-bold text-gray-600">Semester:</span> <span className="text-gray-800">{activeSession?.semester}</span></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateProject(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project */}
      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Edit Project</h3>
              <button onClick={() => setShowEditProject(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { const r = await api.put(`/projects/${project.project_id}`, projectForm); setProject(p => ({...p, ...r.data})); setShowEditProject(false); } catch {} setSaving(false); }} className="p-6 space-y-4">
              <div><label className="form-label">Project Title *</label><input required className="form-input" value={projectForm.title} onChange={e => setProjectForm(f => ({...f,title:e.target.value}))} /></div>
              <div><label className="form-label">Description</label><textarea rows={3} className="form-input resize-none" value={projectForm.description} onChange={e => setProjectForm(f => ({...f,description:e.target.value}))} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditProject(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Create Team</h3>
              <button onClick={() => setShowCreateTeam(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateTeam} className="p-6 overflow-y-auto space-y-4">
              <div><label className="form-label">Team Name *</label><input required className="form-input" value={teamForm.team_name} onChange={e => setTeamForm(f => ({...f,team_name:e.target.value}))} placeholder="Alpha Team" /></div>
              <div>
                <label className="form-label">Guide Faculty (optional)</label>
                <select className="form-select" value={teamForm.guide_faculty_id} onChange={e => setTeamForm(f => ({...f,guide_faculty_id:e.target.value}))}>
                  <option value="">No Guide Assigned</option>
                  {allFaculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.name} ({f.employee_id})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Add Members</label>
                <input type="text" className="form-input mb-2" placeholder="Search by name or enrollment..." value={teamSearch} onChange={e => setTeamSearch(e.target.value)} />
                {teamForm.selected_students.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {teamForm.selected_students.map(s => (
                      <span key={s.student_id} className="flex items-center gap-1 bg-niist-navy text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {s.name}
                        <button type="button" onClick={() => setTeamForm(f => ({...f, selected_students: f.selected_students.filter(x => x.student_id !== s.student_id)}))}>
                          <X className="w-3 h-3 ml-0.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {filteredStudents.slice(0, 15).map(s => (
                    <button type="button" key={s.student_id} onClick={() => setTeamForm(f => ({...f, selected_students: [...f.selected_students, s]}))}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-800">{s.name}</span>
                      <span className="font-mono text-xs text-gray-400">{s.enrollment_no}</span>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && <p className="text-center py-4 text-gray-400 text-sm font-medium">No results</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateTeam(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Add Milestone</h3>
              <button onClick={() => setShowAddMilestone(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
              <div><label className="form-label">Title *</label><input required className="form-input" value={milestoneForm.title} onChange={e => setMilestoneForm(f => ({...f,title:e.target.value}))} placeholder="Synopsis Submission" /></div>
              <div><label className="form-label">Deadline *</label><input required type="date" className="form-input" value={milestoneForm.deadline} onChange={e => setMilestoneForm(f => ({...f,deadline:e.target.value}))} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMilestone(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Milestone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Milestones */}
      {showBulkMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Set Project Schedule</h3>
              <button onClick={() => setShowBulkMilestone(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleBulkMilestones} className="p-6 overflow-y-auto">
              <div className="space-y-3 mb-4">
                {bulkMilestones.map((m, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input className="form-input flex-1" placeholder={`Milestone ${idx + 1}`} value={m.title} onChange={e => { const copy = [...bulkMilestones]; copy[idx] = {...copy[idx], title: e.target.value}; setBulkMilestones(copy); }} />
                    <input type="date" className="form-input w-44" value={m.deadline} onChange={e => { const copy = [...bulkMilestones]; copy[idx] = {...copy[idx], deadline: e.target.value}; setBulkMilestones(copy); }} />
                    <button type="button" onClick={() => setBulkMilestones(bm => bm.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setBulkMilestones(bm => [...bm, { title: '', deadline: '' }])} className="text-niist-blue font-bold text-sm hover:underline">+ Add Another Milestone</button>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setShowBulkMilestone(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Milestone */}
      {showEditMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Edit Milestone</h3>
              <button onClick={() => setShowEditMilestone(null)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdateMilestone} className="p-6 space-y-4">
              <div><label className="form-label">Title *</label><input required className="form-input" value={showEditMilestone.title} onChange={e => setShowEditMilestone(m => ({...m,title:e.target.value}))} /></div>
              <div>
                <label className="form-label">Deadline *</label>
                <input required type="date" className="form-input" value={showEditMilestone.deadline} onChange={e => setShowEditMilestone(m => ({...m,deadline:e.target.value}))} />
                <p className="text-xs text-amber-600 font-medium mt-1">⚠️ Changing deadline will notify all students automatically</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditMilestone(null)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team */}
      {showEditTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Edit Team</h3>
              <button onClick={() => setShowEditTeam(null)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await api.put(`/projects/teams/${showEditTeam.team_id}`, { team_name: showEditTeam.team_name, guide_faculty_id: showEditTeam.guide_faculty_id }); setShowEditTeam(null); fetchTeamsAndMilestones(project.project_id); } catch {} setSaving(false); }} className="p-6 space-y-4">
              <div><label className="form-label">Team Name *</label><input required className="form-input" value={showEditTeam.team_name} onChange={e => setShowEditTeam(t => ({...t,team_name:e.target.value}))} /></div>
              <div>
                <label className="form-label">Guide Faculty</label>
                <select className="form-select" value={showEditTeam.guide_faculty_id || ''} onChange={e => setShowEditTeam(t => ({...t, guide_faculty_id: e.target.value}))}>
                  <option value="">No Guide</option>
                  {allFaculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditTeam(null)} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyProjects;
