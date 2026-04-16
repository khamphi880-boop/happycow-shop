import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Settings, Clock, AlertCircle, CheckCircle, ChevronLeft, Image as ImageIcon, Store, X, Upload, Layers, BarChart3, ClipboardList, Check, XCircle, Edit, MapPin, User, Phone, Coffee, Leaf, Zap, ListOrdered, Copy, Download, Maximize } from 'lucide-react';
// นำเข้า Firebase Libraries
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';

// 1. กุญแจ Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyALI9gWvkoSfaGZd5tVxA-INr4QV5Cmf-w",
  authDomain: "happycowshop-fd7b0.firebaseapp.com",
  projectId: "happycowshop-fd7b0",
  storageBucket: "happycowshop-fd7b0.firebasestorage.app",
  messagingSenderId: "373478946147",
  appId: "1:373478946147:web:915a1dea4d2e3667f34f56"
};

// 2. เริ่มต้นระบบ Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. รหัส LIFF ID ของร้านวัวนมอารมณ์ดี
const LIFF_ID = "2009817000-ySEM8T5K"; 

const INITIAL_CATEGORIES = ['นม', 'ชา', 'กาแฟ', 'มัทฉะ', 'ผลไม้และสมูทตี้', 'เมนูพิเศษ'];
const INITIAL_SETTINGS = {
  isOpen: true,
  openTime: '09:00',
  closeTime: '20:00',
  promptpayNo: '0812345678',
  qrImage: ''
};

const SWEETNESS_LEVELS = ['0%', '25%', '50%', '75%', '100%'];

