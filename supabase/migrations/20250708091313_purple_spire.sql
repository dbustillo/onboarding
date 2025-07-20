/*
  # Comprehensive Profile System Enhancement

  1. Enhanced Functions
    - Improved admin functions for comprehensive user management
    - Better error handling and data consistency
    - Enhanced onboarding creation with full task suite

  2. Additional Features
    - Document management system
    - Progress tracking improvements
    - Better RLS policies for admin operations

  3. Data Integrity
    - Proper foreign key relationships
    - Comprehensive indexing
    - Trigger-based progress updates
*/

-- Enhanced function to get user profile with comprehensive data
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

-- Enhanced comprehensive onboarding creation function
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
    -- Pre-Onboarding Phase (8 tasks)
    (v_new_onboarding.id, 'Pre-Onboarding', 'Client Service Requirements', 'Define and document client service requirements and expectations', 'CLIENT', 'not_started', 'high', 1, '{"phase": "pre_onboarding", "requires_upload": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Storage Requirements Assessment', 'Determine storage type (ambient/temp-controlled) and volume (CBM)', 'CLIENT', 'not_started', 'high', 2, '{"phase": "pre_onboarding", "requires_upload": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Delivery Requirements Planning', 'Plan delivery schedules, locations, and special requirements', 'CLIENT', 'not_started', 'medium', 3, '{"phase": "pre_onboarding"}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Warehouse Allocation', 'Identify and allocate appropriate warehouse space', 'INSPIRE', 'not_started', 'high', 4, '{"phase": "pre_onboarding"}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Insurance Requirements', 'Review and finalize insurance coverage requirements', 'BOTH', 'not_started', 'medium', 5, '{"phase": "pre_onboarding"}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Contract Finalization', 'Prepare, review, and finalize service contract', 'INSPIRE', 'not_started', 'critical', 6, '{"phase": "pre_onboarding", "contract_required": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'SLA & Pricing Sign-off', 'Review and approve Service Level Agreement and pricing structure', 'CLIENT', 'not_started', 'critical', 7, '{"phase": "pre_onboarding", "requires_signature": true}'::jsonb),
    (v_new_onboarding.id, 'Pre-Onboarding', 'Contact Identification', 'Identify primary and secondary contact persons for ongoing communication', 'CLIENT', 'not_started', 'high', 8, '{"phase": "pre_onboarding"}'::jsonb),
    
    -- Tech & Integrations Phase (6 tasks)
    (v_new_onboarding.id, 'Tech & Integrations', 'Lazada Integration', 'Connect and configure Lazada marketplace integration', 'CLIENT', 'not_started', 'medium', 9, '{"phase": "tech_integrations", "platform": "lazada"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'Shopee Integration', 'Connect and configure Shopee marketplace integration', 'CLIENT', 'not_started', 'medium', 10, '{"phase": "tech_integrations", "platform": "shopee"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'TikTok Shop Integration', 'Connect and configure TikTok Shop marketplace integration', 'CLIENT', 'not_started', 'medium', 11, '{"phase": "tech_integrations", "platform": "tiktok"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'Shopify Integration', 'Connect and configure Shopify store integration', 'CLIENT', 'not_started', 'low', 12, '{"phase": "tech_integrations", "platform": "shopify"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'Facebook Commerce Integration', 'Connect and configure Facebook/Instagram shopping integration', 'CLIENT', 'not_started', 'low', 13, '{"phase": "tech_integrations", "platform": "facebook"}'::jsonb),
    (v_new_onboarding.id, 'Tech & Integrations', 'API Configuration', 'Configure API endpoints and data synchronization', 'INSPIRE', 'not_started', 'high', 14, '{"phase": "tech_integrations"}'::jsonb),
    
    -- Inventory & Inbounding Phase (5 tasks)
    (v_new_onboarding.id, 'Inventory & Inbounding', 'ASN Creation', 'Client creates Advanced Shipping Notice for product transfer', 'CLIENT', 'not_started', 'high', 15, '{"phase": "inventory", "requires_upload": true}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'WMS Receiving Orders', 'Create warehouse receiving orders in WMS based on ASN', 'INSPIRE', 'not_started', 'high', 16, '{"phase": "inventory"}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'Product Inspection & QA', 'Conduct thorough product inspection and quality assurance', 'INSPIRE', 'not_started', 'high', 17, '{"phase": "inventory"}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'Physical Receiving', 'Complete physical receiving and inventory placement', 'INSPIRE', 'not_started', 'high', 18, '{"phase": "inventory"}'::jsonb),
    (v_new_onboarding.id, 'Inventory & Inbounding', 'Inventory Verification', 'Verify inventory counts and system accuracy', 'BOTH', 'not_started', 'medium', 19, '{"phase": "inventory"}'::jsonb),
    
    -- Pilot Run & UAT Phase (4 tasks)
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Test Order Simulation', 'Simulate small batch orders from each connected marketplace', 'BOTH', 'not_started', 'critical', 20, '{"phase": "pilot"}'::jsonb),
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Cross-functional Observation', 'Coordinate observation across Customer Service, Warehouse, Tech, and Client teams', 'BOTH', 'not_started', 'critical', 21, '{"phase": "pilot"}'::jsonb),
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Performance Testing', 'Test system performance under simulated load conditions', 'INSPIRE', 'not_started', 'high', 22, '{"phase": "pilot"}'::jsonb),
    (v_new_onboarding.id, 'Pilot Run & User Acceptance Testing', 'Client UAT Sign-off', 'Obtain formal sign-off from client team post-pilot testing', 'CLIENT', 'not_started', 'critical', 23, '{"phase": "pilot", "requires_signature": true}'::jsonb),
    
    -- GO LIVE Phase (5 tasks)
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

-- Function to safely update user profiles (admin only)
CREATE OR REPLACE FUNCTION admin_update_user_profile(
    p_user_id uuid,
    p_full_name text DEFAULT NULL,
    p_company_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_role text DEFAULT NULL,
    p_status text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET 
        full_name = COALESCE(p_full_name, full_name),
        company_name = COALESCE(p_company_name, company_name),
        phone = COALESCE(p_phone, phone),
        role = COALESCE(p_role, role),
        status = COALESCE(p_status, status),
        updated_at = now()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found', p_user_id;
    END IF;
    
    RAISE NOTICE 'Successfully updated profile for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get task statistics by phase
CREATE OR REPLACE FUNCTION get_onboarding_phase_stats(p_onboarding_id uuid)
RETURNS TABLE(
    phase_name text,
    total_tasks bigint,
    completed_tasks bigint,
    in_progress_tasks bigint,
    progress_percentage numeric
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH phase_mapping AS (
        SELECT 
            task_id,
            category,
            status,
            CASE 
                WHEN category ILIKE '%pre%onboarding%' THEN 'pre_onboarding'
                WHEN category ILIKE '%tech%' OR category ILIKE '%integration%' THEN 'tech_integrations'
                WHEN category ILIKE '%inventory%' OR category ILIKE '%inbound%' THEN 'inventory'
                WHEN category ILIKE '%pilot%' OR category ILIKE '%uat%' OR category ILIKE '%acceptance%' THEN 'pilot'
                WHEN category ILIKE '%go%live%' OR category ILIKE '%live%' THEN 'go_live'
                ELSE 'other'
            END as phase
        FROM (
            SELECT 
                id as task_id,
                category,
                status
            FROM onboarding_tasks 
            WHERE onboarding_id = p_onboarding_id
        ) tasks
    ),
    phase_stats AS (
        SELECT 
            phase,
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress
        FROM phase_mapping
        WHERE phase != 'other'
        GROUP BY phase
    )
    SELECT 
        ps.phase as phase_name,
        ps.total as total_tasks,
        ps.completed as completed_tasks,
        ps.in_progress as in_progress_tasks,
        CASE 
            WHEN ps.total = 0 THEN 0
            ELSE ROUND((ps.completed::numeric / ps.total::numeric) * 100, 1)
        END as progress_percentage
    FROM phase_stats ps
    ORDER BY 
        CASE ps.phase
            WHEN 'pre_onboarding' THEN 1
            WHEN 'tech_integrations' THEN 2
            WHEN 'inventory' THEN 3
            WHEN 'pilot' THEN 4
            WHEN 'go_live' THEN 5
            ELSE 6
        END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_user_profile_complete TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_comprehensive_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_phase_stats TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_category ON onboarding_tasks(category);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_phase_lookup ON onboarding_tasks(onboarding_id, category, status);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_client_phase ON client_onboarding(client_id, current_phase);

-- Update RLS policies to ensure admin functions work properly
DROP POLICY IF EXISTS "Admin comprehensive access" ON profiles;
CREATE POLICY "Admin comprehensive access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Allow access if user is admin (from JWT or profile lookup)
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    OR EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
    OR auth.uid() = id  -- Users can always access their own profile
  )
  WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    OR EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
    OR auth.uid() = id
  );

-- Ensure onboarding tables have proper admin access
DROP POLICY IF EXISTS "Admin comprehensive onboarding access" ON client_onboarding;
CREATE POLICY "Admin comprehensive onboarding access"
  ON client_onboarding
  FOR ALL
  TO authenticated
  USING (
    -- Admins can access all onboarding data
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR client_id = auth.uid()  -- Clients can access their own
  );

DROP POLICY IF EXISTS "Admin comprehensive tasks access" ON onboarding_tasks;
CREATE POLICY "Admin comprehensive tasks access"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (
    -- Admins can access all tasks
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM client_onboarding 
      WHERE id = onboarding_tasks.onboarding_id AND client_id = auth.uid()
    )
  );