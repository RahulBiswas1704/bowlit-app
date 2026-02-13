"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, Clock, Calendar, Wallet, Briefcase, GraduationCap, Home, CheckCircle, 
  ArrowRight, Utensils, Zap, Leaf, Beef, Star, PlusCircle, Coffee, IceCream, X
} from "lucide-react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { useCart } from "./context/CartContext";
import { supabase } from "./lib/supabaseClient";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function HomePage() {
  const [mealTiming, setMealTiming] = useState<"lunch" | "dinner" | "combo">("lunch");
  const { cart, addToCart } = useCart();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  
  // State for user subscription status check
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    // Check if user has active sub on load
    const checkSub = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.credits > 0) setHasActiveSub(true);
    };
    checkSub();
  }, []);

  // PLANS DATA
  const plans = [
    {
      id: "green-plan",
      name: "The Green Bowl",
      subtitle: "Pure Vegetarian Homestyle",
      description: "Nutritious, guilt-free meals for the strict vegetarian.",
      price: { lunch: 2400, dinner: 2400, combo: 4500 },
      type: "Veg",
      color: "green",
      icon: Leaf,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=500&auto=format&fit=crop",
      features: ["Common Base: Dal + Dry Sabzi", "Hero: Paneer / Kofta / Seasonal Veg", "Monday: Matar Paneer", "Friday: Paneer Butter Masala"]
    },
    {
      id: "smart-mix",
      name: "The Smart Mix",
      subtitle: "Best of Both Worlds",
      description: "3 Days Veg + 3 Days Non-Veg. The perfect balance.",
      price: { lunch: 2750, dinner: 2750, combo: 5000 },
      type: "Mix",
      color: "orange",
      icon: Star,
      isPopular: true,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop",
      features: ["Mon/Wed/Fri: Non-Veg Hero", "Tue/Thu/Sat: Veg Hero", "Variety without boredom", "Budget-friendly protein"]
    },
    {
      id: "red-plan",
      name: "The Red Bowl",
      subtitle: "Daily Protein Power",
      description: "Egg or Chicken in every single meal. For the gains.",
      price: { lunch: 3100, dinner: 3100, combo: 5800 },
      type: "Non-Veg",
      color: "red",
      icon: Beef, 
      image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop",
      features: ["Daily: Egg Curry or Chicken", "Wednesday: Chicken Do Pyaza", "Friday: Butter Chicken / Bharta", "High protein portion (100g)"]
    }
  ];

  // TRIAL PLAN DATA
  const trialPlan = {
    id: "trial-pack",
    name: "3-Day Taster Pass",
    price: 299,
    description: "Experience the quality before you commit.",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=500&auto=format&fit=crop",
    menu: [
      { day: "Day 1", item: "Butter Chicken / Paneer Butter Masala", desc: "Rich, premium taste." },
      { day: "Day 2", item: "Dal Tadka + Jeera Aloo", desc: "Homestyle comfort." },
      { day: "Day 3", item: "Egg Curry / Soyabean Aloo", desc: "Value packed protein." }
    ]
  };

  const addOns = [
    { id: "chaas", name: "Masala Chaas", price: 30, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=300&auto=format&fit=crop", icon: Coffee },
    { id: "chicken-extra", name: "Extra Chicken (100g)", price: 80, image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=300&auto=format&fit=crop", icon: Beef },
    { id: "gulab-jamun", name: "Gulab Jamun (2 pcs)", price: 50, image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=300&auto=format&fit=crop", icon: IceCream },
    { id: "lassi", name: "Sweet Lassi", price: 60, image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=300&auto=format&fit=crop", icon: Coffee },
  ];

  const menuSample = [
    { day: "Mon", dish: "Dal Tadka + Jeera Aloo", special: "Matar Paneer / Egg Curry" },
    { day: "Tue", dish: "Masoor Dal + Lauki", special: "Soyabean / Chicken Stew" },
    { day: "Wed", dish: "Dal Makhani (Creamy)", special: "Dhokar Dalna / Chicken Do Pyaza" },
    { day: "Thu", dish: "Chana Masala (Dry)", special: "Kadhai Paneer / Chicken Kosha" },
    { day: "Fri", dish: "Dal Fry (Spicy)", special: "Malai Kofta / Butter Chicken" },
    { day: "Sat", dish: "Khichdi / Veg Pulao", special: "Begun Bhaja / Omelette Curry" },
  ];

  const handleAddPlan = (plan: any) => {
    const selectedPrice = plan.price[mealTiming];
    const timingLabel = mealTiming === 'combo' ? 'Lunch + Dinner' : mealTiming.charAt(0).toUpperCase() + mealTiming.slice(1);
    
    addToCart({
      id: `${plan.id}-${mealTiming}`, 
      name: plan.name,
      price: selectedPrice,
      image: plan.image,
      type: "Subscription", 
      description: `${plan.subtitle} (${timingLabel})`,
      timing: mealTiming,
      quantity: 1
    });
  };

  const handleConfirmTrial = () => {
    addToCart({
      id: "trial-pack",
      name: "3-Day Taster Pass",
      price: 299,
      image: trialPlan.image,
      type: "Trial",
      description: "3 Days of Lunch or Dinner",
      quantity: 1
    });
    setIsTrialModalOpen(false);
  };

  const handleAddAddon = (item: any) => {
    // RESTRICTION LOGIC:
    // 1. Check if user already has a subscription active (simulated by state)
    // 2. Check if a subscription plan is CURRENTLY in the cart
    const hasPlanInCart = cart.some(c => c.type === "Subscription" || c.type === "Trial");
    
    if (!hasActiveSub && !hasPlanInCart) {
        alert("You need a Meal Plan to order Add-ons! Please add a Subscription or Trial Plan first.");
        return;
    }

    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      type: "Add-on",
      description: "Single serve add-on",
      quantity: 1
    });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-50/50 skew-x-12 -z-10" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-bold shadow-sm">
              <Zap size={18} className="text-orange-600" /> #1 Rated Daily Meal Service
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1]">
              Stack. Eat. <br />
              <span className="text-orange-600">Repeat.</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
              We don't just deliver food; we deliver your fuel. Fresh, homestyle meals batched for zero-error delivery to your office or home.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a href="#plans" className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg shadow-gray-300 flex items-center gap-2 group">
                View Plans <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </a>
              <button onClick={() => setIsTrialModalOpen(true)} className="bg-white text-orange-600 border-2 border-orange-100 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all flex items-center gap-2">
                 Try for ₹299
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-orange-100 to-white relative z-0 overflow-hidden shadow-2xl shadow-orange-100 border-4 border-white">
               <img 
                 src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" 
                 alt="Healthy Bowl" 
                 className="w-full h-full object-cover mix-blend-multiply opacity-95 scale-105 hover:scale-110 transition-transform duration-700"
               />
            </div>
            
            <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
               className="absolute -bottom-10 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex gap-4 items-center"
            >
               <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                  <Wallet size={24} />
               </div>
               <div>
                 <p className="font-bold text-gray-900">Free Delivery</p>
                 <p className="text-xs text-gray-500">Everywhere We Service</p>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- AUDIENCE SECTION --- */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Built For Your Routine</h2>
            <p className="text-gray-600 text-lg">Whether you're coding in a cubicle or studying for finals, we solve the "What should I eat?" problem.</p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Briefcase,
                title: "The Corporate Pro",
                desc: "Focus on your meetings, not menus. Timely desk delivery at major tech parks and office hubs.",
                tags: ["On-Time", "Non-Oily", "Healthy"]
              },
              {
                icon: GraduationCap,
                title: "The Student / Aspirant",
                desc: "Brain fuel for long study hours. Affordable, nutritious, and tastes just like home cooking.",
                tags: ["Budget Friendly", "High Energy", "Hygienic"]
              },
              {
                icon: Home,
                title: "The New Resident",
                desc: "Just moved to the city? Skip the kitchen setup and maid hassles. Enjoy consistent daily meals.",
                tags: ["Convenient", "Flexible", "Reliable"]
              }
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-xl hover:shadow-gray-200 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- MENU ROTATION PREVIEW --- */}
      <section className="py-24 bg-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
               <div>
                 <h2 className="text-3xl font-extrabold text-gray-900">The "Twin-Engine" Menu</h2>
                 <p className="text-gray-600 mt-2">Variety guaranteed. Rice for Lunch, Rotis for Dinner.</p>
               </div>
               <Link href="#plans" className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  See Full Menu <ArrowRight size={18}/>
               </Link>
            </div>

            <div className="relative">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuSample.map((m, i) => (
                    <div key={i} className="group border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:bg-orange-50/30 transition-colors">
                       <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{m.day}</span>
                          <Utensils size={16} className="text-orange-300 group-hover:text-orange-500" />
                       </div>
                       <h4 className="font-bold text-gray-900 text-lg mb-1">{m.dish}</h4>
                       <p className="text-sm text-gray-500">Special: <span className="text-orange-600 font-medium">{m.special}</span></p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* --- PRICING PLANS SECTION --- */}
      <section id="plans" className="py-24 bg-black text-white rounded-t-[3rem] relative -mt-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-2">Transparent Pricing</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Choose Your Fuel</h2>
            
            {/* TIMING TOGGLE */}
            <div className="bg-gray-800/50 p-1.5 rounded-2xl inline-flex backdrop-blur-sm border border-gray-700">
              {['lunch', 'dinner', 'combo'].map((t) => (
                <button
                  key={t}
                  onClick={() => setMealTiming(t as any)}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    mealTiming === t 
                    ? "bg-white text-black shadow-lg scale-105" 
                    : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t === 'combo' ? 'Lunch + Dinner' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              {mealTiming === 'lunch' && "Includes: Rice + Dal + Sabzi + Hero Dish"}
              {mealTiming === 'dinner' && "Includes: 4 Rotis + Salad + Side + Hero Dish"}
              {mealTiming === 'combo' && "The Complete Package. Complete nutrition for the day."}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
            
            {/* 1. TRIAL CARD (Shows detail on click) */}
            <motion.div 
               layout
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               className="relative bg-gradient-to-br from-yellow-100 to-orange-100 rounded-[2.5rem] p-8 border-4 border-white shadow-2xl flex flex-col justify-between"
            >
               <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Try Me</div>
               <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{trialPlan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{trialPlan.description}</p>
                  <p className="text-4xl font-extrabold text-gray-900 mb-6">₹{trialPlan.price}</p>
                  <ul className="space-y-2 mb-8">
                     {trialPlan.menu.map((m, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <CheckCircle size={14} className="text-orange-600"/> {m.day}: {m.item.split('/')[0]}
                        </li>
                     ))}
                  </ul>
               </div>
               <button onClick={() => setIsTrialModalOpen(true)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">Get Taster Pass</button>
            </motion.div>

            {/* 2. MAIN PLANS */}
            {plans.map((plan) => (
              <motion.div 
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className={`relative bg-gray-900 rounded-[2.5rem] p-8 border ${
                  plan.isPopular ? 'border-orange-500 shadow-2xl shadow-orange-900/20' : 'border-gray-800'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                   <div className={`p-3 rounded-2xl ${plan.color === 'green' ? 'bg-green-900/30 text-green-400' : plan.color === 'red' ? 'bg-red-900/30 text-red-400' : 'bg-orange-900/30 text-orange-400'}`}>
                      <plan.icon size={24} />
                   </div>
                   <div className="text-right">
                      <p className="text-3xl font-extrabold text-white">₹{plan.price[mealTiming]}</p>
                      <p className="text-xs text-gray-500 font-medium">/ 22 Days</p>
                   </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-orange-500 text-xs font-bold uppercase tracking-wide mb-3">{plan.subtitle}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-10 bg-gray-800/30 p-5 rounded-2xl border border-gray-800">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-gray-300 font-medium text-sm">
                      <CheckCircle size={16} className={`mt-0.5 shrink-0 ${plan.color === 'green' ? 'text-green-500' : plan.color === 'red' ? 'text-red-500' : 'text-orange-500'}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleAddPlan(plan)}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    plan.isPopular 
                    ? 'bg-orange-600 text-white hover:bg-orange-500' 
                    : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  Subscribe Now
                </button>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- ADD-ONS SECTION --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Make it a Meal</h3>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Add-ons</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {addOns.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-lg transition-all group">
                        <div className="h-32 rounded-2xl bg-gray-100 mb-4 overflow-hidden relative">
                           <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           <button onClick={() => handleAddAddon(item)} className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-orange-600 hover:text-white transition-colors text-orange-600">
                              <PlusCircle size={20} />
                           </button>
                        </div>
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (SIMPLE) --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900">Zero Hassle. Full Control.</h2>
           </div>
           
           <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Calendar, title: "1. Pick Plan", desc: "Choose Veg, Non-Veg, or Mix." },
              { icon: Wallet, title: "2. Top Up", desc: "Add money to your smart wallet." },
              { icon: Clock, title: "3. Auto-Pilot", desc: "Meals arrive daily at 1 PM / 8 PM." },
              { icon: ChefHat, title: "4. Pause Anytime", desc: "Traveling? Pause dates in one click." }
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-6 border border-gray-100 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm">
                  <step.icon size={28} />
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FIX: CENTERED MODAL --- */}
      <AnimatePresence>
        {isTrialModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* BACKDROP */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsTrialModalOpen(false)} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                />
                
                {/* MODAL CONTENT */}
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.95, opacity: 0 }} 
                    className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl overflow-hidden z-10"
                >
                    <button onClick={() => setIsTrialModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                    <div className="text-center mb-6">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 inline-block">Exclusive Offer</span>
                        <h3 className="text-2xl font-bold text-gray-900">3-Day Taster Pass</h3>
                        <p className="text-gray-500 text-sm">Taste it to believe it.</p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                        {trialPlan.menu.map((m, i) => (
                            <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-orange-600 shadow-sm shrink-0">{i+1}</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{m.item}</h4>
                                    <p className="text-xs text-gray-500">{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-2xl">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                            <p className="text-xl font-bold">₹299</p>
                        </div>
                        <button onClick={handleConfirmTrial} className="bg-orange-600 hover:bg-orange-500 px-6 py-2 rounded-xl font-bold transition-colors">
                            Add to Cart
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}