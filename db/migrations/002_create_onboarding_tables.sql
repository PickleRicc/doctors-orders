-- 002_create_onboarding_tables.sql
-- Migration script for setting up onboarding-related tables in Supabase
-- This extends the user profile with onboarding information (non-PHI only)

-- Create user_onboarding table to store onboarding responses
CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Section 1: Role & Workflow Context
    primary_role TEXT, -- Physician, Nurse Practitioner, etc.
    current_documentation_method TEXT, -- EHR typing, dictation, etc.
    daily_documentation_hours INTEGER, -- 0-5 hours
    
    -- Section 2: Friction & Emotional Drivers
    documentation_frustrations TEXT[], -- Array of frustrations
    delayed_documentation BOOLEAN, -- Yes/No
    using_speech_to_text BOOLEAN, -- Yes/No
    current_speech_to_text_tool TEXT, -- Which tool if using_speech_to_text is true
    
    -- Section 3: Value & Outcomes
    time_saving_priority TEXT, -- Free input on what they'd do with saved time
    value_realtime_dictation BOOLEAN DEFAULT TRUE,
    value_ai_soap_structure BOOLEAN DEFAULT TRUE,
    value_auto_sync_export BOOLEAN DEFAULT TRUE,
    daily_note_count INTEGER, -- Number of notes per day
    
    -- Section 4: Subscription Interest
    paying_for_time_savings TEXT, -- Yes, Maybe, No
    preferred_plan TEXT, -- Free, Pro Monthly, Not Sure
    
    -- Tracking fields
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the onboarding table
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies for user_onboarding
CREATE POLICY "Users can view their own onboarding data"
    ON public.user_onboarding FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own onboarding data"
    ON public.user_onboarding FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own onboarding data"
    ON public.user_onboarding FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to create an onboarding record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create empty profile (existing code)
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    -- Create default subscription (existing code)
    INSERT INTO public.subscriptions (id, subscription_status, plan_type)
    VALUES (NEW.id, 'active', 'free');
    
    -- Create default user settings (existing code)
    INSERT INTO public.user_settings (id)
    VALUES (NEW.id);
    
    -- Create empty onboarding record (new code)
    INSERT INTO public.user_onboarding (id)
    VALUES (NEW.id);
    
    -- Create default SOAP template (existing code)
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

-- Note: No need to recreate the trigger as it's already done in the first migration
