"use client";

import { motion } from "framer-motion";
import { Save, Loader2, CheckCircle2, UserCircle2 } from "lucide-react";

type PersonalDetailsFormProps = {
    formData: {
        fullName: string;
        phone: string;
        email: string;
        diet: string;
        gender: string;
        dob: string;
    };
    setFormData: (data: any) => void;
    handleUpdateProfile: (e: React.FormEvent) => void;
    saving: boolean;
};

export function PersonalDetailsForm({ formData, setFormData, handleUpdateProfile, saving }: PersonalDetailsFormProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-gray-100 flex flex-col h-full relative">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-full">
                        <UserCircle2 size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Identity</h3>
                </div>
                {saving && <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse"><Loader2 size={14} className="animate-spin" /> Syncing</span>}
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pb-6 pr-2">
                {/* Read-Only Verified Sync Block */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Legal Name</label>
                        <div className="w-full p-4 text-sm bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between shadow-sm">
                            {formData.fullName || "Unverified User"} <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                        <div className="w-full p-4 text-sm bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between shadow-sm">
                            {formData.phone ? `+91 ${formData.phone}` : "Not Linked"} <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <div className="w-full p-4 text-sm bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between shadow-sm">
                            {formData.email || "No email on file"} 
                            {formData.email && <CheckCircle2 size={16} className="text-green-500" />}
                        </div>
                    </div>
                </div>

                <div className="px-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Updatable Preferences</h4>
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Diet Preference</label>
                            <select value={formData.diet} onChange={(e) => setFormData({ ...formData, diet: e.target.value })} className="w-full p-4 text-sm border-2 border-gray-100 focus:border-orange-500 rounded-xl font-bold text-gray-900 bg-white transition-colors outline-none cursor-pointer appearance-none">
                                <option value="Veg">🌱 Pure Vegetarian</option>
                                <option value="Non-Veg">🍗 Non-Vegetarian</option>
                                <option value="Flexi">🥗 Flexitarian / Mix</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Gender</label>
                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full p-4 text-sm border-2 border-gray-100 focus:border-orange-500 rounded-xl font-bold text-gray-900 bg-white transition-colors outline-none cursor-pointer appearance-none">
                                <option value="">Select Gender</option>
                                <option value="Male">👨 Male</option>
                                <option value="Female">👩 Female</option>
                                <option value="Other">🌈 Other</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Date of Birth</label>
                            <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full p-4 text-sm border-2 border-gray-100 focus:border-orange-500 rounded-xl font-bold text-gray-900 outline-none transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 mt-auto shrink-0 border-t border-gray-100">
                <button type="button" onClick={handleUpdateProfile} disabled={saving} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-widest shadow-xl hover:bg-black hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Update Profile</>}
                </button>
            </div>
        </motion.div>
    );
}
