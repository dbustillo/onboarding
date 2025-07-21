import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle, 
  Clock, AlertCircle, ChevronDown, ChevronUp, MessageSquare, 
  CheckSquare, Calendar, User, Building, ArrowRight,
  Target, FileText, Loader2, Edit, Save, X, Plus, Trash2
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
  isAdminView?: boolean;
}

// Default task structure based on your screenshots
const DEFAULT_TASK_STRUCTURE = {
  'Pre-Onboarding': [
    {
      name: 'Client Service Requirements',
      description: 'Define and document client service requirements and expectations',
      targetDate: '2025-Jun-27',
      priority: 'high',
      owner: 'CLIENT'
    },
    {
      name: 'SLA & Pricing Sign-off',
      description: 'Review and approve Service Level Agreement and pricing structure',
      targetDate: '2025-Jul-02',
      priority: 'critical',
      owner: 'BOTH'
    },
    {
      name: 'Primary and secondary contacts (Sales, Tech, Ops)',
      description: 'Identify primary and secondary contact persons for ongoing communication',
      targetDate: '',
      priority: 'high',
      owner: 'CLIENT'
    },
    {
      name: 'Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)',
      description: 'Assign internal team members for different aspects of onboarding',
      targetDate: '',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Contact channels or chat groups created (Viber or Whatsapp)',
      description: 'Set up communication channels for ongoing collaboration',
      targetDate: '',
      priority: 'medium',
      owner: 'BOTH'
    },
    {
      name: 'Client logo (for branding needs)',
      description: 'Obtain client logo and branding materials',
      targetDate: '2025-Jul-01',
      priority: 'medium',
      owner: 'CLIENT'
    },
    {
      name: 'Escalation protocol (key persons for issues or concerns)',
      description: 'Define escalation procedures and key contacts',
      targetDate: '',
      priority: 'medium',
      owner: 'BOTH'
    },
    {
      name: 'Raw export of product file from current provider',
      description: 'For product data matching by Inspire team, to avoid issues during marketplace integration',
      targetDate: 'N/A',
      priority: 'medium',
      owner: 'CLIENT'
    },
    {
      name: 'Product Classification: Fast-moving / Average / Slow-moving',
      description: 'Categorize products for optimal warehouse management',
      targetDate: '',
      priority: 'medium',
      owner: 'CLIENT'
    },
    {
      name: 'Packaging specs provided (sample video, if available)',
      description: 'Provide packaging requirements and specifications',
      targetDate: '',
      priority: 'medium',
      owner: 'CLIENT'
    },
    {
      name: 'Marketplace user access shared with Inspire Team for system integration',
      description: 'Grant access for marketplace integration setup',
      targetDate: '2025-Jul-02',
      priority: 'high',
      owner: 'CLIENT'
    },
    {
      name: 'Sandbox system access (to be provided by Inspire)',
      description: 'Provide testing environment access',
      targetDate: '',
      priority: 'medium',
      owner: 'INSPIRE'
    },
    {
      name: 'Client Data Room access (Google Drive document storage)',
      description: 'Set up secure document sharing environment',
      targetDate: '',
      priority: 'medium',
      owner: 'INSPIRE'
    }
  ],
  'Tech & Integrations': [
    {
      name: 'Lazada, Shopee, TikTok Shop, Shopify, etc. connected',
      description: 'Connect all marketplace and e-commerce platforms',
      targetDate: '',
      priority: 'critical',
      owner: 'INSPIRE'
    },
    {
      name: 'API keys or plugin access granted (Shopify only)',
      description: 'Provide necessary API access for Shopify integration',
      targetDate: '',
      priority: 'high',
      owner: 'CLIENT'
    },
    {
      name: 'Channel-specific mapping validated',
      description: 'Validate product mapping across all channels',
      targetDate: '',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Marketplace Integration testing',
      description: 'Test all marketplace integrations thoroughly',
      targetDate: '',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Live order testing with warehouse team',
      description: 'Conduct end-to-end order testing',
      targetDate: '',
      priority: 'critical',
      owner: 'BOTH'
    }
  ],
  'Inventory & Inbounding': [
    {
      name: 'Product transfer scheduled (ASN created by the Client)',
      description: 'Schedule and create Advanced Shipping Notice for product transfer',
      targetDate: '2025-Jul-05',
      priority: 'critical',
      owner: 'CLIENT'
    },
    {
      name: 'Warehouse receiving orders created in WMS (ASN received by Inspire Team)',
      description: 'Process receiving orders in Warehouse Management System',
      targetDate: '2025-Jul-09',
      priority: 'critical',
      owner: 'INSPIRE'
    },
    {
      name: 'Product Inspection & Verification (QA by Inspire Team)',
      description: 'Conduct quality assurance and product verification',
      targetDate: '2025-Jul-09',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Physical receiving completed (by Inspire Team)',
      description: 'Complete physical receipt and documentation',
      targetDate: '2025-Jul-09',
      priority: 'critical',
      owner: 'INSPIRE'
    },
    {
      name: 'QA completed (quantity, damage, labeling) (by Inspire Team)',
      description: 'Complete quality assurance checks',
      targetDate: '2025-Jul-09',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Products mapped to correct put-away zones (by Inspire Team)',
      description: 'Map products to appropriate warehouse zones',
      targetDate: '2025-Jul-09',
      priority: 'medium',
      owner: 'INSPIRE'
    },
    {
      name: 'Stock put-away logged in system (by Inspire Team)',
      description: 'Log all inventory in warehouse management system',
      targetDate: '2025-Jul-09',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Initial picking and packing process defined (by Inspire Team)',
      description: 'Establish picking and packing procedures',
      targetDate: '2025-Jul-09',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Packaging materials prepared (SKUs needing boxes, fillers, etc.) (by Inspire Team)',
      description: 'Prepare all necessary packaging materials',
      targetDate: '2025-Jul-09',
      priority: 'medium',
      owner: 'INSPIRE'
    },
    {
      name: 'Returns intake process agreed (restocking vs disposal)',
      description: 'Define returns handling procedures',
      targetDate: '',
      priority: 'medium',
      owner: 'BOTH'
    }
  ],
  'Pilot Run & User Acceptance Testing': [
    {
      name: 'Simulate small batch orders from each marketplace',
      description: 'Test order processing with small batches',
      targetDate: '2025-Jul-09',
      priority: 'critical',
      owner: 'BOTH'
    },
    {
      name: 'Cross-functional observation (CS, WH, Tech, Client)',
      description: 'Conduct comprehensive testing with all stakeholders',
      targetDate: '2025-Jul-09',
      priority: 'high',
      owner: 'BOTH'
    },
    {
      name: 'Notes on gaps or improvement opportunities',
      description: 'Document any issues or optimization opportunities',
      targetDate: '2025-Jul-09',
      priority: 'medium',
      owner: 'BOTH'
    },
    {
      name: 'Sign-off from client team post-pilot',
      description: 'Obtain client approval after pilot testing',
      targetDate: '2025-Jul-09',
      priority: 'critical',
      owner: 'CLIENT'
    },
    {
      name: 'Internal validation: Ops, WH, Tech (by Inspire Team)',
      description: 'Internal team validation and sign-off',
      targetDate: '2025-Jul-09',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Final tweaks to workflow or system settings',
      description: 'Make final adjustments based on pilot results',
      targetDate: '2025-Jul-09',
      priority: 'medium',
      owner: 'INSPIRE'
    }
  ],
  'GO LIVE': [
    {
      name: 'Go-live date confirmed and communicated',
      description: 'Finalize and communicate the go-live date',
      targetDate: '',
      priority: 'critical',
      owner: 'BOTH'
    },
    {
      name: 'All systems activated for live operations',
      description: 'Activate all systems for production use',
      targetDate: '',
      priority: 'critical',
      owner: 'INSPIRE'
    },
    {
      name: 'Monitoring and support protocols activated',
      description: 'Begin active monitoring and support',
      targetDate: '',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Client training completed',
      description: 'Complete all necessary client training',
      targetDate: '',
      priority: 'high',
      owner: 'INSPIRE'
    },
    {
      name: 'Post go-live review scheduled',
      description: 'Schedule follow-up review meeting',
      targetDate: '',
      priority: 'medium',
      owner: 'BOTH'
    }
  ]
};

