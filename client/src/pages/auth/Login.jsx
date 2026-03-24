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
  const [success, setSuccess] = useState('');
  
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
      setSuccess('Login successful! Redirecting...');
      
      setTimeout(() => {
        if (user.is_first_login) {
          navigate('/change-password');
        } else if (user.role === 'faculty' && user.is_hod) {
          navigate('/hod/dashboard');
        } else if (user.role === 'faculty') {
          navigate('/faculty/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }, 500);

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center items-center w-[60%] bg-niist-navy p-12 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-niist-navy/80 z-0"></div>
        <div className="relative z-10 max-w-lg">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border-4 border-white/20">
            <span className="text-4xl font-black text-niist-navy tracking-tighter">NIIST</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">NRI Institute of Information Science & Technology</h1>
          <p className="text-2xl text-blue-200 mb-2 font-medium">Bhopal, MP</p>
          <p className="text-lg text-blue-300 font-medium mb-12 uppercase tracking-widest">RGPV Affiliated</p>
          
          <div className="inline-block border border-white/20 backdrop-blur-sm bg-white/10 px-6 py-3 rounded-full shadow-inner">
            <p className="text-sm font-semibold tracking-wider text-blue-50 uppercase">Smart Academic Management System</p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-8 bg-white shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.1)] z-10 relative">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-niist-navy mb-2 tracking-tight">NIIST Academia</h2>
            <p className="text-gray-500 font-medium text-sm">Welcome back! Please login to your account.</p>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-lg mb-8 shadow-inner">
            <button
              onClick={() => { setTab('faculty'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                tab === 'faculty' ? 'bg-white text-niist-navy shadow border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Faculty Login
            </button>
            <button
              onClick={() => { setTab('student'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                tab === 'student' ? 'bg-white text-niist-navy shadow border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Student Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {tab === 'faculty' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-niist-blue transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue focus:border-niist-blue sm:text-sm outline-none transition-shadow bg-gray-50 focus:bg-white"
                    placeholder="faculty@niist.ac.in"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Enrollment Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Fingerprint className="h-5 w-5 text-gray-400 group-focus-within:text-niist-blue transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue focus:border-niist-blue sm:text-sm outline-none transition-shadow bg-gray-50 focus:bg-white uppercase"
                    placeholder="e.g. 0115CS221001"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-niist-blue transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-niist-blue focus:border-niist-blue sm:text-sm outline-none transition-shadow bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-niist-navy hover:bg-niist-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-niist-blue transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In Securely'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Protected by secure connection.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
