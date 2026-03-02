-- 1. Create the `waitlist` tracking table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Service Role Policy (Admin bypass for the API to securely insert rows)
CREATE POLICY "Enable all for service role on waitlist" ON public.waitlist
    FOR ALL
    USING (true)
    WITH CHECK (true);
