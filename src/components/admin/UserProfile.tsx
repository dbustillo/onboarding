import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, User, Building, Mail, Phone, Calendar, Upload, Download, CheckCircle, Clock, MessageSquare, FileText, Target, AlertCircle, Plus, Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Profile } from '../../lib/supabase';
import { DocumentUpload } from './DocumentUpload';
import OnboardingTasks from '../client/OnboardingTasks';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

interface OnboardingTask {
  id: string;
  category: string;
  task_name: string;
  task_description?: string;
  task_owner: 'INSPIRE' | 'CLIENT' | 'BOTH';
  status: 'not_started' | 'in_progress' | 'waiting_client' | 'waiting_admin' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  completed_at?: string;
  admin_notes?: string;
  client_notes?: string;
  sort_order: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface OnboardingInstance {
  id: string;
  current_phase: string;
  status: string;
  started_at: string;
  estimated_completion?: string;
  data: any;
}

interface ClientDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  is_signed: boolean;
  signed_at?: string;
  created_at: string;
  notes?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onBack }) => {
  const { profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingInstance | null>(null);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents'>('overview');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data for ID:', userId);
      console.log('User ID type:', typeof userId);
      setLoading(true);
      setError(null);
      
      // Try to fetch user profile using the admin function first
      const { data: profileData, error: profileError } = await supabase.rpc(
        'admin_get_user_profile_complete',
        { user_id: userId }
      );

      if (profileError) {
        console.error('Error using admin_get_user_profile_complete:', profileError);
        
        // Fallback to direct query
        console.log('Falling back to direct profile query');
        const { data: directProfileData, error: directProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (directProfileError) {
          console.error('Direct profile query failed:', directProfileError);
          setError(`User profile not found. User ID: ${userId}`);
          setLoading(false);
          return;
        } else {
          console.log('Direct profile query succeeded:', directProfileData);
          setProfile(directProfileData);
        }
      } else if (profileData && profileData.length > 0) {
        console.log('Admin function returned data:', profileData);
        // Extract profile data from the comprehensive result
        const userData = profileData[0];
        setProfile({
          id: userData.profile_id,
          email: userData.email,
          full_name: userData.full_name,
          company_name: userData.company_name,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          avatar_url: userData.avatar_url,
          created_at: userData.profile_created_at,
          updated_at: userData.profile_updated_at
        });
        
        // Set onboarding data if available
        if (userData.onboarding_id) {
          setOnboarding({
            id: userData.onboarding_id,
            current_phase: userData.current_phase,
            status: userData.onboarding_status,
            started_at: userData.started_at,
            estimated_completion: userData.estimated_completion,
            data: {}
          });
        }
      } else {
        console.error('No profile data returned from either method');
        setError(`User profile not found. User ID: ${userId}`);
        setLoading(false);
        return;
      }

      // If we don't have onboarding data yet, try to fetch it directly
      if (!onboarding) {
        console.log('Fetching onboarding data directly');
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('client_onboarding')
          .select('*')
          .eq('client_id', userId)
          .maybeSingle();

        if (!onboardingError && onboardingData) {
          setOnboarding(onboardingData);
        }
      }

      // If we have onboarding data, fetch tasks
      if (onboarding) {
        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('onboarding_tasks')
          .select('*')
          .eq('onboarding_id', onboarding.id)
          .order('sort_order', { ascending: true });

        if (!tasksError) {
          setTasks(tasksData || []);
        }
      }
      
      // Fetch documents using the RPC function to bypass RLS
      await fetchDocuments();
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while loading user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents for client ID:', userId);
      console.log('Using get_client_documents RPC function');
      
      // Use the RPC function that bypasses RLS
      const { data: documentsData, error: documentsError } = await supabase
        .rpc('get_client_documents', { p_client_id: userId });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        console.log('Falling back to direct documents query');
        
        // Fallback to direct query
        const { data: directDocsData, error: directDocsError } = await supabase
          .from('client_documents')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false });
          
        if (directDocsError) {
          console.error('Direct documents query failed:', directDocsError);
        } else {
          console.log('Direct documents query succeeded:', directDocsData);
          setDocuments(directDocsData || []);
        }
      } else {
        console.log('Documents fetched successfully:', documentsData);
        setDocuments(documentsData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: OnboardingTask['status']) => {
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
      
      // Refresh tasks
      fetchUserData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const updateTaskNotes = async (taskId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update({ admin_notes: notes })
        .eq('id', taskId);

      if (error) throw error;
      
      setEditingTask(null);
      setTaskNotes('');
      fetchUserData();
    } catch (error) {
      console.error('Error updating task notes:', error);
    }
  };

  const handleUploadComplete = (document: any) => {
    console.log('Document upload completed:', document);
    // Add the new document to the documents array
    setDocuments(prev => [document, ...prev]);
    setShowUploadModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'waiting_client': return 'text-yellow-600 bg-yellow-50';
      case 'waiting_admin': return 'text-orange-600 bg-orange-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'blocked': return <AlertCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Error</h2>
          <p className="text-red-600 mb-6 text-sm">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchUserData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
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
                <p className="text-blue-100 text-sm">User Profile</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-300"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.full_name || 'Unnamed User'}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {profile.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {profile.phone}
                  </div>
                )}
                {profile.company_name && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {profile.company_name}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.status === 'active' ? 'bg-green-100 text-green-800' :
                profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {profile.status}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Role: {profile.role}
              </p>
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'tasks', label: 'Tasks', icon: Target },
            { id: 'client-tasks', label: 'Client Tasks View', icon: CheckCircle },
            { id: 'documents', label: 'Documents', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Onboarding Status */}
          {onboarding && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Phase</label>
                  <p className="text-lg text-gray-900 capitalize">
                    {onboarding.current_phase.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    onboarding.status === 'completed' ? 'bg-green-100 text-green-800' :
                    onboarding.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {onboarding.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Started</label>
                  <p className="text-gray-900">
          <OnboardingTasks 
            clientId={userId} 
            onboardingId={onboarding?.id || null} 
          />

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.is_signed).length}
                </div>
                <div className="text-sm text-gray-600">Signed Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {documents.length}
                </div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Onboarding Tasks</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h4 className="text-lg font-medium text-gray-900">
                        {task.task_name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.task_description && (
                      <p className="text-gray-600 mb-3">{task.task_description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>Owner: {task.task_owner}</span>
                      <span>Category: {task.category}</span>
                      {task.due_date && (
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Admin Notes */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                        {editingTask === task.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateTaskNotes(task.id, taskNotes)}
                              className="text-green-600 hover:text-green-500"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTask(null);
                                setTaskNotes('');
                              }}
                              className="text-gray-600 hover:text-gray-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTask(task.id);
                              setTaskNotes(task.admin_notes || '');
                            }}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {editingTask === task.id ? (
                        <textarea
                          value={taskNotes}
                          onChange={(e) => setTaskNotes(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          rows={3}
                          placeholder="Add admin notes..."
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">
                          {task.admin_notes || 'No notes added'}
                        </p>
                      )}
                    </div>

                    {/* Client Notes */}
                    {task.client_notes && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700">Client Notes</label>
                        <p className="text-gray-600 text-sm">{task.client_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="ml-4">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as OnboardingTask['status'])}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_client">Waiting Client</option>
                      <option value="waiting_admin">Waiting Admin</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No tasks found for this user.
              </div>
            )}
          </div>
        </div>
      )}

        {activeTab === 'client-tasks' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="font-semibold text-blue-800">Client Task View</h4>
                  <p className="text-blue-700 text-sm">This shows exactly what the client sees in their dashboard</p>
                </div>
              </div>
            </div>
            
            {onboarding ? (
              <OnboardingTasks 
                clientId={userId} 
                onboardingId={onboarding.id} 
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Onboarding Found</h3>
                <p className="text-gray-600">
                  This client doesn't have an active onboarding process yet.
                </p>
              </div>
            )}
          </div>
        )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Document Upload */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Client Documents</h3>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </button>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Documents ({documents.length})</h3>
                <button 
                  onClick={() => fetchDocuments()}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {doc.file_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.status}
                      </span>
                      
                      {doc.is_signed && (
                        <a
                          href={doc.file_url}
                          download={doc.file_name}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Signed
                          </a>
                      )}
                      
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        View
                      </a>
                    </div>
                  </div>
                  
                  {doc.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">{doc.notes}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {documents.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No documents found for this user.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          clientId={userId}
          onboardingId={onboarding?.id}
          adminUserId={currentUserProfile?.id || ''}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      </div>
    </div>
  );
};