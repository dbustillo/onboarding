import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Mail, LogOut } from 'lucide-react';

export const PendingApproval: React.FC = () => {
  const { profile, handleSignOutClick, signingOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-yellow-100 p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
            <Clock className="text-white" size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Account Pending Approval
        </h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Welcome, {profile?.full_name}!</strong>
          </p>
          <p className="text-yellow-700 text-sm mt-2">
            Your account has been created successfully and is currently pending approval 
            from our admin team. You'll receive an email notification once your account is approved.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-center text-gray-600">
            <Mail className="mr-2" size={16} />
            <span className="text-sm">{profile?.email}</span>
          </div>
          {profile?.company_name && (
            <div className="text-gray-600">
              <span className="text-sm">{profile.company_name}</span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-blue-700 text-sm space-y-1 text-left">
            <li>• Our admin team will review your registration</li>
            <li>• You'll receive an email notification upon approval</li>
            <li>• Once approved, you can access your client dashboard</li>
            <li>• Begin your onboarding journey with us</li>
          </ul>
        </div>

        <button
          onClick={handleSignOutClick}
          disabled={signingOut}
          className="flex items-center justify-center w-full bg-gradient-to-r from-gray-600 to-gray-500 text-white py-3 rounded-xl font-bold hover:from-gray-500 hover:to-gray-400 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <LogOut className="mr-2" size={16} />
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>

        <div className="mt-6 text-xs text-gray-500">
          <p>Need immediate assistance?</p>
          <p>Contact us at <strong>support@inspiresolutions.asia</strong></p>
          
          {/* Admin Setup Access */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-blue-600 mb-2">Need admin access?</p>
            <a 
              href="/admin-setup"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors text-sm"
            >
              Go to Admin Setup →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};