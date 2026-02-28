"use client";

import React from "react";

export function StatCard({
    title,
    value,
    icon,
    colorClass
}: {
    title: string,
    value: string,
    icon: React.ReactNode,
    colorClass: string
}) {
    return (
        <div className={`p-6 rounded-3xl shadow-lg border border-transparent shadow-gray-200/50 flex flex-col justify-between min-h-[140px] text-white overflow-hidden relative ${colorClass}`}>
            <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
                <span className="font-bold text-sm opacity-90">{title}</span>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">{icon}</div>
            </div>
            <h3 className="text-3xl font-black relative z-10">{value}</h3>
        </div>
    );
}
