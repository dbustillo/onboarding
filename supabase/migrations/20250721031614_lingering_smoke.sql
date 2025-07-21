/*
  # Add admin function for adding onboarding tasks

  1. New Functions
    - `admin_add_onboarding_task` - Allows admins to add tasks bypassing RLS
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for admin operations
    - Grants execute permission to authenticated users
    - Validates admin permissions within the function
*/

CREATE OR REPLACE FUNCTION public.admin_add_onboarding_task(
    p_onboarding_id uuid,
    p_category text,
    p_task_name text,
    p_task_description text,
    p_task_owner text,
    p_status text,
    p_priority text,
    p_sort_order integer,
    p_due_date timestamptz DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.onboarding_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_task public.onboarding_tasks;
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can add tasks';
    END IF;

    INSERT INTO public.onboarding_tasks (
        onboarding_id,
        category,
        task_name,
        task_description,
        task_owner,
        status,
        priority,
        sort_order,
        due_date,
        metadata
    )
    VALUES (
        p_onboarding_id,
        p_category,
        p_task_name,
        p_task_description,
        p_task_owner::task_owner_enum,
        p_status::task_status_enum,
        p_priority::task_priority_enum,
        p_sort_order,
        p_due_date,
        p_metadata
    )
    RETURNING * INTO inserted_task;

    RETURN inserted_task;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_onboarding_task TO authenticated;