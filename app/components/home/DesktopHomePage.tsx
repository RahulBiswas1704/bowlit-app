"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, Clock, Calendar, Wallet, CheckCircle, ArrowRight, Utensils, 
  Zap, Leaf, Beef, Star, PlusCircle, X, Settings, CheckCircle2 
} from "lucide-react";
import { useCart } from "../../context/CartContext";

type Plan = { id: string; name: string; base_price: number; type: string; description: string; features?: string[]; };
type WeeklyMenu = { day_of_week: string; lunch_dish: string; veg_dish: string; non_veg_dish: string; };
type AddOn = { id: number; name: string; price: number; image: string; };

interface DesktopHomeProps {
  plans: Plan[];
  weeklyMenu: WeeklyMenu[];
  addOns: AddOn[];
}

export default function DesktopHomePage({ plans, weeklyMenu, addOns }: DesktopHomeProps) {
  const [mealTiming, setMealTiming] = useState<"lunch" | "dinner" | "combo">("lunch");
  const [duration, setDuration] = useState<7 | 14 | 28>(28);
  const { addToCart } = useCart();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // 1. CREATE THE REF
  const plansSectionRef = useRef<HTMLDivElement>(null);

  // 2. SCROLL FUNCTION
  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const TRIAL_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000";

  const calculatePrice = (basePrice: number) => basePrice * duration * (mealTiming === 'combo' ? 2 : 1);

  const getPlanStyle = (type: string) => {
    switch(type) {
      case 'Veg': return { icon: Leaf, color: "text-green-500", bg: "bg-green-500/10", border: "hover:border-green-500/50" };
      case 'Non-Veg': return { icon: Beef, color: "text-red-500", bg: "bg-red-500/10", border: "hover:border-red-500/50" };
      default: return { icon: Star, color: "text-orange-500", bg: "bg-orange-500/10", border: "hover:border-orange-500/50" };
    }
  };

  const personas = [
    { title: "The Corporate Pro", description: "Fuel your hustle with zero hassle.", tag: "Work", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800" },
    { title: "The Student", description: "Brain fuel for late nights.", tag: "Study", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800" },
    { title: "New Resident", description: "Just like home cooking.", tag: "Home", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" },
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-bold shadow-lg mb-8">
              <Zap size={16} className="text-orange-400" /> #1 Rated Daily Meal Service
            </div>
            <h1 className="text-8xl font-black text-gray-900 leading-[0.95] mb-8">
              Stack. Eat. <br /> <span className="text-orange-600">Repeat.</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-lg leading-relaxed mb-10 font-medium">
              We don't just deliver food; we deliver your fuel. Fresh, homestyle meals batched for zero-error delivery.
            </p>
            
            <div className="flex gap-4 relative z-50">
               {/* BUTTON WITH REF SCROLL */}
               <motion.button 
                 whileHover={{ scale: 1.05 }} 
                 whileTap={{ scale: 0.95 }} 
                 onClick={scrollToPlans} 
                 className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 cursor-pointer"
               >
                 View Plans <ArrowRight size={20} />
               </motion.button>
               
               <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsTrialModalOpen(true)} className="bg-white border-2 border-gray-100 text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:border-black transition-all cursor-pointer">
                 Try for ₹299
               </motion.button>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.8, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8 }} className="relative h-[650px] group z-0 pointer-events-none">
             <div className="absolute inset-0 bg-black/5 rounded-[4rem] rotate-3 transform transition-transform group-hover:rotate-6"></div>
             <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000" className="w-full h-full object-cover rounded-[4rem] shadow-2xl relative z-10" />
          </motion.div>
        </div>
      </section>

      {/* 2. PERSONAS SECTION (Animated) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
           <h2 className="text-5xl font-black text-center mb-16">Designed for Your Lifestyle</h2>
           <div className="grid grid-cols-3 gap-8">
             {personas.map((p, i) => (
               <motion.div whileHover={{ y: -10 }} key={i} className="group relative h-[450px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                 <img src={p.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                    <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold w-fit mb-3">{p.tag}</span>
                    <h3 className="text-3xl font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{p.description}</p>
                 </div>
               </motion.div>
             ))}
           </div>
        </div>
      </section>

      {/* 3. TWIN-ENGINE MENU */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-end justify-between mb-16">
               <div>
                 <h2 className="text-5xl font-black text-gray-900 mb-2">Weekly Menu</h2>
                 <p className="text-gray-500 text-lg">Rice for Lunch, Rotis for Dinner. Perfectly Balanced.</p>
               </div>
               
               {/* BUTTON WITH REF SCROLL */}
               <motion.button 
                 whileHover={{ scale: 1.05 }} 
                 whileTap={{ scale: 0.95 }}
                 onClick={scrollToPlans} 
                 className="text-orange-600 font-bold flex items-center gap-2 hover:gap-4 transition-all cursor-pointer text-lg bg-orange-50 px-6 py-3 rounded-xl hover:bg-orange-100"
               >
                 Get Started <ArrowRight/>
               </motion.button>
            </div>
            
            <div className="grid grid-cols-4 gap-6">
               {weeklyMenu.map((m, i) => (
                 <motion.div 
                    key={i} 
                    whileHover={{ y: -10 }} 
                    className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all group"
                 >
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold">{m.day_of_week}</span>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Utensils size={18}/></div>
                    </div>
                    <h4 className="font-bold text-xl mb-6 min-h-[3.5rem]">{m.lunch_dish}</h4>
                    
                    <div className="space-y-3">
                        <div className="flex gap-3 items-center p-3 rounded-2xl bg-green-50 border border-green-100">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div>
                                <span className="block text-[10px] font-black text-green-600 uppercase tracking-wider">Veg</span>
                                <p className="text-xs font-bold text-green-900 leading-tight">{m.veg_dish || 'Veg Special'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center p-3 rounded-2xl bg-red-50 border border-red-100">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <div>
                                <span className="block text-[10px] font-black text-red-600 uppercase tracking-wider">Non-Veg</span>
                                <p className="text-xs font-bold text-red-900 leading-tight">{m.non_veg_dish || 'Non-Veg Special'}</p>
                            </div>
                        </div>
                    </div>
                 </motion.div>
               ))}
               {weeklyMenu.length === 0 && <p className="col-span-4 text-center text-gray-400">Loading Menu...</p>}
            </div>
         </div>
      </section>

      {/* 4. PLANS SECTION - ATTACHED REF HERE */}
      <div ref={plansSectionRef} className="relative z-20">
        <section className="py-32 bg-black text-white rounded-t-[5rem] -mt-10">
            <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-20">
                <h2 className="text-6xl font-black mb-10">Choose Your Fuel</h2>
                
                <div className="flex justify-center gap-6">
                    <div className="bg-gray-900 p-2 rounded-2xl flex">
                        {['lunch', 'dinner', 'combo'].map(t => (
                        <button key={t} onClick={() => setMealTiming(t as any)} className={`px-8 py-3 rounded-xl font-bold capitalize transition-all ${mealTiming === t ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="bg-gray-900 p-2 rounded-2xl flex">
                        {[7, 14, 28].map(d => (
                        <button key={d} onClick={() => setDuration(d as any)} className={`px-8 py-3 rounded-xl font-bold transition-all ${duration === d ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{d} Days</button>
                        ))}
                    </div>
                    <button onClick={() => setIsCustomModalOpen(true)} className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-gray-800 transition-colors"><Settings/></button>
                </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                {plans.map(plan => {
                    const { icon: Icon, bg, color, border } = getPlanStyle(plan.type);
                    const isPopular = plan.name.includes("Mix");
                    return (
                    <motion.div 
                        key={plan.id} 
                        whileHover={{ y: -15 }}
                        className={`bg-gray-900 rounded-[3.5rem] p-10 border-2 border-transparent ${border} transition-all relative group overflow-hidden`}
                    >
                        {isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-6 py-2 rounded-b-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/40">Most Popular</div>}
                        <div className="flex justify-between items-start mb-10 mt-4"><div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${bg} ${color}`}><Icon size={32} /></div><div className="text-right"><p className="text-5xl font-black tracking-tight">₹{calculatePrice(plan.base_price)}</p><p className="text-gray-500 text-sm font-bold uppercase mt-1">/ {duration} Days</p></div></div>
                        <h3 className="text-3xl font-bold mb-2">{plan.name}</h3><p className="text-gray-400 mb-10 leading-relaxed">{plan.description}</p>
                        <div className="space-y-4 mb-10">{(plan.features || ["Homestyle Quality", "Free Delivery", "Pause Anytime"]).map((f,i) => (<div key={i} className="flex gap-4 text-gray-300 font-medium"><CheckCircle size={20} className="text-gray-600 shrink-0"/> {f}</div>))}</div>
                        <button onClick={() => addToCart({ id: `${plan.id}-${mealTiming}-${duration}`, name: plan.name, price: calculatePrice(plan.base_price), type: "Subscription", quantity: 1, image: "", description: `${plan.description} (${duration} Days)` })} className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl cursor-pointer ${isPopular ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>Subscribe Now</button>
                    </motion.div>
                )})}
                </div>
            </div>
        </section>
      </div>

      {/* 5. ADD-ONS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
           <h3 className="text-4xl font-black mb-12">Make it a Meal <span className="text-orange-600 text-lg align-middle bg-orange-100 px-3 py-1 rounded-full ml-4">Add-ons</span></h3>
           <div className="grid grid-cols-4 gap-8">
              {addOns.map(item => (
                 <motion.div whileHover={{ y: -5 }} key={item.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 hover:shadow-xl transition-all group cursor-pointer" onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, type: "Add-on", quantity: 1, image: item.image, description: "Add-on" })}>
                    <div className="h-48 rounded-3xl bg-gray-100 mb-4 overflow-hidden relative"><img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute bottom-3 right-3 bg-white p-2 rounded-full text-orange-600 shadow-md"><PlusCircle size={20}/></div></div><h4 className="font-bold text-xl">{item.name}</h4><p className="text-orange-600 font-bold text-lg">₹{item.price}</p>
                 </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
           <h2 className="text-5xl font-black mb-20">Zero Hassle. Full Control.</h2>
           <div className="grid grid-cols-3 gap-16">
              {[
                 { icon: Calendar, t: "1. Pick Plan", d: "Choose Veg, Non-Veg, or Mix." },
                 { icon: Wallet, t: "2. Top Up", d: "Add money to your smart wallet." },
                 { icon: Clock, t: "3. Auto-Pilot", d: "Meals arrive daily at 1 PM / 8 PM." }
              ].map((s,i) => (
                 <div key={i} className="group p-8 rounded-[2.5rem] hover:bg-gray-50 transition-colors">
                    <div className="w-24 h-24 mx-auto bg-black text-white rounded-full flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform"><s.icon size={40}/></div>
                    <h4 className="text-2xl font-bold mb-4">{s.t}</h4>
                    <p className="text-gray-500 text-lg leading-relaxed">{s.d}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        {isTrialModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative overflow-hidden">
                    <button onClick={() => setIsTrialModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer z-50"><X size={24}/></button>
                    <div className="mb-8"><span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">Exclusive Offer</span><h3 className="text-3xl font-black text-gray-900">3-Day Taster Pass</h3></div>
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-8 shadow-lg"><img src={TRIAL_IMAGE} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4"><span className="text-white font-bold">Experience the quality</span></div></div>
                    <div className="space-y-4 mb-8">{["3 Days of standard lunch or dinner","Choose Veg or Non-Veg preference","Delivered to your doorstep"].map((txt, i) => (<div key={i} className="flex gap-3 text-sm text-gray-600 font-medium"><CheckCircle2 size={18} className="text-orange-500 shrink-0"/> {txt}</div>))}</div>
                    <button onClick={() => { addToCart({ id: "trial-pack", name: "3-Day Taster Pass", price: 299, type: "Trial", quantity: 1, image: TRIAL_IMAGE, description: "3 Days • Veg/Non-Veg Choice • Lunch/Dinner" }); setIsTrialModalOpen(false); }} className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl cursor-pointer">Add to Cart • ₹299</button>
                </motion.div>
            </div>
        )}
        {isCustomModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center relative"><button onClick={() => setIsCustomModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"><X size={24}/></button><Settings size={64} className="mx-auto text-orange-600 mb-6"/><h3 className="text-4xl font-black mb-4">Build Your Plan</h3><p className="text-gray-500 text-lg mb-10 leading-relaxed">Need a specific number of days? Excluding weekends? High protein? Chat with our team.</p><a href="https://wa.me/919876543210" target="_blank" className="block w-full bg-green-500 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-green-200 hover:bg-green-600 transition-all cursor-pointer">Chat on WhatsApp</a></motion.div>
             </div>
        )}
      </AnimatePresence>
    </div>
  );
}