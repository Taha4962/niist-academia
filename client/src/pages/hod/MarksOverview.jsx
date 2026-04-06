import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RankBadge from '../../components/common/RankBadge';
import { Trophy, Activity, Loader2, BookOpen } from 'lucide-react';

const MarksOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/marks/hod/overview');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto"/></div>;
  }

  if (!data || (!data.averages.length && !data.rankers.length)) {
    return (
      <div className="bg-white p-10 text-center rounded-xl border border-gray-100 shadow-sm max-w-7xl mx-auto mt-6">
        <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-bold">No marks data configured or entered by faculty yet.</p>
      </div>
    );
  }

  // Group averages by session
  const sessionAverages = {};
  data.averages.forEach(a => {
    if (!sessionAverages[a.session_name]) sessionAverages[a.session_name] = [];
    sessionAverages[a.session_name].push(a);
  });

  const sessionRankers = {};
  data.rankers.forEach(r => {
    if (!sessionRankers[r.session_name]) sessionRankers[r.session_name] = [];
    sessionRankers[r.session_name].push(r);
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-niist-navy">Marks & Performance Overview</h1>
          <p className="text-gray-500 font-medium">Department-wide top rankers and subject averages</p>
        </div>
      </div>

      {Object.keys(sessionAverages).length > 0 ? Object.keys(sessionAverages).map(sessionName => (
        <div key={sessionName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="bg-gradient-to-r from-niist-navy to-blue-900 p-5 text-white flex items-center justify-between">
            <h2 className="text-xl font-black">{sessionName}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Top Rankers Board */}
            <div className="p-6 lg:border-r border-gray-100">
              <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Top 5 Rankers
              </h3>
              <div className="space-y-3">
                {sessionRankers[sessionName]?.length > 0 ? sessionRankers[sessionName].map((r, i) => (
                  <div key={`${r.enrollment_no}-${r.rnk}`} className={`flex items-center justify-between p-3 rounded-lg border ${parseInt(r.rnk) === 1 ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 shrink-0 flex justify-center"><RankBadge rank={r.rnk} /></div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{r.name}</p>
                        <p className="font-mono text-[10px] uppercase text-gray-500 font-bold">{r.enrollment_no}</p>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100 font-black text-niist-blue">
                      {r.total_marks} <span className="text-xs text-gray-400 font-bold">pts</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm italic">No ranking data</p>
                )}
              </div>
            </div>

            {/* Subject Averages */}
            <div className="p-6 bg-gray-50/50">
              <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-niist-blue" /> Subject Averages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sessionAverages[sessionName].map(avg => {
                  const percent = (parseFloat(avg.avg_marks) / parseFloat(avg.total_max)) * 100;
                  return (
                    <div key={avg.subject_name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group hover:border-blue-200 transition-colors">
                      <div className="flex items-start gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 shrink-0 group-hover:text-blue-500 transition-colors" />
                        <h4 className="font-bold text-gray-700 text-sm leading-tight">{avg.subject_name}</h4>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-black text-gray-900">{avg.avg_marks}</span>
                          <span className="text-xs text-gray-400 font-bold ml-1">/ {avg.total_max}</span>
                        </div>
                        <span className={`text-xs font-black px-2 py-1 rounded ${percent >= 75 ? 'bg-green-100 text-green-700' : percent >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {percent ? Math.round(percent) : 0}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )) : (
        <div className="text-center text-gray-500 py-10">Waiting for data...</div>
      )}

    </div>
  );
};

export default MarksOverview;
