"use client";

import { useState } from "react";
import { Edit3, Save } from "lucide-react";
import { Plan } from "../../types";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdminClient";

export function PlanCard({ plan, onUpdate }: { plan: Plan; onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [localPlan, setLocalPlan] = useState(plan);

    const handleSave = async () => {
        await supabase.from('plans').update({
            base_price: localPlan.base_price,
            description: localPlan.description
        }).eq('id', plan.id);
        setIsEditing(false);
        alert("Plan updated!");
        onUpdate();
    };

    return (
        <div className={`bg-white p-6 rounded-2xl border transition-all ${isEditing ? 'border-orange-500 shadow-md' : 'border-gray-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`p-2 rounded-full ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-black hover:text-white'}`}>
                    {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                </button>
            </div>
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase mb-4 inline-block">{plan.type}</span>
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Base Price (Per Day)</label>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">₹</span>
                    <input
                        type="number"
                        disabled={!isEditing}
                        className={`w-full border-b-2 outline-none p-1 font-bold text-2xl ${isEditing ? 'border-orange-500 bg-orange-50/50' : 'border-transparent bg-transparent'}`}
                        value={isEditing ? localPlan.base_price : plan.base_price}
                        onChange={(e) => setLocalPlan({ ...localPlan, base_price: parseFloat(e.target.value) })}
                    />
                </div>
            </div>
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Short Description</label>
                <textarea
                    disabled={!isEditing}
                    className={`w-full p-2 rounded-lg text-sm resize-none ${isEditing ? 'bg-white border border-orange-200' : 'bg-gray-50 border-transparent'}`}
                    rows={2}
                    value={isEditing ? localPlan.description : plan.description}
                    onChange={(e) => setLocalPlan({ ...localPlan, description: e.target.value })}
                />
            </div>
        </div>
    );
}
