import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  User,
  Building,
  Users,
  FileText,
  ArrowRight,
  CheckSquare
} from 'lucide-react';

interface Task {
  id?: string;
  task_name: string;
  task_description: string;
  category: string;
  task_owner: 'CLIENT' | 'INSPIRE' | 'BOTH';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'waiting_client' | 'waiting_admin' | 'completed' | 'blocked';
  due_date: string | null;
  completed_at: string | null;
  admin_notes: string | null;
  client_notes: string | null;
  sort_order: number;
  metadata: any;
}

interface AdminTaskManagerProps {
  clientId: string;
  onboardingId: string | null;
  onTasksChange?: () => void;
}

// Default task template structure
const DEFAULT_TASK_TEMPLATE = {
  'Pre-Onboarding': [
    {
      task_name: 'Client Service Requirements',
      task_description: 'Define and document client service requirements and expectations',
      task_owner: 'CLIENT' as const,
      priority: 'high' as const,
      due_date: '2025-06-27'
    },
    {
      task_name: 'SLA & Pricing Sign-off',
      task_description: 'Review and approve Service Level Agreement and pricing structure',
      task_owner: 'BOTH' as const,
      priority: 'critical' as const,
      due_date: '2025-07-02'
    },
    {
      task_name: 'Primary and secondary contacts (Sales, Tech, Ops)',
      task_description: 'Identify primary and secondary contact persons for ongoing communication',
      task_owner: 'CLIENT' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)',
      task_description: 'Assign internal team members for different aspects of onboarding',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Contact channels or chat groups created (Viber or Whatsapp)',
      task_description: 'Set up communication channels for ongoing collaboration',
      task_owner: 'BOTH' as const,
      priority: 'medium' as const,
      due_date: null
    },
    {
      task_name: 'Client logo (for branding needs)',
      task_description: 'Obtain client logo and branding materials',
      task_owner: 'CLIENT' as const,
      priority: 'medium' as const,
      due_date: '2025-07-01'
    },
    {
      task_name: 'Escalation protocol (key persons for issues or concerns)',
      task_description: 'Define escalation procedures and key contacts',
      task_owner: 'BOTH' as const,
      priority: 'medium' as const,
      due_date: null
    },
    {
      task_name: 'Raw export of product file from current provider',
      task_description: 'For product data matching by Inspire team, to avoid issues during marketplace integration',
      task_owner: 'CLIENT' as const,
      priority: 'medium' as const,
      due_date: null
    },
    {
      task_name: 'Product Classification: Fast-moving / Average / Slow-moving',
      task_description: 'Categorize products for optimal warehouse management',
      task_owner: 'CLIENT' as const,
      priority: 'medium' as const,
      due_date: null
    },
    {
      task_name: 'Packaging specs provided (sample video, if available)',
      task_description: 'Provide packaging requirements and specifications',
      task_owner: 'CLIENT' as const,
      priority: 'medium' as const,
      due_date: null
    },
    {
      task_name: 'Marketplace user access shared with Inspire Team for system integration',
      task_description: 'Grant access for marketplace integration setup',
      task_owner: 'CLIENT' as const,
      priority: 'high' as const,
      due_date: '2025-07-02'
    },
    {
      task_name: 'Sandbox system access (to be provided by Inspire)',
      task_description: 'Provide testing environment access',
      task_owner: 'INSPIRE' as const,
      priority: 'medium' as const,
      due_date: null
    },
    {
      task_name: 'Client Data Room access (Google Drive document storage)',
      task_description: 'Set up secure document sharing environment',
      task_owner: 'INSPIRE' as const,
      priority: 'medium' as const,
      due_date: null
    }
  ],
  'Tech & Integrations': [
    {
      task_name: 'Lazada, Shopee, TikTok Shop, Shopify, etc. connected',
      task_description: 'Connect all marketplace and e-commerce platforms',
      task_owner: 'INSPIRE' as const,
      priority: 'critical' as const,
      due_date: null
    },
    {
      task_name: 'API keys or plugin access granted (Shopify only)',
      task_description: 'Provide necessary API access for Shopify integration',
      task_owner: 'CLIENT' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Channel-specific mapping validated',
      task_description: 'Validate product mapping across all channels',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Marketplace Integration testing',
      task_description: 'Test all marketplace integrations thoroughly',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Live order testing with warehouse team',
      task_description: 'Conduct end-to-end order testing',
      task_owner: 'BOTH' as const,
      priority: 'critical' as const,
      due_date: null
    }
  ],
  'Inventory & Inbounding': [
    {
      task_name: 'Product transfer scheduled (ASN created by the Client)',
      task_description: 'Schedule and create Advanced Shipping Notice for product transfer',
      task_owner: 'CLIENT' as const,
      priority: 'critical' as const,
      due_date: '2025-07-05'
    },
    {
      task_name: 'Warehouse receiving orders created in WMS (ASN received by Inspire Team)',
      task_description: 'Process receiving orders in Warehouse Management System',
      task_owner: 'INSPIRE' as const,
      priority: 'critical' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Product Inspection & Verification (QA by Inspire Team)',
      task_description: 'Conduct quality assurance and product verification',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Physical receiving completed (by Inspire Team)',
      task_description: 'Complete physical receipt and documentation',
      task_owner: 'INSPIRE' as const,
      priority: 'critical' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'QA completed (quantity, damage, labeling) (by Inspire Team)',
      task_description: 'Complete quality assurance checks',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Products mapped to correct put-away zones (by Inspire Team)',
      task_description: 'Map products to appropriate warehouse zones',
      task_owner: 'INSPIRE' as const,
      priority: 'medium' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Stock put-away logged in system (by Inspire Team)',
      task_description: 'Log all inventory in warehouse management system',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Initial picking and packing process defined (by Inspire Team)',
      task_description: 'Establish picking and packing procedures',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Packaging materials prepared (SKUs needing boxes, fillers, etc.) (by Inspire Team)',
      task_description: 'Prepare all necessary packaging materials',
      task_owner: 'INSPIRE' as const,
      priority: 'medium' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Returns intake process agreed (restocking vs disposal)',
      task_description: 'Define returns handling procedures',
      task_owner: 'BOTH' as const,
      priority: 'medium' as const,
      due_date: null
    }
  ],
  'Pilot Run & User Acceptance Testing': [
    {
      task_name: 'Simulate small batch orders from each marketplace',
      task_description: 'Test order processing with small batches',
      task_owner: 'BOTH' as const,
      priority: 'critical' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Cross-functional observation (CS, WH, Tech, Client)',
      task_description: 'Conduct comprehensive testing with all stakeholders',
      task_owner: 'BOTH' as const,
      priority: 'high' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Notes on gaps or improvement opportunities',
      task_description: 'Document any issues or optimization opportunities',
      task_owner: 'BOTH' as const,
      priority: 'medium' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Sign-off from client team post-pilot',
      task_description: 'Obtain client approval after pilot testing',
      task_owner: 'CLIENT' as const,
      priority: 'critical' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Internal validation: Ops, WH, Tech (by Inspire Team)',
      task_description: 'Internal team validation and sign-off',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: '2025-07-09'
    },
    {
      task_name: 'Final tweaks to workflow or system settings',
      task_description: 'Make final adjustments based on pilot results',
      task_owner: 'INSPIRE' as const,
      priority: 'medium' as const,
      due_date: '2025-07-09'
    }
  ],
  'GO LIVE': [
    {
      task_name: 'Go-live date confirmed and communicated',
      task_description: 'Finalize and communicate the go-live date',
      task_owner: 'BOTH' as const,
      priority: 'critical' as const,
      due_date: null
    },
    {
      task_name: 'All systems activated for live operations',
      task_description: 'Activate all systems for production use',
      task_owner: 'INSPIRE' as const,
      priority: 'critical' as const,
      due_date: null
    },
    {
      task_name: 'Monitoring and support protocols activated',
      task_description: 'Begin active monitoring and support',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Client training completed',
      task_description: 'Complete all necessary client training',
      task_owner: 'INSPIRE' as const,
      priority: 'high' as const,
      due_date: null
    },
    {
      task_name: 'Post go-live review scheduled',
      task_description: 'Schedule follow-up review meeting',
      task_owner: 'BOTH' as const,
      priority: 'medium' as const,
      due_date: null
    }
  ]
};

