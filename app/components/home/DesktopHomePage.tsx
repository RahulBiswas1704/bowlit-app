"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, Clock, Calendar, Wallet, CheckCircle, ArrowRight, Utensils, 
  Zap, Leaf, Beef, Star, PlusCircle, Coffee, IceCream, X, Settings 
} from "lucide-react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function DesktopHomePage() {
  const [mealTiming, setMealTiming] = useState<"lunch" | "dinner" | "combo">("lunch");
  const [duration, setDuration] = useState<7 | 14 | 28>(28);
  const { addToCart, cart } = useCart();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // --- CONFIG ---
  const RATES = { veg: 110, mix: 125, nonVeg: 140 };
  const calculatePrice = (baseRate: number) => baseRate * duration * (mealTiming === 'combo' ? 2 : 1);

  // DATA
  const plans = [
    {
      id: "green-plan",
      name: "The Green Bowl",
      subtitle: "Pure Vegetarian Homestyle",
      description: "Nutritious, guilt-free meals for the strict vegetarian.",
      baseRate: RATES.veg,
      type: "Veg",
      color: "green",
      icon: Leaf,
      features: ["Common Base: Dal + Dry Sabzi", "Hero: Paneer / Kofta / Seasonal Veg", "Monday: Matar Paneer", "Friday: Paneer Butter Masala"]
    },
    {
      id: "smart-mix",
      name: "The Smart Mix",
      subtitle: "Best of Both Worlds",
      description: "3 Days Veg + 3 Days Non-Veg. The perfect balance.",
      baseRate: RATES.mix,
      type: "Mix",
      color: "orange",
      icon: Star,
      isPopular: true,
      features: ["Mon/Wed/Fri: Non-Veg Hero", "Tue/Thu/Sat: Veg Hero", "Variety without boredom", "Budget-friendly protein"]
    },
    {
      id: "red-plan",
      name: "The Red Bowl",
      subtitle: "Daily Protein Power",
      description: "Egg or Chicken in every single meal. For the gains.",
      baseRate: RATES.nonVeg,
      type: "Non-Veg",
      color: "red",
      icon: Beef, 
      features: ["Daily: Egg Curry or Chicken", "Wednesday: Chicken Do Pyaza", "Friday: Butter Chicken / Bharta", "High protein portion (100g)"]
    }
  ];

  const personas = [
    { title: "The Corporate Pro", description: "Fuel your hustle with zero hassle. Healthy, chef-curated meals delivered right to your office.", tag: "Focus on work", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800" },
    { title: "The Student / Aspirant", description: "Late-night study sessions need proper fuel. Affordable, nutritious, and comforting meals.", tag: "Budget-friendly", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800" },
    { title: "The New Resident", description: "Just moved to the city? Skip the kitchen setup. Enjoy homestyle meals that make you feel at home.", tag: "Settle in comfortably", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800" },
  ];

  const addOns = [
    { id: "chaas", name: "Masala Chaas", price: 30, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=300" },
    { id: "chicken-extra", name: "Extra Chicken (100g)", price: 80, image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=300" },
    { id: "gulab-jamun", name: "Gulab Jamun (2 pcs)", price: 50, image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=300" },
    { id: "lassi", name: "Sweet Lassi", price: 60, image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=300" },
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
    addToCart({
      id: `${plan.id}-${mealTiming}-${duration}`,
      name: plan.name,
      price: calculatePrice(plan.baseRate),
      image: "", // Add default if needed
      type: "Subscription",
      description: `${plan.subtitle} (${mealTiming} - ${duration} Days)`,
      timing: mealTiming,
      quantity: 1
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-50/50 skew-x-12 -z-10" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-bold shadow-sm">
              <Zap size={18} /> #1 Rated Daily Meal Service
            </div>
            <h1 className="text-7xl font-extrabold text-gray-900 leading-[1.1]">
              Stack. Eat. <br /> <span className="text-orange-600">Repeat.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
              We don't just deliver food; we deliver your fuel. Fresh, homestyle meals batched for zero-error delivery.
            </p>
            <div className="flex gap-4">
               <a href="#plans" className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center gap-2">
                 View Plans <ArrowRight size={20} />
               </a>
               <button onClick={() => setIsTrialModalOpen(true)} className="border-2 border-orange-100 text-orange-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all">
                 Try for ₹299
               </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="relative h-[600px]">
             <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover rounded-[3rem] shadow-2xl" />
          </motion.div>
        </div>
      </section>

      {/* 2. AUDIENCE SECTION */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
           <h2 className="text-5xl font-extrabold text-center mb-16">Designed for Your Lifestyle</h2>
           <div className="grid grid-cols-3 gap-8">
             {personas.map((p, i) => (
               <div key={i} className="group relative h-[450px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                 <img src={p.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                    <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold w-fit mb-3">{p.tag}</span>
                    <h3 className="text-3xl font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{p.description}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* 3. MENU PREVIEW */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
               <h2 className="text-4xl font-extrabold text-gray-900">The "Twin-Engine" Menu</h2>
               <Link href="#plans" className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">See Full Menu <ArrowRight size={18}/></Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
               {menuSample.map((m, i) => (
                 <div key={i} className="border border-gray-100 rounded-2xl p-6 hover:border-orange-200 hover:bg-orange-50/30 transition-colors">
                    <div className="flex justify-between mb-3"><span className="text-xs font-bold uppercase text-gray-400">{m.day}</span><Utensils size={16} className="text-orange-300"/></div>
                    <h4 className="font-bold text-lg mb-1">{m.dish}</h4>
                    <p className="text-sm text-gray-500">Special: <span className="text-orange-600 font-medium">{m.special}</span></p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 4. PRICING PLANS */}
      <section id="plans" className="py-24 bg-black text-white rounded-t-[4rem] -mt-10 relative z-10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-5xl font-extrabold mb-8">Choose Your Fuel</h2>
               <div className="flex justify-center gap-6 mb-8">
                  <div className="bg-gray-800 p-1.5 rounded-xl flex">
                    {['lunch', 'dinner', 'combo'].map(t => (
                      <button key={t} onClick={() => setMealTiming(t as any)} className={`px-8 py-3 rounded-lg font-bold capitalize transition-all ${mealTiming === t ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>{t}</button>
                    ))}
                  </div>
                  <div className="bg-gray-800 p-1.5 rounded-xl flex">
                    {[7, 14, 28].map(d => (
                      <button key={d} onClick={() => setDuration(d as any)} className={`px-8 py-3 rounded-lg font-bold transition-all ${duration === d ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>{d} Days</button>
                    ))}
                  </div>
               </div>
               <button onClick={() => setIsCustomModalOpen(true)} className="text-gray-400 hover:text-white flex items-center gap-2 mx-auto"><Settings size={16}/> Customize Duration</button>
            </div>

            <div className="grid grid-cols-3 gap-8">
               {plans.map(plan => (
                 <div key={plan.id} className={`bg-gray-900 rounded-[3rem] p-10 border transition-all hover:-translate-y-2 relative ${plan.isPopular ? 'border-orange-500 shadow-2xl shadow-orange-900/40' : 'border-gray-800'}`}>
                    {plan.isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600 px-4 py-1 rounded-full text-xs font-bold uppercase">Most Popular</div>}
                    <div className="flex justify-between items-start mb-8">
                       <div className={`p-4 rounded-2xl ${plan.color === 'green' ? 'bg-green-900/30 text-green-400' : plan.color === 'red' ? 'bg-red-900/30 text-red-400' : 'bg-orange-900/30 text-orange-400'}`}><plan.icon size={32}/></div>
                       <div className="text-right">
                         <p className="text-4xl font-extrabold">₹{calculatePrice(plan.baseRate)}</p>
                         <p className="text-gray-500 text-sm">/ {duration} Days</p>
                       </div>
                    </div>
                    <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-orange-500 text-xs font-bold uppercase mb-4">{plan.subtitle}</p>
                    <p className="text-gray-400 mb-8">{plan.description}</p>
                    <div className="space-y-3 mb-8">
                       {plan.features.map((f,i) => (
                          <div key={i} className="flex gap-3 text-sm text-gray-400"><CheckCircle size={16} className="text-gray-600 shrink-0"/> {f}</div>
                       ))}
                    </div>
                    <button onClick={() => handleAddPlan(plan)} className={`w-full py-4 rounded-xl font-bold text-lg ${plan.isPopular ? 'bg-orange-600 hover:bg-orange-500' : 'bg-white text-black hover:bg-gray-200'}`}>Subscribe Now</button>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 5. ADD-ONS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
           <h3 className="text-3xl font-bold mb-12">Make it a Meal <span className="text-orange-600 text-lg align-middle bg-orange-100 px-3 py-1 rounded-full ml-4">Add-ons</span></h3>
           <div className="grid grid-cols-4 gap-8">
              {addOns.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-xl transition-all group cursor-pointer" onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, type: "Add-on", quantity: 1, image: item.image, description: "Add-on" })}>
                    <div className="h-40 rounded-2xl bg-gray-100 mb-4 overflow-hidden relative">
                       <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       <div className="absolute bottom-2 right-2 bg-white p-2 rounded-full text-orange-600 shadow-md"><PlusCircle size={20}/></div>
                    </div>
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <p className="text-orange-600 font-bold">₹{item.price}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h2 className="text-4xl font-extrabold mb-16">Zero Hassle. Full Control.</h2>
           <div className="grid grid-cols-4 gap-12">
              {[
                 { icon: Calendar, t: "1. Pick Plan", d: "Choose Veg, Non-Veg, or Mix." },
                 { icon: Wallet, t: "2. Top Up", d: "Add money to your smart wallet." },
                 { icon: Clock, t: "3. Auto-Pilot", d: "Meals arrive daily at 1 PM / 8 PM." },
                 { icon: ChefHat, t: "4. Pause Anytime", d: "Traveling? Pause dates in one click." }
              ].map((s,i) => (
                 <div key={i} className="group">
                    <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-lg"><s.icon size={32}/></div>
                    <h4 className="text-xl font-bold mb-2">{s.t}</h4>
                    <p className="text-gray-500">{s.d}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        {isTrialModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative overflow-hidden">
                    <button onClick={() => setIsTrialModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                    <div className="text-center mb-6">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 inline-block">Exclusive Offer</span>
                        <h3 className="text-2xl font-bold text-gray-900">3-Day Taster Pass</h3>
                    </div>
                    <button onClick={() => { addToCart({ id: "trial-pack", name: "3-Day Taster Pass", price: 299, type: "Trial", quantity: 1, image: "", description: "Trial" }); setIsTrialModalOpen(false); }} className="w-full bg-black text-white py-4 rounded-xl font-bold">Add to Cart • ₹299</button>
                </motion.div>
            </div>
        )}
        {isCustomModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative">
                   <button onClick={() => setIsCustomModalOpen(false)} className="absolute top-4 right-4"><X size={24}/></button>
                   <Settings size={48} className="mx-auto text-orange-600 mb-4"/>
                   <h3 className="text-2xl font-bold mb-2">Build Your Own Plan</h3>
                   <p className="text-gray-600 mb-6">Need a specific number of days? Chat with us.</p>
                   <a href="https://wa.me/919876543210" target="_blank" className="block w-full bg-green-500 text-white py-3 rounded-xl font-bold">Chat on WhatsApp</a>
                </motion.div>
             </div>
        )}
      </AnimatePresence>
    </div>
  );
}