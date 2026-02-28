"use client";

import React from "react";

export function SidebarItem({
    icon,
    label,
    active,
    onClick
}: {
    icon: React.ReactNode,
    label: string,
    active: boolean,
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${active
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
        >
            {icon} {label}
        </button>
    );
}
