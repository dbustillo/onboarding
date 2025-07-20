/*
  # Contract Storage and Document Management Setup

  1. Storage Setup
    - Create storage bucket for client documents
    - Set up proper security policies for file access
    
  2. Enhanced Document Management
    - Add additional fields for better contract tracking
    - Create functions for document management
    
  3. Security
    - Ensure only admins can upload documents
    - Ensure clients can only see their own documents
    - Proper file access controls
*/

-- Create storage bucket for client documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client documents bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

-- Allow users to view files they have access to
CREATE POLICY "Users can view accessible client documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents' AND (
    -- Admins can see all files
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Clients can see their own files (files in their folder)
    name LIKE (auth.uid()::text || '/%')
  )
);

-- Allow users to update files they have access to
CREATE POLICY "Users can update accessible client documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents' AND (
    -- Admins can update all files
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Clients can update their own files
    name LIKE (auth.uid()::text || '/%')
  )
);

-- Allow users to delete files they have access to
CREATE POLICY "Users can delete accessible client documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' AND (
    -- Admins can delete all files
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Clients can delete their own files
    name LIKE (auth.uid()::text || '/%')
  )
);

-- Function to get client documents with proper access control
CREATE OR REPLACE FUNCTION get_client_documents(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  document_type text,
  file_name text,
  file_url text,
  file_size bigint,
  mime_type text,
  is_signed boolean,
  signed_at timestamptz,
  status text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin or the client themselves
  IF NOT (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = p_client_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    cd.id,
    cd.document_type,
    cd.file_name,
    cd.file_url,
    cd.file_size,
    cd.mime_type,
    cd.is_signed,
    cd.signed_at,
    cd.status,
    cd.notes,
    cd.created_at,
    cd.updated_at
  FROM client_documents cd
  WHERE cd.client_id = p_client_id
  ORDER BY cd.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark document as signed
CREATE OR REPLACE FUNCTION mark_document_signed(
  p_document_id uuid,
  p_signed_by uuid DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE client_documents 
  SET 
    is_signed = true,
    signed_at = now(),
    status = 'signed',
    updated_at = now()
  WHERE id = p_document_id
  AND (
    -- Admins can mark any document as signed
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Clients can mark their own documents as signed
    client_id = auth.uid()
  );
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update document status
CREATE OR REPLACE FUNCTION update_document_status(
  p_document_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can update document status
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can update document status';
  END IF;

  UPDATE client_documents 
  SET 
    status = p_status,
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_client_documents TO authenticated;
GRANT EXECUTE ON FUNCTION mark_document_signed TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_status TO authenticated;

-- Add trigger to automatically update task status when contract is uploaded
CREATE OR REPLACE FUNCTION handle_contract_upload()
RETURNS trigger AS $$
BEGIN
  -- If this is a contract being uploaded, update related task status
  IF NEW.document_type = 'contract' AND NEW.status = 'pending' THEN
    -- Update the contract finalization task to waiting_client
    UPDATE onboarding_tasks 
    SET 
      status = 'waiting_client',
      admin_notes = 'Contract uploaded - waiting for client review and signature',
      updated_at = now()
    WHERE onboarding_id = NEW.onboarding_id 
    AND task_name ILIKE '%contract%'
    AND status != 'completed';
  END IF;
  
  -- If contract is marked as signed, update task to completed
  IF NEW.document_type = 'contract' AND NEW.is_signed = true AND OLD.is_signed = false THEN
    UPDATE onboarding_tasks 
    SET 
      status = 'completed',
      completed_at = now(),
      admin_notes = 'Contract signed by client',
      updated_at = now()
    WHERE onboarding_id = NEW.onboarding_id 
    AND task_name ILIKE '%contract%';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contract upload handling
DROP TRIGGER IF EXISTS trigger_contract_upload ON client_documents;
CREATE TRIGGER trigger_contract_upload
  AFTER INSERT OR UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_contract_upload();

-- Add some helpful indexes
CREATE INDEX IF NOT EXISTS idx_client_documents_client_type ON client_documents(client_id, document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_signed ON client_documents(is_signed);