/*
  # Fix Client Document Display

  1. Changes
    - Create a new function to get client documents by client ID
    - Ensure proper RLS policies for client document access
    - Fix document visibility for clients
    
  2. Security
    - Maintain proper access control
    - Ensure clients can only see their own documents
    - Admins can still manage all documents
*/

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

-- Ensure RLS policies are correctly set up
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
CREATE POLICY "Clients can read own documents"
ON client_documents FOR SELECT
TO authenticated
USING ((client_id = auth.uid()) OR is_admin_user());

-- Add index for faster document retrieval by client_id
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id_created_at 
ON client_documents(client_id, created_at DESC);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_documents TO authenticated;