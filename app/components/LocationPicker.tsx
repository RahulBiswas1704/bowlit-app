"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Check } from "lucide-react";

// Dynamically import the Map Component we just made
// This prevents "Window is not defined" errors
const LeafletMap = dynamic(() => import("./LeafletMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
});

interface LocationPickerProps {
  onConfirm: (address: string) => void;
  onClose: () => void;
}

export default function LocationPicker({ onConfirm, onClose }: LocationPickerProps) {
  const [position, setPosition] = useState({ lat: 22.5735, lng: 88.4331 });
  const [address, setAddress] = useState("Locating...");
  const [loading, setLoading] = useState(false);

  const fetchAddress = async (lat: number, lng: number) => {
    setLoading(true);
    setPosition({ lat, lng });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",").slice(0, 3).join(", ");
        setAddress(parts);
      } else {
        setAddress("Unknown Location");
      }
    } catch (err) {
      setAddress("Could not fetch address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={18} className="text-orange-600" /> Pin Location
          </h3>
          <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800">Close</button>
        </div>

        {/* Map Area */}
        <div className="relative flex-1 bg-gray-100">
           <LeafletMap position={position} onLocationSelect={fetchAddress} />

           {/* Address Bar */}
           <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-[400] flex items-center justify-between">
              <div>
                 <p className="text-[10px] uppercase font-bold text-gray-400">Selected Location</p>
                 <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                    {loading ? "Fetching..." : address}
                 </p>
              </div>
              <button 
                onClick={() => onConfirm(address)}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-800"
              >
                Confirm <Check size={16}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}