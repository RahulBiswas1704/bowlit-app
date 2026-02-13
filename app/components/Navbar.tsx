"use client";
import { useState, useEffect } from "react";
import { User, ShoppingBag, LogOut, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import LoginModal from "./LoginModal";
import CartDrawer from "./CartDrawer";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  
  const { cart } = useCart(); 

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    };

    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
      else setBalance(0);
    });

    return () => subscription.unsubscribe();
  }, [isCartOpen]); 

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (data) setBalance(data.balance);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBalance(0);
    window.location.reload(); 
  };
// OLD:
// const displayName = user?.user_metadata?.full_name?.split(' ')[0] || "Foodie";

// NEW: Show first name, OR email, OR "Guest"
const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Guest";

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-6 py-3 flex justify-between items-center"
      >
        <div className="flex items-center">
          <Link href="/" className="relative w-32 h-12 block"> 
             <img 
               src="/logo.svg" 
               alt="BowlIt Logo" 
               className="w-full h-full object-contain object-left"
               onError={(e) => { 
                 e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3014/3014520.png" 
               }}
             />
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-orange-50 rounded-full hover:bg-orange-100 transition-colors group">
            <ShoppingBag size={20} className="text-orange-600" />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">{cart.length}</span>}
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 pr-4 border border-gray-200">
               <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs">{displayName[0]}</div>
               
               {/* LINK TO PROFILE PAGE */}
               <Link href="/profile" className="hidden sm:flex flex-col items-start leading-tight cursor-pointer hover:opacity-70 transition-opacity">
                   <span className="text-xs font-bold text-gray-700">Hi, {displayName}</span>
                   <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                      <Wallet size={10} fill="currentColor" /> ₹{balance}
                   </span>
               </Link>

               <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setIsLoginOpen(true)} className="hidden sm:flex bg-black text-white hover:bg-gray-800 px-5 py-2.5 rounded-full transition-all items-center gap-2 shadow-lg shadow-gray-200">
              <User size={18} /> <span className="text-sm font-bold">Login</span>
            </button>
          )}
        </div>
      </motion.nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}