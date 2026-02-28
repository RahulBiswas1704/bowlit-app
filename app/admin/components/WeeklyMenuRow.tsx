"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { WeeklyMenu } from "../../types";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdminClient";

export function WeeklyMenuRow({ day }: { day: WeeklyMenu }) {
    const [lunch, setLunch] = useState(day.lunch_dish);
    const [veg, setVeg] = useState(day.veg_dish);
    const [nonVeg, setNonVeg] = useState(day.non_veg_dish);

    const handleSave = async () => {
        const { error } = await supabase.from('weekly_menu').upsert({
            day_of_week: day.day_of_week,
            lunch_dish: lunch,
            veg_dish: veg,
            non_veg_dish: nonVeg,
            week_number: day.week_number
        }, { onConflict: 'week_number,day_of_week' });

        if (error) alert("Error saving menu: " + error.message);
        else alert(`Saved Cycle ${day.week_number}: ${day.day_of_week}`);
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="p-4"><div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">{day.day_of_week}</div></td>

            <td className="p-4">
                <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-orange-500 outline-none py-2 font-medium"
                    value={lunch || ''}
                    placeholder="e.g. Dal Tadka + Rice"
                    onChange={(e) => setLunch(e.target.value)} />
            </td>

            <td className="p-4">
                <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-green-500 outline-none py-2 text-green-700 font-bold"
                    value={veg || ''}
                    placeholder="Paneer..."
                    onChange={(e) => setVeg(e.target.value)} />
            </td>

            <td className="p-4">
                <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-red-500 outline-none py-2 text-red-700 font-bold"
                    value={nonVeg || ''}
                    placeholder="Chicken..."
                    onChange={(e) => setNonVeg(e.target.value)} />
            </td>

            <td className="p-4 text-right">
                <button onClick={handleSave} className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ml-auto"><Save size={14} /> Save</button>
            </td>
        </tr>
    );
}
