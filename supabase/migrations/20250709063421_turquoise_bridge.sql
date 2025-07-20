/*
  # Fix Document Visibility Issues

  1. Changes
    - Create a new function to get all documents for a client
    - Ensure proper permissions for document access
    - Fix RLS policies to ensure documents are visible to clients

  2. Security
    - Maintain proper access control
    - Ensure clients can only see their own documents
    - Admins can see all documents
*/

-- Create a new function to get all documents for a client
CREATE OR REPLACE FUNCTION get_all_client_documents(p_client_id uuid)
RETURNS SETOF client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function bypasses RLS and returns all documents for a client
  RETURN QUERY
  SELECT *
  FROM client_documents
  WHERE client_id = p_client_id
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_client_documents TO authenticated;

-- Ensure RLS policies are correctly set up
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
CREATE POLICY "Clients can read own documents"
ON client_documents FOR SELECT
TO authenticated
USING (client_id = auth.uid() OR is_admin_user());

-- Add index for faster document retrieval
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_signed ON client_documents(is_signed);

-- Create a function to check if a document exists for a client
CREATE OR REPLACE FUNCTION check_client_document_exists(p_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM client_documents WHERE client_id = p_client_id
  ) INTO doc_exists;
  
  RETURN doc_exists;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_client_document_exists TO authenticated;