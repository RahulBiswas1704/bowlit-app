-- 1. Create the `feedback` tracking table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure a user can only review a specific order once
    UNIQUE(user_id, order_id)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own feedback
CREATE POLICY "Users can perfectly view their own feedback" ON public.feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service Role Policy (Admin bypass for the dashboard)
CREATE POLICY "Enable all for service role on feedback" ON public.feedback
    FOR ALL
    USING (true)
    WITH CHECK (true);
