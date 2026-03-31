import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ProjectOverview = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [teams, setTeams] = useState({});
  const [filterMissed, setFilterMissed] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/projects/hod/overview');
      setProjectsData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async (project_id) => {
    if (teams[project_id]) {
      setExpandedSession(expandedSession === project_id ? null : project_id);
      return;
    }
    
    try {
      const res = await api.get(`/projects/${project_id}/teams`);
      setTeams(prev => ({ ...prev, [project_id]: res.data }));
      setExpandedSession(project_id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading project overview...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Project Overview</h1>
      </div>

      {projectsData.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500">No active projects to oversee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projectsData.map((project) => (
            <div key={project.project_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={() => loadTeams(project.project_id)}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-niist-navy dark:text-gray-100">{project.session_name}</h2>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{project.title}</p>
                    <p className="text-xs text-gray-500 mt-2">Guided by: <span className="text-blue-600 font-medium">{project.faculty_name}</span></p>
                  </div>
                  
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{project.team_count}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Teams</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{project.completed || 0}/{project.total_milestones || 0}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Milestones</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${(project.missed > 0 || project.overdue > 0) ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {parseInt(project.missed || 0) + parseInt(project.overdue || 0)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Issues</div>
                    </div>
                  </div>
                </div>
                
                {project.total_milestones > 0 && (
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${(project.completed / project.total_milestones) * 100}%` }}></div>
                  </div>
                )}
              </div>

              {/* Teams Expanded View */}
              {expandedSession === project.project_id && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-6 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold dark:text-gray-200">Session Teams</h3>
                    <label className="flex items-center text-sm gap-2 dark:text-gray-300">
                      <input type="checkbox" checked={filterMissed} onChange={e => setFilterMissed(e.target.checked)} />
                      Show issues only
                    </label>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-lg">Team Name</th>
                          <th className="px-4 py-3 font-semibold">Guide Faculty</th>
                          <th className="px-4 py-3 font-semibold">Members</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams[project.project_id]?.length === 0 ? (
                          <tr><td colSpan="3" className="px-4 py-4 text-center text-gray-500">No teams formed yet.</td></tr>
                        ) : teams[project.project_id]?.map(team => (
                          <tr key={team.team_id} className="border-b dark:border-gray-700">
                            <td className="px-4 py-3 font-medium dark:text-gray-200">{team.team_name}</td>
                            <td className="px-4 py-3 dark:text-gray-300">
                              {team.guide_name ? (
                                <div>
                                  {team.guide_name}
                                  <div className="text-xs text-gray-500">{team.guide_emp_id}</div>
                                </div>
                              ) : <span className="text-gray-400 italic">Unassigned</span>}
                            </td>
                            <td className="px-4 py-3 text-xs dark:text-gray-300">
                              <ul className="list-disc pl-4">
                                {team.members && team.members.map(m => (
                                  <li key={m.student_id}>{m.name} ({m.enrollment_no})</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;
