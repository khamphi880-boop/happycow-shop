import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Plus, Trash2, ChevronLeft, X, Upload, ClipboardList, Coffee, Zap, 
  MapPin, Settings, Copy, CheckCircle, AlertCircle, LogIn, Eye, Clock, Check, 
  Banknote, CreditCard, MessageSquare, Star, Edit, Save, Camera, Home, Building, 
  TrendingUp, Download, ArrowUp, ArrowDown, Search, Palette, BellRing, ArrowDownToLine 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// --- 1. Firebase Configuration (ตั้งค่าการเชื่อมต่อฐานข้อมูล) ---
const firebaseConfig = {
  apiKey: "AIzaSyALI9gWvkoSfaGZd5tVxA-INr4QV5Cmf-w",
  authDomain: "happycowshop-fd7b0.firebaseapp.com",
  projectId: "happycowshop-fd7b0",
  storageBucket: "happycowshop-fd7b0.firebasestorage.app",
  messagingSenderId: "373478946147",
  appId: "1:373478946147:web:915a1dea4d2e3667f34f56"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const LIFF_ID = "2009828681-C1cb8QC3"; 

const CATEGORIES = ['🔥 เมนูขายดี', 'นม', 'ชา', 'กาแฟ', 'มัทฉะ', 'สมูทตี้โยเกิร์ต', 'วิปครีมและครีมชีส'];
const SWEETNESS = ['0%', '25%', '50%', '75%', '100%', '120%'];

// --- 2. Theme Configuration (ตั้งค่าสีสันและไอคอนเทศกาลต่างๆ) ---
const THEMES = {
  default: { bg: '#F5EEDC', primary: '#3D2C1E', accent: '#A67C52', name: 'ปกติ (มินิมอล)', icons: [] },
  christmas: { bg: '#f0fdf4', primary: '#166534', accent: '#dc2626', name: '🎄 คริสต์มาส', icons: ['❄️', '⛄', '🎁', '🦌'] },
  valentine: { bg: '#fdf2f8', primary: '#831843', accent: '#db2777', name: '💖 วาเลนไทน์', icons: ['💖', '💕', '🌹', '🥰'] },
  songkran: { bg: '#e0f2fe', primary: '#0369a1', accent: '#0ea5e9', name: '💦 สงกรานต์', icons: ['💦', '🔫', '🌊', '🌴'] },
  halloween: { bg: '#fffbeb', primary: '#451a03', accent: '#ea580c', name: '🎃 ฮาโลวีน', icons: ['🎃', '👻', '🦇', '🕸️'] },
  newyear: { bg: '#f8fafc', primary: '#0f172a', accent: '#ca8a04', name: '🎆 ปีใหม่', icons: ['🎆', '✨', '🎉', '🥂'] },
  loykrathong: { bg: '#f5f3ff', primary: '#2e1065', accent: '#7c3aed', name: '🌕 ลอยกระทง', icons: ['🌕', '🕯️', '🌸', '✨'] },
  custom: { bg: '#F5EEDC', primary: '#3D2C1E', accent: '#A67C52', name: '🎨 อัปโหลดเอง', icons: [] },
};

// --- 3. ฟังก์ชันบีบอัดรูปภาพ (Image Compression) ---
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; } } 
        else { if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; } }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function App() {
  // --- States: จัดการข้อมูลหลักของแอป ---
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toppings, setToppings] = useState([]); 
  
  const [cart, setCart] = useState(() => {
    try { const saved = localStorage.getItem('happycow_cart'); return saved ? JSON.parse(saved) : []; }
    catch(e) { return []; }
  });
  
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'viewOrders') return 'myOrders';
    return localStorage.getItem('happycow_view') || 'shop';
  }); 
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(() => new URLSearchParams(window.location.search).get('action') === 'viewOrders');
  
  const [address, setAddress] = useState(() => localStorage.getItem('happycow_address') || '');
  const [note, setNote] = useState(() => localStorage.getItem('happycow_note') || ''); 
  const [slipImage, setSlipImage] = useState('');
  const [slipStatus, setSlipStatus] = useState('idle'); 
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem('happycow_paymentMethod') || 'promptpay'); 
  const [isCopied, setIsCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // --- States: หมวดแอดมิน (Admin) ---
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [selectedSlip, setSelectedSlip] = useState(null); 
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  
  const [deliveryModal, setDeliveryModal] = useState(null);
  const [deliveryImage, setDeliveryImage] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('room');
  const [isDelivering, setIsDelivering] = useState(false);
  
  const [storeSettings, setStoreSettings] = useState({ promptPayNo: '0812345678', qrCodeImage: '', isStoreOpen: true, theme: 'default', customBgImage: '', isBlendOut: false, notifyAdmin: false, adminLineId: '' });
  const [editPromptPay, setEditPromptPay] = useState('');
  const [editQrCodeImage, setEditQrCodeImage] = useState('');
  const [editCustomBgImage, setEditCustomBgImage] = useState('');
  const [editNotifyAdmin, setEditNotifyAdmin] = useState(false);
  const [editAdminLineId, setEditAdminLineId] = useState('');
  
  const [newMenu, setNewMenu] = useState({ name: '', price: '', category: 'นม', image: '', blendPrice: 5, hasFreePearl: false, allowTopping: true, allowBlend: true, isOnlyBlend: false, isPromoted: false, isSoldOut: false, hasTeaType: false });
  const [editingMenu, setEditingMenu] = useState(null); 
  const [newTopping, setNewTopping] = useState({ name: '', price: '' }); 

  const [showAddMenuForm, setShowAddMenuForm] = useState(false);
  const [showAddToppingForm, setShowAddToppingForm] = useState(false);

  // --- 🌟 State สำหรับฟีเจอร์ป้าย Menu Board ---
  const [showMenuBoardModal, setShowMenuBoardModal] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);

  // --- States: จัดการตัวเลือกตอนสั่งสินค้า ---
  const [optionModalItem, setOptionModalItem] = useState(null);
  const [tempOptions, setTempOptions] = useState({ sweetness: '100%', isBlended: false, addPearl: true, selectedToppings: [] });
  const [lineProfile, setLineProfile] = useState({ displayName: 'ลูกค้าทั่วไป', pictureUrl: '', userId: '' });

  // --- States: ระบบค้นหา ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { const saved = localStorage.getItem('happycow_searchHistory'); return saved ? JSON.parse(saved) : []; }
    catch(e) { return []; }
  });
  const [popularSearches, setPopularSearches] = useState([]);

  // Refs
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const audioRef = useRef(null);
  const previousOrderCount = useRef(0);
  const menuBoardRef = useRef(null);

  // คำนวณราคาปั่นเพิ่ม
  const getAddedBlendPrice = (item) => {
    if (item.category === 'สมูทตี้โยเกิร์ต' || item.category === 'ผลไม้และสมูทตี้') return 0;
    return (item.blendPrice !== undefined && item.blendPrice !== null && item.blendPrice !== '') ? Number(item.blendPrice) : 5;
  };

  // Sync LocalStorage
  useEffect(() => { localStorage.setItem('happycow_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('happycow_view', view); }, [view]);
  useEffect(() => { localStorage.setItem('happycow_address', address); }, [address]);
  useEffect(() => { localStorage.setItem('happycow_note', note); }, [note]);
  useEffect(() => { localStorage.setItem('happycow_paymentMethod', paymentMethod); }, [paymentMethod]);
  useEffect(() => { localStorage.setItem('happycow_searchHistory', JSON.stringify(searchHistory)); }, [searchHistory]);

  useEffect(() => {
    if (isLoadingOrders) {
      const timer = setTimeout(() => setIsLoadingOrders(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingOrders]);

  // --- ดึงข้อมูลจาก Firebase แบบ Real-time ---
  useEffect(() => {
    let cid = localStorage.getItem('happycow_uid') || 'guest_' + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('happycow_uid', cid);
    setLineProfile(prev => ({ ...prev, userId: cid }));

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'admin') setShowAdminModal(true);

    const initializeLiff = () => {
      window.liff.init({ liffId: LIFF_ID }).then(() => {
        if (window.liff.isLoggedIn()) {
          window.liff.getProfile().then(p => setLineProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl, userId: p.userId }));
        } else {
          window.liff.login({ redirectUri: window.location.href });
        }
      }).catch(err => console.error("LIFF Error", err));
    };

    if (window.liff) initializeLiff();
    else {
      const script = document.createElement('script');
      script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
      script.onload = initializeLiff;
      document.body.appendChild(script);
    }

    const unsubMenus = onSnapshot(collection(db, 'menus'), snapshot => { 
      setMenuItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
      setIsLoading(false); 
    }, error => {
      console.log("Error loading menus", error);
      setIsLoading(false);
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), snapshot => { 
       const fetchedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp);
       setOrders(fetchedOrders); 
    });

    const unsubToppings = onSnapshot(collection(db, 'toppings'), snapshot => { 
      setToppings(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'store'), docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreSettings({ ...data, isStoreOpen: data.isStoreOpen !== false, theme: data.theme || 'default', customBgImage: data.customBgImage || '', isBlendOut: data.isBlendOut || false, notifyAdmin: data.notifyAdmin || false, adminLineId: data.adminLineId || '' });
        setEditPromptPay(data.promptPayNo || '0812345678'); 
        setEditQrCodeImage(data.qrCodeImage || '');
        setEditCustomBgImage(data.customBgImage || '');
        setEditNotifyAdmin(data.notifyAdmin || false);
        setEditAdminLineId(data.adminLineId || '');
      }
    });

    const unsubSearchStats = onSnapshot(doc(db, 'settings', 'search_stats'), docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8).map(entry => entry[0]);
        setPopularSearches(sorted);
      } else setPopularSearches([]);
    });

    return () => { unsubMenus(); unsubOrders(); unsubToppings(); unsubSettings(); unsubSearchStats(); };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Autoplay blocked', e));
          }
        }, 800);
      }).catch(e => console.log('Autoplay blocked by browser policy', e));
    }
  };

  useEffect(() => {
    if (orders.length > previousOrderCount.current && previousOrderCount.current !== 0) {
      const newOrders = orders.slice(0, orders.length - previousOrderCount.current);
      const hasNewPending = newOrders.some(o => o.status === 'pending');
      if (hasNewPending && view === 'admin') playNotificationSound();
    }
    previousOrderCount.current = orders.length;
  }, [orders, view]);

  const handleLineLogin = () => { if (window.liff && !window.liff.isLoggedIn()) window.liff.login(); };

  // --- ฟังก์ชันสร้างภาพป้ายเมนูรวม (Menu Board) ---
  const generateMenuBoard = async () => {
    if (!menuBoardRef.current) return;
    setIsGeneratingPoster(true);

    try {
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      await new Promise(r => setTimeout(r, 1500));

      const canvas = await window.html2canvas(menuBoardRef.current, { 
         scale: 3, 
         useCORS: true,
         allowTaint: true,
         backgroundColor: '#ffffff',
         logging: false,
         onclone: (clonedDoc) => {
           const element = clonedDoc.getElementById('menu-board-container');
           if (element) {
              element.style.transform = 'none'; 
           }
         }
      });

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);
      setGeneratedPreview({ src: imageBase64, name: `MenuBoard_HappyCow_${Date.now()}.jpg` });
      
    } catch (err) {
      console.error("Error generating menu board:", err);
      alert("เกิดข้อผิดพลาดในการสร้างป้ายเมนู: " + err.message);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // --- Admin Functions ---
  const handleAddNewMenu = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.image) return alert('กรุณากรอกข้อมูลให้ครบครับ');
    if (newMenu.category === '🔥 เมนูขายดี') return alert('หมวดหมู่ "เมนูขายดี" เป็นระบบอัตโนมัติ กรุณาเลือกหมวดหมู่อื่นครับ');
    try {
      await addDoc(collection(db, 'menus'), { ...newMenu, price: Number(newMenu.price), blendPrice: Number(newMenu.blendPrice), allowTopping: newMenu.allowTopping !== false, isOnlyBlend: newMenu.isOnlyBlend || false, allowBlend: newMenu.isOnlyBlend ? true : (newMenu.allowBlend !== false), isPromoted: newMenu.isPromoted || false, isSoldOut: newMenu.isSoldOut || false, hasTeaType: newMenu.hasTeaType || false, createdAt: Date.now(), sortOrder: Date.now() });
      alert('เพิ่มเมนูสำเร็จ! 🐮'); 
      setNewMenu({ name: '', price: '', category: 'นม', image: '', blendPrice: 5, hasFreePearl: false, allowTopping: true, allowBlend: true, isOnlyBlend: false, isPromoted: false, isSoldOut: false, hasTeaType: false });
      setShowAddMenuForm(false);
    } catch (e) { alert(e.message); }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu.name || !editingMenu.price || !editingMenu.image) return alert('กรุณากรอกข้อมูลให้ครบครับ');
    try {
      await updateDoc(doc(db, 'menus', editingMenu.id), { ...editingMenu, price: Number(editingMenu.price), blendPrice: Number(editingMenu.blendPrice), allowTopping: editingMenu.allowTopping !== false, isOnlyBlend: editingMenu.isOnlyBlend || false, allowBlend: editingMenu.isOnlyBlend ? true : (editingMenu.allowBlend !== false), isPromoted: editingMenu.isPromoted || false, isSoldOut: editingMenu.isSoldOut || false, hasTeaType: editingMenu.hasTeaType || false });
      alert('แก้ไขเมนูสำเร็จ! ✨'); 
      setEditingMenu(null);
    } catch (e) { alert(e.message); }
  };

  const handleDeleteMenu = async (id) => { if(window.confirm('ลบเมนูนี้ใช่หรือไม่?')) await deleteDoc(doc(db, 'menus', id)); };

  const handleSortDrop = async (itemsInCategory) => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) { dragItem.current = null; dragOverItem.current = null; return; }
    const newItems = [...itemsInCategory];
    const draggedItemContent = newItems[dragItem.current];
    newItems.splice(dragItem.current, 1);
    newItems.splice(dragOverItem.current, 0, draggedItemContent);
    setIsLoading(true);
    try {
      const updatePromises = newItems.map((item, index) => updateDoc(doc(db, 'menus', item.id), { sortOrder: Date.now() + index * 1000 }));
      await Promise.all(updatePromises);
    } catch (e) { console.error(e); }
    setIsLoading(false);
    dragItem.current = null; dragOverItem.current = null;
  };

  const handleMoveMenu = async (item, direction, itemsInCategory) => {
    const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
    if (direction === 'up' && currentIndex > 0) {
      const prevItem = itemsInCategory[currentIndex - 1];
      const currentOrder = item.sortOrder || item.createdAt || Date.now();
      let prevOrder = prevItem.sortOrder || prevItem.createdAt || (Date.now() - 1000);
      if (currentOrder === prevOrder) prevOrder -= 1;
      await updateDoc(doc(db, 'menus', item.id), { sortOrder: prevOrder });
      await updateDoc(doc(db, 'menus', prevItem.id), { sortOrder: currentOrder });
    } else if (direction === 'down' && currentIndex < itemsInCategory.length - 1) {
      const nextItem = itemsInCategory[currentIndex + 1];
      const currentOrder = item.sortOrder || item.createdAt || Date.now();
      let nextOrder = nextItem.sortOrder || nextItem.createdAt || (Date.now() + 1000);
      if (currentOrder === nextOrder) nextOrder += 1;
      await updateDoc(doc(db, 'menus', item.id), { sortOrder: nextOrder });
      await updateDoc(doc(db, 'menus', nextItem.id), { sortOrder: currentOrder });
    }
  };

  const handleAddTopping = async () => {
    if (!newTopping.name || !newTopping.price) return alert('กรุณากรอกข้อมูลท็อปปิ้งให้ครบถ้วนครับ');
    try { await addDoc(collection(db, 'toppings'), { name: newTopping.name, price: Number(newTopping.price) }); alert('เพิ่มท็อปปิ้งสำเร็จ!'); setNewTopping({ name: '', price: '' }); setShowAddToppingForm(false); } catch (e) { alert(e.message); }
  };

  const handleDeleteTopping = async (id) => { if(window.confirm('ลบท็อปปิ้งนี้ใช่หรือไม่?')) await deleteDoc(doc(db, 'toppings', id)); };

  const handleSearchSubmit = async (term) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim().toLowerCase();
    setSearchHistory(prev => [cleanTerm, ...prev.filter(t => t !== cleanTerm)].slice(0, 5));
    setIsSearchFocused(false); setSearchQuery(term);
    try { await setDoc(doc(db, 'settings', 'search_stats'), { [cleanTerm]: increment(1) }, { merge: true }); } catch (e) { console.error("Error saving search stats", e); }
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryImage) return alert('กรุณาแนบรูปภาพการจัดส่งครับ 📸');
    setIsDelivering(true);
    try {
      const deliveryMessage = deliveryLocation === 'room' ? 'ขอบคุณที่สั่งออเดอร์นะคะ 💖' : 'ขออภัยแอดมินไม่สามารถเข้าตึกได้ รบกวนลูกค้าลงมารับเครื่องดื่มที่หน้าตึกนะคะ 🙏';
      await updateDoc(doc(db, 'orders', deliveryModal.id), { status: 'completed', deliveryLocation: deliveryLocation, deliveryMessage: deliveryMessage, deliveryImage: deliveryImage });
      alert('บันทึกการจัดส่งเรียบร้อย! 🚀'); setDeliveryModal(null);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    setIsDelivering(false);
  };

  const calculateRevenue = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    let daily = 0, monthly = 0, yearly = 0;
    
    const last7DaysMap = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7DaysMap[d.toLocaleDateString('th-TH')] = 0;
    }

    orders.filter(o => o.status === 'completed').forEach(o => {
      if (o.timestamp >= startOfDay) daily += o.total;
      if (o.timestamp >= startOfMonth) monthly += o.total;
      if (o.timestamp >= startOfYear) yearly += o.total;
      const oDate = new Date(o.timestamp).toLocaleDateString('th-TH');
      if(last7DaysMap[oDate] !== undefined) last7DaysMap[oDate] += o.total;
    });
    
    const dailyHistory = Object.keys(last7DaysMap).map(date => ({ date, total: last7DaysMap[date] }));
    return { daily, monthly, yearly, dailyHistory };
  };

  const exportToCSV = () => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    if (completedOrders.length === 0) return alert('ยังไม่มีข้อมูลคำสั่งซื้อที่เสร็จสมบูรณ์ครับ');
    let csv = "\uFEFFวันที่และเวลา,ชื่อลูกค้า,ยอดรวม(บาท),ช่องทางชำระเงิน,จุดจัดส่ง,ที่อยู่\n"; 
    completedOrders.forEach(o => {
      const date = new Date(o.timestamp).toLocaleString('th-TH');
      const payment = o.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน';
      const location = o.deliveryLocation === 'room' ? 'หน้าห้อง' : (o.deliveryLocation === 'building' ? 'หน้าตึก' : '-');
      csv += `"${date}","${(o.lineName||'').replace(/"/g, '""')}",${o.total},${payment},${location},"${(o.address||'').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `สรุปรายรับ_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const updateStoreStatus = async (status) => { try { await setDoc(doc(db, 'settings', 'store'), { isStoreOpen: status }, { merge: true }); alert(`เปลี่ยนสถานะเรียบร้อย! 🐮`); } catch(e) { alert("Error: " + e.message); } };
  const updateTheme = async (newTheme) => { try { await setDoc(doc(db, 'settings', 'store'), { theme: newTheme }, { merge: true }); alert(`เปลี่ยนธีมร้านเป็น ${THEMES[newTheme].name} เรียบร้อย! 🎨`); } catch(e) { alert("Error: " + e.message); } };

  const openOptionModal = (item) => {
    if (item.isSoldOut || (item.isOnlyBlend && storeSettings.isBlendOut)) return;
    setOptionModalItem(item);
    setTempOptions({ 
      sweetness: '100%', 
      isBlended: item.isOnlyBlend ? true : false, 
      addPearl: item.hasFreePearl || false, 
      selectedToppings: [],
      bean: item.category === 'กาแฟ' ? 'คั่วเข้ม' : null,
      teaType: item.hasTeaType ? 'มัทฉะ' : null,
      addShot: false
    });
    if(searchQuery) handleSearchSubmit(searchQuery);
  };

  const getBlendText = (item) => {
    if (item.isOnlyBlend) return 'ปั่น';
    if (item.allowBlend === false) return 'เย็น/ปกติ';
    return item.isBlended ? 'ปั่น' : 'เย็น';
  };

  const copyPromptPay = () => { navigator.clipboard.writeText(storeSettings.promptPayNo || '0812345678').then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }); };

  const bestSellers = React.useMemo(() => {
    const defaultSlice = menuItems.slice(0, 4);
    if (orders.length === 0 || menuItems.length === 0) return defaultSlice;
    const salesCount = {};
    orders.forEach(order => { (order.items || []).forEach(item => { salesCount[item.name] = (salesCount[item.name] || 0) + item.qty; }); });
    let sortedMenus = menuItems.map(menu => ({ ...menu, sales: salesCount[menu.name] || 0 }));
    sortedMenus = sortedMenus.filter(m => m.sales > 0).sort((a, b) => b.sales - a.sales);
    return sortedMenus.length === 0 ? defaultSlice : sortedMenus;
  }, [orders, menuItems]);

  const displayedItems = React.useMemo(() => {
    if (searchQuery) return menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeCategory === '🔥 เมนูขายดี') return bestSellers;
    return menuItems.filter(i => {
       if (activeCategory === 'สมูทตี้โยเกิร์ต') return i.category === 'สมูทตี้โยเกิร์ต' || i.category === 'ผลไม้และสมูทตี้';
       if (activeCategory === 'วิปครีมและครีมชีส') return i.category === 'วิปครีมและครีมชีส' || i.category === 'ครีมและครีมชีส' || i.category === 'เมนูพิเศษ';
       return i.category === activeCategory;
    }).sort((a, b) => (a.sortOrder || a.createdAt || 0) - (b.sortOrder || b.createdAt || 0));
  }, [activeCategory, menuItems, bestSellers, searchQuery]);

  const promotedItems = React.useMemo(() => menuItems.filter(i => i.isPromoted).sort((a, b) => (a.sortOrder || a.createdAt || 0) - (b.sortOrder || b.createdAt || 0)), [menuItems]);

  const sliderRef = useRef(null);
  useEffect(() => {
    if (view !== 'shop' || promotedItems.length <= 1 || searchQuery) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
         const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
         if (scrollLeft + clientWidth >= scrollWidth - 10) sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
         else sliderRef.current.scrollBy({ left: clientWidth * 0.85, behavior: 'smooth' });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [view, promotedItems.length, searchQuery]);

  const revData = calculateRevenue();
  const currentThemeData = THEMES[storeSettings.theme] || THEMES.default;
  const cartTotal = cart.reduce((s,i)=>s+(i.price*i.qty),0);

  const mainContainerStyle = {
    backgroundColor: currentThemeData.bg,
    backgroundImage: storeSettings.theme === 'custom' && storeSettings.customBgImage ? `url(${storeSettings.customBgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500" style={mainContainerStyle}>
      <audio id="orderNotification" ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2854/2854-preview.mp3" preload="auto"></audio>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vollkorn:wght=700&display=swap');
        :root {
          --theme-primary: ${currentThemeData.primary};
          --theme-accent: ${currentThemeData.accent};
          --theme-bg: ${currentThemeData.bg};
        }
        .font-serif { font-family: 'Vollkorn', serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        
        .bg-primary { background-color: var(--theme-primary); color: #fff; }
        .text-primary { color: var(--theme-primary); }
        .bg-accent { background-color: var(--theme-accent); color: #fff; }
        .text-accent { color: var(--theme-accent); }
        .border-accent { border-color: var(--theme-accent); }
        .border-primary { border-color: var(--theme-primary); }
        
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { position: relative; overflow: hidden; }
        .animate-shimmer::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 2.5s infinite; }
        
        @keyframes pulseGlow { from { box-shadow: 0 0 5px rgba(255, 165, 0, 0.2); } to { box-shadow: 0 0 15px rgba(255, 165, 0, 0.6); } }
        .glow-effect { animation: pulseGlow 2s infinite alternate; border: 2px solid #ffd700; }
        
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-3px); } 100% { transform: translateY(0px); } }
        .floating-badge { animation: float 3s ease-in-out infinite; }
        
        .special-bg { background: linear-gradient(135deg, rgba(255,249,240,0.8) 0%, rgba(255,255,255,0.9) 100%); }
        
        @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
        .falling-icon { position: fixed; z-index: 10; animation: fall linear infinite; pointer-events: none; font-size: 1.5rem; opacity: 0.6; }
      `}</style>

      {storeSettings.theme && storeSettings.theme !== 'default' && currentThemeData.icons && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
             <div key={i} className="falling-icon" style={{
                left: `${Math.random() * 100}vw`,
                animationDuration: `${10 + Math.random() * 15}s`,
                animationDelay: `-${Math.random() * 10}s`,
                fontSize: `${1 + Math.random() * 1.5}rem`
             }}>
                {currentThemeData.icons[Math.floor(Math.random() * currentThemeData.icons.length)]}
             </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-[50] bg-white/95 p-4 flex justify-between items-center border-b border-gray-100 shadow-sm relative backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('shop')}>
           {lineProfile.pictureUrl ? <img src={lineProfile.pictureUrl} className="w-10 h-10 rounded-full border-2 border-orange-100" alt="profile" /> : <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">🐮</div>}
           <div>
             <h1 className="font-serif font-bold text-lg leading-tight text-primary">วัวนมอารมณ์ดี</h1>
             <div className="flex items-center gap-1 mt-1">
               <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold text-white shadow-sm flex items-center gap-1 ${storeSettings.isStoreOpen !== false ? 'bg-green-500' : 'bg-red-500'}`}>
                 {storeSettings.isStoreOpen !== false ? '🟢 เปิดแล้วค่ะ' : '🔴 ปิดแล้วค่ะ'}
               </span>
               {(lineProfile.userId || '').startsWith('guest_') ? (
                 <button onClick={handleLineLogin} className="text-[9px] bg-[#06C755] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"><LogIn size={10}/> ล็อกอินด้วย LINE</button>
               ) : (
                 <p className="text-[9px] font-bold text-green-700 uppercase tracking-tighter">คุณ {(lineProfile.displayName || '').slice(0, 10)}</p>
               )}
             </div>
           </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            if (localStorage.getItem('happycow_isAdmin') === 'true') setView('admin');
            else setShowAdminModal(true);
          }} className="p-2 text-gray-400 hover:text-primary transition-colors"><Settings size={18}/></button>
          <button onClick={() => setView('myOrders')} className="p-2 text-gray-400 hover:text-primary transition-colors"><ClipboardList/></button>
          <button onClick={() => setView('cart')} className="relative p-2 bg-primary text-white rounded-xl w-10 h-10 flex items-center justify-center shadow-lg active:scale-90 transition-all">
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{cart.length}</span>}
            <ShoppingCart size={20}/>
          </button>
        </div>
      </header>

      {isSearchFocused && view === 'shop' && <div className="fixed inset-0 z-[40] bg-black/10 backdrop-blur-sm" onClick={() => setIsSearchFocused(false)}></div>}

      <main className="flex-1 pb-10 relative z-10">
        {view === 'shop' && (
          <div className="animate-in fade-in">
            <div className="px-5 pt-4 pb-2 sticky top-[73px] z-[45]" style={{ backgroundColor: currentThemeData.bg }}>
              <div className="relative z-[50]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                   type="text" 
                   value={searchQuery} 
                   onChange={e => setSearchQuery(e.target.value)}
                   onFocus={() => setIsSearchFocused(true)}
                   onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(searchQuery); }}
                   placeholder="ค้นหาเมนูที่คุณอยากดื่ม..." 
                   className="w-full pl-11 pr-10 py-3.5 rounded-[1.5rem] text-sm outline-none shadow-sm focus:ring-2 focus:ring-[var(--theme-accent)] border border-gray-100 bg-white/90 backdrop-blur-sm" 
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:scale-90 bg-gray-100 rounded-full p-1"><X size={14}/></button>
                )}
              </div>

              {isSearchFocused && !searchQuery && (searchHistory.length > 0 || popularSearches.length > 0) && (
                <div className="absolute top-[110%] left-5 right-5 bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl border border-gray-100 p-5 z-[50] animate-in fade-in slide-in-from-top-2">
                   {searchHistory.length > 0 && (
                      <div className="mb-5">
                         <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[11px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider"><Clock size={14}/> ประวัติการค้นหา</h4>
                            <button onClick={() => setSearchHistory([])} className="text-[10px] text-red-400 font-bold bg-red-50 px-2 py-1 rounded-lg">ล้าง</button>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {searchHistory.map(h => (
                               <button key={h} onClick={() => handleSearchSubmit(h)} className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs border border-gray-200 transition-all">{h}</button>
                            ))}
                         </div>
                      </div>
                   )}
                   {popularSearches.length > 0 && (
                      <div>
                         <h4 className="text-[11px] font-bold text-orange-500 flex items-center gap-1 mb-3 uppercase tracking-wider"><TrendingUp size={14}/> คำค้นหายอดฮิต 🔥</h4>
                         <div className="flex flex-wrap gap-2">
                            {popularSearches.map(p => (
                               <button key={p} onClick={() => handleSearchSubmit(p)} className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs border border-orange-100 font-bold transition-all shadow-sm">{p}</button>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              )}
            </div>

            {!searchQuery && promotedItems.length > 0 && (
              <div className="pt-2 pb-2">
                <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth w-full px-5 gap-3">
                  {promotedItems.map(item => (
                    <div key={`promo-${item.id}`} className="w-[85%] flex-shrink-0 snap-center">
                      <div onClick={() => openOptionModal(item)} className={`bg-white/90 backdrop-blur-sm rounded-[2rem] p-3 shadow-md flex items-center gap-4 border border-orange-100 transition-all h-full relative overflow-hidden animate-shimmer glow-effect ${item.isSoldOut ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}>
                         {item.isSoldOut && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                               <div className="bg-primary text-white px-4 py-1.5 rounded-full font-bold text-xs border border-white/50 shadow-xl rotate-[-5deg] tracking-widest flex items-center gap-1">SOLD OUT</div>
                            </div>
                         )}
                         <div className="relative">
                            <img src={item.image} className={`w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl shadow-sm flex-shrink-0 ${item.isSoldOut ? 'grayscale' : ''}`} alt={item.name} />
                            <div className="absolute -bottom-2 -right-2 text-2xl floating-badge drop-shadow-md">🔥</div>
                         </div>
                         <div className="flex-1 flex flex-col justify-center py-1 pr-2">
                            <span className="text-[9px] bg-gradient-to-r from-red-500 to-orange-400 text-white px-2 py-1 rounded-full w-fit mb-1.5 font-bold flex items-center gap-1 shadow-md">
                               <Star size={10} fill="white"/> เมนูแนะนำ (Must Try!)
                            </span>
                            <h4 className="font-bold text-sm leading-tight line-clamp-2 text-primary">{item.name}</h4>
                            <p className="text-accent font-bold text-base mt-1">฿{item.price}</p>
                            <p className="text-[9px] text-orange-600 font-bold mt-1 bg-orange-50 w-fit px-1.5 py-0.5 rounded shadow-sm">สูตรลับเฉพาะทางร้าน ✨</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searchQuery && (
              <div className="mx-5 mb-2 mt-4 p-4 bg-white/80 backdrop-blur-sm border-l-4 border-l-[var(--theme-accent)] rounded-r-2xl shadow-sm animate-in fade-in relative overflow-hidden">
                <h4 className="text-xs font-bold text-accent mb-2 flex items-center gap-1"><AlertCircle size={14}/> เงื่อนไขการสั่งซื้อ (รบกวนอ่านก่อนนะคะ 💖)</h4>
                <ul className="text-[10.5px] text-gray-700 space-y-1.5 pl-4 list-disc font-medium">
                  <li>ส่งถึงหน้าห้อง <span className="font-bold text-accent">เฉพาะกรณีเข้าตึกได้</span> เท่านั้น</li>
                  <li>หากเข้าตึกไม่ได้ / ฝนตก / ลิฟต์พัง ขออนุญาต <span className="font-bold text-accent">แขวนไว้ใต้ตึก</span></li>
                  <li>ระยะเวลารอออร์เดอร์ประมาณ <span className="font-bold">20 นาที (+/-)</span></li>
                  <li>ทางร้านรีบทำและจัดส่งตามคิว <span className="font-bold text-red-500">ขอความกรุณางดเร่งนะคะ 🙏</span></li>
                </ul>
              </div>
            )}

            {!searchQuery && storeSettings.isBlendOut && (
              <div className="mx-5 mb-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm animate-in fade-in text-center flex items-center justify-center gap-2">
                 <Zap size={16} className="text-blue-500"/>
                 <p className="text-xs font-bold text-blue-700">ขออภัยค่ะ วันนี้งดรับออร์เดอร์ <span className="text-red-500">เมนูปั่น</span> ชั่วคราวนะคะ 🙏</p>
              </div>
            )}

            {!searchQuery && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 py-3 sticky top-[138px] z-[40] backdrop-blur-md" style={{ backgroundColor: `${currentThemeData.bg}e6` }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all border ${activeCategory === c && c === '🔥 เมนูขายดี' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : activeCategory === c ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/90 text-gray-500 border-gray-100 hover:bg-white'}`}>{c}</button>
                ))}
              </div>
            )}

            <div className="px-5 pb-5 pt-2">
              {searchQuery && <p className="text-sm font-bold text-primary mb-4 ml-1">ผลการค้นหา "{searchQuery}" ({displayedItems.length} รายการ)</p>}
              {isLoading ? <div className="p-20 text-center opacity-30 italic font-bold text-primary">กำลังเตรียมเมนูแสนอร่อย... 🐮</div> : (
                <div className="grid grid-cols-2 gap-5">
                  {displayedItems.map((item, index) => {
                    const isSpecial = item.category === 'วิปครีมและครีมชีส' || item.category === 'ครีมและครีมชีส' || item.category === 'เมนูพิเศษ';
                    const isBestSeller = !searchQuery && activeCategory === '🔥 เมนูขายดี';
                    const isBlendUnavailable = item.isOnlyBlend && storeSettings.isBlendOut;
                    const isDisabled = item.isSoldOut || isBlendUnavailable;
                    return (
                    <div key={item.id} onClick={() => openOptionModal(item)} className={`rounded-[2rem] overflow-hidden shadow-sm transition-all relative ${isSpecial ? 'special-bg glow-effect border border-orange-100' : 'bg-white/90 backdrop-blur-sm border border-white/50'} ${isDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:-translate-y-1 active:scale-95'}`}>
                      
                      {item.isSoldOut && (
                         <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                            <div className="bg-primary text-white px-4 py-1.5 rounded-full font-bold text-[11px] border border-white/50 shadow-xl rotate-[-10deg] tracking-wider">หมดชั่วคราว</div>
                         </div>
                      )}
                      
                      {!item.isSoldOut && isBlendUnavailable && (
                         <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                            <div className="bg-blue-500 text-white px-4 py-1.5 rounded-full font-bold text-[11px] border border-blue-200 shadow-xl rotate-[-10deg] tracking-wider text-center leading-tight">เมนูปั่น<br/>หมดชั่วคราว</div>
                         </div>
                      )}

                      {item.hasFreePearl && !isDisabled && <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-400 to-red-400 text-white text-[8px] px-2 py-0.5 rounded-full font-bold shadow-md z-10 flex items-center gap-0.5 floating-badge"><Star size={8} fill="white"/> ฟรีไข่มุก!</div>}
                      
                      {isBestSeller && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 shadow-md flex items-center gap-1 border border-white/20">อันดับ {index + 1} 👑</div>
                      )}
                      
                      {isSpecial && !isBestSeller && (
                        <div className="absolute top-2 left-2 bg-accent text-white text-[9px] font-bold px-2 py-1 rounded-lg z-10 shadow-md">🌟 Limited</div>
                      )}

                      <div className="aspect-square bg-gray-50 relative">
                         <img src={item.image} className={`w-full h-full object-cover ${isDisabled ? 'grayscale' : ''}`} alt={item.name} />
                         {item.sales > 10 && (
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold floating-badge">ฮิตมาก 🔥</div>
                         )}
                      </div>
                      <div className="p-4 text-center">
                        <h4 className="font-bold text-sm mb-1 line-clamp-1 text-primary">{item.name}</h4>
                        <p className="text-accent font-bold text-sm">฿{item.price}</p>
                        {isBestSeller && item.sales > 0 && <p className="text-[9px] text-green-600 font-bold mt-1 bg-green-50 rounded px-1 py-0.5 inline-block shadow-sm">ขายไปแล้ว {item.sales} แก้ว</p>}
                        {isSpecial && !isBestSeller && <p className="text-[8px] text-accent mt-1 font-bold">เมนูสุดพรีเมียม</p>}
                      </div>
                    </div>
                  )})}
                  
                  {displayedItems.length === 0 && (
                    <div className="col-span-2 py-20 text-center flex flex-col items-center gap-4 bg-white/50 rounded-3xl backdrop-blur-sm">
                      <AlertCircle size={40} className="text-gray-300" />
                      <p className="text-gray-500 text-sm font-bold">
                        {searchQuery ? `ไม่พบเมนูที่ตรงกับ "${searchQuery}"` : `ยังไม่มีเมนูในหมวด "${activeCategory}"`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Cart View --- */}
        {view === 'cart' && (
          <div className="p-6 space-y-6 bg-white rounded-t-[3rem] mt-4 min-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-10 relative z-20">
            <button onClick={() => setView('shop')} className="flex items-center gap-2 font-bold text-gray-400 text-sm hover:text-primary transition-colors"><ChevronLeft size={20}/> เลือกเมนูเพิ่ม</button>
            <h2 className="text-3xl font-serif font-bold text-primary">ตะกร้าของคุณ</h2>
            <div className="space-y-4">
               {cart.map(i => (
                 <div key={i.cartId} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex-1 font-bold text-sm text-primary">
                     {i.qty}x {i.name} <br/>
                     <span className="text-gray-400 text-[10px] uppercase">
                       ({getBlendText(i)} • หวาน {i.sweetness}{i.bean ? ` • ${i.bean}` : ''}{i.teaType ? ` • ${i.teaType}` : ''}{i.addShot ? ' • เพิ่มช็อต' : ''}{i.hasFreePearl ? (i.addPearl ? ' • มุกฟรี' : ' • ไม่รับมุกฟรี') : ''})
                       {i.selectedToppings?.length > 0 && ` • เพิ่ม: ${i.selectedToppings.map(t=>t.name).join(', ')}`}
                     </span>
                   </div>
                   <div className="flex items-center gap-4"><p className="font-bold text-accent">฿{i.price * i.qty}</p><button onClick={() => setCart(prev => prev.filter(item => item.cartId !== i.cartId))} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                 </div>
               ))}
               {cart.length === 0 && <div className="py-20 text-center opacity-30 italic font-bold text-gray-400">ยังไม่มีสินค้าในตะกร้า 🐮</div>}
            </div>

            {cart.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-accent uppercase tracking-wider block">วิธีชำระเงิน</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setPaymentMethod('promptpay')} className={`py-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${paymentMethod === 'promptpay' ? 'border-accent bg-[var(--theme-bg)] text-primary shadow-sm' : 'border-gray-50 text-gray-300 bg-white'}`}><CreditCard size={20}/><span className="text-[10px]">โอนพร้อมเพย์</span></button>
                    <button onClick={() => setPaymentMethod('cash')} className={`py-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-accent bg-[var(--theme-bg)] text-primary shadow-sm' : 'border-gray-50 text-gray-300 bg-white'}`}><Banknote size={20}/><span className="text-[10px]">ชำระเงินสด</span></button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">ที่อยู่จัดส่ง</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="ระบุเลขที่ห้อง / ชื่อตึก / จุดสังเกต..." className="w-full p-5 rounded-3xl bg-gray-50 h-24 text-sm outline-none border border-transparent focus:border-accent focus:bg-white transition-all shadow-inner" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-accent uppercase tracking-wider block mb-2 flex items-center gap-1"><MessageSquare size={14}/> หมายเหตุถึงร้านค้า</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น หวานน้อย, ไม่รับหลอด..." className="w-full p-4 rounded-2xl bg-gray-50 text-sm outline-none border border-transparent focus:border-accent focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>
                
                {paymentMethod === 'promptpay' && (
                  <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center relative overflow-hidden">
                    <p className="text-xs font-bold mb-4 text-primary">สแกนชำระเงิน พร้อมแนบสลิป</p>
                    {storeSettings.qrCodeImage ? (
                      <img src={storeSettings.qrCodeImage} className="w-40 h-40 mx-auto mb-4 bg-white p-2 rounded-xl object-contain shadow-sm" alt="QR Code ร้าน" />
                    ) : (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY:${storeSettings.promptPayNo}:${cartTotal}`} className="w-40 h-40 mx-auto mb-4 bg-white p-2 rounded-xl" alt="QR Code อัตโนมัติ" />
                    )}
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <p className="text-xs text-gray-500 font-bold">พร้อมเพย์: {storeSettings.promptPayNo || '0812345678'}</p>
                      <button onClick={copyPromptPay} className="flex items-center gap-1 bg-white border border-gray-200 text-accent px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-all">
                        {isCopied ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14}/>}
                        <span className="text-[10px] font-bold">{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกเลข'}</span>
                      </button>
                    </div>

                    <label className="cursor-pointer bg-primary text-white py-4 px-8 rounded-2xl text-[11px] font-bold inline-flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                      <Upload size={18}/> {slipImage ? 'เปลี่ยนรูปสลิปใหม่' : 'แนบรูปสลิป'}
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files[0];
                        if (file) {
                           setSlipImage('');
                           setSlipStatus('checking');
                           try {
                             const comp = await compressImage(file);
                             setSlipImage(comp);
                             setTimeout(() => setSlipStatus('valid'), 2000);
                           } catch (err) {
                             console.error(err);
                             setSlipStatus('idle');
                           }
                        }
                      }} />
                    </label>

                    {slipImage && (
                       <div className="mt-5 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                          <img src={slipImage} className="h-32 mx-auto rounded-lg shadow-sm border border-gray-100 mb-3 object-contain bg-gray-50" alt="Slip Preview" />
                          {slipStatus === 'checking' && (
                             <div className="flex flex-col items-center gap-2 text-blue-500 animate-pulse">
                               <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[10px] font-bold">กำลังตรวจสอบความถูกต้องของสลิป...</span>
                             </div>
                          )}
                          {slipStatus === 'valid' && (
                             <div className="bg-green-50 text-green-600 p-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 border border-green-100 animate-in zoom-in">
                               <CheckCircle size={14}/> ยอดเงินตรงกับออร์เดอร์ (จำลองตรวจ AI)
                             </div>
                          )}
                       </div>
                    )}
                  </div>
                )}
                
                <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${acceptedTerms ? 'border-green-400 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${acceptedTerms ? 'text-green-700' : 'text-red-600'} mb-1`}>ฉันรับทราบและยอมรับเงื่อนไข</p>
                    <ul className="text-[9.5px] text-gray-600 space-y-1 list-disc pl-3 font-medium">
                      <li>ส่งหน้าห้องเฉพาะเข้าตึกได้ (เข้าไม่ได้/ฝนตก = <span className="font-bold text-red-500">แขวนใต้ตึก</span>)</li>
                      <li>รอออร์เดอร์ 20 นาที (+/-) / จัดส่งตามคิว <span className="text-red-500 font-bold">งดเร่ง</span></li>
                    </ul>
                  </div>
                </label>
                
                {storeSettings.isStoreOpen !== false ? (
                  <button 
                    onClick={async () => {
                      if (!window.liff.isLoggedIn()) {
                        return window.liff.login();
                      }
                      if ((lineProfile.userId || '').startsWith('guest_')) {
                        return alert("⚠️ กรุณาล็อกอินบัญชี LINE ก่อนสั่งซื้อครับ");
                      }
                      if (!address) return alert("กรุณากรอกที่อยู่จัดส่งครับ");
                      if (paymentMethod === 'promptpay' && !slipImage) return alert("กรุณาแนบสลิปการโอนเงินครับ");
                      
                      setIsLoading(true);
                      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                      
                      try {
                        const orderRef = await addDoc(collection(db, 'orders'), {
                          items: cart, total, status: 'pending', timestamp: Date.now(),
                          userId: lineProfile.userId, lineName: lineProfile.displayName, address, note,
                          slipImage: paymentMethod === 'promptpay' ? slipImage : 'cash_payment', paymentMethod
                        });

                        const flexPayload = {
                          type: "bubble",
                          header: {
                            type: "box", layout: "vertical", backgroundColor: "#3D2C1E",
                            contents: [
                              { type: "text", text: "วัวนมอารมณ์ดี 🐮", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
                              { type: "text", text: `ใบสั่งซื้อเครื่องดื่มดิจิทัล [บิล #${orderRef.id.slice(0, 6)}]`, color: "#A67C52", size: "xs", align: "center", margin: "xs" }
                            ]
                          },
                          body: {
                            type: "box", layout: "vertical", spacing: "md",
                            contents: [
                              { type: "text", text: `👤 คุณลูกค้า: ${lineProfile.displayName}`, weight: "bold", size: "sm" },
                              { type: "text", text: `📱 ช่องทางชำระ: ${paymentMethod === 'promptpay' ? 'โอนเงินพร้อมเพย์' : 'เงินสด'}`, size: "xs", color: "#666666" },
                              { type: "separator" },
                              ...cart.map(i => ({
                                type: "box", layout: "vertical", margin: "sm",
                                contents: [
                                  { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: `${i.qty}x ${i.name}`, size: "xs", weight: "bold", flex: 3, wrap: true },
                                    { type: "text", text: `฿${i.price * i.qty}`, size: "xs", align: "end", flex: 1, weight: "bold" }
                                  ]},
                                  { type: "text", text: `(${getBlendText(i)} • หวาน ${i.sweetness}${i.bean ? ` • ${i.bean}` : ''})`, size: "xxs", color: "#999999", margin: "xs" }
                                ]
                              })),
                              { type: "separator" },
                              { type: "box", layout: "vertical", contents: [
                                { type: "text", text: "📍 ที่อยู่จัดส่ง:", size: "xs", weight: "bold", color: "#3D2C1E" },
                                { type: "text", text: address, size: "xs", wrap: true, color: "#555555", margin: "xs" }
                              ]},
                              note.trim() ? { type: "text", text: `💬 หมายเหตุ: ${note}`, size: "xs", color: "#ea580c" } : { type: "spacer", size: "xs" },
                              { type: "separator" },
                              { type: "box", layout: "horizontal", contents: [
                                { type: "text", text: "ยอดรวมรวมทั้งสิ้น", weight: "bold", size: "sm" },
                                { type: "text", text: `฿${total}`, align: "end", weight: "bold", color: "#dc2626", size: "md" }
                              ]}
                            ]
                          },
                          footer: {
                            type: "box", layout: "vertical",
                            contents: [
                              { type: "button", style: "primary", color: "#A67C52", action: {
                                type: "uri", label: "📄 ตรวจสอบสถานะบิล",
                                uri: `https://liff.line.me/${LIFF_ID}?action=viewOrders`
                              }}
                            ]
                          }
                        };

                        if (window.liff.isApiAvailable('shareTargetPicker')) {
                          window.liff.shareTargetPicker([{
                            type: "flex",
                            altText: `🐮 มีออร์เดอร์ใหม่จากคุณ ${lineProfile.displayName} (฿${total})`,
                            contents: flexPayload
                          }]).then((res) => {
                            if (res) {
                              alert("ส่งบิลเรียบร้อย! ข้อมูลออร์เดอร์ส่งตรงเข้าแชท LINE เรียบร้อยแล้วครับ 🐮🎉");
                              setCart([]); setSlipImage(''); setSlipStatus('idle'); setAddress(''); setNote(''); setAcceptedTerms(false); setView('myOrders');
                            } else {
                              alert("⚠️ คุณยกเลิกการเลือกผู้รับ บิลจึงยังส่งไม่สำเร็จเข้า LINE (แต่บันทึกเข้าระบบหลังบ้านแล้ว) รบกวนกดแชร์บิลอีกครั้งนะครับ");
                            }
                          }).catch(err => {
                            console.error(err);
                            alert("LINE Share Picker Error: " + err.message + "\n*กรุณาตรวจสอบว่าได้เปิดสิทธิ์ shareTargetPicker ใน LINE Developers Console แล้วหรือยัง");
                            setCart([]); setSlipImage(''); setSlipStatus('idle'); setAddress(''); setNote(''); setAcceptedTerms(false); setView('myOrders');
                          });
                        } else {
                          alert("อุปกรณ์นี้ไม่รองรับระบบส่งแชทอัตโนมัติของ LINE กรุณาเปิดผ่านแอปพลิเคชัน LINE บนมือถือครับ");
                          setCart([]); setSlipImage(''); setSlipStatus('idle'); setAddress(''); setNote(''); setAcceptedTerms(false); setView('myOrders');
                        }
                      } catch (err) {
                        alert("เกิดข้อผิดพลาดในการบันทึกออเดอร์: " + err.message);
                      }
                      setIsLoading(false);
                    }}
                    disabled={isLoading || (paymentMethod === 'promptpay' && (!slipImage || slipStatus === 'checking')) || !acceptedTerms} 
                    className={`w-full py-5 rounded-[2.5rem] font-bold text-lg transition-all shadow-xl active:scale-95 flex justify-center items-center gap-2 ${ (paymentMethod === 'cash' || (slipImage && slipStatus === 'valid')) && acceptedTerms ? 'bg-accent text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                     {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                     {isLoading ? 'กำลังประมวลผล...' : `ส่งบิลเข้า LINE ร้านค้า • ฿${cartTotal}`}
                  </button>
                ) : (
                  <button disabled className="w-full py-5 bg-gray-300 text-white rounded-[2.5rem] font-bold text-lg shadow-xl cursor-not-allowed flex items-center justify-center gap-2">
                     <AlertCircle size={20}/> ร้านปิดรับออเดอร์ชั่วคราว
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- My Orders View --- */}
        {view === 'myOrders' && (
          <div className="p-6 space-y-6 flex-1 bg-white rounded-t-[3rem] mt-4 min-h-[85vh] shadow-2xl relative z-20">
             <button onClick={() => setView('shop')} className="flex items-center gap-2 font-bold text-gray-400 text-sm hover:text-primary"><ChevronLeft size={20}/> กลับไปหน้าร้าน</button>
             <h2 className="text-3xl font-serif font-bold text-primary">ประวัติการสั่งซื้อ</h2>
             
             {isLoadingOrders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 animate-in fade-in">
                   <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-accent font-bold text-sm text-center">กำลังเปิดประวัติการสั่งซื้อ<br/>รอระบบสักครู่นะคะ 🐮...</p>
                </div>
             ) : (
                 <div className="space-y-6">
                   {orders.filter(o => o.userId === lineProfile.userId).map(o => (
                       <div key={o.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                            <div><span className="text-[10px] font-bold text-accent uppercase tracking-wider">บิล #{o.id.slice(0,6)}</span><p className="text-xs font-bold text-orange-400 mt-1 uppercase">{o.status}</p></div>
                            <div className="text-2xl font-serif font-bold text-primary">฿{o.total}</div>
                          </div>
                          
                          <div className="space-y-1">{(o.items || []).map((item, idx) => (
                              <p key={idx} className="text-[11px] font-bold text-gray-500">
                                {item.qty}x {item.name} ({getBlendText(item)} • หวาน {item.sweetness}{item.bean ? ` • ${item.bean}` : ''})
                              </p>
                          ))}</div>

                          {o.status === 'completed' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              {o.deliveryMessage && (
                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-3">
                                  <p className="text-[10px] font-bold text-accent mb-1 flex items-center gap-1"><MessageSquare size={12}/> ข้อความจากทางร้าน:</p>
                                  <p className="text-[11px] text-gray-600 font-bold">{o.deliveryMessage}</p>
                                </div>
                              )}
                              {o.deliveryImage && (
                                <button onClick={() => setSelectedSlip(o.deliveryImage)} className="w-full bg-primary text-white py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                                   <Camera size={16}/> ดูรูปถ่ายตอนจัดส่งสินค้า
                                </button>
                              )}
                            </div>
                          )}
                       </div>
                   ))}
                 </div>
             )}
          </div>
        )}

        {/* --- Admin View --- */}
        {view === 'admin' && (
          <div className="p-6 bg-white min-h-screen animate-in fade-in relative z-20">
            <button onClick={() => setView('shop')} className="flex items-center gap-2 font-bold text-gray-400 text-sm mb-6 hover:text-primary"><ChevronLeft size={20}/> กลับหน้าร้าน</button>
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-serif font-bold text-primary">ระบบแอดมินร้าน</h2>
               <button onClick={playNotificationSound} className="text-[10px] bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><BellRing size={12}/> เทสเสียงระบบเตือนบิล</button>
            </div>
            
            <div className="flex gap-1 bg-gray-50 p-1 rounded-2xl mb-6 shadow-inner">
              {['orders', 'menus', 'dashboard', 'settings'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${adminTab === t ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-primary'}`}>
                  {t === 'orders' ? 'ออร์เดอร์' : t === 'menus' ? 'เมนู' : t === 'dashboard' ? 'รายรับ' : 'ตั้งค่า'}
                </button>
              ))}
            </div>

            {/* TAB: Dashboard */}
            {adminTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl">
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                    <TrendingUp size={20} />
                    <h3 className="font-bold text-sm">สรุปยอดขายวันนี้</h3>
                  </div>
                  <h1 className="text-5xl font-serif font-bold">฿{revData.daily.toLocaleString()}</h1>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 border border-orange-100 p-5 rounded-[2rem] shadow-sm">
                    <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">ยอดขายเดือนนี้</p>
                    <h2 className="text-2xl font-bold text-primary">฿{revData.monthly.toLocaleString()}</h2>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-[2rem] shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">ยอดขายปีนี้</p>
                    <h2 className="text-2xl font-bold text-primary">฿{revData.yearly.toLocaleString()}</h2>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mt-4">
                   <h3 className="font-bold text-sm text-primary mb-4 border-b border-gray-50 pb-3 flex items-center gap-2"><Clock size={16}/> สรุปรายรับรายวัน (7 วันล่าสุด)</h3>
                   <div className="space-y-3">
                      {revData.dailyHistory.map((d, idx) => (
                         <div key={idx} className="flex justify-between items-center text-sm">
                            <span className={idx === 0 ? "font-bold text-accent" : "text-gray-500 font-bold"}>{idx === 0 ? `วันนี้ (${d.date})` : d.date}</span>
                            <span className={`font-bold ${idx === 0 ? "text-accent" : "text-primary"}`}>฿{d.total.toLocaleString()}</span>
                         </div>
                      ))}
                   </div>
                </div>

                <button onClick={exportToCSV} className="w-full bg-[#0F9D58] text-white py-5 rounded-[2rem] font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                  <Download size={18} /> Export บัญชีรายรับ (CSV)
                </button>
              </div>
            )}

            {/* TAB: Orders */}
            {adminTab === 'orders' && (
              <div className="space-y-4">
                {orders.map((o, idx) => (
                    <div key={o.id} className={`border p-5 rounded-3xl shadow-sm bg-white animate-in fade-in transition-colors ${o.status === 'pending' ? 'border-orange-300 bg-orange-50/30' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2"><span className="bg-primary text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold">#{orders.length - idx}</span><span className="font-bold text-sm text-primary">{o.lineName}</span></div>
                        <div className="text-right"><span className="text-orange-600 font-bold block">฿{o.total}</span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{o.paymentMethod === 'cash' ? '💵 จ่ายสด' : '📱 โอนเงิน'}</span></div>
                      </div>
                      <div className="text-[10px] text-gray-500 mb-3 flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100"><MapPin size={12} className="flex-shrink-0 text-accent"/> {o.address}</div>
                      
                      <div className="space-y-1 border-t border-gray-100 pt-3 mb-3">{(o.items || []).map((i, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex justify-between font-medium">
                            <span>{i.qty}x {i.name} ({getBlendText(i)} • หวาน {i.sweetness})</span>
                            <span className="font-bold">฿{i.price * i.qty}</span>
                          </div>
                      ))}</div>

                      <div className="grid grid-cols-2 gap-2 mb-2 mt-4">
                        {o.paymentMethod !== 'cash' && <button onClick={() => setSelectedSlip(o.slipImage)} className="bg-blue-50 text-blue-600 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"><Eye size={14}/> ตรวจสลิป</button>}
                        <button onClick={() => deleteDoc(doc(db, 'orders', o.id))} className="bg-red-50 text-red-500 py-3 rounded-xl flex items-center justify-center active:scale-95 transition-all"><Trash2 size={16}/></button>
                      </div>

                      <div className="flex gap-2 border-t border-gray-100 pt-3 mt-2">
                        {o.status === 'pending' && <button onClick={() => updateDoc(doc(db, 'orders', o.id), { status: 'cooking' })} className="flex-1 bg-orange-400 text-white py-4 rounded-xl text-[11px] font-bold shadow-lg active:scale-95 transition-all">กดยอมรับออเดอร์</button>}
                        {o.status === 'cooking' && (
                          <button onClick={() => { setDeliveryModal(o); setDeliveryImage(''); setDeliveryLocation('room'); }} className="flex-1 bg-green-500 text-white py-4 rounded-xl text-[11px] font-bold shadow-md flex items-center justify-center gap-1 active:scale-95 transition-all">
                             <Check size={14}/> จัดส่งสินค้าแล้ว
                          </button>
                        )}
                        {o.status === 'completed' && <div className="flex-1 text-center text-[10px] font-bold text-green-600 py-2 border border-green-200 rounded-xl bg-green-50">ส่งเรียบร้อย</div>}
                      </div>
                    </div>
                ))}
                {orders.length === 0 && <div className="py-20 text-center text-gray-400 font-bold opacity-50">ยังไม่มีออร์เดอร์ใหม่เข้าครับ 🐮</div>}
              </div>
            )}

            {/* TAB: Menus */}
            {adminTab === 'menus' && (
              <div className="space-y-8 animate-in fade-in">
                
                {/* 🌟 [NEW] ปุ่มสร้างป้าย Menu Board */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-[2rem] border border-red-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="bg-white p-3 rounded-full shadow-md text-red-500 mb-3">
                     <Palette size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-red-800 mb-1">สร้างป้ายเมนูรวม (Menu Board)</h3>
                  <p className="text-[10px] text-red-600 mb-4">ระบบจะนำเมนูและท็อปปิ้งทั้งหมดมาสร้างเป็นรูปป้าย A4 แนวตั้งอัตโนมัติ สำหรับโพสต์โซเชียลหรือปริ้นต์</p>
                  <button onClick={() => setShowMenuBoardModal(true)} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                     <Upload size={16} /> สร้างและดูรูปตัวอย่าง
                  </button>
                </div>

                <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 relative">
                   <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input type="text" value={adminSearchQuery} onChange={e => setAdminSearchQuery(e.target.value)} placeholder="ค้นหาชื่อเมนู..." className="w-full pl-12 pr-10 py-4 rounded-2xl text-sm outline-none bg-white focus:ring-2 focus:ring-[var(--theme-accent)] transition-all"/>
                </div>

                <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 shadow-inner relative">
                  {!showAddMenuForm ? (
                     <button onClick={() => setShowAddMenuForm(true)} className="w-full py-2 text-accent font-bold flex items-center justify-center gap-2 hover:bg-gray-100 rounded-2xl transition-all"><Plus size={18}/> คลิกเพื่อเพิ่มเมนูใหม่</button>
                  ) : (
                    <div className="space-y-4 text-center animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-2">
                        <h3 className="font-bold text-sm text-accent uppercase tracking-widest flex items-center gap-2"><Plus size={16}/> เพิ่มเมนูใหม่</h3>
                        <button onClick={() => setShowAddMenuForm(false)} className="text-gray-400 p-1 hover:bg-gray-200 rounded-full"><X size={16}/></button>
                      </div>
                      <input type="text" placeholder="ชื่อเมนู" className="w-full p-4 rounded-2xl text-sm outline-none bg-white" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} />
                      <div className="flex gap-2">
                        <input type="number" placeholder="ราคา" className="w-1/2 p-4 rounded-2xl text-sm outline-none bg-white" value={newMenu.price} onChange={e => setNewMenu({...newMenu, price: e.target.value})} />
                        <select className="w-1/2 p-4 rounded-2xl text-sm bg-white" value={newMenu.category} onChange={e => setNewMenu({...newMenu, category: e.target.value})}>
                          {CATEGORIES.filter(c => c !== '🔥 เมนูขายดี').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <label className="cursor-pointer bg-white border border-gray-200 p-4 rounded-2xl text-xs font-bold block shadow-sm text-gray-400">
                        <Upload size={18} className="inline mr-2"/> {newMenu.image ? 'เปลี่ยนรูปเมนู' : 'อัปโหลดรูปภาพเมนู'}
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files[0];
                          if (file) { setNewMenu({...newMenu, image: await compressImage(file)}); }
                        }} />
                      </label>
                      <button onClick={handleAddNewMenu} className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"><Plus size={18}/> บันทึกเมนูใหม่</button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {CATEGORIES.filter(c => c !== '🔥 เมนูขายดี').map(category => {
                    let itemsInCategory = menuItems.filter(item => item.category === category);
                    if (adminSearchQuery) itemsInCategory = itemsInCategory.filter(item => item.name.toLowerCase().includes(adminSearchQuery.toLowerCase()));
                    if (itemsInCategory.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-bold text-md text-primary ml-1">{category}</h4>
                        {itemsInCategory.map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="drink" />
                              <div>
                                <p className="font-bold text-sm text-primary">{item.name}</p>
                                <p className="text-xs text-accent font-bold">฿{item.price}</p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteMenu(item.id)} className="p-2 text-red-500 bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: Settings */}
            {adminTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-4 shadow-sm">
                  <h3 className="font-bold text-sm text-indigo-700 uppercase tracking-widest text-center flex items-center justify-center gap-2"><Palette size={16}/> เลือกธีมร้านค้าดิจิทัล</h3>
                  <div className="grid grid-cols-2 gap-3">
                     {Object.entries(THEMES).map(([key, theme]) => (
                        <button key={key} onClick={() => updateTheme(key)} className={`py-3 px-2 rounded-2xl font-bold text-[11px] transition-all border-2 flex items-center justify-center ${storeSettings.theme === key ? 'border-indigo-500 bg-indigo-600 text-white shadow-md' : 'border-white bg-white text-gray-600'}`}>
                           {theme.name}
                        </button>
                     ))}
                  </div>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-200 space-y-4">
                  <h3 className="font-bold text-sm text-accent uppercase tracking-widest text-center">สถานะการเปิดรับบิลหน้าร้าน</h3>
                  <div className="flex gap-3">
                    <button onClick={() => updateStoreStatus(true)} className={`flex-1 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 ${storeSettings.isStoreOpen !== false ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-400'}`}><CheckCircle size={18}/> เปิดร้าน</button>
                    <button onClick={() => updateStoreStatus(false)} className={`flex-1 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 ${storeSettings.isStoreOpen === false ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-400'}`}><X size={18}/> ปิดร้าน</button>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-200 space-y-4 shadow-inner">
                  <h3 className="font-bold text-sm text-accent uppercase tracking-widest text-center">ตั้งค่าพร้อมเพย์สำหรับสร้าง QR</h3>
                  <input type="text" placeholder="หมายเลขพร้อมเพย์" className="w-full p-4 rounded-2xl text-sm border-transparent focus:ring-accent bg-white shadow-sm" value={editPromptPay} onChange={e => setEditPromptPay(e.target.value)} />
                  <button onClick={async () => {
                    try { await setDoc(doc(db, 'settings', 'store'), { promptPayNo: editPromptPay, qrCodeImage: editQrCodeImage }, { merge: true }); alert('อัปเดตการชำระเงินของร้านสำเร็จ! 🐮'); } catch(e) { alert("Error: " + e.message); }
                  }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm active:scale-95 shadow-md">บันทึกข้อมูลธนาคาร</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- Modal เลือกออปชันเมนู --- */}
      {optionModalItem && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-t-[3.5rem] w-full max-w-md p-10 space-y-10 animate-in slide-in-from-bottom-full duration-500 shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-serif font-bold text-primary">{optionModalItem.name}</h3><button onClick={() => setOptionModalItem(null)} className="p-4 bg-gray-50 rounded-2xl text-gray-400"><X/></button></div>
            <div className="space-y-8">
              <div><label className="text-[10px] font-bold block mb-4 text-gray-400 uppercase tracking-widest">ความหวาน</label>
                <div className="grid grid-cols-3 gap-2">{SWEETNESS.map(l => (
                    <button key={l} onClick={() => setTempOptions({...tempOptions, sweetness: l})} className={`py-3.5 rounded-2xl text-[10px] font-bold border transition-all ${tempOptions.sweetness === l ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}>{l}</button>
                ))}</div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                 <button onClick={() => setTempOptions({...tempOptions, isBlended: false})} className={`py-8 rounded-[2.5rem] border-2 font-bold flex flex-col items-center gap-4 transition-all ${!tempOptions.isBlended ? 'border-accent bg-[var(--theme-bg)] text-primary' : 'border-gray-50 text-gray-300 bg-white'}`}><Coffee size={32}/><span className="text-xs uppercase">เย็น</span></button>
                 <button onClick={() => setTempOptions({...tempOptions, isBlended: true})} className={`py-8 rounded-[2.5rem] border-2 font-bold flex flex-col items-center gap-4 transition-all ${tempOptions.isBlended ? 'border-accent bg-[var(--theme-bg)] text-primary' : 'border-gray-50 text-gray-300 bg-white'}`}><Zap size={32}/><span className="text-xs uppercase text-center">ปั่น (+฿{getAddedBlendPrice(optionModalItem)})</span></button>
              </div>
            </div>
            
            <button onClick={() => {
                const isItemBlended = tempOptions.isBlended;
                const finalP = optionModalItem.price + (isItemBlended ? getAddedBlendPrice(optionModalItem) : 0);
                const cartId = `${optionModalItem.id}-${tempOptions.sweetness}-${isItemBlended}`;
                
                setCart(prev => {
                  const ex = prev.find(i => i.cartId === cartId);
                  if (ex) return prev.map(i => i.cartId === cartId ? { ...i, qty: i.qty + 1 } : i);
                  return [...prev, { ...optionModalItem, price: finalP, cartId, ...tempOptions, qty: 1 }];
                });
                setOptionModalItem(null);
              }} className="w-full py-6 bg-primary text-white rounded-[2.5rem] font-bold text-lg active:scale-95 flex items-center justify-center gap-3 shadow-xl hover:opacity-90 transition-all">
                <Plus size={24}/> เพิ่มลงตะกร้าเครื่องดื่ม
            </button>
          </div>
        </div>
      )}

      {/* Modal ถ่ายรูปส่งของ */}
      {deliveryModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-primary">ยืนยันและถ่ายรูปจัดส่ง</h3>
              <button onClick={() => setDeliveryModal(null)} className="text-gray-400 p-2"><X size={20}/></button>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 text-center">
               <label className="cursor-pointer bg-white border border-gray-200 text-gray-500 py-3 px-6 rounded-xl text-[11px] font-bold inline-flex items-center gap-2 shadow-sm">
                  <Camera size={16}/> ถ่ายรูปหลักฐานการแขวนของ
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                     const file = e.target.files[0];
                     if(file){ setDeliveryImage(await compressImage(file)); }
                  }} />
               </label>
               {deliveryImage && <img src={deliveryImage} className="mt-4 h-32 w-full object-cover rounded-xl shadow-sm" alt="Delivery Proof"/>}
            </div>
            <button onClick={handleConfirmDelivery} disabled={!deliveryImage} className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 bg-green-500 text-white ${!deliveryImage && 'opacity-50 cursor-not-allowed'}`}>อัปเดตสถานะบิลจัดส่งแล้ว</button>
          </div>
        </div>
      )}

      {/* Modal ดูสลิป */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl animate-in zoom-in" alt="slip preview" />
        </div>
      )}

      {/* Modal แอดมินล็อกอินควบคุมระบบหลังบ้าน */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl text-center">
            <h3 className="font-bold text-xl mb-8 text-primary">แอดมินเข้าสู่ระบบ</h3>
            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-2xl mb-8 text-center text-3xl outline-none tracking-[0.5em] focus:border-accent shadow-inner" placeholder="••••••" />
            <div className="flex gap-4">
               <button onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl">ยกเลิก</button>
               <button onClick={() => {
                 if(adminPassword === '570402') { 
                    localStorage.setItem('happycow_isAdmin', 'true');
                    setView('admin'); setShowAdminModal(false); setAdminPassword(''); 
                 } else { alert('รหัสผ่านไม่ถูกต้องครับ!'); setAdminPassword(''); }
               }} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 🌟 [NEW] Modal แสดงรูปภาพที่สร้างเสร็จ --- */}
      {generatedPreview && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center p-4 animate-in zoom-in backdrop-blur-md">
          <button onClick={() => setGeneratedPreview(null)} className="absolute top-4 right-4 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition-all"><X size={24}/></button>
          
          <div className="bg-white/10 px-6 py-3 rounded-full mb-6 border border-white/20 text-center animate-pulse">
            <p className="text-white font-bold flex items-center justify-center gap-2"><Download size={20}/> สร้างป้ายเมนูสำเร็จ!</p>
            <p className="text-white/80 text-[11px] mt-1">📱 <b>บนมือถือ/แท็บเล็ต:</b> แตะค้างที่รูปภาพ ด้านล่าง แล้วเลือก "บันทึกรูปภาพ"</p>
          </div>

          <div className="relative w-full max-w-md max-h-[60vh] overflow-auto hide-scrollbar rounded-2xl shadow-2xl border-4 border-white/20 bg-white">
            <img src={generatedPreview.src} className="w-full object-contain" alt="Generated Poster" />
          </div>

          <a href={generatedPreview.src} download={generatedPreview.name} className="mt-8 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-600 transition-all active:scale-95">
             <Download size={20}/> ดาวน์โหลดรูปลงเครื่อง (PC)
          </a>
        </div>
      )}

      {/* --- 🌟 [NEW] Hidden Container สำหรับวาดป้าย Menu Board (ใช้วิธี Traditional HTML/CSS แบบ Table เพื่อป้องกันการเละตอน Render ด้วย html2canvas) --- */}
      {showMenuBoardModal && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex flex-col items-center justify-center p-4">
           {isGeneratingPoster ? (
              <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4 text-center">
                 <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                 <h3 className="font-bold text-primary">กำลังวาดรูปป้ายเมนู...</h3>
                 <p className="text-[10px] text-gray-500">กรุณารอสักครู่ ห้ามปิดหน้าจอ</p>
              </div>
           ) : (
             <div className="w-full max-w-[800px] h-[80vh] bg-gray-100 rounded-3xl flex flex-col overflow-hidden relative">
                <div className="flex justify-between items-center bg-white p-4 border-b">
                   <h3 className="font-bold text-primary">ตัวอย่างป้ายเมนูรวม</h3>
                   <div className="flex gap-2">
                     <button onClick={() => setShowMenuBoardModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">ปิด</button>
                     <button onClick={generateMenuBoard} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold flex items-center gap-1"><Download size={16}/> สร้างรูป</button>
                   </div>
                </div>
                
                <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                   {/* 🎨 [CORE POSTER DESIGN] - ใช้ CSS ล้วนๆ ห้ามใช้ Tailwind เพื่อความชัวร์ของ html2canvas */}
                   <div 
                      id="menu-board-container"
                      ref={menuBoardRef} 
                      style={{
                         width: '794px', // A4 Width
                         minHeight: '1123px', // A4 Height
                         backgroundColor: '#fffdf9', // โทนครีมอ่อนๆ แบบในเรฟ
                         fontFamily: "'Sarabun', 'Mitr', sans-serif",
                         position: 'relative',
                         border: '10px solid #cc3333', // ขอบสีแดงเลือดหมู
                         borderRadius: '30px',
                         padding: '40px',
                         boxSizing: 'border-box',
                         display: 'flex',
                         flexDirection: 'column',
                         overflow: 'hidden'
                      }}
                   >
                      {/* --- Header: Logo & Title --- */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                         <tbody>
                            <tr>
                               <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'center' }}>
                                 {/* ใช้ Emoji หรือรูปวัวง่ายๆ แทนเพื่อไม่ให้ Error */}
                                 <div style={{ fontSize: '100px', lineHeight: '1' }}>🐮🥤</div>
                               </td>
                               <td style={{ width: '65%', verticalAlign: 'middle', textAlign: 'left', paddingLeft: '20px' }}>
                                  <h1 style={{ margin: '0', fontSize: '80px', color: '#cc3333', fontWeight: '900', letterSpacing: '-2px' }}>วัวนมอารมณ์ดี</h1>
                                  <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                                     <div style={{ flex: 1, height: '2px', backgroundColor: '#555' }}></div>
                                     <span style={{ padding: '0 20px', fontSize: '40px', color: '#555', fontFamily: 'serif' }}>Happy Moo</span>
                                     <div style={{ flex: 1, height: '2px', backgroundColor: '#555' }}></div>
                                  </div>
                                  <p style={{ margin: '0', fontSize: '24px', color: '#333', textAlign: 'center' }}>🤎 สดชื่น หวานมัน กลมกล่อม 🤎</p>
                               </td>
                            </tr>
                         </tbody>
                      </table>

                      {/* --- Main Content (Left Menu / Right Addons) --- */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', flex: 1 }}>
                         <tbody>
                            <tr>
                               {/* คอลัมน์ซ้าย: รายการเมนู */}
                               <td style={{ width: '60%', verticalAlign: 'top', paddingRight: '30px', borderRight: '2px dashed #ddd' }}>
                                  
                                  {/* Header เมนู เย็น ปั่น */}
                                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                     <tbody>
                                        <tr>
                                           <td style={{ width: '60%' }}>
                                              <div style={{ backgroundColor: '#cc3333', color: 'white', padding: '10px 30px', borderRadius: '0 20px 20px 0', display: 'inline-block', fontSize: '28px', fontWeight: 'bold' }}>เมนู</div>
                                           </td>
                                           <td style={{ width: '20%', textAlign: 'center', fontSize: '24px', color: '#cc3333', fontWeight: 'bold' }}>เย็น</td>
                                           <td style={{ width: '20%', textAlign: 'center', fontSize: '24px', color: '#cc3333', fontWeight: 'bold' }}>ปั่น</td>
                                        </tr>
                                     </tbody>
                                  </table>

                                  {/* รายการเมนูทั้งหมด (รันด้วย Loop) */}
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                     <tbody>
                                        {menuItems.filter(m => !m.isSoldOut).slice(0, 30).map((menu, i) => (
                                           <tr key={i}>
                                              <td style={{ width: '60%', padding: '8px 0', verticalAlign: 'bottom' }}>
                                                 <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                    <span style={{ fontSize: '20px', color: '#333', fontWeight: '600', whiteSpace: 'nowrap' }}>{menu.name}</span>
                                                    <div style={{ flex: 1, borderBottom: '2px dotted #aaa', margin: '0 10px', position: 'relative', top: '-6px' }}></div>
                                                 </div>
                                              </td>
                                              <td style={{ width: '20%', textAlign: 'center', fontSize: '22px', color: '#333', fontWeight: 'bold', padding: '8px 0' }}>
                                                 {menu.isOnlyBlend ? '-' : menu.price}
                                              </td>
                                              <td style={{ width: '20%', textAlign: 'center', fontSize: '22px', color: '#333', fontWeight: 'bold', padding: '8px 0' }}>
                                                 {menu.allowBlend === false && !menu.isOnlyBlend ? '-' : (menu.price + getAddedBlendPrice(menu))}
                                              </td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>

                               </td>

                               {/* คอลัมน์ขวา: ท็อปปิ้ง & QR Code */}
                               <td style={{ width: '40%', verticalAlign: 'top', paddingLeft: '30px' }}>
                                  
                                  {/* กล่องท็อปปิ้ง */}
                                  {toppings.length > 0 && (
                                     <div style={{ border: '2px solid #cc3333', borderRadius: '20px', overflow: 'hidden', marginBottom: '40px' }}>
                                        <div style={{ backgroundColor: '#cc3333', color: 'white', padding: '15px 0', textAlign: 'center', fontSize: '28px', fontWeight: 'bold' }}>ท็อปปิ้ง</div>
                                        <div style={{ padding: '20px' }}>
                                           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                              <tbody>
                                                 {toppings.map((top, i) => (
                                                    <tr key={i}>
                                                       <td style={{ padding: '8px 0', fontSize: '20px', color: '#333', fontWeight: '600' }}>
                                                          <span style={{ display: 'inline-block', width: '20px', textAlign: 'center', marginRight: '10px' }}>✨</span> 
                                                          {top.name}
                                                       </td>
                                                       <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '22px', color: '#333', fontWeight: 'bold' }}>{top.price} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>บาท</span></td>
                                                    </tr>
                                                 ))}
                                              </tbody>
                                           </table>
                                        </div>
                                     </div>
                                  )}

                                  {/* กล่อง QR Code ช่องทางติดต่อ */}
                                  <div style={{ border: '2px solid #ddd', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
                                     <p style={{ margin: '0 0 15px 0', fontSize: '24px', color: '#cc3333', fontWeight: 'bold' }}>🤎 ช่องทางติดต่อ 🤎</p>
                                     {storeSettings.qrCodeImage ? (
                                        <img src={storeSettings.qrCodeImage} alt="QR" style={{ width: '80%', height: 'auto', borderRadius: '10px', marginBottom: '10px' }} />
                                     ) : (
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${storeSettings.promptPayNo}`} alt="QR Default" style={{ width: '80%', height: 'auto', borderRadius: '10px', marginBottom: '10px' }} />
                                     )}
                                     <p style={{ margin: '0', fontSize: '18px', color: '#555', fontWeight: 'bold' }}>สแกนเพื่อสั่งเครื่องดื่ม</p>
                                  </div>

                               </td>
                            </tr>
                         </tbody>
                      </table>

                      {/* --- Footer Conditions --- */}
                      <div style={{ borderTop: '2px solid #eee', paddingTop: '20px', marginTop: '30px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '30px' }}>🛵</div>
                            <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#cc3333' }}>กอล์ฟวิวส่งฟรี</p>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>ส่งหน้าห้องแค่เข้าตึกได้</p>
                         </div>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '30px' }}>🌧️</div>
                            <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#cc3333' }}>ฝนตก</p>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>ส่งใต้ตึกเท่านั้น</p>
                         </div>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '30px' }}>⚡</div>
                            <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#cc3333' }}>ไฟดับ</p>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>ส่งใต้ตึกเท่านั้น</p>
                         </div>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '30px' }}>🏢</div>
                            <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#cc3333' }}>ลิฟท์พัง</p>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>ส่งใต้ตึกเท่านั้น</p>
                         </div>
                      </div>

                      <div style={{ backgroundColor: '#cc3333', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '30px', marginTop: '20px', fontSize: '20px', fontWeight: 'bold' }}>
                         🤍 ขอบคุณที่อุดหนุนค่ะ 🤍
                      </div>

                   </div>
                </div>
             </div>
           )}
        </div>
      )}

    </div>
  );
}