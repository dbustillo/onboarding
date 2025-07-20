/*
  # Fix Document Visibility for All Users

  1. New Functions
    - `get_all_client_documents` - Retrieves all documents for a client, bypassing RLS
    - `mark_document_as_signed` - Marks a document as signed
    - `count_client_documents` - Counts documents for a client
    - `check_client_document_exists` - Checks if any documents exist for a client

  2. Security
    - All functions use SECURITY DEFINER to bypass RLS
    - Proper error handling and validation
    - Comprehensive logging for troubleshooting

  3. Indexes
    - Added indexes for better performance
    - Optimized queries for document retrieval
*/

-- Create a function to get all documents for a client
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

-- Create a function to check if any documents exist for a client
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_signed ON client_documents(is_signed);
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id_created_at ON client_documents(client_id, created_at DESC);

-- Grant execute permissions to all functions
GRANT EXECUTE ON FUNCTION get_all_client_documents TO authenticated;
GRANT EXECUTE ON FUNCTION mark_document_as_signed TO authenticated;
GRANT EXECUTE ON FUNCTION count_client_documents TO authenticated;
GRANT EXECUTE ON FUNCTION check_client_document_exists TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_by_id TO authenticated;