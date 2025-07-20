import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Test the connection and ensure profile exists
supabase.auth.getSession().then(async ({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error);
    return;
  }
  
  console.log('Supabase connected successfully', data.session ? `User: ${data.session.user?.email}` : 'No active session');
  
  // Test and ensure profile exists if we have a session
  if (data.session?.user) {
    const user = data.session.user;
    console.log('Testing profile for user:', user.id, 'email:', user.email);
    
    // First check if profile exists by ID
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      console.log('No profile found by ID, checking by email...');
      
      // Try by email
      const { data: profileByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email!)
        .single();

      if (emailError && emailError.code === 'PGRST116') {
        console.log('No profile found by email, creating one...');
        
        // Create profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
            company_name: user.user_metadata?.company_name || '',
            phone: user.user_metadata?.phone || ''
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create profile:', createError);
        } else {
          console.log('Successfully created profile:', newProfile);
        }
      } else if (emailError) {
        console.error('Error fetching profile by email:', emailError);
      } else {
        console.log('Found profile by email:', profileByEmail);
        
        // Update ID if needed
        if (profileByEmail.id !== user.id) {
          console.log('Updating profile ID...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id: user.id })
            .eq('email', user.email!);
            
          if (updateError) {
            console.error('Failed to update profile ID:', updateError);
          } else {
            console.log('Successfully updated profile ID');
          }
        }
      }
    } else if (profileError) {
      console.error('Error fetching profile by ID:', profileError);
    } else {
      console.log('Profile found by ID:', profile);
    }
  }
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  role: 'client' | 'admin';
  status: 'pending' | 'approved' | 'active' | 'suspended';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteSubmission {
  id: string;
  user_id: string;
  quote_data: any;
  cost_breakdown: any;
  status: 'submitted' | 'reviewed' | 'approved' | 'converted';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: any[];
  estimated_duration_days: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientOnboarding {
  id: string;
  client_id: string;
  template_id: string;
  quote_submission_id?: string;
  contract_signed_at?: string;
  go_live_at?: string;
  current_phase: 'pre_onboarding' | 'tech_integrations' | 'inventory' | 'pilot' | 'go_live' | 'completed';
  status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  started_at: string;
  estimated_completion?: string;
  data: any;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTask {
  id: string;
  onboarding_id: string;
  category: string;
  task_name: string;
  task_description?: string;
  task_owner: 'INSPIRE' | 'CLIENT' | 'BOTH';
  status: 'not_started' | 'in_progress' | 'waiting_client' | 'waiting_admin' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  admin_notes?: string;
  client_notes?: string;
  sort_order: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface GoogleDriveResource {
  id: string;
  onboarding_id: string;
  task_id?: string;
  resource_type: 'form' | 'sheet' | 'document' | 'folder' | 'presentation';
  title: string;
  description?: string;
  google_url: string;
  google_file_id?: string;
  is_client_accessible: boolean;
  is_required: boolean;
  access_level: 'view' | 'comment' | 'edit';
  created_by?: string;
  accessed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  onboarding_id: string;
  docusign_envelope_id?: string;
  template_id?: string;
  template_name?: string;
  status: 'draft' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  recipient_email?: string;
  sent_at?: string;
  delivered_at?: string;
  signed_at?: string;
  completed_at?: string;
  decline_reason?: string;
  contract_data: any;
  docusign_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task_update' | 'contract_update';
  read_at?: string;
  action_url?: string;
  related_onboarding_id?: string;
  related_task_id?: string;
  metadata: any;
  created_at: string;
}