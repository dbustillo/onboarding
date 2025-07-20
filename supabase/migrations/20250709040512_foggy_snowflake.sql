/*
  # Fix Document Upload Permissions

  1. Changes
    - Create helper function to check if user is admin
    - Create admin document insert function that bypasses RLS
    - Update RLS policies for client_documents table
    - Use storage.create_policy() function instead of direct policy creation

  2. Security
    - Ensure admins can upload documents for clients
    - Maintain proper security boundaries
*/

-- Create helper function to check if user is admin
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

-- Create the admin document insert function
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
  result client_documents;
BEGIN
  -- Insert the document record
  INSERT INTO client_documents (
    client_id,
    document_type,
    file_name,
    file_url,
    onboarding_id,
    file_size,
    mime_type,
    notes,
    uploaded_by,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_client_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_onboarding_id,
    p_file_size,
    p_mime_type,
    p_notes,
    auth.uid(),
    'pending',
    now(),
    now()
  ) RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Update RLS policies for client_documents table
DROP POLICY IF EXISTS "Admins have full access to all documents" ON client_documents;
DROP POLICY IF EXISTS "Only admins can insert documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can update own documents" ON client_documents;
DROP POLICY IF EXISTS "Only admins can delete documents" ON client_documents;

-- Create comprehensive admin policy
CREATE POLICY "Admins have full access to all documents"
ON client_documents FOR ALL
TO authenticated
USING (is_admin_user());

-- Allow clients to read their own documents
CREATE POLICY "Clients can read own documents"
ON client_documents FOR SELECT
TO authenticated
USING ((client_id = auth.uid()) OR is_admin_user());

-- Allow clients to update their own documents
CREATE POLICY "Clients can update own documents"
ON client_documents FOR UPDATE
TO authenticated
USING ((client_id = auth.uid()) OR is_admin_user())
WITH CHECK ((client_id = auth.uid()) OR is_admin_user());

-- Only admins can delete documents
CREATE POLICY "Only admins can delete documents"
ON client_documents FOR DELETE
TO authenticated
USING (is_admin_user());

-- Only admins can insert documents
CREATE POLICY "Only admins can insert documents"
ON client_documents FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v6 TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;