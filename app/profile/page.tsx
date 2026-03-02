"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Calendar as CalendarIcon, Wallet, Save, Loader2, Utensils, Mail, ArrowLeft, ChevronLeft, ChevronRight, PauseCircle, PlayCircle, CheckCircle, XCircle, Share2, Gift, Star } from "lucide-react";
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
  const [storeSettings, setStoreSettings] = useState<{ referral_reward_sender: number, referral_reward_receiver: number }>({ referral_reward_sender: 150, referral_reward_receiver: 100 });

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

      // 3. Fetch Orders (Exclude feedback lookup on the initial array for speed)
      const { data: orderData } = await supabase.from('orders').select('id, created_at, status, total_amount').eq('customer_phone', meta.phone);
      setOrders(orderData || []);

      // 3.5 Check for Unrated Orders (NPS Popup Trigger)
      if (orderData && orderData.length > 0) {
        // Find the most recent strictly "Completed" order
        const lastCompleted = orderData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).find(o => o.status === "Completed");

        if (lastCompleted) {
          // See if it already has a feedback entry
          const { data: existingFeedback } = await supabase.from('feedback').select('id').eq('order_id', lastCompleted.id).single();
          if (!existingFeedback) {
            setPendingFeedbackOrder(lastCompleted);
          }
        }
      }

      // 4. Fetch Paused Dates
      const { data: pauseData } = await supabase.from('paused_dates').select('pause_date').eq('user_id', user.id);
      setPausedDates(pauseData?.map(p => p.pause_date) || []);

      // 5. Fetch Store Settings (For dynamic referral reward amounts)
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
    <main className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-12 px-4 md:px-6 relative">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">

        {/* --- AUTO-FEEDBACK (NPS) MODAL --- */}
        {pendingFeedbackOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-6 md:p-10 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>

              <div className="mx-auto w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-orange-50/50">
                <Utensils size={28} />
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-2">How was your lunch?</h3>
              <p className="text-sm font-medium text-gray-500 mb-8">
                Your order (#{pendingFeedbackOrder.id}) was delivered recently. Rate your meal to help us improve!
              </p>

              {/* STAR RATING INTERFACE */}
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                    className={`transition-all duration-200 ${(hoveredStar || rating) >= star
                        ? 'text-yellow-400 scale-110 drop-shadow-md'
                        : 'text-gray-200 hover:text-yellow-200'
                      }`}
                  >
                    <Star size={40} className={(hoveredStar || rating) >= star ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>

              {/* COMMENT BOX (Only shows if they selected 1, 2, or 3 stars) */}
              {rating > 0 && rating <= 3 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                  <textarea
                    placeholder="We're sorry it wasn't a 5-star experience. What went wrong?"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white resize-none transition-colors"
                    rows={3}
                  />
                </motion.div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={rating === 0 || submittingFeedback}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? <Loader2 size={20} className="animate-spin" /> : "Submit Feedback"}
                </button>
                <button
                  onClick={() => setPendingFeedbackOrder(null)}
                  className="w-full text-gray-400 font-bold py-2 text-sm hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </div>
        )}

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

        {/* 1.5 REFER & EARN BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 text-white/10 rotate-12">
            <Gift size={150} />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Share2 size={14} /> Viral Growth
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-2">Refer a friend, get ₹{storeSettings.referral_reward_sender}!</h2>
            <p className="text-green-50 mb-6 max-w-sm text-sm">
              Tell your office mates to use your phone number as a Promo Code on their first subscription. They save ₹{storeSettings.referral_reward_receiver}, and you get ₹{storeSettings.referral_reward_sender} added directly to your BowlIt Wallet!
            </p>

            <div className="bg-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md border border-white/20">
              <div>
                <div className="text-xs font-bold text-green-100 uppercase tracking-widest mb-1">Your Unique Code</div>
                <div className="text-2xl font-mono font-black tracking-widest">{formData.phone || 'NO_PHONE'}</div>
              </div>
              <button
                onClick={() => {
                  const message = `Hey! Use my promo code *${formData.phone}* on BowlIt.in to get ₹${storeSettings.referral_reward_receiver} off your first daily meal plan! 🍛`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full sm:w-auto bg-white text-green-700 font-black px-6 py-3 rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 size={18} /> Share on WhatsApp
              </button>
            </div>
          </div>
        </motion.div>

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
        <AddressManager userId={userId} />

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