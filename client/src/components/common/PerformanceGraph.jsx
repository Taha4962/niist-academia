import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceGraph = ({ distribution_data, subject_name, max_marks }) => {
  if (!distribution_data || distribution_data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 font-medium">Not enough data to generate performance graph.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">{label} Range</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm font-semibold my-1">
              <span style={{ color: entry.color }}>{entry.name.toUpperCase()}</span>
              <span className="text-gray-900 font-black">{entry.value} students</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in">
      <h3 className="text-sm font-bold text-niist-navy mb-4 ml-4">Score Distribution: {subject_name}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={distribution_data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
             dataKey="name" 
             axisLine={false} 
             tickLine={false} 
             tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
          />
          <YAxis 
             axisLine={false} 
             tickLine={false} 
             tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
             allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
          
          <Bar dataKey="mst1" name="MST 1" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="mst2" name="MST 2" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="internal" name="Internal" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
          {max_marks?.has_practical && (
            <Bar dataKey="practical" name="Practical" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceGraph;
