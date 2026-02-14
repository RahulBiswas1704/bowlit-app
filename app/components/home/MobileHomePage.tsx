"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, ArrowRight, Wallet, Leaf, Star, Beef, CheckCircle, Settings, X, PlusCircle, Calendar, Clock, ChefHat, Utensils
} from "lucide-react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function MobileHomePage() {
  const [mealTiming, setMealTiming] = useState<"lunch" | "dinner" | "combo">("lunch");
  const [duration, setDuration] = useState<7 | 14 | 28>(28);
  const { addToCart } = useCart();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false); // Added Custom Modal State

  // --- CONFIG (Synced with Desktop) ---
  const RATES = { veg: 110, mix: 125, nonVeg: 140 };
  const calculatePrice = (baseRate: number) => baseRate * duration * (mealTiming === 'combo' ? 2 : 1);

  // Synced Plans Data
  const plans = [
    { id: "green-plan", name: "The Green Bowl", type: "Veg", baseRate: RATES.veg, icon: Leaf, color: "bg-green-100 text-green-700", description: "Pure Veg Homestyle" },
    { id: "smart-mix", name: "The Smart Mix", type: "Mix", baseRate: RATES.mix, icon: Star, color: "bg-orange-100 text-orange-700", description: "Veg + Non-Veg Balanced", isPopular: true },
    { id: "red-plan", name: "The Red Bowl", type: "Non-Veg", baseRate: RATES.nonVeg, icon: Beef, color: "bg-red-100 text-red-700", description: "Daily Protein Power" }
  ];

  // Synced Personas Data (Fixed Images)
  const personas = [
    { title: "The Corporate Pro", description: "Fuel your hustle.", tag: "Work", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800" },
    { title: "The Student", description: "Brain fuel.", tag: "Study", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800" },
    { title: "New Resident", description: "Just like home.", tag: "Home", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" },
  ];

  const addOns = [
    { id: "chaas", name: "Masala Chaas", price: 30, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=300" },
    { id: "chicken-extra", name: "Extra Chicken", price: 80, image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=300" },
    { id: "gulab-jamun", name: "Gulab Jamun", price: 50, image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=300" },
    { id: "lassi", name: "Sweet Lassi", price: 60, image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=300" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      
      {/* 1. HERO - Matches Desktop Content "Stack. Eat. Repeat." */}
      <section className="relative bg-white pt-24 pb-8 px-5 rounded-b-[2.5rem] shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -z-10 opacity-50"></div>
        
        {/* Tagline Match */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-700 text-[10px] font-bold uppercase tracking-wide mb-6">
           <Zap size={12} fill="currentColor" /> #1 Rated Daily Meal Service
        </div>

        {/* Headline Match */}
        <h1 className="text-5xl font-extrabold text-gray-900 leading-[0.9] mb-5 tracking-tight">
          Stack. Eat.<br/>
          <span className="text-orange-600">Repeat.</span>
        </h1>
        
        <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-xs">
           We don't just deliver food; we deliver your fuel. Fresh, homestyle meals.
        </p>

        {/* Hero Image Card */}
        <div className="relative h-64 w-full rounded-[2rem] overflow-hidden shadow-xl mb-8">
           <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" />
           <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Trial Offer</p>
                <p className="text-xl font-extrabold text-gray-900">₹299 <span className="text-sm font-normal text-gray-500">/ 3 Days</span></p>
              </div>
              <button onClick={() => setIsTrialModalOpen(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg">Try Now</button>
           </div>
        </div>
      </section>

      {/* 2. PERSONAS - Fixed Images & Content */}
      <section className="py-8">
         <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-xl font-bold text-gray-900">Designed for You</h2>
            <span className="text-xs font-bold text-orange-600">Scroll &rarr;</span>
         </div>
         
         <div className="flex gap-4 overflow-x-auto px-6 pb-8 snap-x hide-scrollbar">
            {personas.map((p, i) => (
               <div key={i} className="snap-center shrink-0 w-48 h-64 rounded-3xl relative overflow-hidden shadow-md">
                  <img src={p.image} className="w-full h-full object-cover" alt={p.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                     <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">{p.tag}</span>
                     <p className="text-white font-bold text-lg leading-tight">{p.title}</p>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* 3. TWIN-ENGINE MENU - Synced Content */}
      <section className="py-2 px-6 mb-8">
         <div className="flex items-center justify-between mb-4">
             <div>
                <h2 className="text-xl font-bold">The "Twin-Engine" Menu</h2>
                <p className="text-xs text-gray-500">Rice for Lunch, Rotis for Dinner.</p>
             </div>
             <Link href="#plans"><ArrowRight size={20} className="text-orange-600 bg-orange-50 p-1 rounded-full w-8 h-8"/></Link>
         </div>
         <div className="space-y-3">
             {[{d:"Mon",m:"Dal Tadka + Jeera Aloo"},{d:"Tue",m:"Masoor Dal + Lauki"},{d:"Wed",m:"Dal Makhani (Creamy)"}].map((m,i)=>(
                 <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                     <div className="flex gap-3 items-center">
                         <div className="bg-orange-50 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">{m.d}</div>
                         <span className="text-sm font-medium text-gray-800">{m.m}</span>
                     </div>
                     <Utensils size={14} className="text-gray-300"/>
                 </div>
             ))}
         </div>
      </section>

      {/* 4. PLANS - Sticky Controls + Customize Button */}
      <section id="plans" className="px-4 py-8 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Choose Your Fuel</h2>
         
         {/* Sticky Controls */}
         <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-100 mb-6 sticky top-20 z-10">
            {/* Timing */}
            <div className="flex bg-gray-50 rounded-xl p-1 mb-2">
               {['lunch', 'dinner', 'combo'].map(t => (
                  <button key={t} onClick={() => setMealTiming(t as any)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${mealTiming === t ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
                    {t}
                  </button>
               ))}
            </div>
            
            {/* Duration + Customize Button */}
            <div className="flex items-center gap-2">
                <div className="flex-1 flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
                   {[7, 14, 28].map(d => (
                      <button key={d} onClick={() => setDuration(d as any)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border ${duration === d ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600'}`}>
                         {d} Days
                      </button>
                   ))}
                </div>
                {/* Customize Button Icon */}
                <button onClick={() => setIsCustomModalOpen(true)} className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 shrink-0">
                    <Settings size={18} />
                </button>
            </div>
         </div>

         {/* Plan Cards */}
         <div className="space-y-4">
            {plans.map((plan) => (
               <div key={plan.id} className="bg-gray-50 rounded-3xl p-5 border border-gray-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.color}`}>
                           <plan.icon size={20} />
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                           <p className="text-xs text-gray-500">{plan.description}</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Total Price</p>
                        <p className="text-2xl font-extrabold text-gray-900">₹{calculatePrice(plan.baseRate)}</p>
                     </div>
                     <button 
                       onClick={() => addToCart({ id: `${plan.id}-${duration}`, name: plan.name, price: calculatePrice(plan.baseRate), type: "Subscription", quantity: 1, image: "", description: `${plan.description} (${duration} Days)` })}
                       className="bg-black text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform"
                     >
                        Add <PlusCircle size={16} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* 5. ADD-ONS - Synced */}
      <section className="px-4 pb-8 bg-white">
          <h2 className="text-xl font-bold mb-4">Make it a Meal <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded-full align-middle ml-2">Add-ons</span></h2>
          <div className="grid grid-cols-2 gap-4">
             {addOns.map(item => (
                 <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-transform" onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, type: "Add-on", quantity: 1, image: item.image, description: "Add-on" })}>
                    <div className="h-28 bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                        <img src={item.image} className="w-full h-full object-cover"/>
                        <div className="absolute bottom-2 right-2 bg-white p-1.5 rounded-full text-orange-600 shadow-sm"><PlusCircle size={16}/></div>
                    </div>
                    <p className="font-bold text-sm truncate text-gray-900">{item.name}</p>
                    <p className="text-orange-600 font-bold text-xs">₹{item.price}</p>
                 </div>
             ))}
          </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="px-4 pb-24 bg-white">
         <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
             <h2 className="text-xl font-bold mb-6 text-center">Zero Hassle. Full Control.</h2>
             <div className="space-y-6">
                {[
                 { icon: Calendar, t: "1. Pick Plan", d: "Veg, Non-Veg, or Mix." },
                 { icon: Wallet, t: "2. Top Up", d: "Add money to wallet." },
                 { icon: Clock, t: "3. Auto-Pilot", d: "Daily delivery 1PM / 8PM." }
                ].map((s,i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <div className="bg-white p-2 rounded-full text-orange-600 shadow-sm"><s.icon size={20}/></div>
                        <div><p className="font-bold text-gray-900 text-sm">{s.t}</p><p className="text-xs text-gray-500">{s.d}</p></div>
                    </div>
                ))}
             </div>
         </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        {/* Trial Modal */}
        {isTrialModalOpen && (
           <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full rounded-t-[2rem] p-6 pb-10">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">3-Day Trial Pass</h3>
                    <button onClick={() => setIsTrialModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                 </div>
                 <div className="bg-orange-50 p-4 rounded-2xl flex gap-4 mb-6 border border-orange-100">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">🥗</div>
                    <div>
                       <p className="font-bold text-gray-900">Sample Menu</p>
                       <p className="text-xs text-gray-500">Butter Chicken, Dal Tadka, Paneer...</p>
                    </div>
                 </div>
                 <button onClick={() => { addToCart({ id: "trial", name: "3-Day Trial", price: 299, type: "Trial", quantity: 1, image: "", description: "Trial Pass" }); setIsTrialModalOpen(false); }} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200">
                    Add to Cart • ₹299
                 </button>
              </motion.div>
           </div>
        )}
        
        {/* Custom Plan Modal (New for Mobile) */}
        {isCustomModalOpen && (
             <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-6 max-w-xs w-full text-center relative">
                   <button onClick={() => setIsCustomModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full"><X size={20}/></button>
                   <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600"><Settings size={32}/></div>
                   <h3 className="text-xl font-bold mb-2">Custom Plan</h3>
                   <p className="text-gray-500 text-sm mb-6">Need specific dates or excluding weekends? We can help!</p>
                   <a href="https://wa.me/919876543210" target="_blank" className="block w-full bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-100">Chat on WhatsApp</a>
                </motion.div>
             </div>
        )}
      </AnimatePresence>
    </div>
  );
}