-- 1. Create the referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_amount_sender INT NOT NULL DEFAULT 150,
    reward_amount_receiver INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_referral UNIQUE(referred_id) -- A user can only be referred ONCE 
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Service Role Policy (Admin bypass)
CREATE POLICY "Enable all for service role on referrals" ON public.referrals
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Modify the `store_settings` table to include dynamic referral rewards
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS referral_reward_sender INT DEFAULT 150,
ADD COLUMN IF NOT EXISTS referral_reward_receiver INT DEFAULT 100;
