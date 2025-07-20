/*
  # Fix RLS policies for onboarding_templates table

  1. Changes
    - Drop existing problematic policies
    - Create new policies that properly handle admin permissions
    - Fix the issue with template creation violating RLS policies
    - Ensure proper access control for templates

  2. Security
    - Maintain proper access control
    - Ensure admins can create and manage templates
    - Allow all users to read active templates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage templates" ON onboarding_templates;
DROP POLICY IF EXISTS "Everyone can read active templates" ON onboarding_templates;

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Create new policies with correct admin role check
CREATE POLICY "Admins can manage templates"
  ON onboarding_templates
  FOR ALL
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Everyone can read active templates"
  ON onboarding_templates
  FOR SELECT
  TO authenticated
  USING (
    is_active = true OR is_admin_user()
  );

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;