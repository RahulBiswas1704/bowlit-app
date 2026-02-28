"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { CheckCircle, Clock, Bike, Phone, Utensils } from "lucide-react";
import { Order, Rider, WeeklyMenu } from "../types";
import { getRealWorldWeek } from "../lib/utils";

export function LiveTrackingCard({ userId }: { userId: string }) {
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [rider, setRider] = useState<Rider | null>(null);
    const [todaysMenu, setTodaysMenu] = useState<WeeklyMenu | null>(null);

    // We poll and setup a subscription once
    useEffect(() => {
        fetchActiveOrder();

        const channel = supabase
            .channel(`public:orders:user_id=eq.${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, () => {
                fetchActiveOrder(); // Re-fetch on any change
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    const fetchActiveOrder = async () => {
        // Find an order placed today that is NOT completed
        const todayDate = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", userId)
            .gte("created_at", `${todayDate}T00:00:00Z`)
            .neq("status", "Completed")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setActiveOrder(data);
            if (data.rider_phone) fetchRider(data.rider_phone);
            else setRider(null);

            fetchTodaysMenu();
        } else {
            setActiveOrder(null);
        }
    };

    const fetchRider = async (phone: string) => {
        const { data } = await supabase.from("riders").select("*").eq("phone", phone).single();
        if (data) setRider(data);
    };

    const fetchTodaysMenu = async () => {
        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const { data } = await supabase
            .from("weekly_menu")
            .select("*")
            .eq("week_number", getRealWorldWeek())
            .eq("day_of_week", currentDay)
            .single();
        if (data) setTodaysMenu(data);
    };

    if (!activeOrder) return null; // Don't show anything if no active order today

    // Status Pipeline Logic
    const steps = ["Cooking", "Out for Delivery", "Delivered"];
    const currentStepIndex = activeOrder.status === 'Completed' ? 2 : activeOrder.status === 'Out for Delivery' ? 1 : 0;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Live Order #{activeOrder.id}
            </div>

            <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Clock className="text-gray-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight">Today's Lunch</h2>
                    <p className="text-sm font-medium text-gray-500">
                        Arriving between 1:00 PM - 2:00 PM
                    </p>
                </div>
            </div>

            {/* PROGRESS PIPELINE */}
            <div className="relative mb-8 mt-2 px-2">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
                <div
                    className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / 2) * 100}%` }}
                ></div>

                <div className="flex justify-between relative z-10">
                    {/* Step 1: Cooking */}
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${currentStepIndex >= 0 ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                            <Utensils size={14} />
                        </div>
                        <p className={`text-[10px] font-bold mt-2 uppercase ${currentStepIndex >= 0 ? "text-gray-900" : "text-gray-400"}`}>Prep</p>
                    </div>

                    {/* Step 2: Delivery */}
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${currentStepIndex >= 1 ? "bg-orange-500 text-white" : "bg-white text-gray-300 border-2 border-gray-100"}`}>
                            <Bike size={14} />
                        </div>
                        <p className={`text-[10px] font-bold mt-2 uppercase ${currentStepIndex >= 1 ? "text-gray-900" : "text-gray-400"}`}>Transit</p>
                    </div>

                    {/* Step 3: Arrived */}
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${currentStepIndex >= 2 ? "bg-green-500 text-white" : "bg-white text-gray-300 border-2 border-gray-100"}`}>
                            <CheckCircle size={14} />
                        </div>
                        <p className={`text-[10px] font-bold mt-2 uppercase ${currentStepIndex >= 2 ? "text-green-600" : "text-gray-400"}`}>Arrived</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                {/* WHAT'S COOKING */}
                {todaysMenu && (
                    <div className="p-4 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">On the Menu</p>
                        <div className="flex gap-4">
                            <div>
                                {/* Assuming the order items array has the user's plan type so we know which dish to show, 
                                     or we just display the base meal for now */}
                                <p className="font-bold text-gray-900 text-sm whitespace-pre-wrap">{todaysMenu.lunch_dish.split(',').join('\n')}</p>
                                <p className="font-bold text-orange-600 text-sm mt-1">{todaysMenu.veg_dish} / {todaysMenu.non_veg_dish}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* RIDER INFO */}
                {currentStepIndex >= 1 && rider ? (
                    <div className="p-4 flex items-center justify-between bg-orange-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <Bike size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Rider</p>
                                <p className="font-bold text-gray-900">{rider.name}</p>
                            </div>
                        </div>
                        <a href={`tel:${rider.phone}`} className="bg-black text-white p-3 rounded-xl shadow-md hover:bg-gray-800 transition">
                            <Phone size={18} />
                        </a>
                    </div>
                ) : (
                    <div className="p-4 text-center">
                        <p className="text-xs font-bold text-gray-400">Kitchen is preparing your meal. Rider will be assigned soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
