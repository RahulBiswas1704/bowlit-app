import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch all system users (bypassing RLS)
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;

        // 2. Fetch all paused dates across the entire app
        const { data: pausedData, error: pausedError } = await supabaseAdmin.from('paused_dates').select('*');
        if (pausedError) throw pausedError;

        // 3. Map paused dates by user_id for O(1) lookups
        const pauseMap: Record<string, string[]> = {};
        pausedData.forEach(p => {
            if (!pauseMap[p.user_id]) pauseMap[p.user_id] = [];
            pauseMap[p.user_id].push(p.pause_date);
        });

        // 4. Isolate ONLY active users who have paid credits and an active subscription plan
        // We will mutate 'simulatedCredits' downward as we simulate time moving forward
        const activeUsers = usersData.users.map(u => ({
            id: u.id,
            simulatedCredits: u.user_metadata?.credits || 0,
            active_plan: u.user_metadata?.active_plan || "",
        })).filter(u => u.simulatedCredits > 0 && u.active_plan.length > 0);

        // 5. The Core AI Simulator Loop (14-Day Rolling Window)
        const predictions = [];
        const simDate = new Date();
        simDate.setDate(simDate.getDate() + 1); // Start prep sheet for "Tomorrow"

        for (let i = 0; i < 14; i++) {
            const dateStr = simDate.toISOString().split('T')[0];
            const isWeekend = simDate.getDay() === 0 || simDate.getDay() === 6;

            let dailyVeg = 0;
            let dailyNonVeg = 0;

            if (!isWeekend) {
                activeUsers.forEach(u => {
                    const userPausedDates = pauseMap[u.id] || [];

                    // If the user has NOT manually paused this specific day
                    if (!userPausedDates.includes(dateStr)) {
                        const isCombo = u.active_plan.includes("Lunch + Dinner");
                        const cost = isCombo ? 2 : 1;
                        const mealsToDeliver = isCombo ? 2 : 1;

                        // Ensure they have enough fake funds remaining in this timeline
                        if (u.simulatedCredits >= cost) {
                            u.simulatedCredits -= cost; // Deduct from the simulation pool

                            // Tally the kitchen requirement based on natural language plan parsing
                            const isNonVeg = u.active_plan.toLowerCase().includes("non");
                            if (isNonVeg) {
                                dailyNonVeg += mealsToDeliver;
                            } else {
                                dailyVeg += mealsToDeliver;
                            }
                        }
                    }
                });
            }

            predictions.push({
                date: dateStr,
                dayOfWeek: simDate.toLocaleDateString("en-US", { weekday: 'short' }),
                isWeekend,
                vegMeals: dailyVeg,
                nonVegMeals: dailyNonVeg,
                total: dailyVeg + dailyNonVeg,
            });

            // Move simulation forward 1 chronologicial day
            simDate.setDate(simDate.getDate() + 1);
        }

        return NextResponse.json({ success: true, predictions });

    } catch (error: any) {
        console.error("AI Inventory Predictor Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
