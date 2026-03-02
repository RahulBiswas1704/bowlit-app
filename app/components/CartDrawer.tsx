"use client";
import { useState, useEffect } from "react";
import { X, ShoppingBag, ArrowRight, Loader2, MapPin, AlertCircle, Plus, Minus, LocateFixed, CheckCircle2, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";
import { SavedAddress } from "../types";
import Link from "next/link";

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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // REFERRAL SYSTEM STATE
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ id: string, amount: number } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

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
            let addresses: SavedAddress[] = user.user_metadata.saved_addresses || [];
            if (addresses.length === 0 && user.user_metadata.latitude) {
              // Migrate legacy
              addresses = [{
                id: "legacy",
                tag: "Home",
                latitude: user.user_metadata.latitude,
                longitude: user.user_metadata.longitude,
                building_name: user.user_metadata.building_name || "",
                office: user.user_metadata.office || "",
                delivery_instructions: user.user_metadata.delivery_instructions || "",
                is_default: true
              }];
            }
            setSavedAddresses(addresses);
            const defaultAddr = addresses.find(a => a.is_default);
            if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            else if (addresses.length > 0) setSelectedAddressId(addresses[0].id);
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

  const handleApplyPromo = async () => {
    if (!promoCode || !userId) return;
    setIsApplyingPromo(true);

    try {
      // 1. Cannot refer yourself
      if (promoCode === customer.phone) {
        throw new Error("You cannot use your own phone number.");
      }

      // 2. Fetch the referrer's user payload from Auth (must use Edge Function or rely on the fact that metadata is locked behind RLS. 
      // ACTUALLY: We don't have direct access to auth.users from the client.
      // WORKAROUND: We will build an Edge Function / API route `POST /api/referral/validate` to do backend-secure checks.
      const res = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode, receiverId: userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPromoApplied({ id: data.referrerId, amount: data.receiverReward });
      alert(`Promo Applied! ₹${data.receiverReward} off!`);

    } catch (e: any) {
      alert(e.message);
      setPromoCode("");
    }
    setIsApplyingPromo(false);
  };

  const handlePayment = async () => {
    const selectedObj = savedAddresses.find(a => a.id === selectedAddressId);
    if (!customer.name || !customer.phone || !selectedObj) return alert("Please select a delivery address and fill all details.");

    const finalAddress = `${selectedObj.tag} - ${selectedObj.building_name}, ${selectedObj.office} (Instructions: ${selectedObj.delivery_instructions || "None"})`;

    const finalPayable = Math.max(0, cartTotal - (promoApplied ? promoApplied.amount : 0));

    if (balance < finalPayable) return alert(`Insufficient Balance! You need ₹${finalPayable - balance} more.`);

    setLoading(true);

    const { error: paymentError } = await supabase.rpc('pay_order', { amount_to_pay: finalPayable });
    if (paymentError) {
      alert("Payment Failed: " + paymentError.message);
      setLoading(false);
      return;
    }

    // Process Referral Backend Execution (Credit the sender async)
    if (promoApplied) {
      await fetch('/api/referrals/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerId: promoApplied.id, receiverId: userId })
      });
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
  const finalPayable = Math.max(0, cartTotal - (promoApplied ? promoApplied.amount : 0));
  const deficit = Math.max(0, finalPayable - balance);

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
                        {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} />}
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
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 text-gray-700"><Minus size={12} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartLength > 0 && (
              <div className="p-6 border-t bg-gray-50 space-y-4">

                {/* PROMO CODE BOX */}
                {isCheckingOut && (
                  <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-2 shadow-sm">
                    <span className="text-gray-400 pl-2"><Ticket size={20} /></span>
                    <input
                      type="text"
                      placeholder="Promo Code (Phone #)"
                      className="w-full bg-transparent outline-none font-bold text-sm uppercase"
                      value={promoCode}
                      disabled={promoApplied !== null}
                      onChange={e => setPromoCode(e.target.value)}
                    />
                    {!promoApplied ? (
                      <button
                        disabled={!promoCode || isApplyingPromo}
                        onClick={handleApplyPromo}
                        className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </button>
                    ) : (
                      <div className="text-green-600 font-bold flex items-center gap-1 text-sm whitespace-nowrap"><CheckCircle2 size={16} /> Applied</div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total Bill</span>
                  <div className="text-right">
                    {promoApplied && <div className="text-xs text-green-500 font-bold line-through">₹{cartTotal}</div>}
                    <span>₹{finalPayable}</span>
                  </div>
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
                      <input type="text" placeholder="Name" className="w-full p-3 border rounded-xl font-bold text-gray-800 text-sm" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                      <input type="tel" placeholder="Phone" className="w-full p-3 border rounded-xl font-bold text-gray-800 text-sm" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Delivery Address</label>
                      {savedAddresses.length > 0 ? (
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`p-3 rounded-xl border-2 cursor-pointer transition-colors flex items-start gap-3 ${selectedAddressId === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                            >
                              <div className={`p-2 rounded-lg ${selectedAddressId === addr.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <MapPin size={16} />
                              </div>
                              <div>
                                <h4 className={`text-sm font-bold ${selectedAddressId === addr.id ? 'text-orange-900' : 'text-gray-900'}`}>{addr.tag}</h4>
                                <p className={`text-xs ${selectedAddressId === addr.id ? 'text-orange-700' : 'text-gray-500'}`}>{addr.building_name}, {addr.office}</p>
                              </div>
                            </div>
                          ))}
                          <Link href="/profile" onClick={onClose} className="block w-full p-3 rounded-xl border-2 border-dashed border-gray-200 text-center text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
                            + Manage Addresses
                          </Link>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center">
                          <MapPin className="mx-auto text-orange-400 mb-2" size={24} />
                          <p className="text-sm font-bold text-orange-800 mb-1">No Delivery Address</p>
                          <p className="text-xs text-orange-600 mb-3">Please set your delivery location to ensure we serve your area.</p>
                          <Link href="/profile" onClick={onClose} className="block w-full bg-orange-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition">
                            Set Delivery Address
                          </Link>
                        </div>
                      )}
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
          {/* Legacy LocationPicker removed. All address validation now occurs in Profile/AddressManager to enforce Geofences! */}
        </>
      )}
    </AnimatePresence>
  );
}