/*
  # Updated 5-Phase Onboarding Template - Only Original Screenshot Content

  This migration creates a new onboarding template that contains ONLY the tasks
  and content that appear in the original 5 phase screenshots provided.
  
  1. New Template
    - `inspire_5_phase_onboarding_original` template
    - Contains only tasks visible in the 5 original screenshots
    - Removes any additional content not shown in original images
    
  2. Task Structure
    - Exactly matches the 5 phases from screenshots
    - Only includes tasks that were visible in original images
    - Removes storage requirements assessment and other non-original content
    
  3. Phase Breakdown
    - Pre-Onboarding (13 tasks)
    - Tech & Marketplace Integration (5 tasks) 
    - Inventory & Inbounding (10 tasks)
    - Pilot Run & User Acceptance (6 tasks)
    - GO LIVE (5 tasks)
*/

-- First, deactivate any existing templates to avoid conflicts
UPDATE onboarding_templates SET is_active = false WHERE name LIKE '%inspire%';

-- Create the new template with only original screenshot content
INSERT INTO onboarding_templates (
  name,
  description,
  tasks,
  estimated_duration_days,
  is_active
) VALUES (
  'Inspire 5-Phase Onboarding (Original Screenshots Only)',
  'Complete 5-phase onboarding process containing only tasks from original screenshots',
  '[
    {
      "category": "Pre-Onboarding",
      "task_name": "Client Requirement Specifications finalized",
      "task_description": "Warehousing & storage, sales channels, fulfillment, etc.",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 1,
      "metadata": {"target_date": "2025-Jun-27", "actual_date": "2025-Jun-27", "completed": true}
    },
    {
      "category": "Pre-Onboarding", 
      "task_name": "SLA & Pricing Sign-off",
      "task_description": "Service level agreement and pricing approval",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 2,
      "metadata": {"target_date": "2025-Jul-02", "actual_date": "2025-Jun-29", "completed": true, "notes": "6/29: for signing by Inspire"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Primary and secondary contacts (Sales, Tech, Ops)",
      "task_description": "Establish key contact persons for different departments",
      "task_owner": "BOTH", 
      "priority": "medium",
      "sort_order": 3,
      "metadata": {"actual_date": "2025-Jun-29", "completed": true, "notes": "6/29: Jose Murad as the main contact person"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)",
      "task_description": "Assign internal team members for client support",
      "task_owner": "INSPIRE",
      "priority": "medium", 
      "sort_order": 4,
      "metadata": {"actual_date": "2025-Jun-29", "completed": true, "notes": "6/29: Jose Murad as the main contact person"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Contact channels or chat groups created (Viber or Whatsapp)",
      "task_description": "Set up communication channels for ongoing collaboration",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 5,
      "metadata": {"actual_date": "2025-Jun-29", "completed": true, "notes": "6/29: Viber as the preferred contact method"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Client logo (for branding needs)",
      "task_description": "Obtain client logo for packaging and branding requirements",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 6,
      "metadata": {"target_date": "2025-Jul-01"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Escalation protocol (key persons for issues or concerns)",
      "task_description": "Define escalation path for critical issues",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 7
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Raw export of product file from current provider",
      "task_description": "For product data matching by Inspire team, to avoid issues during marketplace integration",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 8,
      "metadata": {"target_date": "N/A", "actual_date": "N/A"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Product Classification: Fast-moving / Average / Slow-moving",
      "task_description": "Categorize products by movement velocity for optimal storage",
      "task_owner": "CLIENT",
      "priority": "low",
      "sort_order": 9
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Packaging specs provided (sample video, if available)",
      "task_description": "Provide packaging requirements and specifications",
      "task_owner": "CLIENT",
      "priority": "low",
      "sort_order": 10
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Marketplace user access shared with Inspire Team for system integration",
      "task_description": "Grant access for marketplace integration setup",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 11,
      "metadata": {"target_date": "2025-Jul-02", "notes": "6/27: Target completion date initially set for 07/02, adjustment made to fast track system onboarding and importing of marketplace SKUs"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Sandbox system access (to be provided by Inspire)",
      "task_description": "Provide client access to testing environment",
      "task_owner": "INSPIRE",
      "priority": "low",
      "sort_order": 12
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Client Data Room access (Google Drive document storage)",
      "task_description": "To be provided by Inspire for document sharing",
      "task_owner": "INSPIRE",
      "priority": "low",
      "sort_order": 13
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Lazada, Shopee, TikTok Shop, Shopify, etc. connected",
      "task_description": "Connect all marketplace platforms to the system",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 14
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "API keys or plugin access granted (Shopify only)",
      "task_description": "Provide necessary API access for Shopify integration",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 15
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Channel-specific mapping validated",
      "task_description": "Verify product mapping across all channels",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 16
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Marketplace Integration testing",
      "task_description": "Test all marketplace connections and data flow",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 17
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Live order testing with warehouse team",
      "task_description": "Conduct end-to-end order testing with warehouse operations",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 18
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Product transfer scheduled (ASN created by the Client)",
      "task_description": "Schedule and create advance shipping notice for product transfer",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 19,
      "metadata": {"target_date": "2025-Jul-05"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Warehouse receiving orders created in WMS (ASN received by Inspire Team)",
      "task_description": "Process advance shipping notice in warehouse management system",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 20,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Product Inspection & Verification (QA by Inspire Team)",
      "task_description": "Quality assurance check of received products",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 21,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Physical receiving completed (by Inspire Team)",
      "task_description": "Complete physical receipt and documentation of products",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 22,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "QA completed (quantity, damage, labeling) (by Inspire Team)",
      "task_description": "Complete quality assurance including quantity verification and damage assessment",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 23,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Products mapped to correct put-away zones (by Inspire Team)",
      "task_description": "Assign products to appropriate storage locations",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 24,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Stock put-away logged in system (by Inspire Team)",
      "task_description": "Record stock placement in warehouse management system",
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
      "task_description": "Prepare appropriate packaging materials for each product type",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 27,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Returns intake process agreed (restocking vs disposal)",
      "task_description": "Define process for handling returned products",
      "task_owner": "BOTH",
      "priority": "low",
      "sort_order": 28
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Simulate small batch orders from each marketplace",
      "task_description": "Test order processing with small quantities from all platforms",
      "task_owner": "BOTH",
      "priority": "critical",
      "sort_order": 29,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Cross-functional observation (CS, WH, Tech, Client)",
      "task_description": "All teams observe and validate the pilot run process",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 30,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Notes on gaps or improvement opportunities",
      "task_description": "Document any issues or areas for improvement identified during pilot",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 31,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Sign-off from client team post-pilot",
      "task_description": "Obtain formal approval from client after pilot completion",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 32,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Internal validation: Ops, WH, Tech (by Inspire Team)",
      "task_description": "Internal team validation of all systems and processes",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 33,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Final tweaks to workflow or system settings",
      "task_description": "Make final adjustments based on pilot run feedback",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 34,
      "metadata": {"target_date": "2025-Jul-09"}
    },
    {
      "category": "GO LIVE",
      "task_name": "First batch of live orders processed and dispatched",
      "task_description": "Process and ship the first live customer orders",
      "task_owner": "INSPIRE",
      "priority": "critical",
      "sort_order": 35,
      "metadata": {"target_date": "2025-Jul-10"}
    },
    {
      "category": "GO LIVE",
      "task_name": "Day 1 to Day 3 support window prepared",
      "task_description": "Intensive support coverage for initial go-live period",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 36,
      "metadata": {"target_date": "2025-Jul-12"}
    },
    {
      "category": "GO LIVE",
      "task_name": "7-day operational check-in",
      "task_description": "Review operations and performance after one week",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 37
    },
    {
      "category": "GO LIVE",
      "task_name": "30-day performance review",
      "task_description": "Comprehensive performance evaluation after 30 days",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 38
    },
    {
      "category": "GO LIVE",
      "task_name": "Initial optimization plan discussed (cutoffs, TATs, workflows)",
      "task_description": "Plan for ongoing optimization and efficiency improvements",
      "task_owner": "BOTH",
      "priority": "low",
      "sort_order": 39
    }
  ]'::jsonb,
  45,
  true
);