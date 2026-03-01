import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import webpush from 'web-push';

webpush.setVapidDetails(
    'mailto:admin@bowlit.in',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
);

// We process push notifications in chunks of 100 to avoid overwhelming the Node event loop or hitting memory limits
const CHUNK_SIZE = 100;

export async function POST(req: Request) {
    try {
        const { title, body, icon, url, secret } = await req.json();

        // 1. Authenticate Request
        // In a real app, verify the user session. For backend broadcast, we can use a secret or Supabase anon key check to verify it came from our frontend.
        if (!title || !body) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }

        // 2. Fetch all valid subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*');

        if (error || !subscriptions) {
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        if (subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscribers found', sent: 0, failed: 0 });
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: icon || '/icons/icon-192x192.png',
            url: url || 'https://bowlit.in',
        });

        let successCount = 0;
        let failureCount = 0;
        const failedIdsToDelete: number[] = [];

        // 3. Process in chunks
        for (let i = 0; i < subscriptions.length; i += CHUNK_SIZE) {
            const chunk = subscriptions.slice(i, i + CHUNK_SIZE);

            // Execute the chunk entirely in parallel using Promise.allSettled for maximum throughput
            const results = await Promise.allSettled(
                chunk.map((sub) => {
                    // Safety check in case a database row is malformed
                    if (!sub.subscription || typeof sub.subscription !== 'object') {
                        return Promise.reject(new Error("Malformed subscription object"));
                    }
                    return webpush.sendNotification(sub.subscription, payload);
                })
            );

            // 4. Tally results and mark dead subscriptions for deletion
            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                } else {
                    failureCount++;
                    // Node web-push throws 410 or 404 if the user uninstalled the PWA or revoked permissions
                    if (result.reason.statusCode === 410 || result.reason.statusCode === 404) {
                        failedIdsToDelete.push(chunk[idx].id);
                    }
                }
            });
        }

        // 5. Cleanup dead subscriptions async (don't block the response)
        if (failedIdsToDelete.length > 0) {
            supabase
                .from('push_subscriptions')
                .delete()
                .in('id', failedIdsToDelete)
                .then(({ error }) => {
                    if (error) console.error("Failed to clean up dead subscriptions:", error);
                });
        }

        return NextResponse.json({
            message: 'Broadcast complete',
            sent: successCount,
            failed: failureCount,
            totalSubscribers: subscriptions.length
        }, { status: 200 });

    } catch (err: any) {
        console.error('Broadcast Push Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
