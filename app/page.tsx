import Navbar from "./components/Navbar";
import DesktopHomePage from "./components/home/DesktopHomePage";
import MobileHomePage from "./components/home/MobileHomePage";
import { supabase } from "./lib/supabaseClient";

// Force dynamic rendering so it fetches fresh data every time
export const dynamic = 'force-dynamic';

// HELPER: Calculate if it's Week 1 (Odd) or Week 2 (Even)
function getCurrentWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  return weekNum % 2 === 0 ? 2 : 1;
}

export default async function HomePage() {
  const currentWeek = getCurrentWeekNumber();
  console.log(`Fetching Menu for Cycle: ${currentWeek}`);

  // 1. Fetch Plans
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('base_price', { ascending: true });

  // 2. Fetch ONLY the Menu for the CURRENT WEEK (Fixes the duplicate issue)
  const { data: rawMenu } = await supabase
    .from('weekly_menu')
    .select('*')
    .eq('week_number', currentWeek); // <--- THIS IS THE FIX

  // Custom sort to ensure Monday comes first
  const dayOrder: { [key: string]: number } = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
  const weeklyMenu = rawMenu?.sort((a, b) => dayOrder[a.day_of_week] - dayOrder[b.day_of_week]) || [];

  // 3. Fetch Active Add-ons
  const { data: addOns } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true);

  const safePlans = plans || [];
  const safeMenu = weeklyMenu || [];
  const safeAddOns = addOns || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* MOBILE VIEW */}
      <div className="block md:hidden">
        <MobileHomePage plans={safePlans} weeklyMenu={safeMenu} addOns={safeAddOns} />
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block">
        <DesktopHomePage plans={safePlans} weeklyMenu={safeMenu} addOns={safeAddOns} />
      </div>
    </div>
  );
}