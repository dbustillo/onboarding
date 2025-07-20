/*
  # Fix RLS policies for onboarding_templates table

  1. Changes
    - Drop existing policies that use is_admin() function
    - Create new policies that use the correct admin role check pattern
    - Ensure admins can create and manage templates
    - Ensure all users can read active templates

  2. Security
    - Maintain proper access control
    - Use consistent pattern for admin role checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage templates" ON onboarding_templates;
DROP POLICY IF EXISTS "Everyone can read active templates" ON onboarding_templates;

-- Create new policies with correct admin role check
CREATE POLICY "Admins can manage templates"
  ON onboarding_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can read active templates"
  ON onboarding_templates
  FOR SELECT
  TO authenticated
  USING (
    is_active = true OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );