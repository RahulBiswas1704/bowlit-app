"use client";
import { useState, useEffect } from "react";
import { Bike, Phone, MapPin, CheckCircle, LogOut, Loader2, Package, RefreshCw, CheckSquare } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// --- TYPES ---
type Rider = { id: number; name: string; phone: string; };
type Order = { id: number; customer_name: string; customer_phone: string; address: string; total_amount: number; status: string; items: any[]; created_at: string; };

export default function RiderPanel() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    totalDelivered: 0,
    pending: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedRider = localStorage.getItem("rider_session");
    if (savedRider) {
      const parsedRider = JSON.parse(savedRider);
      setRider(parsedRider);
      updateRiderStatus(parsedRider.phone, 'Online');
      refreshAllData(parsedRider.phone);
      setupRealtime(parsedRider.phone);
    }
  }, []);

  // --- ACTIONS ---
  const updateRiderStatus = async (riderPhone: string, status: 'Online' | 'Offline') => {
    await supabase.from('riders').update({ status }).eq('phone', riderPhone);
  };

  const setupRealtime = (riderPhone: string) => {
    const channel = supabase
      .channel('rider-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          refreshAllData(riderPhone);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  // Wrapper to fetch everything at once
  const refreshAllData = (riderPhone: string) => {
    fetchOrders(riderPhone);
    fetchStats(riderPhone);
  };

  const fetchOrders = async (riderPhone: string) => {
    setRefreshing(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_phone', riderPhone)
      .neq('status', 'Completed')
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    setRefreshing(false);
  };

  const fetchStats = async (riderPhone: string) => {
    // 1. Get ALL completed orders for this rider
    const { data: completed } = await supabase
      .from('orders')
      .select('created_at')
      .eq('rider_phone', riderPhone)
      .eq('status', 'Completed');

    // 2. Get Pending Count (Live)
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('rider_phone', riderPhone)
      .neq('status', 'Completed');

    if (completed) {
      // Calculate Today's Orders
      const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todayCount = completed.filter(o => o.created_at.startsWith(todayDate)).length;

      setStats({
        todayCount,
        totalDelivered: completed.length,
        pending: pendingCount || 0
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('riders').select('*').eq('phone', phone).eq('password', password).single();

    if (error || !data) { alert("Invalid Credentials"); setLoading(false); return; }

    localStorage.setItem("rider_session", JSON.stringify(data));
    setRider(data);
    updateRiderStatus(data.phone, 'Online');
    refreshAllData(data.phone);
    setupRealtime(data.phone);
    setLoading(false);
  };

  const handleLogout = async () => {
    if (rider) await updateRiderStatus(rider.phone, 'Offline');
    localStorage.removeItem("rider_session");
    setRider(null);
    window.location.reload();
  };

  const markDelivered = async (id: number) => {
    if (!confirm("Confirm delivery and cash collection?")) return;
    await supabase.from('orders').update({ status: 'Completed' }).eq('id', id);
    // Realtime will trigger refreshAllData automatically
  };

  // --- RENDER: LOGIN ---
  if (!rider) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm text-center shadow-2xl">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bike className="text-orange-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Fleet Login</h1>
          <form onSubmit={handleLogin} className="space-y-4 mt-8">
            <input className="w-full bg-gray-50 border p-4 rounded-xl font-bold" placeholder="Phone ID" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className="w-full bg-gray-50 border p-4 rounded-xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button disabled={loading} className="w-full bg-black text-white p-4 rounded-xl font-bold">{loading ? "..." : "Start Shift"}</button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* HEADER */}
      <header className="bg-gray-900 text-white p-6 pb-24 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-bold text-2xl">{rider.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-sm text-green-400 font-mono">Online</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 bg-gray-800 rounded-xl hover:bg-red-900 transition-colors"><LogOut size={20}/></button>
        </div>

        {/* MAIN STATS CARD (Earnings Removed) */}
        <div className="flex gap-4">
            <div className="flex-1 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Delivered</p>
                <div className="flex items-center gap-2">
                    <CheckSquare className="text-orange-400" size={20}/>
                    <span className="text-2xl font-bold">{stats.totalDelivered}</span>
                </div>
            </div>
        </div>
      </header>

      {/* FLOATING STATS ROW */}
      <div className="px-6 -mt-16 relative z-20 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex justify-between">
            <div className="text-center flex-1 border-r border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Today</p>
                <p className="text-xl font-bold text-gray-900">{stats.todayCount}</p>
            </div>
            <div className="text-center flex-1 border-r border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Pending</p>
                <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
            </div>
             <div className="text-center flex-1 flex items-center justify-center">
                <button onClick={() => refreshAllData(rider.phone)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition">
                    <RefreshCw size={20} className={`text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="px-6 space-y-4">
        <h2 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Current Tasks</h2>

        {orders.length === 0 ? (
            <div className="text-center py-10">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Package size={24} className="text-gray-300"/>
                </div>
                <p className="text-gray-400 font-bold text-sm">No active tasks</p>
            </div>
        ) : (
            orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-orange-50 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wide">
                        {order.status}
                    </div>
                    
                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 mb-1">#{order.id} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <h3 className="font-bold text-lg text-gray-900">{order.customer_name}</h3>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-2xl flex gap-3 mb-4">
                        <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={16}/>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">{order.address}</p>
                    </div>

                    <div className="flex items-center justify-between mb-6 px-1">
                        <div className="flex items-center gap-2">
                             <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Cash</div>
                             <span className="font-bold text-xl">₹{order.total_amount}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <a href={`tel:${order.customer_phone}`} className="bg-black text-white p-4 rounded-xl flex items-center justify-center">
                            <Phone size={20}/>
                        </a>
                        <button 
                            onClick={() => markDelivered(order.id)} 
                            className="flex-1 bg-green-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                        >
                           <CheckCircle size={18}/> Mark Delivered
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}