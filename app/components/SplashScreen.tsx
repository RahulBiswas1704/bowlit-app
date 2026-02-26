"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Check if the app is running as an installed PWA (Standalone mode)
    // We check standard matchMedia and also Apple's specific iOS navigator property
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // 2. If it is NOT installed (just a normal website tab), hide splash immediately and stop
    if (!isStandalone) {
      setIsVisible(false);
      return;
    }

    // 3. If IT IS installed, show it for 2.5 seconds then fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Prevent server-side rendering mismatch
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center"
        >
          {/* Animated Logo */}
          <motion.img
            src="/logo1.svg"
            alt="BowlIt Logo"
            className="w-40 h-40 object-contain drop-shadow-lg"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
            onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3014/3014520.png" }}
          />
          
          {/* Animated App Name */}
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-orange-600 mt-4"
          >
            BowlIt
          </motion.h1>

          {/* Loading Spinner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8"
          >
            <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}