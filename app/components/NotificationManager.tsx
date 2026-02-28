"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Check permissions and get the logged-in user
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };

    fetchUser();

    // Listen for logins/logouts
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. REAL-TIME MAGIC: Listen to the Supabase Database
  useEffect(() => {
    // Only run if they allowed notifications AND are logged in
    if (permission !== "granted" || !userId) return;

    // Listen to the 'orders' table for changes belonging to this user
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders', // Make sure this matches your actual table name in Supabase!
          filter: `user_id=eq.${userId}` // Only listen to THIS user's orders
        },
        (payload) => {
          // Check if the 'status' column changed
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;

          if (oldStatus !== newStatus && newStatus) {
            // Send the real push notification!
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification("BowlIt Order Update 🍲", {
                  body: `Your order is now: ${newStatus.toUpperCase()}`,
                  icon: "/logo1.svg"
                });
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permission, userId]);

  return null; // Headless component, no UI
}