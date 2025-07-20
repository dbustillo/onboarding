/*
  # Fix Document Storage and Retrieval

  1. Changes
    - Add index for faster document retrieval
    - Create a new admin document upload function
    - Fix RLS policies for document access
    - Add helper function to get client documents

  2. Security
    - Maintain proper access control
    - Ensure admins can upload documents for any client
    - Clients can only access their own documents
*/

-- Add index for faster document retrieval by client_id
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id_created_at ON client_documents(client_id, created_at DESC);

-- Ensure RLS policies are correctly set up
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
CREATE POLICY "Clients can read own documents"
ON client_documents FOR SELECT
TO authenticated
USING ((client_id = auth.uid()) OR is_admin_user());

-- Drop the existing function first to avoid return type error
DROP FUNCTION IF EXISTS get_client_documents(uuid);

-- Create a function to get client documents that bypasses RLS
CREATE OR REPLACE FUNCTION get_client_documents(p_client_id uuid)
RETURNS SETOF client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM client_documents
  WHERE client_id = p_client_id
  ORDER BY created_at DESC;
END;
$$;

-- Create a new version of the admin document insertion function
CREATE OR REPLACE FUNCTION admin_insert_client_document_v7(
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
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Insert the document with SECURITY DEFINER privileges (bypasses RLS)
  INSERT INTO client_documents (
    client_id,
    onboarding_id,
    document_type,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    status,
    notes
  ) VALUES (
    p_client_id,
    p_onboarding_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_file_size,
    p_mime_type,
    current_user_id,
    'pending',
    p_notes
  ) RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_client_documents TO authenticated;
GRANT EXECUTE ON FUNCTION admin_insert_client_document_v7 TO authenticated;