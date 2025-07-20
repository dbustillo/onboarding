import React, { useState } from 'react';
import { Shield, User, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AdminPromotion: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const promoteToAdmin = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.rpc('promote_to_admin', {
        user_email: email.trim()
      });

      if (error) {
        throw error;
      }

      setMessage(`Successfully promoted ${email} to admin!`);
      setMessageType('success');
      setEmail('');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.rpc('approve_user', {
        user_email: email.trim()
      });

      if (error) {
        throw error;
      }

      setMessage(`Successfully approved ${email}!`);
      setMessageType('success');
      setEmail('');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cyan-100 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl shadow-lg">
              <Shield className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600">Promote users to admin or approve pending accounts</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300"
              placeholder="Enter user email"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="text-green-600 mr-3" size={20} />
              ) : (
                <AlertCircle className="text-red-600 mr-3" size={20} />
              )}
              <span className={`text-sm ${
                messageType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message}
              </span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={promoteToAdmin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-900 to-cyan-400 text-white py-3 rounded-xl font-bold hover:from-blue-800 hover:to-cyan-300 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Promote to Admin'}
            </button>

            <button
              onClick={approveUser}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-bold hover:from-green-500 hover:to-green-400 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Approve User'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• <strong>Promote to Admin:</strong> Makes user an admin and approves them</li>
              <li>• <strong>Approve User:</strong> Approves a pending user as a regular client</li>
              <li>• Users must sign up first before you can promote/approve them</li>
              <li>• Admin users can access the admin dashboard</li>
            </ul>
          </div>

          <div className="text-center">
            <a 
              href="/"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};