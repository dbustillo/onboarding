/*
  # Fix RLS Policy for Onboarding Tasks Insert

  1. Policy Updates
    - Add INSERT policy for admins to create tasks
    - Ensure admins can insert tasks for any onboarding process
  
  2. Security
    - Maintains existing read/update policies
    - Only allows admins to insert new tasks
    - Uses is_admin() function for consistent admin checking
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Admins can insert tasks" ON onboarding_tasks;

-- Create new INSERT policy for admins
CREATE POLICY "Admins can insert tasks"
  ON onboarding_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Ensure the is_admin function exists and works correctly
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT role = 'admin'
      FROM profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;