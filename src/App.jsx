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

// --- 2. ฟังก์ชันบีบอัดรูปภาพ (Image Compression) ---
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
  
  // --- States: แอดมิน (Admin) ---
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

  // --- States: ฟีเจอร์สร้างป้าย Menu Board ---
  const [showMenuBoardModal, setShowMenuBoardModal] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);

  // --- States: Failsafe Success Modal (แก้ปัญหาสั่งซื้อล้มเหลวเวลารันนอกแอป LINE) ---
  const [successModalData, setSuccessModalData] = useState(null);

  // --- States: เลือกตัวเลือกตอนสั่งสินค้า ---
  const [optionModalItem, setOptionModalItem] = useState(null);
  const [tempOptions, setTempOptions] = useState({ sweetness: '100%', isBlended: false, addPearl: true, selectedToppings: [] });
  const [lineProfile, setLineProfile] = useState({ displayName: 'ลูกค้าทั่วไป', pictureUrl: '', userId: '' });

  // --- States: ค้นหา ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { const saved = localStorage.getItem('happycow_searchHistory'); return saved ? JSON.parse(saved) : []; }
    catch(e) { return []; }
  });
  const [popularSearches, setPopularSearches] = useState([]);

  // --- Refs ---
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

  // ดึงข้อมูล Firebase และ LINE LIFF Init
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
          // ไม่บังคับเด้งล็อกอินเพื่ออนุญาตให้เข้าใช้งานแบบ Guest ได้ ป้องกันปัญหา 400 Bad Request
          console.log("LIFF connected as Guest Mode");
        }
      }).catch(err => console.error("LIFF Init failed", err));
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
      console.error(error);
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

  // ฟังก์ชันวาดป้าย Menu Board 
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

      // รอรีเฟรช DOM สองวิเพื่อให้รูป Base64 และขนาดคงที่
      await new Promise(r => setTimeout(r, 1000));

      const canvas = await window.html2canvas(menuBoardRef.current, { 
         scale: 2.5, 
         useCORS: true,
         allowTaint: true,
         backgroundColor: '#ffffff',
         logging: false
      });

      const imageBase64 = canvas.toDataURL("image/png");
      setGeneratedPreview({ src: imageBase64, name: `MenuBoard_HappyCow_${Date.now()}.png` });
      
    } catch (err) {
      console.error("Error generating menu board:", err);
      alert("เกิดข้อผิดพลาดในการวาดป้าย: " + err.message);
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

  const copyPromptPay = () => { navigator.clipboard.writeText(storeSettings.promptPayNo || '0812345678').then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }); };

  // คำนวณรายรับทั้งหมดของร้าน (ฟังก์ชันตัวเต็ม)
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
               <p className="text-[9px] font-bold text-green-700 uppercase tracking-tighter">คุณ {(lineProfile.displayName || 'ลูกค้าทั่วไป').slice(0, 10)}</p>
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

      <main className="flex-1 pb-10 relative z-10">
        {/* --- Shop View --- */}
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
                   placeholder="ค้นหาเมนูที่คุณอยากดื่ม..." 
                   className="w-full pl-11 pr-10 py-3.5 rounded-[1.5rem] text-sm outline-none shadow-sm focus:ring-2 focus:ring-[var(--theme-accent)] border border-gray-100 bg-white/90 backdrop-blur-sm" 
                />
              </div>
            </div>

            {!searchQuery && (
              <div className="mx-5 mb-2 mt-4 p-4 bg-white/80 backdrop-blur-sm border-l-4 border-l-[var(--theme-accent)] rounded-r-2xl shadow-sm animate-in fade-in relative overflow-hidden">
                <h4 className="text-xs font-bold text-accent mb-2 flex items-center gap-1"><AlertCircle size={14}/> เงื่อนไขการสั่งซื้อ (รบกวนอ่านก่อนนะคะ 💖)</h4>
                <ul className="text-[10.5px] text-gray-700 space-y-1.5 pl-4 list-disc font-medium">
                  <li>ส่งถึงหน้าห้อง <span className="font-bold text-accent">เฉพาะกรณีเข้าตึกได้</span> เท่านั้น</li>
                  <li>หากเข้าตึกไม่ได้ / ฝนตก / ลิฟต์พัง ขออนุญาต <span className="font-bold text-accent">แขวนไว้ใต้ตึก</span></li>
                  <li>ระยะเวลารอออร์เดอร์ประมาณ <span className="font-bold">20 นาที (+/-)</span></li>
                </ul>
              </div>
            )}

            {!searchQuery && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 py-3 sticky top-[138px] z-[40] backdrop-blur-md" style={{ backgroundColor: `${currentThemeData.bg}e6` }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all border ${activeCategory === c ? 'bg-primary text-white border-primary' : 'bg-white/90 text-gray-500 border-gray-100'}`}>{c}</button>
                ))}
              </div>
            )}

            {/* Render Items */}
            <div className="px-5 pb-5 pt-2">
              {isLoading ? <div className="p-20 text-center opacity-30 italic font-bold text-primary animate-pulse">กำลังโหลดความสดชื่น... 🐮</div> : (
                <div className="grid grid-cols-2 gap-5">
                  {displayedItems.map((item, index) => {
                    const isBlendUnavailable = item.isOnlyBlend && storeSettings.isBlendOut;
                    const isDisabled = item.isSoldOut || isBlendUnavailable;
                    return (
                    <div key={item.id} onClick={() => openOptionModal(item)} className={`rounded-[2rem] overflow-hidden shadow-sm bg-white/95 border border-white/50 cursor-pointer hover:-translate-y-0.5 transition-all ${isDisabled ? 'opacity-50' : ''}`}>
                      <div className="aspect-square bg-gray-50 relative">
                         <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="p-4 text-center">
                        <h4 className="font-bold text-sm mb-1 line-clamp-1 text-primary">{item.name}</h4>
                        <p className="text-accent font-bold text-sm">฿{item.price}</p>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Cart View (หน้าตะกร้า) --- */}
        {view === 'cart' && (
          <div className="p-6 space-y-6 bg-white rounded-t-[3rem] mt-4 min-h-[85vh] shadow-2xl relative z-20">
            <button onClick={() => setView('shop')} className="flex items-center gap-2 font-bold text-gray-400 text-sm hover:text-primary transition-colors"><ChevronLeft size={20}/> เลือกเมนูเพิ่ม</button>
            <h2 className="text-3xl font-serif font-bold text-primary">ตะกร้าของคุณ</h2>
            <div className="space-y-4">
               {cart.map(i => (
                 <div key={i.cartId} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex-1 font-bold text-sm text-primary">
                     {i.qty}x {i.name} <br/>
                     <span className="text-gray-400 text-[10px] uppercase">
                       ({getBlendText(i)} • หวาน {i.sweetness})
                     </span>
                   </div>
                   <div className="flex items-center gap-4"><p className="font-bold text-accent">฿{i.price * i.qty}</p><button onClick={() => setCart(prev => prev.filter(item => item.cartId !== i.cartId))} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                 </div>
               ))}
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
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY:${storeSettings.promptPayNo}:${cartTotal}`} className="w-40 h-40 mx-auto mb-4 bg-white p-2 rounded-xl" alt="QR Code อัตโนมัติ" />
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <p className="text-xs text-gray-500 font-bold">พร้อมเพย์: {storeSettings.promptPayNo || '0812345678'}</p>
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
                             setTimeout(() => setSlipStatus('valid'), 1000);
                           } catch (err) {
                             setSlipStatus('idle');
                           }
                        }
                      }} />
                    </label>
                  </div>
                )}
                
                <label className="flex items-start gap-3 p-4 rounded-2xl border bg-gray-50 transition-all cursor-pointer shadow-sm">
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-primary mb-1">ยอมรับเงื่อนไขการส่งและสั่งซื้อ</p>
                  </div>
                </label>
                
                {/* --- 🛠️ ใช้งานปุ่มสั่งซื้อ Fail-Safe 100% --- */}
                {storeSettings.isStoreOpen !== false ? (
                  <button 
                    onClick={async () => {
                      if (!address) return alert("กรุณากรอกที่อยู่จัดส่งครับ");
                      if (paymentMethod === 'promptpay' && !slipImage) return alert("กรุณาแนบสลิปการโอนเงินครับ");
                      
                      setIsLoading(true);
                      const total = cartTotal;
                      
                      try {
                        // บันทึกเข้า database
                        const orderRef = await addDoc(collection(db, 'orders'), {
                          items: cart, total, status: 'pending', timestamp: Date.now(),
                          userId: lineProfile.userId || "guest_user", lineName: lineProfile.displayName || "ลูกค้าทั่วไป", address, note,
                          slipImage: paymentMethod === 'promptpay' ? slipImage : 'cash_payment', paymentMethod
                        });

                        // สร้างสรุปออเดอร์สำหรับการส่งไลน์
                        const orderSummaryText = `วัวนมอารมณ์ดี 🐮\nบิลเลขที่: #${orderRef.id.slice(0, 6)}\nลูกค้า:คุณ ${lineProfile.displayName || "ลูกค้าทั่วไป"}\n` + 
                          cart.map(i => `- ${i.qty}x ${i.name} (หวาน ${i.sweetness})`).join('\n') + 
                          `\nยอดรวม: ฿${total}\nที่อยู่: ${address}\nหมายเหตุ: ${note}`;

                        // ทำการก๊อปปี้ข้อความเตรียมไว้ให้ลูกค้าอัตโนมัติ
                        try {
                          await navigator.clipboard.writeText(orderSummaryText);
                        } catch (cErr) {
                          console.log("Clipboard bypass", cErr);
                        }

                        // พยายามเปิด LINE Share Target Picker
                        let isLiffShared = false;
                        if (window.liff && window.liff.isLoggedIn() && window.liff.isApiAvailable('shareTargetPicker')) {
                          try {
                            const res = await window.liff.shareTargetPicker([{
                              type: "flex",
                              altText: `🐮 ออร์เดอร์ใหม่จากคุณ ${lineProfile.displayName} (฿${total})`,
                              contents: {
                                type: "bubble",
                                header: { type: "box", layout: "vertical", backgroundColor: "#3D2C1E", contents: [{ type: "text", text: "วัวนมอารมณ์ดี 🐮", color: "#ffffff", weight: "bold", size: "lg", align: "center" }] },
                                body: { type: "box", layout: "vertical", spacing: "md", contents: [{ type: "text", text: `คุณ: ${lineProfile.displayName}`, weight: "bold" }, { type: "text", text: `ยอดรวม: ฿${total}`, color: "#dc2626", weight: "bold" }] }
                              }
                            }]);
                            if (res) isLiffShared = true;
                          } catch (err) {
                            console.log("LIFF picker failed", err);
                          }
                        }

                        // เคลียร์ตะกร้า
                        setCart([]); setSlipImage(''); setSlipStatus('idle'); setAddress(''); setNote(''); setAcceptedTerms(false);

                        // หากทำงานนอก LINE LIFF ให้ขึ้นเป็นหน้าต่าง Failsafe Success แทน เพื่อไม่ให้ออเดอร์ค้างเติ่ง
                        if (isLiffShared) {
                          setView('myOrders');
                          alert("ส่งใบเสร็จเรียบร้อย! 🐮🎉");
                        } else {
                          // แสดง Modal สั่งสำเร็จ เพื่อให้สามารถส่งไลน์ส่วนตัวได้ต่อ
                          setSuccessModalData({
                            orderId: orderRef.id,
                            text: orderSummaryText,
                            adminLine: storeSettings.adminLineId || "0812345678"
                          });
                        }
                      } catch (err) {
                        alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
                      } finally {
                        setIsLoading(false); // ⚠️ ตรวจสอบให้แน่ใจว่าปลดบล็อกปุ่มไม่ว่าจะเกิดกรณีใดก็ตาม
                      }
                    }}
                    disabled={isLoading || !acceptedTerms} 
                    className={`w-full py-5 rounded-[2.5rem] font-bold text-lg transition-all shadow-xl active:scale-95 flex justify-center items-center gap-2 ${acceptedTerms && !isLoading ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                     {isLoading ? 'กำลังประมวลผล...' : `ยืนยันการสั่งซื้อ • ฿${cartTotal}`}
                  </button>
                ) : (
                  <button disabled className="w-full py-5 bg-gray-300 text-white rounded-[2.5rem] font-bold text-lg cursor-not-allowed">
                     ร้านปิดรับออเดอร์ชั่วคราว
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
             <div className="space-y-4">
                {orders.filter(o => o.userId === lineProfile.userId).map(o => (
                   <div key={o.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start">
                         <span className="text-xs font-bold text-accent">บิล #{o.id.slice(0,6)}</span>
                         <span className="text-sm font-bold text-primary">฿{o.total}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 uppercase">สถานะ: {o.status}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* --- Admin View --- */}
        {view === 'admin' && (
          <div className="p-6 bg-white min-h-screen animate-in fade-in relative z-20">
            <button onClick={() => setView('shop')} className="flex items-center gap-2 font-bold text-gray-400 text-sm mb-6 hover:text-primary"><ChevronLeft size={20}/> กลับหน้าร้าน</button>
            
            <div className="flex gap-1 bg-gray-50 p-1 rounded-2xl mb-6 shadow-inner">
              {['orders', 'menus', 'dashboard', 'settings'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-3 rounded-xl text-xs font-bold ${adminTab === t ? 'bg-primary text-white' : 'text-gray-500'}`}>
                  {t === 'orders' ? 'ออร์เดอร์' : t === 'menus' ? 'เมนู' : t === 'dashboard' ? 'รายรับ' : 'ตั้งค่า'}
                </button>
              ))}
            </div>

            {/* TAB: Orders */}
            {adminTab === 'orders' && (
              <div className="space-y-4">
                 {orders.map(o => (
                    <div key={o.id} className="border p-5 rounded-3xl bg-white shadow-sm">
                       <p className="font-bold text-sm text-primary">#{o.id.slice(0,6)} คุณ {o.lineName}</p>
                       <p className="text-xs text-gray-500 mt-1">ที่อยู่: {o.address}</p>
                       <div className="mt-2 border-t pt-2 text-xs">
                          {o.items?.map((item, idx) => (
                             <p key={idx}>{item.qty}x {item.name}</p>
                          ))}
                       </div>
                       <div className="flex gap-2 mt-4">
                          {o.status === 'pending' && <button onClick={() => updateDoc(doc(db, 'orders', o.id), { status: 'completed' })} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold">จัดส่งเสร็จสิ้น</button>}
                          <button onClick={() => deleteDoc(doc(db, 'orders', o.id))} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold">ลบ</button>
                       </div>
                    </div>
                 ))}
              </div>
            )}

            {/* TAB: Dashboard */}
            {adminTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl">
                  <h3 className="font-bold text-sm">สรุปยอดขายวันนี้</h3>
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

                <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
                   <h3 className="font-bold text-sm text-primary mb-4 border-b pb-3">สรุปรายรับรายวัน (7 วันล่าสุด)</h3>
                   <div className="space-y-3">
                      {revData.dailyHistory.map((d, idx) => (
                         <div key={idx} className="flex justify-between items-center text-sm">
                            <span className={idx === 0 ? "font-bold text-accent" : "text-gray-500 font-bold"}>{idx === 0 ? `วันนี้ (${d.date})` : d.date}</span>
                            <span className={`font-bold ${idx === 0 ? "text-accent" : "text-primary"}`}>฿{d.total.toLocaleString()}</span>
                         </div>
                      ))}
                   </div>
                </div>

                <button onClick={exportToCSV} className="w-full bg-[#0F9D58] text-white py-5 rounded-[2rem] font-bold text-sm shadow-lg active:scale-95 transition-all">
                  Export บัญชีรายรับ (CSV)
                </button>
              </div>
            )}

            {/* TAB: Menus */}
            {adminTab === 'menus' && (
              <div className="space-y-6">
                {/* 🌟 ปรับระบบ Menu Board ใหม่ให้พรีเมียม สไตล์ A4 กระดาษแบบดั้งเดิม 100% ไม่พึ่งพากล่องซ้อนกันเพื่อไม่ให้เละ */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-[2rem] text-white shadow-lg text-center">
                  <h3 className="font-bold text-lg mb-1">🖼️ ระบบออกป้ายเมนูรวม (Menu Board)</h3>
                  <p className="text-xs opacity-90 mb-4">ดาวน์โหลดรูปภาพเอาไปโพสต์ หรือพิมพ์ติดหน้าร้านค้าสไตล์โปสเตอร์</p>
                  <button onClick={() => setShowMenuBoardModal(true)} className="w-full bg-white text-orange-600 py-3 rounded-full font-bold text-xs shadow-md">
                     สร้างและดูรูปตัวอย่าง
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-3xl border">
                  {!showAddMenuForm ? (
                     <button onClick={() => setShowAddMenuForm(true)} className="w-full py-2 text-accent font-bold text-sm text-center">เพิ่มเมนูใหม่</button>
                  ) : (
                    <div className="space-y-3">
                      <input type="text" placeholder="ชื่อเมนู" className="w-full p-3 rounded-xl border text-sm" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} />
                      <input type="number" placeholder="ราคา" className="w-full p-3 rounded-xl border text-sm" value={newMenu.price} onChange={e => setNewMenu({...newMenu, price: e.target.value})} />
                      <label className="cursor-pointer bg-white border p-3 rounded-xl text-xs block text-center">
                        {newMenu.image ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files[0];
                          if (file) { setNewMenu({...newMenu, image: await compressImage(file)}); }
                        }} />
                      </label>
                      <button onClick={handleAddNewMenu} className="w-full bg-accent text-white py-3 rounded-xl text-xs font-bold">บันทึก</button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                   {menuItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-3 border rounded-2xl shadow-sm">
                         <div className="flex items-center gap-3">
                            <img src={item.image} className="w-10 h-10 rounded-xl object-cover" alt="" />
                            <span className="font-bold text-xs text-primary">{item.name} (฿{item.price})</span>
                         </div>
                         <button onClick={() => handleDeleteMenu(item.id)} className="text-red-500 text-xs font-bold">ลบ</button>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {/* TAB: Settings */}
            {adminTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-200 space-y-4">
                  <h3 className="font-bold text-sm text-accent text-center">สถานะการเปิดรับบิลหน้าร้าน</h3>
                  <div className="flex gap-3">
                    <button onClick={() => updateStoreStatus(true)} className={`flex-1 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 ${storeSettings.isStoreOpen !== false ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-400'}`}>เปิดร้าน</button>
                    <button onClick={() => updateStoreStatus(false)} className={`flex-1 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 ${storeSettings.isStoreOpen === false ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-400'}`}>ปิดร้าน</button>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-200 space-y-4 shadow-inner">
                  <h3 className="font-bold text-sm text-accent text-center">ตั้งค่าพร้อมเพย์</h3>
                  <input type="text" placeholder="หมายเลขพร้อมเพย์" className="w-full p-4 rounded-2xl text-sm border-transparent bg-white shadow-sm" value={editPromptPay} onChange={e => setEditPromptPay(e.target.value)} />
                  <button onClick={async () => {
                    try { await setDoc(doc(db, 'settings', 'store'), { promptPayNo: editPromptPay }, { merge: true }); alert('อัปเดตการชำระเงินของร้านสำเร็จ! 🐮'); } catch(e) { alert("Error: " + e.message); }
                  }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-md">บันทึกข้อมูลธนาคาร</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- Modal เลือกตัวเลือกสินค้า --- */}
      {optionModalItem && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4">
          <div className="bg-white rounded-t-[3.5rem] w-full max-w-md p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="text-xl font-serif font-bold text-primary">{optionModalItem.name}</h3><button onClick={() => setOptionModalItem(null)} className="p-2 bg-gray-100 rounded-full"><X size={16}/></button></div>
            
            <div>
               <label className="text-[10px] font-bold block mb-2 text-gray-400 uppercase tracking-widest">ความหวาน</label>
               <div className="grid grid-cols-3 gap-2">
                  {SWEETNESS.map(s => (
                     <button key={s} onClick={() => setTempOptions({...tempOptions, sweetness: s})} className={`py-2 rounded-xl text-xs font-bold ${tempOptions.sweetness === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>{s}</button>
                  ))}
               </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => setTempOptions({...tempOptions, isBlended: false})} className={`flex-1 py-4 rounded-2xl border font-bold ${!tempOptions.isBlended ? 'border-accent bg-orange-50 text-accent' : 'border-gray-100 text-gray-400'}`}>เย็น</button>
               <button onClick={() => setTempOptions({...tempOptions, isBlended: true})} className={`flex-1 py-4 rounded-2xl border font-bold ${tempOptions.isBlended ? 'border-accent bg-orange-50 text-accent' : 'border-gray-100 text-gray-400'}`}>ปั่น</button>
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
              }} className="w-full py-4 bg-primary text-white rounded-2xl font-bold">เพิ่มลงตะกร้า</button>
          </div>
        </div>
      )}

      {/* --- 🌟 [NEW] Failsafe Order Success Modal --- */}
      {successModalData && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center space-y-6 animate-in zoom-in">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
             <h3 className="text-xl font-bold text-primary">สั่งซื้อเรียบร้อยแล้วค่ะ! 🎉</h3>
             <p className="text-xs text-gray-500 leading-relaxed">ระบบได้บันทึกออเดอร์หลังบ้านของร้านเรียบร้อยแล้ว และคัดลอกข้อความสรุปรายการไว้ในเครื่องของคุณแล้วค่ะ</p>
             
             <div className="bg-gray-50 p-4 rounded-2xl border border-dashed text-left max-h-40 overflow-y-auto">
                <pre className="text-[10px] text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{successModalData.text}</pre>
             </div>

             <div className="space-y-2">
                <button 
                  onClick={() => {
                     navigator.clipboard.writeText(successModalData.text);
                     alert("คัดลอกข้อความออร์เดอร์สำเร็จ!");
                  }}
                  className="w-full bg-gray-100 text-primary py-3 rounded-full text-xs font-bold active:scale-95"
                >
                   คัดลอกข้อความออเดอร์อีกครั้ง
                </button>
                <a 
                  href={`https://line.me/R/ti/p/~${successModalData.adminLine}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full bg-[#06C755] text-white py-3 rounded-full text-xs font-bold active:scale-95"
                >
                   เปิด LINE เพื่อส่งให้แอดมินร้านค้า
                </a>
                <button 
                  onClick={() => {
                     setSuccessModalData(null);
                     setView('shop');
                  }}
                  className="w-full text-gray-400 py-2 text-xs font-bold"
                >
                   กลับไปหน้าร้านค้า
                </button>
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

          <div className="relative w-full max-w-md max-h-[60vh] overflow-auto hide-scrollbar rounded-2xl shadow-2xl border bg-white">
            <img src={generatedPreview.src} className="w-full object-contain" alt="Generated Poster" />
          </div>

          <a href={generatedPreview.src} download={generatedPreview.name} className="mt-8 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-600 transition-all active:scale-95">
             <Download size={20}/> ดาวน์โหลดรูปลงเครื่อง (PC)
          </a>
        </div>
      )}

      {/* --- 🌟 [NEW] Layout ตารางแบบคลาสสิก (Table-Based) ป้องกันปัญหาการ overlapping ใน html2canvas --- */}
      {showMenuBoardModal && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex flex-col items-center justify-center p-4">
           {isGeneratingPoster ? (
              <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4 text-center">
                 <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                 <h3 className="font-bold text-primary">กำลังวาดรูปป้ายเมนูรวม...</h3>
                 <p className="text-[10px] text-gray-500">กรุณารอสักครู่ ห้ามปิดหน้าจอ</p>
              </div>
           ) : (
             <div className="w-full max-w-[800px] h-[80vh] bg-gray-100 rounded-3xl flex flex-col overflow-hidden relative">
                <div className="flex justify-between items-center bg-white p-4 border-b">
                   <h3 className="font-bold text-primary">ตัวอย่างป้ายเมนูรวม (Menu Board)</h3>
                   <div className="flex gap-2">
                     <button onClick={() => setShowMenuBoardModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">ปิด</button>
                     <button onClick={generateMenuBoard} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold flex items-center gap-1"><Download size={16}/> สร้างรูป</button>
                   </div>
                </div>
                
                <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                   {/* 🎨 ตารางวาดโปสเตอร์ A4 */}
                   <div 
                      id="menu-board-container"
                      ref={menuBoardRef} 
                      style={{
                         width: '794px', 
                         minHeight: '1123px', 
                         backgroundColor: '#ffffff', 
                         fontFamily: "'Sarabun', 'Mitr', sans-serif",
                         position: 'relative',
                         border: '10px solid #cc3333', 
                         borderRadius: '30px',
                         padding: '40px',
                         boxSizing: 'border-box',
                         display: 'flex',
                         flexDirection: 'column',
                         overflow: 'hidden'
                      }}
                   >
                      {/* Header: Logo & Title */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
                         <tbody>
                            <tr>
                               <td style={{ width: '30%', textAlign: 'center', verticalAlign: 'middle' }}>
                                 <div style={{ fontSize: '110px', lineHeight: '1' }}>🐮</div>
                               </td>
                               <td style={{ width: '70%', verticalAlign: 'middle', textAlign: 'left', paddingLeft: '20px' }}>
                                  <h1 style={{ margin: '0', fontSize: '65px', color: '#cc3333', fontWeight: 'bold', fontFamily: "'Vollkorn', serif" }}>วัวนมอารมณ์ดี</h1>
                                  <div style={{ fontSize: '32px', color: '#555555', margin: '5px 0' }}>— Happy Moo —</div>
                                  <p style={{ margin: '0', fontSize: '20px', color: '#666666', fontWeight: 'bold' }}>♥ สดชื่น หวานมัน กลมกล่อม ♥</p>
                               </td>
                            </tr>
                         </tbody>
                      </table>

                      {/* Main Content (Left Menu Table / Right Table Addons) */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', flex: 1 }}>
                         <tbody>
                            <tr>
                               {/* คอลัมน์ซ้าย: รายการเมนูทั้งหมด */}
                               <td style={{ width: '60%', verticalAlign: 'top', paddingRight: '25px', borderRight: '2px dashed #ddd' }}>
                                  
                                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                                     <tbody>
                                        <tr>
                                           <td style={{ width: '60%' }}>
                                              <div style={{ backgroundColor: '#cc3333', color: 'white', padding: '8px 25px', borderRadius: '0 20px 20px 0', fontSize: '24px', fontWeight: 'bold', display: 'inline-block' }}>เมนู</div>
                                           </td>
                                           <td style={{ width: '20%', textAlign: 'center', fontSize: '20px', color: '#cc3333', fontWeight: 'bold' }}>เย็น</td>
                                           <td style={{ width: '20%', textAlign: 'center', fontSize: '20px', color: '#cc3333', fontWeight: 'bold' }}>ปั่น</td>
                                        </tr>
                                     </tbody>
                                  </table>

                                  {/* รายการเครื่องดื่ม */}
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                     <tbody>
                                        {menuItems.filter(m => !m.isSoldOut).slice(0, 24).map((menu, i) => (
                                           <tr key={i} style={{ height: '32px' }}>
                                              <td style={{ width: '60%', verticalAlign: 'bottom', paddingBottom: '4px' }}>
                                                 <div style={{ display: 'flex', alignItems: 'baseline', overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '15px', color: '#333333', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{menu.name}</span>
                                                    <div style={{ flex: 1, borderBottom: '2px dotted #aaaaaa', margin: '0 8px', position: 'relative', top: '-4px' }}></div>
                                                 </div>
                                              </td>
                                              <td style={{ width: '20%', textAlign: 'center', fontSize: '16px', color: '#333333', fontWeight: 'bold', verticalAlign: 'bottom' }}>
                                                 {menu.isOnlyBlend ? '-' : menu.price}
                                              </td>
                                              <td style={{ width: '20%', textAlign: 'center', fontSize: '16px', color: '#333333', fontWeight: 'bold', verticalAlign: 'bottom' }}>
                                                 {menu.allowBlend === false && !menu.isOnlyBlend ? '-' : (menu.price + getAddedBlendPrice(menu))}
                                              </td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>

                               </td>

                               {/* คอลัมน์ขวา: ท็อปปิ้ง และ QR Code */}
                               <td style={{ width: '40%', verticalAlign: 'top', paddingLeft: '25px' }}>
                                  
                                  {/* กล่องท็อปปิ้ง */}
                                  <div style={{ border: '2px solid #cc3333', borderRadius: '20px', overflow: 'hidden', marginBottom: '25px' }}>
                                     <div style={{ backgroundColor: '#cc3333', color: 'white', padding: '10px', textAlign: 'center', fontSize: '22px', fontWeight: 'bold' }}>ท็อปปิ้ง</div>
                                     <div style={{ padding: '15px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                           <tbody>
                                              {toppings.map((top, i) => (
                                                 <tr key={i} style={{ height: '32px' }}>
                                                    <td style={{ fontSize: '15px', color: '#333333', fontWeight: 'bold' }}>
                                                       ✨ {top.name}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontSize: '16px', color: '#333333', fontWeight: 'bold' }}>
                                                       {top.price} บาท
                                                    </td>
                                                 </tr>
                                              ))}
                                              {toppings.length === 0 && (
                                                 <tr>
                                                    <td colSpan={2} style={{ textAlign: 'center', fontSize: '13px', color: '#aaa', padding: '10px' }}>ยังไม่มีข้อมูลท็อปปิ้ง</td>
                                                 </tr>
                                              )}
                                           </tbody>
                                        </table>
                                     </div>
                                  </div>

                                  {/* กล่องสแกนสั่งติดต่อ */}
                                  <div style={{ border: '2px solid #ddd', borderRadius: '20px', padding: '15px', textAlign: 'center' }}>
                                     <p style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#cc3333', fontWeight: 'bold' }}>♥ ช่องทางติดต่อ ♥</p>
                                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${storeSettings.promptPayNo}`} alt="QR" style={{ width: '130px', height: '130px', margin: '0 auto 8px auto', display: 'block', borderRadius: '8px' }} />
                                     <p style={{ margin: '0', fontSize: '13px', color: '#666666', fontWeight: 'bold' }}>สแกนเพื่อสั่งเครื่องดื่มผ่าน LINE</p>
                                  </div>

                               </td>
                            </tr>
                         </tbody>
                      </table>

                      {/* Footer Conditions */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '2px solid #eeeeee', marginTop: '20px', paddingTop: '15px' }}>
                         <tbody>
                            <tr>
                               <td style={{ width: '25%', textAlign: 'center', padding: '10px 0' }}>
                                  <div style={{ fontSize: '26px' }}>🛵</div>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cc3333', marginTop: '2px' }}>กอล์ฟวิวส่งฟรี</div>
                                  <div style={{ fontSize: '10px', color: '#777' }}>ส่งหน้าห้องแค่เข้าตึกได้</div>
                               </td>
                               <td style={{ width: '25%', textAlign: 'center', padding: '10px 0' }}>
                                  <div style={{ fontSize: '26px' }}>🌧️</div>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cc3333', marginTop: '2px' }}>ฝนตกหนัก</div>
                                  <div style={{ fontSize: '10px', color: '#777' }}>จัดส่งใต้ตึกเท่านั้น</div>
                               </td>
                               <td style={{ width: '25%', textAlign: 'center', padding: '10px 0' }}>
                                  <div style={{ fontSize: '26px' }}>⚡</div>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cc3333', marginTop: '2px' }}>กรณีไฟดับ</div>
                                  <div style={{ fontSize: '10px', color: '#777' }}>จัดส่งใต้ตึกเท่านั้น</div>
                               </td>
                               <td style={{ width: '25%', textAlign: 'center', padding: '10px 0' }}>
                                  <div style={{ fontSize: '26px' }}>🏢</div>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cc3333', marginTop: '2px' }}>ลิฟท์ชำรุด</div>
                                  <div style={{ fontSize: '10px', color: '#777' }}>จัดส่งใต้ตึกเท่านั้น</div>
                               </td>
                            </tr>
                         </tbody>
                      </table>

                      <div style={{ backgroundColor: '#cccc33', color: '#3D2C1E', textAlign: 'center', padding: '8px', borderRadius: '30px', marginTop: '15px', fontSize: '16px', fontWeight: 'bold' }}>
                         🤍 ขอบคุณที่มาอุดหนุนวัวนมอารมณ์ดีนะคะ 🤍
                      </div>

                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center">
            <h3 className="font-bold text-lg mb-6">ผู้ดูแลระบบเข้าใช้งาน</h3>
            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-gray-50 border p-4 rounded-xl text-center text-xl tracking-[0.3em] outline-none" placeholder="••••••" />
            <div className="flex gap-3 mt-6">
               <button onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold">ยกเลิก</button>
               <button onClick={() => {
                  if (adminPassword === '570402') {
                     localStorage.setItem('happycow_isAdmin', 'true');
                     setView('admin'); setShowAdminModal(false); setAdminPassword('');
                  } else { alert("รหัสผ่านไม่ถูกต้อง"); setAdminPassword(''); }
               }} className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold">เข้าสู่ระบบ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}