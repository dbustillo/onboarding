import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, CheckCircle, Clock, AlertCircle, Download, Eye, Calendar, User, Building, Mail, Phone, Bell, Settings, BarChart3, FileCheck, Upload, PenTool, ExternalLink, LogOut, ChevronDown, ChevronUp, MessageSquare, Target, CheckSquare, ArrowRight } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
}

interface OnboardingData {
  id: string;
  current_phase: string;
  status: string;
  started_at: string;
  estimated_completion: string | null;
  contract_signed_at: string | null;
  go_live_at: string | null;
}

interface Task {
  id: string;
  task_name: string;
  task_description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  category: string;
  task_owner: string;
  client_notes: string | null;
  admin_notes: string | null;
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
  notes: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
  action_url: string | null;
}

interface GoogleDriveResource {
  id: string;
  resource_type: string;
  title: string;
  description: string | null;
  google_url: string;
  is_client_accessible: boolean;
  is_required: boolean;
  access_level: string;
  created_at: string;
}

const ClientDashboard: React.FC = () => {
  const { user, handleSignOutClick, signingOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [googleResources, setGoogleResources] = useState<GoogleDriveResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [signingDocument, setSigningDocument] = useState<Document | null>(null); 
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Order categories based on the onboarding flow
  const categoryOrder = [
    'Pre-Onboarding',
    'Tech & Marketplace Integration',
    'Tech & Integrations',
    'Inventory & Inbounding',
    'Pilot Run & User Acceptance (UAT)',
    'GO LIVE'
  ];

  const sortedCategories = Object.keys(groupedTasks).sort((a, b) => {
    const indexA = categoryOrder.findIndex(cat => a.includes(cat) || cat.includes(a));
    const indexB = categoryOrder.findIndex(cat => b.includes(cat) || cat.includes(b));
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  const fetchClientData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('client_onboarding')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to avoid PGRST116 error

      if (!onboardingError && onboardingData) {
        setOnboarding(onboardingData);

        // Fetch tasks for this onboarding
        const { data: tasksData, error: tasksError } = await supabase
          .from('onboarding_tasks')
          .select('*')
          .eq('onboarding_id', onboardingData.id)
          .order('sort_order', { ascending: true });

        if (!tasksError && tasksData) {
          setTasks(tasksData);
          
          // Initialize task notes from existing client notes
          const initialNotes: Record<string, string> = {};
          tasksData.forEach(task => {
            initialNotes[task.id] = task.client_notes || '';
          });
          setTaskNotes(initialNotes);
          
          // Initialize expanded categories
          const initialExpandedCategories: Record<string, boolean> = {};
          const uniqueCategories = [...new Set(tasksData.map(task => task.category))];
          uniqueCategories.forEach((category, index) => {
            // Expand the first category by default
            initialExpandedCategories[category] = index === 0;
          });
          setExpandedCategories(initialExpandedCategories);
        }
        
        // Fetch Google Drive resources for this onboarding
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('google_drive_resources')
          .select('*')
          .eq('onboarding_id', onboardingData.id)
          .eq('is_client_accessible', true)
          .order('created_at', { ascending: false });

        if (!resourcesError && resourcesData) {
          setGoogleResources(resourcesData);
        }
      }

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (!documentsError && documentsData) {
        setDocuments(documentsData);
      }

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!notificationsError && notificationsData) {
        setNotifications(notificationsData);
      }

    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'completed' | 'in_progress') => {
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
      
      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null
              }
            : task
        )
      );
      
      setToastMessage(`Task marked as ${newStatus === 'completed' ? 'complete' : 'in progress'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error updating task status:', error);
      setToastMessage('Failed to update task status');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const updateTaskNotes = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update({ client_notes: taskNotes[taskId] })
        .eq('id', taskId);

      if (error) throw error;
      
      setToastMessage('Notes updated successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task notes:', error);
      setToastMessage('Failed to update notes');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('pre-onboarding')) return <CheckSquare className="w-5 h-5" />;
    if (category.toLowerCase().includes('tech') || category.toLowerCase().includes('integration')) return <Building className="w-5 h-5" />;
    if (category.toLowerCase().includes('inventory')) return <Building className="w-5 h-5" />;
    if (category.toLowerCase().includes('pilot') || category.toLowerCase().includes('uat')) return <Target className="w-5 h-5" />;
    if (category.toLowerCase().includes('go live')) return <ArrowRight className="w-5 h-5" />;
    return <CheckSquare className="w-5 h-5" />;
  };

  const getCategoryProgress = (category: string) => {
    const categoryTasks = groupedTasks[category] || [];
    const completedTasks = categoryTasks.filter(task => task.status === 'completed').length;
    return categoryTasks.length > 0 ? Math.round((completedTasks / categoryTasks.length) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'waiting_client':
        return 'text-orange-600 bg-orange-50';
      case 'waiting_admin':
        return 'text-purple-600 bg-purple-50';
      case 'blocked':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPhaseProgress = (phase: string) => {
    const phases = ['pre_onboarding', 'tech_integrations', 'inventory', 'pilot', 'go_live', 'completed'];
    const currentIndex = phases.indexOf(phase);
    return ((currentIndex + 1) / phases.length) * 100;
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read_at: new Date().toISOString() }
          : notif
      )
    );
  };

  const openPdfSigner = (document: Document) => {
    // Set the document to be signed
    setSigningDocument(document);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Client Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{profile?.full_name || profile?.email}</span>
              </div>
              <button
                onClick={handleSignOutClick}
                disabled={signingOut}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Client'}!
          </h2>
          <p className="text-gray-600">
            Track your onboarding progress and manage your account.
          </p>
        </div>

        {/* Progress Overview */}
        {onboarding && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Onboarding Progress</h3>
              <span className="text-sm text-gray-500">
                Phase: {onboarding.current_phase.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getPhaseProgress(onboarding.current_phase)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Started:</span>
                <p className="font-medium">{new Date(onboarding.started_at).toLocaleDateString()}</p>
              </div>
              {onboarding.estimated_completion && (
                <div>
                  <span className="text-gray-500">Est. Completion:</span>
                  <p className="font-medium">{new Date(onboarding.estimated_completion).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium capitalize">{onboarding.status.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'resources', label: 'Resources', icon: FileText },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Drive Resources */}
            {googleResources.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Onboarding Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {googleResources.map(resource => (
                    <div key={resource.id} className="border border-green-200 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{resource.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          resource.is_required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {resource.is_required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                      )}
                      <a
                        href={resource.google_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Onboarding Doc
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-semibold">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Tasks</span>
                  <span className="font-semibold text-green-600">
                    {tasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Tasks</span>
                  <span className="font-semibold text-orange-600">
                    {tasks.filter(t => t.status === 'waiting_client').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-semibold">{documents.length}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {notifications.slice(0, 5).map(notification => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {sortedCategories.map(category => (
              <div key={category} className="bg-white rounded-lg shadow-sm">
                <div 
                  className="p-4 border-b cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(category)}
                      <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                      <span className="text-sm text-gray-500">
                        ({groupedTasks[category]?.filter(t => t.status === 'completed').length || 0}/
                        {groupedTasks[category]?.length || 0})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getCategoryProgress(category)}%` }}
                        ></div>
                      </div>
                      {expandedCategories[category] ? 
                        <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </div>
                </div>
                
                {expandedCategories[category] && (
                  <div className="p-4">
                    <div className="space-y-4">
                      {groupedTasks[category]?.map(task => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{task.task_name}</h4>
                              {task.task_description && (
                                <p className="text-sm text-gray-600 mb-2">{task.task_description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm">
                                <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority.toUpperCase()}
                                </span>
                                {task.due_date && (
                                  <span className="text-gray-500">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Task Actions */}
                            {(task.task_owner === 'CLIENT' || task.task_owner === 'BOTH') && (
                              <div className="ml-4 flex flex-col space-y-2">
                                {task.status !== 'completed' ? (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Mark Complete
                                  </button>
                                ) : (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Completed
                                  </div>
                                )}
                                
                                {task.status === 'completed' && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                                  >
                                    Reopen
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Client Notes Section */}
                          <div className="mt-4 border-t pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">Your Notes</label>
                              {editingTask === task.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => updateTaskNotes(task.id)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingTask(null)}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingTask(task.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            {editingTask === task.id ? (
                              <textarea
                                value={taskNotes[task.id] || ''}
                                onChange={(e) => setTaskNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                rows={3}
                                placeholder="Add your notes about this task..."
                              />
                            ) : (
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md min-h-[60px]">
                                {taskNotes[task.id] || 'No notes added yet. Click Edit to add notes.'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h3>
              <div className="space-y-4">
                {documents.map(document => (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{document.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {document.document_type} • {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        document.status === 'signed' ? 'bg-green-100 text-green-800' :
                        document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {document.status}
                      </span>
                      {document.is_signed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <button
                        onClick={() => window.open(document.file_url, '_blank')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {document.status === 'pending' && !document.is_signed && (
                        <button
                          onClick={() => openPdfSigner(document)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Sign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No documents available yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Resources</h3>
              <div className="space-y-4">
                {googleResources.map(resource => (
                  <div key={resource.id} className="border border-green-200 rounded-lg p-6 bg-gradient-to-r from-green-50 to-blue-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FileText className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{resource.title}</h4>
                          <p className="text-sm text-gray-600">
                            {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)} • 
                            Access: {resource.access_level}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        resource.is_required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {resource.is_required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    
                    {resource.description && (
                      <p className="text-gray-700 mb-4">{resource.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Added: {new Date(resource.created_at).toLocaleDateString()}
                      </div>
                      <a
                        href={resource.google_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Onboarding Doc
                      </a>
                    </div>
                  </div>
                ))}
                
                {googleResources.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Available</h3>
                    <p className="text-gray-600">
                      Your onboarding resources will appear here once they're added by your account manager.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg ${notification.read_at ? 'bg-gray-50' : 'bg-blue-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No notifications yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {showToast && toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;