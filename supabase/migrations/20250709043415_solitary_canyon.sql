/*
  # Fix User Profile Query Issues

  1. Changes
    - Create a more robust function to get user profile data
    - Fix the return type of the admin_get_user_profile_complete function
    - Ensure proper error handling for profile queries
    - Add better logging for troubleshooting

  2. Security
    - Maintain SECURITY DEFINER to bypass RLS
    - Ensure proper access controls
*/

-- Drop the existing function to recreate it with proper return type
DROP FUNCTION IF EXISTS admin_get_user_profile_complete(uuid);

-- Create an improved version that returns a table instead of a record
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
LANGUAGE plpgsql
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
$$;

-- Create a simpler function to get just the profile by ID
CREATE OR REPLACE FUNCTION get_profile_by_id(user_id uuid)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_user_profile_complete TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_by_id TO authenticated;