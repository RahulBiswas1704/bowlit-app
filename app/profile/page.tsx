"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, MapPin, Calendar as CalendarIcon, Wallet, Save, Loader2, Utensils, Mail, ArrowLeft, ChevronLeft, ChevronRight, PauseCircle, PlayCircle, CheckCircle, XCircle, Share2, Gift, Star, ShoppingBag, Settings, LayoutDashboard, Edit2, Truck, HelpCircle, MessageCircle, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanSummaryCard } from "./components/PlanSummaryCard";
import { PersonalDetailsForm } from "./components/PersonalDetailsForm";
import { AddressManager } from "./components/AddressManager";
import { LiveTrackingCard } from "../components/LiveTrackingCard";

export default function ProfilePage() {
  const router = useRouter();
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
  const [storeSettings, setStoreSettings] = useState<{ referral_reward_sender: number, referral_reward_receiver: number }>({ referral_reward_sender: 150, referral_reward_receiver: 100 });

  // Tab State
  const [activeTab, setActiveTab] = useState("menu");

  // NEW: NPS Feedback State
  const [pendingFeedbackOrder, setPendingFeedbackOrder] = useState<any>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }
        setUserId(user.id);

        // 1. Fetch Profile & Credits
        const meta = user.user_metadata || {};
        setFormData({
          fullName: meta.full_name || "",
          phone: meta.phone || "",
          email: user.email || "",
          diet: meta.diet || "Veg",
          gender: meta.gender || "",
          dob: meta.dob || "",
          latitude: meta.latitude || null,
          longitude: meta.longitude || null,
          building_name: meta.building_name || "",
          delivery_instructions: meta.delivery_instructions || "",
        });
        setIsAutoOrderActive(meta.auto_order !== false);
        setCredits(meta.credits || 0);
        setActivePlan(meta.active_plan || "");

        // 2. Fetch Wallet
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
        setBalance(wallet?.balance || 0);

        // 3. Fetch Orders (Prevent undefined error if phone missing)
        const { data: orderData } = await supabase.from('orders').select('id, created_at, status, total_amount').eq('customer_phone', meta.phone || '0000000000');
        setOrders(orderData || []);

        // 3.5 Check for Unrated Orders
        if (orderData && orderData.length > 0) {
          const lastCompleted = orderData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).find((o: any) => o.status === "Completed");

          if (lastCompleted) {
            const { data: existingFeedback } = await supabase.from('feedback').select('id').eq('order_id', lastCompleted.id).single();
            if (!existingFeedback) {
              setPendingFeedbackOrder(lastCompleted);
            }
          }
        }

        // 4. Fetch Paused Dates
        const { data: pauseData } = await supabase.from('paused_dates').select('pause_date').eq('user_id', user.id);
        setPausedDates(pauseData?.map((p: any) => p.pause_date) || []);

        // 5. Fetch Store Settings
        try {
          const res = await fetch('/api/admin/settings');
          const result = await res.json();
          if (result.settings) {
            setStoreSettings({
              referral_reward_sender: result.settings.referral_reward_sender || 150,
              referral_reward_receiver: result.settings.referral_reward_receiver || 100
            });
          }
        } catch (e) {
          console.error("Failed to load settings:", e);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
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

  // --- NPS FEEDBACK SUBMISSION ---
  const handleFeedbackSubmit = async () => {
    if (!rating || !pendingFeedbackOrder || !userId) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          order_id: pendingFeedbackOrder.id,
          score: rating,
          comment: feedbackComment
        })
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      // Success: Hide the modal
      setPendingFeedbackOrder(null);
    } catch (e: any) {
      alert(e.message);
    }
    setSubmittingFeedback(false);
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
    <main className="min-h-screen bg-gray-50 flex justify-center relative overflow-hidden">

      {/* BACKGROUND GRAPHIC (OPTIONAL FADE) */}
      <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-gray-100 to-transparent pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 pb-20">
        <AnimatePresence mode="wait">

          {/* -------------------- MASTER MENU STACK -------------------- */}
          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-12 px-5 space-y-8"
            >
              {/* TOP HEADER */}
              <div className="flex justify-between items-center">
                <Link href="/" className="p-2 -ml-2 text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                  <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Account</h1>
                <button onClick={() => setActiveTab('settings')} className="p-2 -mr-2 text-green-600 hover:bg-green-50 rounded-full transition-colors">
                  <Settings size={24} />
                </button>
              </div>

              {/* USER PROFILE CARD */}
              <div className="flex flex-col items-center justify-center mt-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl font-bold uppercase overflow-hidden border-[3px] border-white shadow-md">
                    {formData.fullName ? formData.fullName.charAt(0) : <User size={40} />}
                  </div>
                  <button onClick={() => setActiveTab('settings')} className="absolute bottom-0 right-0 bg-green-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm hover:scale-105 transition-transform"><Edit2 size={14} /></button>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mt-4 tracking-tight">{formData.fullName || "Fresh User"}</h2>
                <p className="text-sm font-medium text-gray-500 mt-0.5">{formData.phone ? `+91 ${formData.phone}` : "No phone added"}</p>
              </div>

              {/* HERO ACTIVE PLAN CARD */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center relative mx-auto">
                <div className="w-16 h-16 bg-green-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200 mb-4 transform -rotate-3">
                  <Utensils size={32} className="rotate-3" />
                </div>
                <div className="bg-green-600 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full mb-2">Active Plan</div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">{activePlan || "No Active Plan"}</h3>
                <p className="text-xs text-gray-500 font-medium mb-6">Meals remaining: <span className="font-bold text-gray-900">{credits} deliveries</span></p>
                <button onClick={() => setActiveTab('calendar')} className="w-full bg-[#9a3412] text-white font-bold py-3.5 rounded-xl hover:bg-[#7c2d12] transition-colors shadow-lg shadow-orange-900/20">
                  Manage Plan
                </button>
              </div>

              {/* CORE FEATURES STACK */}
              <div className="space-y-4">
                <button onClick={() => setActiveTab('calendar')} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100">
                  <div className="bg-gray-100 text-green-700 p-3 rounded-xl"><Truck size={22} /></div>
                  <div className="text-left flex-grow">
                    <div className="font-bold text-gray-900 text-base">Manage Delivery</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Schedule, pause, or change address</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </button>

                <button onClick={() => setActiveTab('wallet')} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100">
                  <div className="bg-gray-100 text-green-700 p-3 rounded-xl"><Wallet size={22} /></div>
                  <div className="text-left flex-grow">
                    <div className="font-bold text-gray-900 text-base">My Wallet</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Balance: ₹{balance.toFixed(2)}</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </button>

                <button onClick={() => setActiveTab('refer')} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100">
                  <div className="bg-gray-100 text-[#9a3412] p-3 rounded-xl"><Gift size={22} /></div>
                  <div className="text-left flex-grow">
                    <div className="font-bold text-gray-900 text-base">Referral Hub</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Earn ₹{storeSettings.referral_reward_sender} for every friend</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </button>

                <button onClick={() => setActiveTab('orders')} className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100">
                  <div className="bg-gray-100 text-blue-600 p-3 rounded-xl"><ShoppingBag size={22} /></div>
                  <div className="text-left flex-grow">
                    <div className="font-bold text-gray-900 text-base">Order History</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{orders.length} past deliveries</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </button>
              </div>

              {/* ACCOUNT SETTINGS LIST */}
              <div className="mt-8">
                <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mb-3 ml-4">Account Settings</h4>
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                  <button onClick={() => setActiveTab('settings')} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="text-gray-700"><Mail size={20} /></div>
                    <div className="text-left flex-grow">
                      <div className="font-bold text-gray-900 text-[13px]">Email Address</div>
                      <div className="text-[11px] font-medium text-gray-500 mt-0.5">{formData.email || 'Click to verify email'}</div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                  <button onClick={() => setActiveTab('addresses')} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="text-gray-700"><MapPin size={20} /></div>
                    <div className="text-left flex-grow">
                      <div className="font-bold text-gray-900 text-[13px]">Saved Addresses</div>
                      <div className="text-[11px] font-medium text-gray-500 mt-0.5">{formData.building_name ? 'Home, Work, Other' : 'Add delivery location'}</div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                </div>
              </div>

              {/* SUPPORT & HELP */}
              <div className="mt-8">
                <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mb-3 ml-4">Support & Help</h4>
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                  <button onClick={() => window.open('https://wa.me/?text=Hi BowlIt Team!', '_blank')} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="text-gray-700"><HelpCircle size={20} /></div>
                    <div className="text-left flex-grow">
                      <div className="font-bold text-gray-900 text-[13px]">FAQs & Guide</div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                  <button onClick={() => window.open('https://wa.me/?text=Hi BowlIt Support!', '_blank')} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="text-gray-700"><MessageCircle size={20} /></div>
                    <div className="text-left flex-grow">
                      <div className="font-bold text-gray-900 text-[13px]">Chat with Support</div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                </div>
              </div>

              {/* SIGN OUT */}
              <div className="mt-8 pb-10">
                <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full bg-red-100/50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <LogOut size={18} /> Sign Out
                </button>
                <div className="text-center mt-6">
                  <div className="text-[9px] font-black tracking-[0.2em] text-gray-300 uppercase">BowlIt V2.4.0 — Made With Love</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* -------------------- SUB-VIEWS (ANIMATED OVERLAYS) -------------------- */}
          {activeTab !== 'menu' && (
            <motion.div
              key="subview"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-40 bg-gray-50 min-h-[100dvh] w-full overflow-y-auto"
            >
              {/* STICKY HEADER FOR SUB-VIEWS */}
              <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <button onClick={() => setActiveTab('menu')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-black text-gray-900">
                  {activeTab === 'calendar' ? 'Manage Delivery' : ''}
                  {activeTab === 'wallet' ? 'My Wallet' : ''}
                  {activeTab === 'refer' ? 'Referral Hub' : ''}
                  {activeTab === 'orders' ? 'Order History' : ''}
                  {activeTab === 'addresses' ? 'Saved Addresses' : ''}
                  {activeTab === 'settings' ? 'Personal Details' : ''}
                </h2>
              </div>

              {/* SUB-VIEW CONTENTS */}
              <div className="p-5 pb-20 space-y-6">
                {/* 1. DELIVERY / CALENDAR */}
                {activeTab === 'calendar' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-4 md:p-8 shadow-sm border border-gray-100">
                      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 gap-3 sm:gap-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 self-start sm:self-auto">Meal Calendar</h3>
                        <div className="flex items-center gap-2 md:gap-4 bg-gray-50 md:bg-transparent rounded-full md:rounded-none p-1 md:p-0">
                          <button onClick={() => changeMonth(-1)} className="p-2 md:p-2 hover:bg-gray-200 md:hover:bg-gray-100 rounded-full"><ChevronLeft size={18} className="md:w-5 md:h-5" /></button>
                          <span className="font-bold text-sm md:text-lg w-28 md:w-32 text-center">{monthNames[month]} {year}</span>
                          <button onClick={() => changeMonth(1)} className="p-2 md:p-2 hover:bg-gray-200 md:hover:bg-gray-100 rounded-full"><ChevronRight size={18} className="md:w-5 md:h-5" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 md:gap-2 text-center mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: days }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const checkDate = new Date(dateStr);
                          const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
                          const isPast = dateStr < todayStr;
                          const isToday = dateStr === todayStr;
                          const hasOrder = orders.some(o => o.created_at.startsWith(dateStr));
                          const isPaused = pausedDates.includes(dateStr);
                          const isScheduled = scheduledDays[dateStr];

                          let bgClass = "bg-gray-50 text-gray-400";
                          let content = <span>{day}</span>;
                          if (isPast) {
                            if (hasOrder) { bgClass = "bg-green-100 text-green-700 border border-green-200"; content = <div className="flex flex-col items-center"><span>{day}</span></div>; }
                            else { bgClass = "bg-gray-100 text-gray-400 opacity-50"; }
                          } else {
                            if (isWeekend) { bgClass = "bg-white text-gray-300"; }
                            else if (isPaused) { bgClass = "bg-red-50 text-red-500 border border-red-200 cursor-pointer hover:bg-red-100"; content = <div className="flex flex-col items-center"><span>{day}</span><span className="text-[7px] md:text-[9px] font-bold mt-0.5">SKIP</span></div>; }
                            else if (isScheduled) { bgClass = "bg-blue-50 text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100"; const label = activePlan.includes("Lunch + Dinner") ? "2 MEALS" : "MEAL"; content = <div className="flex flex-col items-center"><span>{day}</span><span className="text-[7px] md:text-[9px] font-bold mt-0.5">{label}</span></div>; }
                            else if (isAutoOrderActive) { bgClass = "bg-gray-100 text-gray-400 border border-gray-200 cursor-pointer hover:bg-gray-200"; content = <div className="flex flex-col items-center"><span>{day}</span></div>; }
                          }
                          return (
                            <div key={day} onClick={() => !isPast && !isWeekend && togglePauseDate(day)} className={`h-12 md:h-16 rounded-xl flex items-center justify-center text-xs md:text-sm font-bold transition-all ${bgClass}`}>{content}</div>
                          );
                        })}
                      </div>
                    </div>

                    <button onClick={() => setIsAutoOrderActive(!isAutoOrderActive)} className={`flex items-center justify-center gap-2 md:gap-3 px-4 py-4 md:px-6 md:py-3 rounded-[1.5rem] font-bold transition-all w-full text-sm md:text-base border-2 ${isAutoOrderActive ? 'bg-white border-green-200 text-green-700 shadow-sm' : 'bg-red-50 border-transparent text-red-700'}`}>
                      {isAutoOrderActive ? <PlayCircle size={18} className="md:w-5 md:h-5" /> : <PauseCircle size={18} className="md:w-5 md:h-5" />}
                      {isAutoOrderActive ? "Subscription is Active" : "Subscription is Paused"}
                    </button>
                  </div>
                )}

                {/* 2. WALLET */}
                {activeTab === 'wallet' && (
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <PlanSummaryCard activePlan={activePlan} credits={credits} balance={balance} />
                  </div>
                )}

                {/* 3. REFERRAL HUB */}
                {activeTab === 'refer' && (
                  <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-white/10 rotate-12"><Gift size={180} /></div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"><Share2 size={14} /> Viral Growth</div>
                      <h2 className="text-3xl font-black mb-3 leading-tight">Refer a friend, get ₹{storeSettings.referral_reward_sender}!</h2>
                      <p className="text-green-50/90 mb-8 text-sm">Tell your office mates to use your phone number as a Promo Code. They save ₹{storeSettings.referral_reward_receiver}, and you get ₹{storeSettings.referral_reward_sender} added directly to your Walllet!</p>
                      <div className="bg-white/10 rounded-2xl p-5 flex flex-col items-center justify-between gap-4 backdrop-blur-md border border-white/20 text-center">
                        <div>
                          <div className="text-[11px] font-bold text-green-100/80 uppercase tracking-widest mb-1.5">Your VIP Promo Code</div>
                          <div className="text-3xl font-mono font-black tracking-widest text-[#fde047]">{formData.phone || 'NO_PHONE'}</div>
                        </div>
                        <button onClick={() => { const message = `Hey! Use my code *${formData.phone}* on BowlIt.in to get ₹${storeSettings.referral_reward_receiver} off your first meal! 🍛`; window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank'); }} className="w-full bg-white text-green-800 font-black px-6 py-4 rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg mt-3">
                          <Share2 size={18} /> Send to WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ORDERS */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-[2rem] shadow-sm border border-gray-100 text-gray-400 font-medium">No past deliveries found.</div>
                    ) : (
                      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(order => (
                        <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[1.5rem] bg-white border border-gray-100/80 hover:border-gray-300 transition-all gap-4 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl flex items-center justify-center ${order.status === 'Completed' ? 'bg-green-50 text-green-600' : order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                              <ShoppingBag size={24} />
                            </div>
                            <div>
                              <div className="font-black text-gray-900 text-lg mb-0.5">Order #{order.id}</div>
                              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-1 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-dashed border-gray-100">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'text-green-700 bg-green-100/50' : order.status === 'Cancelled' ? 'text-red-700 bg-red-100/50' : 'text-orange-700 bg-orange-100/50'}`}>
                              {order.status}
                            </span>
                            <span className="font-black text-gray-900 text-xl sm:mt-3">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. ADDRESSES */}
                {activeTab === 'addresses' && (
                  <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 overflow-hidden">
                    <AddressManager userId={userId} />
                  </div>
                )}

                {/* 6. SETTINGS */}
                {activeTab === 'settings' && (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <PersonalDetailsForm formData={formData} setFormData={setFormData} handleUpdateProfile={handleUpdateProfile} saving={saving} />
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </main>
  );
}
