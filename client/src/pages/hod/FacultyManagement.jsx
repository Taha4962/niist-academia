import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Search, Plus, Edit2, Eye, ShieldAlert, ShieldCheck, 
  Loader2, BookOpen, X, User, Mail, Phone, Briefcase, 
  Settings, Crown, Clock
} from 'lucide-react';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '', employee_id: '', phone: '', email: '', designation: 'Assistant Professor', is_hod: false
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Logs state for view modal
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hod/faculty');
      setFaculty(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch faculty list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const openAddModal = () => {
    setFormData({ name: '', employee_id: '', phone: '', email: '', designation: 'Assistant Professor', is_hod: false });
    setFormError('');
    setAddModal(true);
  };

  const openEditModal = (fac) => {
    setFormData({ 
      name: fac.name, 
      employee_id: fac.employee_id, 
      phone: fac.phone, 
      email: fac.email, 
      designation: fac.designation, 
      is_hod: fac.is_hod 
    });
    setFormError('');
    setEditModal(fac);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await api.post('/hod/faculty', formData);
      setAddModal(false);
      fetchFaculty();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await api.put(`/hod/faculty/${editModal.faculty_id}`, {
        name: formData.name,
        designation: formData.designation,
        is_hod: formData.is_hod
      });
      setEditModal(null);
      fetchFaculty();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (fac) => {
    try {
      if (fac.is_active) {
        setDeactivateModal(fac);
      } else {
        await api.put(`/hod/faculty/${fac.faculty_id}/activate`);
        fetchFaculty();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const confirmDeactivate = async () => {
    setFormLoading(true);
    try {
      await api.put(`/hod/faculty/${deactivateModal.faculty_id}/deactivate`);
      setDeactivateModal(null);
      fetchFaculty();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate');
    } finally {
      setFormLoading(false);
    }
  };

  const openViewModal = async (fac) => {
    setViewModal(fac);
    setLogsLoading(true);
    try {
      const res = await api.get(`/hod/faculty/${fac.faculty_id}/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-niist-navy">Faculty Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage department faculty accounts and roles</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-niist-blue focus:border-niist-blue"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-niist-navy hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Add Faculty</span>
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-gray-600">Total Active: {faculty.filter(f => f.is_active).length}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-sm font-medium text-gray-600">Inactive: {faculty.filter(f => !f.is_active).length}</span>
        </div>
      </div>

      {/* TABLE */}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">{error}</div>}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name & Designation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-niist-blue" />Loading faculty data...</td></tr>
              ) : filteredFaculty.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"><User className="w-8 h-8 text-gray-300 mx-auto mb-3" />No faculty members found.</td></tr>
              ) : (
                filteredFaculty.map((fac) => (
                  <tr key={fac.faculty_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">{fac.employee_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-niist-navy">{fac.name}</span>
                        {fac.is_hod && <Crown className="w-4 h-4 text-amber-500" title="HOD" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{fac.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{fac.phone}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{fac.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-niist-blue px-2.5 py-1 rounded-full text-xs font-semibold">
                        <BookOpen className="w-3.5 h-3.5" /> {fac.subject_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fac.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openViewModal(fac)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(fac)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(fac)} className={`p-1.5 rounded-lg transition-colors ${fac.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={fac.is_active ? "Deactivate" : "Activate"}>
                          {fac.is_active ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {(addModal || editModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1B3A6B] p-4 flex justify-between items-center text-white">
              <h3 className="font-semibold text-lg">{addModal ? 'Add New Faculty' : 'Edit Faculty Details'}</h3>
              <button onClick={() => { setAddModal(false); setEditModal(null); }} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={addModal ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4">
              {formError && <div className="text-red-600 bg-red-50 text-sm p-3 rounded-lg border border-red-100">{formError}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID *</label>
                  <input required name="employee_id" value={formData.employee_id} onChange={handleInputChange} disabled={!!editModal} className="w-full font-mono px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue outline-none disabled:bg-gray-100 uppercase" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                  <select name="designation" value={formData.designation} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue outline-none">
                    <option>Assistant Professor</option>
                    <option>Associate Professor</option>
                    <option>Professor</option>
                    <option>HOD</option>
                    <option>Lab Instructor</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} disabled={!!editModal} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue outline-none disabled:bg-gray-100" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input type="email" required name="email" value={formData.email} onChange={handleInputChange} disabled={!!editModal} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue outline-none disabled:bg-gray-100" />
                </div>
              </div>

              {editModal && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                  <ShieldAlert className="inline w-3 h-3 mr-1" /> Phone and Email cannot be changed by HOD. Faculty can update their own profile.
                </p>
              )}

              <div className="pt-2 border-t mt-4 flex items-center justify-between">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_hod" checked={formData.is_hod} onChange={handleInputChange} className="w-4 h-4 text-niist-blue rounded focus:ring-niist-blue" />
                    <span className="text-sm font-semibold text-gray-800">Grant HOD Access</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-0.5">Allows unrestricted access to all modules</p>
                </div>
              </div>

              {addModal && formData.employee_id && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
                  <p className="text-sm text-blue-800 flex items-center gap-2"><Lock className="w-4 h-4"/> Default password will be:</p>
                  <p className="font-mono text-center font-bold text-niist-navy my-1">NIIST@{formData.employee_id.toUpperCase()}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t">
                <button type="button" onClick={() => { setAddModal(false); setEditModal(null); }} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-niist-navy hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-70">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : addModal ? 'Add Faculty' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-gradient-to-r from-niist-navy to-blue-800 p-6 text-white flex justify-between items-start shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-md">
                   {viewModal.name.charAt(0)}
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold flex items-center gap-2">
                     {viewModal.name}
                     {viewModal.is_hod && <Crown className="w-5 h-5 text-amber-400" />}
                   </h2>
                   <p className="text-blue-100 font-medium">{viewModal.designation}</p>
                   <p className="text-sm font-mono text-blue-200 mt-1">ID: {viewModal.employee_id}</p>
                 </div>
               </div>
               <button onClick={() => setViewModal(null)} className="text-white/70 hover:text-white p-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="overflow-y-auto p-6 flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Email</p>
                    <p className="text-sm font-medium text-gray-900">{viewModal.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Phone</p>
                    <p className="text-sm font-medium text-gray-900">{viewModal.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-3">Academic Activity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <BookOpen className="w-6 h-6 text-niist-blue mx-auto mb-2" />
                      <p className="text-2xl font-black text-niist-navy">{viewModal.subject_count || 0}</p>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Subjects</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100 opacity-50">
                      <Settings className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-black text-green-800">-</p>
                      <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">Assignments</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100 opacity-50">
                      <Briefcase className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <p className="text-2xl font-black text-amber-800">-</p>
                      <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Notices</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-3">Recent Login History</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {logsLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/> Loading...</div>
                    ) : logs.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No recent logins.</div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {logs.slice(0,5).map(log => (
                          <li key={log.log_id} className="p-3 text-sm flex justify-between items-center">
                            <span className="flex items-center gap-2 text-gray-600 font-mono"><Clock className="w-4 h-4 text-gray-400"/> {new Date(log.logged_at).toLocaleString()}</span>
                            <span className="text-gray-500 font-mono text-xs">{log.ip_address || 'Unknown IP'}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {log.status.toUpperCase()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRMATION MODAL */}
      {deactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Deactivate Account?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to deactivate <strong className="text-gray-900">{deactivateModal.name}</strong>? 
                They will be immediately logged out and unable to access the system.
              </p>
              
              <div className="bg-red-50 text-red-700 text-xs text-left p-3 rounded border border-red-100 mb-6 font-medium">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Login blocked immediately</li>
                  <li>All past records are preserved</li>
                  <li>Can be reactivated later</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setDeactivateModal(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold transition-colors">Cancel</button>
                <button onClick={confirmDeactivate} disabled={formLoading} className="flex-1 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold transition-colors flex justify-center items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyManagement;
