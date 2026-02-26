"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register the Service Worker (Required for PWA install prompt)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // 2. Check if already running as standalone (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 3. Listen for the install prompt event
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 4. Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (!showBanner || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] md:hidden"
      >
        <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shrink-0">
               {/* Fallback image if logo.svg fails */}
               <img src="/logo.svg" alt="App Icon" className="w-full h-full object-contain" 
                  onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3014/3014520.png" }} 
               />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">BowlIt App</h4>
              <p className="text-[10px] text-gray-400">Add to home screen for faster ordering</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstall}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Download size={14} /> Install
            </button>
            <button 
              onClick={() => setShowBanner(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}