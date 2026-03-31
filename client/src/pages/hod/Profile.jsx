import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const HodProfile = () => {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    phone: '',
    email: ''
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get('/faculty/profile/me')
      setProfile(res.data.profile)
      setFormData({
        name: res.data.profile.name || '',
        designation: res.data.profile.designation || '',
        phone: res.data.profile.phone || '',
        email: res.data.profile.email || ''
      })
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const res = await api.put('/faculty/profile/hod', formData)
      setProfile(res.data.profile)
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      return
    }
    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 chars')
      return
    }
    try {
      setSaving(true)
      setError('')
      await api.put('/faculty/profile/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setChangingPassword(false)
      setSuccess('Password changed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'H'
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      setError('');
      setSaving(true);
      const res = await api.post('/faculty/profile/photo', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({ ...profile, profile_photo: res.data.photo_url });
      setSuccess('Photo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-niist-navy"></div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-niist-navy">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your administrator details</p>
      </div>

      {/* Success/Error Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm transition-all duration-300">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm transition-all duration-300">
          ❌ {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

        {/* Avatar + Name Row */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100 relative">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-niist-navy flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden ring-4 ring-amber-50">
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                getInitials(profile?.name)
              )}
            </div>
            <label className="absolute inset-0 bg-black/50 text-white rounded-full flex justify-center items-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10 text-xs text-center p-2 font-medium">
              Update Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={saving} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile?.name}
            </h2>
            <p className="text-gray-500 text-sm">
              {profile?.designation}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                👑 HOD (Administrator)
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee ID</label>
            <p className="font-mono text-gray-900 font-semibold mt-1">{profile?.employee_id}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</label>
            <p className="text-gray-900 mt-1">Computer Science & Engineering</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Member Since</label>
            <p className="text-gray-900 mt-1">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
            </p>
          </div>
        </div>

        {/* HOD Editable Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3 border-t border-gray-100 pt-6 mt-4">
            <h3 className="font-semibold text-gray-700">Profile Information</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-sm text-niist-blue hover:underline font-medium">✏️ Edit Profile</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setError(''); }} className="text-sm text-gray-500 hover:underline">Cancel</button>
                <button onClick={handleUpdate} disabled={saving} className="text-sm bg-niist-navy text-white px-4 py-1.5 rounded-lg hover:bg-niist-blue disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name Field (HOD only) */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Full Name</label>
              {editing ? (
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue" placeholder="Full name" />
              ) : (
                <p className="text-gray-900 font-semibold">{profile?.name}</p>
              )}
            </div>

            {/* Designation Field (HOD only) */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Designation</label>
              {editing ? (
                <select value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue">
                  <option value="">Select designation</option>
                  <option value="Principal">Principal</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="HOD">Head of Department</option>
                </select>
              ) : (
                <p className="text-gray-900">{profile?.designation}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Phone Number</label>
              {editing ? (
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue" placeholder="Phone number" />
              ) : (
                <p className="text-gray-900 font-mono">{profile?.phone}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Email Address</label>
              {editing ? (
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue" placeholder="Email address" />
              ) : (
                <p className="text-gray-900">{profile?.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center bg-blue-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-niist-navy">{profile?.subjects_assigned || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Subjects Assigned</p>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-700">{profile?.notes_uploaded || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Notes Uploaded</p>
          </div>
          <div className="text-center bg-amber-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-700">{profile?.assignments_created || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Assignments Created</p>
          </div>
          <div className="text-center bg-purple-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-purple-700">{profile?.notices_posted || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Notices Posted</p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-700">Change Password</h3>
            <p className="text-xs text-gray-400 mt-0.5">Keep your account secure</p>
          </div>
          {!changingPassword && (
            <button onClick={() => setChangingPassword(true)} className="text-sm bg-niist-navy text-white px-4 py-2 rounded-lg hover:bg-niist-blue transition-colors">
              Change Password
            </button>
          )}
        </div>

        {changingPassword && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Current Password</label>
              <input type="password" value={passwordData.current_password} onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue" placeholder="Current password" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">New Password</label>
              <input type="password" value={passwordData.new_password} onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Confirm New Password</label>
              <input type="password" value={passwordData.confirm_password} onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-niist-blue" placeholder="Confirm password" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setChangingPassword(false); setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); setError(''); }} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handlePasswordChange} disabled={saving} className="flex-1 bg-niist-navy text-white py-2.5 rounded-lg text-sm hover:bg-niist-blue disabled:opacity-50">{saving ? 'Updating...' : 'Update Password'}</button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default HodProfile
