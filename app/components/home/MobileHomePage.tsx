"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, ArrowRight, Wallet, Leaf, Star, Beef, Settings, X, PlusCircle, Calendar, Clock, Utensils, ChevronRight, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

type Plan = { id: string; name: string; base_price: number; type: string; description: string; };
type WeeklyMenu = { day_of_week: string; lunch_dish: string; veg_dish: string; non_veg_dish: string; };
type AddOn = { id: number; name: string; price: number; image: string; };

interface MobileHomeProps {
  plans: Plan[];
  weeklyMenu: WeeklyMenu[];
  addOns: AddOn[];
}

export default function MobileHomePage({ plans, weeklyMenu, addOns }: MobileHomeProps) {
  const [mealTiming, setMealTiming] = useState<"lunch" | "dinner" | "combo">("lunch");
  const [duration, setDuration] = useState<7 | 14 | 28>(28);
  const { addToCart } = useCart();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Common image for Trial Pack (Using the delicious thali image)
  const TRIAL_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000";

  const calculatePrice = (basePrice: number) => basePrice * duration * (mealTiming === 'combo' ? 2 : 1);

  const getPlanStyle = (type: string) => {
    switch(type) {
      case 'Veg': return { icon: Leaf, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" };
      case 'Non-Veg': return { icon: Beef, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" };
      default: return { icon: Star, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const personas = [
    { title: "The Corporate Pro", tag: "Work", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800" },
    { title: "The Student", tag: "Study", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800" },
    { title: "New Resident", tag: "Home", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      
      {/* 1. HERO */}
      <section className="relative bg-white pt-24 pb-10 px-6 rounded-b-[2.5rem] shadow-sm overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-wide mb-6 shadow-lg shadow-orange-500/20">
            <Zap size={12} fill="currentColor" className="text-orange-400" /> #1 Rated Daily Meal Service
            </div>
            <h1 className="text-6xl font-black text-gray-900 leading-[0.9] mb-4 tracking-tighter">
            Stack.<br/>Eat.<br/><span className="text-orange-600">Repeat.</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg mb-8 max-w-[80%] leading-tight">Homestyle meals. Zero hassle. Delivered daily.</p>
            
            <div className="relative h-56 w-full rounded-[2rem] overflow-hidden shadow-2xl mb-8 group">
            <img src={TRIAL_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex justify-between items-center">
                <div className="text-white">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Trial Pack</p>
                    <p className="text-xl font-black">₹299</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsTrialModalOpen(true)} className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl">
                    Try Now
                </motion.button>
            </div>
            </div>
        </motion.div>
      </section>

      {/* 2. PERSONAS */}
      <section className="py-8 pl-6">
         <div className="flex items-end justify-between pr-6 mb-6">
            <h2 className="text-xl font-black text-gray-900">Designed for You</h2>
            <span className="text-xs font-bold text-orange-600">Scroll &rarr;</span>
         </div>
         <div className="flex gap-4 overflow-x-auto pb-8 pr-6 snap-x hide-scrollbar">
            {personas.map((p, i) => (
               <motion.div key={i} className="snap-center shrink-0 w-48 h-64 rounded-3xl relative overflow-hidden shadow-md">
                  <img src={p.image} className="w-full h-full object-cover" alt={p.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                     <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">{p.tag}</span>
                     <p className="text-white font-bold text-lg leading-tight">{p.title}</p>
                  </div>
               </motion.div>
            ))}
         </div>
      </section>

      {/* 3. TWIN-ENGINE MENU */}
      <section className="py-8 pl-6 bg-white rounded-t-[2.5rem] shadow-top">
         <div className="flex items-center justify-between pr-6 mb-4">
             <div>
                <h2 className="text-xl font-black text-gray-900">Weekly Menu</h2>
                <p className="text-xs text-gray-500 font-medium">Swipe to see days &rarr;</p>
             </div>
             <button onClick={() => scrollToSection('plans')} className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 active:scale-90 transition-transform"><ArrowRight size={20}/></button>
         </div>
         
         <div className="flex gap-4 overflow-x-auto pb-8 pr-6 snap-x hide-scrollbar">
             {weeklyMenu.map((m, i) => (
                 <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="snap-center shrink-0 w-[280px] bg-gray-50 p-4 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden"
                 >
                     <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200/50 rounded-bl-[4rem] -z-0"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold">{m.day_of_week}</span>
                            <h4 className="font-bold text-gray-900 leading-tight">{m.lunch_dish}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white p-3 rounded-2xl border border-gray-100">
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-wider block mb-1">Veg Hero</span>
                                <p className="text-xs font-bold text-green-900 leading-tight">{m.veg_dish}</p>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-gray-100">
                                <span className="text-[9px] font-black text-red-600 uppercase tracking-wider block mb-1">Non-Veg</span>
                                <p className="text-xs font-bold text-red-900 leading-tight">{m.non_veg_dish}</p>
                            </div>
                        </div>
                     </div>
                 </motion.div>
             ))}
         </div>
      </section>

      {/* 4. PLANS */}
      <section id="plans" className="px-4 py-8 bg-gray-50">
         <h2 className="text-3xl font-black text-center mb-8">Choose Your Fuel</h2>
         
         <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-lg p-2 rounded-2xl shadow-lg border border-gray-100 mb-8">
            <div className="flex bg-gray-100 rounded-xl p-1 mb-2">
               {['lunch', 'dinner', 'combo'].map(t => (
                  <button key={t} onClick={() => setMealTiming(t as any)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${mealTiming === t ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>{t}</button>
               ))}
            </div>
            <div className="flex gap-2">
                <div className="flex-1 flex gap-1">
                   {[7, 14, 28].map(d => (
                      <button key={d} onClick={() => setDuration(d as any)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${duration === d ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-200 text-gray-500'}`}>{d}D</button>
                   ))}
                </div>
                <button onClick={() => setIsCustomModalOpen(true)} className="w-10 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl border border-orange-100 active:scale-90 transition-transform"><Settings size={18} /></button>
            </div>
         </div>

         <div className="space-y-5 pb-10">
            {plans.map((plan) => {
               const style = getPlanStyle(plan.type);
               const Icon = style.icon;
               return (
               <motion.div 
                 key={plan.id}
                 whileTap={{ scale: 0.98 }}
                 className={`relative bg-white rounded-[2rem] p-6 border-2 ${style.border} shadow-sm overflow-hidden`}
               >
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 ${style.bg}`}></div>
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${style.bg} ${style.color}`}><Icon size={24} /></div>
                          <div className="text-right">
                              <p className="text-2xl font-black text-gray-900">₹{calculatePrice(plan.base_price)}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">/ {duration} Days</p>
                          </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mb-6 line-clamp-2">{plan.description}</p>
                      <button onClick={() => addToCart({ id: `${plan.id}-${mealTiming}-${duration}`, name: plan.name, price: calculatePrice(plan.base_price), type: "Subscription", quantity: 1, image: "", description: `${duration} Days` })} className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">Add Subscription <PlusCircle size={16} /></button>
                  </div>
               </motion.div>
            )})}
         </div>
      </section>

      {/* 5. ADD-ONS */}
      <section className="px-6 pb-12 bg-white pt-10 rounded-t-[2.5rem]">
          <h2 className="text-xl font-black mb-6">Extras</h2>
          <div className="grid grid-cols-2 gap-4">
             {addOns.map(item => (
                 <motion.div whileTap={{ scale: 0.95 }} key={item.id} className="bg-gray-50 p-3 rounded-[1.5rem] border border-gray-100 shadow-sm" onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, type: "Add-on", quantity: 1, image: item.image, description: "Add-on" })}>
                    <div className="h-28 bg-white rounded-2xl mb-3 overflow-hidden relative">
                        <img src={item.image} className="w-full h-full object-cover"/>
                        <div className="absolute bottom-2 right-2 bg-white p-1.5 rounded-full text-orange-600 shadow-md"><PlusCircle size={16}/></div>
                    </div>
                    <p className="font-bold text-sm truncate text-gray-900">{item.name}</p>
                    <p className="text-orange-600 font-bold text-xs">₹{item.price}</p>
                 </motion.div>
             ))}
          </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="px-4 pb-24 bg-white">
         <div className="bg-black text-white rounded-3xl p-8 border border-gray-800">
             <h2 className="text-2xl font-black mb-8 text-center">Zero Hassle. Full Control.</h2>
             <div className="space-y-8">
                {[
                 { icon: Calendar, t: "1. Pick Plan", d: "Veg, Non-Veg, or Mix." },
                 { icon: Wallet, t: "2. Top Up", d: "Add money to wallet." },
                 { icon: Clock, t: "3. Auto-Pilot", d: "Daily delivery 1PM / 8PM." }
                ].map((s,i) => (
                    <div key={i} className="flex gap-5 items-start">
                        <div className="bg-gray-800 p-3 rounded-2xl text-orange-500 shadow-sm"><s.icon size={24}/></div>
                        <div>
                            <p className="font-bold text-lg">{s.t}</p>
                            <p className="text-sm text-gray-400">{s.d}</p>
                        </div>
                    </div>
                ))}
             </div>
         </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        
        {/* TRIAL MODAL - NOW WITH DETAILS */}
        {isTrialModalOpen && (
           <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full rounded-t-[2.5rem] p-8 pb-10">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black">3-Day Taster Pack</h3>
                    <button onClick={() => setIsTrialModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                 </div>
                 
                 <div className="relative h-40 rounded-2xl overflow-hidden mb-6">
                    <img src={TRIAL_IMAGE} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                        <span className="text-white font-bold text-sm">Experience the taste</span>
                    </div>
                 </div>

                 <div className="space-y-3 mb-8">
                    {[
                        "3 Days of standard lunch or dinner",
                        "Choose Veg or Non-Veg preference",
                        "Delivered to your doorstep"
                    ].map((txt, i) => (
                        <div key={i} className="flex gap-3 text-sm text-gray-600 font-medium">
                            <CheckCircle2 size={18} className="text-orange-500 shrink-0"/> {txt}
                        </div>
                    ))}
                 </div>

                 <button 
                    onClick={() => { 
                        addToCart({ 
                            id: "trial-pack", 
                            name: "3-Day Taster Pass", 
                            price: 299, 
                            type: "Trial", 
                            quantity: 1, 
                            image: TRIAL_IMAGE, // SENDING REAL IMAGE
                            description: "3 Days • Veg/Non-Veg Choice • Lunch/Dinner" // SENDING REAL DESC
                        }); 
                        setIsTrialModalOpen(false); 
                    }} 
                    className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 active:scale-95 transition-transform"
                 >
                    Add to Cart • ₹299
                 </button>
              </motion.div>
           </div>
        )}

        {isCustomModalOpen && (
             <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center relative"><button onClick={() => setIsCustomModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full"><X size={20}/></button><div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600"><Settings size={32}/></div><h3 className="text-2xl font-black mb-2">Custom Plan</h3><p className="text-gray-500 text-sm mb-8">Need specific dates or excluding weekends? We can help!</p><a href="https://wa.me/919876543210" target="_blank" className="block w-full bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100">Chat on WhatsApp</a></motion.div>
             </div>
        )}
      </AnimatePresence>
    </div>
  );
}