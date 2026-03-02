import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET: Fetch the global store settings (Kitchen location, delivery radius, etc.)
 */
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('store_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows returned"

        return NextResponse.json({ settings: data || null });
    } catch (error: any) {
        console.error("Settings API GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH: Update the global store settings
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { geofence_polygon, referral_reward_sender, referral_reward_receiver } = body;

        // Upsert row 1
        const { error } = await supabaseAdmin
            .from('store_settings')
            .upsert({
                id: 1,
                geofence_polygon: geofence_polygon || [],
                referral_reward_sender: referral_reward_sender !== undefined ? referral_reward_sender : 150,
                referral_reward_receiver: referral_reward_receiver !== undefined ? referral_reward_receiver : 100
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Settings API PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
