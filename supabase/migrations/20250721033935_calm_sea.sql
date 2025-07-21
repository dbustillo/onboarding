/*
  # Fix Task Addition RLS Policies

  1. Security Updates
    - Create comprehensive RLS policies for onboarding_tasks
    - Add admin functions with proper security
    - Enable task insertion for admins

  2. Functions
    - Create is_admin_user() function for consistent admin checking
    - Add admin_add_task() function with SECURITY DEFINER
    - Ensure proper enum type handling

  3. Policies
    - Allow admins to insert, update, delete tasks
    - Allow clients to read and update their own task notes
    - Maintain security while enabling functionality
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can manage all tasks" ON onboarding_tasks;
DROP POLICY IF EXISTS "Clients can read own tasks" ON onboarding_tasks;
DROP POLICY IF EXISTS "Clients can update own task notes" ON onboarding_tasks;

-- Create or replace the admin checking function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND status IN ('approved', 'active')
  );
END;
$$;

-- Create admin task addition function
CREATE OR REPLACE FUNCTION admin_add_task(
  p_onboarding_id uuid,
  p_category text,
  p_task_name text,
  p_task_description text DEFAULT '',
  p_task_owner text DEFAULT 'CLIENT',
  p_priority text DEFAULT 'medium',
  p_sort_order integer DEFAULT 0
)
RETURNS onboarding_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_task onboarding_tasks;
BEGIN
  -- Check if user is admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Insert the new task
  INSERT INTO onboarding_tasks (
    onboarding_id,
    category,
    task_name,
    task_description,
    task_owner,
    priority,
    status,
    sort_order,
    metadata
  ) VALUES (
    p_onboarding_id,
    p_category,
    p_task_name,
    p_task_description,
    p_task_owner::task_owner_enum,
    p_priority::task_priority_enum,
    'not_started'::task_status_enum,
    p_sort_order,
    '{}'::jsonb
  )
  RETURNING * INTO new_task;
  
  RETURN new_task;
END;
$$;

-- Create comprehensive RLS policies
CREATE POLICY "Admins have full access to tasks"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Clients can read their onboarding tasks"
  ON onboarding_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM client_onboarding 
      WHERE client_onboarding.id = onboarding_tasks.onboarding_id 
      AND client_onboarding.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their task notes"
  ON onboarding_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM client_onboarding 
      WHERE client_onboarding.id = onboarding_tasks.onboarding_id 
      AND client_onboarding.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM client_onboarding 
      WHERE client_onboarding.id = onboarding_tasks.onboarding_id 
      AND client_onboarding.client_id = auth.uid()
    )
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_add_task(uuid, text, text, text, text, text, integer) TO authenticated;