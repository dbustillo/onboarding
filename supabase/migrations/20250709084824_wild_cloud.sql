/*
  # Admin Task Templates and Onboarding Management

  1. New Functions
    - `create_onboarding_from_template` - Creates a new onboarding instance from a template
    - `publish_tasks_to_client` - Publishes tasks to a client's onboarding
    - `get_template_tasks` - Gets tasks from a template
    - `clone_template` - Clones an existing template

  2. Security
    - All functions use SECURITY DEFINER to bypass RLS
    - Admin role checks are performed within functions
    - Proper error handling and validation
*/

-- Create a function to create an onboarding instance from a template
CREATE OR REPLACE FUNCTION create_onboarding_from_template(
  p_client_id uuid,
  p_template_id uuid,
  p_estimated_days integer DEFAULT 45
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_onboarding_id uuid;
  v_template_tasks jsonb;
  v_task jsonb;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can create onboarding instances';
  END IF;

  -- Check if client exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'Client does not exist';
  END IF;

  -- Check if template exists
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE id = p_template_id) THEN
    RAISE EXCEPTION 'Template does not exist';
  END IF;

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
    NOW() + (p_estimated_days || ' days')::interval,
    '{}'::jsonb
  )
  RETURNING id INTO v_onboarding_id;

  -- Get tasks from template
  SELECT tasks INTO v_template_tasks
  FROM onboarding_templates
  WHERE id = p_template_id;

  -- Create tasks from template
  FOR v_task IN SELECT * FROM jsonb_array_elements(v_template_tasks)
  LOOP
    INSERT INTO onboarding_tasks (
      onboarding_id,
      category,
      task_name,
      task_description,
      task_owner,
      status,
      priority,
      sort_order,
      metadata
    )
    VALUES (
      v_onboarding_id,
      v_task->>'category',
      v_task->>'task_name',
      v_task->>'task_description',
      v_task->>'task_owner',
      'not_started',
      v_task->>'priority',
      (v_task->>'sort_order')::integer,
      COALESCE(v_task->'metadata', '{}'::jsonb)
    );
  END LOOP;

  -- Initialize progress tracking
  PERFORM update_onboarding_progress(v_onboarding_id);

  RETURN v_onboarding_id;
END;
$$;

-- Create a function to publish tasks to a client's onboarding
CREATE OR REPLACE FUNCTION publish_tasks_to_client(
  p_onboarding_id uuid,
  p_tasks jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task jsonb;
  v_count integer := 0;
  v_client_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can publish tasks';
  END IF;

  -- Check if onboarding exists
  SELECT client_id INTO v_client_id
  FROM client_onboarding
  WHERE id = p_onboarding_id;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Onboarding does not exist';
  END IF;

  -- Delete existing tasks
  DELETE FROM onboarding_tasks
  WHERE onboarding_id = p_onboarding_id;

  -- Create new tasks
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks)
  LOOP
    INSERT INTO onboarding_tasks (
      onboarding_id,
      category,
      task_name,
      task_description,
      task_owner,
      status,
      priority,
      sort_order,
      metadata
    )
    VALUES (
      p_onboarding_id,
      v_task->>'category',
      v_task->>'task_name',
      v_task->>'task_description',
      v_task->>'task_owner',
      'not_started',
      v_task->>'priority',
      (v_task->>'sort_order')::integer,
      COALESCE(v_task->'metadata', '{}'::jsonb)
    );
    v_count := v_count + 1;
  END LOOP;

  -- Update progress tracking
  PERFORM update_onboarding_progress(p_onboarding_id);

  -- Create notification for client
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_onboarding_id
  )
  VALUES (
    v_client_id,
    'Onboarding Tasks Updated',
    'Your onboarding tasks have been updated. Please review your tasks.',
    'info',
    p_onboarding_id
  );

  RETURN v_count;
END;
$$;

-- Create a function to get tasks from a template
CREATE OR REPLACE FUNCTION get_template_tasks(
  p_template_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tasks jsonb;
BEGIN
  -- Check if template exists
  SELECT tasks INTO v_tasks
  FROM onboarding_templates
  WHERE id = p_template_id;

  IF v_tasks IS NULL THEN
    RAISE EXCEPTION 'Template does not exist';
  END IF;

  RETURN v_tasks;
END;
$$;

-- Create a function to clone a template
CREATE OR REPLACE FUNCTION clone_template(
  p_template_id uuid,
  p_new_name text,
  p_new_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_template_id uuid;
  v_template onboarding_templates;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can clone templates';
  END IF;

  -- Check if template exists
  SELECT * INTO v_template
  FROM onboarding_templates
  WHERE id = p_template_id;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template does not exist';
  END IF;

  -- Create new template
  INSERT INTO onboarding_templates (
    name,
    description,
    tasks,
    estimated_duration_days,
    is_active,
    created_by
  )
  VALUES (
    p_new_name,
    COALESCE(p_new_description, v_template.description || ' (Clone)'),
    v_template.tasks,
    v_template.estimated_duration_days,
    true,
    auth.uid()
  )
  RETURNING id INTO v_new_template_id;

  RETURN v_new_template_id;
END;
$$;

-- Create a function to get all templates
CREATE OR REPLACE FUNCTION get_all_templates()
RETURNS SETOF onboarding_templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM onboarding_templates
  ORDER BY created_at DESC;
END;
$$;

-- Create a function to get a template by ID
CREATE OR REPLACE FUNCTION get_template_by_id(
  p_template_id uuid
)
RETURNS SETOF onboarding_templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM onboarding_templates
  WHERE id = p_template_id;
END;
$$;

-- Create a function to update a template
CREATE OR REPLACE FUNCTION update_template(
  p_template_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_tasks jsonb DEFAULT NULL,
  p_estimated_duration_days integer DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template onboarding_templates;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can update templates';
  END IF;

  -- Check if template exists
  SELECT * INTO v_template
  FROM onboarding_templates
  WHERE id = p_template_id;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template does not exist';
  END IF;

  -- Update template
  UPDATE onboarding_templates
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    tasks = COALESCE(p_tasks, tasks),
    estimated_duration_days = COALESCE(p_estimated_duration_days, estimated_duration_days),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_template_id;

  RETURN true;
END;
$$;

-- Create a function to delete a template
CREATE OR REPLACE FUNCTION delete_template(
  p_template_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template onboarding_templates;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete templates';
  END IF;

  -- Check if template exists
  SELECT * INTO v_template
  FROM onboarding_templates
  WHERE id = p_template_id;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template does not exist';
  END IF;

  -- Delete template
  DELETE FROM onboarding_templates
  WHERE id = p_template_id;

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_onboarding_from_template TO authenticated;
GRANT EXECUTE ON FUNCTION publish_tasks_to_client TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION clone_template TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_templates TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION update_template TO authenticated;
GRANT EXECUTE ON FUNCTION delete_template TO authenticated;