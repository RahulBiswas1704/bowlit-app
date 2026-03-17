"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet icons safely for SSR
let bikeIcon: L.Icon | undefined;

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Create custom Rider bike icon
  bikeIcon = new L.Icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Generic bike icon
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
  });
}

type MapRiderProps = {
    riderLat: number;
    riderLng: number;
    riderName: string;
    customerLat: number;
    customerLng: number;
};

export default function MapRider({ riderLat, riderLng, riderName, customerLat, customerLng }: MapRiderProps) {
    return (
        <MapContainer
            center={[riderLat, riderLng]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            dragging={false}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {/* Rider Position */}
            {bikeIcon && (
                <Marker position={[riderLat, riderLng]} icon={bikeIcon}>
                    <Popup>{riderName} is on the way!</Popup>
                </Marker>
            )}
            {/* Customer Dropoff Position */}
            <Marker position={[customerLat, customerLng]}>
                <Popup>Your Location</Popup>
            </Marker>
        </MapContainer>
    );
}
