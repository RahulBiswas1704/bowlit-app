"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ArrowRight, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`, // Returns to home page
      },
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
    // Note: No setLoading(false) on success because the page will redirect
  };

  // 2. Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    // Assuming India (+91). Change if you support other countries.
    const formattedPhone = `+91${phone}`; 

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setStep("OTP");
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // FORMATTING CHECK
    const formattedPhone = `+91${phone}`; 

    // DEBUGGING: Check your browser console to see these values!
    console.log("Sending to Supabase:", { phone: formattedPhone, token: otp });

    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    setLoading(false);

    if (error) {
      console.error("Supabase Error:", error); // See the real error message
      alert(`Error: ${error.message}`); 
    } else {
      onClose();
      window.location.reload(); 
    }
  };

  const resetModal = () => {
    setStep("PHONE");
    setPhone("");
    setOtp("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* MODAL BOX */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden z-10"
          >
            <button 
              onClick={resetModal}
              className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors z-20"
            >
              <X size={20} className="text-gray-400" />
            </button>

            <div className="p-8 text-center">
              
              {/* HEADER ICON */}
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-orange-50/50">
                {step === "PHONE" ? (
                    <Phone className="text-orange-600" size={28} />
                ) : (
                    <MessageSquare className="text-orange-600" size={28} />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {step === "PHONE" ? "Get Started" : "Verify OTP"}
              </h2>
              <p className="text-gray-500 text-sm mb-8 px-2">
                {step === "PHONE" 
                  ? "Login or Signup to manage your meal plans." 
                  : `Enter the 6-digit code sent to +91 ${phone}`}
              </p>

              {/* STEP 1: PHONE INPUT & GOOGLE */}
              {step === "PHONE" && (
                <div className="space-y-4">
                    {/* GOOGLE LOGIN BUTTON */}
                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                       <GoogleIcon />
                       Continue with Google
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or use Phone</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="bg-gray-50 border-2 border-transparent focus-within:border-orange-500 focus-within:bg-white rounded-2xl px-4 py-3 transition-all flex items-center gap-3">
                            <span className="font-bold text-gray-500 border-r border-gray-300 pr-3">+91</span>
                            <input 
                                type="tel" 
                                placeholder="98765 43210"
                                className="w-full bg-transparent outline-none text-lg font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                                value={phone}
                                onChange={(e) => {
                                    // Only allow numbers
                                    const val = e.target.value.replace(/\D/g, '');
                                    if(val.length <= 10) setPhone(val);
                                }}
                                required
                            />
                        </div>

                        <button 
                            disabled={loading || phone.length < 10}
                            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Get OTP <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>
              )}

              {/* STEP 2: OTP INPUT */}
              {step === "OTP" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {/* Simple OTP Input Styling */}
                        <input 
                            type="text" 
                            maxLength={6}
                            placeholder="• • • • • •"
                            className="w-full text-center bg-gray-50 border-2 border-orange-100 focus:border-orange-500 focus:bg-white rounded-2xl py-4 text-2xl font-bold tracking-[0.5em] text-gray-900 outline-none transition-all placeholder:tracking-widest"
                            autoFocus
                            value={otp}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if(val.length <= 6) setOtp(val);
                            }}
                        />
                    </div>

                    <button 
                        disabled={loading || otp.length < 6}
                        className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Verify & Login <CheckCircle size={20} /></>}
                    </button>

                    <button 
                        type="button"
                        onClick={() => setStep("PHONE")}
                        className="text-sm font-bold text-gray-400 hover:text-gray-600"
                    >
                        Change Phone Number
                    </button>
                </form>
              )}

            </div>
            
            {/* Footer / Terms */}
            <div className="bg-gray-50 p-4 text-center">
                <p className="text-[10px] text-gray-400">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}