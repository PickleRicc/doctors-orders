-- 003_create_gcp_schema.sql
-- Migration script for setting up PHI-compliant tables in GCP Cloud SQL
-- IMPORTANT: This schema is for GCP Cloud SQL, NOT Supabase
-- All PHI data must be stored in this GCP HIPAA-compliant environment

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table for PHI patient information
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References Supabase auth.users(id)
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    mrn TEXT, -- Medical Record Number
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    insurance_info JSONB,
    allergies TEXT[],
    medications TEXT[],
    medical_history TEXT,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notes table for PHI note content
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References Supabase auth.users(id)
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    soap_data JSONB NOT NULL, -- Structured SOAP data
    raw_transcript TEXT, -- Original transcription
    template_id UUID, -- Template used (references Supabase template)
    recording_time INTEGER, -- Duration in seconds
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Create note_versions table for version history
CREATE TABLE IF NOT EXISTS note_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    soap_data JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    created_by UUID NOT NULL, -- References Supabase auth.users(id)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create templates table for specialty-specific templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    specialty TEXT NOT NULL, -- Primary Care, Physical Therapy, Veterinary
    prompt_template TEXT NOT NULL, -- Template for Gemini API
    is_system_template BOOLEAN DEFAULT FALSE, -- System vs user-created
    user_id UUID, -- NULL for system templates, user ID for custom
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for frequently queried fields
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_patient_id ON notes(patient_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_templates_specialty ON templates(specialty);
CREATE INDEX idx_templates_user_id ON templates(user_id);

-- Insert default templates for different specialties
INSERT INTO templates (
    name, 
    description, 
    specialty, 
    prompt_template, 
    is_system_template
) VALUES 
(
    'Primary Care Template',
    'Standard template for primary care visits',
    'Primary Care',
    'Create a comprehensive SOAP note for a primary care visit based on the following transcription. Include these key sections: Subjective (patient history and complaints), Objective (vital signs and examination findings), Assessment (diagnoses with ICD-10 codes when possible), and Plan (medications, tests, follow-up). Focus on preventive care and chronic disease management where relevant: {{transcription}}',
    TRUE
),
(
    'Physical Therapist Template',
    'Specialized template for physical therapy evaluations',
    'Physical Therapy',
    'Create a detailed SOAP note for a physical therapy evaluation based on the following transcription. Include these key sections: Subjective (patient complaints, functional limitations, pain levels), Objective (ROM measurements, strength testing, functional assessments), Assessment (diagnosis, impairments, functional limitations), and Plan (treatment frequency, modalities, exercises, goals). Focus on movement patterns, rehabilitation goals, and functional outcomes: {{transcription}}',
    TRUE
),
(
    'Veterinary Template',
    'Specialized template for veterinary examinations',
    'Veterinary',
    'Create a detailed SOAP note for a veterinary examination based on the following transcription. Include these key sections: Subjective (owner concerns, animal history), Objective (vital signs, physical examination findings), Assessment (diagnoses, differential diagnoses), and Plan (medications, treatments, follow-up recommendations). Include species-specific considerations where relevant: {{transcription}}',
    TRUE
);
