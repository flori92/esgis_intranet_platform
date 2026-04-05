-- ==========================================
-- MIGRATION: Création des Tables Lookup
-- Pour les 18 nouvelles relations
-- ==========================================

BEGIN;

-- 1. ALERT TYPE DEFINITIONS
CREATE TABLE IF NOT EXISTS alert_type_definitions (
    id SERIAL PRIMARY KEY,
    alert_type TEXT UNIQUE NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    threshold_value NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. RESOURCE INTERACTION TYPES
CREATE TABLE IF NOT EXISTS resource_interaction_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. INTERACTIVE RESOURCE TYPES
CREATE TABLE IF NOT EXISTS interactive_resource_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    supported_features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. PARTNER TYPES
CREATE TABLE IF NOT EXISTS partner_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. JOB OFFER STATUSES
CREATE TABLE IF NOT EXISTS job_offer_statuses (
    id SERIAL PRIMARY KEY,
    status TEXT UNIQUE NOT NULL,
    description TEXT,
    is_open_for_applications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. INTERNSHIP STATUSES
CREATE TABLE IF NOT EXISTS internship_statuses (
    id SERIAL PRIMARY KEY,
    status TEXT UNIQUE NOT NULL,
    description TEXT,
    color_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. ANNOUNCEMENT PRIORITY TYPES
CREATE TABLE IF NOT EXISTS announcement_priority_types (
    id SERIAL PRIMARY KEY,
    priority TEXT UNIQUE NOT NULL,
    description TEXT,
    order_rank INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. ANNOUNCEMENT AUDIENCE TYPES
CREATE TABLE IF NOT EXISTS announcement_audience_types (
    id SERIAL PRIMARY KEY,
    audience_type TEXT UNIQUE NOT NULL,
    description TEXT,
    requires_filter BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. EXAM MONITORING TYPES
CREATE TABLE IF NOT EXISTS exam_monitoring_types (
    id SERIAL PRIMARY KEY,
    monitoring_type TEXT UNIQUE NOT NULL,
    description TEXT,
    requires_tools TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_types_severity ON alert_type_definitions(severity);
CREATE INDEX IF NOT EXISTS idx_resource_interaction_types ON resource_interaction_types(name);
CREATE INDEX IF NOT EXISTS idx_interactive_types ON interactive_resource_types(name);
CREATE INDEX IF NOT EXISTS idx_partner_types ON partner_types(name);
CREATE INDEX IF NOT EXISTS idx_job_statuses ON job_offer_statuses(status);
CREATE INDEX IF NOT EXISTS idx_internship_statuses ON internship_statuses(status);
CREATE INDEX IF NOT EXISTS idx_announcement_priority ON announcement_priority_types(priority);
CREATE INDEX IF NOT EXISTS idx_announcement_audience ON announcement_audience_types(audience_type);
CREATE INDEX IF NOT EXISTS idx_exam_monitoring ON exam_monitoring_types(monitoring_type);

COMMIT;
