/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current policies on profiles table are causing infinite recursion
    - Policies are trying to check user role by querying profiles table itself
    - This creates circular dependency when accessing profiles or related tables

  2. Solution
    - Drop all existing problematic policies on profiles table
    - Create new, simplified policies that avoid self-referential queries
    - Use auth.uid() for basic user access control
    - Use JWT metadata for admin role checking to avoid recursion
    - Ensure storage policies also work correctly

  3. New Policies
    - Users can read/update their own profile using auth.uid()
    - Admins can manage all profiles using JWT role metadata
    - Simple, non-recursive policy structure
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Admin comprehensive access" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, simplified policies that avoid infinite recursion

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can read all profiles (using JWT metadata to avoid recursion)
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      ''
    ) = 'admin'
    OR auth.uid() = id
  );

-- Policy 5: Admins can insert any profile (using JWT metadata)
CREATE POLICY "Admins can insert any profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      ''
    ) = 'admin'
    OR auth.uid() = id
  );

-- Policy 6: Admins can update any profile (using JWT metadata)
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      ''
    ) = 'admin'
    OR auth.uid() = id
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      ''
    ) = 'admin'
    OR auth.uid() = id
  );

-- Policy 7: Admins can delete profiles (using JWT metadata)
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      ''
    ) = 'admin'
  );

-- Create a function to safely check if user is admin (for other tables to use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  ) = 'admin';
$$;

-- Create a function to safely get user role from profiles (with fallback)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = user_id LIMIT 1),
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      'client'
    )
  );
$$;

-- Update other table policies to use the new safe functions instead of direct profile queries

-- Fix client_documents policies
DROP POLICY IF EXISTS "Admins can manage all documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can update own documents" ON client_documents;

CREATE POLICY "Admins can manage all documents"
  ON client_documents
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can read own documents"
  ON client_documents
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR is_admin());

CREATE POLICY "Clients can update own documents"
  ON client_documents
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid() OR is_admin())
  WITH CHECK (client_id = auth.uid() OR is_admin());

-- Fix onboarding_progress policies
DROP POLICY IF EXISTS "Admins can manage all progress" ON onboarding_progress;
DROP POLICY IF EXISTS "Clients can read own progress" ON onboarding_progress;

CREATE POLICY "Admins can manage all progress"
  ON onboarding_progress
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can read own progress"
  ON onboarding_progress
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE client_onboarding.id = onboarding_progress.onboarding_id
      AND client_onboarding.client_id = auth.uid()
    )
  );

-- Fix client_preferences policies
DROP POLICY IF EXISTS "Admins can read all preferences" ON client_preferences;
DROP POLICY IF EXISTS "Clients can manage own preferences" ON client_preferences;

CREATE POLICY "Admins can read all preferences"
  ON client_preferences
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can manage own preferences"
  ON client_preferences
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid() OR is_admin())
  WITH CHECK (client_id = auth.uid() OR is_admin());

-- Fix quote_submissions policies
DROP POLICY IF EXISTS "Admins can read all quote submissions" ON quote_submissions;
DROP POLICY IF EXISTS "Users can create own quote submissions" ON quote_submissions;
DROP POLICY IF EXISTS "Users can read own quote submissions" ON quote_submissions;

CREATE POLICY "Admins can manage all quote submissions"
  ON quote_submissions
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can create own quote submissions"
  ON quote_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own quote submissions"
  ON quote_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Fix onboarding_templates policies
DROP POLICY IF EXISTS "Admins can manage templates" ON onboarding_templates;
DROP POLICY IF EXISTS "Everyone can read active templates" ON onboarding_templates;

CREATE POLICY "Admins can manage templates"
  ON onboarding_templates
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Everyone can read active templates"
  ON onboarding_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

-- Fix client_onboarding policies
DROP POLICY IF EXISTS "Admin comprehensive onboarding access" ON client_onboarding;
DROP POLICY IF EXISTS "Admins can read all onboarding" ON client_onboarding;
DROP POLICY IF EXISTS "Clients can read own onboarding" ON client_onboarding;

CREATE POLICY "Admins can manage all onboarding"
  ON client_onboarding
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can read own onboarding"
  ON client_onboarding
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR is_admin());

CREATE POLICY "Clients can update own onboarding"
  ON client_onboarding
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid() OR is_admin())
  WITH CHECK (client_id = auth.uid() OR is_admin());

-- Fix onboarding_tasks policies
DROP POLICY IF EXISTS "Admin comprehensive tasks access" ON onboarding_tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON onboarding_tasks;
DROP POLICY IF EXISTS "Clients can read own tasks" ON onboarding_tasks;
DROP POLICY IF EXISTS "Clients can update own task notes" ON onboarding_tasks;

CREATE POLICY "Admins can manage all tasks"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can read own tasks"
  ON onboarding_tasks
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE client_onboarding.id = onboarding_tasks.onboarding_id
      AND client_onboarding.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update own task notes"
  ON onboarding_tasks
  FOR UPDATE
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE client_onboarding.id = onboarding_tasks.onboarding_id
      AND client_onboarding.client_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE client_onboarding.id = onboarding_tasks.onboarding_id
      AND client_onboarding.client_id = auth.uid()
    )
  );

-- Fix google_drive_resources policies
DROP POLICY IF EXISTS "Admins can manage all resources" ON google_drive_resources;
DROP POLICY IF EXISTS "Clients can read accessible resources" ON google_drive_resources;

CREATE POLICY "Admins can manage all resources"
  ON google_drive_resources
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can read accessible resources"
  ON google_drive_resources
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    (is_client_accessible = true AND EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE client_onboarding.id = google_drive_resources.onboarding_id
      AND client_onboarding.client_id = auth.uid()
    ))
  );

-- Fix contracts policies
DROP POLICY IF EXISTS "Admins can manage all contracts" ON contracts;
DROP POLICY IF EXISTS "Clients can read own contracts" ON contracts;

CREATE POLICY "Admins can manage all contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can read own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM client_onboarding
      WHERE client_onboarding.id = contracts.onboarding_id
      AND client_onboarding.client_id = auth.uid()
    )
  );

-- Fix notifications policies
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Admins can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Create admin function for document upload that bypasses RLS
CREATE OR REPLACE FUNCTION admin_insert_client_document_v6(
  p_client_id UUID,
  p_document_type TEXT,
  p_file_name TEXT,
  p_file_url TEXT,
  p_onboarding_id UUID DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_mime_type TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result client_documents;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can upload documents for clients';
  END IF;

  -- Insert the document
  INSERT INTO client_documents (
    client_id,
    onboarding_id,
    document_type,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    notes,
    status
  ) VALUES (
    p_client_id,
    p_onboarding_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_file_size,
    p_mime_type,
    auth.uid(),
    p_notes,
    'pending'
  ) RETURNING * INTO result;

  RETURN result;
END;
$$;