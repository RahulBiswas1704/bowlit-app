"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Order } from "../../types";
import { User, Phone, MapPin, Loader2 } from "lucide-react";

// Dynamically import Leaflet components so they don't crash on the server
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

// KOLKATA DEFAULT CENTER
const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 };

export function LogisticsMap({ orders }: { orders: Order[] }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Filter for ONLY valid, pending orders that actually have GPS coordinates
    const mappedOrders = useMemo(() => {
        return orders.filter(o =>
            o.status !== "Completed" &&
            o.status !== "Cancelled" &&
            o.customer_latitude &&
            o.customer_longitude
        );
    }, [orders]);

    // Custom Map Icon logic
    const markerIcon = useMemo(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            return new L.Icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014520.png', // Or any custom pin
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            });
        }
        return null;
    }, []);

    if (!isClient) {
        return <div className="h-[600px] w-full flex flex-col items-center justify-center bg-gray-50 rounded-[2.5rem] border border-gray-100 text-gray-400 font-bold"><Loader2 className="animate-spin mb-4" size={32} /> Loading City Map...</div>;
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-6 px-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Live Logistics Overview</h2>
                    <p className="text-gray-500 font-medium">Tracking {mappedOrders.length} active delivery drops.</p>
                </div>
                {orders.length > 0 && (
                    <div className="flex gap-4">
                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">{mappedOrders.length} Mapped</span>
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{orders.filter(o => o.status !== "Completed" && (!o.customer_latitude || !o.customer_longitude)).length} Missing GPS</span>
                    </div>
                )}
            </div>

            <div className="flex-1 rounded-[2rem] overflow-hidden border-2 border-gray-100 relative z-0">
                {/* @ts-ignore */}
                <MapContainer center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    {/* @ts-ignore */}
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                    {mappedOrders.map((order) => (
                        /* @ts-ignore */
                        <Marker key={order.id} position={[order.customer_latitude!, order.customer_longitude!]} icon={markerIcon}>
                            {/* @ts-ignore */}
                            <Popup className="custom-popup bg-transparent">
                                <div className="p-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><User size={16} /></div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{order.customer_name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Order #{order.id}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-3">
                                        {order.building_name && <p className="text-xs font-bold text-gray-700 flex gap-2"><MapPin size={12} className="text-orange-500 shrink-0" /> {order.building_name}</p>}
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{order.address}</p>
                                        {order.delivery_instructions && <p className="text-xs text-orange-600 italic bg-orange-50 p-1 rounded-md">"{order.delivery_instructions}"</p>}
                                    </div>
                                    <a href={`tel:${order.customer_phone}`} className="flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 transition">
                                        <Phone size={12} /> {order.customer_phone}
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
