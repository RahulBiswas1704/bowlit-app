"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void; // Optional: depending on if you want to force this
}

export default function CompleteProfileModal({ isOpen, onClose }: CompleteProfileModalProps) {
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Send OTP to Link Phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return alert("Enter valid 10-digit number");

    setLoading(true);
    const formattedPhone = `+91${phone}`; 

    // USE updateUser to link phone to CURRENT Google session
    const { error } = await supabase.auth.updateUser({
      phone: formattedPhone,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setStep("OTP");
    }
  };

  // 2. Verify and Finish
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formattedPhone = `+91${phone}`;

    // Verify the 'phone_change' token
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'phone_change',
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      // Success! Phone is linked.
      onClose();
      window.location.reload(); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="bg-orange-50 p-6 text-center border-b border-orange-100">
               <h2 className="text-xl font-bold text-orange-900">One Last Step!</h2>
               <p className="text-orange-700/80 text-xs mt-1">Please link your phone number to continue.</p>
            </div>

            <div className="p-8">
              {step === "PHONE" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="bg-gray-50 border-2 border-transparent focus-within:border-orange-500 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <span className="font-bold text-gray-400 border-r border-gray-300 pr-3">+91</span>
                        <input 
                            type="tel" 
                            placeholder="98765 43210"
                            className="w-full bg-transparent outline-none font-bold text-gray-900"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            autoFocus
                        />
                    </div>
                    <button disabled={loading || phone.length < 10} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin"/> : <>Send OTP <ArrowRight size={18}/></>}
                    </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-4">
                        <p className="text-xs text-gray-500">OTP sent to +91 {phone}</p>
                    </div>
                    <input 
                        type="text" 
                        placeholder="• • • • • •"
                        className="w-full text-center bg-gray-50 border-2 border-orange-100 focus:border-orange-500 rounded-2xl py-4 text-2xl font-bold tracking-widest outline-none"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                    />
                    <button disabled={loading || otp.length < 6} className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin"/> : <>Verify & Finish <CheckCircle size={18}/></>}
                    </button>
                    <button type="button" onClick={() => setStep("PHONE")} className="w-full text-xs font-bold text-gray-400 mt-2">Change Number</button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}