/*
  # Corrected Onboarding Template Based on Google Sheets Screenshots

  This migration creates a new onboarding template that contains ONLY the tasks
  visible in the provided Google Sheets screenshots, properly ordered chronologically.

  1. New Template Structure
    - Pre-Onboarding (13 tasks)
    - Tech & Marketplace Integration (5 tasks) 
    - Inventory & Inbounding (10 tasks)
    - Pilot Run & User Acceptance (UAT) (6 tasks)
    - GO LIVE (5 tasks)

  2. Content Verification
    - All tasks match exactly what appears in Google Sheets screenshots
    - Removed any tasks not found in the screenshots (like Storage Requirements Assessment)
    - Proper chronological ordering with GO LIVE as final step

  3. Task Details
    - Exact task names from screenshots
    - Target completion dates where specified
    - Proper task ownership and priority assignments
*/

-- First, deactivate any existing templates
UPDATE onboarding_templates SET is_active = false WHERE is_active = true;

-- Create the corrected onboarding template based on Google Sheets screenshots
INSERT INTO onboarding_templates (
  name,
  description,
  tasks,
  estimated_duration_days,
  is_active
) VALUES (
  'Standard Client Onboarding - Corrected',
  'Complete 5-phase onboarding process matching Google Sheets documentation',
  '[
    {
      "category": "Pre-Onboarding",
      "task_name": "Client Requirement Specifications finalized (warehousing & storage, sales channels, fulfillment, etc.)",
      "task_description": "Define and document client service requirements and expectations",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 1,
      "metadata": {"target_date": "2025-Jun-27"}
    },
    {
      "category": "Pre-Onboarding", 
      "task_name": "SLA & Pricing Sign-off",
      "task_description": "Review and approve Service Level Agreement and pricing structure",
      "task_owner": "BOTH",
      "priority": "critical",
      "sort_order": 2,
      "metadata": {"target_date": "2025-Jul-02"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Primary and secondary contacts (Sales, Tech, Ops)",
      "task_description": "Identify primary and secondary contact persons for ongoing communication",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 3,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)",
      "task_description": "Assign internal team members for client management",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 4,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Contact channels or chat groups created (Viber or Whatsapp)",
      "task_description": "Establish communication channels for ongoing coordination",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 5,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Client logo (for branding needs)",
      "task_description": "Obtain client logo for branding and packaging requirements",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 6,
      "metadata": {"target_date": "2025-Jul-01"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Escalation protocol (key persons for issues or concerns)",
      "task_description": "Define escalation procedures and key contact persons",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 7,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Raw export of product file from current provider (for product data matching by Inspire team, to avoid issues during marketplace integration)",
      "task_description": "Export complete product data from current fulfillment provider",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 8,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Product Classification: Fast-moving / Average / Slow-moving",
      "task_description": "Categorize products by movement velocity for optimal placement",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 9,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Packaging specs provided (sample video, if available)",
      "task_description": "Provide packaging specifications and requirements",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 10,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Marketplace user access shared with Inspire Team for system integration",
      "task_description": "Grant marketplace platform access for integration setup",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 11,
      "metadata": {"target_date": "2025-Jul-02"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Sandbox system access (to be provided by Inspire)",
      "task_description": "Provide sandbox environment access for testing",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 12,
      "metadata": {}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Client Data Room access (Google Drive document storage) (to be provided by Inspire)",
      "task_description": "Set up secure document storage and sharing access",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 13,
      "metadata": {}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Lazada, Shopee, TikTok Shop, Shopify, etc. connected",
      "task_description": "Connect all marketplace platforms to fulfillment system",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 14,
      "metadata": {}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "API keys or plugin access granted (Shopify only)",
      "task_description": "Configure API access for Shopify integration",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 15,
      "metadata": {}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Channel-specific mapping validated",
      "task_description": "Verify product mapping across all sales channels",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 16,
      "metadata": {}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Marketplace Integration testing",
      "task_description": "Test marketplace connections and data flow",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 17,
      "metadata": {}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Live order testing with warehouse team",
      "task_description": "Conduct live order tests with warehouse operations",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 18,
      "metadata": {}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Product transfer scheduled (ASN created by the Client)",
      "task_description": "Schedule product transfer with advance shipping notice",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 19,
      "metadata": {"target_date": "2025-Jul-05"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Warehouse receiving orders created in WMS (ASN received by Inspire Team)",
      "task_description": "Create warehouse receiving orders in management system",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 20,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Product Inspection & Verification (QA by Inspire Team)",
      "task_description": "Conduct quality assurance inspection of received products",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 21,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Physical receiving completed (by Inspire Team)",
      "task_description": "Complete physical receipt and documentation of inventory",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 22,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "QA completed (quantity, damage, labeling) (by Inspire Team)",
      "task_description": "Complete quality assurance checks for quantity, damage, and labeling",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 23,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Products mapped to correct put-away zones (by Inspire Team)",
      "task_description": "Map products to appropriate warehouse storage zones",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 24,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Stock put-away logged in system (by Inspire Team)",
      "task_description": "Log inventory placement in warehouse management system",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 25,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Initial picking and packing process defined (by Inspire Team)",
      "task_description": "Establish picking and packing procedures for client products",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 26,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Packaging materials prepared (SKUs needing boxes, fillers, etc.) (by Inspire Team)",
      "task_description": "Prepare packaging materials for client product requirements",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 27,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Returns intake process agreed (restocking vs disposal)",
      "task_description": "Define procedures for handling returned merchandise",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 28,
      "metadata": {}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Simulate small batch orders from each marketplace",
      "task_description": "Test order processing with small batches from all platforms",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 29,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Cross-functional observation (CS, WH, Tech, Client)",
      "task_description": "Conduct cross-team observation of pilot processes",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 30,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Notes on gaps or improvement opportunities",
      "task_description": "Document identified gaps and improvement areas",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 31,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Sign-off from client team post-pilot",
      "task_description": "Obtain client approval after pilot testing completion",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 32,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Internal validation: Ops, WH, Tech (by Inspire Team)",
      "task_description": "Internal team validation of pilot results",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 33,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Final tweaks to workflow or system settings",
      "task_description": "Implement final adjustments based on pilot feedback",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 34,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "GO LIVE",
      "task_name": "First batch of live orders processed and dispatched",
      "task_description": "Process and dispatch initial live customer orders",
      "task_owner": "INSPIRE",
      "priority": "critical",
      "sort_order": 35,
      "metadata": {"target_date": "2025-Jul-10"}
    },
    {
      "category": "GO LIVE",
      "task_name": "Day 1 to Day 3 support window prepared",
      "task_description": "Provide intensive support during initial go-live period",
      "task_owner": "INSPIRE",
      "priority": "critical",
      "sort_order": 36,
      "metadata": {"target_date": "2025-Jul-12"}
    },
    {
      "category": "GO LIVE",
      "task_name": "7-day operational check-in",
      "task_description": "Conduct operational review after first week of live operations",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 37,
      "metadata": {}
    },
    {
      "category": "GO LIVE",
      "task_name": "30-day performance review",
      "task_description": "Comprehensive performance evaluation after 30 days",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 38,
      "metadata": {}
    },
    {
      "category": "GO LIVE",
      "task_name": "Initial optimization plan discussed (cutoffs, TATs, workflows)",
      "task_description": "Discuss and plan initial optimizations for ongoing operations",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 39,
      "metadata": {}
    }
  ]'::jsonb,
  45,
  true
);