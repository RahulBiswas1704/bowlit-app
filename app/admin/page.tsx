"use client";
import { useEffect, useState, useMemo } from "react";
import {
  ChefHat, Plus, Trash2, Loader2, LogOut,
  ShoppingBag, Utensils, Clock,
  LayoutDashboard, CreditCard, Bike, UserPlus, XCircle, MapPin,
  Calendar, Edit3, Save, Users, TrendingUp, IndianRupee, Bell
} from "lucide-react";

import { supabaseAdmin as supabase } from "../lib/supabaseAdminClient";
import { Session } from "@supabase/supabase-js";

// Extracted types and utils
import { MenuItem, Order, Rider, Customer, Plan, WeeklyMenu } from "../types";
import { formatMoney, getRealWorldWeek } from "../lib/utils";

// Extracted Sub-components
import { SidebarItem } from "./components/SidebarItem";
import { StatCard } from "./components/StatCard";
import { PlanCard } from "./components/PlanCard";
import { WeeklyMenuRow } from "./components/WeeklyMenuRow";
import { LogisticsMap } from "./components/LogisticsMap";

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('admins').select('id').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data) { setSession(session); setIsAdmin(true); }
            setLoading(false);
          });
      } else { setLoading(false); }
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={48} /></div>;
  if (!session || !isAdmin) return <AdminLogin onLoginSuccess={() => window.location.reload()} />;

  return <AdminDashboard />;
}

