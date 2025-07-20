/*
  # Comprehensive Profile System Enhancement

  1. Enhanced Tables
    - Add file storage for contracts and documents
    - Add progress tracking fields
    - Add client-specific customization options

  2. New Functions
    - Better user profile management
    - Automatic onboarding creation
    - File management capabilities

  3. Security
    - Enhanced RLS policies
    - Admin functions for profile management
*/

-- Add file storage table for contracts and documents
CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  onboarding_id uuid REFERENCES client_onboarding(id) ON DELETE CASCADE,
  task_id uuid REFERENCES onboarding_tasks(id) ON DELETE SET NULL,
  document_type text NOT NULL CHECK (document_type IN ('contract', 'agreement', 'form', 'certificate', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES profiles(id),
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  version_number integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'signed')),
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add progress tracking table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES client_onboarding(id) ON DELETE CASCADE,
  phase text NOT NULL,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_tasks integer DEFAULT 0,
  total_tasks integer DEFAULT 0,
  phase_status text DEFAULT 'not_started' CHECK (phase_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  started_at timestamptz,
  completed_at timestamptz,
  estimated_completion timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(onboarding_id, phase)
);

-- Add client preferences table
CREATE TABLE IF NOT EXISTS client_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": false, "in_app": true}',
  communication_preferences jsonb DEFAULT '{"preferred_contact_method": "email", "timezone": "Asia/Manila"}',
  onboarding_preferences jsonb DEFAULT '{"auto_progress": true, "reminder_frequency": "daily"}',
  custom_fields jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_documents
CREATE POLICY "Clients can read own documents"
  ON client_documents
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own documents"
  ON client_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can manage all documents"
  ON client_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for onboarding_progress
CREATE POLICY "Clients can read own progress"
  ON onboarding_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE id = onboarding_progress.onboarding_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all progress"
  ON onboarding_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for client_preferences
