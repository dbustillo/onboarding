import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Building, Phone, AlertCircle, CheckCircle, Shield } from 'lucide-react';

interface SignUpFormProps {
  onToggleMode: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    company_name: '',
    phone: ''
  });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Admin signup is not allowed through this form
    if (isAdminMode) {
      setError('Admin accounts cannot be created through signup. Please contact system administrator.');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      company_name: formData.company_name,
      phone: formData.phone
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      // Don't set loading to false here - let the auth context handle the redirect
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-6 sm:p-8 max-w-md w-full">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-green-500 rounded-xl shadow-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your account has been created and is pending approval from our admin team. 
            You'll receive an email notification once your account is approved.
          </p>
          <button
            onClick={onToggleMode}
            className="w-full bg-gradient-to-r from-blue-900 to-cyan-400 text-white py-3 rounded-xl font-bold hover:from-blue-800 hover:to-cyan-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-cyan-100 p-6 sm:p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-xl shadow-lg ${isAdminMode ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-blue-900 to-cyan-400'}`}>
            {isAdminMode ? <Shield className="text-white" size={24} /> : <UserPlus className="text-white" size={24} />}
          </div>
        </div>
        <h2 className={`text-2xl font-bold bg-clip-text text-transparent ${isAdminMode ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-blue-900 to-cyan-400'}`}>
          {isAdminMode ? 'Admin Registration' : 'Create Account'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isAdminMode ? 'Admin accounts require special authorization' : 'Join our client portal'}
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
            <span className="text-red-800 font-semibold text-sm">Admin Registration Disabled</span>
          </div>
          <p className="text-red-700 text-xs">
            Admin accounts cannot be created through public signup. Please contact the system administrator for admin access.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className={`space-y-4 ${isAdminMode ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Enter your full name"
              required={!isAdminMode}
              disabled={isAdminMode}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Enter your company name"
              disabled={isAdminMode}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Enter your phone number"
              disabled={isAdminMode}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Enter your email"
              required={!isAdminMode}
              disabled={isAdminMode}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Create a password"
              required={!isAdminMode}
              disabled={isAdminMode}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Confirm your password"
              required={!isAdminMode}
              disabled={isAdminMode}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isAdminMode}
          className={`w-full text-white py-3 rounded-xl font-bold transition-all duration-300 transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            isAdminMode 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-900 to-cyan-400 hover:from-blue-800 hover:to-cyan-300 hover:scale-105'
          }`}
        >
          {loading ? 'Creating Account...' : (isAdminMode ? 'Admin Signup Disabled' : 'Create Account')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};