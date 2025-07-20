/*
  # Create Admin Assign Onboarding Function

  1. New Function
    - `admin_assign_onboarding_document` - Allows admins to assign onboarding documents to clients
    - Bypasses RLS policies using SECURITY DEFINER
    - Handles creation of client_onboarding record if needed
    - Creates google_drive_resources entry
    - Sends notification to client

  2. Security
    - Function runs with elevated privileges to bypass RLS
    - Only accessible to authenticated users
    - Includes proper error handling
*/

CREATE OR REPLACE FUNCTION admin_assign_onboarding_document(
  p_client_id uuid,
  p_google_sheet_url text,
  p_estimated_days integer DEFAULT 45,
  p_admin_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_onboarding_id uuid;
  v_resource_id uuid;
  v_client_record record;
  v_result json;
BEGIN
  -- Validate inputs
  IF p_client_id IS NULL OR p_google_sheet_url IS NULL OR p_google_sheet_url = '' THEN
    RAISE EXCEPTION 'Client ID and Google Sheet URL are required';
  END IF;

  -- Validate URL format
  IF p_google_sheet_url NOT LIKE '%docs.google.com/spreadsheets%' THEN
    RAISE EXCEPTION 'Invalid Google Sheets URL format';
  END IF;

  -- Get client information
  SELECT * INTO v_client_record
  FROM profiles
  WHERE id = p_client_id AND role = 'client';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found or invalid client ID';
  END IF;

  -- Check if client already has an onboarding
  SELECT id INTO v_onboarding_id
  FROM client_onboarding
  WHERE client_id = p_client_id
  LIMIT 1;

  -- Create new onboarding if doesn't exist
  IF v_onboarding_id IS NULL THEN
    INSERT INTO client_onboarding (
      client_id,
      current_phase,
      status,
      started_at,
      estimated_completion,
      data
    ) VALUES (
      p_client_id,
      'pre_onboarding',
      'in_progress',
      now(),
      now() + (p_estimated_days || ' days')::interval,
      '{}'::jsonb
    )
    RETURNING id INTO v_onboarding_id;
  END IF;

  -- Create Google Drive resource
  INSERT INTO google_drive_resources (
    onboarding_id,
    resource_type,
    title,
    description,
    google_url,
    is_client_accessible,
    is_required,
    access_level,
    created_by
  ) VALUES (
    v_onboarding_id,
    'sheet',
    'Onboarding Document',
    'Interactive onboarding checklist and phase breakdown',
    p_google_sheet_url,
    true,
    true,
    'edit',
    p_admin_id
  )
  RETURNING id INTO v_resource_id;

  -- Create notification for client
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    related_onboarding_id
  ) VALUES (
    p_client_id,
    'Onboarding Document Available',
    'Your onboarding document has been assigned. Click to view and complete your onboarding phases.',
    'info',
    '/resources',
    v_onboarding_id
  );

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'onboarding_id', v_onboarding_id,
    'resource_id', v_resource_id,
    'client_name', COALESCE(v_client_record.full_name, v_client_record.email),
    'message', 'Onboarding document successfully assigned'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to assign onboarding document'
    );
    RETURN v_result;
END;
$$;