const CATEGORY_PALETTE = {
  'นม': { main: '#A1CFCD', light: '#D1E8E2', textOnMain: '#3D2C1E' },
  'ชา': { main: '#6B705C', light: '#8C9475', textOnMain: '#F5EEDC' },
  'มัทฉะ': { main: '#6B705C', light: '#8C9475', textOnMain: '#F5EEDC' },
  'กาแฟ': { main: '#A67C52', light: '#C69F78', textOnMain: '#F5EEDC' },
  'ผลไม้และสมูทตี้': { main: '#F08080', light: '#D96969', textOnMain: '#F5EEDC' },
  'เมนูพิเศษ': { main: '#3D2C1E', light: '#A67C52', textOnMain: '#F5EEDC' },
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Vollkorn:ital,wght@0,400..900;1,400..900&display=swap');
    :root { --dark-choco: #3D2C1E; --creamy-latte: #F5EEDC; --oak: #A67C52; }
    body { font-family: 'Lato', sans-serif; background-color: var(--creamy-latte); color: var(--dark-choco); margin: 0; -webkit-font-smoothing: antialiased; }
    .font-serif { font-family: 'Vollkorn', serif; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(61, 44, 30, 0.1); border-radius: 10px; }
    /* เพิ่มพื้นหลังแบบไล่สีสำหรับหน้า Admin */
    .admin-bg {
      background: linear-gradient(135deg, #F5EEDC 0%, #D1E8E2 40%, #E8DFCC 80%, #F5EEDC 100%);
      background-size: 200% 200%;
      animation: gradientMove 15s ease infinite;
    }
    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `}</style>
);

export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [toppings, setToppings] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(INITIAL_CATEGORIES[0]);
  const [view, setView] = useState('shop'); 
  const [agreedToTerms, setAgreedToTerms] = useState({ t1: false, t2: false, t3: false });
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({ address: '' });
  const [myCustomerId, setMyCustomerId] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null); 
  const [newTopping, setNewTopping] = useState({ name: '', price: '' });
  const [optionModalItem, setOptionModalItem] = useState(null);
  const [tempOptions, setTempOptions] = useState({ sweetness: '100%', isBlended: false, noPearl: false, selectedToppings: [] });
  
  const [isCopied, setIsCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // State สำหรับเก็บข้อมูล LINE Profile
  const [lineProfile, setLineProfile] = useState(null);

  useEffect(() => {
    let cid = localStorage.getItem('happycow_cid');
    if (!cid) { cid = 'cus_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('happycow_cid', cid); }
    setMyCustomerId(cid);
    const savedInfo = localStorage.getItem('happycow_customer_info');
    if (savedInfo) setCustomerInfo(JSON.parse(savedInfo));

    // เรียกใช้งาน LINE LIFF SDK
    if (LIFF_ID) {
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.onload = () => {
        window.liff.init({ liffId: LIFF_ID }).then(() => {
          if (window.liff.isLoggedIn()) {
            window.liff.getProfile().then(profile => {
              setLineProfile(profile);
              setMyCustomerId(profile.userId); 
            });
          }
        }).catch(err => console.error('LIFF Init failed:', err));
      };
      document.body.appendChild(script);
    }

    const unsubscribeMenus = onSnapshot(collection(db, 'menus'), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    const unsubscribeToppings = onSnapshot(collection(db, 'toppings'), (snapshot) => {
      setToppings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const q = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setOrders(items);
    });
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });
    return () => { unsubscribeMenus(); unsubscribeToppings(); unsubscribeOrders(); unsubscribeSettings(); };
  }, []);

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    try { await setDoc(doc(db, 'settings', 'main'), newSettings); } catch (e) { console.error(e); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setEditingItem({ ...editingItem, image: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        saveSettings({ ...settings, qrImage: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = { ...editingItem, price: Number(editingItem.price), blendPrice: Number(editingItem.blendPrice) || 0 };
      if (editingItem.id) await updateDoc(doc(db, 'menus', editingItem.id), data);
      else await addDoc(collection(db, 'menus'), data);
      setEditingItem(null);
    } catch (err) { alert(err.message); }
    setIsLoading(false);
  };

  const handleCheckout = async (e) => {
    if(e) e.preventDefault();
    if (!customerInfo.address) return alert('กรุณาระบุที่อยู่จัดส่งครับ');
    setIsLoading(true);
    
    const finalCustomerInfo = {
      ...customerInfo,
      lineName: lineProfile ? lineProfile.displayName : 'ลูกค้าทั่วไป',
      linePic: lineProfile ? lineProfile.pictureUrl : ''
    };

    try {
      const orderData = {
        items: cart, total: getTotalPrice(), status: 'pending', timestamp: new Date(),
        customerId: myCustomerId, customerInfo: finalCustomerInfo 
      };
      localStorage.setItem('happycow_customer_info', JSON.stringify(customerInfo));
      if (editingOrderId) await updateDoc(doc(db, 'orders', editingOrderId), orderData);
      else await addDoc(collection(db, 'orders'), orderData);
      
      await copyOrderToLine(!!editingOrderId);
      
      setCart([]); setEditingOrderId(null); setView('myOrders');
    } catch (err) { alert(err.message); }
    setIsLoading(false);
  };

  const handleCustomerCancelOrder = async (orderId) => {
    if (confirm('ยกเลิกออร์เดอร์นี้ใช่หรือไม่?')) {
      setIsLoading(true);
      try { await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' }); } catch (e) { alert(e.message); }
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try { await updateDoc(doc(db, 'orders', orderId), { status: newStatus }); } catch (e) { alert(e.message); }
  };

  const handleToggleTopping = (topping, isChecked) => {
    setTempOptions(prev => {
      if (isChecked) return { ...prev, selectedToppings: [...prev.selectedToppings, topping] };
      return { ...prev, selectedToppings: prev.selectedToppings.filter(t => t.id !== topping.id) };
    });
  };

  const addToCart = () => {
    if (!optionModalItem) return;
    const { sweetness, isBlended, noPearl, selectedToppings } = tempOptions;
    const toppingsKey = selectedToppings.map(t => t.id).sort().join('-');
    const cartItemId = `${optionModalItem.id}-${sweetness}-${isBlended}-${noPearl}-${toppingsKey}`;
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const finalPrice = optionModalItem.price + (isBlended ? (optionModalItem.blendPrice || 0) : 0) + toppingsPrice;
    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...optionModalItem, cartItemId, sweetness, isBlended, noPearl, selectedToppings, price: finalPrice, qty: 1 }];
    });
    setOptionModalItem(null);
  };

  const updateQty = (cartItemId, delta) => {
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const getTotalPrice = () => cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const getTotalItems = () => cart.reduce((sum, i) => sum + i.qty, 0);
  const allTermsAgreed = agreedToTerms.t1 && agreedToTerms.t2 && agreedToTerms.t3;

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === '570402') { setIsAdminLoggedIn(true); setView('admin'); setAdminPassword(''); } 
    else alert('รหัสผ่านไม่ถูกต้อง');
  };

  const copyOrderToLine = async (isEditing) => {
    const header = isEditing ? `*[อัปเดต] ยืนยันแก้ไขออร์เดอร์*` : `*ออร์เดอร์ใหม่ ร้านวัวนมอารมณ์ดี*`;
    const customerName = lineProfile ? lineProfile.displayName : 'ลูกค้า';
    const orderText = `${header}\nคุณ ${customerName}\n\n` + cart.map(i => {
      const toppingsText = i.selectedToppings?.length > 0 ? ` [+${i.selectedToppings.map(t=>t.name).join(',')}]` : '';
      return `- ${i.name} (${i.isBlended?'ปั่น':'เย็น'}) หวาน ${i.sweetness}${i.noPearl?' [ไม่ไข่มุก]':''}${toppingsText} x${i.qty}`;
    }).join('\n') +
      `\n\n*ยอดรวม: ${getTotalPrice()} บาท*\n*ที่อยู่ส่ง:* ${customerInfo.address}\n\nโอนเงินแล้วและรับทราบเงื่อนไข`;
    
    if (window.liff && window.liff.isLoggedIn()) {
      try {
        await window.liff.sendMessages([{ type: 'text', text: orderText }]);
      } catch (err) {
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(orderText)}`, '_blank');
      }
    } else {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(orderText)}`, '_blank');
    }
  };

  const handleCopyPromptPay = (e) => {
    if(e) e.preventDefault();
    const el = document.createElement('textarea');
    el.value = settings.promptpayNo;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddTopping = async (e) => {
    e.preventDefault();
    if (!newTopping.name || !newTopping.price) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'toppings'), { name: newTopping.name, price: Number(newTopping.price) });
      setNewTopping({ name: '', price: '' });
    } catch (error) { alert(error.message); }
    setIsLoading(false);
  };

  const handleDeleteTopping = async (id) => {
    if(confirm('ต้องการลบท็อปปิ้งนี้ใช่หรือไม่?')) {
      try { await deleteDoc(doc(db, 'toppings', id)); } catch (error) { alert(error.message); }
    }
  };

  const getCatAccent = (cat) => CATEGORY_PALETTE[cat] || CATEGORY_PALETTE['เมนูพิเศษ'];

  const getActiveOrders = () => orders.filter(o => o.status === 'pending' || o.status === 'accepted').reverse();
  const getQueueInfo = (orderId) => {
    const active = getActiveOrders();
    const index = active.findIndex(o => o.id === orderId);
    return { pos: index + 1, total: active.length };
  };

  // ================= RENDERERS =================

  const renderHeader = () => {
    const activeCount = getActiveOrders().length;
    return (
      <header className="sticky top-0 z-40 bg-creamy/80 backdrop-blur-md border-b border-oak/10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('shop')}>
            {lineProfile ? (
              <img src={lineProfile.pictureUrl} className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-dark/20" alt="Profile" />
            ) : (
              <div className="w-12 h-12 bg-dark text-creamy rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-dark/20 transform -rotate-3">🐮</div>
            )}
            <div>
              <h1 className="font-serif font-bold text-xl text-dark leading-tight tracking-tight">วัวนมอารมณ์ดี</h1>
              <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold text-olive">
                <span className={`w-1.5 h-1.5 rounded-full ${settings.isOpen ? 'bg-green-600 animate-pulse' : 'bg-red-500'}`}></span>
                {settings.isOpen ? `เปิดบริการ (${activeCount} คิวรอ)` : 'ปิดร้าน'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => isAdminLoggedIn ? setView('admin') : setView('adminLogin')} className={`p-2 transition-all ${isAdminLoggedIn ? 'text-oak bg-white shadow-sm' : 'text-dark/30'} rounded-xl`}>
              <Settings size={20} />
            </button>
            <button type="button" onClick={() => setView('myOrders')} className="relative p-2 text-dark/40 hover:text-dark rounded-xl">
              <ClipboardList size={22} />
              {orders.filter(o => o.customerId === myCustomerId && (o.status==='pending'||o.status==='accepted')).length > 0 && <span className="absolute top-1 right-1 bg-oak text-creamy text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-creamy">!</span>}
            </button>
            <button type="button" onClick={() => setView('cart')} className="relative p-2.5 bg-dark text-creamy rounded-xl shadow-xl shadow-dark/20 ml-1">
              <ShoppingCart size={20} />
              {getTotalItems() > 0 && <span className="absolute -top-1.5 -right-1.5 bg-oak text-creamy text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-creamy">{getTotalItems()}</span>}
            </button>
          </div>
        </div>
      </header>
    );
  };

  const renderShop = () => {
    const displayItems = menuItems.filter(i => i.category === activeCategory);
    const activeAccent = getCatAccent(activeCategory);
    const modalToppingsPrice = tempOptions.selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const modalBlendPrice = tempOptions.isBlended ? (optionModalItem?.blendPrice || 0) : 0;
    const modalTotalPrice = optionModalItem ? (optionModalItem.price + modalBlendPrice + modalToppingsPrice) : 0;
    const modalAccent = optionModalItem ? getCatAccent(optionModalItem.category) : activeAccent;

    return (
      <div className="pb-24 max-w-md mx-auto min-h-screen relative">
        <GlobalStyles />
        {renderHeader()}
        
        {lineProfile && (
           <div className="px-5 pt-4">
              <p className="text-sm font-bold text-dark/60">สวัสดีคุณ, <span className="text-oak">{lineProfile.displayName}</span> 👋</p>
           </div>
        )}
        
        <div className="overflow-x-auto hide-scrollbar py-5 px-4 sticky top-[72px] z-30 bg-creamy/90 backdrop-blur-sm border-b border-dark/5">
          <div className="flex gap-2.5 w-max">
            {INITIAL_CATEGORIES.map(cat => {
              const accent = getCatAccent(cat);
              const isActive = activeCategory === cat;
              return (
                <button type="button" key={cat} onClick={() => setActiveCategory(cat)} style={{ backgroundColor: isActive ? accent.main : 'rgba(255,255,255,0.6)', color: isActive ? accent.textOnMain : 'rgba(61,44,30,0.6)' }} className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-dark/5 ${isActive ? 'shadow-lg -translate-y-1' : ''}`}>{cat}</button>
              );
            })}
          </div>
        </div>

        <div className="px-5 grid grid-cols-2 gap-5 mt-4">
          {displayItems.map(item => {
            const accent = getCatAccent(item.category);
            return (
              <div key={item.id} className="bg-white rounded-[2rem] shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all relative border border-dark/5 group">
                {item.isFreePearl && <div className="absolute top-3 left-3 z-10 bg-olive text-creamy text-[9px] font-bold px-3 py-1.5 rounded-full border border-white/20">✨ ฟรีไข่มุก</div>}
                <div className="relative aspect-[4/5] bg-creamy/30 overflow-hidden">
                  <img src={item.image} className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-2xl font-bold text-dark text-sm border border-dark/5">฿{item.price}</div>
                </div>
                <div className="p-4 flex flex-col flex-1 bg-white">
                  <h3 className="font-serif font-bold text-dark text-base leading-tight flex-1 mb-3 line-clamp-2">{item.name}</h3>
                  <button type="button" disabled={!settings.isOpen} onClick={() => { setOptionModalItem(item); const defaultBlended = item.hasIced === false && item.hasBlended === true; setTempOptions({ sweetness: '100%', isBlended: defaultBlended, noPearl: false, selectedToppings: [] }); }} style={{ backgroundColor: accent.main, color: accent.textOnMain }} className="w-full py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-20">เลือกสั่ง</button>
                </div>
              </div>
            );
          })}
        </div>

        {optionModalItem && (
          <div className="fixed inset-0 bg-dark/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
            <div className="bg-creamy rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md animate-in slide-in-from-bottom-full duration-500 overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-dark/5 flex items-center justify-between bg-white/40">
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-dark leading-none mb-1">{optionModalItem.name}</h3>
                    <p className="font-bold tracking-widest uppercase text-[10px] opacity-40">{optionModalItem.category}</p>
                  </div>
                  <button type="button" onClick={() => setOptionModalItem(null)} className="p-3 bg-white text-dark rounded-2xl shadow-sm"><X size={20}/></button>
               </div>
               <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto hide-scrollbar">
                 <div>
                    <label className="block font-serif font-bold text-dark text-lg mb-4 flex items-center gap-2"><Zap size={18} className="text-oak" /> ระดับความหวาน</label>
                    <div className="grid grid-cols-5 gap-2">
                      {SWEETNESS_LEVELS.map(level => {
                        const isSel = tempOptions.sweetness === level;
                        return (
                          <button type="button" key={level} onClick={() => setTempOptions({...tempOptions, sweetness: level})} style={{ backgroundColor: isSel ? modalAccent.main : 'white', color: isSel ? modalAccent.textOnMain : '#3D2C1E60' }} className={`py-3 rounded-2xl text-[10px] font-bold transition-all border border-dark/5 ${isSel ? '-translate-y-1 shadow-lg' : ''}`}>{level}</button>
                        );
                      })}
                    </div>
                 </div>
                 {(optionModalItem.hasIced !== false || optionModalItem.hasBlended !== false) && (
                   <div>
                      <label className="block font-serif font-bold text-dark text-lg mb-4">รูปแบบ</label>
                      <div className="grid grid-cols-2 gap-4">
                        {optionModalItem.hasIced !== false && (
                          <button type="button" onClick={() => setTempOptions({...tempOptions, isBlended: false})} style={{ borderColor: !tempOptions.isBlended ? modalAccent.main : 'transparent', backgroundColor: 'white' }} className={`py-5 rounded-3xl text-sm font-bold flex flex-col items-center gap-3 transition-all border-2 ${!tempOptions.isBlended ? 'shadow-xl' : 'opacity-40'}`}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: !tempOptions.isBlended ? modalAccent.main : '#ccc' }}><Coffee size={24}/></div>
                            <span className="uppercase tracking-widest text-[10px]">เย็น</span>
                          </button>
                        )}
                        {optionModalItem.hasBlended !== false && (
                          <button type="button" onClick={() => setTempOptions({...tempOptions, isBlended: true})} style={{ borderColor: tempOptions.isBlended ? modalAccent.main : 'transparent', backgroundColor: 'white' }} className={`py-5 rounded-3xl text-sm font-bold flex flex-col items-center gap-3 transition-all border-2 ${tempOptions.isBlended ? 'shadow-xl' : 'opacity-40'}`}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: tempOptions.isBlended ? modalAccent.main : '#ccc' }}><Zap size={24}/></div>
                            <span className="uppercase tracking-widest text-[10px]">ปั่น</span>
                          </button>
                        )}
                      </div>
                   </div>
                 )}
                 {toppings.length > 0 && (
                   <div>
                    <label className="block font-serif font-bold text-dark text-lg mb-4">ท็อปปิ้ง</label>
                    <div className="space-y-3">
                      {toppings.map(topping => {
                        const isChecked = tempOptions.selectedToppings.some(t => t.id === topping.id);
                        return (
                          <div key={topping.id} onClick={() => handleToggleTopping(topping, !isChecked)} style={{ borderColor: isChecked ? modalAccent.main : 'transparent', backgroundColor: 'white' }} className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all cursor-pointer ${isChecked ? 'shadow-lg' : 'opacity-60'}`}>
                            <span className="text-sm font-bold text-dark/80">{topping.name}</span>
                            <span className="text-sm text-oak font-bold">+฿{topping.price}</span>
                          </div>
                        );
                      })}
                    </div>
                   </div>
                 )}
               </div>
               <div className="p-6 bg-white border-t border-dark/5 shadow-2xl">
                 <button type="button" onClick={addToCart} style={{ backgroundColor: modalAccent.main, color: modalAccent.textOnMain }} className="w-full py-5 rounded-[2rem] font-bold text-lg transform active:scale-95 shadow-xl">เพิ่มลงตะกร้า • ฿{modalTotalPrice}</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCart = () => (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-creamy">
      <GlobalStyles />
      <header className="bg-creamy px-6 py-6 flex items-center gap-4">
        <button type="button" onClick={() => setView('shop')} className="p-2.5 bg-white text-dark rounded-2xl shadow-sm"><ChevronLeft size={24} /></button>
        <h2 className="font-serif font-bold text-2xl text-dark">ตะกร้าของฉัน</h2>
      </header>
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {cart.map(item => (
          <div key={item.cartItemId} className="bg-white p-4 rounded-[2rem] shadow-sm flex items-center gap-4 border border-dark/5">
            <img src={item.image} className="w-20 h-20 object-cover rounded-2xl bg-creamy border border-dark/5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-bold text-dark text-lg truncate mb-1">{item.name}</h4>
              <p className="text-[10px] font-bold text-dark/40 uppercase">{item.isBlended?'แบบปั่น':'แบบเย็น'} • หวาน {item.sweetness}</p>
              {item.selectedToppings?.length > 0 && (
                <p className="text-[9px] font-bold text-oak">+{item.selectedToppings.map(t=>t.name).join(', ')}</p>
              )}
              <div className="text-oak font-bold text-lg mt-1">฿{item.price * item.qty}</div>
            </div>
            <div className="flex flex-col items-center gap-2 bg-creamy/50 p-2 rounded-2xl">
              <button type="button" onClick={() => updateQty(item.cartItemId, 1)} className="p-1.5 text-dark"><Plus size={16}/></button>
              <span className="font-bold text-dark text-xs">{item.qty}</span>
              <button type="button" onClick={() => updateQty(item.cartItemId, -1)} className="p-1.5 text-dark"><Minus size={16}/></button>
            </div>
          </div>
        ))}
        {cart.length === 0 && <p className="text-center py-20 opacity-30 italic font-serif">ไม่มีสินค้าในตะกร้า</p>}
      </div>
      {cart.length > 0 && (
        <div className="bg-white p-6 rounded-t-[2.5rem] shadow-2xl">
          <div className="flex justify-between items-center mb-6 px-2"><span className="text-dark/40 font-bold uppercase tracking-widest text-[10px]">ยอดรวม</span><span className="text-3xl font-serif font-bold text-dark">฿{getTotalPrice()}</span></div>
          <button type="button" onClick={() => setView('checkout')} className="w-full bg-dark text-creamy py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-dark/20">ไปหน้าชำระเงิน</button>
        </div>
      )}
    </div>
  );

  const renderCheckout = () => {
    const qrSrc = settings.qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PROMPTPAY:${settings.promptpayNo}:${getTotalPrice()}`;
    
    return (
      <div className="max-w-md mx-auto bg-creamy min-h-screen flex flex-col relative">
        <GlobalStyles />
        <header className="bg-creamy px-6 py-6 flex items-center gap-4">
          <button type="button" onClick={() => setView('cart')} className="p-2.5 bg-white text-dark rounded-2xl shadow-sm"><ChevronLeft size={24} /></button>
          <h2 className="font-serif font-bold text-2xl text-dark">ชำระเงิน</h2>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto pb-24 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-dark/5 space-y-5">
             <h3 className="font-serif font-bold text-xl text-dark flex items-center gap-3 border-b border-dark/5 pb-4"><MapPin size={22} className="text-oak" /> ที่อยู่จัดส่ง</h3>
             <textarea placeholder="ระบุเลขห้อง, ตึก, หรือจุดสังเกต..." value={customerInfo.address} onChange={e => setCustomerInfo({ address: e.target.value })} className="w-full px-5 py-4 bg-creamy/30 border-none rounded-2xl focus:ring-2 focus:ring-oak text-sm h-32 resize-none" />
          </div>
          
          <div className="bg-oak/5 border border-oak/10 p-6 rounded-[2rem] space-y-4">
              <h3 className="font-serif font-bold text-oak text-lg">เงื่อนไขการส่ง</h3>
              {['1. ส่งถึงหน้าห้อง (ถ้าตึกอนุญาต)', '2. ฝนตก/ลิฟต์เสีย รบกวนรับที่ล็อบบี้', '3. รอประมาณ 20 นาที'].map((t, idx) => (
                  <label key={idx} className="flex items-center gap-4 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-oak" checked={agreedToTerms[`t${idx+1}`]} onChange={(e) => setAgreedToTerms({...agreedToTerms, [`t${idx+1}`]: e.target.checked})} /><span className="text-xs text-dark/70 font-medium">{t}</span></label>
              ))}
          </div>

          {allTermsAgreed ? (
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl text-center border border-oak/5">
              <h3 className="font-serif font-bold text-2xl text-dark mb-2">สแกนจ่ายเงิน</h3>
              <p className="text-oak font-bold text-3xl mb-4 font-serif">฿{getTotalPrice()}</p>
              
              <div className="text-sm font-bold text-dark/80 mb-5 bg-creamy/40 py-2.5 px-5 rounded-xl border border-dark/5 inline-block">
                 พร้อมเพย์: <span className="tracking-widest">{settings.promptpayNo}</span>
              </div>

              <div className="bg-creamy/50 w-56 h-56 mx-auto rounded-[2rem] flex items-center justify-center mb-6 overflow-hidden border border-dark/5 p-4 relative group">
                 <img src={qrSrc} className="w-full h-full object-contain rounded-xl" />
              </div>

              <div className="flex gap-3 mb-6">
                 <button type="button" onClick={handleCopyPromptPay} className="flex-1 bg-creamy text-dark py-3.5 rounded-2xl text-xs font-bold border border-dark/10 flex items-center justify-center gap-2 hover:bg-dark/5 transition-all shadow-sm">
                   {isCopied ? <Check size={18} className="text-green-600"/> : <Copy size={18}/>}
                   {isCopied ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
                 </button>
                 <button type="button" onClick={() => setShowQrModal(true)} className="flex-1 bg-creamy text-dark py-3.5 rounded-2xl text-xs font-bold border border-dark/10 flex items-center justify-center gap-2 hover:bg-dark/5 transition-all shadow-sm">
                   <Maximize size={18}/> ขยาย / บันทึก QR
                 </button>
              </div>

              <button type="button" onClick={handleCheckout} disabled={isLoading} className="w-full bg-[#00B900] text-white py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-600/20 hover:opacity-90 transition-all active:scale-95"><CheckCircle size={24} /> ยืนยันและส่งสลิป LINE</button>
            </div>
          ) : <p className="text-center text-dark/20 italic font-serif py-10">กดยอมรับเงื่อนไขเพื่อดู QR Code</p>}
        </div>

        {showQrModal && (
          <div className="fixed inset-0 bg-dark/90 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-creamy w-full max-w-sm rounded-[3rem] p-8 text-center relative shadow-2xl">
                <button type="button" onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 p-3 bg-dark/5 hover:bg-dark/10 rounded-full text-dark transition-all"><X size={24}/></button>
                <h3 className="font-serif font-bold text-2xl text-dark mb-2 mt-4">บันทึก QR Code</h3>
                <p className="text-sm text-dark/60 mb-6">แตะค้างที่รูปภาพด้านล่างแล้วเลือก "บันทึกรูปภาพ"</p>
                <div className="bg-white p-4 rounded-[2rem] shadow-inner border border-dark/5 mb-6">
                  <img src={qrSrc} className="w-full h-auto object-contain rounded-xl pointer-events-auto select-none" />
                </div>
                <button type="button" onClick={() => setShowQrModal(false)} className="w-full bg-dark text-creamy py-4 rounded-2xl font-bold text-lg hover:bg-dark/90 transition-all">ปิดหน้าต่างนี้</button>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderMyOrders = () => {
     const myOrders = orders.filter(o => o.customerId === myCustomerId);
     return (
       <div className="max-w-md mx-auto bg-creamy min-h-screen flex flex-col relative">
         <GlobalStyles />
         {isLoading && <div className="absolute inset-0 bg-creamy/50 backdrop-blur-sm z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-dark/5 border-t-oak"></div></div>}
         <header className="bg-creamy px-6 py-6 flex items-center gap-4"><button type="button" onClick={() => setView('shop')} className="p-2.5 bg-white text-dark rounded-2xl shadow-sm"><ChevronLeft size={24} /></button><h2 className="font-serif font-bold text-2xl text-dark">ประวัติการสั่ง</h2></header>
         <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {myOrders.map(order => {
                const qInfo = getQueueInfo(order.id);
                const isActive = order.status === 'pending' || order.status === 'accepted';
                return (
                  <div key={order.id} className="bg-white rounded-[2.5rem] shadow-sm border border-dark/5 p-6 transition-all hover:shadow-xl">
                     <div className="flex justify-between items-start mb-5 border-b border-dark/5 pb-5">
                        <div>
                          <p className="text-[9px] text-dark/30 font-bold uppercase mb-1">บิล #{order.id.slice(0, 8)}</p>
                          <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase border ${order.status === 'pending' ? 'bg-orange-50 text-orange-600' : order.status==='cancelled' ? 'bg-red-50 text-red-600' : 'bg-olive/10 text-olive'}`}>
                            {order.status === 'pending' ? 'รอรับออร์เดอร์' : order.status === 'accepted' ? 'กำลังเตรียม' : order.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                          </span>
                        </div>
                        <p className="text-2xl font-serif font-bold text-dark">฿{order.total}</p>
                     </div>
                     
                     {isActive && (
                        <div className="mb-5 bg-creamy/30 p-4 rounded-2xl flex items-center justify-between border border-dark/5">
                           <div className="flex items-center gap-2"><ListOrdered size={16} className="text-oak"/><span className="text-xs font-bold text-dark/60">สถานะคิวของคุณ</span></div>
                           <div className="text-right"><p className="text-lg font-bold text-dark">คิวที่ {qInfo.pos}</p><p className="text-[9px] text-dark/40 font-bold uppercase">จาก {qInfo.total} คิวรอ</p></div>
                        </div>
                     )}

                     <div className="space-y-2 mb-6 text-[11px] font-bold text-dark/70">
                       {(order.items || []).map((i,idx)=>(
                         <div key={idx} className="flex justify-between">
                           <span>{i.qty}x {i.name} ({i.isBlended?'ปั่น':'เย็น'}) {i.selectedToppings?.length > 0 && `+${i.selectedToppings.map(t=>t.name).join(',')}`}</span>
                           <span>฿{i.price*i.qty}</span>
                         </div>
                       ))}
                     </div>
                     {order.status === 'pending' && (
                         <div className="flex gap-3 pt-5 border-t border-dark/5">
                            <button type="button" onClick={() => handleCustomerCancelOrder(order.id)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase">ยกเลิก</button>
                            <button type="button" onClick={() => { setView('shop'); alert('กรุณากดเลือกเมนูใหม่ ออร์เดอร์เก่าจะถูกแทนที่'); setCart(order.items); setEditingOrderId(order.id); setView('cart'); }} className="flex-1 py-3 bg-dark text-creamy rounded-2xl text-[10px] font-bold uppercase shadow-lg shadow-dark/10">แก้ไข</button>
                         </div>
                     )}
                  </div>
                );
            })}
            {myOrders.length === 0 && <p className="text-center py-24 opacity-10 font-serif italic">ไม่มีประวัติการสั่งซื้อ</p>}
         </div>
       </div>
     );
  };

  const renderAdminDashboard = () => {
    const calculateSales = () => {
      const todayStart = new Date().setHours(0,0,0,0);
      let d=0, m=0, y=0;
      orders.forEach(o => { if(o.status !== 'cancelled') { const t = o.timestamp?.seconds*1000; if(t>=todayStart) d+=o.total; } });
      return { d, m, y };
    };
    const sales = calculateSales();

    if (editingItem) return (
      <div className="max-w-md mx-auto admin-bg min-h-screen flex flex-col">
        <GlobalStyles />
        <header className="bg-dark text-creamy px-6 py-6 flex items-center gap-4"><button type="button" onClick={() => setEditingItem(null)} className="p-2.5 bg-white/10 rounded-2xl"><ChevronLeft size={24} /></button><h2 className="font-serif font-bold text-2xl">จัดการเมนู</h2></header>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
           <input type="text" placeholder="ชื่อเมนู" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm" />
           <div className="grid grid-cols-2 gap-4"><input type="number" placeholder="ราคา" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: e.target.value})} className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm" /><input type="number" placeholder="+ ปั่น" value={editingItem.blendPrice || ''} onChange={e => setEditingItem({...editingItem, blendPrice: e.target.value})} className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm" /></div>
           <select value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm">{INITIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
           <label className="flex items-center gap-2 cursor-pointer bg-olive/10 p-4 rounded-2xl font-bold text-olive"><input type="checkbox" className="w-5 h-5" checked={!!editingItem.isFreePearl} onChange={e => setEditingItem({...editingItem, isFreePearl: e.target.checked})} /> แถมไข่มุก</label>
           <label className="cursor-pointer bg-oak text-creamy p-4 rounded-2xl text-center block text-sm font-bold shadow-xl shadow-oak/20 uppercase tracking-widest"><Upload size={18} className="inline mr-2" /> อัปโหลดรูปภาพ<input type="file" className="hidden" onChange={handleImageUpload} /></label>
           {editingItem.image && <img src={editingItem.image} className="w-40 h-40 mx-auto rounded-3xl object-cover shadow-xl" />}
           <button type="button" onClick={handleSaveMenu} className="w-full bg-dark text-creamy py-5 rounded-2xl font-bold shadow-xl">บันทึก</button>
        </div>
      </div>
    );

    return (
      <div className="max-w-md mx-auto admin-bg min-h-screen flex flex-col relative pb-10">
        <GlobalStyles />
        <header className="bg-dark text-creamy px-6 py-6 flex justify-between items-center shadow-lg sticky top-0 z-40">
          <div><h2 className="font-serif font-bold text-2xl">หลังบ้าน</h2><p className="text-[8px] uppercase font-bold text-oak">Admin Console</p></div>
          <button type="button" onClick={() => setView('shop')} className="text-[9px] font-bold bg-white/10 px-5 py-2 rounded-full transition-all uppercase border border-white/5">ดูหน้าร้าน</button>
        </header>
        <div className="p-6 space-y-8 overflow-y-auto">
           <section className="bg-white p-7 rounded-[3rem] shadow-xl border border-dark/5">
              <h3 className="font-serif font-bold text-dark text-xl mb-6 flex items-center gap-3 border-b border-dark/5 pb-4"><BarChart3 size={20} className="text-oak"/> ยอดขายวันนี้</h3>
              <p className="text-4xl font-serif font-bold text-dark">฿{sales.d.toLocaleString()}</p>
           </section>

           <section className="space-y-4">
              <h3 className="font-serif font-bold text-dark text-xl px-2">ออร์เดอร์ที่ต้องจัดการ</h3>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'pending' || o.status === 'accepted').map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-dark/5">
                       <div className="flex justify-between items-start mb-4 border-b border-dark/5 pb-4">
                          <div><span className="text-[9px] font-bold text-oak uppercase tracking-widest px-2 py-1 rounded-lg">#{order.id.slice(0, 8)}</span><p className="text-xs text-dark/40 mt-1">{order.status==='pending'?'รอยืนยัน':'กำลังเตรียม'}</p></div>
                          <p className="text-2xl font-serif font-bold text-dark">฿{order.total}</p>
                       </div>
                       
                       <div className="flex items-center gap-3 mb-3 bg-creamy/30 p-3 rounded-xl border border-dark/5">
                          {order.customerInfo?.linePic ? (
                             <img src={order.customerInfo.linePic} className="w-8 h-8 rounded-full shadow-sm" alt="Line" />
                          ) : (
                             <div className="w-8 h-8 bg-dark/10 rounded-full flex items-center justify-center"><User size={14}/></div>
                          )}
                          <p className="text-xs font-bold text-dark">{order.customerInfo?.lineName || 'ลูกค้าทั่วไป'}</p>
                       </div>

                       <p className="text-[10px] font-bold text-dark/70 mb-2">ที่อยู่: {order.customerInfo?.address}</p>
                       <div className="text-[11px] text-dark/50 mb-6 space-y-1">
                          {(order.items || []).map((i,idx)=>(
                             <div key={idx} className="flex justify-between font-bold">
                                <span>{i.qty}x {i.name} {i.selectedToppings?.length > 0 && `(+${i.selectedToppings.map(t=>t.name).join(',')})`}</span>
                                <span className="opacity-40">{i.isBlended?'ปั่น':'เย็น'}</span>
                             </div>
                          ))}
                       </div>
                       <div className="flex gap-3">
                          {order.status === 'pending' ? (
                            <button type="button" onClick={() => updateOrderStatus(order.id, 'accepted')} className="py-4 bg-dark text-creamy rounded-2xl text-[10px] font-bold uppercase flex-1 shadow-lg shadow-dark/20">รับออร์เดอร์</button>
                          ) : (
                            <button type="button" onClick={() => updateOrderStatus(order.id, 'completed')} className="py-4 bg-olive text-creamy rounded-2xl text-[10px] font-bold uppercase flex-1 shadow-lg shadow-olive/20">ทำเสร็จแล้ว</button>
                          )}
                          <button type="button" onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-5 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase">ปฏิเสธ</button>
                       </div>
                    </div>
                ))}
                {orders.filter(o => o.status === 'pending' || o.status === 'accepted').length === 0 && <p className="text-center py-10 opacity-10 font-serif italic">ไม่มีออร์เดอร์ใหม่</p>}
              </div>
           </section>

           <section className="bg-white p-7 rounded-[3rem] shadow-xl border border-dark/5 space-y-7">
              <h3 className="font-serif font-bold text-dark text-xl border-b border-dark/5 pb-4 flex items-center gap-2"><Layers size={22} className="text-oak" /> จัดการท็อปปิ้ง</h3>
              <form onSubmit={handleAddTopping} className="flex gap-2">
                 <input required type="text" placeholder="ชื่อท็อปปิ้ง" value={newTopping.name} onChange={e => setNewTopping({...newTopping, name: e.target.value})} className="flex-1 p-4 bg-creamy/30 border-none rounded-[1.5rem] font-bold outline-none text-sm focus:ring-2 focus:ring-oak" />
                 <input required type="number" placeholder="฿" value={newTopping.price} onChange={e => setNewTopping({...newTopping, price: e.target.value})} className="w-20 p-4 bg-creamy/30 border-none rounded-[1.5rem] font-bold outline-none text-center focus:ring-2 focus:ring-oak" />
                 <button type="submit" disabled={isLoading} className="bg-dark text-creamy p-4 rounded-[1.5rem] shadow-lg hover:bg-dark/90 transition-all"><Plus size={20}/></button>
              </form>
              <div className="space-y-3">
                 {toppings.map(topping => (
                   <div key={topping.id} className="flex items-center justify-between bg-creamy/20 p-4 rounded-[1.5rem] border border-dark/5 shadow-sm">
                     <span className="text-sm font-bold text-dark">{topping.name} <span className="text-oak">(+฿{topping.price})</span></span>
                     <button type="button" onClick={() => handleDeleteTopping(topping.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                   </div>
                 ))}
                 {toppings.length === 0 && <p className="text-[10px] text-center text-dark/30 uppercase tracking-widest py-2">ยังไม่มีรายการท็อปปิ้ง</p>}
              </div>
           </section>

           <section className="bg-white p-7 rounded-[3rem] shadow-xl border border-dark/5 space-y-7">
              <h3 className="font-serif font-bold text-dark text-xl border-b border-dark/5 pb-4">ตั้งค่าร้าน</h3>
              <div className="flex items-center justify-between p-4 bg-creamy/20 rounded-2xl"><span className="font-bold text-sm text-dark">สถานะร้าน</span><input type="checkbox" className="w-14 h-8" checked={settings.isOpen} onChange={e => saveSettings({...settings, isOpen: e.target.checked})} /></div>
              <div className="space-y-4"><label className="block text-[10px] font-bold uppercase text-dark/40 px-2">เบอร์พร้อมเพย์</label><input type="text" value={settings.promptpayNo || ''} onChange={e => saveSettings({...settings, promptpayNo: e.target.value})} className="w-full p-4 bg-creamy/30 border-none rounded-2xl font-bold" /></div>
              <div className="pt-4"><label className="block text-[10px] font-bold uppercase text-dark/40 px-2 mb-5">QR Code รับเงิน</label><label className="cursor-pointer bg-oak text-creamy px-8 py-5 rounded-2xl text-[10px] font-bold flex items-center gap-3 transition-all justify-center shadow-lg shadow-oak/20 uppercase tracking-widest"><Upload size={18} /> เปลี่ยนรูป QR<input type="file" className="hidden" onChange={handleQrUpload} /></label></div>
           </section>

           <div className="flex items-center justify-between pt-12 border-t border-dark/5"><h3 className="font-serif font-bold text-dark text-2xl">เมนูเครื่องดื่ม</h3><button type="button" onClick={() => setEditingItem({})} className="text-[10px] bg-dark text-creamy px-6 py-3.5 rounded-full font-bold shadow-xl shadow-dark/20 uppercase">+ เพิ่มเมนูใหม่</button></div>
           <div className="grid grid-cols-2 gap-5 pb-10">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-4 border border-dark/5 transition-all group">
                  <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-creamy shadow-inner border border-dark/5"><img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /><div className="absolute inset-0 bg-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button type="button" onClick={() => setEditingItem(item)} className="p-4 bg-white text-dark rounded-2xl shadow-2xl"><Edit size={20}/></button></div></div>
                  <div className="w-full"><h4 className="font-serif font-bold text-dark text-sm truncate mb-1">{item.name}</h4><p className="text-oak font-bold text-sm">฿{item.price}</p></div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const renderAdminLogin = () => (
    <div className="max-w-md mx-auto admin-bg min-h-screen flex items-center justify-center p-8">
      <GlobalStyles />
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-sm text-center border border-dark/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-dark opacity-10"></div>
        <div className="w-24 h-24 bg-creamy text-dark rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-dark/5 transform rotate-6 animate-pulse">🐮</div>
        <h2 className="text-4xl font-serif font-bold mb-3 text-dark">แอดมิน</h2>
        <p className="text-[10px] font-bold text-oak uppercase tracking-[0.4em] mb-10">เฉพาะเจ้าหน้าที่เท่านั้น</p>
        <div className="space-y-5">
          <input type="password" placeholder="Passcode" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-6 py-5 bg-creamy/30 border-none rounded-[2rem] mb-2 text-center text-3xl font-serif tracking-widest focus:ring-2 focus:ring-oak outline-none shadow-inner" />
          <button type="button" onClick={handleAdminLogin} className="w-full bg-dark text-creamy py-5 rounded-[2rem] font-bold text-lg hover:bg-dark/90 shadow-2xl shadow-dark/20 transition-all active:scale-95">เข้าใช้งาน</button>
          <button type="button" onClick={() => setView('shop')} className="text-[9px] font-bold text-dark/20 uppercase tracking-[0.3em] hover:text-dark transition-colors mt-4 block mx-auto">กลับไปหน้าร้าน</button>
        </div>
      </div>
    </div>
  );

  switch(view) {
    case 'cart': return renderCart();
    case 'checkout': return renderCheckout();
    case 'adminLogin': return renderAdminLogin();
    case 'admin': return renderAdminDashboard();
    case 'myOrders': return renderMyOrders();
    default: return renderShop();
  }
}