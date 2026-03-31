import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Mail, Lock, Eye, EyeOff, Loader2, Fingerprint } from 'lucide-react';

const Login = () => {
  const [tab, setTab] = useState('faculty');
  const [email, setEmail] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = tab === 'faculty' 
        ? { email, password } 
        : { enrollment_no: enrollmentNo, password };

      const response = await api.post('/auth/login', payload);
      const { token, user } = response.data;
      login(token, user);

      if (user.role === 'faculty' && user.is_hod) {
        navigate('/hod/dashboard');
      } else if (user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-[#1B3A6B] p-12 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-lg flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-4xl font-bold text-[#1B3A6B]">N</span>
          </div>
          <h1 className="text-white text-4xl font-bold mb-4 font-sans tracking-wide">NIIST Academia</h1>
          <p className="text-blue-200 text-lg mb-2 text-opacity-90">
            NRI Institute of Information Science and Technology
          </p>
          <p className="text-blue-300 text-sm mb-12">
            Bhopal, MP · RGPV Affiliated
          </p>
          
          <div className="mt-auto pt-8">
            <p className="text-white italic opacity-80 text-sm tracking-wide">
              Smart Academic Management System
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-white z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-[#1B3A6B] mb-2 font-sans">Welcome Back</h2>
          </div>

          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => { setTab('faculty'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors rounded-t-lg ${
                tab === 'faculty' 
                  ? 'bg-[#1B3A6B] text-white my-[-1px] rounded-t-lg border-b-0' 
                  : 'bg-white text-[#1B3A6B] border border-b-0 border-gray-200 border-x-0 outline-none'
              }`}
            >
              Faculty Login
            </button>
            <button
              onClick={() => { setTab('student'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors rounded-t-lg ${
                tab === 'student' 
                  ? 'bg-[#1B3A6B] text-white my-[-1px] rounded-t-lg border-b-0' 
                  : 'bg-white text-[#1B3A6B] border border-b-0 border-gray-200 border-x-0 outline-none'
              }`}
            >
              Student Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {tab === 'faculty' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1 font-sans">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#2563EB]" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 font-sans border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm outline-none bg-gray-50 focus:bg-white"
                    placeholder="faculty@niist.ac.in"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1 font-sans">Enrollment Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Fingerprint className="h-5 w-5 text-gray-400 group-focus-within:text-[#2563EB]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm outline-none bg-gray-50 focus:bg-white uppercase"
                    placeholder="e.g. 0115CS221001"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1 font-sans">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#2563EB]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm outline-none bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[#DC2626] text-sm font-medium bg-red-50 p-3 rounded border border-red-100 font-sans">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1B3A6B] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B3A6B] disabled:opacity-70 transition-all font-sans"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Default password format:
            <br />
            Faculty: NIIST@EmployeeID
            <br />
            Student: NIIST@Last4Digits
            <br />
            Change password anytime from your Profile page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
