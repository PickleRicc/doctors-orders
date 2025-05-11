-- 001_create_users_table.sql
-- Migration script for setting up user-related tables in Supabase
-- Note: auth.users is automatically created by Supabase Auth
-- This migration extends Supabase's auth system with custom user data tables

-- IMPORTANT: NO PHI (Protected Health Information) should be stored in these tables
-- All PHI data must be stored in the GCP HIPAA-compliant environment

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table to store non-PHI user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscription table to track user subscription status
-- This links with Stripe subscription information
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    subscription_id TEXT,  -- Stripe subscription ID
    subscription_status TEXT, -- active, past_due, canceled, etc.
    plan_type TEXT, -- free, monthly, yearly
    notes_count INTEGER DEFAULT 0, -- Count of notes created (for free tier limits)
    free_notes_limit INTEGER DEFAULT 5, -- Default free tier limit
    current_period_end TIMESTAMPTZ, -- When current subscription period ends
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_settings table for app preferences (no PHI)
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'light', -- light/dark mode preference
    default_export_format TEXT DEFAULT 'pdf', -- pdf, docx, txt, etc.
    notifications_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create note_templates table for template customization (structure only, no PHI)
CREATE TABLE IF NOT EXISTS public.note_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    structure JSONB, -- Template structure (sections, fields, etc.)
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create note_metadata table for tracking notes (without storing PHI content)
-- Actual note content will be stored in GCP
CREATE TABLE IF NOT EXISTS public.note_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gcp_note_id TEXT NOT NULL, -- Reference to the actual note stored in GCP
    title TEXT, -- Non-PHI title (e.g., "Note #123")
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    template_id UUID REFERENCES public.note_templates(id) ON DELETE SET NULL,
    template_name TEXT, -- For when templates are deleted but notes remain
    export_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Set up Row Level Security (RLS)
-- These policies ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = id);

-- Only system can update subscription (via webhooks/functions)
-- User cannot directly modify their subscription state

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for note_templates
CREATE POLICY "Users can view their own templates"
    ON public.note_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
    ON public.note_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
    ON public.note_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
    ON public.note_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for note_metadata
CREATE POLICY "Users can view their own note metadata"
    ON public.note_metadata FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note metadata"
    ON public.note_metadata FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note metadata"
    ON public.note_metadata FOR UPDATE
    USING (auth.uid() = user_id);

-- Instead of hard delete, we use soft delete via is_deleted flag
CREATE POLICY "Users can soft delete their own note metadata"
    ON public.note_metadata FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (is_deleted = TRUE);

-- Create triggers to initialize profile and subscription records on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create empty profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    -- Create default subscription (free tier)
    INSERT INTO public.subscriptions (id, subscription_status, plan_type)
    VALUES (NEW.id, 'active', 'free');
    
    -- Create default user settings
    INSERT INTO public.user_settings (id)
    VALUES (NEW.id);
    
    -- Create default SOAP template
    INSERT INTO public.note_templates (user_id, name, description, is_default, structure)
    VALUES (
        NEW.id, 
        'Default SOAP Template', 
        'Standard SOAP (Subjective, Objective, Assessment, Plan) template',
        TRUE,
        '{"sections":[
            {"name":"Subjective","description":"Patient symptoms, complaints, and history"},
            {"name":"Objective","description":"Physical examination findings and test results"},
            {"name":"Assessment","description":"Diagnosis and clinical impression"},
            {"name":"Plan","description":"Treatment plan and follow-up instructions"}
        ]}'::jsonb
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists to avoid errors on re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