export const AdminTaskManager: React.FC<AdminTaskManagerProps> = ({ 
  clientId, 
  onboardingId, 
  onTasksChange 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const categoryOrder = [
    'Pre-Onboarding',
    'Tech & Integrations',
    'Inventory & Inbounding',
    'Pilot Run & User Acceptance Testing',
    'GO LIVE'
  ];

  useEffect(() => {
    fetchTasks();
  }, [onboardingId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      if (!onboardingId) {
        // Show default template structure
        const defaultTasks: Task[] = [];
        let sortOrder = 0;
        
        Object.entries(DEFAULT_TASK_TEMPLATE).forEach(([category, categoryTasks]) => {
          categoryTasks.forEach((task) => {
            defaultTasks.push({
              task_name: task.task_name,
              task_description: task.task_description,
              category,
              task_owner: task.task_owner,
              priority: task.priority,
              status: 'not_started',
              due_date: task.due_date,
              completed_at: null,
              admin_notes: null,
              client_notes: null,
              sort_order: sortOrder++,
              metadata: {}
            });
          });
        });
        
        setTasks(defaultTasks);
        
        // Initialize expanded categories
        const initialExpanded: Record<string, boolean> = {};
        categoryOrder.forEach((category, index) => {
          initialExpanded[category] = index === 0;
        });
        setExpandedCategories(initialExpanded);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('onboarding_id', onboardingId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setTasks(data || []);
      
      // Initialize expanded categories
      const initialExpanded: Record<string, boolean> = {};
      const uniqueCategories = [...new Set(data?.map(task => task.category) || [])];
      uniqueCategories.forEach((category, index) => {
        initialExpanded[category] = index === 0;
      });
      setExpandedCategories(initialExpanded);
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToastMessage('Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const createOnboardingIfNeeded = async () => {
    if (onboardingId) return onboardingId;
    
    try {
      // Create onboarding record first
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('client_onboarding')
        .insert({
          client_id: clientId,
          current_phase: 'pre_onboarding',
          status: 'in_progress',
          estimated_completion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (onboardingError) throw onboardingError;
      
      return onboardingData.id;
    } catch (error) {
      console.error('Error creating onboarding:', error);
      throw error;
    }
  };

  const saveTask = async (task: Task) => {
    try {
      setSaving(true);
      
      const currentOnboardingId = await createOnboardingIfNeeded();
      
      if (task.id) {
        // Update existing task
        const { error } = await supabase
          .from('onboarding_tasks')
          .update({
            task_name: task.task_name,
            task_description: task.task_description,
            category: task.category,
            task_owner: task.task_owner,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            completed_at: task.completed_at,
            admin_notes: task.admin_notes,
            sort_order: task.sort_order
          })
          .eq('id', task.id);

        if (error) throw error;
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('onboarding_tasks')
          .insert({
            onboarding_id: currentOnboardingId,
            task_name: task.task_name,
            task_description: task.task_description,
            category: task.category,
            task_owner: task.task_owner,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            completed_at: task.completed_at,
            admin_notes: task.admin_notes,
            sort_order: task.sort_order,
            metadata: task.metadata || {}
          })
          .select()
          .single();

        if (error) throw error;
        
        // Update local state with new ID
        setTasks(prev => prev.map(t => 
          t === task ? { ...task, id: data.id } : t
        ));
      }
      
      showToastMessage('Task saved successfully');
      if (onTasksChange) onTasksChange();
      
    } catch (error) {
      console.error('Error saving task:', error);
      showToastMessage('Error saving task');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!taskId || !onboardingId) return;
    
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToastMessage('Task deleted successfully');
      if (onTasksChange) onTasksChange();
      
    } catch (error) {
      console.error('Error deleting task:', error);
      showToastMessage('Error deleting task');
    }
  };

  const addNewTask = (category: string) => {
    const categoryTasks = tasks.filter(t => t.category === category);
    const maxSortOrder = Math.max(...categoryTasks.map(t => t.sort_order), -1);
    
    const newTask: Task = {
      task_name: 'New Task',
      task_description: 'Task description',
      category,
      task_owner: 'CLIENT',
      priority: 'medium',
      status: 'not_started',
      due_date: null,
      completed_at: null,
      admin_notes: null,
      client_notes: null,
      sort_order: maxSortOrder + 1,
      metadata: {}
    };
    
    setTasks(prev => [...prev, newTask]);
    setEditingTask(`new-${Date.now()}`);
  };

  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newTask: Task = {
      task_name: 'New Task',
      task_description: 'Task description',
      category: newCategoryName.trim(),
      task_owner: 'CLIENT',
      priority: 'medium',
      status: 'not_started',
      due_date: null,
      completed_at: null,
      admin_notes: null,
      client_notes: null,
      sort_order: tasks.length,
      metadata: {}
    };
    
    setTasks(prev => [...prev, newTask]);
    setExpandedCategories(prev => ({ ...prev, [newCategoryName.trim()]: true }));
    setNewCategoryName('');
    setEditingCategory(null);
  };

  const updateTask = (index: number, updates: Partial<Task>) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
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
    const categoryTasks = tasks.filter(t => t.category === category);
    const completedTasks = categoryTasks.filter(t => t.status === 'completed').length;
    return categoryTasks.length > 0 ? Math.round((completedTasks / categoryTasks.length) * 100) : 0;
  };

  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task, index) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push({ ...task, index });
    return acc;
  }, {} as Record<string, (Task & { index: number })[]>);

  const sortedCategories = Object.keys(groupedTasks).length > 0 
    ? Object.keys(groupedTasks).sort((a, b) => {
        const indexA = categoryOrder.findIndex(cat => a.includes(cat) || cat.includes(a));
        const indexB = categoryOrder.findIndex(cat => b.includes(cat) || cat.includes(b));
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      })
    : categoryOrder;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Category Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Onboarding Task Management</h3>
        <div className="flex items-center space-x-3">
          {editingCategory ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={addNewCategory}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingCategory('new')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* Categories and Tasks */}
      {sortedCategories.map(category => {
        const categoryTasks = groupedTasks[category] || [];
        const progress = getCategoryProgress(category);
        const isExpanded = expandedCategories[category] || false;
        
        return (
          <div key={category} className="bg-white rounded-lg shadow border border-gray-200">
            {/* Category Header */}
            <div 
              className="p-4 border-b cursor-pointer hover:bg-gray-50"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                    <div className="flex items-center mt-1">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{progress}% Complete</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addNewTask(category);
                    }}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Task
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    {categoryTasks.filter(t => t.status === 'completed').length} / {categoryTasks.length} Tasks
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Tasks List */}
            {isExpanded && (
              <div className="divide-y divide-gray-200">
                {categoryTasks.map(task => (
                  <div key={task.index} className="p-6">
                    <div className="space-y-4">
                      {/* Task Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-blue-500" />
                            )}
                            <input
                              type="text"
                              value={task.task_name}
                              onChange={(e) => updateTask(task.index, { task_name: e.target.value })}
                              className="text-lg font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1 flex-1"
                            />
                          </div>
                          
                          <textarea
                            value={task.task_description}
                            onChange={(e) => updateTask(task.index, { task_description: e.target.value })}
                            className="w-full text-gray-600 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1 resize-none"
                            rows={2}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => saveTask(task)}
                            disabled={saving}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          {task.id && (
                            <button
                              onClick={() => deleteTask(task.id!)}
                              className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Task Properties */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.index, { 
                              status: e.target.value as Task['status'],
                              completed_at: e.target.value === 'completed' ? new Date().toISOString() : null
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_client">Waiting Client</option>
                            <option value="waiting_admin">Waiting Admin</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(task.index, { priority: e.target.value as Task['priority'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        {/* Owner */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                          <select
                            value={task.task_owner}
                            onChange={(e) => updateTask(task.index, { task_owner: e.target.value as Task['task_owner'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="CLIENT">Client</option>
                            <option value="INSPIRE">Inspire</option>
                            <option value="BOTH">Both</option>
                          </select>
                        </div>

                        {/* Target Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                          <input
                            type="date"
                            value={task.due_date ? task.due_date.split('T')[0] : ''}
                            onChange={(e) => updateTask(task.index, { 
                              due_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
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
                            Target: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.completed_at && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed: {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Admin Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                        <textarea
                          value={task.admin_notes || ''}
                          onChange={(e) => updateTask(task.index, { admin_notes: e.target.value })}
                          placeholder="Add admin notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {categoryTasks.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No tasks in this category yet.</p>
                    <button
                      onClick={() => addNewTask(category)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Add the first task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Save All Button */}
      <div className="flex justify-center">
        <button
          onClick={async () => {
            for (const task of tasks) {
              await saveTask(task);
            }
          }}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};