// --- ADMIN LOGIN ---
function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else if (data.user) onLoginSuccess();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Portal</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full border rounded-xl p-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full border rounded-xl p-3" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold">{loading ? "..." : "Login"}</button>
        </form>
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'orders' | 'customers' | 'menu' | 'fleet' | 'plans' | 'weekly'>('overview');
  const [loading, setLoading] = useState(false);

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]); // NEW

  // NEW: State for Cycle Selection (1 or 2)
  const [selectedCycle, setSelectedCycle] = useState<1 | 2>(1);

  // Modals
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isAddingRider, setIsAddingRider] = useState(false);
  const [topUpModal, setTopUpModal] = useState<{ isOpen: boolean, customerId: string, amount: string }>({ isOpen: false, customerId: "", amount: "" }); // NEW

  const [newItem, setNewItem] = useState({ name: "", price: "", type: "Veg", description: "", image: "" });
  const [newRider, setNewRider] = useState({ name: "", phone: "", password: "" });
  const [selectedRiders, setSelectedRiders] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('menu_items').select('*').order('id', { ascending: true });
    const { data: r } = await supabase.from('riders').select('*');
    const { data: p } = await supabase.from('plans').select('*').order('base_price', { ascending: true });

    // FETCH WEEKLY MENU (Includes new columns automatically if they exist in DB)
    const { data: w } = await supabase.from('weekly_menu').select('*');

    // FETCH CUSTOMERS (Auth users joined with Wallets)
    // Supabase JS doesn't easily join auth.users, so we fetch wallets and profiles
    const { data: walletsData } = await supabase.from('wallets').select('*');
    // Using an RPC call or admin auth to list users would be better, but we can simulate it with existing data for now
    // As a workaround since auth.users isn't directly queryable via select('*'):
    // We will extract unique customers from the `orders` table as our "Customer Directory"
    const uniqueCustomersMap = new Map();
    if (o) {
      o.forEach((order: any) => {
        if (!uniqueCustomersMap.has(order.customer_phone)) {
          uniqueCustomersMap.set(order.customer_phone, {
            id: order.user_id || 'unknown', // Need to ensure user_id is in orders in production
            phone: order.customer_phone,
            full_name: order.customer_name,
            email: "N/A", // Not stored in orders
            office: order.address,
            diet: "Unknown",
            balance: 0 // Will map below
          });
        }
      });
    }

    // Map wallet balances directly if we have proper user_ids
    const mappedCustomers = Array.from(uniqueCustomersMap.values()).map(c => {
      const userWallet = walletsData?.find(w => w.user_id === c.id);
      return { ...c, balance: userWallet?.balance || 0 };
    });

    const sorter: { [key: string]: number } = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
    if (w) w.sort((a, b) => sorter[a.day_of_week] - sorter[b.day_of_week]);

    if (o) setOrders(o);
    if (m) setMenuItems(m);
    if (r) setRiders(r);
    if (p) setPlans(p);
    if (w) setWeeklyMenu(w);
    setCustomers(mappedCustomers);
  };

  const stats = useMemo(() => {
    // Calculate last 7 days revenue for chart
    const last7DaysMap = Array.from({ length: 7 }).reverse().reduce((acc: any, _, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      acc[d.toISOString().split('T')[0]] = 0; return acc;
    }, {});

    orders.forEach(o => {
      const dateStr = o.created_at.split('T')[0];
      if (last7DaysMap[dateStr] !== undefined) {
        last7DaysMap[dateStr] += (o.total_amount || 0);
      }
    });

    return {
      revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      pending: orders.filter(o => o.status !== 'Completed').length,
      totalOrders: orders.length,
      activeRiders: riders.length,
      chartData: Object.entries(last7DaysMap).map(([date, total]) => ({ date, total: total as number }))
    };
  }, [orders, riders]);

  // --- ACTIONS ---
  const handleAddItem = async () => {
    await supabase.from('menu_items').insert([{ name: newItem.name, price: parseFloat(newItem.price), type: newItem.type, image: newItem.image }]);
    setIsAddingDish(false); fetchData();
  };
  const handleAddRider = async () => {
    const { error } = await supabase.from('riders').insert([newRider]);
    if (error) alert(error.message); else { setIsAddingRider(false); fetchData(); }
  };
  const assignRider = async (orderId: number) => {
    const riderPhone = selectedRiders[orderId];
    if (!riderPhone) return alert("Please select a rider first");
    await supabase.from('orders').update({ rider_phone: riderPhone, status: 'Out for Delivery' }).eq('id', orderId);
    fetchData();
  };
  const unassignRider = async (orderId: number) => {
    if (!confirm("Unassign this rider?")) return;
    await supabase.from('orders').update({ rider_phone: null, status: 'Cooking' }).eq('id', orderId);
    fetchData();
  };
  const updateOrderStatus = async (id: number, status: string) => { await supabase.from('orders').update({ status }).eq('id', id); fetchData(); };
  const toggleStock = async (id: number, available: boolean) => { await supabase.from('menu_items').update({ is_available: !available }).eq('id', id); fetchData(); };
  const deleteItem = async (id: number) => { if (confirm("Delete dish?")) { await supabase.from('menu_items').delete().eq('id', id); fetchData(); } };

  // NEW: Wallet Top-Up logic
  const handleTopUp = async () => {
    if (!topUpModal.customerId || isNaN(parseFloat(topUpModal.amount))) return alert("Invalid amount or user");
    // RPC call or manual fetch + update
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', topUpModal.customerId).single();
    if (wallet) {
      const newBalance = wallet.balance + parseFloat(topUpModal.amount);
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', topUpModal.customerId);
      alert(`Added ₹${topUpModal.amount} to user's wallet!`);
      setTopUpModal({ isOpen: false, customerId: "", amount: "" });
      fetchData();
    } else {
      alert("Wallet not found for this user. Ensure user_id is properly synced in orders table.");
    }
  };

  const sendTestNotification = async (userId: string, userName: string) => {
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Lunch is arriving! 🍲',
          body: `Hey ${userName}, your BowlIt delivery is on the way!`,
          url: '/profile'
        })
      });

      if (res.ok) alert(`Push Notification sent to ${userName}!`);
      else if (res.status === 404) alert(`User ${userName} has not enabled Push Notifications on their device yet.`);
      else alert('Failed to send notification');
    } catch (e) {
      console.error(e);
      alert('Server Error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white p-6 fixed h-full z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-10 text-orange-500 font-bold text-2xl"><ChefHat /> Admin</div>
        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={<MapPin size={20} />} label="Logistics Map" active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} />
          <SidebarItem icon={<ShoppingBag size={20} />} label="Live Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={<Bike size={20} />} label="Fleet Manager" active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
          <SidebarItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Content Management</div>
          <SidebarItem icon={<Utensils size={20} />} label="Add-ons Menu" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          <SidebarItem icon={<CreditCard size={20} />} label="Sub. Plans" active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} />
          <SidebarItem icon={<Calendar size={20} />} label="Weekly Menu" active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} />
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="mt-auto flex items-center gap-2 text-red-400 font-bold pt-10"><LogOut size={16} /> Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 ml-64">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold capitalize">{activeTab === 'weekly' ? 'Weekly Menu Cycle' : activeTab}</h1>
          <div className="flex gap-2">
            {activeTab === 'fleet' && <button onClick={() => setIsAddingRider(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><UserPlus size={18} /> Add Rider</button>}
            {activeTab === 'menu' && <button onClick={() => setIsAddingDish(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Add Dish</button>}
          </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* STAT CARDS - POLISHED UI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Revenue" value={formatMoney(stats.revenue)} icon={<IndianRupee size={24} className="text-white" />} colorClass="bg-gradient-to-br from-green-500 to-green-600" />
                  <StatCard title="Total Orders" value={stats.totalOrders.toString()} icon={<ShoppingBag size={24} className="text-white" />} colorClass="bg-gradient-to-br from-blue-500 to-blue-600" />
                  <StatCard title="Pending Orders" value={stats.pending.toString()} icon={<Clock size={24} className="text-white" />} colorClass="bg-gradient-to-br from-red-500 to-red-600" />
                  <StatCard title="Active Fleet" value={stats.activeRiders.toString()} icon={<Bike size={24} className="text-white" />} colorClass="bg-gradient-to-br from-orange-500 to-orange-600" />
                </div>

                {/* NEW: REVENUE ANALYTICS CHART */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-lg border-b pb-4">
                    <TrendingUp size={20} className="text-orange-500" /> Last 7 Days Revenue
                  </div>
                  <div className="h-64 flex items-end gap-2 md:gap-4 overflow-x-auto pb-4">
                    {stats.chartData.map((data, i) => {
                      const maxVal = Math.max(...stats.chartData.map(d => d.total), 1);
                      const heightPercent = (data.total / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[40px]">
                          <div className="relative w-full flex justify-center h-[200px] items-end">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                              {formatMoney(data.total)}
                            </div>
                            {/* Bar */}
                            <div
                              className="w-full max-w-[40px] bg-orange-100 group-hover:bg-orange-200 transition-all rounded-t-lg relative overflow-hidden"
                              style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                            >
                              <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-orange-500 to-transparent opacity-20"></div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 rotate-[-45deg] origin-top-left mt-2">
                            {data.date.split('-').slice(1).join('/')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* LOGISTICS MAP */}
            {activeTab === 'logistics' && (
              <LogisticsMap orders={orders} />
            )}

            {/* LIVE ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.map((order) => {
                  const assignedRider = riders.find(r => r.phone === order.rider_phone);
                  return (
                    <div key={order.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">#{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span>
                        </div>
                        <h3 className="font-bold">{order.customer_name}</h3>
                        <p className="text-gray-500 text-sm mb-1">{order.address}</p>
                        <p className="font-mono text-xs text-gray-400">Items: {order.items?.length || 0} • Total: {formatMoney(order.total_amount)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        {order.rider_phone ? (
                          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                            <div className="text-right"><p className="text-xs text-gray-500 font-bold uppercase">Assigned Rider</p><p className="font-bold text-sm">{assignedRider?.name || order.rider_phone}</p></div>
                            {order.status !== 'Completed' && (<button onClick={() => unassignRider(order.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><XCircle size={20} /></button>)}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <select className="p-2 border rounded-lg text-sm font-bold bg-white" value={selectedRiders[order.id] || ""} onChange={(e) => setSelectedRiders({ ...selectedRiders, [order.id]: e.target.value })}>
                              <option value="">Select Rider...</option>
                              {riders.map(r => <option key={r.phone} value={r.phone}>{r.name} ({r.status})</option>)}
                            </select>
                            <button onClick={() => assignRider(order.id)} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold">Assign</button>
                          </div>
                        )}
                        {order.status !== 'Completed' && (<button onClick={() => updateOrderStatus(order.id, 'Completed')} className="text-green-600 text-xs font-bold hover:underline">Mark Completed Manually</button>)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* FLEET */}
            {activeTab === 'fleet' && (
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold uppercase"><tr><th className="p-4">Name</th><th className="p-4">Phone (ID)</th><th className="p-4">Status</th></tr></thead>
                  <tbody className="divide-y">{riders.map(r => (<tr key={r.phone}><td className="p-4 font-bold">{r.name}</td><td className="p-4">{r.phone}</td><td className="p-4 text-green-600 font-bold">{r.status}</td></tr>))}</tbody>
                </table>
              </div>
            )}

            {/* CUSTOMERS DIRECTORY */}
            {activeTab === 'customers' && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4 border-x border-gray-100">Contact</th>
                      <th className="p-4 border-x border-gray-100">Location</th>
                      <th className="p-4 text-right">Wallet Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customers.map(c => (
                      <tr key={c.phone} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{c.full_name}</td>
                        <td className="p-4 border-x border-gray-100 text-gray-600">{c.phone}</td>
                        <td className="p-4 border-x border-gray-100 bg-gray-50/50">{c.office}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="font-mono font-bold text-green-600 text-base">₹{c.balance}</span>

                            <button
                              onClick={() => sendTestNotification(c.id, c.full_name)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                              title="Send Push Notification"
                            >
                              <Bell size={14} /> Ping
                            </button>

                            <button
                              onClick={() => setTopUpModal({ isOpen: true, customerId: c.id, amount: "" })}
                              className="bg-gray-100 hover:bg-black hover:text-white transition-colors text-gray-700 p-1.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                              title="Add funds to wallet"
                            >
                              <Plus size={14} /> Add Funds
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold">No customers found (Generate orders to populate directory).</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ADD-ONS MENU */}
            {activeTab === 'menu' && (
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold uppercase"><tr><th className="p-4">Image</th><th className="p-4">Dish</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y">{menuItems.map(item => (<tr key={item.id}><td className="p-4">{item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><Utensils size={16} /></div>}</td><td className="p-4 font-bold">{item.name}</td><td className="p-4">₹{item.price}</td><td className="p-4"><button onClick={() => toggleStock(item.id, item.is_available)} className={`px-2 py-1 rounded text-xs font-bold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_available ? "In Stock" : "Out"}</button></td><td className="p-4 text-right"><button onClick={() => deleteItem(item.id)} className="text-red-500"><Trash2 size={18} /></button></td></tr>))}</tbody>
                </table>
              </div>
            )}

            {/* PLANS - USING SEPARATE COMPONENT TO FIX HOOK ERROR */}
            {activeTab === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onUpdate={fetchData} />
                ))}
              </div>
            )}

            {/* WEEKLY MENU - BI-WEEKLY LOGIC + VEG/NON-VEG COLUMNS */}
            {activeTab === 'weekly' && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-orange-800 flex items-center gap-2"><Calendar size={18} /> Manage Weekly Cycle</h3>
                    <p className="text-xs text-orange-600">
                      Customers see: <span className="font-bold bg-orange-200 px-1 rounded">Cycle {getRealWorldWeek()}</span>
                    </p>
                  </div>
                  {/* CYCLE TOGGLE */}
                  <div className="bg-white p-1 rounded-lg border flex text-xs font-bold shadow-sm">
                    <button
                      onClick={() => setSelectedCycle(1)}
                      className={`px-4 py-2 rounded-md transition-all flex flex-col items-center ${selectedCycle === 1 ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span>Cycle 1</span>
                      {getRealWorldWeek() === 1 && <span className="text-[9px] text-green-400">● LIVE</span>}
                    </button>
                    <button
                      onClick={() => setSelectedCycle(2)}
                      className={`px-4 py-2 rounded-md transition-all flex flex-col items-center ${selectedCycle === 2 ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span>Cycle 2</span>
                      {getRealWorldWeek() === 2 && <span className="text-[9px] text-green-400">● LIVE</span>}
                    </button>
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold uppercase">
                    <tr>
                      <th className="p-4 w-20">Day</th>
                      <th className="p-4">Base Meal (Common)</th>
                      <th className="p-4 text-green-700">Veg Hero</th>
                      <th className="p-4 text-red-700">Non-Veg Hero</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {/* FILTER BY SELECTED CYCLE */}
                    {weeklyMenu
                      .filter(d => d.week_number === selectedCycle)
                      .map((day) => (
                        <WeeklyMenuRow key={`${day.week_number}-${day.day_of_week}`} day={day} />
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* MODALS */}
        {isAddingRider && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4">Add Rider</h3>
              <div className="space-y-3">
                <input className="w-full border p-3 rounded-xl" placeholder="Name" onChange={e => setNewRider({ ...newRider, name: e.target.value })} />
                <input className="w-full border p-3 rounded-xl font-bold" placeholder="Phone (Login ID)" onChange={e => setNewRider({ ...newRider, phone: e.target.value })} />
                <input className="w-full border p-3 rounded-xl" type="password" placeholder="Password" onChange={e => setNewRider({ ...newRider, password: e.target.value })} />
                <button onClick={handleAddRider} className="w-full bg-black text-white p-3 rounded-xl font-bold">Onboard Rider</button>
                <button onClick={() => setIsAddingRider(false)} className="w-full text-gray-400 mt-2">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isAddingDish && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4">Add Dish</h3>
              <div className="space-y-3">
                <div className="relative"><input className="w-full border p-3 rounded-xl pl-10" placeholder="Image URL (https://...)" onChange={e => setNewItem({ ...newItem, image: e.target.value })} /><div className="absolute left-3 top-3.5 text-gray-400"><Utensils size={18} /></div></div>
                <input className="w-full border p-3 rounded-xl" placeholder="Dish Name" onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                <div className="flex gap-2"><input className="w-full border p-3 rounded-xl" type="number" placeholder="Price (₹)" onChange={e => setNewItem({ ...newItem, price: e.target.value })} /><select className="w-full border p-3 rounded-xl bg-white" onChange={e => setNewItem({ ...newItem, type: e.target.value })}><option value="Veg">Veg</option><option value="Non-Veg">Non-Veg</option></select></div>
                <button onClick={handleAddItem} className="w-full bg-black text-white p-3 rounded-xl font-bold">Save Dish</button>
                <button onClick={() => setIsAddingDish(false)} className="w-full text-gray-400 mt-2">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* WALLET TOP-UP MODAL */}
        {topUpModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setTopUpModal({ isOpen: false, customerId: "", amount: "" })} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"><XCircle size={24} /></button>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <h3 className="text-2xl font-bold text-center mb-1 text-gray-900">Add Wallet Funds</h3>
              <p className="text-gray-500 text-xs text-center font-bold uppercase tracking-wider mb-6">User Wallet Manager</p>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-4 font-bold text-gray-400 text-lg">₹</span>
                  <input
                    className="w-full border-2 border-gray-200 focus:border-green-500 outline-none p-4 pl-10 rounded-2xl font-black text-2xl text-gray-900 transition-colors"
                    type="number"
                    placeholder="0"
                    autoFocus
                    value={topUpModal.amount}
                    onChange={e => setTopUpModal({ ...topUpModal, amount: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 text-xs font-bold text-gray-500 justify-center">
                  <button onClick={() => setTopUpModal({ ...topUpModal, amount: "100" })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg">₹100</button>
                  <button onClick={() => setTopUpModal({ ...topUpModal, amount: "500" })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg">₹500</button>
                  <button onClick={() => setTopUpModal({ ...topUpModal, amount: "1000" })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg">₹1000</button>
                </div>
                <button onClick={handleTopUp} disabled={!topUpModal.amount} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-200 mt-4">
                  Proceed to Add Funds
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}