CREATE POLICY "Clients can manage own preferences"
  ON client_preferences
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can read all preferences"
  ON client_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_onboarding_id ON client_documents(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_onboarding_id ON onboarding_progress(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_phase ON onboarding_progress(phase);
CREATE INDEX IF NOT EXISTS idx_client_preferences_client_id ON client_preferences(client_id);

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON client_documents FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON client_preferences FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Enhanced function to get user profile with all related data
CREATE OR REPLACE FUNCTION admin_get_user_profile_complete(user_id uuid)
RETURNS TABLE(
  -- Profile data
  profile_id uuid,
  email text,
  full_name text,
  company_name text,
  phone text,
  role text,
  status text,
  avatar_url text,
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  -- Onboarding data
  onboarding_id uuid,
  current_phase text,
  onboarding_status text,
  started_at timestamptz,
  estimated_completion timestamptz,
  -- Progress summary
  total_tasks bigint,
  completed_tasks bigint,
  overall_progress numeric
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.email,
    p.full_name,
    p.company_name,
    p.phone,
    p.role,
    p.status,
    p.avatar_url,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,
    co.id as onboarding_id,
    co.current_phase,
    co.status as onboarding_status,
    co.started_at,
    co.estimated_completion,
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    CASE 
      WHEN COALESCE(task_stats.total_tasks, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(task_stats.completed_tasks, 0)::numeric / task_stats.total_tasks::numeric) * 100, 2)
    END as overall_progress
  FROM profiles p
  LEFT JOIN client_onboarding co ON p.id = co.client_id
  LEFT JOIN (
    SELECT 
      ot.onboarding_id,
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN ot.status = 'completed' THEN 1 END) as completed_tasks
    FROM onboarding_tasks ot
    GROUP BY ot.onboarding_id
  ) task_stats ON co.id = task_stats.onboarding_id
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update progress tracking
CREATE OR REPLACE FUNCTION update_onboarding_progress(p_onboarding_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  phase_record RECORD;
  phase_tasks RECORD;
BEGIN
  -- Define phases
  FOR phase_record IN 
    SELECT unnest(ARRAY['pre_onboarding', 'tech_integrations', 'inventory', 'pilot', 'go_live']) as phase_name
  LOOP
    -- Get task statistics for this phase
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      MIN(CASE WHEN status != 'not_started' THEN created_at END) as first_started,
      MAX(CASE WHEN status = 'completed' THEN completed_at END) as last_completed
    INTO phase_tasks
    FROM onboarding_tasks 
    WHERE onboarding_id = p_onboarding_id 
    AND (
      category ILIKE '%' || replace(phase_record.phase_name, '_', '%') || '%'
      OR (phase_record.phase_name = 'tech_integrations' AND category ILIKE '%tech%')
      OR (phase_record.phase_name = 'inventory' AND category ILIKE '%inventory%')
      OR (phase_record.phase_name = 'pilot' AND category ILIKE '%pilot%')
      OR (phase_record.phase_name = 'go_live' AND category ILIKE '%go%live%')
    );
    
    -- Insert or update progress record
    INSERT INTO onboarding_progress (
      onboarding_id,
      phase,
      progress_percentage,
      completed_tasks,
      total_tasks,
      phase_status,
      started_at,
      completed_at
    )
    VALUES (
      p_onboarding_id,
      phase_record.phase_name,
      CASE 
        WHEN phase_tasks.total = 0 THEN 0
        ELSE ROUND((phase_tasks.completed::numeric / phase_tasks.total::numeric) * 100)
      END,
      phase_tasks.completed,
      phase_tasks.total,
      CASE 
        WHEN phase_tasks.completed = phase_tasks.total AND phase_tasks.total > 0 THEN 'completed'
        WHEN phase_tasks.completed > 0 THEN 'in_progress'
        ELSE 'not_started'
      END,
      phase_tasks.first_started,
      CASE WHEN phase_tasks.completed = phase_tasks.total THEN phase_tasks.last_completed END
    )
    ON CONFLICT (onboarding_id, phase)
    DO UPDATE SET
      progress_percentage = EXCLUDED.progress_percentage,
      completed_tasks = EXCLUDED.completed_tasks,
      total_tasks = EXCLUDED.total_tasks,
      phase_status = EXCLUDED.phase_status,
      started_at = COALESCE(onboarding_progress.started_at, EXCLUDED.started_at),
      completed_at = EXCLUDED.completed_at,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle task status changes and update progress
CREATE OR REPLACE FUNCTION handle_task_status_change()
RETURNS trigger AS $$
BEGIN
  -- Update progress when task status changes
  PERFORM update_onboarding_progress(NEW.onboarding_id);
  
  -- Update completed_at timestamp
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic progress updates
DROP TRIGGER IF EXISTS trigger_task_status_change ON onboarding_tasks;
CREATE TRIGGER trigger_task_status_change
  BEFORE UPDATE ON onboarding_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_task_status_change();

-- Function to initialize client preferences
CREATE OR REPLACE FUNCTION initialize_client_preferences(p_client_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO client_preferences (client_id)
  VALUES (p_client_id)
  ON CONFLICT (client_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to create comprehensive onboarding
CREATE OR REPLACE FUNCTION admin_create_comprehensive_onboarding(
    p_client_id uuid,
    p_template_id uuid DEFAULT NULL
)
RETURNS TABLE(
  onboarding_id uuid,
  tasks_created integer,
  progress_initialized boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_onboarding client_onboarding;
    v_tasks_created integer := 0;
    v_task_data jsonb;
BEGIN
    -- Create onboarding instance
    INSERT INTO client_onboarding (
        client_id, 
        template_id,
        current_phase, 
        status, 
        started_at, 
        estimated_completion, 
        data
    )
    VALUES (
        p_client_id,
        p_template_id,
        'pre_onboarding',
        'in_progress',
        NOW(),
        NOW() + INTERVAL '45 days',
        '{}'::jsonb
    )
    RETURNING * INTO v_new_onboarding;

    -- Create comprehensive default tasks
    INSERT INTO onboarding_tasks (
        onboarding_id, category, task_name, task_description, task_owner, status, priority, sort_order, metadata
    ) VALUES
    -- Pre-Onboarding Phase
    (v_new_onboarding.id, 'Pre-Onboarding', 'Client Service Requirements', 'Define and document client service requirements and expectations', 'CLIENT', 'not_started', 'high', 1, '{"phase": "pre_onboarding", "requires_upload": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Storage Requirements Assessment', 'Determine storage type (ambient/temp-controlled) and volume (CBM)', 'CLIENT', 'not_started', 'high', 2, '{"phase": "pre_onboarding", "requires_upload": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Delivery Requirements Planning', 'Plan delivery schedules, locations, and special requirements', 'CLIENT', 'not_started', 'medium', 3, '{"phase": "pre_onboarding"}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Warehouse Allocation', 'Identify and allocate appropriate warehouse space', 'INSPIRE', 'not_started', 'high', 4, '{"phase": "pre_onboarding"}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Insurance Requirements', 'Review and finalize insurance coverage requirements', 'BOTH', 'not_started', 'medium', 5, '{"phase": "pre_onboarding"}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Contract Finalization', 'Prepare, review, and finalize service contract', 'INSPIRE', 'not_started', 'critical', 6, '{"phase": "pre_onboarding", "contract_required": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'SLA & Pricing Sign-off', 'Review and approve Service Level Agreement and pricing structure', 'CLIENT', 'not_started', 'critical', 7, '{"phase": "pre_onboarding", "requires_signature": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Contact Identification', 'Identify primary and secondary contact persons for ongoing communication', 'CLIENT', 'not_started', 'high', 8, '{"phase": "pre_onboarding"}'::jsonb),
    
    -- Tech & Integrations Phase
    (v_new_onboarding.id, 'Tech & Integrations', 'Lazada Integration', 'Connect and configure Lazada marketplace integration', 'CLIENT', 'not_started', 'medium', 9, '{"phase": "tech_integrations", "platform": "lazada"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'Shopee Integration', 'Connect and configure Shopee marketplace integration', 'CLIENT', 'not_started', 'medium', 10, '{"phase": "tech_integrations", "platform": "shopee"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'TikTok Shop Integration', 'Connect and configure TikTok Shop marketplace integration', 'CLIENT', 'not_started', 'medium', 11, '{"phase": "tech_integrations", "platform": "tiktok"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'Shopify Integration', 'Connect and configure Shopify store integration', 'CLIENT', 'not_started', 'low', 12, '{"phase": "tech_integrations", "platform": "shopify"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'Facebook Commerce Integration', 'Connect and configure Facebook/Instagram shopping integration', 'CLIENT', 'not_started', 'low', 13, '{"phase": "tech_integrations", "platform": "facebook"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'API Configuration', 'Configure API endpoints and data synchronization', 'INSPIRE', 'not_started', 'high', 14, '{"phase": "tech_integrations"}'::jsonb),
    
    -- Inventory & Inbounding Phase
    (v_new_onboarding.id, 'Inventory & Inbounding', 'ASN Creation', 'Client creates Advanced Shipping Notice for product transfer', 'CLIENT', 'not_started', 'high', 15, '{"phase": "inventory", "requires_upload": true}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'WMS Receiving Orders', 'Create warehouse receiving orders in WMS based on ASN', 'INSPIRE', 'not_started', 'high', 16, '{"phase": "inventory"}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'Product Inspection & QA', 'Conduct thorough product inspection and quality assurance', 'INSPIRE', 'not_started', 'high', 17, '{"phase": "inventory"}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'Physical Receiving', 'Complete physical receiving and inventory placement', 'INSPIRE', 'not_started', 'high', 18, '{"phase": "inventory"}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'Inventory Verification', 'Verify inventory counts and system accuracy', 'BOTH', 'not_started', 'medium', 19, '{"phase": "inventory"}'::jsonb),
    
    -- Pilot Run & UAT Phase
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Test Order Simulation', 'Simulate small batch orders from each connected marketplace', 'BOTH', 'not_started', 'critical', 20, '{"phase": "pilot"}'::jsonb),
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Cross-functional Observation', 'Coordinate observation across Customer Service, Warehouse, Tech, and Client teams', 'BOTH', 'not_started', 'critical', 21, '{"phase": "pilot"}'::jsonb),
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Performance Testing', 'Test system performance under simulated load conditions', 'INSPIRE', 'not_started', 'high', 22, '{"phase": "pilot"}'::jsonb),
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Client UAT Sign-off', 'Obtain formal sign-off from client team post-pilot testing', 'CLIENT', 'not_started', 'critical', 23, '{"phase": "pilot", "requires_signature": true}'::jsonb),
    
    -- GO LIVE Phase
    (v_new_onboarding.id, 'GO LIVE', 'Live Order Processing', 'Process and dispatch first batch of live orders', 'INSPIRE', 'not_started', 'critical', 24, '{"phase": "go_live"}'::jsonb),
    (v_new_onboarding.id, 'GO LIVE', 'Support Window Preparation', 'Prepare intensive support coverage for Days 1-3', 'INSPIRE', 'not_started', 'high', 25, '{"phase": "go_live"}'::jsonb),
    (v_new_onboarding.id, 'GO LIVE', 'Monitoring & Alerts Setup', 'Configure monitoring systems and alert mechanisms', 'INSPIRE', 'not_started', 'high', 26, '{"phase": "go_live"}'::jsonb),
    (v_new_onboarding.id, 'GO LIVE', '7-Day Operational Review', 'Conduct comprehensive 7-day operational check-in and review', 'BOTH', 'not_started', 'medium', 27, '{"phase": "go_live"}'::jsonb),
    (v_new_onboarding.id, 'GO LIVE', '30-Day Performance Review', 'Complete 30-day performance review and optimization recommendations', 'BOTH', 'not_started', 'medium', 28, '{"phase": "go_live"}'::jsonb);

    GET DIAGNOSTICS v_tasks_created = ROW_COUNT;

    -- Initialize progress tracking
    PERFORM update_onboarding_progress(v_new_onboarding.id);
    
    -- Initialize client preferences
    PERFORM initialize_client_preferences(p_client_id);

    RETURN QUERY SELECT v_new_onboarding.id, v_tasks_created, true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_user_profile_complete TO authenticated;
GRANT EXECUTE ON FUNCTION update_onboarding_progress TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_client_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_comprehensive_onboarding TO authenticated;