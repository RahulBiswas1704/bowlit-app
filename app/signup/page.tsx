"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Phone, MapPin, ArrowRight, Leaf, Beef, Utensils, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [diet, setDiet] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", phone: "", office: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diet) return alert("Please select a diet preference!");
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          office: formData.office,
          diet: diet,
        },
      },
    });

    setIsLoading(false);
    if (error) alert("Signup Failed: " + error.message);
    else {
      alert("Account Created Successfully! Please Log In.");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-10">
        <Link href="/" className="inline-block hover:scale-105 transition-transform">
          <div className="flex justify-center items-center">
            <img 
              src="/logo.svg" 
              alt="BowlIt Logo" 
              className="h-16 w-auto object-contain"
              onError={(e) => { 
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3014/3014520.png" 
              }}
            />
          </div>
        </Link>
        <p className="mt-4 text-sm text-gray-600">Fresh homestyle meals, delivered to your desk.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-orange-50 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                <input name="fullName" type="text" required placeholder="Your Name" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all" onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input name="email" type="email" required placeholder="you@example.com" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all" onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input name="password" type={showPassword ? "text" : "password"} required placeholder="••••••••" className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all" onChange={handleChange} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
                 <input name="phone" type="tel" required placeholder="98765 43210" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all" onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Office Building</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-400" /></div>
                <select name="office" required className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white transition-all text-gray-600" onChange={handleChange}>
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
                  { id: 'Veg', icon: Leaf, color: 'green', label: 'Veg' },
                  { id: 'Non-Veg', icon: Beef, color: 'red', label: 'Non-Veg' },
                  { id: 'Flexi', icon: Utensils, color: 'orange', label: 'Flexi' }
                ].map((d) => (
                  <label key={d.id} className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${diet === d.id ? `border-${d.color}-500 bg-${d.color}-50` : `border-gray-200 hover:border-${d.color}-200`}`}>
                    <input type="radio" name="diet" className="sr-only" onChange={() => setDiet(d.id)} />
                    <d.icon className={`h-6 w-6 ${diet === d.id ? `text-${d.color}-600` : 'text-gray-400'}`} />
                    <span className={`font-bold text-xs ${diet === d.id ? `text-${d.color}-700` : 'text-gray-500'}`}>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gray-900 hover:bg-black transition-all active:scale-[0.98]">
              {isLoading ? <Loader2 className="animate-spin" /> : <>Create My Account <ArrowRight size={20} /></>}
            </button>
          </form>
          <div className="mt-8 text-center"><p className="text-sm text-gray-600">Already have an account? <Link href="/" className="font-bold text-orange-600 hover:text-orange-500 hover:underline">Log in instead</Link></p></div>
        </div>
      </motion.div>
    </div>
  );
}