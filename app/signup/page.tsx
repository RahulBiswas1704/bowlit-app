"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, MapPin, ArrowRight, Leaf, Beef, Utensils, Lock, Loader2, RefreshCw } from "lucide-react";
import { 
  initializeApp, 
  getApps, 
  getApp 
} from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";

/**
 * CONFIGURATION & MOCKS
 * In your local production environment, replace these mocks with your actual imports:
 * import { supabase } from "../lib/supabaseClient";
 */

// --- Firebase Configuration ---
// Replace with your actual keys from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBze4S5JI5wIayDFOM5PTmdAEdW5mnPbbE",
  authDomain: "bowlit-app-f8b5f.firebaseapp.com",
  projectId: "bowlit-app-f8b5f",
  storageBucket: "bowlit-app-f8b5f.firebasestorage.app",
  messagingSenderId: "576952120280",
  appId: "1:576952120280:web:66903c58882111844a38ad",
  measurementId: "G-6XLQK88835"
};

// Initialize Firebase safely for Next.js Client Component
const app = typeof window !== "undefined" 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

const firebaseAuth = app ? getAuth(app) : null;

// --- Supabase Mock (Resolves the import error for preview) ---
const supabase = {
  from: (table: string) => ({
    upsert: async (data: any) => {
      console.log(`[Preview Mode] Syncing to Supabase table: ${table}`, data);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return { error: null };
    }
  })
};

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [diet, setDiet] = useState(""); 
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [formData, setFormData] = useState({ fullName: "", phone: "", office: "" });
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (firebaseAuth) {
      firebaseAuth.useDeviceLanguage();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const initRecaptcha = () => {
    if (!firebaseAuth) return;
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => { console.log("reCAPTCHA solved"); }
        });
      }
    } catch (err) {
      console.error("Recaptcha Init Error:", err);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firebaseAuth) return alert("Firebase not initialized. Check your API keys.");
    if (!diet && step === 1) return alert("Please select a diet preference!");
    if (formData.phone.length < 10) return alert("Enter a valid 10-digit number");
    
    setIsLoading(true);
    setOtp("");

    try {
      initRecaptcha();
      const verifier = recaptchaVerifierRef.current;
      if (!verifier) throw new Error("Recaptcha not initialized");

      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      
      const result = await signInWithPhoneNumber(firebaseAuth, formattedPhone, verifier);
      setConfirmationResult(result);
      setStep(2);
    } catch (error: any) {
      console.error("SMS Error:", error.code);
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      
      if (error.code === 'auth/unauthorized-domain') {
        alert("Domain Not Authorized: Add this domain to 'Authorized Domains' in Firebase Console.");
      } else if (error.code === 'auth/too-many-requests') {
        alert("Too many requests. Please try again later.");
      } else {
        alert("Error: " + (error.message || "Failed to send code"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.uid,
          full_name: formData.fullName,
          phone: user.phoneNumber,
          office: formData.office,
          diet: diet,
          updated_at: new Date(),
        });

      if (dbError) throw dbError;

      alert("Welcome to BowlIt! Account verified.");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Verify Error:", error.code);
      if (error.code === 'auth/code-expired' || error.code === 'auth/invalid-verification-code') {
        alert("The code is invalid or has expired. Please try again.");
      } else {
        alert("Verification failed: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div id="recaptcha-container"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-10">
        <a href="/" className="inline-block hover:scale-105 transition-transform">
          <img src="/logo.svg" alt="BowlIt Logo" className="h-16 w-auto mx-auto object-contain" onError={(e) => e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3014/3014520.png"} />
        </a>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-orange-50 sm:rounded-3xl sm:px-10 border border-gray-100">
          
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                    <input name="fullName" type="text" required placeholder="Your Name" className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-800" onChange={handleChange} value={formData.fullName} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
                    <input name="phone" type="tel" required placeholder="98765 43210" className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-800" onChange={handleChange} value={formData.phone} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Office Building</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-400" /></div>
                    <select name="office" required className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white transition-all outline-none text-gray-800" onChange={handleChange} value={formData.office}>
                      <option value="">Select your hub...</option>
                      <option value="DLF 1">DLF 1 (Newtown)</option>
                      <option value="Ecospace">Ecospace Business Park</option>
                      <option value="Candor">Candor TechSpace</option>
                      <option value="TMC">Tata Medical Center</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Dietary Preference</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Veg', icon: Leaf },
                      { id: 'Non-Veg', icon: Beef },
                      { id: 'Flexi', icon: Utensils }
                    ].map((d) => (
                      <label key={d.id} className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${diet === d.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                        <input type="radio" name="diet" className="sr-only" onChange={() => setDiet(d.id)} checked={diet === d.id} />
                        <d.icon size={20} className={diet === d.id ? 'text-orange-600' : 'text-gray-400'} />
                        <span className={`font-bold text-[10px] ${diet === d.id ? 'text-orange-700' : 'text-gray-500'}`}>{d.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-70">
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Send Verification Code <ArrowRight size={20} /></>}
                </button>
              </motion.form>
            ) : (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6" onSubmit={handleVerifyOtp}>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 text-gray-800">Verify Code</h3>
                  <p className="text-sm text-gray-500 mt-1">Sent to {formData.phone}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                  <input 
                    type="text" required maxLength={6} placeholder="••••••" 
                    className="block w-full py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-center text-3xl font-bold outline-none tracking-[0.5em] transition-all text-gray-800" 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} value={otp}
                  />
                </div>
                <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95">
                  {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Complete Signup"}
                </button>
                
                <div className="flex flex-col gap-3 items-center">
                  <button type="button" onClick={() => handleSendOtp()} className="text-sm font-bold text-orange-600 flex items-center gap-1 hover:underline">
                    <RefreshCw size={14} /> Resend New Code
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Back to Details
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {step === 1 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              Already have an account? <a href="/" className="font-bold text-orange-600 hover:underline">Log in</a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
