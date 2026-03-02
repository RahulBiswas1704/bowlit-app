import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { referrerId, receiverId } = body;

        if (!referrerId || !receiverId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch Global Reward Settings
        const { data: settings } = await supabaseAdmin.from('store_settings').select('*').eq('id', 1).single();
        const senderReward = settings?.referral_reward_sender || 150;
        const receiverReward = settings?.referral_reward_receiver || 100;

        // 2. Double-check the receiver hasn't already been referred (prevent race-condition double-dips)
        const { data: existingReferral } = await supabaseAdmin
            .from('referrals')
            .select('id')
            .eq('referred_id', receiverId)
            .single();

        if (existingReferral) {
            return NextResponse.json({ error: "Already referred" }, { status: 400 });
        }

        // 3. Mark the referral as permanently complete
        const { error: insertError } = await supabaseAdmin
            .from('referrals')
            .insert([{
                referrer_id: referrerId,
                referred_id: receiverId,
                reward_amount_sender: senderReward,
                reward_amount_receiver: receiverReward
            }]);

        if (insertError) throw insertError;

        // 4. Fire the funds into the Referrer's Wallet
        const { data: referrerWallet } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('user_id', referrerId)
            .single();

        const currentBalance = referrerWallet?.balance || 0;

        await supabaseAdmin.from('wallets').upsert({
            user_id: referrerId,
            balance: currentBalance + senderReward
        }, { onConflict: 'user_id' });

        return NextResponse.json({ success: true, rewarded: senderReward });

    } catch (error: any) {
        console.error("Referral Execution Error:", error);
        return NextResponse.json({ error: "Server Error Executing Referral" }, { status: 500 });
    }
}
