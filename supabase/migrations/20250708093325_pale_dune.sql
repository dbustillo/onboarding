-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can manage all documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can insert own documents" ON client_documents;
DROP POLICY IF EXISTS "Clients can update own documents" ON client_documents;

-- Drop existing function if it exists (with any parameter signature)
DROP FUNCTION IF EXISTS admin_insert_client_document;

-- Create comprehensive admin policy for all operations
CREATE POLICY "Admins can manage all documents"
  ON client_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow clients to read their own documents
CREATE POLICY "Clients can read own documents"
  ON client_documents
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Allow clients to insert their own documents
CREATE POLICY "Clients can insert own documents"
  ON client_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Allow clients to update their own documents
CREATE POLICY "Clients can update own documents"
  ON client_documents
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Create RPC function for admin document insertion to bypass RLS if needed
-- Fixed parameter order: required parameters first, then optional ones with defaults
CREATE OR REPLACE FUNCTION admin_insert_client_document(
  p_client_id uuid,
  p_document_type text,
  p_file_name text,
  p_file_url text,
  p_onboarding_id uuid DEFAULT NULL,
  p_task_id uuid DEFAULT NULL,
  p_file_size bigint DEFAULT NULL,
  p_mime_type text DEFAULT NULL,
  p_uploaded_by uuid DEFAULT NULL,
  p_status text DEFAULT 'pending',
  p_notes text DEFAULT NULL
)
RETURNS client_documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result client_documents;
  current_user_role text;
BEGIN
  -- Check if the current user is an admin
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;
  
  -- Insert the document
  INSERT INTO client_documents (
    client_id,
    onboarding_id,
    task_id,
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
    p_task_id,
    p_document_type,
    p_file_name,
    p_file_url,
    p_file_size,
    p_mime_type,
    COALESCE(p_uploaded_by, auth.uid()),
    p_status,
    p_notes
  ) RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_insert_client_document TO authenticated;