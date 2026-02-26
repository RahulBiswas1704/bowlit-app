import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import Footer from "./components/Footer";
import InstallBanner from "./components/InstallBanner";
import NotificationManager from "./components/NotificationManager";
import SplashScreen from "./components/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

// Setup PWA Metadata
export const metadata: Metadata = {
  title: "BowlIt | Daily Meal Subscription",
  description: "Fresh, homestyle meals delivered to your desk.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BowlIt",
  },
};

// Setup viewport metadata specifically for PWA theme colors
export const viewport: Viewport = {
  themeColor: "#ea580c", // Brand Orange
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* LEAFLET MAP CSS (Required for the Free Map) */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
     integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
     crossOrigin=""/>
      </head>
      <body className={inter.className}>
        <SplashScreen />
        <CartProvider>
          <div className="flex flex-col min-h-screen">
             <main className="flex-grow">
                {children}
             </main>
             <Footer />
          </div>
          
          {/* PWA Install Banner */}
          <InstallBanner />
          
          {/* Push Notification Manager */}
          <NotificationManager />
          
        </CartProvider>
      </body>
    </html>
  );
}