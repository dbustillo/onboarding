import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Users, ClipboardList, Settings, LogOut, CheckCircle, XCircle, Clock, Mail, Building, Phone, User, AlertCircle, FileText, Plus, Loader2 } from 'lucide-react';
import { supabase, Profile } from '../../lib/supabase';
import { UserProfile } from './UserProfile';
import { TaskTemplateManager } from './TaskTemplateManager';
import { ClientOnboardingSetup } from './ClientOnboardingSetup';

interface PendingUser {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const { profile, handleSignOutClick, signingOut } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'users' | 'tasks' | 'onboarding'>('users');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all users and pending users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching users as admin:', profile?.email);
      
      // Check if this is the hardcoded admin
      const isHardcodedAdmin = profile?.email === 'darwin@komento.asia' && profile?.id === 'admin-hardcoded-id';
      
      let profiles;
      let profilesError;
      
      if (isHardcodedAdmin) {
        console.log('🔧 Using admin function for hardcoded admin');
        // Use the admin function that bypasses RLS
        const { data, error } = await supabase.rpc('admin_get_all_profiles');
        profiles = data;
        profilesError = error;
      } else {
        console.log('🔍 Using regular query for database admin');
        // Regular query for actual database users
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        profiles = data;
        profilesError = error;
      }

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        setMessage({ 
          type: 'error', 
          text: `Error fetching users: ${profilesError.message}` 
        });
        return;
      }

      console.log('✅ Successfully fetched profiles:', profiles?.length);
      setAllUsers(profiles || []);
      
      // Filter pending users
      const pending = profiles?.filter(user => user.status === 'pending') || [];
      setPendingUsers(pending);
      
      console.log('📊 Stats - Total users:', profiles?.length, 'Pending:', pending.length);
    } catch (error) {
      console.error('💥 Exception in fetchUsers:', error);
      setMessage({ 
        type: 'error', 
        text: 'Unexpected error while fetching users' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (userEmail: string) => {
    try {
      setActionLoading(userEmail);
      console.log('Approving user:', userEmail);

      // Check if this is the hardcoded admin
      const isHardcodedAdmin = profile?.email === 'darwin@komento.asia' && profile?.id === 'admin-hardcoded-id';
      
      let error;
      
      if (isHardcodedAdmin) {
        console.log('🔧 Using admin function for hardcoded admin');
        const result = await supabase.rpc('admin_update_user_status', {
          user_email: userEmail,
          new_status: 'approved'
        });
        error = result.error;
      } else {
        const result = await supabase.rpc('approve_user', {
          user_email: userEmail
        });
        error = result.error;
      }

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: `Successfully approved ${userEmail}` });
      
      // Refresh the users list
      await fetchUsers();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error approving user:', error);
      setMessage({ type: 'error', text: `Error approving user: ${error.message}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const promoteToAdmin = async (userEmail: string) => {
    try {
      setActionLoading(userEmail);
      console.log('Promoting user to admin:', userEmail);

      // Check if this is the hardcoded admin
      const isHardcodedAdmin = profile?.email === 'darwin@komento.asia' && profile?.id === 'admin-hardcoded-id';
      
      let error;
      
      if (isHardcodedAdmin) {
        console.log('🔧 Using admin function for hardcoded admin');
        const result = await supabase.rpc('admin_update_user_status', {
          user_email: userEmail,
          new_status: 'approved',
          new_role: 'admin'
        });
        error = result.error;
      } else {
        const result = await supabase.rpc('promote_to_admin', {
          user_email: userEmail
        });
        error = result.error;
      }

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: `Successfully promoted ${userEmail} to admin` });
      
      // Refresh the users list
      await fetchUsers();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error promoting user:', error);
      setMessage({ type: 'error', text: `Error promoting user: ${error.message}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const suspendUser = async (userEmail: string) => {
    try {
      setActionLoading(userEmail);
      console.log('Suspending user:', userEmail);

      // Check if this is the hardcoded admin
      const isHardcodedAdmin = profile?.email === 'darwin@komento.asia' && profile?.id === 'admin-hardcoded-id';
      
      let error;
      
      if (isHardcodedAdmin) {
        console.log('🔧 Using admin function for hardcoded admin');
        const result = await supabase.rpc('admin_update_user_status', {
          user_email: userEmail,
          new_status: 'suspended'
        });
        error = result.error;
      } else {
        const result = await supabase
          .from('profiles')
          .update({ status: 'suspended' })
          .eq('email', userEmail);
        error = result.error;
      }

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: `Successfully suspended ${userEmail}` });
      
      // Refresh the users list
      await fetchUsers();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error suspending user:', error);
      setMessage({ type: 'error', text: `Error suspending user: ${error.message}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'client': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    totalClients: allUsers.filter(u => u.role === 'client').length,
    pendingApprovals: pendingUsers.length,
    activeUsers: allUsers.filter(u => u.status === 'approved' || u.status === 'active').length,
    admins: allUsers.filter(u => u.role === 'admin').length
  };

  // If a user is selected, show their profile 
  if (selectedUserId) { 
    return (
      <UserProfile 
        userId={selectedUserId} 
        onBack={() => setSelectedUserId(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-400 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/Untitled design (34).png" 
                alt="Inspire Logistics Logo"
                className="w-12 h-12 rounded-full shadow-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-blue-100 text-sm">Welcome back, {profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={handleSignOutClick}
              disabled={signingOut}
              className="flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
            >
              <LogOut className="mr-2" size={16} />
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mx-4 mt-4 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="mr-2" size={20} />
            ) : (
              <AlertCircle className="mr-2" size={20} />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('users')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="mr-2" size={16} />
              Users
            </button>
            <button
              onClick={() => setActiveView('onboarding')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'onboarding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="mr-2" size={16} />
              Create Onboarding
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content based on active view */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'users' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-xl border border-cyan-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl">
                <Users className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-yellow-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                <Clock className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-500 rounded-xl">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl">
                <Shield className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-800">{stats.admins}</p>
              </div>
            </div>
          </div>
            </div>

            {/* Pending Approvals Section */}
            {pendingUsers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-yellow-100 mb-8">
                <div className="p-6 border-b border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mr-4 shadow-lg">
                        <Clock className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Pending Approvals</h3>
                        <p className="text-gray-600 text-sm">Users waiting for account approval</p>
                      </div>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pendingUsers.length} pending
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                            <User className="text-white" size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {user.full_name || 'Unnamed User'}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {user.email}
                              </div>
                              {user.company_name && (
                                <div className="flex items-center">
                                  <Building className="w-4 h-4 mr-1" />
                                  {user.company_name}
                                </div>
                              )}
                              {user.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              Registered: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => approveUser(user.email)}
                            disabled={actionLoading === user.email}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg"
                          >
                            {actionLoading === user.email ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => promoteToAdmin(user.email)}
                            disabled={actionLoading === user.email}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg"
                          >
                            {actionLoading === user.email ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Shield className="w-4 h-4 mr-2" />
                            )}
                            Make Admin
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Users Management */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl mr-4 shadow-lg">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">All Users</h3>
                      <p className="text-gray-600 text-sm">Manage all user accounts and permissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {allUsers.length} total users
                    </span>
                    <button
                      onClick={fetchUsers}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-600">
                    No users have been registered yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            user.role === 'admin' 
                              ? 'bg-gradient-to-r from-purple-600 to-purple-500' 
                              : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="text-white" size={20} />
                            ) : (
                              <User className="text-white" size={20} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {user.full_name || 'Unnamed User'}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                {user.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {user.email}
                              </div>
                              {user.company_name && (
                                <div className="flex items-center">
                                  <Building className="w-4 h-4 mr-1" />
                                  {user.company_name}
                                </div>
                              )}
                              {user.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* View Profile Button */}
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Profile
                          </button>
                          
                          {/* Action Buttons */}
                          {user.status === 'pending' && (
                            <button
                              onClick={() => approveUser(user.email)}
                              disabled={actionLoading === user.email}
                              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              {actionLoading === user.email ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {user.role !== 'admin' && user.status !== 'pending' && (
                            <button
                              onClick={() => promoteToAdmin(user.email)}
                              disabled={actionLoading === user.email}
                              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              {actionLoading === user.email ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {user.status !== 'suspended' && user.email !== profile?.email && (
                            <button
                              onClick={() => suspendUser(user.email)}
                              disabled={actionLoading === user.email}
                              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              {actionLoading === user.email ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {activeView === 'onboarding' && <TaskTemplateManager />}
      </div>
    </div>
  );
};