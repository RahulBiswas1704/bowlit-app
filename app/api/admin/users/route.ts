import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the SERVICE ROLE KEY
// This bypasses RLS and allows interacting with auth.users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET: Fetch all registered users and merge with their Wallet Balances
 */
export async function GET(request: Request) {
    try {
        // 1. Fetch all users from Auth
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) throw usersError;

        // 2. Fetch all wallets
        const { data: walletsData, error: walletsError } = await supabaseAdmin
            .from('wallets')
            .select('*');

        if (walletsError) throw walletsError;

        // 3. Merge data
        const customers = usersData.users.map(user => {
            const wallet = walletsData?.find(w => w.user_id === user.id);

            return {
                id: user.id,
                email: user.email,
                phone: user.user_metadata?.phone || '',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown User',
                office: user.user_metadata?.office || 'Not Provided',
                balance: wallet?.balance || 0,
                avatar_url: user.user_metadata?.avatar_url || '',
            };
        });

        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error("Admin API GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH: Update a user's metadata (Name, Phone, Office) and Wallet Balance
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, full_name, phone, office, new_balance } = body;

        if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // 1. Update Auth Metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: { full_name, phone, office }
        });

        if (updateError) throw updateError;

        // 2. Update Wallet Balance if provided
        if (new_balance !== undefined) {
            const { error: walletError } = await supabaseAdmin
                .from('wallets')
                .upsert({ user_id: id, balance: parseFloat(new_balance) });

            if (walletError) throw walletError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin API PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE: Permanently delete a user account
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // IMPORTANT: Because Supabase throws a foreign key constraint error if we 
        // try to delete a user who has active rows in public tables, we must manually
        // delete all associated data BEFORE deleting the auth.users record.

        // 1. Delete Wallet
        await supabaseAdmin.from('wallets').delete().eq('user_id', id);

        // 2. Delete Paused Dates
        await supabaseAdmin.from('paused_dates').delete().eq('user_id', id);

        // 3. Delete Push Subscriptions
        await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', id);

        // 4. Delete Orders (if they reference user_id explicitly)
        // Note: For absolute safety we attempt deletion on all standard tables that 
        // might hold an FK constraint against auth.users.
        await supabaseAdmin.from('orders').delete().eq('user_id', id);

        // FINALLY: Delete the User from Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            console.error("Auth Deletion Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin API DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
