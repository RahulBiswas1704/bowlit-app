"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSetupModal({ isOpen, onClose }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gender) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Update Supabase User Metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        gender: gender,
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      // Success
      onClose();
      window.location.reload(); // Refresh to update the UI
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
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-orange-600">
                 <User size={24} />
               </div>
               <h2 className="text-xl font-bold text-orange-900">Let's Get to Know You!</h2>
               <p className="text-orange-700/80 text-xs mt-1">Please finish setting up your profile.</p>
            </div>

            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Full Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Rahul Biswas"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-4 py-3 font-bold text-gray-900 outline-none transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Gender Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                           {['Male', 'Female', 'Other'].map((g) => (
                             <button
                               key={g}
                               type="button"
                               onClick={() => setGender(g)}
                               className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                 gender === g 
                                 ? "border-orange-500 bg-orange-50 text-orange-700" 
                                 : "border-gray-100 text-gray-400 hover:border-gray-200"
                               }`}
                             >
                               {g}
                             </button>
                           ))}
                        </div>
                    </div>

                    <button 
                      disabled={loading || !name || !gender}
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : <>Complete Profile <CheckCircle size={18}/></>}
                    </button>
                </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}