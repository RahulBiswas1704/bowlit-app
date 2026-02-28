import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';

// Configure Web Push with our VAPID keys
// The email is required by the VAPID spec so push providers can contact us if needed
webpush.setVapidDetails(
    'mailto:admin@bowlit.com', // Replace with real admin email
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(request: Request) {
    try {
        const { userId, title, body, url } = await request.json();

        if (!userId || !title) {
            return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
        }

        // 1. Fetch the user's Push Subscription from Supabase
        const { data, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', userId)
            .single();

        if (error || !data || !data.subscription) {
            return NextResponse.json({ error: 'User is not subscribed to push notifications' }, { status: 404 });
        }

        const subscription = data.subscription;

        // 2. Format the payload for the Service Worker
        const payload = JSON.stringify({
            title,
            body: body || 'You have a new notification!',
            url: url || '/profile'
        });

        // 3. Send the Push Notification via FCM/APNs
        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true, message: 'Push notification sent via Web Push API' });

    } catch (error: any) {
        console.error('Error sending push notification:', error);

        // If the error is 410, it means the user revoked permission or the token expired
        // We should ideally clean this up from the database
        if (error.statusCode === 410 || error.statusCode === 404) {
            return NextResponse.json({ error: 'Subscription expired or invalid. Needs cleanup.' }, { status: 410 });
        }

        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
