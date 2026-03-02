import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { promoCode, receiverId } = body;

        if (!promoCode || !receiverId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch Global Reward Settings
        const { data: settings } = await supabaseAdmin.from('store_settings').select('*').eq('id', 1).single();
        const receiverReward = settings?.referral_reward_receiver || 100;

        // 2. Prevent the receiver from abusing the system (Have they been referred before?)
        const { data: existingReferral } = await supabaseAdmin
            .from('referrals')
            .select('id')
            .eq('referred_id', receiverId)
            .single();

        if (existingReferral) {
            return NextResponse.json({ error: "You have already used a referral code!" }, { status: 400 });
        }

        // 3. Find the Referrer by checking all users' metadata for the matching phone number
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;

        const usersList: any[] = usersData.users;
        const referrer = usersList.find(u => u.user_metadata?.phone === promoCode);

        if (!referrer) {
            return NextResponse.json({ error: "Invalid Promo Code." }, { status: 404 });
        }

        if (referrer.id === receiverId) {
            return NextResponse.json({ error: "You cannot refer yourself." }, { status: 400 });
        }

        // Success! Return the referrer's hidden UUID so the frontend can securely execute the transfer later
        return NextResponse.json({
            success: true,
            referrerId: referrer.id,
            receiverReward
        });

    } catch (error: any) {
        console.error("Referral Validation Error:", error);
        return NextResponse.json({ error: "Server Error Validating Code" }, { status: 500 });
    }
}
