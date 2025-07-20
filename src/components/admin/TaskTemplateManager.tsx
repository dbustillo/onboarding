import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Save, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  User,
  Building,
  Target,
  ArrowRight
} from 'lucide-react';

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  tasks: TaskDefinition[];
  estimated_duration_days: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

interface TaskDefinition {
  category: string;
  task_name: string;
  task_description?: string;
  task_owner: 'INSPIRE' | 'CLIENT' | 'BOTH';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sort_order: number;
  metadata?: any;
}

export const TaskTemplateManager: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [editedTasks, setEditedTasks] = useState<TaskDefinition[]>([]);
  const [newTask, setNewTask] = useState<TaskDefinition>({
    category: '',
    task_name: '',
    task_description: '',
    task_owner: 'INSPIRE',
    priority: 'medium',
    sort_order: 0
  });
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  // Default task categories
  const defaultCategories = [
    'Pre-Onboarding',
    'Tech & Marketplace Integration',
    'Inventory & Inbounding',
    'Pilot Run & User Acceptance (UAT)',
    'GO LIVE'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      console.log('Fetching templates...');
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      
      console.log('Templates fetched:', data?.length || 0, data);
      setTemplates(data || []);
      
      // If there are templates, select the first one
      if (data && data.length > 0) {
        setSelectedTemplate(data[0]);
        setEditedTasks(data[0].tasks || []);
        
        // Initialize expanded categories
        const categories = getUniqueCategories(data[0].tasks || []);
        const initialExpandedState: Record<string, boolean> = {};
        categories.forEach(category => {
          initialExpandedState[category] = true;
          console.log('Setting category expanded:', category);
        });
        setExpandedCategories(initialExpandedState);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load task templates'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUniqueCategories = (tasks: TaskDefinition[]) => {
    const categories = [...new Set(tasks.map(task => task.category))];
    console.log('Unique categories:', categories);
    return categories;
  };

  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setEditedTasks(template.tasks || []);
    setEditMode(false);
    
    // Initialize expanded categories
    const categories = getUniqueCategories(template.tasks || []);
    const initialExpandedState: Record<string, boolean> = {};
    categories.forEach(category => {
      initialExpandedState[category] = true;
    });
    setExpandedCategories(initialExpandedState);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      setMessage({
        type: 'error',
        text: 'Template name is required'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create default tasks based on the spreadsheet
      const defaultTasks = createDefaultTasks();
      
      const { data, error } = await supabase
        .from('onboarding_templates')
        .insert({
          name: newTemplateName,
          description: newTemplateDescription,
          tasks: defaultTasks,
          estimated_duration_days: 45,
          is_active: true,
          created_by: currentUserProfile?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [data, ...prev]);
      setSelectedTemplate(data);
      setEditedTasks(data.tasks || []);
      setShowNewTemplateForm(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      
      setMessage({
        type: 'success',
        text: 'Template created successfully'
      });
      
      // Initialize expanded categories
      const categories = getUniqueCategories(data.tasks || []);
      const initialExpandedState: Record<string, boolean> = {};
      categories.forEach(category => {
        initialExpandedState[category] = true;
      });
      setExpandedCategories(initialExpandedState);
      
    } catch (error) {
      console.error('Error creating template:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create template'
      });
    } finally {
      setSaving(false);
    }
  };

  const createDefaultTasks = (): TaskDefinition[] => {
    // This function creates the default tasks based on the spreadsheet
    return [
      // Pre-Onboarding Phase
      {
        category: 'Pre-Onboarding', 
        task_name: 'Client Requirement Specifications finalized',
        task_description: 'Define and document all client requirements and specifications (warehousing & storage, sales channels, fulfillment, etc.)',
        task_owner: 'CLIENT',
        priority: 'high',
        sort_order: 1
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'SLA & Pricing Sign-off',
        task_description: 'Client to review and sign off on Service Level Agreement and pricing',
        task_owner: 'CLIENT',
        priority: 'critical',
        sort_order: 2
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Primary and secondary contacts (Sales, Tech, Ops)',
        task_description: 'Identify primary and secondary contacts for different departments',
        task_owner: 'CLIENT',
        priority: 'high',
        sort_order: 3
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)',
        task_description: 'Assign internal team members to handle different aspects of onboarding',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 4
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Contact channels or chat groups created (Viber or Whatsapp)',
        task_description: 'Set up communication channels for ongoing collaboration',
        task_owner: 'BOTH',
        priority: 'medium',
        sort_order: 5
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Client logo (for branding needs)',
        task_description: 'Client to provide logo files for branding purposes',
        task_owner: 'CLIENT',
        priority: 'medium',
        sort_order: 6
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Escalation protocol (key persons for issues or concerns)',
        task_description: 'Define escalation procedures and responsible persons',
        task_owner: 'BOTH',
        priority: 'high',
        sort_order: 7
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Flow protocol of expected file formats for data exchange (switching to Inspire team to avoid issues during marketplace integration)',
        task_description: 'Define file formats and data exchange protocols',
        task_owner: 'INSPIRE',
        priority: 'medium',
        sort_order: 8
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Product Classification: Fast-moving / Average / Slow-moving',
        task_description: 'Categorize products based on movement speed for optimal warehouse placement',
        task_owner: 'CLIENT',
        priority: 'medium',
        sort_order: 9
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Packaging specs provided (sample video, if available)',
        task_description: 'Client to provide packaging specifications and examples',
        task_owner: 'CLIENT',
        priority: 'medium',
        sort_order: 10
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Marketplace user access shared with Inspire Team for system integration',
        task_description: 'Client to provide necessary marketplace access credentials',
        task_owner: 'CLIENT',
        priority: 'high',
        sort_order: 11
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Sandbox system access (to be provided by Inspire)',
        task_description: 'Provide client with sandbox environment access for testing',
        task_owner: 'INSPIRE',
        priority: 'medium',
        sort_order: 12
      },
      {
        category: 'Pre-Onboarding',
        task_name: 'Client Data Room access (Google Drive document storage) (to be provided by Inspire)',
        task_description: 'Set up and share access to client data storage',
        task_owner: 'INSPIRE',
        priority: 'medium',
        sort_order: 13
      },
      
      // Tech & Marketplace Integration Phase
      {
        category: 'Tech & Marketplace Integration',
        task_name: 'Lazada, Shopee, TikTok Shop, Shopify, etc. connected',
        task_description: 'Connect all relevant marketplace platforms',
        task_owner: 'BOTH',
        priority: 'high',
        sort_order: 14
      },
      {
        category: 'Tech & Marketplace Integration',
        task_name: 'API keys or plugin access created (Shopify only)',
        task_description: 'Generate and configure API access for Shopify integration',
        task_owner: 'CLIENT',
        priority: 'high',
        sort_order: 15
      },
      {
        category: 'Tech & Marketplace Integration',
        task_name: 'Channel-specific mapping validated',
        task_description: 'Verify product and category mappings for each sales channel',
        task_owner: 'BOTH',
        priority: 'high',
        sort_order: 16
      },
      {
        category: 'Tech & Marketplace Integration',
        task_name: 'Marketplace integration testing',
        task_description: 'Test all marketplace integrations to ensure proper functionality',
        task_owner: 'INSPIRE',
        priority: 'critical',
        sort_order: 17
      },
      {
        category: 'Tech & Marketplace Integration',
        task_name: 'Live order testing with warehouse team',
        task_description: 'Process test orders through the entire fulfillment workflow',
        task_owner: 'BOTH',
        priority: 'critical',
        sort_order: 18
      },
      
      // Inventory & Inbounding Phase
      {
        category: 'Inventory & Inbounding',
        task_name: 'Product transfer scheduled (ASN created by the Client)',
        task_description: 'Client to create Advanced Shipping Notice for inventory transfer',
        task_owner: 'CLIENT',
        priority: 'high',
        sort_order: 19
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Warehouse receiving orders created in WMS (ASN received by Inspire Team)',
        task_description: 'Create receiving orders in WMS based on client ASN',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 20
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Product Inspection & Verification (QA by Inspire Team)',
        task_description: 'Perform quality inspection of received inventory',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 21
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Physical receiving completed (by Inspire Team)',
        task_description: 'Complete physical receiving process in warehouse',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 22
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'QA completed (quantity, damage, labeling)',
        task_description: 'Complete quality assurance checks on all received inventory',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 23
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Products mapped to correct put-away zones',
        task_description: 'Assign products to appropriate warehouse locations',
        task_owner: 'INSPIRE',
        priority: 'medium',
        sort_order: 24
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Stock put-away logged in system',
        task_description: 'Record all put-away activities in the WMS',
        task_owner: 'INSPIRE',
        priority: 'medium',
        sort_order: 25
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Initial picking and packing process defined',
        task_description: 'Define standard operating procedures for picking and packing',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 26
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Packaging materials prepared (SKUs needing boxes, fillers, etc.)',
        task_description: 'Prepare all necessary packaging materials for client products',
        task_owner: 'INSPIRE',
        priority: 'medium',
        sort_order: 27
      },
      {
        category: 'Inventory & Inbounding',
        task_name: 'Returns intake process agreed (restocking vs disposal)',
        task_description: 'Define and document returns handling procedures',
        task_owner: 'BOTH',
        priority: 'medium',
        sort_order: 28
      },
      
      // Pilot Run & User Acceptance (UAT) Phase
      {
        category: 'Pilot Run & User Acceptance (UAT)',
        task_name: 'Simulate small batch orders from each marketplace',
        task_description: 'Process test orders from each integrated marketplace',
        task_owner: 'BOTH',
        priority: 'critical',
        sort_order: 29
      },
      {
        category: 'Pilot Run & User Acceptance (UAT)',
        task_name: 'Cross-functional observation (CS, WH, Tech, Client)',
        task_description: 'Conduct observation sessions with all stakeholders',
        task_owner: 'BOTH',
        priority: 'high',
        sort_order: 30
      },
      {
        category: 'Pilot Run & User Acceptance (UAT)',
        task_name: 'Notes on gaps or improvement opportunities',
        task_description: 'Document any issues or potential improvements identified during pilot',
        task_owner: 'BOTH',
        priority: 'medium',
        sort_order: 31
      },
      {
        category: 'Pilot Run & User Acceptance (UAT)',
        task_name: 'Sign-off from client team post-pilot',
        task_description: 'Obtain formal client approval after successful pilot run',
        task_owner: 'CLIENT',
        priority: 'critical',
        sort_order: 32
      },
      {
        category: 'Pilot Run & User Acceptance (UAT)',
        task_name: 'Internal validation: Ops, WH, Tech',
        task_description: 'Conduct internal validation across all departments',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 33
      },
      {
        category: 'Pilot Run & User Acceptance (UAT)',
        task_name: 'Final tweaks to workflow or system settings',
        task_description: 'Make final adjustments based on pilot feedback',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 34
      },
      
      // GO LIVE Phase
      {
        category: 'GO LIVE',
        task_name: 'First batch of live orders processed and dispatched',
        task_description: 'Process initial set of real customer orders',
        task_owner: 'INSPIRE',
        priority: 'critical',
        sort_order: 35
      },
      {
        category: 'GO LIVE',
        task_name: 'Day 1 to Day 3 support window prepared',
        task_description: 'Establish intensive support coverage for initial days',
        task_owner: 'INSPIRE',
        priority: 'high',
        sort_order: 36
      },
      {
        category: 'GO LIVE',
        task_name: '7-day operational check-in',
        task_description: 'Conduct review meeting after first week of operations',
        task_owner: 'BOTH',
        priority: 'medium',
        sort_order: 37
      },
      {
        category: 'GO LIVE',
        task_name: '30-day performance review',
        task_description: 'Comprehensive review after first month of operations',
        task_owner: 'BOTH',
        priority: 'medium',
        sort_order: 38
      },
      {
        category: 'GO LIVE',
        task_name: 'Initial optimization plan discussed (cutoffs, TATs, workflows)',
        task_description: 'Develop plan for ongoing optimization of operations',
        task_owner: 'BOTH',
        priority: 'medium',
        sort_order: 39
      }
    ];
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('onboarding_templates')
        .update({
          tasks: editedTasks,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;
      
      // Update local state
      setTemplates(prev => 
        prev.map(t => 
          t.id === selectedTemplate.id 
            ? { ...t, tasks: editedTasks, updated_at: new Date().toISOString() } 
            : t
        )
      );
      
      setSelectedTemplate(prev => 
        prev ? { ...prev, tasks: editedTasks, updated_at: new Date().toISOString() } : null
      );
      
      setEditMode(false);
      setMessage({
        type: 'success',
        text: 'Template saved successfully'
      });
      
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save template'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = () => {
    if (!newTask.category || !newTask.task_name) {
      setMessage({
        type: 'error',
        text: 'Category and task name are required'
      });
      return;
    }
    
    // If editing an existing task
    if (editingTaskIndex !== null) {
      const updatedTasks = [...editedTasks];
      updatedTasks[editingTaskIndex] = {
        ...newTask,
        sort_order: editingTaskIndex
      };
      setEditedTasks(updatedTasks);
      setEditingTaskIndex(null);
    } else {
      // Adding a new task
      setEditedTasks(prev => [
        ...prev, 
        {
          ...newTask,
          sort_order: prev.length
        }
      ]);
    }
    
    // Reset form
    setNewTask({
      category: '',
      task_name: '',
      task_description: '',
      task_owner: 'INSPIRE',
      priority: 'medium',
      sort_order: 0
    });
    setShowNewTaskForm(false);
  };

  const handleEditTask = (index: number) => {
    const task = editedTasks[index];
    setNewTask({
      category: task.category,
      task_name: task.task_name,
      task_description: task.task_description || '',
      task_owner: task.task_owner,
      priority: task.priority,
      sort_order: task.sort_order
    });
    setEditingTaskIndex(index);
    setShowNewTaskForm(true);
  };

  const handleDeleteTask = (index: number) => {
    const updatedTasks = editedTasks.filter((_, i) => i !== index);
    // Update sort_order for remaining tasks
    const reorderedTasks = updatedTasks.map((task, i) => ({
      ...task,
      sort_order: i
    }));
    setEditedTasks(reorderedTasks);
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === editedTasks.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedTasks = [...editedTasks];
    
    // Swap tasks
    [updatedTasks[index], updatedTasks[newIndex]] = [updatedTasks[newIndex], updatedTasks[index]];
    
    // Update sort_order
    updatedTasks.forEach((task, i) => {
      task.sort_order = i;
    });
    
    setEditedTasks(updatedTasks);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('pre-onboarding')) return <FileText className="w-5 h-5" />;
    if (category.toLowerCase().includes('tech') || category.toLowerCase().includes('integration')) return <Building className="w-5 h-5" />;
    if (category.toLowerCase().includes('inventory')) return <Building className="w-5 h-5" />;
    if (category.toLowerCase().includes('pilot') || category.toLowerCase().includes('uat')) return <Target className="w-5 h-5" />;
    if (category.toLowerCase().includes('go live')) return <ArrowRight className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  // Group tasks by category
  const groupTasksByCategory = () => {
    const grouped: Record<string, TaskDefinition[]> = {};
    
    editedTasks.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });
    
    return grouped;
  };

  const groupedTasks = groupTasksByCategory();
  const categories = Object.keys(groupedTasks).sort((a, b) => {
    const indexA = defaultCategories.indexOf(a);
    const indexB = defaultCategories.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Task Template Manager</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowNewTemplateForm(true)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mx-6 my-4 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </span>
        </div>
      )}

      {/* New Template Form */}
      {showNewTemplateForm && (
        <div className="mx-6 my-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter template description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewTemplateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Templates</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowNewTemplateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {template.description || 'No description'}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(template.created_at).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <span>{template.tasks?.length || 0} tasks</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template Details */}
        <div className="lg:col-span-3">
          {selectedTemplate ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedTemplate.name}</h3>
                <div className="flex space-x-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setEditedTasks(selectedTemplate.tasks || []);
                        }}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={saving}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </button>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-blue-800">Edit Tasks</h4>
                    <button
                      onClick={() => setShowNewTaskForm(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Task
                    </button>
                  </div>
                  
                  {/* New Task Form */}
                  {showNewTaskForm && (
                    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">
                        {editingTaskIndex !== null ? 'Edit Task' : 'Add New Task'}
                      </h5>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category *
                            </label>
                            <input
                              type="text"
                              value={newTask.category}
                              onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter category"
                              list="categories"
                            />
                            <datalist id="categories">
                              {defaultCategories.map((cat, index) => (
                                <option key={index} value={cat} />
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Task Owner *
                            </label>
                            <select
                              value={newTask.task_owner}
                              onChange={(e) => setNewTask({...newTask, task_owner: e.target.value as any})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="INSPIRE">INSPIRE</option>
                              <option value="CLIENT">CLIENT</option>
                              <option value="BOTH">BOTH</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Name *
                          </label>
                          <input
                            type="text"
                            value={newTask.task_name}
                            onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter task name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={newTask.task_description}
                            onChange={(e) => setNewTask({...newTask, task_description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter task description"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setShowNewTaskForm(false);
                              setEditingTaskIndex(null);
                              setNewTask({
                                category: '',
                                task_name: '',
                                task_description: '',
                                task_owner: 'INSPIRE',
                                priority: 'medium',
                                sort_order: 0
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddTask}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingTaskIndex !== null ? 'Update Task' : 'Add Task'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-4">
                {categories.map(category => {
                  const categoryTasks = groupedTasks[category] || [];
                  const isExpanded = expandedCategories[category] || false;
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          {getCategoryIcon(category)}
                          <h4 className="ml-2 font-medium text-gray-900">{category}</h4>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">
                            {categoryTasks.length} tasks
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
                          {categoryTasks.map((task, index) => {
                            const taskIndex = editedTasks.findIndex(t => 
                              t.task_name === task.task_name && t.category === task.category
                            );
                            
                            return (
                              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{task.task_name}</h5>
                                    {task.task_description && (
                                      <p className="text-sm text-gray-600 mt-1">{task.task_description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.priority)}`}>
                                        {task.priority}
                                      </span>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOwnerColor(task.task_owner)}`}>
                                        {task.task_owner}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {editMode && (
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => handleMoveTask(taskIndex, 'up')}
                                        disabled={taskIndex === 0}
                                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleMoveTask(taskIndex, 'down')}
                                        disabled={taskIndex === editedTasks.length - 1}
                                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleEditTask(taskIndex)}
                                        className="p-1 text-blue-600 hover:text-blue-800"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(taskIndex)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No template selected</h3>
              <p className="mt-1 text-sm text-gray-500">Select a template from the list or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};