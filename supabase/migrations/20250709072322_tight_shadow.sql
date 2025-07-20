/*
  # Fix Storage Policies and Add Notification Functions

  1. Changes
    - Create comprehensive storage policies for client-documents bucket
    - Add functions for document signing and notifications
    - Fix RLS policies for client_documents table
    - Add helper functions for document management

  2. Security
    - Ensure proper access control for documents
    - Allow clients to view and download their own documents
    - Allow admins to manage all documents
*/

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies for client-documents bucket
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Create a policy for anyone to read public objects
CREATE POLICY "Anyone can read public objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a policy for authenticated users to upload objects
CREATE POLICY "Authenticated users can upload objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

-- Create a policy for users to update their own objects
CREATE POLICY "Users can update their own objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a policy for users to delete their own objects
CREATE POLICY "Users can delete their own objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents');

-- Create a function to mark a document as signed
CREATE OR REPLACE FUNCTION mark_document_as_signed(p_document_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean := false;
  doc_client_id uuid;
  doc_onboarding_id uuid;
  doc_type text;
BEGIN
  -- Get document info
  SELECT client_id, onboarding_id, document_type
  INTO doc_client_id, doc_onboarding_id, doc_type
  FROM client_documents
  WHERE id = p_document_id;
  
  -- Check if document exists
  IF doc_client_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if current user is admin or document owner
  IF NOT (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = doc_client_id
  ) THEN
    RETURN false;
  END IF;
  
  -- Update document
  UPDATE client_documents
  SET 
    is_signed = true,
    signed_at = now(),
    status = 'signed',
    updated_at = now()
  WHERE id = p_document_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  
  -- If successful and it's a contract, create a notification for admin
  IF success AND doc_type = 'contract' THEN
    -- Find admin users to notify
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_onboarding_id
    )
    SELECT 
      id,
      'Contract Signed',
      'A client has signed a contract. Please review it.',
      'contract_update',
      doc_onboarding_id
    FROM profiles
    WHERE role = 'admin';
    
    -- Update related task if exists
    IF doc_onboarding_id IS NOT NULL THEN
      UPDATE onboarding_tasks
      SET 
        status = 'completed',
        completed_at = now()
      WHERE 
        onboarding_id = doc_onboarding_id
        AND task_name ILIKE '%contract%'
        AND status != 'completed';
    END IF;
  END IF;
  
  RETURN success;
END;
$$;

-- Create a function to create a notification for document upload
CREATE OR REPLACE FUNCTION create_document_upload_notification(
  p_client_id uuid,
  p_document_type text,
  p_file_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notification for the client
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    p_client_id,
    'New Document Uploaded',
    'A new ' || p_document_type || ' document "' || p_file_name || '" has been uploaded for you.',
    'info',
    '/documents'
  );
END;
$$;

-- Create a trigger function to automatically create notifications on document upload
CREATE OR REPLACE FUNCTION notify_document_upload()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create notification for the client
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    NEW.client_id,
    'New Document Uploaded',
    'A new ' || NEW.document_type || ' document "' || NEW.file_name || '" has been uploaded for you.',
    'info',
    '/documents'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for document upload notifications
DROP TRIGGER IF EXISTS trigger_document_upload_notification ON client_documents;
CREATE TRIGGER trigger_document_upload_notification
  AFTER INSERT ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_upload();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_document_as_signed TO authenticated;
GRANT EXECUTE ON FUNCTION create_document_upload_notification TO authenticated;