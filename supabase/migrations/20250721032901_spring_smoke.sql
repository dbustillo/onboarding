/*
  # Create admin_add_onboarding_task function

  1. New Function
    - `admin_add_onboarding_task` - Allows admins to add new onboarding tasks
    - Uses SECURITY DEFINER to bypass RLS policies
    - Validates admin permissions before allowing task creation
    - Properly handles enum type casting for database constraints

  2. Security
    - Function checks if user is admin before allowing task creation
    - Uses existing RLS policies for other operations
    - Maintains data integrity with proper type casting

  3. Parameters
    - All required task fields with proper types
    - Optional due_date and metadata parameters
    - Returns the newly created task record
*/

-- Create the admin function to add onboarding tasks
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
    new_task public.onboarding_tasks;
BEGIN
    -- Check if the current user is an admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can add onboarding tasks';
    END IF;

    -- Insert the new task
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
    ) VALUES (
        p_onboarding_id,
        p_category,
        p_task_name,
        p_task_description,
        p_task_owner::public.task_owner_enum,
        p_status::public.task_status_enum,
        p_priority::public.task_priority_enum,
        p_sort_order,
        p_due_date,
        p_metadata
    )
    RETURNING * INTO new_task;

    RETURN new_task;
END;
$$;