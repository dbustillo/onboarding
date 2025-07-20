import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPage } from '../auth/AuthPage';
import { PendingApproval } from '../auth/PendingApproval';
import ClientDashboard from '../client/ClientDashboard';
import { AdminDashboard } from '../admin/AdminDashboard';
import { SupabaseSetup } from '../setup/SupabaseSetup';

export const AppLayout: React.FC = () => {
  const { user, profile, loading, signingOut, isAdmin, isClient, isApproved, handleSignOutClick, retryProfileFetch, skipProfileAndContinue } = useAuth();

  // Check if Supabase is configured
  const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && 
                           import.meta.env.VITE_SUPABASE_ANON_KEY &&
                           import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url_here';

  if (!hasSupabaseConfig) {
    return <SupabaseSetup />;
  }

  // Show loading ONLY when we have a user but are fetching their profile
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{signingOut ? 'Signing out...' : 'Loading your profile...'}</p>
          <p className="text-xs text-gray-500 mt-2">
            {signingOut ? 'Please wait while we sign you out...' : user ? `Fetching profile for ${user.email}...` : 'Checking authentication...'}
          </p>
          
          {/* Manual options if stuck loading */}
          {!signingOut && user && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
              <p className="text-sm text-yellow-800">
                Taking longer than expected? Try one of these options:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={retryProfileFetch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Retry Loading
                </button>
                <button
                  onClick={skipProfileAndContinue}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Skip & Continue
                </button>
                <button
                  onClick={handleSignOutClick}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Out & Restart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not authenticated - show sign in form
  if (!user || !profile) {
    return <AuthPage />;
  }

  // User is authenticated but pending approval
  if (!isApproved) {
    return <PendingApproval />;
  }

  // Route based on role
  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isClient) {
    return <ClientDashboard />;
  }

  // Fallback
  return <AuthPage />;
};