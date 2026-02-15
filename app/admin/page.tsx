"use client";
import { useEffect, useState, useMemo } from "react";
import { 
  ChefHat, Plus, Trash2, Loader2, LogOut, 
  ShoppingBag, Utensils, Clock, 
  LayoutDashboard, CreditCard, Bike, UserPlus, XCircle, 
  Calendar, Edit3, Save 
} from "lucide-react";

import { supabaseAdmin as supabase } from "../lib/supabaseAdminClient"; 
import { Session } from "@supabase/supabase-js";

// --- TYPES ---
type MenuItem = { 
  id: number; 
  name: string; 
  price: number; 
  type: string; 
  is_available: boolean; 
  description?: string; 
  image?: string; 
};

type Order = { 
  id: number; 
  created_at: string; 
  customer_name: string; 
  customer_phone: string; 
  address: string; 
  items: any[]; 
  total_amount: number; 
  status: string; 
  rider_phone: string | null; 
};

type Rider = { phone: string; name: string; status: string; };

type Plan = {
  id: string;
  name: string;
  base_price: number;
  description: string;
  type: string;
  features: string[];
};

// --- UPDATED TYPE FOR VEG/NON-VEG ---
type WeeklyMenu = {
  day_of_week: string;
  lunch_dish: string;     // The Base (Dal + Rice)
  veg_dish: string;       // Hero for Veg Plan (Paneer)
  non_veg_dish: string;   // Hero for Non-Veg Plan (Chicken) - Renamed from special_dish
  week_number: number;    // 1 or 2
};

