"use client";

import { motion } from "framer-motion";
import { Save, Loader2 } from "lucide-react";

type PersonalDetailsFormProps = {
    formData: {
        fullName: string;
        phone: string;
        email: string;
        office: string;
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100">
            <form onSubmit={handleUpdateProfile} className="space-y-5 md:space-y-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-3 md:pb-4">Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <div className="opacity-60 cursor-not-allowed">
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Full Name</label>
                        <input type="text" value={formData.fullName} disabled className="w-full p-2.5 md:p-3 text-sm md:text-base bg-gray-100 border rounded-xl font-bold text-gray-600" />
                    </div>
                    <div className="opacity-60 cursor-not-allowed">
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Phone</label>
                        <input type="text" value={formData.phone} disabled className="w-full p-2.5 md:p-3 text-sm md:text-base bg-gray-100 border rounded-xl font-bold text-gray-600" />
                    </div>
                    <div className="opacity-60 cursor-not-allowed md:col-span-2">
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                        <input type="text" value={formData.email} disabled className="w-full p-2.5 md:p-3 text-sm md:text-base bg-gray-100 border rounded-xl font-bold text-gray-600" />
                    </div>
                </div>
                {/* Editable Fields */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 pt-4 border-t">
                    <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Office Location</label>
                        <select value={formData.office} onChange={(e) => setFormData({ ...formData, office: e.target.value })} className="w-full p-3 text-sm md:text-base border rounded-xl font-bold text-gray-900 bg-white">
                            <option value="DLF 1">DLF 1 (Newtown)</option>
                            <option value="Ecospace">Ecospace Business Park</option>
                            <option value="Candor">Candor TechSpace</option>
                            <option value="TMC">Tata Medical Center</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Diet</label>
                        <select value={formData.diet} onChange={(e) => setFormData({ ...formData, diet: e.target.value })} className="w-full p-3 text-sm md:text-base border rounded-xl font-bold text-gray-900 bg-white">
                            <option value="Veg">Veg</option>
                            <option value="Non-Veg">Non-Veg</option>
                            <option value="Flexi">Flexi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Gender</label>
                        <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full p-3 text-sm md:text-base border rounded-xl font-bold text-gray-900 bg-white">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Date of Birth</label>
                        <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full p-3 text-sm md:text-base border rounded-xl font-bold text-gray-900" />
                    </div>
                </div>
                <button type="submit" disabled={saving} className="w-full bg-orange-600 text-white py-3.5 md:py-4 mt-2 rounded-xl font-bold text-base md:text-lg shadow-lg hover:bg-orange-700 transition flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} className="md:w-5 md:h-5" /> Save Changes</>}
                </button>
            </form>
        </motion.div>
    );
}
