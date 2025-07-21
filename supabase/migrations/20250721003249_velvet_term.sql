/*
  # Create New 5-Phase Onboarding Template

  1. New Template
    - Creates a comprehensive 5-phase onboarding template based on uploaded images
    - Replaces existing task structure with new phase-based approach
    - Each phase includes: Title, Target Date, Actual Date, Status, Notes

  2. Task Structure
    - Pre-Onboarding: Client requirements, SLA, contacts, escalation
    - Tech & Marketplace Integration: Platform connections, API access, testing
    - Inventory & Inbounding: Product transfer, receiving, QA, put-away
    - Pilot Run & UAT: Testing, observation, validation, sign-off
    - GO LIVE: Live orders, support, reviews, optimization

  3. Task Ownership
    - CLIENT: Tasks requiring client action
    - INSPIRE: Tasks handled by Inspire team
    - BOTH: Collaborative tasks requiring both parties
*/

-- Create the new comprehensive onboarding template
INSERT INTO onboarding_templates (
  name,
  description,
  tasks,
  estimated_duration_days,
  is_active
) VALUES (
  'Comprehensive 5-Phase Onboarding',
  'Complete onboarding process with 5 distinct phases: Pre-Onboarding, Tech Integration, Inventory Setup, Pilot Testing, and Go Live',
  '[
    {
      "category": "Pre-Onboarding",
      "task_name": "Client Requirement Specifications finalized",
      "task_description": "Warehousing & storage, sales channels, fulfillment, etc.",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 1,
      "metadata": {"target_date": "2025-Jun-27", "phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding", 
      "task_name": "SLA & Pricing Sign-off",
      "task_description": "Service level agreement and pricing confirmation",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 2,
      "metadata": {"target_date": "2025-Jul-02", "phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Primary and secondary contacts (Sales, Tech, Ops)",
      "task_description": "Establish key contact persons for different departments",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 3,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Internal point persons (CS, WMS, Fulfillment, Onboarding Lead)",
      "task_description": "Assign internal team members for each function",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 4,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Contact channels or chat groups created (Viber or Whatsapp)",
      "task_description": "Set up communication channels for ongoing collaboration",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 5,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Client logo (for branding needs)",
      "task_description": "Obtain client logo for system branding and packaging",
      "task_owner": "CLIENT",
      "priority": "low",
      "sort_order": 6,
      "metadata": {"target_date": "2025-Jul-01", "phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Escalation protocol (key persons for issues or concerns)",
      "task_description": "Define escalation path for critical issues",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 7,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Raw export of product file from current provider",
      "task_description": "For product data matching by Inspire team, to avoid issues during marketplace integration",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 8,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Product Classification: Fast-moving / Average / Slow-moving",
      "task_description": "Categorize products for optimal warehouse placement",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 9,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Packaging specs provided (sample video, if available)",
      "task_description": "Provide packaging requirements and specifications",
      "task_owner": "CLIENT",
      "priority": "medium",
      "sort_order": 10,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Marketplace user access shared with Inspire Team for system integration",
      "task_description": "Provide marketplace access credentials for integration",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 11,
      "metadata": {"target_date": "2025-Jul-02", "phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Sandbox system access (to be provided by Inspire)",
      "task_description": "Inspire provides sandbox environment access",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 12,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Pre-Onboarding",
      "task_name": "Client Data Room access (Google Drive document storage)",
      "task_description": "To be provided by Inspire for document sharing",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 13,
      "metadata": {"phase": "pre_onboarding"}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Lazada, Shopee, TikTok Shop, Shopify, etc. connected",
      "task_description": "Connect all marketplace platforms to the system",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 14,
      "metadata": {"phase": "tech_integrations"}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "API keys or plugin access granted (Shopify only)",
      "task_description": "Provide necessary API access for Shopify integration",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 15,
      "metadata": {"phase": "tech_integrations"}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Channel-specific mapping validated",
      "task_description": "Verify product mapping across all channels",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 16,
      "metadata": {"phase": "tech_integrations"}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Marketplace Integration testing",
      "task_description": "Test all marketplace connections and data flow",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 17,
      "metadata": {"phase": "tech_integrations"}
    },
    {
      "category": "Tech & Marketplace Integration",
      "task_name": "Live order testing with warehouse team",
      "task_description": "Conduct end-to-end order testing with warehouse operations",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 18,
      "metadata": {"phase": "tech_integrations"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Product transfer scheduled (ASN created by the Client)",
      "task_description": "Client creates Advanced Shipping Notice for product transfer",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 19,
      "metadata": {"target_date": "2025-Jul-05", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Warehouse receiving orders created in WMS (ASN received by Inspire Team)",
      "task_description": "Inspire team processes ASN and creates receiving orders",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 20,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Product Inspection & Verification (QA by Inspire Team)",
      "task_description": "Quality assurance and verification of received products",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 21,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Physical receiving completed (by Inspire Team)",
      "task_description": "Complete physical receipt and documentation of products",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 22,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "QA completed (quantity, damage, labeling) (by Inspire Team)",
      "task_description": "Complete quality assurance including quantity verification and damage assessment",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 23,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Products mapped to correct put-away zones (by Inspire Team)",
      "task_description": "Map products to appropriate warehouse storage zones",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 24,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Stock put-away logged in system (by Inspire Team)",
      "task_description": "Complete put-away process and update system records",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 25,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Initial picking and packing process defined (by Inspire Team)",
      "task_description": "Establish picking and packing procedures for the client",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 26,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Packaging materials prepared (SKUs needing boxes, fillers, etc.) (by Inspire Team)",
      "task_description": "Prepare all necessary packaging materials for fulfillment",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 27,
      "metadata": {"target_date": "2025-Jul-09", "phase": "inventory"}
    },
    {
      "category": "Inventory & Inbounding",
      "task_name": "Returns intake process agreed (restocking vs disposal)",
      "task_description": "Define process for handling returned products",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 28,
      "metadata": {"phase": "inventory"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Simulate small batch orders from each marketplace",
      "task_description": "Test order processing with small batches from all platforms",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 29,
      "metadata": {"target_date": "2025-Jul-09", "phase": "pilot"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Cross-functional observation (CS, WH, Tech, Client)",
      "task_description": "All teams observe and validate the pilot run process",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 30,
      "metadata": {"target_date": "2025-Jul-09", "phase": "pilot"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Notes on gaps or improvement opportunities",
      "task_description": "Document any issues or areas for improvement",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 31,
      "metadata": {"target_date": "2025-Jul-09", "phase": "pilot"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Sign-off from client team post-pilot",
      "task_description": "Client approval to proceed to live operations",
      "task_owner": "CLIENT",
      "priority": "high",
      "sort_order": 32,
      "metadata": {"target_date": "2025-Jul-09", "phase": "pilot"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Internal validation: Ops, WH, Tech (by Inspire Team)",
      "task_description": "Internal team validation and approval",
      "task_owner": "INSPIRE",
      "priority": "high",
      "sort_order": 33,
      "metadata": {"target_date": "2025-Jul-09", "phase": "pilot"}
    },
    {
      "category": "Pilot Run & User Acceptance (UAT)",
      "task_name": "Final tweaks to workflow or system settings",
      "task_description": "Implement any necessary adjustments before go-live",
      "task_owner": "INSPIRE",
      "priority": "medium",
      "sort_order": 34,
      "metadata": {"target_date": "2025-Jul-09", "phase": "pilot"}
    },
    {
      "category": "GO LIVE",
      "task_name": "First batch of live orders processed and dispatched",
      "task_description": "Process and dispatch the first live customer orders",
      "task_owner": "INSPIRE",
      "priority": "critical",
      "sort_order": 35,
      "metadata": {"target_date": "2025-Jul-10", "phase": "go_live"}
    },
    {
      "category": "GO LIVE",
      "task_name": "Day 1 to Day 3 support window prepared",
      "task_description": "Intensive support coverage for first 3 days of operations",
      "task_owner": "INSPIRE",
      "priority": "critical",
      "sort_order": 36,
      "metadata": {"target_date": "2025-Jul-12", "phase": "go_live"}
    },
    {
      "category": "GO LIVE",
      "task_name": "7-day operational check-in",
      "task_description": "Review operations and performance after first week",
      "task_owner": "BOTH",
      "priority": "high",
      "sort_order": 37,
      "metadata": {"phase": "go_live"}
    },
    {
      "category": "GO LIVE",
      "task_name": "30-day performance review",
      "task_description": "Comprehensive review of first month operations",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 38,
      "metadata": {"phase": "go_live"}
    },
    {
      "category": "GO LIVE",
      "task_name": "Initial optimization plan discussed (cutoffs, TATs, workflows)",
      "task_description": "Plan for ongoing optimization and improvements",
      "task_owner": "BOTH",
      "priority": "medium",
      "sort_order": 39,
      "metadata": {"phase": "go_live"}
    }
  ]'::jsonb,
  45,
  true
);