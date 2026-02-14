"use client";
import Navbar from "./components/Navbar";
import DesktopHomePage from "./components/home/DesktopHomePage";
import MobileHomePage from "./components/home/MobileHomePage";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Show Mobile Page on screens smaller than 'md' (768px) */}
      <div className="block md:hidden">
        <MobileHomePage />
      </div>

      {/* Show Desktop Page on screens 'md' and larger */}
      <div className="hidden md:block">
        <DesktopHomePage />
      </div>
    </div>
  );
}