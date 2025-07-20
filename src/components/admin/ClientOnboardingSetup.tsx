import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
  ArrowRight,
  Users
} from 'lucide-react';

interface OnboardingTemplate {
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

interface Client {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  status: string;
  created_at: string;
}

interface OnboardingSetupProps {
  clientId?: string;
  onSetupComplete?: () => void;
}

export const ClientOnboardingSetup: React.FC<OnboardingSetupProps> = ({ 
  clientId,
  onSetupComplete
}) => {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingTemplate | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [customTasks, setCustomTasks] = useState<TaskDefinition[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState(45);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetTitle, setGoogleSheetTitle] = useState('');
  const [googleSheetDescription, setGoogleSheetDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for ClientOnboardingSetup...');

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        throw templatesError;
      }
      
      console.log('Templates fetched:', templatesData?.length || 0, templatesData);
      setTemplates(templatesData || []);
      
      // If clientId is provided, fetch that specific client
      if (clientId) {
        const { data: clientData, error: clientError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;
        setSelectedClient(clientData);
      } else {
        // Otherwise fetch all clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'client')
          .in('status', ['approved', 'active'])
          .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;
        setClients(clientsData || []);
      }
      
      // If there are templates, select the first one
      if (templatesData && templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
        console.log('Selected template:', templatesData[0].name);
        setCustomTasks(templatesData[0].tasks || []);
        setEstimatedDays(templatesData[0].estimated_duration_days || 45);
        
        // Initialize expanded categories
        const categories = getUniqueCategories(templatesData[0].tasks || []);
        const initialExpandedState: Record<string, boolean> = {};
        categories.forEach(category => {
          initialExpandedState[category] = true;
          console.log('Setting category expanded:', category);
        });
        setExpandedCategories(initialExpandedState);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUniqueCategories = (tasks: TaskDefinition[]) => {
    return [...new Set(tasks.map(task => task.category))];
  };

  const handleSelectTemplate = (template: OnboardingTemplate) => {
    setSelectedTemplate(template);
    setCustomTasks(template.tasks || []);
    setEstimatedDays(template.estimated_duration_days || 45);
    setEditMode(false);
    
    // Initialize expanded categories
    const categories = getUniqueCategories(template.tasks || []);
    const initialExpandedState: Record<string, boolean> = {};
    categories.forEach(category => {
      initialExpandedState[category] = true;
    });
    setExpandedCategories(initialExpandedState);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleCreateOnboarding = async () => {
    if (!selectedTemplate || !selectedClient) {
      console.log('Cannot create onboarding: missing template or client');
      setMessage({
        type: 'error',
        text: 'Please select both a template and a client'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Use the admin function to create a comprehensive onboarding
      const { data, error } = await supabase
        .rpc('admin_create_comprehensive_onboarding', {
          p_client_id: selectedClient.id,
          p_template_id: selectedTemplate.id
        });

      if (error) throw error;
      
      // If Google Sheet URL is provided, create a Google Drive resource
      if (googleSheetUrl.trim() && data && data.length > 0) {
        const onboardingId = data[0].onboarding_id;
        
        const { error: resourceError } = await supabase
          .from('google_drive_resources')
          .insert({
            onboarding_id: onboardingId,
            resource_type: 'sheet',
            title: googleSheetTitle || 'Onboarding Checklist',
            description: googleSheetDescription || 'Interactive onboarding checklist and phase breakdown',
            google_url: googleSheetUrl,
            is_client_accessible: true,
            is_required: true,
            access_level: 'edit'
          });
          
        if (resourceError) {
          console.error('Error creating Google Drive resource:', resourceError);
          setMessage({
            type: 'error',
            text: 'Onboarding created but failed to link Google Sheet'
          });
          return;
        }
      }
      
      setMessage({
        type: 'success',
        text: `Onboarding created successfully with ${data[0].tasks_created} tasks${googleSheetUrl ? ' and Google Sheet linked' : ''}`
      });
      
      // Reset form
      setGoogleSheetUrl('');
      setGoogleSheetTitle('');
      setGoogleSheetDescription('');
      
      // Call the callback if provided
      if (onSetupComplete) {
        onSetupComplete();
      }
      
    } catch (error) {
      console.error('Error creating onboarding:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create onboarding'
      });
    } finally {
      setSaving(false);
    }
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
    
    customTasks.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });
    
    return grouped;
  };

  const groupedTasks = groupTasksByCategory();
  const categories = Object.keys(groupedTasks).sort();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Client Onboarding Setup</h2>
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

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client Selection */}
          {/* Client Selection */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Select Client
            </h3>
            
            {clientId ? (
              // If clientId is provided, show the selected client
              selectedClient ? (
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="font-medium text-gray-900">{selectedClient.full_name || selectedClient.email}</div>
                  {selectedClient.company_name && (
                    <div className="text-sm text-gray-600">{selectedClient.company_name}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">{selectedClient.email}</div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading client...</p>
                </div>
              )
            ) : (
              // Otherwise show client selection dropdown
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    if (client) handleSelectClient(client);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name || client.email} {client.company_name ? `(${client.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Template Selection */}
          {/* Template Selection */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Select Template
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Onboarding Template
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) handleSelectTemplate(template);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Estimated Duration */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Estimated Duration
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days to Complete
              </label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 45)}
                min={1}
                max={365}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Google Sheet Integration */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Google Sheet Integration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Sheet URL
                </label>
                <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link to the interactive Google Sheet for phase breakdown
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sheet Title (Optional)
                </label>
                <input
                  type="text"
                  value={googleSheetTitle}
                  onChange={(e) => setGoogleSheetTitle(e.target.value)}
                  placeholder="Onboarding Checklist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={googleSheetDescription}
                  onChange={(e) => setGoogleSheetDescription(e.target.value)}
                  placeholder="Interactive onboarding checklist and phase breakdown"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Create Button */}
          {/* Create Button */}
          <button
            onClick={handleCreateOnboarding}
            disabled={!selectedTemplate || !selectedClient || saving}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Onboarding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Onboarding
              </>
            )}
          </button>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">How it works:</h4>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Create onboarding with task template</li>
              <li>• Link Google Sheet for interactive phase tracking</li>
              <li>• Client sees "View Onboarding Doc" button</li>
              <li>• Client marks phases complete in portal</li>
              <li>• Admin tracks progress in real-time</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Template Preview */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Template Preview</h3>

          {selectedTemplate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                {selectedTemplate.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                )}
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {estimatedDays} days estimated
                  <span className="mx-2">•</span>
                  <span>{customTasks.length} tasks</span>
                </div>
              </div>

              {/* Tasks Preview */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
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
                          <h5 className="ml-2 font-medium text-gray-900">{category}</h5>
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
                          {categoryTasks.map((task, index) => (
                            <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900 text-sm">{task.task_name}</h6>
                                  {task.task_description && (
                                    <p className="text-xs text-gray-600 mt-1">{task.task_description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getOwnerColor(task.task_owner)}`}>
                                      {task.task_owner}
                                    </span>
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
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No template selected</h3>
              </div>
              <p className="mt-1 text-sm text-gray-500">Select a template to preview tasks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};