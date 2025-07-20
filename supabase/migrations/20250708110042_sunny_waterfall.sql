/*
  # Fix RLS policies for document upload

  1. Security Updates
    - Drop existing problematic policies on client_documents table
    - Create new comprehensive policies that properly handle admin permissions
    - Add helper function to check admin status using profiles table
    - Ensure admins can insert, update, and manage all documents
    - Ensure clients can only access their own documents

  2. Changes
    - Create `is_admin_user()` function that checks profiles table
    - Replace existing policies with new ones that use proper admin checks
    - Add INSERT policy for admins to upload documents
    - Maintain security for client access
*/

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Drop existing policies on client_documents
DROP POLICY IF EXISTS "Admins can manage all documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can update own documents" ON client_documents;

-- Create new comprehensive policies for client_documents

-- Policy 1: Admins can do everything
CREATE POLICY "Admins have full access to all documents"
  ON client_documents
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Policy 2: Clients can read their own documents
CREATE POLICY "Clients can read own documents"
  ON client_documents
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR is_admin_user()
  );

-- Policy 3: Clients can update their own documents (for signing, etc.)
CREATE POLICY "Clients can update own documents"
  ON client_documents
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() OR is_admin_user()
  )
  WITH CHECK (
    client_id = auth.uid() OR is_admin_user()
  );

-- Policy 4: Only admins can insert new documents
CREATE POLICY "Only admins can insert documents"
  ON client_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Policy 5: Only admins can delete documents
CREATE POLICY "Only admins can delete documents"
  ON client_documents
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Create or update the admin_insert_client_document function
CREATE OR REPLACE FUNCTION admin_insert_client_document_v6(
  p_client_id uuid,
  p_document_type text,
  p_file_name text,
  p_file_url text,
  p_onboarding_id uuid DEFAULT NULL,
  p_file_size bigint DEFAULT NULL,
  p_mime_type text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_doc client_documents;
BEGIN
  -- Check if the current user is an admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admin users can insert client documents';
  END IF;

  -- Validate that the client exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'Client with ID % does not exist', p_client_id;
  END IF;

  -- Insert the document
  INSERT INTO client_documents (
    client_id,
    document_type,
    file_name,
    file_url,
    onboarding_id,
    file_size,
    mime_type,
    uploaded_by,
    notes,
    status
  ) VALUES (
    p_client_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_onboarding_id,
    p_file_size,
    p_mime_type,
    auth.uid(),
    p_notes,
    'pending'
  )
  RETURNING * INTO result_doc;

  RETURN result_doc;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v6 TO authenticated;

-- Also ensure the is_admin_user function is accessible
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;