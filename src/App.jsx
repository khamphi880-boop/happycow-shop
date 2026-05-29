import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Plus, Trash2, ChevronLeft, X, Upload, ClipboardList, Coffee, Zap, 
  MapPin, Settings, Copy, CheckCircle, AlertCircle, LogIn, Eye, Clock, Check, 
  Banknote, CreditCard, MessageSquare, Star, Edit, Save, Camera, Home, Building, 
  TrendingUp, Download, ArrowUp, ArrowDown, Search, Palette, BellRing, Image as ImageIcon,
  CloudRain, ZapOff, ArrowDownToLine
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

// --- 3. ฟังก์ชันบีบอัดรูปภาพ (Image Compression) ช่วยให้โหลดเร็วขึ้น ---
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
  
  // โหลดตะกร้าสินค้าจาก LocalStorage
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
  
  // State สำหรับฟีเจอร์สร้างรูปป้าย
  const [posterMenu, setPosterMenu] = useState(null); // สำหรับป้ายเมนูเดี่ยว
  const [showMenuBoardModal, setShowMenuBoardModal] = useState(false); // สำหรับป้ายเมนูรวม (Menu Board)
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null); // 🌟 [NEW] เก็บรูปที่สร้างเสร็จเพื่อแสดงบนจอ

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
  const posterRef = useRef(null);
  const menuBoardRef = useRef(null);

  // ฟังก์ชันคำนวณราคาปั่นเพิ่ม
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

  // --- 🌟 ดึงข้อมูลจาก Firebase แบบ Real-time และ Init LINE LIFF ---
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
      }).catch(err => console.error("LIFF Error:", err));
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
      alert("ไม่สามารถโหลดเมนูได้: " + error.message);
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

  // --- ฟังก์ชันสร้างภาพแบบอเนกประสงค์ (รองรับทั้งป้ายเดี่ยวและป้ายรวม) ---
  const generateImageFromRef = async (targetRef, fileName) => {
    if (!targetRef.current) return;
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

      // ให้เวลาเรนเดอร์ภาพสักครู่ก่อน Capture เพื่อให้แน่ใจว่าโหลดฟอนต์/รูปครบ
      await new Promise(r => setTimeout(r, 500));

      // ปรับ scale เป็น 2 เพื่อป้องกัน Memory มือถือเต็ม แต่ยังคมชัดสูง
      const canvas = await window.html2canvas(targetRef.current, { 
         scale: 2, 
         useCORS: true,
         allowTaint: true,
         backgroundColor: '#ffffff'
      });

      const imageBase64 = canvas.toDataURL("image/png");
      
      // 🌟 เปลี่ยนจากการดาวน์โหลดอัตโนมัติ (ที่มักโดนบล็อกในมือถือ) 
      // เป็นการโชว์รูปบนหน้าจอให้ลูกค้ากดค้างเพื่อบันทึกแทน
      setGeneratedPreview({ src: imageBase64, name: fileName });
      
    } catch (err) {
      console.error("Error generating image:", err);
      alert("เกิดข้อผิดพลาดในการสร้างรูปภาพครับ: " + err.message);
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
    try { await setDoc(doc(db, 'settings', 'search_stats'), { [cleanTerm]: increment(1) }, { merge: true }); } catch (e) { console.error(e); }
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
        @import url('https://fonts.googleapis.com/css2?family=Vollkorn:wght=700&family=Kanit:wght@300;400;600;700&display=swap');
        
        :root {
          --theme-primary: ${currentThemeData.primary};
          --theme-accent: ${currentThemeData.accent};
          --theme-bg: ${currentThemeData.bg};
        }
        .font-serif { font-family: 'Vollkorn', serif; }
        .font-kanit { font-family: 'Kanit', sans-serif; }
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

      {/* --- Floating Theme Decorations --- */}
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

        {/* --- Cart View (หน้าตะกร้าสินค้าและการส่งบิลเข้า LINE ส่วนตัว) --- */}
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
                               <CheckCircle size={14}/> แนบสลิปเรียบร้อย
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

        {/* --- My Orders View (ประวัติบิลคำสั่งซื้อฝั่งลูกค้า) --- */}
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

        {/* --- Admin Tab (ระบบหลังบ้านแอดมินร้าน) --- */}
        {view === 'admin' && (
          <div className="p-6 bg-white min-h-screen animate-in fade-in relative z-20">
            <button onClick={() => setView('shop')} className="flex items-center gap-2 font-bold text-gray-400 text-sm mb-6 hover:text-primary"><ChevronLeft size={20}/> กลับหน้าร้าน</button>
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-serif font-bold text-primary">ระบบแอดมินร้าน</h2>
               <button onClick={playNotificationSound} className="text-[10px] bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><BellRing size={12}/> เทสเสียงเตือน</button>
            </div>
            
            <div className="flex gap-1 bg-gray-50 p-1 rounded-2xl mb-6 shadow-inner overflow-x-auto hide-scrollbar">
              {['orders', 'menus', 'dashboard', 'settings'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${adminTab === t ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-primary'}`}>
                  {t === 'orders' ? 'ออร์เดอร์' : t === 'menus' ? 'เมนู' : t === 'dashboard' ? 'รายรับ' : 'ตั้งค่า'}
                </button>
              ))}
            </div>

            {/* TAB: Dashboard รายรับ */}
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

            {/* TAB: ตรวจสอบออร์เดอร์ของแอดมิน */}
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

            {/* TAB: ระบบจัดการคลังเมนูของร้าน */}
            {adminTab === 'menus' && (
              <div className="space-y-8 animate-in fade-in">
                {/* 🌟 ส่วน Header จัดการเมนู และ ปุ่มสร้างป้ายเมนูรวม (Menu Board) */}
                <div className="bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-primary)] p-6 rounded-[2.5rem] shadow-lg flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                   <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black opacity-20 rounded-full blur-2xl pointer-events-none"></div>
                   
                   <h3 className="text-white font-bold text-lg font-serif z-10 flex items-center gap-2"><ClipboardList/> จัดการเมนู & โปรโมท</h3>
                   <button onClick={() => setShowMenuBoardModal(true)} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-4 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/30 z-10">
                      <ImageIcon size={18}/> 🖨️ สร้างป้ายเมนูรวม (Menu Board)
                   </button>
                </div>

                <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 relative mt-4">
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
                            <div className="flex gap-2">
                              {/* ปุ่มสร้างป้ายโปรโมทแบบเดี่ยว (Instagram Poster) */}
                              <button onClick={() => setPosterMenu(item)} className="p-2 text-indigo-500 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors" title="สร้างป้ายโปรโมทแบบเดี่ยว"><ImageIcon size={16}/></button>
                              <button onClick={() => handleDeleteMenu(item.id)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: ตั้งค่าบัญชีและธีมร้าน */}
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

      {/* --- 🌟 [ใหม่] Modal สร้างป้ายเมนูรวม (Menu Board) --- */}
      {showMenuBoardModal && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex flex-col items-center p-4 animate-in fade-in backdrop-blur-md overflow-y-auto">
          
          {/* Action Bar (Top) */}
          <div className="w-full max-w-[800px] flex justify-between items-center mb-4 sticky top-0 z-50 p-2">
            <button onClick={() => setShowMenuBoardModal(false)} className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-all backdrop-blur-md"><X size={24}/></button>
            <button 
               onClick={() => generateImageFromRef(menuBoardRef, 'ป้ายเมนูรวม_วัวนมอารมณ์ดี.png')} 
               disabled={isGeneratingPoster}
               className={`py-3 px-6 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 backdrop-blur-md ${isGeneratingPoster ? 'bg-gray-500 text-gray-300' : 'bg-green-500 text-white hover:bg-green-600 border border-green-400'}`}
            >
               {isGeneratingPoster ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={20}/>}
               {isGeneratingPoster ? 'กำลังเรนเดอร์ภาพ (รอสักครู่)...' : 'ดาวน์โหลดป้าย (ความละเอียดสูง)'}
            </button>
          </div>

          {/* 
            The Menu Board Container
            กำหนดขนาด Fixed (800x1131) อัตราส่วนคล้าย A4 เพื่อให้ html2canvas จับภาพออกมาชัดและไม่แตก
            ใช้ CSS Transform เพื่อย่อขนาดให้พอดีกับหน้าจอมือถือเวลา Preview
          */}
          <div className="relative w-[800px] h-[1131px] bg-white rounded-xl shadow-2xl flex-shrink-0 overflow-hidden transform origin-top scale-[0.4] sm:scale-[0.6] md:scale-90 lg:scale-100" style={{ transformOrigin: 'top center' }}>
             
             {/* ซ่อนเนื้อหาจริงๆ ใน Ref เพื่อนำไป Render */}
             <div ref={menuBoardRef} className="absolute inset-0 w-[800px] h-[1131px] flex flex-col font-kanit" style={{ background: `linear-gradient(180deg, ${currentThemeData.bg} 0%, #ffffff 40%, #ffffff 100%)` }}>
                
                {/* 1. ส่วน Header (โลโก้ + ชื่อร้าน) */}
                <div className="relative w-full h-[220px] flex items-center justify-center border-b-[8px]" style={{ borderColor: currentThemeData.primary }}>
                   <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundColor: currentThemeData.accent }}></div>
                   
                   {/* ไอคอน/โลโก้วัว */}
                   <div className="absolute left-[50px] bottom-0 flex items-end">
                      <div className="text-[120px] leading-none z-10" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))' }}>🐮</div>
                      <div className="text-[60px] leading-none -ml-8 mb-4 z-20" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))' }}>🧋</div>
                   </div>

                   {/* ข้อความชื่อร้าน */}
                   <div className="flex flex-col items-center ml-[180px] z-10">
                      <h1 className="font-serif font-bold text-[85px] leading-none tracking-tight" style={{ color: currentThemeData.primary, textShadow: '2px 2px 0px #fff, 4px 4px 0px rgba(0,0,0,0.1)' }}>วัวนมอารมณ์ดี</h1>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="w-16 h-[2px]" style={{ backgroundColor: currentThemeData.accent }}></div>
                         <h2 className="font-serif text-[40px] leading-none text-gray-700 uppercase tracking-widest">Happy Moo</h2>
                         <div className="w-16 h-[2px]" style={{ backgroundColor: currentThemeData.accent }}></div>
                      </div>
                      <p className="text-[20px] font-bold mt-3 text-gray-600 tracking-widest flex items-center gap-2">
                         <span style={{ color: currentThemeData.accent }}>♥</span> สดชื่น หวานมัน กลมกล่อม <span style={{ color: currentThemeData.accent }}>♥</span>
                      </p>
                   </div>
                </div>

                {/* 2. ส่วน Main Body (แบ่ง 2 คอลัมน์ 60/40) */}
                <div className="flex-1 flex px-[40px] py-[30px] gap-[40px]">
                   
                   {/* 2.1 ฝั่งซ้าย (รายการเมนูเครื่องดื่ม) */}
                   <div className="w-[60%] flex flex-col relative z-10">
                      
                      {/* หัวตารางราคา */}
                      <div className="flex justify-between items-end border-b-4 pb-2 mb-4" style={{ borderColor: currentThemeData.accent }}>
                         <div className="font-bold text-[32px] text-white px-8 py-1 rounded-t-3xl rounded-br-3xl inline-block" style={{ backgroundColor: currentThemeData.primary }}>เมนู</div>
                         <div className="flex gap-6 pr-2">
                            <span className="font-bold text-[22px] w-16 text-center" style={{ color: currentThemeData.primary }}>เย็น</span>
                            <span className="font-bold text-[22px] w-16 text-center" style={{ color: currentThemeData.primary }}>ปั่น</span>
                         </div>
                      </div>

                      {/* รายการเครื่องดื่ม (ดึงเฉพาะที่เปิดขาย) */}
                      <div className="flex flex-col gap-1.5 flex-1">
                         {CATEGORIES.filter(c => c !== '🔥 เมนูขายดี').map(cat => {
                            const items = menuItems.filter(i => i.category === cat && !i.isSoldOut).sort((a,b) => (a.sortOrder||0) - (b.sortOrder||0));
                            if(!items.length) return null;
                            return (
                               <div key={cat} className="mb-3">
                                  {/* ชื่อหมวดหมู่ย่อย */}
                                  <h4 className="font-bold text-[18px] mb-1 pl-2 opacity-80" style={{ color: currentThemeData.primary }}>{cat}</h4>
                                  
                                  {items.map(item => {
                                     const coldPrice = item.isOnlyBlend ? '-' : item.price;
                                     const blendPrice = item.allowBlend === false ? '-' : (item.price + getAddedBlendPrice(item));
                                     return (
                                        <div key={item.id} className="flex justify-between items-end w-full mb-1">
                                           <div className="font-semibold text-[20px] text-gray-800 bg-white pr-2 whitespace-nowrap">{item.name}</div>
                                           {/* เส้นประ Dotted Line */}
                                           <div className="flex-grow border-b-[3px] border-dotted border-gray-300 relative top-[-8px] mx-1"></div>
                                           <div className="flex gap-6 bg-white pl-2">
                                              <div className="font-bold text-[22px] text-gray-700 w-16 text-center">{coldPrice}</div>
                                              <div className="font-bold text-[22px] text-gray-700 w-16 text-center">{blendPrice}</div>
                                           </div>
                                        </div>
                                     )
                                  })}
                               </div>
                            )
                         })}
                      </div>
                   </div>

                   {/* 2.2 ฝั่งขวา (ท็อปปิ้ง + QR Code) */}
                   <div className="w-[40%] flex flex-col gap-[30px] relative z-10">
                      
                      {/* กล่องท็อปปิ้ง */}
                      <div className="border-[3px] rounded-3xl overflow-hidden bg-white/80" style={{ borderColor: currentThemeData.accent }}>
                         <div className="py-2 text-center text-white font-bold text-[28px]" style={{ backgroundColor: currentThemeData.accent }}>ท็อปปิ้ง</div>
                         <div className="p-5 flex flex-col gap-3">
                            {toppings.map(t => (
                               <div key={t.id} className="flex justify-between items-center text-[22px]">
                                  <span className="font-bold text-gray-700 flex items-center gap-2">
                                     <span className="text-[24px]">✨</span> {t.name}
                                  </span>
                                  <span className="font-bold text-gray-800">{t.price} <span className="text-[18px] font-normal text-gray-500">บาท</span></span>
                               </div>
                            ))}
                            {toppings.length === 0 && <div className="text-center text-gray-400 py-4">ไม่มีท็อปปิ้งเสริม</div>}
                         </div>
                      </div>

                      {/* กล่อง QR Code ติดต่อ */}
                      <div className="border-[3px] rounded-3xl p-5 flex flex-col items-center bg-white" style={{ borderColor: currentThemeData.primary }}>
                         <h3 className="font-bold text-[24px] mb-4 flex items-center gap-2" style={{ color: currentThemeData.primary }}>
                            <span style={{ color: currentThemeData.accent }}>♥</span> ช่องทางติดต่อ <span style={{ color: currentThemeData.accent }}>♥</span>
                         </h3>
                         {storeSettings.qrCodeImage ? (
                            <img src={storeSettings.qrCodeImage} className="w-[200px] h-[200px] object-contain border border-gray-100 rounded-xl" alt="Contact QR" />
                         ) : (
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lin.ee/your-line-link`} className="w-[200px] h-[200px] p-2 border border-gray-100 rounded-xl" alt="Default QR" />
                         )}
                         <div className="bg-[#06C755] text-white px-6 py-2 rounded-full font-bold text-[20px] mt-4 shadow-md flex items-center gap-2">
                            <MessageSquare size={20}/> สั่งซื้อผ่าน LINE
                         </div>
                      </div>

                   </div>
                </div>

                {/* 3. ส่วน Footer (เงื่อนไขการจัดส่ง) */}
                <div className="mt-auto px-[40px] pb-[30px] pt-4">
                   <div className="grid grid-cols-3 gap-4 border-[3px] rounded-2xl bg-white" style={{ borderColor: currentThemeData.bg }}>
                      {/* الشرط 1 */}
                      <div className="flex items-center gap-3 p-3 border-r-[3px]" style={{ borderColor: currentThemeData.bg }}>
                         <div className="p-3 rounded-full bg-orange-100 text-orange-600"><Home size={32}/></div>
                         <div>
                            <p className="font-bold text-[18px] text-gray-800 leading-none">กอล์ฟวิวส่งฟรี</p>
                            <p className="text-[14px] text-gray-500 leading-tight mt-1">ส่งหน้าห้องแค่เข้าตึกได้</p>
                         </div>
                      </div>
                      {/* الشرط 2 */}
                      <div className="flex items-center gap-3 p-3 border-r-[3px]" style={{ borderColor: currentThemeData.bg }}>
                         <div className="p-3 rounded-full bg-blue-100 text-blue-600"><CloudRain size={32}/></div>
                         <div>
                            <p className="font-bold text-[18px] text-gray-800 leading-none">ฝนตก</p>
                            <p className="text-[14px] text-gray-500 leading-tight mt-1">ส่งใต้ตึกเท่านั้น</p>
                         </div>
                      </div>
                      {/* الشرط 3 */}
                      <div className="flex items-center gap-3 p-3">
                         <div className="p-3 rounded-full bg-red-100 text-red-600"><ZapOff size={32}/></div>
                         <div>
                            <p className="font-bold text-[18px] text-gray-800 leading-none">ไฟดับ / ลิฟต์พัง</p>
                            <p className="text-[14px] text-gray-500 leading-tight mt-1">ส่งใต้ตึกเท่านั้น</p>
                         </div>
                      </div>
                   </div>

                   {/* Thank you bar */}
                   <div className="w-full text-center text-white py-2 rounded-b-2xl font-bold text-[18px] tracking-widest mt-2" style={{ backgroundColor: currentThemeData.primary }}>
                      <span style={{ color: currentThemeData.accent }}>♥</span> ขอบคุณที่อุดหนุนค่ะ <span style={{ color: currentThemeData.accent }}>♥</span>
                   </div>
                </div>

             </div>
          </div>
          {/* พื้นที่ดัน Scroll ด้านล่างให้มือถือเลื่อนดูได้สุด */}
          <div className="h-[20vh] w-full flex-shrink-0"></div>
        </div>
      )}

      {/* --- Modal สร้างป้ายโปรโมทอัตโนมัติแบบเดี่ยว (Poster Generator - IG Story Style) --- */}
      {posterMenu && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex flex-col items-center justify-center p-4 animate-in fade-in backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative">
            
            <button onClick={() => setPosterMenu(null)} className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors">
               <X size={20}/>
            </button>

            {/* โซนที่ต้องการถ่ายภาพ Capture Area */}
            <div ref={posterRef} className="w-full bg-gradient-to-br from-[#F5EEDC] to-[#ffffff] relative flex flex-col items-center p-8 text-center" style={{ aspectRatio: '3/4' }}>
               {/* องค์ประกอบตกแต่ง */}
               <div className="absolute top-0 left-0 w-full h-32 bg-[var(--theme-accent)] opacity-10 rounded-b-[50%]"></div>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
               
               <h1 className="font-serif font-bold text-2xl text-[var(--theme-primary)] mb-6 z-10">วัวนมอารมณ์ดี 🐮</h1>
               
               <div className="relative z-10 w-48 h-48 mb-6">
                 <div className="absolute inset-0 bg-white rounded-[2rem] shadow-xl transform rotate-3"></div>
                 <img src={posterMenu.image} className="absolute inset-0 w-full h-full object-cover rounded-[2rem] shadow-lg transform -rotate-3 border-4 border-white" alt="menu poster" crossOrigin="anonymous" />
                 {posterMenu.isPromoted && (
                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12 border-2 border-white">
                      แนะนำ! 🔥
                    </div>
                 )}
               </div>

               <h2 className="font-kanit font-bold text-3xl text-[var(--theme-primary)] leading-tight mb-2 z-10 line-clamp-2">{posterMenu.name}</h2>
               
               <div className="mt-auto mb-4 z-10">
                 <p className="text-[10px] font-bold text-[var(--theme-accent)] uppercase tracking-[0.2em] mb-1">เพียงแก้วละ</p>
                 <div className="bg-[var(--theme-primary)] text-white px-8 py-3 rounded-full font-bold text-4xl shadow-2xl inline-block border-4 border-[#F5EEDC]">
                    ฿{posterMenu.price}
                 </div>
               </div>

               {posterMenu.hasFreePearl && (
                  <p className="font-kanit text-orange-600 font-bold text-sm bg-orange-100 px-4 py-1.5 rounded-full z-10 border border-orange-200">
                    ✨ ฟรีไข่มุกหนึบหนับ!
                  </p>
               )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
               <button onClick={() => generateImageFromRef(posterRef, `ป้ายโปรโมท_${posterMenu.name}.png`)} disabled={isGeneratingPoster} className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${isGeneratingPoster ? 'bg-gray-300 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {isGeneratingPoster ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={18}/>}
                  {isGeneratingPoster ? 'กำลังสร้างรูปภาพ...' : 'บันทึกรูปป้ายลงเครื่อง'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal เลือกออปชันเมนูเครื่องดื่มตอนสั่งซื้อ --- */}
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

      {/* Modal ถ่ายรูปยืนยันการส่งของ (แอดมินหลังบ้าน) */}
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

      {/* Modal ดูรูปภาพสลิปแบบขยายใหญ่ */}
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

      {/* --- 🌟 [NEW] Modal แสดงรูปภาพที่สร้างเสร็จ (ป้องกันปัญหาโหลดไม่ลงในมือถือ) --- */}
      {generatedPreview && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center p-4 animate-in zoom-in backdrop-blur-md">
          <button onClick={() => setGeneratedPreview(null)} className="absolute top-4 right-4 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition-all"><X size={24}/></button>
          
          <div className="bg-white/10 px-6 py-3 rounded-full mb-6 border border-white/20 text-center animate-pulse">
            <p className="text-white font-bold flex items-center justify-center gap-2"><ArrowDownToLine size={20}/> สร้างรูปภาพสำเร็จ!</p>
            <p className="text-white/80 text-[11px] mt-1">📱 <b>บนมือถือ/แท็บเล็ต:</b> แตะค้างที่รูปภาพ ด้านล่าง แล้วเลือก "บันทึกรูปภาพ"</p>
          </div>

          <div className="relative w-full max-w-lg max-h-[60vh] overflow-auto hide-scrollbar rounded-2xl shadow-2xl border-4 border-white/20 bg-white">
            <img src={generatedPreview.src} className="w-full object-contain" alt="Generated Poster" />
          </div>

          <a href={generatedPreview.src} download={generatedPreview.name} className="mt-8 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-600 transition-all active:scale-95">
             <Download size={20}/> ดาวน์โหลด (สำหรับ PC)
          </a>
        </div>
      )}

    </div>
  );
}