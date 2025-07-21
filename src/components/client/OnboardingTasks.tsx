import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle, 
  Clock, AlertCircle, ChevronDown, ChevronUp, MessageSquare, 
  CheckSquare, Calendar, User, Building, ArrowRight,
  Target, FileText, Loader2
} from 'lucide-react';

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
  sort_order: number;
  metadata: any;
}

interface OnboardingTasksProps {
  clientId: string;
  onboardingId: string | null;
}

const OnboardingTasks: React.FC<OnboardingTasksProps> = ({ clientId, onboardingId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [editingTask, setEditingTask] = useState<string | null>(null);

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
    'Inventory & Inbounding',
    'Pilot Run & User Acceptance (UAT)',
    'Pilot Run & User Acceptance Testing',
    'GO LIVE'
  ];

  const sortedCategories = Object.keys(groupedTasks).sort((a, b) => {
    const indexA = categoryOrder.findIndex(cat => a.includes(cat) || cat.includes(a));
    const indexB = categoryOrder.findIndex(cat => b.includes(cat) || cat.includes(b));
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  useEffect(() => {
    if (onboardingId) {
      fetchTasks();
    }
  }, [onboardingId]);

  const fetchTasks = async () => {
    if (!onboardingId) return;
    
    console.log('Fetching tasks for onboarding ID:', onboardingId);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('onboarding_id', onboardingId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      console.log('Tasks fetched:', data?.length || 0);
      setTasks(data || []);
      
      // Initialize task notes from existing client notes
      const initialNotes: Record<string, string> = {};
      data?.forEach(task => {
        if (task.client_notes) {
          initialNotes[task.id] = task.client_notes;
        } else {
          initialNotes[task.id] = '';
        }
      });
      setTaskNotes(initialNotes);
      
      // Initialize expanded categories
      const initialExpandedCategories: Record<string, boolean> = {};
      const uniqueCategories = [...new Set(data?.map(task => task.category) || [])];
      uniqueCategories.forEach((category, index) => {
        // Expand the first category by default
        initialExpandedCategories[category] = index === 0;
        console.log('Setting category expanded state:', category, index === 0);
      });
      setExpandedCategories(initialExpandedCategories);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'waiting_client': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'waiting_admin': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'waiting_client': return <User className="w-4 h-4" />;
      case 'waiting_admin': return <Building className="w-4 h-4" />;
      case 'blocked': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOwnerColor = (owner: string) => {
    switch (owner) {
      case 'CLIENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INSPIRE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BOTH': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryProgress = (category: string) => {
    const categoryTasks = groupedTasks[category] || [];
    const completedTasks = categoryTasks.filter(task => task.status === 'completed').length;
    return categoryTasks.length > 0 ? Math.round((completedTasks / categoryTasks.length) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  if (!onboardingId || tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-yellow-100 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Onboarding Tasks</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            There are no onboarding tasks assigned yet. Please contact your account manager for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedCategories.map(category => {
        const categoryTasks = groupedTasks[category] || [];
        const progress = getCategoryProgress(category);
        const isExpanded = expandedCategories[category] || false;
        
        return (
          <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                  {getCategoryIcon(category)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <div className="flex items-center mt-1">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{progress}% Complete</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 mr-3">
                  {categoryTasks.filter(t => t.status === 'completed').length} / {categoryTasks.length} Tasks
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {/* Tasks List */}
            {isExpanded && (
              <div className="divide-y divide-gray-200">
                {categoryTasks.map(task => (
                  <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <Clock className="w-5 h-5 text-blue-500 mr-2" />
                          )}
                          <h4 className="text-lg font-medium text-gray-900">{task.task_name}</h4>
                        </div>
                        
                        {task.task_description && (
                          <p className="text-gray-600 mb-3">{task.task_description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            <span className="mr-1">{getStatusIcon(task.status)}</span>
                            {task.status.replace('_', ' ')}
                          </span>
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOwnerColor(task.task_owner)}`}>
                            {task.task_owner}
                          </span>
                          
                          {task.due_date && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              <Calendar className="w-3 h-3 mr-1" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Admin Notes */}
                        {task.admin_notes && (
                          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center mb-1">
                              <Building className="w-4 h-4 text-purple-600 mr-1" />
                              <span className="text-sm font-medium text-purple-800">Admin Notes:</span>
                            </div>
                            <p className="text-sm text-purple-700">{task.admin_notes}</p>
                          </div>
                        )}
                        
                        {/* Client Notes */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center">
                              <MessageSquare className="w-4 h-4 text-blue-600 mr-1" />
                              Your Notes:
                            </label>
                            {editingTask === task.id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => updateTaskNotes(task.id)}
                                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingTask(null)}
                                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingTask(task.id)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                {task.client_notes ? 'Edit Notes' : 'Add Notes'}
                              </button>
                            )}
                          </div>
                          
                          {editingTask === task.id ? (
                            <textarea
                              value={taskNotes[task.id] || ''}
                              onChange={(e) => setTaskNotes({...taskNotes, [task.id]: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows={3}
                              placeholder="Add your notes, questions, or updates for this task..."
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                              {task.client_notes ? (
                                <p className="text-sm text-gray-700">{task.client_notes}</p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No notes added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingTasks;