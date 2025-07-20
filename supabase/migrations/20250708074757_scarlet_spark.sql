/*
  # Add admin RPC function for creating onboarding instances

  1. New Functions
    - `admin_create_onboarding_instance_and_tasks` - Allows admins to create onboarding instances and tasks bypassing RLS
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS policies
    - Grants execute permission to authenticated users
    - Creates both onboarding instance and default tasks in one transaction
*/

-- Create enum types if they don't exist (they should already exist based on schema)
DO $$ BEGIN
    CREATE TYPE task_owner_enum AS ENUM ('INSPIRE', 'CLIENT', 'BOTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('not_started', 'in_progress', 'waiting_client', 'waiting_admin', 'completed', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the admin RPC function
CREATE OR REPLACE FUNCTION admin_create_onboarding_instance_and_tasks(
    p_client_id uuid,
    p_template_id uuid DEFAULT NULL
)
RETURNS SETOF client_onboarding
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_onboarding client_onboarding;
    v_template_tasks jsonb;
    v_task jsonb;
    v_sort_order int := 0;
BEGIN
    -- Insert into client_onboarding
    INSERT INTO client_onboarding (
        client_id, 
        template_id,
        current_phase, 
        status, 
        started_at, 
        estimated_completion, 
        data
    )
    VALUES (
        p_client_id,
        p_template_id,
        'pre_onboarding',
        'in_progress',
        NOW(),
        NOW() + INTERVAL '30 days',
        '{}'::jsonb
    )
    RETURNING * INTO v_new_onboarding;

    -- Fetch tasks from template if template_id is provided
    IF p_template_id IS NOT NULL THEN
        SELECT tasks INTO v_template_tasks
        FROM onboarding_templates
        WHERE id = p_template_id AND is_active = true;
    END IF;

    -- Create tasks based on template or basic defaults
    IF v_template_tasks IS NOT NULL AND jsonb_array_length(v_template_tasks) > 0 THEN
        -- Create tasks from template
        FOR v_task IN SELECT * FROM jsonb_array_elements(v_template_tasks)
        LOOP
            INSERT INTO onboarding_tasks (
                onboarding_id, 
                category, 
                task_name, 
                task_description, 
                task_owner, 
                status, 
                priority, 
                sort_order, 
                metadata
            )
            VALUES (
                v_new_onboarding.id,
                COALESCE(v_task->>'category', 'General'),
                COALESCE(v_task->>'name', v_task->>'task_name', 'Unnamed Task'),
                v_task->>'description',
                COALESCE(v_task->>'owner', v_task->>'task_owner', 'INSPIRE'),
                'not_started',
                COALESCE(v_task->>'priority', 'medium'),
                v_sort_order,
                COALESCE(v_task->'metadata', '{}')::jsonb
            );
            v_sort_order := v_sort_order + 1;
        END LOOP;
    ELSE
        -- Create basic default tasks if no template or empty template tasks
        INSERT INTO onboarding_tasks (
            onboarding_id, category, task_name, task_description, task_owner, status, priority, sort_order, metadata
        ) VALUES
        (v_new_onboarding.id, 'Pre-Onboarding', 'Initial Client Contact', 'Establish initial contact and gather basic requirements', 'INSPIRE', 'not_started', 'high', 0, '{}'::jsonb),
        (v_new_onboarding.id, 'Pre-Onboarding', 'Contract Preparation', 'Prepare and send contract for client review', 'INSPIRE', 'not_started', 'high', 1, '{}'::jsonb),
        (v_new_onboarding.id, 'Tech & Integrations', 'System Integration Setup', 'Configure technical integrations and API connections', 'INSPIRE', 'not_started', 'medium', 2, '{}'::jsonb),
        (v_new_onboarding.id, 'Inventory & Inbounding', 'Inventory Setup', 'Configure inventory management and inbound processes', 'BOTH', 'not_started', 'medium', 3, '{}'::jsonb),
        (v_new_onboarding.id, 'Pilot Run & UAT', 'Pilot Testing', 'Conduct pilot run and user acceptance testing', 'BOTH', 'not_started', 'high', 4, '{}'::jsonb),
        (v_new_onboarding.id, 'GO LIVE', 'Go Live Preparation', 'Final preparations for going live', 'INSPIRE', 'not_started', 'critical', 5, '{}'::jsonb);
    END IF;

    RETURN QUERY SELECT * FROM client_onboarding WHERE id = v_new_onboarding.id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_create_onboarding_instance_and_tasks TO authenticated;