const OnboardingTasks: React.FC<OnboardingTasksProps> = ({ clientId, onboardingId, isAdminView = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTaskData, setEditingTaskData] = useState<Partial<Task>>({});
  const [editingDates, setEditingDates] = useState<Record<string, { target: string; actual: string }>>({});

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
    'Tech & Integrations', 
    'Inventory & Inbounding',
    'Pilot Run & User Acceptance Testing',
    'GO LIVE'
  ];

  const sortedCategories = Object.keys(groupedTasks).length > 0 
    ? Object.keys(groupedTasks).sort((a, b) => {
        const indexA = categoryOrder.findIndex(cat => a.includes(cat) || cat.includes(a));
        const indexB = categoryOrder.findIndex(cat => b.includes(cat) || cat.includes(b));
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      })
    : categoryOrder;

  useEffect(() => {
    fetchTasks();
  }, [onboardingId]);

  const fetchTasks = async () => {
    console.log('Fetching tasks for onboarding ID:', onboardingId);
    try {
      setLoading(true);
      
      if (!onboardingId) {
        console.log('No onboarding ID provided, showing default structure');
        setTasks([]);
        
        // Initialize expanded categories for default structure
        const initialExpandedCategories: Record<string, boolean> = {};
        categoryOrder.forEach((category, index) => {
          initialExpandedCategories[category] = index === 0;
        });
        setExpandedCategories(initialExpandedCategories);
        setLoading(false);
        return;
      }
      
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
      const initialDates: Record<string, { target: string; actual: string }> = {};
      data?.forEach(task => {
        if (task.client_notes) {
          initialNotes[task.id] = task.client_notes;
        } else {
          initialNotes[task.id] = '';
        }
        
        // Initialize date editing state
        initialDates[task.id] = {
          target: task.due_date ? task.due_date.split('T')[0] : '',
          actual: task.completed_at ? task.completed_at.split('T')[0] : ''
        };
      });
      setTaskNotes(initialNotes);
      setEditingDates(initialDates);
      
      // Initialize expanded categories
      const initialExpandedCategories: Record<string, boolean> = {};
      const uniqueCategories = [...new Set(data?.map(task => task.category) || [])];
      uniqueCategories.forEach((category, index) => {
        initialExpandedCategories[category] = index === 0;
      });
      setExpandedCategories(initialExpandedCategories);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'completed' | 'in_progress' | 'not_started') => {
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
      
      setToastMessage(`Task marked as ${newStatus === 'completed' ? 'complete' : newStatus.replace('_', ' ')}`);
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

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('onboarding_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      
      setToastMessage('Task updated successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setEditingTask(null);
      setEditingTaskData({});
    } catch (error) {
      console.error('Error updating task:', error);
      setToastMessage('Failed to update task');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setToastMessage('Task deleted successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setToastMessage('Failed to delete task');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const addNewTask = async (category: string) => {
    if (!onboardingId) return;
    
    try {
      const categoryTasks = tasks.filter(t => t.category === category);
      const maxSortOrder = Math.max(...categoryTasks.map(t => t.sort_order), -1);
      
      const { data, error } = await supabase.rpc('admin_add_onboarding_task', {
        p_onboarding_id: onboardingId,
        p_category: category,
        p_task_name: 'New Task',
        p_task_description: 'Task description',
        p_task_owner: 'CLIENT',
        p_status: 'not_started',
        p_priority: 'medium',
        p_sort_order: maxSortOrder + 1,
        p_due_date: null,
        p_metadata: {}
      });

      if (error) throw error;
      
      setTasks(prev => [...prev, data]);
      setToastMessage('New task added');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error adding task:', error);
      setToastMessage('Failed to add task');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditingTaskData({
      task_name: task.task_name,
      task_description: task.task_description,
      priority: task.priority,
      task_owner: task.task_owner,
      status: task.status,
      due_date: task.due_date
    });
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

  // Show default structure when no onboarding exists or no tasks
  if (!onboardingId || tasks.length === 0) {
    return (
      <div className="space-y-6">
        {categoryOrder.map(category => {
          const defaultTasks = DEFAULT_TASK_STRUCTURE[category as keyof typeof DEFAULT_TASK_STRUCTURE] || [];
          const isExpanded = expandedCategories[category] || false;
          
          return (
            <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
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
                    {isAdminView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addNewTask(category);
                        }}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Task
                      </button>
                    )}
                    <div className="flex items-center mt-1">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div className="bg-gray-300 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">0% Complete</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 mr-3">
                    0 / {defaultTasks.length} Tasks
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="divide-y divide-gray-200">
                  {defaultTasks.map((task, index) => (
                    <div key={index} className="p-6 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Clock className="w-5 h-5 text-gray-400 mr-2" />
                            <h4 className="text-lg font-medium text-gray-700">{task.name}</h4>
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-600 mb-3">{task.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Not Started
                            </span>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOwnerColor(task.owner)}`}>
                              {task.owner}
                            </span>
                            
                            {task.targetDate && task.targetDate !== 'N/A' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <Calendar className="w-3 h-3 mr-1" />
                                Target: {task.targetDate}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Notes:</div>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg min-h-[60px]">
                              <p className="text-sm text-gray-400 italic">No notes added yet</p>
                            </div>
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
        
        {!onboardingId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-blue-800">
                {isAdminView ? 'No Onboarding Process Created' : 'No Onboarding Process'}
              </h3>
            </div>
            <p className="text-blue-700 mb-4">
              {isAdminView 
                ? 'This client doesn\'t have an active onboarding process yet. Go to "Create Onboarding" tab to set one up.'
                : 'This client doesn\'t have an active onboarding process yet. Please contact your account manager for assistance.'
              }
            </p>
          </div>
        )}
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
            {expandedCategories[category] && (
              <div className="p-4">
                <div className="space-y-4">
                  {groupedTasks[category]?.map(task => (
                    <div key={task.id} className="border rounded-lg p-4">
                      {/* Admin Editing Interface */}
                      {isAdminView && editingTask === task.id ? (
                        <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-blue-800">Editing Task</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateTask(task.id, editingTaskData)}
                                disabled={saving}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTask(null);
                                  setEditingTaskData({});
                                }}
                                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                              <input
                                type="text"
                                value={editingTaskData.task_name || ''}
                                onChange={(e) => setEditingTaskData(prev => ({ ...prev, task_name: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={editingTaskData.priority || 'medium'}
                                onChange={(e) => setEditingTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                              <select
                                value={editingTaskData.task_owner || 'CLIENT'}
                                onChange={(e) => setEditingTaskData(prev => ({ ...prev, task_owner: e.target.value as any }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="CLIENT">CLIENT</option>
                                <option value="INSPIRE">INSPIRE</option>
                                <option value="BOTH">BOTH</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={editingTaskData.status || 'not_started'}
                                onChange={(e) => setEditingTaskData(prev => ({ ...prev, status: e.target.value as any }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="waiting_client">Waiting Client</option>
                                <option value="waiting_admin">Waiting Admin</option>
                                <option value="completed">Completed</option>
                                <option value="blocked">Blocked</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                              <input
                                type="date"
                                value={editingTaskData.due_date ? editingTaskData.due_date.split('T')[0] : ''}
                                onChange={(e) => setEditingTaskData(prev => ({ 
                                  ...prev, 
                                  due_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                                }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={editingTaskData.task_description || ''}
                              onChange={(e) => setEditingTaskData(prev => ({ ...prev, task_description: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              rows={3}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                              {isAdminView && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startEditing(task)}
                                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {task.task_description && (
                              <p className="text-sm text-gray-600 mb-2">{task.task_description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mb-2">
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
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                              
                              {task.completed_at && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed: {new Date(task.completed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            
                            {/* Client Task Actions */}
                            {(task.task_owner === 'CLIENT' || task.task_owner === 'BOTH') && !isAdminView && (
                              <div className="ml-4 flex flex-col space-y-2">
                                {task.status !== 'completed' ? (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Mark Complete
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Mark In Progress
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                          
                      {/* Notes Section */}
                      <div className="mt-4 border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            {isAdminView ? 'Client Notes' : 'Your Notes'}
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
                  ))}
                  
                  {/* Add Task Button */}
                  {isAdminView && (
                    <button
                      onClick={() => addNewTask(category)}
                      className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 group"
                    >
                      <Plus className="text-gray-400 group-hover:text-blue-400 mr-2" size={16} />
                      <span className="text-gray-600 group-hover:text-blue-400 font-medium">
                        Add Task to {category}
                      </span>
                    </button>
                  )}
                </div>
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