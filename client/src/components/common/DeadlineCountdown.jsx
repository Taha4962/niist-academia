import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

/**
 * DeadlineCountdown
 * Props:
 *   deadline: string | Date  — target datetime
 *   label: string            — optional label prefix
 */
const DeadlineCountdown = ({ deadline, label }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [color, setColor] = useState('text-gray-400');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setColor('text-gray-400');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      if (d > 3) { setTimeLeft(`${d}d ${h}h left`); setColor('text-green-600'); }
      else if (d >= 1) { setTimeLeft(`${d}d ${h}h left`); setColor('text-amber-500'); }
      else if (h >= 1) { setTimeLeft(`${h}h ${m}m left`); setColor('text-red-600'); }
      else { setTimeLeft(`${m} mins left`); setColor('text-red-700'); }
    };

    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-1.5 font-bold text-sm ${color}`}>
      <Timer className="w-4 h-4" />
      {label && <span className="text-gray-500 font-medium">{label}:</span>}
      <span>{timeLeft}</span>
    </div>
  );
};

export default DeadlineCountdown;
