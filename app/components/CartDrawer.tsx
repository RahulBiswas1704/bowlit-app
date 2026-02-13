"use client";
import { useState, useEffect } from "react";
import { X, ShoppingBag, ArrowRight, Loader2, MapPin, AlertCircle, Plus, Minus, LocateFixed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";
import LocationPicker from "./LocationPicker"; // <--- Import the new component

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState(""); 
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // NEW: State for Map Modal
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          if (user.user_metadata) {
            setCustomer({
              name: user.user_metadata.full_name || "",
              phone: user.user_metadata.phone || "",
            });
            let addresses = user.user_metadata.addresses || [];
            if (addresses.length === 0 && user.user_metadata.office) addresses = [user.user_metadata.office];
            setSavedAddresses(addresses);
            if (addresses.length > 0) setSelectedAddress(addresses[0]);
            else setIsAddingNew(true);
          }
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          setBalance(wallet?.balance || 0);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleQuickTopUp = async () => {
    if (!userId || !topUpAmount) return;
    const amount = parseInt(topUpAmount);
    setLoading(true);
    const { error } = await supabase.from('wallets').upsert({ 
        user_id: userId, 
        balance: balance + amount 
    }, { onConflict: 'user_id' });

    if (!error) {
        alert("Top up successful!");
        setBalance(prev => prev + amount); 
        setTopUpAmount("");
    } else {
        alert("Top up failed: " + error.message);
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    const finalAddress = isAddingNew ? newAddress : selectedAddress;
    if (!customer.name || !customer.phone || !finalAddress) return alert("Please fill all details!");

    if (balance < cartTotal) return alert(`Insufficient Balance! You need ₹${cartTotal - balance} more.`);

    setLoading(true);

    const { error: paymentError } = await supabase.rpc('pay_order', { amount_to_pay: cartTotal });
    if (paymentError) {
        alert("Payment Failed: " + paymentError.message);
        setLoading(false);
        return; 
    }

    const subscriptionItem = cart.find(item => item.type === "Subscription" || item.name.includes("Plan") || item.name.includes("Bowl") || item.type === "Trial");
    
    if (subscriptionItem) {
        let creditsToAdd = 22;
        if (subscriptionItem.type === "Trial") creditsToAdd = 3;
        else if (subscriptionItem.timing === 'combo' || subscriptionItem.name.includes("Lunch + Dinner")) creditsToAdd = 44;
        
        const { data: { user } } = await supabase.auth.getUser();
        const currentCredits = user?.user_metadata.credits || 0;

        await supabase.auth.updateUser({
            data: {
                active_plan: subscriptionItem.name,
                credits: currentCredits + creditsToAdd,
                plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
        });
        alert(`Plan Activated! Added ${creditsToAdd} credits.`);
    }

    const { error: orderError } = await supabase
      .from('orders')
      .insert([{ 
          customer_name: customer.name,
          customer_phone: customer.phone,
          address: finalAddress,
          items: cart, 
          total_amount: cartTotal,
          user_id: userId,
          status: 'Pending'
      }]);

    if (!orderError) {
       if (isAddingNew && userId) {
          const updatedAddresses = [...savedAddresses, finalAddress];
          const uniqueAddresses = Array.from(new Set(updatedAddresses));
          await supabase.auth.updateUser({ data: { addresses: uniqueAddresses } });
       }
       if (!subscriptionItem) alert("Order Placed Successfully!"); 
       clearCart();
       setIsCheckingOut(false);
       onClose();
       window.location.reload(); 
    } else {
       alert("Order creation failed: " + orderError.message);
    }
    setLoading(false);
  };

  const cartLength = cart?.length || 0;
  const deficit = Math.max(0, cartTotal - balance); 

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-orange-600" /> Your Cart
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartLength === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p>Your bowl is empty.</p>
                  <button onClick={onClose} className="text-orange-600 font-bold hover:underline">Start Ordering</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0">
                          {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name}/>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                              {(item.type === "Subscription" || item.type === "Trial") && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Plan</span>}
                          </div>
                        </div>
                        <p className="text-orange-600 font-mono text-sm font-bold mt-1">₹{item.price}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 text-gray-700"><Minus size={12}/></button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800"><Plus size={12}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartLength > 0 && (
              <div className="p-6 border-t bg-gray-50 space-y-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total Bill</span>
                  <span>₹{cartTotal}</span>
                </div>

                {isCheckingOut && deficit > 0 && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 font-bold mb-2"><AlertCircle size={18} /> Low Balance</div>
                        <p className="text-sm text-gray-600 mb-3">You have <strong>₹{balance}</strong>. You need <strong>₹{deficit}</strong> more.</p>
                        <div className="flex gap-2">
                            <input type="number" className="w-full p-2 border rounded-lg" placeholder={`Enter ₹${deficit}+`} value={topUpAmount} onFocus={() => !topUpAmount && setTopUpAmount(deficit.toString())} onChange={(e) => setTopUpAmount(e.target.value)} />
                            <button onClick={handleQuickTopUp} disabled={loading || !topUpAmount || parseInt(topUpAmount) < deficit} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap disabled:opacity-50">{loading ? "..." : "Add & Pay"}</button>
                        </div>
                    </div>
                )}

                {isCheckingOut ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Name" className="w-full p-3 border rounded-xl font-bold text-gray-800 text-sm" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                        <input type="tel" placeholder="Phone" className="w-full p-3 border rounded-xl font-bold text-gray-800 text-sm" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                    </div>
                    
                    <div className="relative">
                        <MapPin className="absolute top-3.5 left-3 text-gray-400" size={18} />
                        {!isAddingNew && savedAddresses.length > 0 ? (
                            <select className="w-full p-3 pl-10 border rounded-xl font-bold text-gray-800 bg-white" value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                                {savedAddresses.map((addr, idx) => <option key={idx} value={addr}>{addr}</option>)}
                            </select>
                        ) : (
                            // UPDATED: Input + Map Button
                            <div className="flex gap-2">
                                <input type="text" placeholder="Enter address..." className="w-full p-3 pl-10 border rounded-xl font-bold text-gray-800" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
                                <button onClick={() => setShowMap(true)} className="bg-orange-100 text-orange-600 p-3 rounded-xl hover:bg-orange-200 transition-colors" title="Pick on Map">
                                    <LocateFixed size={20} />
                                </button>
                            </div>
                        )}
                        {savedAddresses.length > 0 && <button onClick={() => setIsAddingNew(!isAddingNew)} className="absolute right-3 top-3.5 text-xs text-orange-600 font-bold">{isAddingNew ? "Select Saved" : "+ Add New"}</button>}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                       <button onClick={() => setIsCheckingOut(false)} className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                       <button onClick={handlePayment} disabled={loading || deficit > 0} className="w-2/3 bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:bg-gray-400">
                            {loading ? <Loader2 className="animate-spin" /> : `Pay ₹${cartTotal}`}
                       </button>
                    </div>
                  </motion.div>
                ) : (
                  <button onClick={() => setIsCheckingOut(true)} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 transition">
                    Checkout <ArrowRight size={20} />
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* RENDER THE LOCATION PICKER MODAL */}
          {showMap && (
             <LocationPicker 
                onConfirm={(address) => {
                    setNewAddress(address);
                    setShowMap(false);
                }}
                onClose={() => setShowMap(false)}
             />
          )}
        </>
      )}
    </AnimatePresence>
  );
}