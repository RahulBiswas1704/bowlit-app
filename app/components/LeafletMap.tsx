"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet"; // Normal imports!
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

// Fix for default Leaflet marker icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

// Internal component to handle clicks
function MapController({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onLocationSelect(center.lat, center.lng);
    },
    locationfound: (e) => {
      map.flyTo(e.latlng, 15);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return null;
}

interface LeafletMapProps {
  position: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
}

// The Main Map Component
export default function LeafletMap({ position, onLocationSelect }: LeafletMapProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={[position.lat, position.lng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController onLocationSelect={onLocationSelect} />
      </MapContainer>
      
      {/* Center Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] -mt-8 pointer-events-none">
        <MapPin size={48} className="text-orange-600 fill-orange-600 drop-shadow-xl animate-bounce" />
      </div>
    </div>
  );
}