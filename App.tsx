
import React, { useState, useEffect, useMemo } from 'react';

// --- BRAND COMPONENTS ---

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };
  
  return (
    <div className={`${dimensions[size]} relative flex-shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <circle cx="50" cy="50" r="48" fill="#1c1c14" />
        <text 
          x="46" 
          y="65" 
          fontFamily="Inter, sans-serif" 
          fontWeight="900" 
          fontSize="42" 
          fill="#f2f2f0" 
          textAnchor="middle"
        >M</text>
        <circle cx="68" cy="62" r="4" fill="#f2f2f0" />
        <path 
          d="M72 52 C72 52 82 52 82 62 C82 72 72 72 72 72 C72 72 65 72 65 62 C65 52 72 52 72 52 Z" 
          fill="#a6c238" 
          transform="rotate(-15, 75, 62)"
        />
      </svg>
    </div>
  );
};

// --- TYPY ---

interface User {
  name: string;
  role: 'customer' | 'admin';
  password?: string;
  email?: string;
  phone?: string;
  address?: string;
  region?: string;
}

interface OrderItem {
  microgreenId: string;
  weight: number;
  quantity: number;
}

interface Order {
  id: string;
  restaurantName: string;
  items: OrderItem[];
  timestamp: number;
  deliveryDate: string;
  isDelivered?: boolean;
}

interface Microgreen {
  id: string;
  name: string;
  description: string;
  image: string;
  availableWeights: number[];
  unit: 'g' | 'ks';
  isAvailable: boolean;
}

// --- KONŠTANTY ---

const DELIVERY_SCHEDULE: Record<string, string> = {
  'Bratislava a okolie': 'Pondelok',
  'Trenčín a okolie': 'Štvrtok',
  'Nezaradené': 'Pondelok'
};

const DEFAULT_MICROGREENS: Microgreen[] = [
  {
    id: 'radish-sango',
    name: 'Reďkovka Sango',
    description: 'Nádherná tmavofialová farba a intenzívna pikantná chuť.',
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=400',
    availableWeights: [50, 100],
    unit: 'g',
    isAvailable: true
  },
  {
    id: 'radish-china',
    name: 'Reďkovka China Rose',
    description: 'Svieža chuť s ružovými stonkami, skvelá k mäsu.',
    image: 'https://images.unsplash.com/photo-1622484211148-716499368181?auto=format&fit=crop&q=80&w=400',
    availableWeights: [50, 100],
    unit: 'g',
    isAvailable: true
  },
  {
    id: 'sunflower',
    name: 'Slnečnica',
    description: 'Orechová chuť, sladká a mimoriadne chrumkavá.',
    image: 'https://images.unsplash.com/photo-1592144702958-8687a74959a4?auto=format&fit=crop&q=80&w=400',
    availableWeights: [50, 100],
    unit: 'g',
    isAvailable: true
  }
];

// --- POMOCNÉ FUNKCIE ---

const getNextDeliveryDate = (region: string) => {
  const dayName = DELIVERY_SCHEDULE[region] || 'Pondelok';
  const targetDay = dayName === 'Pondelok' ? 1 : 4; 
  let d = new Date();
  if (d.getDay() === targetDay) { d.setDate(d.getDate() + 7); } 
  else { while (d.getDay() !== targetDay) { d.setDate(d.getDate() + 1); } }
  return d.toLocaleDateString('sk-SK');
};

const getSmartCurrentAdminDay = () => {
  const d = new Date();
  const day = d.getDay(); 
  if (day === 1) return { region: 'Bratislava a okolie', date: d.toLocaleDateString('sk-SK') };
  if (day >= 2 && day <= 4) {
    let target = new Date();
    while (target.getDay() !== 4) target.setDate(target.getDate() + 1);
    return { region: 'Trenčín a okolie', date: target.toLocaleDateString('sk-SK') };
  }
  let target = new Date();
  while (target.getDay() !== 1) target.setDate(target.getDate() + 1);
  return { region: 'Bratislava a okolie', date: target.toLocaleDateString('sk-SK') };
};

const getUpcomingDates = (count = 10) => {
  const dates: string[] = [];
  let d = new Date();
  for (let i = 0; i < 30; i++) {
    if (d.getDay() === 1 || d.getDay() === 4) {
      dates.push(d.toLocaleDateString('sk-SK'));
      if (dates.length >= count) break;
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

const App: React.FC = () => {
  // State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mnf_users_v14');
    return saved ? JSON.parse(saved) : [{ name: 'marek', role: 'admin', password: 'marekmnf' }];
  });
  
  const [session, setSession] = useState<User | null>(() => {
    const s = localStorage.getItem('mnf_session_v14');
    return s ? JSON.parse(s) : null;
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('mnf_orders_v14');
    return saved ? JSON.parse(saved) : [];
  });

  const [microgreens, setMicrogreens] = useState<Microgreen[]>(() => {
    const saved = localStorage.getItem('mnf_products_v15');
    return saved ? JSON.parse(saved) : DEFAULT_MICROGREENS;
  });

  const [harvestedStatus, setHarvestedStatus] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mnf_harvested_v8');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [view, setView] = useState<'login' | 'register' | 'main' | 'admin_restaurants' | 'delivery_plan' | 'admin_products' | 'profile' | 'history'>('login');
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  const smartAdmin = useMemo(() => getSmartCurrentAdminDay(), []);
  const [adminFilterDate, setAdminFilterDate] = useState<string>(smartAdmin.date);
  const [deliveryRegion, setDeliveryRegion] = useState<string>(smartAdmin.region);
  
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [regForm, setRegForm] = useState<User>({ name: '', role: 'customer', password: '', email: '', phone: '', address: '', region: 'Bratislava a okolie' });
  
  const [showMenu, setShowMenu] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Microgreen | null>(null);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [productToDelete, setProductToDelete] = useState<Microgreen | null>(null);

  const [partnerToDelete, setPartnerToDelete] = useState<User | null>(null);
  const [confirmDeletePassword, setConfirmDeletePassword] = useState('');

  // Persistence
  useEffect(() => localStorage.setItem('mnf_users_v14', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('mnf_orders_v14', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('mnf_products_v15', JSON.stringify(microgreens)), [microgreens]);
  useEffect(() => localStorage.setItem('mnf_harvested_v8', JSON.stringify(harvestedStatus)), [harvestedStatus]);
  
  useEffect(() => {
    if (session) {
      localStorage.setItem('mnf_session_v14', JSON.stringify(session));
      if (view === 'login' || view === 'register') setView('main');
    } else {
      localStorage.removeItem('mnf_session_v14');
      if (view !== 'register') setView('login');
    }
  }, [session]);

  // --- ACTIONS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = users.find(u => u.name.toLowerCase() === loginForm.name.toLowerCase() && u.password === loginForm.password);
    if (found) setSession(found);
    else setLoginError('Nesprávne heslo alebo meno.');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.name.toLowerCase() === regForm.name.toLowerCase())) {
      alert("Meno je už obsadené.");
      return;
    }
    const newUser: User = { ...regForm, role: 'customer' };
    setUsers(prev => [...prev, newUser]);
    setSession(newUser);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setUsers(prev => prev.map(u => u.name === session.name ? session : u));
    alert("Zmeny uložené.");
    setView('main');
  };

  const logout = () => { setSession(null); setShowMenu(false); setCart([]); setView('login'); };

  const sendOrder = () => {
    if (!cart.length || !session) return;
    const deliveryDate = getNextDeliveryDate(session.region || 'Nezaradené');
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      restaurantName: session.name,
      items: [...cart],
      timestamp: Date.now(),
      deliveryDate,
      isDelivered: false
    };
    setOrders(prev => [...prev, newOrder]);
    setCart([]);
    alert(`Objednávka odoslaná na termín ${deliveryDate}`);
  };

  const toggleHarvested = (microgreenId: string, weight: number) => {
    const key = `${adminFilterDate}_${microgreenId}_${weight}`;
    setHarvestedStatus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (editingProduct.availableWeights.length === 0) {
      alert("Pridajte aspoň jednu gramáž/počet.");
      return;
    }
    if (microgreens.find(p => p.id === editingProduct.id)) {
      setMicrogreens(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    } else {
      setMicrogreens(prev => [...prev, { ...editingProduct, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setEditingProduct(null);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      setMicrogreens(prev => prev.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const handleDeletePartner = () => {
    if (confirmDeletePassword === session?.password) {
      setUsers(prev => prev.filter(u => u.name !== partnerToDelete?.name));
      setPartnerToDelete(null);
      setConfirmDeletePassword('');
      alert("Partner bol úspešne odstránený.");
    } else {
      alert("Nesprávne administrátorské heslo!");
    }
  };

  const addSize = () => {
    const val = parseInt(newSizeInput);
    if (isNaN(val) || val <= 0) return;
    if (editingProduct && !editingProduct.availableWeights.includes(val)) {
      setEditingProduct({
        ...editingProduct,
        availableWeights: [...editingProduct.availableWeights, val].sort((a,b) => a-b)
      });
    }
    setNewSizeInput('');
  };

  const removeSize = (val: number) => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        availableWeights: editingProduct.availableWeights.filter(w => w !== val)
      });
    }
  };

  const toggleAvailability = (id: string) => {
    setMicrogreens(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
  };

  const toggleDelivered = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isDelivered: !o.isDelivered } : o));
  };

  const addToCart = (id: string, weight: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.microgreenId === id && i.weight === weight);
      if (existing) return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { microgreenId: id, weight, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string, weight: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.microgreenId === id && i.weight === weight);
      if (existing && existing.quantity > 1) return prev.map(i => i === existing ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => !(i.microgreenId === id && i.weight === weight));
    });
  };

  const handleAdminDateChange = (newDate: string) => {
    setAdminFilterDate(newDate);
    const [d, m, y] = newDate.split('.').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    setDeliveryRegion(day === 1 ? 'Bratislava a okolie' : 'Trenčín a okolie');
  };

  const openInMaps = (address: string) => {
    if (!address) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  // --- LOGIKA RADENIA TRASY ---

  const deliveryPlanOrders = useMemo(() => {
    const filtered = orders.filter(o => {
      const user = users.find(u => u.name === o.restaurantName);
      return o.deliveryDate === adminFilterDate && user?.region === deliveryRegion;
    });

    return filtered.sort((a, b) => {
      const userA = users.find(u => u.name === a.restaurantName);
      const userB = users.find(u => u.name === b.restaurantName);
      const addrA = (userA?.address || '').toLowerCase();
      const addrB = (userB?.address || '').toLowerCase();

      if (deliveryRegion === 'Trenčín a okolie') {
        const isNDA = addrA.includes('dubnica');
        const isNDB = addrB.includes('dubnica');
        if (isNDA && !isNDB) return -1;
        if (!isNDA && isNDB) return 1;
      }
      return addrA.localeCompare(addrB);
    });
  }, [orders, adminFilterDate, deliveryRegion, users]);

  const adminSummary = useMemo(() => {
    const filtered = orders.filter(o => o.deliveryDate === adminFilterDate);
    const summary: Record<string, { total: number, breakdown: Record<number, number> }> = {};
    microgreens.forEach(g => summary[g.id] = { total: 0, breakdown: {} });
    filtered.forEach(o => {
      o.items.forEach(it => {
        if (summary[it.microgreenId]) {
          summary[it.microgreenId].total += it.quantity;
          summary[it.microgreenId].breakdown[it.weight] = (summary[it.microgreenId].breakdown[it.weight] || 0) + it.quantity;
        }
      });
    });
    return summary;
  }, [orders, adminFilterDate, microgreens]);

  const allAvailableDates = useMemo(() => {
    const datesFromOrders = orders.map(o => o.deliveryDate);
    const upcoming = getUpcomingDates();
    return [...new Set([...datesFromOrders, ...upcoming])].sort((a, b) => {
      const parse = (s: string) => { const [d,m,y] = s.split('.').map(Number); return new Date(y,m-1,d).getTime(); };
      return parse(a) - parse(b);
    });
  }, [orders]);

  // --- VIEWS ---

  if (view === 'login') return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-md text-center border border-stone-200 animate-in zoom-in duration-300">
        <Logo size="lg" className="mx-auto mb-6 flex justify-center" />
        <h1 className="text-3xl font-black mb-1 text-stone-900 tracking-tighter uppercase">MNF greens</h1>
        <p className="text-stone-400 font-medium mb-8 text-sm">Prihlásenie partnera</p>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#a6c238]" placeholder="Meno reštaurácie" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} required />
          <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#a6c238]" type="password" placeholder="Heslo" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
          {loginError && <p className="text-rose-500 text-xs font-bold text-center py-2">{loginError}</p>}
          <button type="submit" className="w-full bg-[#1c1c14] text-white font-black py-4 rounded-2xl shadow-lg mt-4 transition-all active:scale-95">Vstúpiť</button>
        </form>
        <button onClick={() => setView('register')} className="mt-6 text-[#a6c238] font-bold text-sm w-full">Vytvoriť nový účet</button>
      </div>
    </div>
  );

  if (view === 'register') return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 py-8">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg border border-stone-200 animate-in slide-in-from-bottom-6 duration-400">
        <div className="flex justify-center mb-4"><Logo size="md" /></div>
        <h2 className="text-3xl font-black mb-2 text-stone-900 tracking-tighter text-center">Registrácia partnera</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none" placeholder="Meno reštaurácie" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} required />
          <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none" type="password" placeholder="Heslo" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} required />
          <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none" placeholder="Email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} required />
          <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none" placeholder="Telefón" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} required />
          <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none" value={regForm.region} onChange={e => setRegForm({...regForm, region: e.target.value})}>
            <option value="Bratislava a okolie">Bratislava a okolie (Pondelok)</option>
            <option value="Trenčín a okolie">Trenčín a okolie (Štvrtok)</option>
          </select>
          <textarea className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold h-24 outline-none" placeholder="Presná adresa pre kuriéra" value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})} required />
          <button type="submit" className="w-full bg-[#1c1c14] text-white font-black py-4 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all">Dokončiť</button>
          <button type="button" onClick={() => setView('login')} className="w-full text-stone-400 font-bold text-sm mt-4">Návrat</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col relative">
      <nav className="h-20 bg-white border-b sticky top-0 z-[100] flex items-center justify-between px-4 md:px-12 shadow-sm">
        <div className="flex items-center gap-3 font-black text-xl md:text-2xl tracking-tighter text-stone-900 cursor-pointer" onClick={() => setView('main')}>
          <Logo size="sm" />
          MNF<span className="text-[#a6c238]">greens</span>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-stone-50 text-stone-400 flex items-center justify-center transition-colors">
          <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
        </button>
        {showMenu && (
          <div className="absolute right-4 top-16 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-[110] animate-in slide-in-from-top-2 duration-200" onClick={() => setShowMenu(false)}>
            <div className="p-5 border-b bg-stone-50">
              <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest">{session?.role === 'admin' ? 'Administrátor' : 'Partner'}</p>
              <p className="font-black text-stone-900 truncate">{session?.name}</p>
            </div>
            <div className="p-2">
              {session?.role === 'admin' ? (
                <>
                  <button onClick={() => setView('main')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-chart-line text-[#a6c238]"></i> Zberný panel</button>
                  <button onClick={() => setView('delivery_plan')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-route text-[#a6c238]"></i> Rozvoz</button>
                  <button onClick={() => setView('admin_products')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-seedling text-[#a6c238]"></i> Produkty</button>
                  <button onClick={() => setView('admin_restaurants')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-utensils text-[#a6c238]"></i> Partneri</button>
                  <button onClick={() => setView('history')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-history text-[#a6c238]"></i> História</button>
                </>
              ) : (
                <>
                  <button onClick={() => setView('main')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-leaf text-[#a6c238]"></i> Ponuka</button>
                  <button onClick={() => setView('history')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-clock-rotate-left text-[#a6c238]"></i> Objednávky</button>
                  <button onClick={() => setView('profile')} className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center gap-3 font-bold text-stone-600"><i className="fa-solid fa-user-gear text-[#a6c238]"></i> Môj profil</button>
                </>
              )}
              <button onClick={logout} className="w-full text-left p-3 hover:bg-rose-50 rounded-xl flex items-center gap-3 font-bold text-rose-500 border-t mt-2 transition-all"><i className="fa-solid fa-power-off"></i> Odhlásiť</button>
            </div>
          </div>
        )}
      </nav>

      <main className={`max-w-7xl mx-auto w-full p-4 md:p-12 flex-grow transition-all duration-300 ${cart.length > 0 ? 'pb-80' : 'pb-12'}`}>
        
        {/* CUSTOMER VIEW */}
        {session?.role === 'customer' && view === 'main' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-[#1c1c14] text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl mb-12 border-b-8 border-[#a6c238]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#a6c238] rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fa-solid fa-truck-fast"></i></div>
                <div>
                  <h3 className="text-xl font-black">{session.region}</h3>
                  <p className="text-stone-400 text-sm">Váš rozvozný deň: <span className="text-[#a6c238] font-bold">{DELIVERY_SCHEDULE[session.region || 'Nezaradené']}</span></p>
                </div>
              </div>
              <div className="text-center md:text-right border-t border-stone-800 pt-4">
                <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Najbližší rozvoz</p>
                <p className="text-2xl font-black">{getNextDeliveryDate(session.region || 'Nezaradené')}</p>
              </div>
            </div>

            <h2 className="text-3xl font-black text-stone-900 tracking-tighter mb-8">Čerstvá ponuka</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {microgreens.map(g => (
                <div key={g.id} className={`bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all relative ${!g.isAvailable ? 'opacity-70' : ''}`}>
                  {!g.isAvailable && (
                    <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                      <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl font-black text-stone-900 uppercase">Aktuálne nedostupné</div>
                    </div>
                  )}
                  <div className="h-56 overflow-hidden">
                    <img src={g.image} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" alt={g.name} />
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-black text-stone-900 mb-1">{g.name}</h3>
                    <p className="text-xs text-stone-400 mb-6 leading-relaxed line-clamp-2">{g.description}</p>
                    <div className="space-y-3">
                      {g.isAvailable && g.availableWeights.map(w => {
                        const it = cart.find(c => c.microgreenId === g.id && c.weight === w);
                        return (
                          <div key={w} className="flex justify-between items-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                            <span className="font-bold text-stone-600">{w}{g.unit}</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => removeFromCart(g.id, w)} className="w-9 h-9 rounded-xl border flex items-center justify-center bg-white hover:bg-stone-50 active:scale-90 transition-all"><i className="fa-solid fa-minus text-[10px]"></i></button>
                              <span className="font-black text-[#a6c238] w-6 text-center">{it?.quantity || 0}</span>
                              <button onClick={() => addToCart(g.id, w)} className="w-9 h-9 rounded-xl bg-[#a6c238] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><i className="fa-solid fa-plus text-[10px]"></i></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-60"></div>

            {cart.length > 0 && (
              <div className="fixed bottom-6 left-0 right-0 px-4 md:px-0 flex justify-center z-[150] animate-in slide-in-from-bottom-10">
                <button onClick={sendOrder} className="w-full max-w-lg bg-[#1c1c14] text-white py-5 md:py-6 rounded-[2rem] font-black text-lg shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex justify-between px-10 items-center hover:bg-stone-800 ring-8 ring-white/90 backdrop-blur-sm active:scale-95 transition-all">
                  <span className="tracking-tight uppercase text-sm md:text-base">Odoslať objednávku</span>
                  <span className="bg-[#a6c238] px-4 py-1.5 rounded-2xl text-xs md:text-sm font-black">{cart.reduce((a,b)=>a+b.quantity,0)} ks</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD (ZBERNÝ PANEL) */}
        {session?.role === 'admin' && view === 'main' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-black mb-8 tracking-tighter text-stone-900">Zberný panel</h2>
            <div className="mb-8 flex flex-wrap gap-2">
              <select className="p-4 bg-white border border-stone-200 rounded-2xl font-black shadow-sm outline-none" value={adminFilterDate} onChange={e => handleAdminDateChange(e.target.value)}>
                {allAvailableDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="px-6 py-4 bg-stone-100 text-stone-600 font-black rounded-2xl border border-stone-200 text-xs flex items-center uppercase tracking-widest">{deliveryRegion}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {microgreens.map(g => {
                const data = adminSummary[g.id];
                if (!data || data.total === 0) return null;
                return (
                  <div key={g.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-stone-900 mb-4 truncate">{g.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-stone-50">
                      <span className="text-4xl font-black text-[#a6c238] tracking-tighter">{data.total}</span>
                      <span className="text-[10px] font-black text-stone-300 uppercase">ks spolu</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(data.breakdown).map(([w, c]) => {
                        const isHarvested = harvestedStatus[`${adminFilterDate}_${g.id}_${w}`];
                        return (
                          <div key={w} onClick={() => toggleHarvested(g.id, parseInt(w))} className={`flex justify-between items-center p-4 rounded-2xl font-bold cursor-pointer transition-all ${isHarvested ? 'bg-stone-50 text-stone-300 opacity-60' : 'bg-stone-50 text-stone-600 hover:bg-[#f8fbe4]'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${isHarvested ? 'bg-[#a6c238] border-[#a6c238]' : 'border-stone-200 bg-white'}`}>{isHarvested && <i className="fa-solid fa-check text-white text-[10px]"></i>}</div>
                              <span className={isHarvested ? 'line-through text-xs' : 'text-sm'}>{w}{g.unit}</span>
                            </div>
                            <span className={isHarvested ? 'line-through text-xs' : 'text-[#a6c238]'}>x{c as number}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DELIVERY PLAN (ROZVOZ) */}
        {session?.role === 'admin' && view === 'delivery_plan' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-black mb-8 tracking-tighter text-stone-900">Plán rozvozu</h2>
            <div className="space-y-6">
              {deliveryPlanOrders.map((o, idx) => {
                const restaurant = users.find(u => u.name === o.restaurantName);
                return (
                  <div key={o.id} className={`p-8 bg-white border border-stone-100 rounded-[3rem] shadow-sm flex flex-col lg:flex-row justify-between gap-8 transition-all ${o.isDelivered ? 'opacity-40 grayscale' : 'hover:shadow-xl'}`}>
                    <div className="flex gap-6 items-start flex-grow">
                      <div className="w-12 h-12 bg-[#1c1c14] text-white rounded-2xl flex items-center justify-center font-black flex-shrink-0 text-xl">{idx + 1}</div>
                      <div>
                        <h4 className="text-2xl font-black text-stone-900 mb-1">{o.restaurantName}</h4>
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-4 group cursor-pointer hover:bg-[#f8fbe4] transition-all" onClick={() => openInMaps(restaurant?.address || '')}>
                           <p className="text-stone-700 font-black text-sm flex items-center gap-3">
                            <i className="fa-solid fa-location-arrow text-[#a6c238]"></i>
                            {restaurant?.address}
                          </p>
                          <p className="text-[10px] text-[#a6c238] font-black mt-1 uppercase tracking-widest">Kliknite pre navigáciu</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {o.items.map((it, i) => {
                            const product = microgreens.find(g => g.id === it.microgreenId);
                            return (
                              <span key={i} className="px-4 py-2 bg-white text-stone-600 rounded-xl text-xs font-black border border-stone-200 shadow-sm">
                                {product?.name}: <span className="text-[#a6c238]">{it.quantity}x {it.weight}{product?.unit}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-64">
                      <button onClick={() => openInMaps(restaurant?.address || '')} className="flex-grow py-4 bg-stone-100 text-stone-600 rounded-2xl font-black text-xs flex items-center justify-center gap-3 active:scale-95 transition-all">
                        <i className="fa-solid fa-map-marked-alt text-[#a6c238]"></i> Navigovať
                      </button>
                      <button onClick={() => toggleDelivered(o.id)} className={`flex-grow py-4 rounded-2xl font-black text-xs transition-all active:scale-95 ${o.isDelivered ? 'bg-stone-50 text-stone-300' : 'bg-[#1c1c14] text-white shadow-xl'}`}>
                        {o.isDelivered ? 'Doručené ✓' : 'Potvrdiť odovzdanie'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {deliveryPlanOrders.length === 0 && <div className="text-center py-32 text-stone-300 italic font-medium">Na vybraný deň nie sú žiadne objednávky.</div>}
            </div>
          </div>
        )}

        {/* PARTNERI (ADMIN ONLY) */}
        {session?.role === 'admin' && view === 'admin_restaurants' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-stone-900 tracking-tighter mb-10">Naši Partneri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.filter(u => u.role === 'customer').map(u => (
                <div key={u.name} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm hover:shadow-2xl transition-all flex flex-col relative group">
                  <button onClick={() => setPartnerToDelete(u)} className="absolute top-6 right-6 w-10 h-10 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white">
                    <i className="fa-solid fa-user-minus text-xs"></i>
                  </button>
                  <h3 className="text-2xl font-black text-stone-900 mb-6">{u.name}</h3>
                  <div className="space-y-4 text-stone-500 mb-10 flex-grow">
                    <div className="flex items-start gap-4">
                      <i className="fa-solid fa-map-pin mt-1 text-[#a6c238]"></i>
                      <p className="font-bold text-sm leading-relaxed">{u.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <i className="fa-solid fa-phone-flip text-[#a6c238]"></i>
                      <p className="font-bold text-sm">{u.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => openInMaps(u.address || '')} className="py-4 bg-stone-50 text-stone-600 rounded-2xl font-black text-[10px] flex items-center justify-center gap-3 transition-colors hover:bg-stone-100">
                      <i className="fa-solid fa-compass"></i> Mapa
                    </button>
                    <button onClick={() => { setDeliveryRegion(u.region!); setAdminFilterDate(getNextDeliveryDate(u.region!)); setView('delivery_plan'); }} className="py-4 bg-[#1c1c14] text-white rounded-2xl font-black text-[10px] shadow-lg active:scale-95 transition-all">Rozvoz</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUKTY (ADMIN ONLY) */}
        {session?.role === 'admin' && view === 'admin_products' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Produkty</h2>
              <button onClick={() => setEditingProduct({ id: '', name: '', description: '', image: '', availableWeights: [], unit: 'g', isAvailable: true })} className="bg-[#1c1c14] text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-stone-800 active:scale-95 transition-all text-sm">+ Nová bylinka</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {microgreens.map(p => (
                <div key={p.id} className={`bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col ${!p.isAvailable ? 'opacity-60 grayscale' : ''}`}>
                  <div className="h-44 rounded-3xl overflow-hidden mb-6 relative group">
                    <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg ${p.isAvailable ? 'bg-[#a6c238] text-white' : 'bg-stone-500 text-white'}`}>{p.isAvailable ? 'AKTÍVNE' : 'SKRYTÉ'}</div>
                  </div>
                  <h3 className="text-xl font-black text-stone-900 mb-2">{p.name}</h3>
                  <div className="mt-auto space-y-3">
                    <button onClick={() => toggleAvailability(p.id)} className={`w-full py-4 rounded-2xl font-black text-xs transition-all ${p.isAvailable ? 'bg-amber-50 text-amber-600' : 'bg-[#f8fbe4] text-[#a6c238]'}`}>{p.isAvailable ? 'Dočasne skryť' : 'Zobraziť v ponuke'}</button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setEditingProduct(p)} className="py-4 bg-stone-50 text-stone-500 rounded-2xl font-black text-xs transition-colors hover:bg-stone-100">Upraviť</button>
                      <button onClick={() => setProductToDelete(p)} className="py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs transition-colors hover:bg-rose-100"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE / HISTORY */}
        {view === 'profile' && session && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-stone-900 tracking-tighter mb-10 text-center">Môj profil</h2>
            <form onSubmit={handleUpdateProfile} className="bg-white p-12 rounded-[3rem] border border-stone-100 shadow-2xl space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-300 uppercase ml-4">Meno reštaurácie</label>
                <input disabled className="w-full p-5 bg-stone-100 border border-stone-200 rounded-2xl font-bold text-stone-400" value={session.name} />
              </div>
              <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#a6c238]" placeholder="Email" value={session.email || ''} onChange={e => setSession({...session, email: e.target.value})} required />
              <input className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#a6c238]" placeholder="Telefón" value={session.phone || ''} onChange={e => setSession({...session, phone: e.target.value})} required />
              <textarea className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl font-bold h-32 outline-none focus:ring-2 focus:ring-[#a6c238]" placeholder="Adresa" value={session.address || ''} onChange={e => setSession({...session, address: e.target.value})} required />
              <button type="submit" className="w-full bg-[#1c1c14] text-white py-5 rounded-2xl font-black text-lg active:scale-95 shadow-xl transition-all">Uložiť zmeny</button>
            </form>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <h2 className="text-3xl font-black text-stone-900 tracking-tighter mb-10">Archív objednávok</h2>
            <div className="space-y-12">
              {allAvailableDates.slice().reverse().map(d => {
                const dayOrders = orders.filter(o => o.deliveryDate === d && (session?.role === 'admin' || o.restaurantName === session?.name));
                if (dayOrders.length === 0) return null;
                return (
                  <div key={d}>
                    <div className="flex items-center gap-6 mb-8"><div className="px-6 py-3 bg-[#a6c238] text-white rounded-2xl font-black shadow-lg text-sm">{d}</div><div className="h-px bg-stone-200 flex-grow opacity-50"></div></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {dayOrders.map(o => (
                        <div key={o.id} className="p-8 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                            <div><h4 className="text-xl font-black text-stone-900 mb-1">{o.restaurantName}</h4><p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{new Date(o.timestamp).toLocaleTimeString('sk-SK')}</p></div>
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm ${o.isDelivered ? 'bg-stone-100 text-stone-500' : 'bg-[#f8fbe4] text-[#a6c238]'}`}>{o.isDelivered ? 'DORUČENÉ' : 'V PRÍPRAVE'}</span>
                          </div>
                          <div className="space-y-3 border-t pt-6">
                            {o.items.map((it, i) => {
                              const product = microgreens.find(g => g.id === it.microgreenId);
                              return (
                                <div key={i} className="flex justify-between text-sm font-bold text-stone-600">
                                  <span className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-300 rounded-full"></div>{product?.name}</span>
                                  <span className="text-[#a6c238] font-black">{it.quantity}x {it.weight}{product?.unit}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: DELETE PRODUCT CONFIRMATION */}
      {productToDelete && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-6" onClick={() => setProductToDelete(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 className="text-2xl font-black text-stone-800 mb-2">Vymazať?</h3>
            <p className="text-xs text-stone-400 font-medium mb-8 leading-relaxed px-4">Naozaj chcete odstrániť bylinku <span className="text-stone-800 font-black">"{productToDelete.name}"</span>?</p>
            <div className="space-y-2">
              <button onClick={confirmDeleteProduct} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl active:scale-95 transition-all shadow-xl">Áno, odstrániť</button>
              <button onClick={() => setProductToDelete(null)} className="w-full py-4 bg-stone-50 text-stone-400 font-black rounded-2xl">Zrušiť</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PARTNER CONFIRMATION (WITH PASSWORD) */}
      {partnerToDelete && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-6" onClick={() => {setPartnerToDelete(null); setConfirmDeletePassword('');}}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-stone-900 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl">
              <i className="fa-solid fa-user-slash"></i>
            </div>
            <h3 className="text-xl font-black text-stone-800 mb-2">Odstrániť partnera</h3>
            <p className="text-xs text-stone-400 font-medium mb-6 leading-relaxed px-4">Zadajte svoje heslo pre zmazanie partnera <span className="text-stone-800 font-black">"{partnerToDelete.name}"</span>:</p>
            <input 
              type="password" 
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl font-bold mb-6 text-center outline-none focus:ring-2 focus:ring-rose-500" 
              placeholder="Zadajte vaše heslo"
              value={confirmDeletePassword}
              onChange={e => setConfirmDeletePassword(e.target.value)}
            />
            <div className="space-y-2">
              <button onClick={handleDeletePartner} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl active:scale-95 transition-all shadow-xl">Potvrdiť zmazanie</button>
              <button onClick={() => {setPartnerToDelete(null); setConfirmDeletePassword('');}} className="w-full py-4 bg-stone-50 text-stone-400 font-black rounded-2xl">Zrušiť</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT EDITOR */}
      {editingProduct && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden" onClick={() => setEditingProduct(null)}>
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] md:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-20 max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 pb-2 flex justify-between items-center border-b border-stone-50">
               <h3 className="text-xl font-black text-stone-800">{editingProduct.id ? 'Upraviť bylinku' : 'Pridať bylinku'}</h3>
               <button onClick={() => setEditingProduct(null)} className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-6 md:p-10 pt-4 overflow-y-auto flex-grow space-y-6 scroll-smooth">
              <div className="flex flex-col items-center mb-2">
                 <div className="w-28 h-28 rounded-[2rem] bg-stone-50 border-4 border-white shadow-xl overflow-hidden mb-4 relative flex items-center justify-center text-stone-200">
                    {editingProduct.image ? <img src={editingProduct.image} className="w-full h-full object-cover" alt="" /> : <i className="fa-solid fa-image text-3xl"></i>}
                 </div>
                 <label className="bg-[#1c1c14] text-white px-5 py-2.5 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 active:scale-95 transition-all shadow-lg uppercase tracking-widest">
                    <i className="fa-solid fa-camera"></i> Nahrať fotku
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </label>
              </div>
              <div className="space-y-3">
                <input className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#a6c238] text-sm" placeholder="Názov bylinky" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                <textarea className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold h-20 outline-none focus:ring-2 focus:ring-[#a6c238] resize-none text-sm" placeholder="Stručný popis" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setEditingProduct({...editingProduct, unit: 'g'})} className={`py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${editingProduct.unit === 'g' ? 'bg-[#1c1c14] text-white shadow-md' : 'bg-stone-50 text-stone-400'}`}>Gramy (g)</button>
                  <button type="button" onClick={() => setEditingProduct({...editingProduct, unit: 'ks'})} className={`py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${editingProduct.unit === 'ks' ? 'bg-[#1c1c14] text-white shadow-md' : 'bg-stone-50 text-stone-400'}`}>Kusy (ks)</button>
                </div>
                <div className="p-5 bg-stone-50 rounded-[2rem] border border-stone-100">
                  <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest block mb-3">Balenia ({editingProduct.unit})</label>
                  <div className="flex gap-2 mb-4">
                    <input type="number" className="flex-grow p-3 bg-white border border-stone-100 rounded-2xl font-bold outline-none text-sm" placeholder={`Napr. 50`} value={newSizeInput} onChange={e => setNewSizeInput(e.target.value)} />
                    <button type="button" onClick={addSize} className="px-6 bg-[#a6c238] text-white font-black rounded-2xl active:scale-95 transition-all text-xs">Pridať</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingProduct.availableWeights.map(w => (
                      <div key={w} className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 font-bold text-[10px] flex items-center gap-2 shadow-sm">
                        {w}{editingProduct.unit}
                        <button type="button" onClick={() => removeSize(w)} className="text-rose-400"><i className="fa-solid fa-circle-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 pt-2 border-t border-stone-50 bg-white flex gap-3">
              <button type="button" onClick={() => setEditingProduct(null)} className="flex-grow py-4 bg-stone-50 text-stone-400 font-black rounded-2xl text-xs uppercase tracking-widest">Zrušiť</button>
              <button type="button" onClick={saveProduct} className="flex-grow py-4 bg-[#a6c238] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest">Uložiť</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 text-center opacity-30 border-t border-stone-100 mt-auto bg-white">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-stone-900 px-4 leading-relaxed">MNF greens Slovakia • Marekova Farma • Profesionálne mikrobylinky</p>
      </footer>

      <style>{`
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .overflow-y-auto { -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  );
};

export default App;
