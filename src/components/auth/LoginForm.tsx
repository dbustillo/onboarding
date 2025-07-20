import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Shield, User } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      if (isAdminMode) {
        setError('Invalid admin credentials. Please check your email and password.');
      } else {
        if (error.message.includes('No account found')) {
          setError('No account found with this email and password. Please sign up first or check your credentials.');
        } else {
          setError(error.message || 'The email or password you entered is incorrect. Please double-check your credentials.');
        }
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-cyan-100 p-6 sm:p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl shadow-lg">
            {isAdminMode ? <Shield className="text-white" size={24} /> : <LogIn className="text-white" size={24} />}
          </div>
        </div>
        <h2 className={`text-2xl font-bold bg-clip-text text-transparent ${isAdminMode ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-blue-900 to-cyan-400'}`}>
          {isAdminMode ? 'Admin Access' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isAdminMode ? 'Sign in with admin credentials' : 'Sign in to your account'}
        </p>
      </div>

      {/* User/Admin Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-xl">
          <button
            type="button"
            onClick={() => setIsAdminMode(false)}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
              !isAdminMode 
                ? 'bg-gradient-to-r from-blue-900 to-cyan-400 text-white shadow-lg' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <User size={16} className="mr-2" />
            User
          </button>
          <button
            type="button"
            onClick={() => setIsAdminMode(true)}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
              isAdminMode 
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg' 
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Shield size={16} className="mr-2" />
            Admin
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
          <AlertCircle className="text-red-600 mr-3" size={20} />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {isAdminMode && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center mb-2">
            <Shield className="text-red-600 mr-2" size={16} />
            <span className="text-red-800 font-semibold text-sm">Admin Mode</span>
          </div>
          <p className="text-red-700 text-xs">
            Use admin credentials to access the admin dashboard with full system control.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> You must sign up first to create an account, then wait for admin approval before you can sign in.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                isAdminMode 
                  ? 'border-red-200 focus:ring-4 focus:ring-red-200 focus:border-red-400' 
                  : 'border-gray-200 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400'
              }`}
              placeholder={isAdminMode ? "Admin email" : "Enter your email"}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                isAdminMode 
                  ? 'border-red-200 focus:ring-4 focus:ring-red-200 focus:border-red-400' 
                  : 'border-gray-200 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400'
              }`}
              placeholder={isAdminMode ? "Admin password" : "Enter your password"}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            isAdminMode 
              ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400' 
              : 'bg-gradient-to-r from-blue-900 to-cyan-400 hover:from-blue-800 hover:to-cyan-300'
          }`}
        >
          {loading ? 'Signing In...' : (isAdminMode ? 'Admin Sign In' : 'Sign In')}
        </button>
      </form>

      {!isAdminMode && (
        <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Sign up here
          </button>
        </p>
        </div>
      )}
    </div>
  );
};