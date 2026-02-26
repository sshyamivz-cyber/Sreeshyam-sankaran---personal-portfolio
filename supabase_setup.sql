-- Create the client_leads table
CREATE TABLE public.client_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT,
    industry TEXT,
    contact_details TEXT,
    project_type TEXT,
    current_challenges TEXT,
    budget_range TEXT,
    timeline TEXT,
    existing_tech_stack TEXT,
    team_size TEXT,
    expected_outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.client_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT data (Submitting the form)
CREATE POLICY "Allow anonymous inserts" ON public.client_leads
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow authenticated users (e.g., your admin panel in the future) to READ data
CREATE POLICY "Allow authenticated reads" ON public.client_leads
    FOR SELECT
    TO authenticated
    USING (true);
