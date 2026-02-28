"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only show Splash Screen if the app is installed as a PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (!isStandalone) {
      setIsVisible(false);
      return;
    }

    // Show for 1.5 seconds to feel snappy but branded
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] bg-gradient-to-br from-orange-50 to-white flex flex-col items-center justify-center"
        >
          {/* 1. Dynamic Bouncing Logo */}
          <motion.img
            src="/logo1.svg"
            alt="BowlIt Logo"
            className="w-48 h-48 object-contain drop-shadow-2xl"
            initial={{ scale: 0.3, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6
            }}
            onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3014/3014520.png" }}
          />

          {/* 2. Staggered App Name Reveal */}
          <motion.h1
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 200 }}
            className="text-5xl font-black tracking-tight text-orange-600 mt-2 drop-shadow-sm"
          >
            BowlIt
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-orange-900/60 font-medium tracking-widest uppercase text-xs mt-2"
          >
            Fresh Daily Meals
          </motion.p>

          {/* 3. Custom Pulsing Loading Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="absolute bottom-16 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2, // Stagger effect
                }}
                className="w-2.5 h-2.5 bg-orange-500 rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}