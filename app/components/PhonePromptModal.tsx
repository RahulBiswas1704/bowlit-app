"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function PhonePromptModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Check if user is logged in, but missing phone number
        const checkUserPhone = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const savedPhone = user.user_metadata?.phone;
                if (!savedPhone) {
                    setIsOpen(true);
                }
            }
        };

        // Check initially
        checkUserPhone();

        // Listen for auth changes (like returning from Google OAuth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user && !session.user.user_metadata?.phone) {
                setUserId(session.user.id);
                setIsOpen(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSavePhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;
        setLoading(true);

        // Save phone to user_metadata
        const { error } = await supabase.auth.updateUser({
            data: { phone: phone }
        });

        setLoading(false);

        if (error) {
            alert("Error saving phone number: " + error.message);
        } else {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                // Optional: Force reload to apply user_metadata everywhere
                window.location.reload();
            }, 1500);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

                    {/* BACKDROP - Very opaque so they focus on it */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* MODAL BOX */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden z-10"
                    >
                        <div className="p-8 text-center pt-10">

                            {/* HEADER ICON */}
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-orange-50/50">
                                {success ? <CheckCircle className="text-green-500" size={28} /> : <Phone className="text-orange-600" size={28} />}
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {success ? "All Set!" : "One Last Step"}
                            </h2>
                            <p className="text-gray-500 text-sm mb-8 px-2">
                                {success ? "Your phone number is saved." : "Please provide your WhatsApp or calling number so our rider can reach you with your food."}
                            </p>

                            {!success && (
                                <form onSubmit={handleSavePhone} className="space-y-4">
                                    <div className="bg-gray-50 border-2 border-transparent focus-within:border-orange-500 focus-within:bg-white rounded-2xl px-4 py-3 transition-all flex items-center gap-3">
                                        <span className="font-bold text-gray-500 border-r border-gray-300 pr-3">+91</span>
                                        <input
                                            type="tel"
                                            placeholder="98765 43210"
                                            className="w-full bg-transparent outline-none text-lg font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                                            value={phone}
                                            autoFocus
                                            onChange={(e) => {
                                                // Only allow numbers
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 10) setPhone(val);
                                            }}
                                            required
                                        />
                                    </div>

                                    <button
                                        disabled={loading || phone.length < 10}
                                        className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <>Save & Continue <ArrowRight size={20} /></>}
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        We don't send SMS spam. We only use this for delivery.
                                    </p>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
