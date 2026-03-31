import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Rocket, Users, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const MILESTONE_STATUS_CONFIG = {
  completed: { icon: <CheckCircle className="w-5 h-5 text-white" />, ringCls: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  missed: { icon: <XCircle className="w-5 h-5 text-white" />, ringCls: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  overdue: { icon: <AlertTriangle className="w-5 h-5 text-white" />, ringCls: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
  pending: { icon: <Clock className="w-5 h-5 text-white" />, ringCls: 'bg-gray-300', badge: 'bg-gray-100 text-gray-600' },
};

const StudentProjects = () => {
  const { user } = useAuth();
  const [projectData, setProjectData] = useState(null); // { project, teams, milestones }
  const [teamDetail, setTeamDetail] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notEnabled, setNotEnabled] = useState(false);

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      // /api/projects/:session_id — for student, pass user_id (backend handles student role)
      const res = await api.get(`/projects/student/self`);

      if (!res.data) {
        setNotEnabled(true);
        setLoading(false);
        return;
      }

      const proj = res.data;
      setProjectData(proj);

      // Fetch teams and milestones
      const [teamsRes, milestonesRes] = await Promise.all([
        api.get(`/projects/${proj.project_id}/teams`),
        api.get(`/projects/${proj.project_id}/milestones`)
      ]);

      const myTeam = teamsRes.data.find(t => t.team_id === proj.team_id);
      setTeamDetail(myTeam);
      setMilestones(milestonesRes.data);
    } catch (err) {
      setNotEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>;

  if (notEnabled || !projectData) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <Rocket className="w-20 h-20 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-black text-gray-700 mb-2">Project Section Not Available</h2>
        <p className="text-gray-500 font-medium">Your faculty will enable it when the project module is ready for your batch.</p>
      </div>
    );
  }

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const pct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const nextMilestone = milestones.find(m => m.status === 'pending');

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Project Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-niist-navy rounded-xl flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-niist-navy">{projectData.title}</h1>
            {projectData.description && <p className="text-gray-600 mt-1">{projectData.description}</p>}
            <div className="flex gap-3 mt-3 flex-wrap">
              <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full border border-blue-100">{projectData.session_name}</span>
              <span className="bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded-full">Semester {projectData.semester}</span>
              {projectData.guide_name && <span className="bg-purple-50 text-purple-700 font-bold text-xs px-3 py-1 rounded-full border border-purple-100">Guide: {projectData.guide_name}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* My Team Card */}
      {teamDetail && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-niist-blue" /> My Team</h2>
          <div className="mb-4">
            <h3 className="text-2xl font-black text-niist-navy">{teamDetail.team_name}</h3>
            {teamDetail.guide_name && <p className="text-gray-500 font-medium text-sm mt-1">🎓 Faculty Guide: <strong className="text-gray-800">{teamDetail.guide_name}</strong></p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teamDetail.members?.map(m => {
              const isMe = m.student_id === user.user_id;
              return (
                <div key={m.student_id} className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'border-niist-blue bg-blue-50/20' : 'border-gray-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${isMe ? 'bg-niist-navy text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {getInitials(m.name)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{m.name} {isMe && <span className="ml-1 text-[10px] bg-niist-blue text-white px-1.5 py-0.5 rounded-full font-black">YOU</span>}</p>
                    <p className="text-[11px] font-mono text-gray-400">{m.enrollment_no}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-lg text-gray-800">Project Milestones</h2>
          <div className="text-sm font-bold text-gray-500">{completedCount}/{milestones.length} done</div>
        </div>

        {milestones.length === 0 ? (
          <p className="text-center text-gray-400 py-8 font-medium">No milestones set yet by your faculty.</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-100 z-0" />

            <div className="space-y-4 relative z-10">
              {milestones.map((m, idx) => {
                const isOverdue = m.status === 'pending' && new Date(m.deadline) < new Date();
                const statusKey = isOverdue ? 'overdue' : m.status;
                const sc = MILESTONE_STATUS_CONFIG[statusKey] || MILESTONE_STATUS_CONFIG.pending;
                const diff = new Date(m.deadline) - new Date();
                const daysLabel = diff > 0
                  ? `${Math.ceil(diff / 86400000)} days left`
                  : `${Math.ceil(-diff / 86400000)} days overdue`;

                return (
                  <div key={m.milestone_id} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${sc.ringCls} flex items-center justify-center shrink-0 shadow-md`}>
                      {sc.icon}
                    </div>
                    <div className={`flex-1 p-4 rounded-xl border transition-all ${m.status === 'completed' ? 'border-green-100 bg-green-50/10' : isOverdue ? 'border-amber-100 bg-amber-50/10' : m.status === 'missed' ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <h4 className="font-black text-gray-900">{m.title}</h4>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>{isOverdue ? 'Overdue' : m.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        📅 {new Date(m.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className={`text-xs font-bold mt-1 ${isOverdue ? 'text-amber-600' : m.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                        {m.status === 'completed' ? '✅ Submitted' : m.status === 'missed' ? '❌ Missed' : daysLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {milestones.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm font-bold text-gray-600">
              <span>Overall Progress</span>
              <span className={pct === 100 ? 'text-green-600' : 'text-niist-blue'}>{pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-niist-blue rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {nextMilestone && (
              <p className="text-sm text-gray-600 font-medium">
                ⏭️ Next: <strong className="text-gray-900">{nextMilestone.title}</strong> — {new Date(nextMilestone.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProjects;
