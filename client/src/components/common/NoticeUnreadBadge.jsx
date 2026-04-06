import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const NoticeUnreadBadge = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'student') return;
    const fetchCount = async () => {
      try {
        const res = await api.get('/notices/unread-count');
        setCount(res.data.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="relative inline-flex">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full ring-2 ring-white animate-pulse">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
};

export default NoticeUnreadBadge;
