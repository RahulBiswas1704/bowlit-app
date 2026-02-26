"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
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

  // --- MANUAL TESTING BUTTON LOGIC BELOW ---

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }
    
    const perm = await Notification.requestPermission();
    setPermission(perm);
    
    if (perm === "granted") {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("Notifications Enabled! 🎉", {
            body: "You will now receive automatic updates about your BowlIt orders.",
            icon: "/logo1.svg"
          });
        });
      }
    }
  };

  const testNotification = () => {
    if (permission === "granted") {
      if ('serviceWorker' in navigator) {
         navigator.serviceWorker.ready.then((registration) => {
           registration.showNotification("BowlIt Update 🍲", {
             body: "This is a manual test! The real ones will happen automatically now.",
             icon: "/logo1.svg"
           });
         });
      }
    } else {
      requestPermission();
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[9999]">
       <button
         onClick={testNotification}
         className="bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-500 transition-all flex items-center justify-center border-2 border-white"
         title={permission === "granted" ? "Test Notification" : "Enable Notifications"}
       >
         {permission === "granted" ? <Bell size={24} /> : <BellOff size={24} />}
       </button>
    </div>
  );
}