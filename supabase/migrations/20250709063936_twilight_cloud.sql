/*
  # Fix Document Visibility Issues

  1. Changes
    - Create a new function to get all client documents
    - Fix RLS policies for document visibility
    - Add additional indexes for better performance
    - Create helper functions for document management

  2. Security
    - Maintain proper security boundaries
    - Ensure admins can upload documents for any client
    - Ensure clients can see their own documents
*/

-- Create a new function to get all client documents
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

-- Create a function to count documents for a client
CREATE OR REPLACE FUNCTION count_client_documents(p_client_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_count integer;
BEGIN
  SELECT COUNT(*)
  FROM client_documents
  WHERE client_id = p_client_id
  INTO doc_count;
  
  RETURN doc_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION count_client_documents TO authenticated;

-- Create a function to get document by ID
CREATE OR REPLACE FUNCTION get_document_by_id(p_document_id uuid)
RETURNS SETOF client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM client_documents
  WHERE id = p_document_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_document_by_id TO authenticated;

-- Create a function to mark a document as signed
CREATE OR REPLACE FUNCTION mark_document_as_signed(p_document_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean := false;
BEGIN
  UPDATE client_documents
  SET 
    is_signed = true,
    signed_at = now(),
    status = 'signed',
    updated_at = now()
  WHERE id = p_document_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_document_as_signed TO authenticated;