const formatMoney = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// HELPER: Get Week Number (To show "Live" status)
function getRealWorldWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  return weekNum % 2 === 0 ? 2 : 1;
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'fleet' | 'plans' | 'weekly'>('overview');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu[]>([]);
  
  // NEW: State for Cycle Selection (1 or 2)
  const [selectedCycle, setSelectedCycle] = useState<1 | 2>(1);

  // Modals
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isAddingRider, setIsAddingRider] = useState(false);
  
  const [newItem, setNewItem] = useState({ name: "", price: "", type: "Veg", description: "", image: "" });
  const [newRider, setNewRider] = useState({ name: "", phone: "", password: "" });
  const [selectedRiders, setSelectedRiders] = useState<{[key:number]: string}>({});

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

    const sorter: {[key: string]: number} = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
    if (w) w.sort((a, b) => sorter[a.day_of_week] - sorter[b.day_of_week]);

    if (o) setOrders(o);
    if (m) setMenuItems(m);
    if (r) setRiders(r);
    if (p) setPlans(p);
    if (w) setWeeklyMenu(w);
  };

  const stats = useMemo(() => ({
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pending: orders.filter(o => o.status !== 'Completed').length,
    totalOrders: orders.length,
    activeRiders: riders.length
  }), [orders, riders]);

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
    if(!confirm("Unassign this rider?")) return;
    await supabase.from('orders').update({ rider_phone: null, status: 'Cooking' }).eq('id', orderId);
    fetchData();
  };
  const updateOrderStatus = async (id: number, status: string) => { await supabase.from('orders').update({ status }).eq('id', id); fetchData(); };
  const toggleStock = async (id: number, available: boolean) => { await supabase.from('menu_items').update({ is_available: !available }).eq('id', id); fetchData(); };
  const deleteItem = async (id: number) => { if(confirm("Delete dish?")) { await supabase.from('menu_items').delete().eq('id', id); fetchData(); } };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white p-6 fixed h-full z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-10 text-orange-500 font-bold text-2xl"><ChefHat /> Admin</div>
        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={<ShoppingBag size={20}/>} label="Live Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={<Bike size={20}/>} label="Fleet Manager" active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
          <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Content Management</div>
          <SidebarItem icon={<Utensils size={20}/>} label="Add-ons Menu" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          <SidebarItem icon={<CreditCard size={20}/>} label="Sub. Plans" active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} />
          <SidebarItem icon={<Calendar size={20}/>} label="Weekly Menu" active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} />
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="mt-auto flex items-center gap-2 text-red-400 font-bold pt-10"><LogOut size={16}/> Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 ml-64">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold capitalize">{activeTab === 'weekly' ? 'Weekly Menu Cycle' : activeTab}</h1>
            <div className="flex gap-2">
                {activeTab === 'fleet' && <button onClick={() => setIsAddingRider(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><UserPlus size={18}/> Add Rider</button>}
                {activeTab === 'menu' && <button onClick={() => setIsAddingDish(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Add Dish</button>}
            </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : (
          <>
            {activeTab === 'overview' && (
                <div className="grid grid-cols-4 gap-6">
                    <StatCard title="Revenue" value={formatMoney(stats.revenue)} icon={<CreditCard className="text-green-600"/>} />
                    <StatCard title="Riders" value={stats.activeRiders.toString()} icon={<Bike className="text-orange-600"/>} />
                    <StatCard title="Total Orders" value={stats.totalOrders.toString()} icon={<ShoppingBag className="text-blue-600"/>} />
                    <StatCard title="Pending" value={stats.pending.toString()} icon={<Clock className="text-red-600"/>} />
                </div>
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
                                   <select className="p-2 border rounded-lg text-sm font-bold bg-white" value={selectedRiders[order.id] || ""} onChange={(e) => setSelectedRiders({...selectedRiders, [order.id]: e.target.value})}>
                                       <option value="">Select Rider...</option>
                                       {riders.map(r => <option key={r.phone} value={r.phone}>{r.name} ({r.status})</option>)}
                                   </select>
                                   <button onClick={() => assignRider(order.id)} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold">Assign</button>
                               </div>
                           )}
                           {order.status !== 'Completed' && (<button onClick={() => updateOrderStatus(order.id, 'Completed')} className="text-green-600 text-xs font-bold hover:underline">Mark Completed Manually</button>)}
                       </div>
                     </div>
                 )})}
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

            {/* ADD-ONS MENU */}
            {activeTab === 'menu' && (
                <div className="bg-white rounded-2xl border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold uppercase"><tr><th className="p-4">Image</th><th className="p-4">Dish</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y">{menuItems.map(item => (<tr key={item.id}><td className="p-4">{item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><Utensils size={16}/></div>}</td><td className="p-4 font-bold">{item.name}</td><td className="p-4">₹{item.price}</td><td className="p-4"><button onClick={() => toggleStock(item.id, item.is_available)} className={`px-2 py-1 rounded text-xs font-bold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_available ? "In Stock" : "Out"}</button></td><td className="p-4 text-right"><button onClick={() => deleteItem(item.id)} className="text-red-500"><Trash2 size={18}/></button></td></tr>))}</tbody>
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
                            <h3 className="font-bold text-orange-800 flex items-center gap-2"><Calendar size={18}/> Manage Weekly Cycle</h3>
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
                        <input className="w-full border p-3 rounded-xl" placeholder="Name" onChange={e => setNewRider({...newRider, name: e.target.value})} />
                        <input className="w-full border p-3 rounded-xl font-bold" placeholder="Phone (Login ID)" onChange={e => setNewRider({...newRider, phone: e.target.value})} />
                        <input className="w-full border p-3 rounded-xl" type="password" placeholder="Password" onChange={e => setNewRider({...newRider, password: e.target.value})} />
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
                        <div className="relative"><input className="w-full border p-3 rounded-xl pl-10" placeholder="Image URL (https://...)" onChange={e => setNewItem({...newItem, image: e.target.value})} /><div className="absolute left-3 top-3.5 text-gray-400"><Utensils size={18}/></div></div>
                        <input className="w-full border p-3 rounded-xl" placeholder="Dish Name" onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        <div className="flex gap-2"><input className="w-full border p-3 rounded-xl" type="number" placeholder="Price (₹)" onChange={e => setNewItem({...newItem, price: e.target.value})} /><select className="w-full border p-3 rounded-xl bg-white" onChange={e => setNewItem({...newItem, type: e.target.value})}><option value="Veg">Veg</option><option value="Non-Veg">Non-Veg</option></select></div>
                        <button onClick={handleAddItem} className="w-full bg-black text-white p-3 rounded-xl font-bold">Save Dish</button>
                        <button onClick={() => setIsAddingDish(false)} className="w-full text-gray-400 mt-2">Cancel</button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (FIX FOR "RENDERED MORE HOOKS") ---

function PlanCard({ plan, onUpdate }: { plan: Plan; onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [localPlan, setLocalPlan] = useState(plan);

    const handleSave = async () => {
        await supabase.from('plans').update({ base_price: localPlan.base_price, description: localPlan.description }).eq('id', plan.id);
        setIsEditing(false); alert("Plan updated!"); onUpdate();
    };

    return (
        <div className={`bg-white p-6 rounded-2xl border transition-all ${isEditing ? 'border-orange-500 shadow-md' : 'border-gray-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`p-2 rounded-full ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-black hover:text-white'}`}>{isEditing ? <Save size={16} /> : <Edit3 size={16} />}</button>
            </div>
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase mb-4 inline-block">{plan.type}</span>
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Base Price (Per Day)</label>
                <div className="flex items-center gap-2"><span className="text-xl font-bold">₹</span><input type="number" disabled={!isEditing} className={`w-full border-b-2 outline-none p-1 font-bold text-2xl ${isEditing ? 'border-orange-500 bg-orange-50/50' : 'border-transparent bg-transparent'}`} value={isEditing ? localPlan.base_price : plan.base_price} onChange={(e) => setLocalPlan({...localPlan, base_price: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Short Description</label>
                <textarea disabled={!isEditing} className={`w-full p-2 rounded-lg text-sm resize-none ${isEditing ? 'bg-white border border-orange-200' : 'bg-gray-50 border-transparent'}`} rows={2} value={isEditing ? localPlan.description : plan.description} onChange={(e) => setLocalPlan({...localPlan, description: e.target.value})} />
            </div>
        </div>
    );
}

function WeeklyMenuRow({ day }: { day: WeeklyMenu }) {
    const [lunch, setLunch] = useState(day.lunch_dish);
    const [veg, setVeg] = useState(day.veg_dish);        // NEW STATE
    const [nonVeg, setNonVeg] = useState(day.non_veg_dish); // NEW STATE (Renamed from special)

    const handleSave = async () => {
        // Upsert to support both weeks
        const { error } = await supabase.from('weekly_menu').upsert({ 
            day_of_week: day.day_of_week, 
            lunch_dish: lunch, 
            veg_dish: veg,           // SAVE VEG
            non_veg_dish: nonVeg,    // SAVE NON-VEG
            week_number: day.week_number 
        }, { onConflict: 'week_number,day_of_week' });
        
        if(error) alert("Error saving menu: " + error.message); else alert(`Saved Cycle ${day.week_number}: ${day.day_of_week}`);
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="p-4"><div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">{day.day_of_week}</div></td>
            
            {/* LUNCH (BASE) INPUT */}
            <td className="p-4">
                <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-orange-500 outline-none py-2 font-medium" 
                value={lunch || ''} 
                placeholder="e.g. Dal Tadka + Rice" 
                onChange={(e) => setLunch(e.target.value)} />
            </td>

            {/* VEG HERO INPUT */}
            <td className="p-4">
                <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-green-500 outline-none py-2 text-green-700 font-bold" 
                value={veg || ''} 
                placeholder="Paneer..." 
                onChange={(e) => setVeg(e.target.value)} />
            </td>

            {/* NON-VEG HERO INPUT */}
            <td className="p-4">
                <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-red-500 outline-none py-2 text-red-700 font-bold" 
                value={nonVeg || ''} 
                placeholder="Chicken..." 
                onChange={(e) => setNonVeg(e.target.value)} />
            </td>

            <td className="p-4 text-right">
                <button onClick={handleSave} className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ml-auto"><Save size={14}/> Save</button>
            </td>
        </tr>
    );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${active ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>{icon} {label}</button>;
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: any }) {
    return <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-32"><div className="flex justify-between items-start"><span className="text-gray-500 font-bold text-sm">{title}</span><div className="p-2 bg-gray-50 rounded-lg">{icon}</div></div><h3 className="text-2xl font-bold text-gray-900">{value}</h3></div>;
}