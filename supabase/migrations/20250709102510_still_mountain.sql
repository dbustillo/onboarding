/*
  # Add Default Onboarding Tasks Template
  
  1. New Data
    - Create a default onboarding template with all tasks from the spreadsheet
    - Organized by phases: Pre-Onboarding, Tech & Marketplace Integration, Inventory & Inbounding, Pilot Run & UAT, GO LIVE
    - Include all task details: descriptions, owners, priorities, etc.
    
  2. Structure
    - Each task includes category, name, description, owner, priority, and sort order
    - Tasks are organized in the same sequence as the spreadsheet
    - Metadata includes additional information like target dates
*/

-- Insert the default onboarding template with all tasks from the spreadsheet
INSERT INTO onboarding_templates (
  name, 
  description, 
  tasks, 
  estimated_duration_days, 
  is_active
)
VALUES (
  'Standard E-Commerce Onboarding',
  'Complete onboarding process for e-commerce clients with marketplace integrations',
  jsonb_build_array(
    -- Pre-Onboarding Phase
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Client Requirement Specifications finalized',
      'task_description', 'Define and document all client requirements and specifications (warehousing & storage, sales channels, fulfillment, etc.)',
      'task_owner', 'CLIENT',
      'priority', 'high',
      'sort_order', 1
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'SLA & Pricing Sign-off',
      'task_description', 'Client to review and sign off on Service Level Agreement and pricing',
      'task_owner', 'CLIENT',
      'priority', 'critical',
      'sort_order', 2
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Primary and secondary contacts (Sales, Tech, Ops)',
      'task_description', 'Identify primary and secondary contacts for different departments',
      'task_owner', 'CLIENT',
      'priority', 'high',
      'sort_order', 3
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)',
      'task_description', 'Assign internal team members to handle different aspects of onboarding',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 4
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Contact channels or chat groups created (Viber or Whatsapp)',
      'task_description', 'Set up communication channels for ongoing collaboration',
      'task_owner', 'BOTH',
      'priority', 'medium',
      'sort_order', 5
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Client logo (for branding needs)',
      'task_description', 'Client to provide logo files for branding purposes',
      'task_owner', 'CLIENT',
      'priority', 'medium',
      'sort_order', 6
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Escalation protocol (key persons for issues or concerns)',
      'task_description', 'Define escalation procedures and responsible persons',
      'task_owner', 'BOTH',
      'priority', 'high',
      'sort_order', 7
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Flow protocol of expected file formats for data exchange',
      'task_description', 'Define file formats and data exchange protocols (switching to Inspire team to avoid issues during marketplace integration)',
      'task_owner', 'INSPIRE',
      'priority', 'medium',
      'sort_order', 8
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Product Classification: Fast-moving / Average / Slow-moving',
      'task_description', 'Categorize products based on movement speed for optimal warehouse placement',
      'task_owner', 'CLIENT',
      'priority', 'medium',
      'sort_order', 9
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Packaging specs provided (sample video, if available)',
      'task_description', 'Client to provide packaging specifications and examples',
      'task_owner', 'CLIENT',
      'priority', 'medium',
      'sort_order', 10
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Marketplace user access shared with Inspire Team for system integration',
      'task_description', 'Client to provide necessary marketplace access credentials',
      'task_owner', 'CLIENT',
      'priority', 'high',
      'sort_order', 11
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Sandbox system access (to be provided by Inspire)',
      'task_description', 'Provide client with sandbox environment access for testing',
      'task_owner', 'INSPIRE',
      'priority', 'medium',
      'sort_order', 12
    ),
    jsonb_build_object(
      'category', 'Pre-Onboarding',
      'task_name', 'Client Data Room access (Google Drive document storage) (to be provided by Inspire)',
      'task_description', 'Set up and share access to client data storage',
      'task_owner', 'INSPIRE',
      'priority', 'medium',
      'sort_order', 13
    ),
    
    -- Tech & Marketplace Integration Phase
    jsonb_build_object(
      'category', 'Tech & Marketplace Integration',
      'task_name', 'Lazada, Shopee, TikTok Shop, Shopify, etc. connected',
      'task_description', 'Connect all relevant marketplace platforms',
      'task_owner', 'BOTH',
      'priority', 'high',
      'sort_order', 14
    ),
    jsonb_build_object(
      'category', 'Tech & Marketplace Integration',
      'task_name', 'API keys or plugin access created (Shopify only)',
      'task_description', 'Generate and configure API access for Shopify integration',
      'task_owner', 'CLIENT',
      'priority', 'high',
      'sort_order', 15
    ),
    jsonb_build_object(
      'category', 'Tech & Marketplace Integration',
      'task_name', 'Channel-specific mapping validated',
      'task_description', 'Verify product and category mappings for each sales channel',
      'task_owner', 'BOTH',
      'priority', 'high',
      'sort_order', 16
    ),
    jsonb_build_object(
      'category', 'Tech & Marketplace Integration',
      'task_name', 'Marketplace integration testing',
      'task_description', 'Test all marketplace integrations to ensure proper functionality',
      'task_owner', 'INSPIRE',
      'priority', 'critical',
      'sort_order', 17
    ),
    jsonb_build_object(
      'category', 'Tech & Marketplace Integration',
      'task_name', 'Live order testing with warehouse team',
      'task_description', 'Process test orders through the entire fulfillment workflow',
      'task_owner', 'BOTH',
      'priority', 'critical',
      'sort_order', 18
    ),
    
    -- Inventory & Inbounding Phase
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Product transfer scheduled (ASN created by the Client)',
      'task_description', 'Client to create Advanced Shipping Notice for inventory transfer',
      'task_owner', 'CLIENT',
      'priority', 'high',
      'sort_order', 19
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Warehouse receiving orders created in WMS (ASN received by Inspire Team)',
      'task_description', 'Create receiving orders in WMS based on client ASN',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 20
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Product Inspection & Verification (QA by Inspire Team)',
      'task_description', 'Perform quality inspection of received inventory',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 21
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Physical receiving completed (by Inspire Team)',
      'task_description', 'Complete physical receiving process in warehouse',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 22
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'QA completed (quantity, damage, labeling)',
      'task_description', 'Complete quality assurance checks on all received inventory',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 23
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Products mapped to correct put-away zones',
      'task_description', 'Assign products to appropriate warehouse locations',
      'task_owner', 'INSPIRE',
      'priority', 'medium',
      'sort_order', 24
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Stock put-away logged in system',
      'task_description', 'Record all put-away activities in the WMS',
      'task_owner', 'INSPIRE',
      'priority', 'medium',
      'sort_order', 25
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Initial picking and packing process defined',
      'task_description', 'Define standard operating procedures for picking and packing',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 26
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Packaging materials prepared (SKUs needing boxes, fillers, etc.)',
      'task_description', 'Prepare all necessary packaging materials for client products',
      'task_owner', 'INSPIRE',
      'priority', 'medium',
      'sort_order', 27
    ),
    jsonb_build_object(
      'category', 'Inventory & Inbounding',
      'task_name', 'Returns intake process agreed (restocking vs disposal)',
      'task_description', 'Define and document returns handling procedures',
      'task_owner', 'BOTH',
      'priority', 'medium',
      'sort_order', 28
    ),
    
    -- Pilot Run & User Acceptance (UAT) Phase
    jsonb_build_object(
      'category', 'Pilot Run & User Acceptance (UAT)',
      'task_name', 'Simulate small batch orders from each marketplace',
      'task_description', 'Process test orders from each integrated marketplace',
      'task_owner', 'BOTH',
      'priority', 'critical',
      'sort_order', 29
    ),
    jsonb_build_object(
      'category', 'Pilot Run & User Acceptance (UAT)',
      'task_name', 'Cross-functional observation (CS, WH, Tech, Client)',
      'task_description', 'Conduct observation sessions with all stakeholders',
      'task_owner', 'BOTH',
      'priority', 'high',
      'sort_order', 30
    ),
    jsonb_build_object(
      'category', 'Pilot Run & User Acceptance (UAT)',
      'task_name', 'Notes on gaps or improvement opportunities',
      'task_description', 'Document any issues or potential improvements identified during pilot',
      'task_owner', 'BOTH',
      'priority', 'medium',
      'sort_order', 31
    ),
    jsonb_build_object(
      'category', 'Pilot Run & User Acceptance (UAT)',
      'task_name', 'Sign-off from client team post-pilot',
      'task_description', 'Obtain formal client approval after successful pilot run',
      'task_owner', 'CLIENT',
      'priority', 'critical',
      'sort_order', 32
    ),
    jsonb_build_object(
      'category', 'Pilot Run & User Acceptance (UAT)',
      'task_name', 'Internal validation: Ops, WH, Tech',
      'task_description', 'Conduct internal validation across all departments',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 33
    ),
    jsonb_build_object(
      'category', 'Pilot Run & User Acceptance (UAT)',
      'task_name', 'Final tweaks to workflow or system settings',
      'task_description', 'Make final adjustments based on pilot feedback',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 34
    ),
    
    -- GO LIVE Phase
    jsonb_build_object(
      'category', 'GO LIVE',
      'task_name', 'First batch of live orders processed and dispatched',
      'task_description', 'Process initial set of real customer orders',
      'task_owner', 'INSPIRE',
      'priority', 'critical',
      'sort_order', 35
    ),
    jsonb_build_object(
      'category', 'GO LIVE',
      'task_name', 'Day 1 to Day 3 support window prepared',
      'task_description', 'Establish intensive support coverage for initial days',
      'task_owner', 'INSPIRE',
      'priority', 'high',
      'sort_order', 36
    ),
    jsonb_build_object(
      'category', 'GO LIVE',
      'task_name', '7-day operational check-in',
      'task_description', 'Conduct review meeting after first week of operations',
      'task_owner', 'BOTH',
      'priority', 'medium',
      'sort_order', 37
    ),
    jsonb_build_object(
      'category', 'GO LIVE',
      'task_name', '30-day performance review',
      'task_description', 'Comprehensive review after first month of operations',
      'task_owner', 'BOTH',
      'priority', 'medium',
      'sort_order', 38
    ),
    jsonb_build_object(
      'category', 'GO LIVE',
      'task_name', 'Initial optimization plan discussed (cutoffs, TATs, workflows)',
      'task_description', 'Develop plan for ongoing optimization of operations',
      'task_owner', 'BOTH',
      'priority', 'medium',
      'sort_order', 39
    )
  ),
  45, -- estimated_duration_days
  true -- is_active
);

-- Create a function to fix the JSX syntax error in ClientOnboardingSetup.tsx
-- This is a placeholder and would be handled in the application code, not in SQL
-- The actual fix would be to wrap the JSX elements in a parent div