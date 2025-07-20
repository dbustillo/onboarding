/*
  # Initial Schema for Client Onboarding Platform

  1. New Tables
    - `profiles` - User profiles with role-based access (client/admin)
    - `quote_submissions` - Integration with existing quote system
    - `onboarding_templates` - Workflow templates based on task breakdown
    - `client_onboarding` - Individual client onboarding instances
    - `onboarding_tasks` - Individual tasks from the spreadsheet
    - `google_drive_resources` - Google Drive integration links
    - `contracts` - DocuSign contract tracking
    - `notifications` - In-app notification system

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Separate client and admin access patterns
*/

-- Core user profiles with role-based access
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  company_name text,
  phone text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quote submissions (integration with existing system)
CREATE TABLE IF NOT EXISTS quote_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  quote_data jsonb NOT NULL,
  cost_breakdown jsonb NOT NULL,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'converted')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onboarding workflow templates
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tasks jsonb NOT NULL, -- Array of task definitions from spreadsheet
  estimated_duration_days integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client onboarding instances
CREATE TABLE IF NOT EXISTS client_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id),
  template_id uuid REFERENCES onboarding_templates(id),
  quote_submission_id uuid REFERENCES quote_submissions(id),
  contract_signed_at timestamptz,
  go_live_at timestamptz,
  current_phase text DEFAULT 'pre_onboarding' CHECK (current_phase IN ('pre_onboarding', 'tech_integrations', 'inventory', 'pilot', 'go_live', 'completed')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'on_hold', 'completed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  estimated_completion timestamptz,
  data jsonb DEFAULT '{}',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual tasks from the task breakdown spreadsheet
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES client_onboarding(id),
  category text NOT NULL, -- 'Pre-Onboarding', 'Tech & Integrations', etc.
  task_name text NOT NULL,
  task_description text,
  task_owner text CHECK (task_owner IN ('INSPIRE', 'CLIENT', 'BOTH')),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'waiting_client', 'waiting_admin', 'completed', 'blocked')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES profiles(id),
  due_date timestamptz,
  completed_at timestamptz,
  admin_notes text,
  client_notes text,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Google Drive integration resources
CREATE TABLE IF NOT EXISTS google_drive_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES client_onboarding(id),
  task_id uuid REFERENCES onboarding_tasks(id),
  resource_type text NOT NULL CHECK (resource_type IN ('form', 'sheet', 'document', 'folder', 'presentation')),
  title text NOT NULL,
  description text,
  google_url text NOT NULL,
  google_file_id text,
  is_client_accessible boolean DEFAULT true,
  is_required boolean DEFAULT false,
  access_level text DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit')),
  created_by uuid REFERENCES profiles(id),
  accessed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- DocuSign contract tracking
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES client_onboarding(id),
  docusign_envelope_id text,
  template_id text,
  template_name text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'signed', 'completed', 'declined', 'voided')),
  recipient_email text,
  sent_at timestamptz,
  delivered_at timestamptz,
  signed_at timestamptz,
  completed_at timestamptz,
  decline_reason text,
  contract_data jsonb DEFAULT '{}',
  docusign_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'task_update', 'contract_update')),
  read_at timestamptz,
  action_url text,
  related_onboarding_id uuid REFERENCES client_onboarding(id),
  related_task_id uuid REFERENCES onboarding_tasks(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Quote submissions policies
CREATE POLICY "Users can read own quote submissions"
  ON quote_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own quote submissions"
  ON quote_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all quote submissions"
  ON quote_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Onboarding templates policies
CREATE POLICY "Everyone can read active templates"
  ON onboarding_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON onboarding_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Client onboarding policies
CREATE POLICY "Clients can read own onboarding"
  ON client_onboarding
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Admins can read all onboarding"
  ON client_onboarding
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Onboarding tasks policies
CREATE POLICY "Clients can read own tasks"
  ON onboarding_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE id = onboarding_tasks.onboarding_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update own task notes"
  ON onboarding_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE id = onboarding_tasks.onboarding_id AND client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE id = onboarding_tasks.onboarding_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all tasks"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Google Drive resources policies
CREATE POLICY "Clients can read accessible resources"
  ON google_drive_resources
  FOR SELECT
  TO authenticated
  USING (
    is_client_accessible = true AND
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE id = google_drive_resources.onboarding_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all resources"
  ON google_drive_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Contracts policies
CREATE POLICY "Clients can read own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE id = contracts.onboarding_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_quote_submissions_user_id ON quote_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_submissions_status ON quote_submissions(status);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_client_id ON client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_status ON client_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_current_phase ON client_onboarding(current_phase);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_onboarding_id ON onboarding_tasks(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_assigned_to ON onboarding_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_google_drive_resources_onboarding_id ON google_drive_resources(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_resources_task_id ON google_drive_resources(task_id);
CREATE INDEX IF NOT EXISTS idx_contracts_onboarding_id ON contracts(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON quote_submissions FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON client_onboarding FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON onboarding_tasks FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON google_drive_resources FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();