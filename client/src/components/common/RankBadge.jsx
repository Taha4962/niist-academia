import React from 'react';

const RankBadge = ({ rank, total }) => {
  if (!rank) return null;

  const r = parseInt(rank);

  if (r === 1) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full shadow-sm text-yellow-700 font-bold text-sm" title="Rank 1">
        <span className="text-lg">🥇</span> Rank 1 / {total}
      </div>
    );
  }
  
  if (r === 2) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full shadow-sm text-gray-700 font-bold text-sm" title="Rank 2">
        <span className="text-lg">🥈</span> Rank 2 / {total}
      </div>
    );
  }

  if (r === 3) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full shadow-sm text-orange-800 font-bold text-sm" title="Rank 3">
        <span className="text-lg">🥉</span> Rank 3 / {total}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-niist-blue font-bold text-sm">
      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">#</span> 
      Rank {r} <span className="text-blue-300 font-normal">/ {total}</span>
    </div>
  );
};

export default RankBadge;
