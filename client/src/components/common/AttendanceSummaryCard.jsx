import React from 'react';

const AttendanceSummaryCard = ({ subject_name, subject_code, total, present, absent, late, percentage, onClick }) => {
  const isDanger = parseFloat(percentage) < 75;
  const isWarning = parseFloat(percentage) >= 75 && parseFloat(percentage) < 80;
  
  let colorTheme = 'bg-green-500';
  let badgeTheme = 'bg-green-100 text-green-700 border-green-200';
  let cardBorder = 'hover:border-green-300';

  if (isDanger) {
    colorTheme = 'bg-red-500';
    badgeTheme = 'bg-red-100 text-red-700 border-red-200 animate-pulse';
    cardBorder = 'border-red-200 hover:border-red-400';
  } else if (isWarning) {
    colorTheme = 'bg-amber-500';
    badgeTheme = 'bg-amber-100 text-amber-700 border-amber-200';
    cardBorder = 'hover:border-amber-300';
  }

  // Logic to show "Classes to miss" vs "Classes needed"
  // Target = 75%
  // Formula for needed classes: ceil((0.75 * total_expected - present)/0.25) where total_expected = total + needed
  // Simplifies to: needed = ceil((3*absent - present))
  let advice = null;
  const tot = parseInt(total);
  const pres = parseInt(present) + parseInt(late); // Late counts as present for percentage in this model usually or 0.5? We just use UI present count.
  const abs = parseInt(absent);
  
  if (isDanger && tot > 0) {
    const needed = Math.max(0, Math.ceil(3 * abs - pres)); 
    if (needed > 0) {
      advice = <span className="text-red-600 font-bold">Needs {needed} continuous classes</span>;
    }
  } else if (!isDanger && tot > 0) {
    const canMiss = Math.floor((pres - 3 * abs) / 3);
    if (canMiss > 0) {
      advice = <span className="text-green-600 font-bold">Can skip {canMiss} classes</span>;
    } else {
      advice = <span className="text-amber-600 font-bold">On the border, don't skip</span>;
    }
  }

  return (
    <div 
      onClick={onClick} 
      className={`bg-white rounded-xl shadow-sm border ${onClick ? 'cursor-pointer transition-all hover:shadow-md' : ''} border-gray-100 p-5 hidden-sm flex flex-col relative overflow-hidden group ${cardBorder}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="pr-12">
          <span className="font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
            {subject_code}
          </span>
          <h3 className="font-bold text-gray-900 leading-tight group-hover:text-niist-blue transition-colors">
            {subject_name}
          </h3>
        </div>
        <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-black border ${badgeTheme}`}>
          {percentage}%
        </div>
      </div>

      <div className="mt-4 mb-5">
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
           <div className={`h-full ${colorTheme} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs mt-auto pb-3 border-b border-gray-50">
        <div className="text-center">
          <p className="text-gray-400 font-bold mb-0.5">Total</p>
          <p className="text-gray-900 font-black text-sm">{total}</p>
        </div>
        <div className="text-center">
          <p className="text-green-600 font-bold mb-0.5">Present</p>
          <p className="text-gray-900 font-black text-sm">{present}</p>
        </div>
        <div className="text-center">
          <p className="text-red-600 font-bold mb-0.5">Absent</p>
          <p className="text-gray-900 font-black text-sm">{absent}</p>
        </div>
        <div className="text-center">
          <p className="text-amber-600 font-bold mb-0.5">Late</p>
          <p className="text-gray-900 font-black text-sm">{late}</p>
        </div>
      </div>
      
      <div className="text-[11px] text-center mt-3 tracking-wide">
        {advice || 'No data yet'}
      </div>
    </div>
  );
};

export default AttendanceSummaryCard;
