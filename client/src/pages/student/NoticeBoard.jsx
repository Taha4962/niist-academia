import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Pin, Loader2, ChevronDown, Globe, Users, BookOpen } from 'lucide-react';

const TARGET_LABELS = { department: 'For all students', session: 'For your session', subject: 'For subject students' };
const TARGET_ICONS = { department: Globe, session: Users, subject: BookOpen };

const StudentNoticeBoard = () => {
  const [pinned, setPinned] = useState([]);
  const [recent, setRecent] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [noticeRes, unreadRes] = await Promise.all([
        api.get('/notices'),
        api.get('/notices/unread-count')
      ]);
      setPinned(noticeRes.data.pinned || []);
      setRecent(noticeRes.data.recent || []);
      setUnread(unreadRes.data.count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRead = async (notice_id, is_read) => {
    if (is_read) return;
    try {
      await api.post(`/notices/${notice_id}/read`);
      // Optimistically update
      const update = (arr) => arr.map(n => n.notice_id === notice_id ? {...n, is_read: true} : n);
      setPinned(update);
      setRecent(update);
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const NoticeCard = ({ n }) => {
    const isOpen = expanded === n.notice_id;
    const TargetIcon = TARGET_ICONS[n.target_type] || Globe;

    return (
      <div
        className={`rounded-xl border shadow-sm transition-all overflow-hidden ${!n.is_read ? 'border-l-4 border-l-niist-blue border-y border-r border-gray-100 bg-blue-50/10' : 'border-gray-100 bg-white'}`}
      >
        <button
          className="w-full text-left p-5"
          onClick={() => {
            setExpanded(isOpen ? null : n.notice_id);
            handleRead(n.notice_id, n.is_read);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {!n.is_read && <span className="text-[10px] font-black bg-niist-blue text-white px-2 py-0.5 rounded-full shrink-0">NEW</span>}
                {n.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                {n.is_auto && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">AUTO</span>}
              </div>
              <h3 className={`font-black leading-tight ${!n.is_read ? 'text-niist-navy' : 'text-gray-800'}`}>{n.title}</h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <TargetIcon className="w-2.5 h-2.5" />{TARGET_LABELS[n.target_type]}
                </span>
                {n.faculty_name && <span className="text-xs text-gray-400 font-medium">by {n.faculty_name}</span>}
                <span className="text-xs text-gray-400 font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              {!isOpen && <p className="text-gray-500 text-sm mt-2 line-clamp-2">{n.content}</p>}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mt-4">{n.content}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-niist-navy flex items-center gap-2">
            <Bell className="w-6 h-6 text-niist-blue" /> Notice Board
          </h1>
          <p className="text-gray-500 font-medium">Your department announcements</p>
        </div>
        {unread > 0 && (
          <div className="bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-full shadow-md">
            {unread} Unread
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-niist-blue mx-auto" /></div>
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <div>
              <h2 className="font-black text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">
                <Pin className="w-4 h-4 text-amber-500" /> Pinned
              </h2>
              <div className="space-y-3">
                {pinned.map(n => <NoticeCard key={n.notice_id} n={n} />)}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-black text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Bell className="w-4 h-4 text-gray-400" /> Recent
            </h2>
            {recent.length === 0 && pinned.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl border border-gray-100 shadow-sm">
                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">No notices for you yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.filter(n => !n.is_read).map(n => <NoticeCard key={n.notice_id} n={n} />)}
                {recent.filter(n => n.is_read).length > 0 && (
                  <>
                    <div className="flex items-center gap-3 opacity-40 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Already Read</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    {recent.filter(n => n.is_read).map(n => <NoticeCard key={n.notice_id} n={n} />)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNoticeBoard;
