"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function PushProvider() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // 1. Get current logged in user
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
                setUserId(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.id) {
                setUserId(session.user.id);
            } else {
                setUserId(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const setupPush = async () => {
            try {
                // 2. Check if Push is supported
                if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                    console.log("Push notifications not supported by browser.");
                    return;
                }

                // 3. Register the Service Worker
                await navigator.serviceWorker.register('/sw.js');
                const registration = await navigator.serviceWorker.ready;

                // 4. Request Permission from User
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    console.log("Push permission denied.");
                    return;
                }

                // 5. Get existing subscription
                let pushSub = await registration.pushManager.getSubscription();

                if (!pushSub) {
                    console.log("Creating new Push Subscription...");
                    // We need the VAPID Public Key from .env
                    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                    if (!publicVapidKey) {
                        console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env");
                        return;
                    }

                    // Convert Base64 VAPID to Uint8Array safely for the browser
                    const padding = "=".repeat((4 - (publicVapidKey.length % 4)) % 4);
                    const base64 = (publicVapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }

                    pushSub = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: outputArray
                    });
                }

                // 6. Save/Update Subscription in Supabase
                // Upsert based on the unique user_id
                await supabase.from("push_subscriptions").upsert({
                    user_id: userId,
                    subscription: JSON.parse(JSON.stringify(pushSub))
                }, { onConflict: "user_id" });

                console.log("Push Subscription successfully synced to Supabase.");

            } catch (error) {
                console.error("Error setting up Web Push:", error);
            }
        };

        setupPush();

    }, [userId]);

    // This is a completely invisible component that just runs the logic on mount
    return null;
}
