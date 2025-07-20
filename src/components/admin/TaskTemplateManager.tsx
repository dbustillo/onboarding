import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Send,
  Calendar,
  Building,
  Mail,
  Phone,
  Trash2,
  Eye,
  Clock,
  Plus
} from 'lucide-react';

interface Client {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

interface OnboardingAssignment {
  id: string;
  client_id: string;
  google_sheet_url: string;
  created_at: string;
  client: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  };
}

export const TaskTemplateManager: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<OnboardingAssignment[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [estimatedDays, setEstimatedDays] = useState<number>(45);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching clients using admin function...');
      
      // Check if this is the hardcoded admin
      const isHardcodedAdmin = currentUserProfile?.email === 'darwin@komento.asia' && currentUserProfile?.id === 'admin-hardcoded-id';
      
      let clientsData;
      let clientsError;
      
      if (isHardcodedAdmin) {
        console.log('🔧 Using admin function for hardcoded admin');
        // Use the admin function that bypasses RLS
        const { data, error } = await supabase.rpc('admin_get_all_profiles');
        if (!error && data) {
          // Filter for clients only
          clientsData = data.filter(profile => profile.role === 'client');
        }
        clientsError = error;
      } else {
        console.log('🔍 Using regular query for database admin');
        // Regular query for actual database users
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'client')
          .in('status', ['approved', 'active', 'pending'])
          .order('created_at', { ascending: false });
        clientsData = data;
        clientsError = error;
      }

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        setMessage({
          type: 'error',
          text: `Error fetching clients: ${clientsError.message}`
        });
        setClients([]);
      } else {
        console.log('✅ Clients fetched successfully:', clientsData?.length || 0);
        console.log('Client data:', clientsData);
        setClients(clientsData || []);
      }

      // Fetch existing onboarding assignments using admin function if needed
      console.log('🔍 Fetching onboarding assignments...');
      
      // Try a simpler approach - get all Google Drive resources first
      console.log('📋 Querying google_drive_resources table...');
      const { data: allResources, error: resourcesError } = await supabase
        .from('google_drive_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (resourcesError) {
        console.error('❌ Error fetching Google Drive resources:', resourcesError);
        setAssignments([]);
      } else {
        console.log('✅ All Google Drive resources fetched:', allResources?.length || 0);
        console.log('📋 Resources data:', allResources);
        
        // Filter for sheet resources that are client accessible
        const sheetResources = allResources?.filter(resource => 
          resource.resource_type === 'sheet' && 
          resource.is_client_accessible === true
        ) || [];
        
        console.log('📊 Filtered sheet resources:', sheetResources.length);
        console.log('📋 Sheet resources:', sheetResources);
        
        if (sheetResources.length > 0) {
          console.log('📋 Processing', sheetResources.length, 'sheet resources...');
          const assignmentsWithClients: OnboardingAssignment[] = [];
          
          for (const resource of sheetResources) {
            console.log('🔄 Processing resource:', resource.id, 'for onboarding:', resource.onboarding_id);
            
            try {
              if (!resource.onboarding_id) {
                console.log('⚠️ Skipping resource without onboarding_id:', resource.id);
                continue;
              }
              
              // Get the client_id from the onboarding record
              console.log('🔍 Fetching onboarding record for ID:', resource.onboarding_id);
              const { data: onboardingData, error: onboardingError } = await supabase
                .from('client_onboarding')
                .select('client_id')
                .eq('id', resource.onboarding_id)
                .maybeSingle();
                
              if (onboardingError) {
                console.error('❌ Error fetching onboarding for resource:', resource.id, onboardingError);
                continue;
              }
              
              if (!onboardingData) {
                console.log('⚠️ No onboarding data found for resource:', resource.id);
                continue;
              }
              
              console.log('✅ Found client_id:', onboardingData.client_id, 'for resource:', resource.id);
              
              // Get the client profile
              let clientData;
              let clientError;
              
              if (isHardcodedAdmin) {
                console.log('🔧 Using admin function to get client profile');
                const { data: allProfiles, error } = await supabase.rpc('admin_get_all_profiles');
                if (!error && allProfiles) {
                  clientData = allProfiles.find(p => p.id === onboardingData.client_id);
                  if (!clientData) {
                    console.log('⚠️ Client not found in admin profiles for ID:', onboardingData.client_id);
                  }
                }
                clientError = error;
              } else {
                console.log('🔍 Using direct query to get client profile');
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', onboardingData.client_id)
                  .maybeSingle();
                clientData = data;
                clientError = error;
              }
              
              if (clientError) {
                console.error('❌ Error fetching client profile:', clientError);
                continue;
              }
              
              if (!clientData) {
                console.log('⚠️ No client data found for ID:', onboardingData.client_id);
                continue;
              }
              
              console.log('✅ Found client:', clientData.email, 'for resource:', resource.id);
              
              // Add to assignments list
              assignmentsWithClients.push({
                id: resource.id,
                client_id: onboardingData.client_id,
                google_sheet_url: resource.google_url,
                created_at: resource.created_at,
                client: {
                  full_name: clientData.full_name,
                  email: clientData.email,
                  company_name: clientData.company_name
                }
              });
                
              console.log('✅ Successfully processed assignment for:', clientData.email);
            } catch (err) {
              console.error('❌ Error processing assignment for resource:', resource.id, err);
            }
          }
          
          console.log('✅ Processed assignments:', assignmentsWithClients.length);
          console.log('📋 Final assignments data:', assignmentsWithClients);
          setAssignments(assignmentsWithClients);
        } else {
          console.log('📭 No sheet resources found');
          setAssignments([]);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load data. Check console for details.'
      });
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOnboarding = async () => {
    if (!selectedClientId || !googleSheetUrl.trim()) {
      setMessage({
        type: 'error',
        text: 'Please select a client and enter a Google Sheet URL'
      });
      return;
    }

    // Validate URL format
    if (!googleSheetUrl.includes('docs.google.com/spreadsheets')) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid Google Sheets URL'
      });
      return;
    }

    try {
      setSaving(true);

      // Use admin RPC function to assign onboarding document
      const { data: result, error } = await supabase.rpc('admin_assign_onboarding_document', {
        p_client_id: selectedClientId,
        p_google_sheet_url: googleSheetUrl,
        p_estimated_days: estimatedDays,
        p_admin_id: currentUserProfile?.id === 'admin-hardcoded-id' ? null : currentUserProfile?.id
      });

      if (error) {
        console.error('RPC Error:', error);
        throw new Error(error.message || 'Failed to assign onboarding document');
      }

      if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Failed to assign onboarding document');
      }

      setMessage({
        type: 'success',
        text: `Onboarding document successfully assigned to ${result.client_name}`
      });

      // Reset form
      setSelectedClientId('');
      setGoogleSheetUrl('');
      setEstimatedDays(45);
      
      // Refresh assignments
      await fetchData();

    } catch (error) {
      console.error('Error assigning onboarding:', error);
      setMessage({
        type: 'error',
        text: 'Failed to assign onboarding document'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this onboarding assignment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('google_drive_resources')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Onboarding assignment deleted successfully'
      });

      // Refresh assignments
      fetchData();

    } catch (error) {
      console.error('Error deleting assignment:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete assignment'
      });
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl border border-blue-100">
        <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl mr-4 shadow-lg">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">
                  Client Onboarding Manager
                </h2>
                <p className="text-gray-600 text-sm">Assign Google Sheet onboarding documents to clients</p>
              </div>
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

        {/* Assignment Form */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            Assign Onboarding Document
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || client.email}{client.company_name ? ` - ${client.company_name}` : ''}
                  </option>
                ))}
              </select>
              
              {/* Debug info */}
              {clients.length === 0 && !loading && (
                <p className="text-xs text-red-600 mt-1">
                  No clients found. Check if there are approved clients in the profiles table.
                </p>
              )}
              
              {loading && (
                <p className="text-xs text-gray-500 mt-1">
                  Loading clients...
                </p>
              )}
              
              {/* Selected Client Info */}
              {selectedClient && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800">{selectedClient.email}</span>
                  </div>
                  {selectedClient.company_name && (
                    <div className="flex items-center space-x-2 text-sm mt-1">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">{selectedClient.company_name}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center space-x-2 text-sm mt-1">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">{selectedClient.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Sheet URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheet URL *
              </label>
              <input
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
              <p className="text-xs text-gray-500 mt-2">
                Paste the shareable link to your Google Sheet with onboarding phases
              </p>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (Days)
              </label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 45)}
                min={1}
                max={365}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
              <p className="text-xs text-gray-500 mt-2">
                Expected completion timeframe
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2 text-sm">How it works:</h4>
            <ul className="text-green-700 text-xs space-y-1">
              <li>• Select a client from the dropdown</li>
              <li>• Paste the Google Sheet URL containing their onboarding phases</li>
              <li>• Client will see "View Onboarding Document" button in their portal</li>
              <li>• Client completes phases in Google Sheet and marks progress in portal</li>
              <li>• Use the chat widget for ongoing communication</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAssignOnboarding}
              disabled={!selectedClientId || !googleSheetUrl.trim() || saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-900 to-cyan-400 text-white rounded-lg hover:from-blue-800 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-bold flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Assign to Client
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Management - Active Assignments */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
              <FileText className="text-white" size={20} />
            </div>
            Onboarding Management
            <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {assignments.length} Active
            </span>
          </h3>
          <p className="text-gray-600 text-sm mt-1">Track and manage all active onboarding assignments</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Assignments</h3>
            <p className="text-gray-600">
              Start by assigning an onboarding document to a client above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assignments.map(assignment => (
              <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                        <Users className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {assignment.client.full_name || assignment.client.email}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {assignment.client.email}
                          </div>
                          {assignment.client.company_name && (
                            <div className="flex items-center">
                              <Building className="w-3 h-3 mr-1" />
                              {assignment.client.company_name}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Assigned: {new Date(assignment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="flex items-center space-x-3 ml-16">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        In Progress
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href={assignment.google_sheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-lg"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Sheet
                    </a>
                    <a
                      href={assignment.google_sheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </a>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};