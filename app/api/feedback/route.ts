import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, score, comment, user_id } = body;

        // 1. Basic Validation
        if (!user_id || !order_id || score < 1 || score > 5) {
            return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
        }

        // 2. Security Check: Does this order actually belong to this user?
        const { data: orderValidation } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('id', order_id)
            .eq('user_id', user_id)
            .single();

        if (!orderValidation || orderValidation.status !== "Completed") {
            return NextResponse.json({ error: "Unauthorized or Order not complete" }, { status: 403 });
        }

        // 3. Insert or Update the Score (Prevents double-rating spam)
        const { error: insertError } = await supabaseAdmin
            .from('feedback')
            .upsert({
                user_id,
                order_id,
                score,
                comment: comment || null
            }, { onConflict: 'user_id, order_id' }); // Requires UNIQUE constraint active

        if (insertError) {
            if (insertError.code === '23505') { // Postgres constraint violation
                return NextResponse.json({ error: "You have already reviewed this order." }, { status: 409 });
            }
            throw insertError;
        }

        return NextResponse.json({ success: true, message: "Thank you for the feedback!" });

    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ error: "Server Error saving feedback" }, { status: 500 });
    }
}
