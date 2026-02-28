"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { MapPin, Building, Info, Save, Loader2 } from "lucide-react";

// Standard Next.js workaround for Leaflet SSR issues
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components so they don't crash on the server
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

// KOLKATA DEFAULT COORDINATES
const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 };

export function AddressManager({ formData, setFormData, handleUpdateProfile, saving }: any) {
    const [isClient, setIsClient] = useState(false);

    // Custom Map Icon (Leaflet requires this in Next.js)
    const markerIcon = useMemo(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            return new L.Icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014520.png', // Or any custom pin
                iconSize: [40, 40],
                iconAnchor: [20, 40],
            });
        }
        return null;
    }, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Update map pin position
    const handleMapClick = (e: any) => {
        setFormData({
            ...formData,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
        });
    };

    // Helper component to bind click events to the map
    const MapEvents = dynamic(
        () => import('react-leaflet').then(m => {
            return ({ onClick }: { onClick: any }) => {
                m.useMapEvents({ click: onClick });
                return null;
            };
        }),
        { ssr: false }
    );

    const position = {
        lat: formData.latitude || DEFAULT_CENTER.lat,
        lng: formData.longitude || DEFAULT_CENTER.lng
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <MapPin size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Delivery Address</h3>
                    <p className="text-sm text-gray-500">Tap the map to set your exact location.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* MAP CONTAINER (ONLY RENDERS ON CLIENT) */}
                <div className="h-64 md:h-80 rounded-2xl overflow-hidden border-2 border-orange-100 relative shadow-inner z-0">
                    {isClient ? (
                        // @ts-ignore
                        <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                            {/* @ts-ignore */}
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            {/* @ts-ignore */}
                            {markerIcon && <Marker position={[position.lat, position.lng]} icon={markerIcon} />}
                            {/* @ts-ignore */}
                            <MapEvents onClick={handleMapClick} />
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">Loading Map...</div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-md pointer-events-none z-[1000] flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">GPS Status:</span>
                        <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            {formData.latitude ? "PIN DROPPED" : "AWAITING TAP"}
                        </span>
                    </div>
                </div>

                {/* TEXT DETAILS */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><Building size={16} /> Building / Tower / Office Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                            placeholder="e.g. DLF Galleria, Tower C"
                            value={formData.building_name || ""}
                            onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><MapPin size={16} /> Floor & Unit Number</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors"
                            placeholder="e.g. 4th Floor, Unit 402"
                            value={formData.office || ""} // Re-using the old 'office' field for unit number to keep DB migrations minimal
                            onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><Info size={16} /> Delivery Instructions</label>
                        <textarea
                            className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none transition-colors h-24 resize-none"
                            placeholder="e.g. Leave with reception, Call 5 mins before."
                            value={formData.delivery_instructions || ""}
                            onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleUpdateProfile}
                disabled={saving || !formData.latitude}
                className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {saving ? "Saving Coordinates..." : "Save Delivery Address"}
            </button>

        </div>
    );
}
