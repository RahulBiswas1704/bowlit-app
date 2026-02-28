"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Calendar as CalendarIcon, Wallet, Save, Loader2, Utensils, Mail, ArrowLeft, ChevronLeft, ChevronRight, PauseCircle, PlayCircle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { PlanSummaryCard } from "./components/PlanSummaryCard";
import { PersonalDetailsForm } from "./components/PersonalDetailsForm";
import { AddressManager } from "./components/AddressManager";
import { LiveTrackingCard } from "../components/LiveTrackingCard";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState<any[]>([]);
  const [pausedDates, setPausedDates] = useState<string[]>([]);
  const [isAutoOrderActive, setIsAutoOrderActive] = useState(true);

  // NEW: Subscription State
  const [credits, setCredits] = useState(0);
  const [activePlan, setActivePlan] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    office: "",
    diet: "",
    gender: "",
    dob: "",
    latitude: null,
    longitude: null,
    building_name: "",
    delivery_instructions: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/";
        return;
      }
      setUserId(user.id);

      // 1. Fetch Profile & Credits
      const meta = user.user_metadata || {};
      setFormData({
        fullName: meta.full_name || "",
        phone: meta.phone || "",
        email: user.email || "",
        office: meta.office || "",
        diet: meta.diet || "Veg",
        gender: meta.gender || "",
        dob: meta.dob || "",
        latitude: meta.latitude || null,
        longitude: meta.longitude || null,
        building_name: meta.building_name || "",
        delivery_instructions: meta.delivery_instructions || "",
      });
      setIsAutoOrderActive(meta.auto_order !== false);
      setCredits(meta.credits || 0);          // <--- GET CREDITS
      setActivePlan(meta.active_plan || "");  // <--- GET PLAN NAME

      // 2. Fetch Wallet
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
      setBalance(wallet?.balance || 0);

      // 3. Fetch Orders
      const { data: orderData } = await supabase.from('orders').select('created_at, status').eq('customer_phone', meta.phone);
      setOrders(orderData || []);

      // 4. Fetch Paused Dates
      const { data: pauseData } = await supabase.from('paused_dates').select('pause_date').eq('user_id', user.id);
      setPausedDates(pauseData?.map(p => p.pause_date) || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const togglePauseDate = async (day: number) => {
    if (!userId) return;
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check if weekend
    const checkDate = new Date(dateStr);
    const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
    if (isWeekend) return alert("Weekends are already off!");

    const isPaused = pausedDates.includes(dateStr);
    let newPausedDates;

    if (isPaused) {
      newPausedDates = pausedDates.filter(d => d !== dateStr);
      await supabase.from('paused_dates').delete().eq('user_id', userId).eq('pause_date', dateStr);
    } else {
      newPausedDates = [...pausedDates, dateStr];
      await supabase.from('paused_dates').insert({ user_id: userId, pause_date: dateStr });
    }
    setPausedDates(newPausedDates);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        office: formData.office,
        diet: formData.diet,
        gender: formData.gender,
        dob: formData.dob,
        auto_order: isAutoOrderActive,
        latitude: formData.latitude,
        longitude: formData.longitude,
        building_name: formData.building_name,
        delivery_instructions: formData.delivery_instructions
      }
    });
    setSaving(false);
    if (error) alert(error.message);
    else alert("Profile Updated!");
  };

  // --- LOGIC: CALCULATE SCHEDULED MEALS ---
  // We need to simulate the future to see which days get credits
  const calculateSchedule = () => {
    let tempCredits = credits;
    const scheduleMap: Record<string, boolean> = {};
    const costPerDay = activePlan.includes("Lunch + Dinner") ? 2 : 1;

    // Simulate next 60 days
    const simDate = new Date();
    simDate.setDate(simDate.getDate() + 1); // Start tomorrow

    for (let i = 0; i < 60; i++) {
      const dateStr = simDate.toISOString().split('T')[0];
      const isWeekend = simDate.getDay() === 0 || simDate.getDay() === 6;
      const isPaused = pausedDates.includes(dateStr);

      // If valid day and we have credits
      if (!isWeekend && !isPaused && isAutoOrderActive && tempCredits >= costPerDay) {
        scheduleMap[dateStr] = true; // Mark as Scheduled
        tempCredits -= costPerDay;   // Deduct credits
      }

      simDate.setDate(simDate.getDate() + 1); // Next day
    }
    return scheduleMap;
  };

  const scheduledDays = calculateSchedule();
  const { days, firstDay, year, month } = getDaysInMonth(currentDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">

        {/* HEADER */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-4 md:mb-6 transition-colors font-bold text-sm">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm md:text-base text-gray-500">Manage subscription and preferences.</p>
            </div>
            <button
              onClick={() => setIsAutoOrderActive(!isAutoOrderActive)}
              className={`flex items-center justify-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-3 rounded-xl md:rounded-full font-bold transition-all w-full md:w-auto text-sm md:text-base ${isAutoOrderActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
            >
              {isAutoOrderActive ? <PlayCircle size={18} className="md:w-5 md:h-5" /> : <PauseCircle size={18} className="md:w-5 md:h-5" />}
              {isAutoOrderActive ? "Subscription Active" : "Subscription Paused"}
            </button>
          </div>
        </div>

        {/* 0. NEW: LIVE DELIVERY TRACKER */}
        {userId && <LiveTrackingCard userId={userId} />}

        {/* 1. PLAN & CREDITS SUMMARY */}
        <PlanSummaryCard
          activePlan={activePlan}
          credits={credits}
          balance={balance}
        />

        {/* 2. SMART MEAL CALENDAR */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 gap-3 sm:gap-0">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 self-start sm:self-auto">Meal Calendar</h3>
            <div className="flex items-center gap-2 md:gap-4 bg-gray-50 md:bg-transparent rounded-full md:rounded-none p-1 md:p-0">
              <button onClick={() => changeMonth(-1)} className="p-2 md:p-2 hover:bg-gray-200 md:hover:bg-gray-100 rounded-full"><ChevronLeft size={18} className="md:w-5 md:h-5" /></button>
              <span className="font-bold text-sm md:text-lg w-28 md:w-32 text-center">{monthNames[month]} {year}</span>
              <button onClick={() => changeMonth(1)} className="p-2 md:p-2 hover:bg-gray-200 md:hover:bg-gray-100 rounded-full"><ChevronRight size={18} className="md:w-5 md:h-5" /></button>
            </div>
          </div>

          <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 text-[10px] md:text-xs font-bold text-gray-500 justify-start flex-wrap">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Delivered</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Scheduled</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Paused</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> No Credits</div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty slots */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

            {/* Days */}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const checkDate = new Date(dateStr);
              const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;

              // Status Checks
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              const hasOrder = orders.some(o => o.created_at.startsWith(dateStr));
              const isPaused = pausedDates.includes(dateStr);
              const isScheduled = scheduledDays[dateStr]; // Calculated based on credits!

              let bgClass = "bg-gray-50 text-gray-400";
              let content = <span>{day}</span>;

              if (isPast) {
                if (hasOrder) {
                  bgClass = "bg-green-100 text-green-700 border border-green-200";
                  content = <div className="flex flex-col items-center"><span>{day}</span><CheckCircle size={10} className="md:w-3 md:h-3 mt-0.5" /></div>;
                } else {
                  bgClass = "bg-gray-100 text-gray-400 opacity-50";
                }
              } else {
                // FUTURE
                if (isWeekend) {
                  bgClass = "bg-white text-gray-300"; // Weekend style
                } else if (isPaused) {
                  bgClass = "bg-red-50 text-red-500 border border-red-200 cursor-pointer hover:bg-red-100";
                  content = <div className="flex flex-col items-center"><span>{day}</span><span className="text-[7px] md:text-[9px] font-bold mt-0.5">SKIP</span></div>;
                } else if (isScheduled) {
                  // HAS CREDITS
                  bgClass = "bg-blue-50 text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100";
                  const label = activePlan.includes("Lunch + Dinner") ? "2 MEALS" : "MEAL";
                  content = <div className="flex flex-col items-center"><span>{day}</span><span className="text-[7px] md:text-[9px] font-bold mt-0.5">{label}</span></div>;
                } else if (isAutoOrderActive) {
                  // NO CREDITS (Runway ended)
                  bgClass = "bg-gray-100 text-gray-400 border border-gray-200 cursor-pointer hover:bg-gray-200";
                  content = <div className="flex flex-col items-center"><span>{day}</span><span className="text-[7px] md:text-[8px] font-bold mt-0.5 leading-tight">NO<br />CREDIT</span></div>;
                }
              }

              return (
                <div
                  key={day}
                  onClick={() => !isPast && !isWeekend && togglePauseDate(day)}
                  className={`h-12 md:h-16 rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm font-bold transition-all ${bgClass}`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 3. SMART DELIVERY MAP */}
        <AddressManager
          formData={formData}
          setFormData={setFormData}
          handleUpdateProfile={handleUpdateProfile}
          saving={saving}
        />

        {/* 4. PERSONAL DETAILS */}
        <PersonalDetailsForm
          formData={formData}
          setFormData={setFormData}
          handleUpdateProfile={handleUpdateProfile}
          saving={saving}
        />
      </div>
    </main>
  );
}