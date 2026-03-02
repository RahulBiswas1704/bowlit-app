"use client";

import { useState } from "react";
import { Edit3, Save, Plus, X } from "lucide-react";
import { Plan } from "../../types";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdminClient";

export function PlanCard({ plan, onUpdate }: { plan: Plan; onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [localPlan, setLocalPlan] = useState<Plan>({ ...plan, features: plan.features || [] });

    const handleSave = async () => {
        await supabase.from('plans').update({
            name: localPlan.name,
            type: localPlan.type,
            base_price: localPlan.base_price,
            description: localPlan.description,
            features: localPlan.features
        }).eq('id', plan.id);
        setIsEditing(false);
        alert("Plan updated!");
        onUpdate();
    };

    const handleAddFeature = () => {
        setLocalPlan({ ...localPlan, features: [...(localPlan.features || []), "New Feature"] });
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(localPlan.features || [])];
        newFeatures[index] = value;
        setLocalPlan({ ...localPlan, features: newFeatures });
    };

    const handleRemoveFeature = (index: number) => {
        const newFeatures = (localPlan.features || []).filter((_, i) => i !== index);
        setLocalPlan({ ...localPlan, features: newFeatures });
    };

    return (
        <div className={`bg-white p-6 rounded-2xl border transition-all ${isEditing ? 'border-orange-500 shadow-md' : 'border-gray-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
                {isEditing ? (
                    <input
                        className="text-xl font-bold border-b-2 border-orange-500 bg-orange-50/50 outline-none w-full mr-4 p-1"
                        value={localPlan.name}
                        onChange={(e) => setLocalPlan({ ...localPlan, name: e.target.value })}
                        placeholder="Plan Name"
                    />
                ) : (
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                )}
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`p-2 rounded-full flex-shrink-0 ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-black hover:text-white'}`}>
                    {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                </button>
            </div>

            <div className="mb-4">
                {isEditing ? (
                    <select
                        className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-orange-500"
                        value={localPlan.type}
                        onChange={(e) => setLocalPlan({ ...localPlan, type: e.target.value })}
                    >
                        <option value="veg">VEG</option>
                        <option value="non-veg">NON-VEG</option>
                        <option value="both">BOTH</option>
                    </select>
                ) : (
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase inline-block">{plan.type}</span>
                )}
            </div>

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

            <div className="mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Included Features</label>
                <div className="space-y-2">
                    {(isEditing ? localPlan.features : plan.features)?.map((feature, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <span className="text-green-500 font-bold mt-1">•</span>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        className="flex-1 border-b border-orange-300 bg-orange-50/50 outline-none p-1 text-sm text-gray-700"
                                        value={feature}
                                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                                    />
                                    <button onClick={() => handleRemoveFeature(index)} className="text-red-400 hover:text-red-600 p-1">
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <span className="text-sm text-gray-700 leading-tight block pt-1">{feature}</span>
                            )}
                        </div>
                    ))}
                    {(isEditing ? localPlan.features : plan.features)?.length === 0 && !isEditing && (
                        <span className="text-xs text-gray-400 font-bold italic">No features listed</span>
                    )}
                    {isEditing && (
                        <button onClick={handleAddFeature} className="text-xs font-bold text-orange-600 flex items-center gap-1 mt-3 hover:underline">
                            <Plus size={14} /> Add Feature Line
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
