import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, latitude, longitude } = body;

        if (!phone || !latitude || !longitude) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Insert into waitlist table
        const { error: insertError } = await supabaseAdmin
            .from('waitlist')
            .insert([{
                phone,
                latitude,
                longitude
            }]);

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: "Added to waitlist" });

    } catch (error: any) {
        console.error("Waitlist API Error:", error);
        return NextResponse.json({ error: "Server Error adding to waitlist" }, { status: 500 });
    }
}
export async function GET() {
    try {
        // Fetch all waitlist coordinates to render on the Admin heatmap
        const { data, error } = await supabaseAdmin
            .from('waitlist')
            .select('latitude, longitude, created_at');

        if (error) throw error;
        return NextResponse.json({ success: true, waitlist: data });
    } catch (error: any) {
        console.error("Waitlist API Error:", error);
        return NextResponse.json({ error: "Server Error fetching waitlist" }, { status: 500 });
    }
}
