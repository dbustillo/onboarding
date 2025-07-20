/*
  # Admin Document Upload Function

  1. New Functions
    - `admin_insert_client_document` - Allows admins to insert documents for clients bypassing RLS
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Includes admin role check to ensure only admins can use it
    - Grants execute permission to authenticated users
  
  3. Purpose
    - Resolves RLS policy violations when admins upload documents for clients
    - Maintains security by validating admin permissions before insertion
*/

CREATE OR REPLACE FUNCTION public.admin_insert_client_document(
    p_client_id uuid,
    p_onboarding_id uuid,
    p_document_type text,
    p_file_name text,
    p_file_url text,
    p_file_size bigint,
    p_mime_type text,
    p_uploaded_by uuid,
    p_status text,
    p_notes text DEFAULT NULL
)
RETURNS public.client_documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    new_document public.client_documents;
BEGIN
    -- Check if the current user is an admin
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
        RAISE EXCEPTION 'Permission denied: Only admins can insert client documents via this function.';
    END IF;

    -- Insert the document record
    INSERT INTO public.client_documents (
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
    )
    VALUES (
        p_client_id,
        p_onboarding_id,
        p_document_type,
        p_file_name,
        p_file_url,
        p_file_size,
        p_mime_type,
        p_uploaded_by,
        p_status,
        p_notes
    )
    RETURNING * INTO new_document;

    RETURN new_document;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_insert_client_document TO authenticated;