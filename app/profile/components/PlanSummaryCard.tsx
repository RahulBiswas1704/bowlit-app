"use client";

import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import Link from "next/link";

type PlanSummaryCardProps = {
    activePlan: string;
    credits: number;
    balance: number;
};

export function PlanSummaryCard({ activePlan, credits, balance }: PlanSummaryCardProps) {
    return (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 text-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-wider">
                        <Utensils size={14} /> Active Plan
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold mb-1">{activePlan || "No Active Plan"}</h2>
                    <p className="text-xs md:text-sm text-gray-400 mb-6">
                        {activePlan.includes("Lunch + Dinner") ? "2 Meals/Day deduction" : "1 Meal/Day deduction"}
                    </p>

                    <div className="flex items-end gap-2">
                        <span className="text-4xl md:text-5xl font-extrabold text-white">{credits}</span>
                        <span className="text-base md:text-lg font-bold text-gray-400 mb-1">Credits Left</span>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="mb-4 md:mb-0">
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase mb-1 md:mb-2">Wallet Balance</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 md:mb-6">₹{balance}</h2>
                </div>
                <Link href="/wallet" className="w-full">
                    <button className="w-full bg-orange-50 text-orange-700 px-4 py-3 md:px-6 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-orange-100 transition-colors">
                        Top Up Wallet
                    </button>
                </Link>
            </motion.div>
        </div>
    );
}
