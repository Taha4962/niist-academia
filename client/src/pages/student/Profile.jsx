import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  User, Mail, Phone, MapPin, BookOpen, Calendar,
  Shield, Award, Clock, CheckCircle, Lock, ChevronRight,
  Droplet, CreditCard, GraduationCap, Users
} from 'lucide-react';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({ phone: '', address: '', blood_group: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/profile');
      setProfile(res.data.profile);
      setParents(res.data.parents || []);
      setFormData({
        phone: res.data.profile.phone || '',
        address: res.data.profile.address || '',
        blood_group: res.data.profile.blood_group || '',
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const res = await api.put('/student/profile', formData);
      setProfile(prev => ({ ...prev, ...res.data.profile }));
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match'); return;
    }
    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    try {
      setSaving(true); setError('');
      await api.put('/student/profile/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setChangingPassword(false);
      setSuccess('Password updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const attendancePct = profile
    ? profile.total_classes > 0
      ? Math.round((profile.total_present / profile.total_classes) * 100)
      : 0
    : 0;

  const attendanceColor =
    attendancePct >= 75 ? '#22c55e' :
    attendancePct >= 60 ? '#f59e0b' : '#ef4444';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: 14 }}>Loading your profile...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 4px', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .profile-section { animation: fadeUp 0.35s ease forwards; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary:hover { background: #f9fafb; }
        .edit-row-btn:hover { color: #1d4ed8; }
      `}</style>

      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e3a5f', margin: 0 }}>My Profile</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>View and manage your personal information</p>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
          ❌ {error}
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="profile-section" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: 20, padding: 32, marginBottom: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', boxShadow: '0 8px 32px rgba(30,58,95,0.25)' }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', flexShrink: 0, backdropFilter: 'blur(10px)' }}>
          {profile?.profile_photo
            ? <img src={profile.profile_photo} alt="avatar" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }} />
            : getInitials(profile?.name)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{profile?.name}</h2>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              🎓 STUDENT
            </span>
          </div>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>{profile?.branch_name} · Semester {profile?.current_semester}</p>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 13, fontFamily: 'monospace' }}>{profile?.enrollment_no}</p>
        </div>
        {/* Attendance Donut */}
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 22px', backdropFilter: 'blur(10px)' }}>
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto' }}>
            <svg viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', width: 72, height: 72 }}>
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
              <circle cx="36" cy="36" r="28" fill="none" stroke={attendancePct >= 75 ? '#4ade80' : attendancePct >= 60 ? '#fbbf24' : '#f87171'} strokeWidth="7"
                strokeDasharray={`${2 * Math.PI * 28 * attendancePct / 100} ${2 * Math.PI * 28 * (1 - attendancePct / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>
              {attendancePct}%
            </div>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 11, opacity: 0.75, fontWeight: 600 }}>ATTENDANCE</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Session', value: profile?.session_name, icon: Calendar, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Classes Present', value: `${profile?.total_present || 0} / ${profile?.total_classes || 0}`, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Assignments Done', value: profile?.assignments_done || 0, icon: BookOpen, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'CGPA', value: profile?.cgpa || 'N/A', icon: Award, color: '#f59e0b', bg: '#fffbeb' },
        ].map((stat) => (
          <div className="stat-card" key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${stat.color}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <stat.icon size={16} color={stat.color} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Personal Information Card */}
      <div className="profile-section" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Personal Information</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Your editable contact details</p>
            </div>
          </div>
          {!editing ? (
            <button className="edit-row-btn" onClick={() => setEditing(true)}
              style={{ fontSize: 13, color: '#3b82f6', background: '#eff6ff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, transition: 'color 0.15s' }}>
              ✏️ Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditing(false); setError(''); }}
                style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={saving}
                style={{ fontSize: 13, color: '#fff', background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : '✓ Save'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {/* Read-only fields */}
          {[
            { label: 'Full Name', value: profile?.name, icon: User },
            { label: 'Email Address', value: profile?.user_email, icon: Mail },
            { label: 'Enrollment No.', value: profile?.enrollment_no, icon: CreditCard },
            { label: 'Date of Birth', value: profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set', icon: Calendar },
            { label: 'Admission Year', value: profile?.admission_year || 'N/A', icon: GraduationCap },
            { label: 'Branch', value: `${profile?.branch_name} (${profile?.branch_code})`, icon: BookOpen },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <f.icon size={12} /> {f.label}
              </label>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{f.value || '—'}</p>
            </div>
          ))}

          {/* Editable fields */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Phone size={12} /> Phone Number
            </label>
            {editing ? (
              <input className="input-field" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
            ) : (
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{profile?.phone || '—'}</p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Droplet size={12} /> Blood Group
            </label>
            {editing ? (
              <select className="input-field" value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', cursor: 'pointer' }}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{profile?.blood_group || '—'}</p>
            )}
          </div>
        </div>

        {/* Address — full row */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <MapPin size={12} /> Address
          </label>
          {editing ? (
            <textarea className="input-field" rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
              style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: '#111827' }}>{profile?.address || '—'}</p>
          )}
        </div>
      </div>

      {/* Parent / Guardian Card */}
      {parents.length > 0 && (
        <div className="profile-section" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#d97706" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Parent / Guardian</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Emergency contact details</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {parents.map(p => (
              <div key={p.parent_id} style={{ background: '#fffbeb', borderRadius: 12, padding: 16, border: '1px solid #fde68a', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#92400e', flexShrink: 0 }}>
                  {p.name?.charAt(0)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>{p.name}</p>
                  <p style={{ margin: '2px 0', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{p.relation}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>{p.phone}</p>
                  <span style={{ fontSize: 11, color: p.is_verified ? '#15803d' : '#b45309', background: p.is_verified ? '#dcfce7' : '#fef3c7', borderRadius: 20, padding: '2px 8px', fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
                    {p.is_verified ? '✔ Verified' : '⏳ Unverified'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Password Card */}
      <div className="profile-section" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: changingPassword ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="#db2777" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Change Password</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Keep your account secure</p>
            </div>
          </div>
          {!changingPassword && (
            <button onClick={() => setChangingPassword(true)}
              style={{ fontSize: 13, color: '#fff', background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
              Change Password
            </button>
          )}
        </div>

        {changingPassword && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'current_password', label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'new_password', label: 'New Password', placeholder: 'At least 8 characters' },
              { key: 'confirm_password', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input className="input-field" type="password" placeholder={f.placeholder} value={passwordData[f.key]}
                  onChange={e => setPasswordData({ ...passwordData, [f.key]: e.target.value })}
                  style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => { setChangingPassword(false); setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); setError(''); }}
                style={{ flex: 1, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handlePasswordChange} disabled={saving}
                style={{ flex: 1, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Updating…' : '🔒 Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
