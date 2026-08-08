import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  ShoppingCart, Plus, Trash2, ChevronLeft, X, Upload, ClipboardList, Coffee, Zap, 
  MapPin, Settings, Copy, CheckCircle, AlertCircle, LogIn, Eye, Clock, Check, 
  Banknote, CreditCard, MessageSquare, Star, Edit, Save, Camera, Home, Building, 
  TrendingUp, Download, ArrowUp, ArrowDown, Search, Palette, BellRing, Share2, UserCheck,
  Sparkles, Database, Users, Filter, Calendar, UserX, DollarSign, Package, CheckCircle2, ChevronRight, ShieldCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, 
  updateDoc, increment, query, orderBy, limit, getDocs 
} from 'firebase/firestore';

// --- 1. Firebase Configuration & Constants ---
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
const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PAYMENT_COLORS = {
  "ไทยช่วยไทยพลัส": "#10b981", // Emerald 500
  "โอนพร้อมเพย์": "#3b82f6", // Blue 500
  "เงินสด": "#f59e0b", // Amber 500
  "promptpay": "#3b82f6",
  "cash": "#f59e0b",
  "thaichueithai": "#10b981"
};

const fallbackData = [
  { datetime: "1/8/2569 17:28:46", billId: "V9jzbyrkcbtAtVTi7zfP", customer: "pattt", items: "1x โกโก้ (เย็น • หวาน 75%)", total: 45, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าตึก", address: "C5424", remark: "-" },
  { datetime: "1/8/2569 17:24:42", billId: "dTkL2HE3I3url2BSn6vn", customer: "ลูกค้าทั่วไป", items: "1x ชาเขียว สตอ (เย็น • หวาน 75%)", total: 60, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "M2 2222", remark: "-" },
  { datetime: "1/8/2569 15:36:27", billId: "2nv9thLaHUIKYvUIWtH2", customer: "ตองเอง", items: "1x ชาไทย(ใบชาไต้) (เย็น • หวาน 100% • พรีมุก • ท็อปปิ้ง: บุกบราวชูก้า)\n1x วิปครีม แก้ว 6 oz ฟรี ซอส 1 รส (เย็น • หวาน 100% • ซอส: คาราเมล • ท็อปปิ้ง: บุกบราวชูก้า)\n1x วิปครีม แก้ว 6 oz ฟรี ซอส 1 รส (เย็น • หวาน 100% • ซอส: คาราเมล • ท็อปปิ้ง: ช็อคโกแลตชิป)", total: 105, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "รับเองที่ร้าน", address: "P1 ห้อง 703", remark: "-" },
  { datetime: "1/8/2569 15:27:12", billId: "V0VO8lLiKdmaXFEvDaUR", customer: "nxx", items: "1x โกโก้ (เย็น • หวาน 50% • พรีมุก)", total: 45, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C7107", remark: "-" },
  { datetime: "1/8/2569 15:20:31", billId: "rYxvl8uHZ1mhXz5fjy1d", customer: "P 😊", items: "1x นมสดโอริโอ้ (ปั่น • หวาน 120% • พรีมุก)", total: 65, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "P1223", remark: "รับหลอด" },
  { datetime: "1/8/2569 15:14:17", billId: "I8CnHpvKPr5UrV9RNyGv", customer: "PHRONPHIMAL", items: "1x ชาไทย(ใบชาไต้) (ปั่น • หวาน 100% • พรีมุก)", total: 50, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "M1 1112", remark: "-" },
  { datetime: "1/8/2569 15:10:26", billId: "7BZEwZa2rZvrMPhnzm1i", customer: "NaMTaN", items: "1x โยเกิร์ต ออริจินอล (ปั่น • หวาน 50%)", total: 55, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "รับเองที่ร้าน", address: "ตึก B5 ห้อง B550", remark: "-" },
  { datetime: "1/8/2569 14:48:09", billId: "rWMs3QoLUYe4GvJ8XT6j", customer: "Sss", items: "1x นมสดปั่น (ปั่น • หวาน 75%)\n1x นมสดโอริโอ้ (ปั่น • หวาน 75% • พรีมุก)", total: 120, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C5620", remark: "-" },
  { datetime: "1/8/2569 14:27:24", billId: "ImUVGFgNZSnbSik1F8RZ", customer: "i d e a", items: "1x ชีสเค้ก บลูเบอร์รี (ปั่น • หวาน 100% • ท็อปปิ้ง: ไข่มุก)", total: 75, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าตึก", address: "A2", remark: "-" },
  { datetime: "1/8/2569 14:25:41", billId: "MbjNuRhSRzs9Gjic7PgJ", customer: "ครูฟ้า ☔", items: "1x โกโก้ สตอเบอร์รี่ (เย็น • หวาน 0%)\n1x ชาเขียวมะนาว (เย็น • หวาน 50%)", total: 105, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "B6105", remark: "-" },
  { datetime: "1/8/2569 14:25:33", billId: "Ly5AcQjTQTm3rXvzxjm0", customer: "สินSinซินSin", items: "1x นมสดโอริโอ้ (ปั่น • หวาน 25% • พรีมุก • ท็อปปิ้ง: ครีมชีส)", total: 80, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าตึก", address: "m2513", remark: "หวาน25" },
  { datetime: "1/8/2569 13:59:58", billId: "XclyziB25xCaqTwRiWVL", customer: "beam", items: "1x แคนตาลูป (เย็น • หวาน 50% • พรีมุก)", total: 40, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C6 ห้อง 415", remark: "-" },
  { datetime: "1/8/2569 13:39:13", billId: "xo28meNeN3N24JIqLG0c", customer: ".AD", items: "1x ชาไทย(ใบชาไต้) (เย็น • หวาน 50%)\n1x ชาไทย(ใบชาไต้) (เย็น • หวาน 25%)", total: 90, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C5513", remark: "-" },
  { datetime: "1/8/2569 13:30:56", billId: "yoRUZrhSuMjWB6YvsYMG", customer: "Natthamon", items: "1x นมสด (ปั่น • หวาน 100% • พรีมุก)\n1x ชาไทย(ใบชาไต้) (เย็น • หวาน 100% • พรีมุก • ท็อปปิ้ง: ครีมชีส)", total: 105, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C6511", remark: "-" },
  { datetime: "1/8/2569 13:30:03", billId: "mwwYHkWvkZ8BaTxBHLDz", customer: "ornnnn ♡", items: "1x ชีสเค้ก สตอเบอร์รี่ (ปั่น • หวาน 100% • ท็อปปิ้ง: วิปครีม)", total: 80, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "รับเองที่ร้าน", address: "M1 702", remark: "-" },
  { datetime: "1/8/2569 13:15:08", billId: "yWepK9IsiNwg84EYck06", customer: "Austin 🌴", items: "1x นมวนิลา (ปั่น • หวาน 120% • พรีมุก)", total: 45, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C1719", remark: "ไม่ต้องเคาะประตูนะคับ" },
  { datetime: "1/8/2569 13:06:13", billId: "FfPDLpzwYI8TjIw0QyTW", customer: "Nnine", items: "1x ชาไทย(ใบชาไต้) (เย็น • หวาน 75% • พรีมุก)", total: 45, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C6-207", remark: "-" },
  { datetime: "1/8/2569 12:55:19", billId: "MGSLppE2j4okjABzKXJF", customer: "Nemo", items: "1x ชาไทย(ใบชาไต้) (ปั่น • หวาน 50% • พรีมุก)", total: 50, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "C5 224", remark: "-" },
  { datetime: "1/8/2569 12:54:42", billId: "EZmAuJotuWj9JNUkjUqA", customer: "KotchaTy", items: "1x นมน้ำผึ้ง (เย็น • หวาน 75%)", total: 40, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "รับเองที่ร้าน", address: "A7 614", remark: "-" },
  { datetime: "1/8/2569 12:45:36", billId: "fK0LY8maZMBgthJkHIOJ", customer: "Tan", items: "1x อเมริกาโน่ น้ำผึ้ง (เย็น • หวาน 50% • คั่วเข้ม)", total: 50, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าตึก", address: "A1", remark: "-" },
  { datetime: "1/8/2569 12:24:40", billId: "EMPktehi2CGgwU01txbe", customer: ".bam-", items: "1x น้ำผึ้งมะนาว (เย็น • หวาน 25%)\n1x ชานมไต้หวัน (ปั่น • หวาน 25%)", total: 90, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "P2526", remark: "-" },
  { datetime: "1/8/2569 17:51:19", billId: "YE1Tx6VAV6jinbI1rd4t", customer: "prrrim", items: "1x วิปครีม แก้ว 6 oz ฟรี ซอส 1 รส (เย็น • หวาน 100% • ซอส: ช็อกโกแลต)\n1x ชาไทย(ใบชาไต้) (เย็น • หวาน 75% • พรีมุก)", total: 65, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "B5 810", remark: "ไม่ใส่ไข่มุกค่ะ" },
  { datetime: "1/8/2569 17:53:22", billId: "pwXGJgxFk1lHCVNdA8Gc", customer: "Rachma", items: "1x ชาไทย(ใบชาไต้) (เย็น • หวาน 50% • พรีมุก)", total: 45, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "m1826", remark: "-" },
  { datetime: "1/8/2569 17:54:34", billId: "yBlY0AVsy5cBcNdEF9jd", customer: "praew", items: "1x เพียวมัทฉะ (เย็น • หวาน 0% • มัทฉะ)", total: 45, payment: "โอนพร้อมเพย์", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "จัดส่งที่ตึก A3610", remark: "-" },
  { datetime: "1/8/2569 18:33:39", billId: "2KsLxtVUQdulkpSNL8wJ", customer: "Boss", items: "1x อเมริกาโน่ (เย็น • หวาน 25% • คั่วเข้ม)", total: 45, payment: "ไทยช่วยไทยพลัส", status: "จัดส่งสำเร็จ 🟢", deliveryPoint: "ส่งหน้าห้อง", address: "กอล์ฟวิว m2 620", remark: "เอาไข่มุกกับบุกบราวน์ชูก้า" },
  { datetime: "1/8/2569 18:45:00", billId: "CANCELLED001", customer: "ลูกค้าทดสอบ (ยกเลิก)", items: "1x นมสด (เย็น)", total: 40, payment: "เงินสด", status: "ยกเลิก 🔴", deliveryPoint: "รับเองที่ร้าน", address: "-", remark: "ลูกค้าเปลี่ยนใจ" }
];

const DEFAULT_SAUCES = [
  { name: 'ซอสช็อกโกแลต', price: 0 },
  { name: 'ซอสคาราเมล', price: 0 },
  { name: 'ซอสสตรอว์เบอร์รี่', price: 0 },
  { name: 'นมข้นหวาน', price: 0 },
  { name: 'ซอสมัทฉะ', price: 0 },
  { name: 'ซอสชาไทย', price: 0 }
];

const THEMES = {
  default: { bg: '#F9F6F0', primary: '#2D2118', accent: '#B8860B', name: 'ปกติ (มินิมอลพรีเมียม)', icons: [] },
  christmas: { bg: '#f0fdf4', primary: '#166534', accent: '#dc2626', name: '🎄 คริสต์มาส', icons: ['❄️', '⛄', '🎁', '🦌'] },
  valentine: { bg: '#fdf2f8', primary: '#831843', accent: '#db2777', name: '💖 วาเลนไทน์', icons: ['💖', '💕', '🌹', '🥰'] },
  songkran: { bg: '#e0f2fe', primary: '#0369a1', accent: '#0ea5e9', name: '💦 สงกรานต์', icons: ['💦', '🔫', '🌊', '🌴'] },
  halloween: { bg: '#fffbeb', primary: '#451a03', accent: '#ea580c', name: '🎃 ฮาโลวีน', icons: ['🎃', '👻', '🦇', '🕸️'] },
  newyear: { bg: '#f8fafc', primary: '#0f172a', accent: '#ca8a04', name: '🎆 ปีใหม่', icons: ['🎆', '✨', '🎉', '🥂'] },
  loykrathong: { bg: '#f5f3ff', primary: '#2e1065', accent: '#7c3aed', name: '🌕 ลอยกระทง', icons: ['🌕', '🕯️', '🌸', '✨'] },
  custom: { bg: '#F9F6F0', primary: '#2D2118', accent: '#B8860B', name: '🎨 อัปโหลดเอง', icons: [] },
};

// --- 2. Helper Functions ---

const formatDateForComparison = (datetimeString) => {
  if (!datetimeString) return "";
  try {
    const str = String(datetimeString).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }

    const datePart = str.split(/[ T]/)[0];
    const parts = datePart.split(/[\/\.-]/);
    if (parts.length < 3) return "";

    let day, month, year;

    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return "";

    if (year > 2400) {
      year -= 543;
    }

    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');

    return `${year}-${paddedMonth}-${paddedDay}`;
  } catch (e) {
    return "";
  }
};

const parseCustomDate = (dateVal, dateStrVal, fallbackVal) => {
  const val = dateVal || dateStrVal || fallbackVal;
  if (!val) return null;

  if (typeof val === 'number' && val > 1000000000) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(), dateObj: d };
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  const parsedStandard = new Date(str);
  if (!isNaN(parsedStandard.getTime()) && parsedStandard.getFullYear() > 1900) {
    let y = parsedStandard.getFullYear();
    if (y > 2400) y -= 543; 
    return { day: parsedStandard.getDate(), month: parsedStandard.getMonth() + 1, year: y, dateObj: parsedStandard };
  }

  const match = str.match(/(\d{1,4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,4})/);
  if (match) {
    let p1 = parseInt(match[1], 10);
    let p2 = parseInt(match[2], 10);
    let p3 = parseInt(match[3], 10);

    let day, month, year;
    if (p1 > 1000) {
      year = p1; month = p2; day = p3;
    } else {
      day = p1; month = p2; year = p3;
    }

    if (year > 2400) year -= 543; 

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 1900) {
      return { day, month, year, dateObj: new Date(year, month - 1, day) };
    }
  }

  return null;
};

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

// [MODIFIED] High-End KPI Card Component with sleek visual contrast
function KpiCard({ title, value, icon, trend, trendUp }) {
  return (
    <div className="bg-slate-800/90 backdrop-blur-md p-5 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between group hover:border-amber-500/40 transition-all duration-300">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        {trend && (
          <p className={`text-[10px] mt-1.5 flex items-center gap-1 font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className="w-12 h-12 rounded-xl bg-slate-700/50 border border-slate-600/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
    </div>
  );
}

// --- 3. Main App Component ---
export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toppings, setToppings] = useState([]); 
  const [sauces, setSauces] = useState([]);
  
  const [cart, setCart] = useState(() => {
    try { const saved = localStorage.getItem('happycow_cart'); return saved ? JSON.parse(saved) : []; }
    catch(e) { return []; }
  });

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'viewOrders') {
      const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
      if (isAdmin) return 'admin'; 
      return 'myOrders';
    }
    if (action === 'admin') {
      return localStorage.getItem('happycow_isAdmin') === 'true' ? 'admin' : 'shop';
    }
    
    const isFirstTimeSession = !sessionStorage.getItem('happycow_session_active');
    sessionStorage.setItem('happycow_session_active', 'true');
    if (isFirstTimeSession) {
      return 'shop';
    }
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

  const [msgBox, setMsgBox] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const showAlert = (message, onConfirm = null) => setMsgBox({ isOpen: true, type: 'alert', message, onConfirm });
  const showConfirm = (message, onConfirm) => setMsgBox({ isOpen: true, type: 'confirm', message, onConfirm });
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState('orders'); 
  const [selectedSlip, setSelectedSlip] = useState(null); 
  const [downloadPreview, setDownloadPreview] = useState(null); 
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  
  // Analytics Filters State
  const [analyticsSearchTerm, setAnalyticsSearchTerm] = useState('');
  const [analyticsSelectedDate, setAnalyticsSelectedDate] = useState('');
  const [analyticsHideCanceled, setAnalyticsHideCanceled] = useState(true);

  const [selectedOrderId, setSelectedOrderId] = useState('');

  const [deliveryModal, setDeliveryModal] = useState(null);
  const [deliveryImage, setDeliveryImage] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('room');
  const [isDelivering, setIsDelivering] = useState(false);

  const [storeSettings, setStoreSettings] = useState({ 
    promptPayNo: '0812345678', qrCodeImage: '', isStoreOpen: true, theme: 'default', 
    customBgImage: '', isBlendOut: false, notifyAdmin: false, adminLineId: '',
    shopLineUrl: '', autoCloseEnabled: false, maxQueue: 3, autoCloseDays: [],
    googleSheetUrl: 'https://script.google.com/macros/s/AKfycbz8AiaKwcO7IhRqwCEsZhpPmTw9mIkWsnKB-2MDti0-hpDFQ6FGM4ExfijSDfdXm8mn/exec'
  });
  const [editPromptPay, setEditPromptPay] = useState('');
  const [editQrCodeImage, setEditQrCodeImage] = useState('');
  const [editCustomBgImage, setEditCustomBgImage] = useState('');
  const [editNotifyAdmin, setEditNotifyAdmin] = useState(false);
  const [editAdminLineId, setEditAdminLineId] = useState('');
  const [editShopLineUrl, setEditShopLineUrl] = useState('');
  const [editAutoCloseEnabled, setEditAutoCloseEnabled] = useState(false);
  const [editMaxQueue, setEditMaxQueue] = useState(3);
  const [editAutoCloseDays, setEditAutoCloseDays] = useState([]);
  const [editGoogleSheetUrl, setEditGoogleSheetUrl] = useState(''); 
  
  const [isSyncingAll, setIsSyncingAll] = useState(false); 

  const [sheetOrdersData, setSheetOrdersData] = useState([]);
  const [isLoadingSheetDashboard, setIsLoadingSheetDashboard] = useState(false);

  const [sheetFilterDay, setSheetFilterDay] = useState('all');
  const [sheetFilterMonth, setSheetFilterMonth] = useState('all');
  const [sheetFilterYear, setSheetFilterYear] = useState('all');

  const [visitLogs, setVisitLogs] = useState([]);

  const [newMenu, setNewMenu] = useState({ 
    name: '', price: '', category: 'นม', image: '', blendPrice: 5, 
    hasFreePearl: false, allowTopping: true, allowSauce: false, allowBlend: true, 
    isOnlyBlend: false, isPromoted: false, isSoldOut: false, hasTeaType: false,
    allowedSweetness: ['0%', '25%', '50%', '75%', '100%', '120%']
  });
  const [editingMenu, setEditingMenu] = useState(null); 
  const [newTopping, setNewTopping] = useState({ name: '', price: '' }); 
  const [newSauce, setNewSauce] = useState({ name: '', price: 0 });

  const [showAddMenuForm, setShowAddMenuForm] = useState(false);
  const [showAddToppingForm, setShowAddToppingForm] = useState(false);
  const [showAddSauceForm, setShowAddSauceForm] = useState(false);

  const [successModalData, setSuccessModalData] = useState(null);
  const [adminDeliverySuccessData, setAdminDeliverySuccessData] = useState(null);

  const [optionModalItem, setOptionModalItem] = useState(null);
  const [tempOptions, setTempOptions] = useState({ 
    sweetness: '100%', isBlended: false, addPearl: true, selectedToppings: [], 
    selectedSauces: [], bean: 'คั่วเข้ม', teaType: 'มัทฉะ', addShot: false, separateIce: false 
  });
  const [lineProfile, setLineProfile] = useState({ displayName: 'ลูกค้าทั่วไป', pictureUrl: '', userId: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { const saved = localStorage.getItem('happycow_searchHistory'); return saved ? JSON.parse(saved) : []; }
    catch(e) { return []; }
  });
  const [popularSearches, setPopularSearches] = useState([]);
  const [visitStats, setVisitStats] = useState({});
  const [loadingSlipId, setLoadingSlipId] = useState(null);

  const [activeUsers, setActiveUsers] = useState([]);
  const [showStoreClosedModal, setShowStoreClosedModal] = useState(false);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const audioRef = useRef(null);
  const previousOrderCount = useRef(0);
  const isProcessingOrder = useRef(false);

  const isWhipOrCreamCheeseItem = (item) => {
    if (!item) return false;
    return item.category === 'วิปครีมและครีมชีส' || 
           item.category === 'ครีมและครีมชีส' || 
           (item.name && (item.name.includes('วิปครีม') || item.name.includes('ครีมชีส')));
  };

  const getAddedBlendPrice = (item) => {
    if (item.category === 'สมูทตี้โยเกิร์ต' || item.category === 'ผลไม้และสมูทตี้') return 0;
    return (item.blendPrice !== undefined && item.blendPrice !== null && item.blendPrice !== '') ? Number(item.blendPrice) : 5;
  };

  const generateOrderSummaryText = (order) => {
    if (!order) return '';
    const dateStr = new Date(order.timestamp).toLocaleString('th-TH');
    const paymentText = order.paymentMethod === 'cash' ? 'ชำระเงินสด' : (order.paymentMethod === 'thaichueithai' ? 'ไทยช่วยไทยพลัส' : 'โอนพร้อมเพย์');
    const orderLink = `https://liff.line.me/${LIFF_ID}?action=viewOrders&orderId=${order.id}`;

    const itemsListText = (order.items || []).map(i => {
      const blendText = getBlendText(i);
      const beanText = i.bean ? ` • เมล็ด: ${i.bean}` : '';
      const teaText = i.teaType ? ` • รสชา: ${i.teaType}` : '';
      const shotText = i.addShot ? ` • เพิ่มช็อตกาแฟ` : '';
      const iceText = i.separateIce ? ` • แยกน้ำแข็ง (+฿5)` : '';
      const saucesText = i.selectedSauces?.length > 0 ? ` • ราดซอส: ${i.selectedSauces.map(s => typeof s === 'object' ? s.name : s).join(', ')}` : '';
      const toppingsText = i.selectedToppings?.length > 0 ? ` • เพิ่มท็อปปิ้ง: ${i.selectedToppings.map(t => t.name).join(', ')}` : '';
      const pearlText = i.hasFreePearl ? (i.addPearl ? ' • รับไข่มุกฟรี' : ' • ไม่รับไข่มุกฟรี') : '';
      const sweetText = isWhipOrCreamCheeseItem(i) ? '' : ` • หวาน ${i.sweetness}`;
      return `- ${i.qty}x ${i.name} (${blendText}${sweetText}${beanText}${teaText}${shotText}${iceText}${pearlText}${saucesText}${toppingsText})`;
    }).join('\n');

    return `วัวนมอารมณ์ดี 🐮\nบิลเลขที่: #${order.id.slice(0, 6)}\nวัน/เวลา: ${dateStr}\nลูกค้า: คุณ ${order.lineName || "ลูกค้าทั่วไป"}\n${itemsListText}\n\nยอดรวม: ฿${order.total}\nที่อยู่: ${order.address || '-'}\nช่องทางชำระเงิน: ${paymentText}\nหมายเหตุ: ${order.note || '-'}\n\n📄 สั่งน้ำกดลิ้งค์ได้เลย: ${orderLink}`;
  };

  const handleShareOrderBill = async (order) => {
    const text = generateOrderSummaryText(order);
    if (!text) return;

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) { console.error("Clipboard copy error:", e); }
    }

    if (window.liff && window.liff.isLoggedIn() && window.liff.isApiAvailable('shareTargetPicker')) {
      try {
        await window.liff.shareTargetPicker([{ type: "text", text }]);
      } catch (err) {
        window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
      }
    } else {
      window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const sendOrderToGoogleSheets = async (orderData) => {
    const endpoint = storeSettings.googleSheetUrl;
    if (!endpoint || !endpoint.startsWith('http')) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch (err) {
      console.error("Google Sheets Sync Error:", err);
    }
  };

  const fetchDashboardDataFromGoogleSheets = useCallback(async () => {
    if (!storeSettings?.googleSheetUrl) return;

    setIsLoadingSheetDashboard(true);
    try {
      const res = await fetch(storeSettings.googleSheetUrl);
      const json = await res.json();

      if (json && json.status === 'success') {
        setSheetOrdersData(Array.isArray(json.data) ? json.data : []);
      } else {
        console.warn("Google Sheets API returned non-success status:", json);
        setSheetOrdersData([]);
      }
    } catch (err) {
      console.error("Error fetching Google Sheets dashboard:", err);
      setSheetOrdersData([]);
    } finally {
      setIsLoadingSheetDashboard(false);
    }
  }, [storeSettings?.googleSheetUrl]);

  const syncAllToGoogleSheets = async () => {
    if (!storeSettings.googleSheetUrl) {
      return showAlert("กรุณาตั้งค่า Google Sheet Web App URL ในเมนูตั้งค่าก่อนครับ");
    }
    setIsSyncingAll(true);
    try {
      const activeOrders = orders.filter(o => !o.isDeleted);
      await fetch(storeSettings.googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeOrders)
      });
      showAlert(`ซิงค์ข้อมูลทั้งหมด ${activeOrders.length} รายการ เข้า Google Sheets เรียบร้อยแล้วค่ะ! ✨`);
    } catch (e) {
      showAlert("เกิดข้อผิดพลาดในการซิงค์: " + e.message);
    } finally {
      setIsSyncingAll(false);
    }
  };

  useEffect(() => {
    if (storeSettings?.googleSheetUrl) {
      fetchDashboardDataFromGoogleSheets();
    }
  }, [storeSettings?.googleSheetUrl, fetchDashboardDataFromGoogleSheets]);

  useEffect(() => { localStorage.setItem('happycow_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('happycow_view', view); }, [view]);
  useEffect(() => { localStorage.setItem('happycow_address', address); }, [address]);
  useEffect(() => { localStorage.setItem('happycow_note', note); }, [note]);
  useEffect(() => { localStorage.setItem('happycow_paymentMethod', paymentMethod); }, [paymentMethod]);
  useEffect(() => { localStorage.setItem('happycow_searchHistory', JSON.stringify(searchHistory)); }, [searchHistory]);

  useEffect(() => {
    if (view === 'admin' && adminTab === 'dashboard' && storeSettings?.googleSheetUrl) {
      fetchDashboardDataFromGoogleSheets();
    }
  }, [view, adminTab, storeSettings?.googleSheetUrl, fetchDashboardDataFromGoogleSheets]);

  useEffect(() => {
    const recordVisit = async () => {
      const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
      if (isAdmin) return;

      const todayStr = new Date().toLocaleDateString('en-CA'); 
      const isVisited = sessionStorage.getItem('happycow_visited_today');
      if (!isVisited) {
        sessionStorage.setItem('happycow_visited_today', 'true');
        try {
          await setDoc(doc(db, 'settings', 'visit_stats'), {
            [todayStr]: increment(1)
          }, { merge: true });
        } catch (e) { console.error("Visit Stats Log Error:", e); }
      }
    };
    recordVisit();

    let cid = localStorage.getItem('happycow_uid') || 'guest_' + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('happycow_uid', cid);
    setLineProfile(prev => ({ ...prev, userId: cid }));

    const trackCustomerSessionVisit = async (uid, dName) => {
      const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
      if (isAdmin) return;

      let sessionId = sessionStorage.getItem('happycow_visit_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        sessionStorage.setItem('happycow_visit_session_id', sessionId);
      }

      try {
        const sessionRef = doc(db, 'visit_logs', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (!sessionSnap.exists()) {
          const nowMs = Date.now();
          await setDoc(sessionRef, {
            sessionId,
            userId: uid,
            displayName: dName || 'ลูกค้าทั่วไป',
            visitedAt: nowMs,
            visitedAtStr: new Date(nowMs).toLocaleString('th-TH'),
            hasOrdered: false,
            lastOrderId: null
          });
        } else {
          await setDoc(sessionRef, {
            displayName: dName || 'ลูกค้าทั่วไป',
            lastActiveAt: Date.now()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Error logging visit session:", err);
      }
    };

    trackCustomerSessionVisit(cid, 'ลูกค้าทั่วไป');

    const initializeLiff = () => {
      window.liff.init({ liffId: LIFF_ID }).then(() => {
        if (window.liff.isLoggedIn()) {
          window.liff.getProfile().then(p => {
            setLineProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl, userId: p.userId });
            trackCustomerSessionVisit(p.userId, p.displayName);
          });
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
    });

    const unsubToppings = onSnapshot(collection(db, 'toppings'), snapshot => { 
      setToppings(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
    });

    const unsubSauces = onSnapshot(collection(db, 'sauces'), snapshot => { 
      const fetchedSauces = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSauces(fetchedSauces); 
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'store'), docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreSettings({ 
           ...data, 
           isStoreOpen: data.isStoreOpen !== false, 
           theme: data.theme || 'default', 
           customBgImage: data.customBgImage || '', 
           isBlendOut: data.isBlendOut || false, 
           notifyAdmin: data.notifyAdmin || false, 
           adminLineId: data.adminLineId || '',
           shopLineUrl: data.shopLineUrl || '',
           autoCloseEnabled: data.autoCloseEnabled || false,
           maxQueue: data.maxQueue || 3,
           autoCloseDays: data.autoCloseDays || [],
           googleSheetUrl: data.googleSheetUrl || '' 
        });
        setEditPromptPay(data.promptPayNo || '0812345678'); 
        setEditQrCodeImage(data.qrCodeImage || '');
        setEditCustomBgImage(data.customBgImage || '');
        setEditNotifyAdmin(data.notifyAdmin || false);
        setEditAdminLineId(data.adminLineId || '');
        setEditShopLineUrl(data.shopLineUrl || '');
        setEditAutoCloseEnabled(data.autoCloseEnabled || false);
        setEditMaxQueue(data.maxQueue || 3);
        setEditAutoCloseDays(data.autoCloseDays || []);
        setEditGoogleSheetUrl(data.googleSheetUrl || ''); 
      }
    });

    return () => { unsubMenus(); unsubToppings(); unsubSauces(); unsubSettings(); };
  }, []);

  useEffect(() => {
    const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
    if (view !== 'admin' && view !== 'myOrders' && !isAdmin) return;

    setIsLoadingOrders(true);
    const unsubOrders = onSnapshot(collection(db, 'orders'), snapshot => { 
       const fetchedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp);
       setOrders(fetchedOrders); 
       setIsLoadingOrders(false);
    });
    return () => unsubOrders();
  }, [view]);

  useEffect(() => {
    const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
    if (view !== 'admin' && !isAdmin) return;

    const unsubActive = onSnapshot(collection(db, 'active_users'), snapshot => {
      const now = Date.now();
      const threshold = 120000;
      const activeList = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(user => now - user.lastActive < threshold);
      setActiveUsers(activeList);
    });

    const unsubVisitLogs = onSnapshot(collection(db, 'visit_logs'), snapshot => {
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
      setVisitLogs(logs.slice(0, 50));
    });

    const pruneInterval = setInterval(() => {
      setActiveUsers(prev => {
        const now = Date.now();
        return prev.filter(user => now - user.lastActive < 120000);
      });
    }, 30000);

    const unsubSearchStats = onSnapshot(doc(db, 'settings', 'search_stats'), docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8).map(entry => entry[0]);
        setPopularSearches(sorted);
      } else setPopularSearches([]);
    });

    const unsubVisits = onSnapshot(doc(db, 'settings', 'visit_stats'), docSnap => {
      if (docSnap.exists()) {
        setVisitStats(docSnap.data());
      }
    });

    return () => { unsubActive(); unsubVisitLogs(); clearInterval(pruneInterval); unsubSearchStats(); unsubVisits(); };
  }, [view]);

  useEffect(() => {
    if (!lineProfile.userId) return;
    const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
    if (isAdmin) return;

    const docRef = doc(db, 'active_users', lineProfile.userId);
    const sendPing = async () => {
      try { await setDoc(docRef, { displayName: lineProfile.displayName || 'ลูกค้าทั่วไป', lastActive: Date.now() }, { merge: true }); } catch (e) { }
    };

    sendPing();
    const pingInterval = setInterval(sendPing, 60000);

    const handleBeforeUnload = () => { deleteDoc(docRef).catch(() => {}); };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); 
    };
  }, [lineProfile.userId, lineProfile.displayName]);

  useEffect(() => {
    const isAdmin = localStorage.getItem('happycow_isAdmin') === 'true';
    if (storeSettings.isStoreOpen === false && !isAdmin) {
      setShowStoreClosedModal(true);
    } else {
      setShowStoreClosedModal(false);
    }
  }, [storeSettings.isStoreOpen]);

  useEffect(() => {
    if (storeSettings.autoCloseEnabled && storeSettings.isStoreOpen && orders.length > 0) {
      const todayDayIndex = new Date().getDay(); 
      const enabledDays = storeSettings.autoCloseDays || [];
      
      if (enabledDays.includes(todayDayIndex)) {
        const activeQueueCount = orders.filter(o => !o.isDeleted && (o.status === 'pending' || o.status === 'cooking')).length;
        if (activeQueueCount >= storeSettings.maxQueue) {
           updateDoc(doc(db, 'settings', 'store'), { isStoreOpen: false });
           showAlert(`🤖 ระบบปิดร้านชั่วคราวอัตโนมัติทำงาน เนื่องจากขณะนี้มีคิวสั่งซื้อคงค้างสะสม ${activeQueueCount} คิวในระบบ`);
        }
      }
    }
  }, [orders, storeSettings.autoCloseEnabled, storeSettings.maxQueue, storeSettings.isStoreOpen, storeSettings.autoCloseDays]);

  const viewImage = async (orderId, type) => {
    setLoadingSlipId(orderId);
    try {
      const slipSnap = await getDoc(doc(db, 'slips', orderId));
      if (slipSnap.exists()) {
        const data = slipSnap.data();
        const img = type === 'slip' ? data.slipImage : data.deliveryImage;
        if (img) {
          setSelectedSlip(img);
        } else {
          showAlert("ขออภัยค่ะ ไม่พบหลักฐานรูปภาพนี้ในระบบคลาวด์");
        }
      } else {
        showAlert("ไม่พบข้อมูลหลักฐานรูปภาพของบิลนี้");
      }
    } catch (e) {
      showAlert("เกิดข้อผิดพลาดในการโหลดรูปภาพ: " + e.message);
    } finally {
      setLoadingSlipId(null);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setTimeout(() => {
          if (audioRef.current) {
            const secondBell = audioRef.current.cloneNode();
            secondBell.play().catch(e => console.log('Autoplay blocked', e));
          }
        }, 600); 
      }).catch(e => console.log('Autoplay blocked by browser policy', e));
    }
  };

  useEffect(() => {
    if (orders.length > previousOrderCount.current && previousOrderCount.current !== 0) {
      const newOrders = orders.slice(0, orders.length - previousOrderCount.current);
      const hasNewPending = newOrders.some(o => o.status === 'pending' && !o.isDeleted);
      if (hasNewPending && view === 'admin') playNotificationSound();
    }
    previousOrderCount.current = orders.length;
  }, [orders, view]);

  const handleLineLogin = () => { if (window.liff && !window.liff.isLoggedIn()) window.liff.login(); };

  const handleAddNewMenu = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.image) return showAlert('กรุณากรอกข้อมูลให้ครบครับ');
    if (newMenu.category === '🔥 เมนูขายดี') return showAlert('หมวดหมู่ "เมนูขายดี" เป็นระบบอัตโนมัติ กรุณาเลือกหมวดหมู่อื่นครับ');
    try {
      await addDoc(collection(db, 'menus'), { 
        ...newMenu, 
        price: Number(newMenu.price), 
        blendPrice: Number(newMenu.blendPrice), 
        allowTopping: newMenu.allowTopping !== false, 
        allowSauce: newMenu.allowSauce || false,
        isOnlyBlend: newMenu.isOnlyBlend || false, 
        allowBlend: newMenu.isOnlyBlend ? true : (newMenu.allowBlend !== false), 
        isPromoted: newMenu.isPromoted || false, 
        isSoldOut: newMenu.isSoldOut || false, 
        hasTeaType: newMenu.hasTeaType || false, 
        allowedSweetness: newMenu.allowedSweetness || SWEETNESS,
        createdAt: Date.now(), 
        sortOrder: Date.now() 
      });
      showAlert('เพิ่มเมนูสำเร็จ! 🐮'); 
      setNewMenu({ 
        name: '', price: '', category: 'นม', image: '', blendPrice: 5, 
        hasFreePearl: false, allowTopping: true, allowSauce: false, allowBlend: true, 
        isOnlyBlend: false, isPromoted: false, isSoldOut: false, hasTeaType: false,
        allowedSweetness: ['0%', '25%', '50%', '75%', '100%', '120%'] 
      });
      setShowAddMenuForm(false);
    } catch (e) { showAlert(e.message); }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu.name || !editingMenu.price || !editingMenu.image) return showAlert('กรุณากรอกข้อมูลให้ครบครับ');
    try {
      await updateDoc(doc(db, 'menus', editingMenu.id), { 
        ...editingMenu, 
        price: Number(editingMenu.price), 
        blendPrice: Number(editingMenu.blendPrice), 
        allowTopping: editingMenu.allowTopping !== false, 
        allowSauce: editingMenu.allowSauce || false,
        isOnlyBlend: editingMenu.isOnlyBlend || false, 
        allowBlend: editingMenu.isOnlyBlend ? true : (editingMenu.allowBlend !== false), 
        isPromoted: editingMenu.isPromoted || false, 
        isSoldOut: editingMenu.isSoldOut || false, 
        hasTeaType: editingMenu.hasTeaType || false,
        allowedSweetness: editingMenu.allowedSweetness || SWEETNESS
      });
      showAlert('แก้ไขเมนูสำเร็จ! ✨'); 
      setEditingMenu(null);
    } catch (e) { showAlert(e.message); }
  };

  const handleDeleteMenu = (id) => { 
      showConfirm('ลบเมนูนี้ใช่หรือไม่?', async () => {
          await deleteDoc(doc(db, 'menus', id));
      });
  };

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
    if (!newTopping.name || !newTopping.price) return showAlert('กรุณากรอกข้อมูลท็อปปิ้งให้ครบถ้วนครับ');
    try { await addDoc(collection(db, 'toppings'), { name: newTopping.name, price: Number(newTopping.price) }); showAlert('เพิ่มท็อปปิ้งสำเร็จ!'); setNewTopping({ name: '', price: '' }); setShowAddToppingForm(false); } catch (e) { showAlert(e.message); }
  };

  const handleDeleteTopping = (id) => { 
      showConfirm('ลบท็อปปิ้งนี้ใช่หรือไม่?', async () => {
          await deleteDoc(doc(db, 'toppings', id));
      });
  };

  const handleAddSauce = async () => {
    if (!newSauce.name) return showAlert('กรุณากรอกชื่อซอสราดครับ');
    try { 
      await addDoc(collection(db, 'sauces'), { name: newSauce.name.trim(), price: Number(newSauce.price || 0) }); 
      showAlert('เพิ่มซอสราดแต่งหน้าสำเร็จ! ✨'); 
      setNewSauce({ name: '', price: 0 }); 
      setShowAddSauceForm(false); 
    } catch (e) { showAlert(e.message); }
  };

  const handleDeleteSauce = (id) => { 
      showConfirm('ลบซอสราดนี้ใช่หรือไม่?', async () => {
          try {
            await deleteDoc(doc(db, 'sauces', id));
            showAlert('ลบซอสราดเรียบร้อยค่ะ');
          } catch (e) {
            showAlert('เกิดข้อผิดพลาด: ' + e.message);
          }
      });
  };

  const handleSeedDefaultSauces = async () => {
    try {
      setIsLoading(true);
      for (const sauce of DEFAULT_SAUCES) {
        await addDoc(collection(db, 'sauces'), { name: sauce.name, price: sauce.price });
      }
      showAlert('นำเข้าซอสเริ่มต้นเข้าสู่ระบบเรียบร้อยแล้วค่ะ! ✨');
    } catch (e) {
      showAlert('เกิดข้อผิดพลาดในการนำเข้าซอส: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (term) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim().toLowerCase();
    setSearchHistory(prev => [cleanTerm, ...prev.filter(t => t !== cleanTerm)].slice(0, 5));
    setIsSearchFocused(false); setSearchQuery(term);
    try { await setDoc(doc(db, 'settings', 'search_stats'), { [cleanTerm]: increment(1) }, { merge: true }); } catch (e) { console.error("Error saving search stats", e); }
  };

  const handleAcceptOrder = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'cooking' });
      
      sendOrderToGoogleSheets({
        ...order,
        orderId: order.id,
        status: 'cooking'
      });

      showAlert(`รับออร์เดอร์ของ ${order.lineName} แล้ว! 👩‍🍳`);
    } catch (e) { showAlert("เกิดข้อผิดพลาด: " + e.message); }
  };

  const handleConfirmDelivery = async () => {
    if (deliveryLocation !== 'pickup' && !deliveryImage) return showAlert('กรุณาแนบรูปภาพการจัดส่งครับ 📸');
    setIsDelivering(true);
    try {
      let deliveryMessage = '';
      if (deliveryLocation === 'pickup') deliveryMessage = 'ลูกค้ารับสินค้าที่หน้าร้านเรียบร้อยแล้ว ขอบคุณที่อุดหนุนนะคะ 💖';
      else if (deliveryLocation === 'room') deliveryMessage = 'จัดส่งถึงหน้าห้องเรียบร้อยแล้ว ขอบคุณที่สั่งออเดอร์นะคะ 💖';
      else deliveryMessage = 'ขออภัยแอดมินไม่สามารถเข้าตึกได้ รบกวนลูกค้าลงมารับเครื่องดื่มที่หน้าตึกนะคะ 🙏';

      await updateDoc(doc(db, 'orders', deliveryModal.id), { 
         status: 'completed', deliveryLocation, deliveryMessage, hasDeliveryImage: deliveryLocation !== 'pickup' 
      });

      if (deliveryLocation !== 'pickup' && deliveryImage) {
         await setDoc(doc(db, 'slips', deliveryModal.id), {
            deliveryImage: deliveryImage
         }, { merge: true });
      }

      sendOrderToGoogleSheets({
        ...deliveryModal,
        orderId: deliveryModal.id,
        status: 'completed',
        deliveryLocation: deliveryLocation
      });

      const locationText = deliveryLocation === 'room' ? 'หน้าห้อง' : (deliveryLocation === 'building' ? 'หน้าตึก' : 'รับเองที่หน้าร้าน');
      const deliverySummaryText = `🛵 อัปเดตสถานะจัดส่ง!\nบิล #${deliveryModal.id.slice(0,6)}\nลูกค้า: คุณ ${deliveryModal.lineName}\n\n${deliveryMessage}\n📍 จุดส่ง: ${locationText}\n\n📄 เช็คสถานะ: https://liff.line.me/${LIFF_ID}?action=viewOrders&orderId=${deliveryModal.id}`;

      setDeliveryModal(null); 
      setAdminDeliverySuccessData({ text: deliverySummaryText, orderId: deliveryModal.id });
      
    } catch (e) { showAlert("เกิดข้อผิดพลาด: " + e.message); }
    setIsDelivering(false);
  };

  const getRecentVisits = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); 
      const thaiDateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      const count = visitStats[dateStr] || 0;
      list.push({ dateStr, thaiDateStr, count });
    }
    return list;
  };

  const recentVisits = getRecentVisits();
  const maxVisitCount = Math.max(...recentVisits.map(v => v.count), 1);

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

    orders.filter(o => o.status === 'completed' && !o.isDeleted).forEach(o => {
      if (o.timestamp >= startOfDay) daily += o.total;
      if (o.timestamp >= startOfMonth) monthly += o.total;
      if (o.timestamp >= startOfYear) yearly += o.total;
      const oDate = new Date(o.timestamp).toLocaleDateString('th-TH');
      if(last7DaysMap[oDate] !== undefined) last7DaysMap[oDate] += o.total;
    });
    
    const dailyHistory = Object.keys(last7DaysMap).map(date => ({ date, total: last7DaysMap[date] }));
    return { daily, monthly, yearly, dailyHistory };
  };

  const getStorageEstimation = () => {
     const orderImagesCount = orders.filter(o => o.hasSlip || o.hasDeliveryImage).length;
     const menuImagesCount = menuItems.filter(m => m.image && m.image.length > 100).length;
     
     const estStorageUsageKB = (orderImagesCount * 100) + (menuImagesCount * 80);
     const maxStorageKB = 5 * 1024 * 1024; 
     const storagePercent = Math.min((estStorageUsageKB / maxStorageKB) * 100, 100);
     const usageMB = (estStorageUsageKB / 1024).toFixed(2);
     
     return { usageMB, storagePercent };
  };

  const exportToCSV = () => {
    const completedOrders = orders.filter(o => o.status === 'completed' && !o.isDeleted);
    if (completedOrders.length === 0) return showAlert('ยังไม่มีข้อมูลคำสั่งซื้อที่เสร็จสมบูรณ์ครับ');
    let csv = "\uFEFFวันที่และเวลา,ชื่อลูกค้า,ยอดรวม(บาท),ช่องทางชำระเงิน,จุดจัดส่ง,ที่อยู่\n"; 
    completedOrders.forEach(o => {
      const date = new Date(o.timestamp).toLocaleString('th-TH');
      const payment = o.paymentMethod === 'cash' ? 'เงินสด' : (o.paymentMethod === 'thaichueithai' ? 'ไทยช่วยไทยพลัส' : 'โอนเงิน');
      const location = o.deliveryLocation === 'room' ? 'หน้าห้อง' : (o.deliveryLocation === 'building' ? 'หน้าตึก' : (o.deliveryLocation === 'pickup' ? 'รับเองที่ร้าน' : '-'));
      csv += `"${date}","${(o.lineName||'').replace(/"/g, '""')}",${o.total},${payment},${location},"${(o.address||'').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `สรุปรายรับ_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportMenuToCSV = () => {
    if (menuItems.length === 0) return showAlert('ยังไม่มีเมนูในระบบครับ');
    let csv = "\uFEFFหมวดหมู่,ชื่อเมนู,ราคาปกติ (เย็น),ราคาปั่น,สถานะ\n";
    const sortedMenus = [...menuItems].sort((a, b) => a.category.localeCompare(b.category));
    sortedMenus.forEach(m => {
      const coldPrice = m.isOnlyBlend ? '-' : m.price;
      const blendPrice = (m.allowBlend === false && !m.isOnlyBlend) ? '-' : (m.price + getAddedBlendPrice(m));
      const status = m.isSoldOut ? 'หมดชั่วคราว' : 'พร้อมขาย';
      csv += `"${m.category}","${(m.name||'').replace(/"/g, '""')}",${coldPrice},${blendPrice},${status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `รายการเมนู_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const updateStoreStatus = async (status) => { try { await setDoc(doc(db, 'settings', 'store'), { isStoreOpen: status }, { merge: true }); showAlert(`เปลี่ยนสถานะเรียบร้อย! 🐮`); } catch(e) { showAlert("Error: " + e.message); } };
  const updateTheme = async (newTheme) => { try { await setDoc(doc(db, 'settings', 'store'), { theme: newTheme }, { merge: true }); showAlert(`เปลี่ยนธีมร้านเป็น ${THEMES[newTheme].name} เรียบร้อย! 🎨`); } catch(e) { showAlert("Error: " + e.message); } };

  const openOptionModal = (item) => {
    if (item.isSoldOut || (item.isOnlyBlend && storeSettings.isBlendOut)) return;
    setOptionModalItem(item);

    const allowed = (item.allowedSweetness && item.allowedSweetness.length > 0) ? item.allowedSweetness : SWEETNESS;
    const defaultSweetness = allowed.includes('100%') ? '100%' : (allowed[0] || '100%');

    setTempOptions({ 
      sweetness: defaultSweetness, isBlended: item.isOnlyBlend ? true : false, addPearl: item.hasFreePearl || false, 
      selectedToppings: [], selectedSauces: [], bean: item.category === 'กาแฟ' ? 'คั่วเข้ม' : null, teaType: item.hasTeaType ? 'มัทฉะ' : null, addShot: false,
      separateIce: false
    });
    if(searchQuery) handleSearchSubmit(searchQuery);
  };

  const getBlendText = (item) => {
    if (isWhipOrCreamCheeseItem(item)) return ''; 
    if (item.isOnlyBlend) return 'ปั่น';
    if (item.allowBlend === false) return 'เย็น/ปกติ';
    return item.isBlended ? 'ปั่น' : 'เย็น';
  };

  const copyPromptPay = () => { navigator.clipboard.writeText(storeSettings.promptPayNo || '0812345678').then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }); };

  const handleDownloadImage = (url, name) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      setDownloadPreview(url);
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const bestSellers = React.useMemo(() => {
    const defaultSlice = menuItems.slice(0, 4);
    if ((!orders || orders.length === 0) && (!sheetOrdersData || sheetOrdersData.length === 0)) return defaultSlice;
    if (menuItems.length === 0) return defaultSlice;

    const salesCount = {};
    const processedOrderIds = new Set();

    // Helper function to extract item quantities from various formats (Array, JSON String, formatted Text)
    const countItemSales = (itemsList) => {
      if (!itemsList) return;
      
      // 1. Standard Array format
      if (Array.isArray(itemsList)) {
        itemsList.forEach(item => {
          if (item && item.name) {
            const qty = Number(item.qty) || 1;
            salesCount[item.name] = (salesCount[item.name] || 0) + qty;
          }
        });
        return;
      }

      // 2. String format (JSON or Multiline Text)
      if (typeof itemsList === 'string') {
        let parsedJson = null;
        try {
          if (itemsList.trim().startsWith('[') || itemsList.trim().startsWith('{')) {
            parsedJson = JSON.parse(itemsList);
          }
        } catch (e) {}

        if (Array.isArray(parsedJson)) {
          parsedJson.forEach(item => {
            if (item && item.name) {
              const qty = Number(item.qty) || 1;
              salesCount[item.name] = (salesCount[item.name] || 0) + qty;
            }
          });
          return;
        }

        // Parse multiline string format e.g. "1x ชาไทย(ใบชาไต้) (เย็น...)\n2x นมสด"
        const lines = itemsList.split('\n');
        lines.forEach(line => {
          if (!line.trim()) return;
          const match = line.match(/^(\d+)x\s*(.+)/);
          const qty = match ? parseInt(match[1], 10) : 1;
          const itemDetail = match ? match[2] : line;

          menuItems.forEach(menu => {
            if (itemDetail.includes(menu.name)) {
              salesCount[menu.name] = (salesCount[menu.name] || 0) + qty;
            }
          });
        });
      }
    };

    // Step A: Accumulate sales from Google Sheets permanent historical data
    if (Array.isArray(sheetOrdersData) && sheetOrdersData.length > 0) {
      sheetOrdersData.forEach(sheetOrder => {
        if (!sheetOrder) return;
        const st = String(sheetOrder.status || '').toLowerCase();
        if (st.includes('cancel') || st.includes('ยกเลิก') || st.includes('deleted')) return;
        
        const id = sheetOrder.orderId || sheetOrder.billId || sheetOrder.id;
        if (id) processedOrderIds.add(id);
        
        countItemSales(sheetOrder.items);
      });
    }

    // Step B: Accumulate sales from active Firestore orders (Real-time today) that are not yet in Google Sheets
    orders.filter(o => !o.isDeleted && o.status !== 'cancelled' && !processedOrderIds.has(o.id)).forEach(order => {
      countItemSales(order.items);
    });

    // Map sales count back to menu items and sort descending
    let sortedMenus = menuItems.map(menu => ({ ...menu, sales: salesCount[menu.name] || 0 }));
    sortedMenus = sortedMenus.filter(m => m.sales > 0).sort((a, b) => b.sales - a.sales);
    
    return sortedMenus.length === 0 ? defaultSlice : sortedMenus.slice(0, 9);
  }, [orders, sheetOrdersData, menuItems]);

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

  const filteredOrders = React.useMemo(() => {
    const activeOrders = orders.filter(o => !o.isDeleted);
    if (!adminSearchQuery) return activeOrders;
    const q = adminSearchQuery.trim().toLowerCase();
    return activeOrders.filter(o => 
      o.id.toLowerCase().includes(q) || 
      (o.lineName || '').toLowerCase().includes(q) || 
      (o.address || '').toLowerCase().includes(q) ||
      (o.paymentMethod || '').toLowerCase().includes(q)
    );
  }, [orders, adminSearchQuery]);

  const pendingCount = orders.filter(o => !o.isDeleted && o.status === 'pending').length;
  const cookingCount = orders.filter(o => !o.isDeleted && o.status === 'cooking').length;
  const completedCount = orders.filter(o => !o.isDeleted && o.status === 'completed').length;

  const completedOrdersList = React.useMemo(() => orders.filter(o => o.status === 'completed' && !o.isDeleted), [orders]);
  const promptPayTotal = React.useMemo(() => completedOrdersList.filter(o => o.paymentMethod === 'promptpay').reduce((sum, o) => sum + o.total, 0), [completedOrdersList]);
  const cashTotal = React.useMemo(() => completedOrdersList.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0), [completedOrdersList]);
  const thaiChueiThaiTotal = React.useMemo(() => completedOrdersList.filter(o => o.paymentMethod === 'thaichueithai').reduce((sum, o) => sum + o.total, 0), [completedOrdersList]);
  const grandTotal = calculateRevenue().yearly || 1;

  const analyticsData = React.useMemo(() => {
    const sourceData = orders.length > 0 ? orders.map(o => ({
      datetime: new Date(o.timestamp).toLocaleString('th-TH'),
      billId: o.id,
      customer: o.lineName || "ลูกค้าทั่วไป",
      items: (o.items || []).map(i => `${i.qty}x ${i.name}`).join('\n'),
      total: o.total,
      payment: o.paymentMethod === 'cash' ? 'เงินสด' : (o.paymentMethod === 'thaichueithai' ? 'ไทยช่วยไทยพลัส' : 'โอนพร้อมเพย์'),
      status: o.status === 'completed' ? 'จัดส่งสำเร็จ 🟢' : (o.isDeleted ? 'ยกเลิก 🔴' : 'กำลังดำเนินการ 🟡'),
      deliveryPoint: o.deliveryLocation === 'room' ? 'ส่งหน้าห้อง' : (o.deliveryLocation === 'building' ? 'ส่งหน้าตึก' : 'รับเองที่ร้าน'),
      address: o.address || '-',
      remark: o.note || '-'
    })) : fallbackData;

    let filtered = sourceData;

    if (analyticsSelectedDate) {
      filtered = filtered.filter(item => formatDateForComparison(item.datetime) === analyticsSelectedDate);
    }

    if (analyticsSearchTerm) {
      const lower = analyticsSearchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.customer?.toLowerCase() || '').includes(lower) ||
        (item.billId?.toLowerCase() || '').includes(lower) ||
        (item.address?.toLowerCase() || '').includes(lower)
      );
    }

    if (analyticsHideCanceled) {
      filtered = filtered.filter(item => {
        const st = item.status || '';
        return !st.includes('ยกเลิก') && !st.toLowerCase().includes('cancel');
      });
    }

    const totalSales = filtered.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const totalOrders = filtered.length;
    const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;
    
    let totalItems = 0;
    filtered.forEach(order => {
        if(order.items) {
           const lines = order.items.split('\n');
           lines.forEach(line => {
               const match = line.match(/^(\d+)x/);
               if (match && match[1]) totalItems += parseInt(match[1], 10);
               else totalItems += 1;
           });
        }
    });

    const paymentMap = {};
    filtered.forEach(item => {
      const pm = item.payment || 'Unknown';
      paymentMap[pm] = (paymentMap[pm] || 0) + 1;
    });
    const paymentData = Object.keys(paymentMap).map(key => ({ name: key, value: paymentMap[key] }));

    const hourlyMap = {};
    filtered.forEach(item => {
      if (item.datetime) {
        let hourStr = null;
        if (item.datetime.includes(' ')) {
          const timePart = item.datetime.split(' ')[1];
          if (timePart && timePart.includes(':')) hourStr = timePart.split(':')[0].padStart(2, '0') + ":00";
        } else if (item.datetime.includes('T')) {
          const timePart = item.datetime.split('T')[1];
          if (timePart && timePart.includes(':')) hourStr = timePart.split(':')[0].padStart(2, '0') + ":00";
        }
        if (hourStr) hourlyMap[hourStr] = (hourlyMap[hourStr] || 0) + (parseFloat(item.total) || 0);
      }
    });
    const hourlyData = Object.keys(hourlyMap).sort().map(key => ({ time: key, sales: hourlyMap[key] }));

    return { filtered, totalSales, totalOrders, avgOrderValue, totalItems, paymentData, hourlyData };
  }, [orders, analyticsSearchTerm, analyticsSelectedDate, analyticsHideCanceled]);

  const peakHoursData = React.useMemo(() => {
    const hoursMap = { '08:00-11:00': 0, '11:00-14:00': 0, '14:00-17:00': 0, '17:00-20:00': 0, '20:00+': 0 };
    completedOrdersList.forEach(o => {
      const h = new Date(o.timestamp).getHours();
      if (h >= 8 && h < 11) hoursMap['08:00-11:00'] += 1;
      else if (h >= 11 && h < 14) hoursMap['11:00-14:00'] += 1;
      else if (h >= 14 && h < 17) hoursMap['14:00-17:00'] += 1;
      else if (h >= 17 && h < 20) hoursMap['17:00-20:00'] += 1;
      else hoursMap['20:00+'] += 1;
    });
    return hoursMap;
  }, [completedOrdersList]);
  const maxPeakCount = Math.max(...Object.values(peakHoursData), 1);

  const topProducts = React.useMemo(() => {
    const map = {};
    completedOrdersList.forEach(o => {
      (o.items || []).forEach(item => {
        if (!map[item.name]) map[item.name] = { qty: 0, revenue: 0 };
        map[item.name].qty += item.qty;
        map[item.name].revenue += (item.price * item.qty);
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [completedOrdersList]);
  const maxTopQty = topProducts[0]?.qty || 1;

  const sheetStats = useMemo(() => {
    const rawOrders = Array.isArray(sheetOrdersData) ? sheetOrdersData : [];
    
    const validSheetOrders = rawOrders.filter(o => {
      if (!o) return false;
      const st = String(o.status || '').toLowerCase().trim();
      return !st.includes('cancel') && !st.includes('ยกเลิก') && !st.includes('deleted');
    });

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let todayRevenue = 0;
    let totalRevenue = 0;
    let promptPaySum = 0;
    let cashSum = 0;
    let thaiSum = 0;
    let completedCount = 0;

    validSheetOrders.forEach(o => {
      const amount = Number(o?.total) || 0;
      const paymentMethod = String(o?.paymentMethod || o?.payment || '').toLowerCase();
      const st = String(o?.status || '').toLowerCase();

      if (st.includes('completed') || st.includes('จัดส่งสำเร็จ') || st.includes('สำเร็จ') || st.includes('paid') || st.includes('เสร็จสิ้น')) {
        completedCount++;
      }

      const parsed = parseCustomDate(o?.timestamp, o?.timestampStr, o?.datetime || o?.date);
      if (parsed && parsed.day === currentDay && parsed.month === currentMonth && parsed.year === currentYear) {
        todayRevenue += amount;
      }

      totalRevenue += amount;

      if (paymentMethod.includes("พร้อมเพย์") || paymentMethod.includes("promptpay") || paymentMethod.includes("โอน")) {
        promptPaySum += amount;
      } else if (paymentMethod.includes("เงินสด") || paymentMethod.includes("cash")) {
        cashSum += amount;
      } else if (paymentMethod.includes("ไทยช่วยไทย") || paymentMethod.includes("thaichueithai") || paymentMethod.includes("ไทย")) {
        thaiSum += amount;
      }
    });

    return {
      todayRevenue,
      totalOrdersCount: validSheetOrders.length,
      completedCount,
      totalRevenue,
      promptPaySum,
      cashSum,
      thaiSum,
      grandTotal: totalRevenue || 1
    };
  }, [sheetOrdersData]);

  const filteredSheetOrders = useMemo(() => {
    return (Array.isArray(sheetOrdersData) ? sheetOrdersData : []).filter(o => {
      if (!o) return false;
      
      const parsed = parseCustomDate(o.timestamp, o.timestampStr, o.datetime || o.date);
      if (!parsed) return true;

      const dStr = parsed.day.toString();
      const mStr = parsed.month.toString();
      const yStr = parsed.year.toString();

      if (sheetFilterDay !== 'all' && dStr !== sheetFilterDay) return false;
      if (sheetFilterMonth !== 'all' && mStr !== sheetFilterMonth) return false;
      if (sheetFilterYear !== 'all' && yStr !== sheetFilterYear) return false;

      return true;
    });
  }, [sheetOrdersData, sheetFilterDay, sheetFilterMonth, sheetFilterYear]);

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear().toString()]);
    (Array.isArray(sheetOrdersData) ? sheetOrdersData : []).forEach(o => {
      const parsed = parseCustomDate(o.timestamp, o.timestampStr, o.datetime || o.date);
      if (parsed && parsed.year) {
        years.add(parsed.year.toString());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [sheetOrdersData]);

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
  const storageData = getStorageEstimation();
  const currentThemeData = THEMES[storeSettings.theme] || THEMES.default;
  const cartTotal = cart.reduce((s,i)=>s+(i.price*i.qty),0);

  const mainContainerStyle = {
    backgroundColor: currentThemeData.bg,
    backgroundImage: storeSettings.theme === 'custom' && storeSettings.customBgImage ? `url(${storeSettings.customBgImage})` : 'none',
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500 shadow-2xl bg-amber-50/20" style={mainContainerStyle}>
      <audio id="orderNotification" ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2854/2854-preview.mp3" preload="auto"></audio>
      
      {/* [MODIFIED] Enhanced High-End Global CSS & Animation Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Kanit:wght@300;400;500;600;700&display=swap');
        
        :root {
          --theme-primary: ${currentThemeData.primary};
          --theme-accent: ${currentThemeData.accent};
          --theme-bg: ${currentThemeData.bg};
        }

        body {
          font-family: 'Kanit', 'Plus Jakarta Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }

        .font-serif { font-family: 'Plus Jakarta Sans', 'Kanit', sans-serif; }
        .font-kanit { font-family: 'Kanit', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .bg-primary { background-color: var(--theme-primary); color: #fff; }
        .text-primary { color: var(--theme-primary); }
        .bg-accent { background-color: var(--theme-accent); color: #fff; }
        .text-accent { color: var(--theme-accent); }
        .border-accent { border-color: var(--theme-accent); }
        .border-primary { border-color: var(--theme-primary); }

        .glass-card {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }

        .glass-card-dark {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glow-border {
          box-shadow: 0 0 20px -5px rgba(184, 134, 11, 0.35);
          border: 1px solid rgba(184, 134, 11, 0.3);
        }
        
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { position: relative; overflow: hidden; }
        .animate-shimmer::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent); animation: shimmer 2.5s infinite; }
        
        @keyframes pulseGlow { from { box-shadow: 0 0 8px rgba(184, 134, 11, 0.2); } to { box-shadow: 0 0 20px rgba(184, 134, 11, 0.5); } }
        .glow-effect { animation: pulseGlow 2s infinite alternate; }
        
        @keyframes borderGlowPulse { 
          0% { box-shadow: 0 0 0 0px rgba(245, 158, 11, 0.7); border-color: #f59e0b; }
          50% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); border-color: #f59e0b; }
          100% { box-shadow: 0 0 0 0px rgba(245, 158, 11, 0); border-color: #f59e0b; }
        }
        .order-highlight { animation: borderGlowPulse 2.5s infinite ease-in-out; border-width: 3px !important; }

        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0px); } }
        .floating-badge { animation: float 3.5s ease-in-out infinite; }
        
        .special-bg { background: linear-gradient(135deg, rgba(255,251,245,0.92) 0%, rgba(255,243,230,0.95) 100%); }
        
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

      {/* [MODIFIED] High-End Header UI with Translucent Glassmorphism */}
      <header className="sticky top-0 z-[50] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/40 shadow-sm p-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('shop'); setActiveCategory('🔥 เมนูขายดี'); }}>
           <div className="relative">
             {lineProfile.pictureUrl ? (
               <img src={lineProfile.pictureUrl} className="w-11 h-11 rounded-2xl border-2 border-amber-400/60 shadow-md object-cover transition-transform group-hover:scale-105" alt="profile" />
             ) : (
               <div className="w-11 h-11 bg-gradient-to-tr from-amber-800 to-amber-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md border border-amber-500/30">🐮</div>
             )}
             <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${storeSettings.isStoreOpen !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
           </div>

           <div>
             <h1 className="font-serif font-extrabold text-lg tracking-tight text-slate-900 leading-tight group-hover:text-amber-800 transition-colors">วัวนมอารมณ์ดี</h1>
             <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[10px] font-bold text-slate-600 tracking-tight flex items-center gap-1">
                 <ShieldCheck size={12} className="text-emerald-500" />
                 คุณ {(lineProfile.displayName || 'ลูกค้าทั่วไป').slice(0, 11)}
               </span>
               <span className="text-slate-300">•</span>
               <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shadow-xs ${storeSettings.isStoreOpen !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                 {storeSettings.isStoreOpen !== false ? 'เปิดร้าน' : 'ปิดร้าน'}
               </span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => {
            if (localStorage.getItem('happycow_isAdmin') === 'true') {
              setView('admin');
              setAdminTab('orders'); 
            } else {
              setShowAdminModal(true);
            }
          }} className="p-2.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50/80 rounded-xl transition-all active:scale-90"><Settings size={19}/></button>
          
          <button onClick={() => setView('myOrders')} className="p-2.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50/80 rounded-xl transition-all active:scale-90 relative">
            <ClipboardList size={19}/>
          </button>

          <button onClick={() => setView('cart')} className="relative p-2.5 bg-gradient-to-tr from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ml-1">
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">{cart.length}</span>}
            <ShoppingCart size={19}/>
          </button>
        </div>
      </header>

      {isSearchFocused && view === 'shop' && <div className="fixed inset-0 z-[40] bg-black/20 backdrop-blur-xs transition-opacity" onClick={() => setIsSearchFocused(false)}></div>}

      <main className="flex-1 pb-12 relative z-10">
        {/* --- Shop View --- */}
        {view === 'shop' && (
          <div className="animate-in fade-in duration-300">
            
            {/* [MODIFIED] Modern Search Input Bar */}
            <div className="px-5 pt-4 pb-2 sticky top-[73px] z-[45]" style={{ backgroundColor: `${currentThemeData.bg}f0` }}>
              <div className="relative z-[50]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                   type="text" 
                   value={searchQuery} 
                   onChange={e => setSearchQuery(e.target.value)}
                   onFocus={() => setIsSearchFocused(true)}
                   placeholder="ค้นหาเมนูเครื่องดื่มที่คุณชอบ..." 
                   className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-xs font-semibold outline-none shadow-sm focus:shadow-md focus:ring-2 focus:ring-amber-500/50 border border-slate-200/80 bg-white/95 backdrop-blur-md transition-all text-slate-800 placeholder:text-slate-400" 
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setIsSearchFocused(false); setView('shop'); setActiveCategory('🔥 เมนูขายดี'); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 active:scale-90 bg-slate-100 hover:bg-slate-200 rounded-full p-1"><X size={14}/></button>
                )}
              </div>

              {isSearchFocused && !searchQuery && (searchHistory.length > 0 || popularSearches.length > 0) && (
                <div className="absolute top-[110%] left-5 right-5 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 p-5 z-[50] animate-in fade-in slide-in-from-top-2">
                   {searchHistory.length > 0 && (
                      <div className="mb-4">
                         <div className="flex justify-between items-center mb-2.5">
                            <h4 className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wider"><Clock size={13}/> ประวัติการค้นหา</h4>
                            <button onClick={() => { setSearchHistory([]); setSearchQuery(''); setIsSearchFocused(false); setView('shop'); setActiveCategory('🔥 เมนูขายดี'); }} className="text-[10px] text-rose-500 font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors">ล้าง</button>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                            {searchHistory.map(h => (
                               <button key={h} onClick={() => handleSearchSubmit(h)} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200/70 transition-all">{h}</button>
                            ))}
                         </div>
                      </div>
                   )}
                   {popularSearches.length > 0 && (
                      <div>
                         <h4 className="text-[10px] font-extrabold text-amber-600 flex items-center gap-1 mb-2.5 uppercase tracking-wider"><TrendingUp size={13}/> คำค้นหายอดฮิต 🔥</h4>
                         <div className="flex flex-wrap gap-1.5">
                            {popularSearches.map(p => (
                               <button key={p} onClick={() => handleSearchSubmit(p)} className="bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200/60 transition-all shadow-2xs">{p}</button>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              )}
            </div>

            {/* Promoted Items Slider */}
            {!searchQuery && promotedItems.length > 0 && (
              <div className="pt-2 pb-2">
                <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth w-full px-5 gap-3.5">
                  {promotedItems.map(item => (
                    <div key={`promo-${item.id}`} className="w-[88%] flex-shrink-0 snap-center">
                      <div onClick={() => openOptionModal(item)} className={`bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 text-white rounded-3xl p-4 shadow-xl flex items-center gap-4 border border-amber-500/30 transition-all h-full relative overflow-hidden animate-shimmer ${item.isSoldOut ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-98'}`}>
                         <div className="relative">
                            <img src={item.image} className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl shadow-lg border border-amber-400/20 flex-shrink-0" alt={item.name} />
                            <div className="absolute -bottom-2 -right-2 text-2xl floating-badge drop-shadow-md">🔥</div>
                            {item.isSoldOut && (
                               <div className="absolute top-1 -left-1 bg-slate-900/90 text-white px-2.5 py-0.5 rounded-md font-bold text-[9px] shadow-lg border border-slate-700 rotate-[-5deg] z-10">หมด</div>
                            )}
                         </div>
                         <div className="flex-1 flex flex-col justify-center py-1 pr-1">
                            <span className="text-[9px] bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full w-fit mb-2 font-black flex items-center gap-1 shadow-sm uppercase tracking-wider">
                               <Star size={10} fill="currentColor"/> Must Try
                            </span>
                            <h4 className="font-extrabold text-sm leading-snug line-clamp-2 text-white">{item.name}</h4>
                            <p className="text-amber-300 font-black text-lg mt-1">฿{item.price}</p>
                            <p className="text-[9px] text-amber-200/80 font-medium mt-1">สูตรเข้มข้นเฉพาะร้าน 🐮✨</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store Conditions Alert */}
            {!searchQuery && (
              <div className="mx-5 mb-2 mt-3 p-4 glass-card rounded-2xl shadow-sm animate-in fade-in relative overflow-hidden border-l-4 border-l-amber-600">
                <h4 className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5"><AlertCircle size={15} className="text-amber-600"/> เงื่อนไขการจัดส่ง (รบกวนอ่านก่อนสั่งซื้อค่ะ)</h4>
                <ul className="text-[10.5px] text-slate-600 space-y-1 pl-4 list-disc font-medium leading-relaxed">
                  <li>จัดส่งถึงหน้าห้อง <span className="font-bold text-amber-800">กรณีเข้าตึกได้</span> เท่านั้น</li>
                  <li>หากเข้าตึกไม่ได้ / ฝนตก / ลิฟต์เสีย ขออนุญาต <span className="font-bold text-amber-800">แขวนไว้ใต้ตึก</span></li>
                  <li>ระยะเวลารอประมาณ <span className="font-bold">20 นาที (+/-)</span> ตามลำดับคิว 🙏</li>
                </ul>
              </div>
            )}

            {!searchQuery && storeSettings.isBlendOut && (
              <div className="mx-5 mb-2 mt-2 p-3 bg-blue-50/90 border border-blue-200 rounded-2xl shadow-2xs animate-in fade-in text-center flex items-center justify-center gap-2">
                 <Zap size={16} className="text-blue-500"/>
                 <p className="text-xs font-bold text-blue-900">ขออภัยค่ะ วันนี้งดรับออร์เดอร์ <span className="text-rose-600">เมนูปั่น</span> ชั่วคราวนะคะ 🙏</p>
              </div>
            )}

            {/* [MODIFIED] Category Navigation Tabs */}
            {!searchQuery && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 py-3 sticky top-[138px] z-[40] backdrop-blur-xl border-b border-slate-200/50" style={{ backgroundColor: `${currentThemeData.bg}e6` }}>
                {CATEGORIES.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setActiveCategory(c)} 
                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-extrabold whitespace-nowrap transition-all border ${
                      activeCategory === c && c === '🔥 เมนูขายดี' 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 shadow-md' 
                        : activeCategory === c 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-white/90 text-slate-600 border-slate-200/70 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* [MODIFIED] Enhanced Product Menu Cards Grid */}
            <div className="px-5 pb-6 pt-3">
              {searchQuery && <p className="text-xs font-extrabold text-slate-700 mb-4 ml-1">ผลการค้นหา "{searchQuery}" ({displayedItems.length} รายการ)</p>}
              
              {isLoading ? (
                <div className="py-24 text-center opacity-40 italic font-bold text-amber-900 animate-pulse">
                  กำลังโหลดรายการเครื่องดื่ม... 🐮
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {displayedItems.map((item, index) => {
                    const isSpecial = item.category === 'วิปครีมและครีมชีส' || item.category === 'ครีมและครีมชีส' || item.category === 'เมนูพิเศษ';
                    const isBestSeller = !searchQuery && activeCategory === '🔥 เมนูขายดี';
                    const isBlendUnavailable = item.isOnlyBlend && storeSettings.isBlendOut;
                    const isDisabled = item.isSoldOut || isBlendUnavailable;

                    return (
                    <div 
                      key={item.id} 
                      onClick={() => openOptionModal(item)} 
                      className={`rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 relative border flex flex-col justify-between ${
                        isSpecial 
                          ? 'special-bg border-amber-200/70 glow-effect' 
                          : 'bg-white/95 border-slate-200/80'
                      } ${
                        isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:-translate-y-1 active:scale-97'
                      }`}
                    >
                      {item.isSoldOut && (
                         <div className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white px-2.5 py-1 rounded-xl font-bold text-[10px] shadow-lg border border-slate-700 rotate-[-5deg] z-20 tracking-wider">หมดชั่วคราว</div>
                      )}
                      
                      {!item.isSoldOut && isBlendUnavailable && (
                         <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-20 flex items-center justify-center p-2">
                            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-2xl font-bold text-[10px] border border-blue-300 shadow-xl rotate-[-8deg] text-center leading-tight">เมนูปั่น<br/>พักชั่วคราว</div>
                         </div>
                      )}

                      {item.hasFreePearl && !isDisabled && (
                        <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black shadow-md z-10 flex items-center gap-0.5 floating-badge">
                          <Star size={8} fill="white"/> ฟรีมุก
                        </div>
                      )}
                      
                      {isBestSeller && !item.isSoldOut && (
                        <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg z-10 shadow-md flex items-center gap-1 border border-white/20">
                          Top {index + 1} 👑
                        </div>
                      )}
                      
                      {isSpecial && !isBestSeller && !item.isSoldOut && (
                        <div className="absolute top-2.5 left-2.5 bg-amber-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg z-10 shadow-md">
                          🌟 Premium
                        </div>
                      )}

                      <div className="aspect-square bg-slate-50 relative overflow-hidden">
                         <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt={item.name} />
                      </div>

                      <div className="p-3.5 text-left flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1 leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{item.category}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <p className="text-amber-800 font-black text-sm">฿{item.price}</p>
                          <span className="w-7 h-7 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center active:scale-90 transition-transform">
                            <Plus size={15} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}
                  
                  {displayedItems.length === 0 && (
                    <div className="col-span-2 py-20 text-center flex flex-col items-center gap-3 bg-white/60 rounded-3xl backdrop-blur-md border border-slate-200/50">
                      <AlertCircle size={36} className="text-slate-300" />
                      <p className="text-slate-500 text-xs font-bold">
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
          <div className="p-6 space-y-6 bg-white rounded-t-[3rem] mt-4 min-h-[85vh] shadow-2xl relative z-20 animate-in slide-in-from-bottom-6 duration-300">
            <button onClick={() => { setView('shop'); setActiveCategory('🔥 เมนูขายดี'); }} className="flex items-center gap-2 font-bold text-slate-400 text-xs hover:text-slate-800 transition-colors"><ChevronLeft size={18}/> เลือกเครื่องดื่มเพิ่ม</button>
            
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <h2 className="text-2xl font-serif font-black text-slate-900">ตะกร้าของคุณ</h2>
              <span className="text-xs font-bold text-slate-400">{cart.length} รายการ</span>
            </div>

            <div className="space-y-3">
               {cart.map(i => (
                 <div key={i.cartId} className="flex justify-between items-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 shadow-2xs">
                   <div className="flex-1 font-bold text-xs text-slate-800 pr-2">
                     {i.qty}x {i.name} <br/>
                     <span className="text-slate-400 text-[10px] font-medium uppercase leading-relaxed block mt-0.5">
                       ({getBlendText(i)}{isWhipOrCreamCheeseItem(i) ? '' : ` • หวาน ${i.sweetness}`}{i.bean ? ` • ${i.bean}` : ''}{i.teaType ? ` • ${i.teaType}` : ''}{i.addShot ? ' • เพิ่มช็อต' : ''}{i.separateIce ? ' • แยกน้ำแข็ง (+฿5)' : ''}{i.hasFreePearl ? (i.addPearl ? ' • มุกฟรี' : ' • ไม่รับมุกฟรี') : ''})
                       {i.selectedSauces?.length > 0 && ` • ราดซอส: ${i.selectedSauces.map(s => typeof s === 'object' ? s.name : s).join(', ')}`}
                       {i.selectedToppings?.length > 0 && ` • เพิ่ม: ${i.selectedToppings.map(t=>t.name).join(', ')}`}
                     </span>
                   </div>
                   <div className="flex items-center gap-3">
                     <p className="font-black text-amber-800 text-sm">฿{i.price * i.qty}</p>
                     <button onClick={() => setCart(prev => prev.filter(item => item.cartId !== i.cartId))} className="text-rose-300 hover:text-rose-600 transition-colors p-1"><Trash2 size={16}/></button>
                   </div>
                 </div>
               ))}
               {cart.length === 0 && <div className="py-20 text-center opacity-40 italic font-bold text-slate-400 text-xs">ยังไม่มีสินค้าในตะกร้า 🐮</div>}
            </div>

            {cart.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-slate-100">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">เลือกช่องทางชำระเงิน</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setPaymentMethod('promptpay')} className={`py-3.5 px-1 rounded-2xl border-2 font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === 'promptpay' ? 'border-amber-600 bg-amber-50/60 text-amber-900 shadow-2xs' : 'border-slate-100 text-slate-400 bg-white'}`}><CreditCard size={18}/><span className="text-[9px] text-center font-bold">โอนพร้อมเพย์</span></button>
                    <button onClick={() => setPaymentMethod('cash')} className={`py-3.5 px-1 rounded-2xl border-2 font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === 'cash' ? 'border-amber-600 bg-amber-50/60 text-amber-900 shadow-2xs' : 'border-slate-100 text-slate-400 bg-white'}`}><Banknote size={18}/><span className="text-[9px] text-center font-bold">ชำระเงินสด</span></button>
                    <button onClick={() => setPaymentMethod('thaichueithai')} className={`py-3.5 px-1 rounded-2xl border-2 font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === 'thaichueithai' ? 'border-amber-600 bg-amber-50/60 text-amber-900 shadow-2xs' : 'border-slate-100 text-slate-400 bg-white'}`}><Sparkles size={18} className="text-amber-500" fill="currentColor"/><span className="text-[9px] text-center font-bold">ไทยช่วยไทยพลัส</span></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1.5">ที่อยู่จัดส่ง</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="ระบุเลขที่ห้อง / ชื่อตึก / จุดสังเกต..." className="w-full p-4 rounded-2xl bg-slate-50/90 text-xs outline-none border border-slate-200/70 focus:border-amber-600 focus:bg-white transition-all h-20 shadow-inner font-medium text-slate-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><MessageSquare size={13}/> หมายเหตุเพิ่มเติม</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น หวานน้อย, ไม่รับหลอด..." className="w-full p-3.5 rounded-2xl bg-slate-50/90 text-xs outline-none border border-slate-200/70 focus:border-amber-600 focus:bg-white transition-all shadow-inner font-medium text-slate-800" />
                  </div>
                </div>
                
                {paymentMethod === 'promptpay' && (
                  <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-slate-200 text-center relative overflow-hidden">
                    <p className="text-xs font-bold mb-3 text-slate-800">สแกน QR Code เพื่อชำระเงิน 📱</p>
                    {storeSettings.qrCodeImage ? (
                      <img src={storeSettings.qrCodeImage} className="w-36 h-36 mx-auto mb-3 bg-white p-2 rounded-2xl object-contain shadow-sm border border-slate-100" alt="QR Code ร้าน" />
                    ) : (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY:${storeSettings.promptPayNo}:${cartTotal}`} className="w-36 h-36 mx-auto mb-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm" alt="QR Code อัตโนมัติ" />
                    )}
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <p className="text-xs text-slate-600 font-extrabold">พร้อมเพย์: {storeSettings.promptPayNo || '0812345678'}</p>
                      <button onClick={copyPromptPay} className="flex items-center gap-1 bg-white border border-slate-200 text-amber-800 px-2.5 py-1 rounded-full shadow-2xs active:scale-95 transition-all">
                        {isCopied ? <CheckCircle size={13} className="text-emerald-500"/> : <Copy size={13}/>}
                        <span className="text-[10px] font-bold">{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>

                    <label className="cursor-pointer bg-slate-900 text-white py-3 px-6 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md active:scale-95 transition-all">
                      <Upload size={16}/> {slipImage ? 'เปลี่ยนรูปสลิป' : 'แนบรูปหลักฐานการโอน'}
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
                             console.error(err);
                             setSlipStatus('idle');
                           }
                        }
                      }} />
                    </label>

                    {slipImage && (
                       <div className="mt-4 bg-white p-3 rounded-2xl shadow-xs border border-slate-100">
                          <img src={slipImage} className="h-32 mx-auto rounded-xl shadow-xs border border-slate-100 mb-2 object-contain bg-slate-50" alt="Slip Preview" />
                          {slipStatus === 'checking' && (
                             <div className="flex flex-col items-center gap-1.5 text-blue-600 animate-pulse">
                               <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[10px] font-bold">กำลังตรวจสอบสลิป...</span>
                             </div>
                          )}
                          {slipStatus === 'valid' && (
                             <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 border border-emerald-200">
                               <CheckCircle size={13}/> ตรวจพบสลิปการโอนแล้ว
                             </div>
                          )}
                       </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'thaichueithai' && (
                  <div className="bg-amber-50/80 p-5 rounded-3xl border-2 border-dashed border-amber-200 text-center relative overflow-hidden">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="text-amber-600" size={20} fill="currentColor" />
                    </div>
                    <p className="text-xs font-bold text-amber-900 mb-1">ชำระเงินด้วยไทยช่วยไทยพลัส</p>
                    <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                      แอดมินจะส่ง QR Code ให้ทาง LINE นะคะ 🐮💖
                    </p>
                  </div>
                )}
                
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border bg-slate-50/80 transition-all cursor-pointer shadow-2xs">
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 mb-0.5">ยอมรับเงื่อนไขการจัดส่ง</p>
                    <p className="text-[10px] text-slate-500 font-medium">ส่งหน้าห้องเฉพาะกรณีเข้าตึกได้ (ลิฟต์เสีย/ฝนตก = แขวนใต้ตึก)</p>
                  </div>
                </label>
                
                {storeSettings.isStoreOpen !== false ? (
                  <button 
                    onClick={async (e) => {
                      e.preventDefault();
                      if (isProcessingOrder.current) return; 
                      if (!address) return showAlert("กรุณากรอกที่อยู่จัดส่งครับ");
                      if (paymentMethod === 'promptpay' && !slipImage) return showAlert("กรุณาแนบสลิปการโอนเงินครับ");
                      
                      isProcessingOrder.current = true; 
                      setIsLoading(true);
                      const total = cartTotal;
                      const orderTime = Date.now();
                      const dateStr = new Date(orderTime).toLocaleString('th-TH');
                      
                      try {
                        const orderRef = await addDoc(collection(db, 'orders'), {
                          items: cart, total, status: 'pending', timestamp: orderTime,
                          userId: lineProfile.userId || "guest_user", lineName: lineProfile.displayName || "ลูกค้าทั่วไป", address, note,
                          paymentMethod,
                          hasSlip: paymentMethod === 'promptpay',
                          hasDeliveryImage: false,
                          isDeleted: false
                        });

                        const currentSessionId = sessionStorage.getItem('happycow_visit_session_id');
                        if (currentSessionId) {
                          try {
                            await setDoc(doc(db, 'visit_logs', currentSessionId), {
                              hasOrdered: true,
                              lastOrderId: orderRef.id,
                              orderedAt: orderTime,
                              orderedAtStr: dateStr,
                              totalAmount: total
                            }, { merge: true });
                          } catch (err) {
                            console.error("Error updating visit order status:", err);
                          }
                        }

                        if (paymentMethod === 'promptpay' && slipImage) {
                          await setDoc(doc(db, 'slips', orderRef.id), {
                            slipImage: slipImage
                          }, { merge: true });
                        }

                        sendOrderToGoogleSheets({
                          orderId: orderRef.id,
                          timestamp: orderTime,
                          lineName: lineProfile.displayName || "ลูกค้าทั่วไป",
                          items: cart,
                          total,
                          paymentMethod,
                          status: 'pending',
                          address,
                          note
                        });

                        const orderLink = `https://liff.line.me/${LIFF_ID}?action=viewOrders&orderId=${orderRef.id}`;
                        
                        const orderSummaryText = `วัวนมอารมณ์ดี 🐮\nบิลเลขที่: #${orderRef.id.slice(0, 6)}\nวัน/เวลา: ${dateStr}\nลูกค้า: คุณ ${lineProfile.displayName || "ลูกค้าทั่วไป"}\n` + 
                          cart.map(i => {
                            const blendText = getBlendText(i);
                            const beanText = i.bean ? ` • เมล็ด: ${i.bean}` : '';
                            const teaText = i.teaType ? ` • รสชา: ${i.teaType}` : '';
                            const shotText = i.addShot ? ` • เพิ่มช็อตกาแฟ` : '';
                            const iceText = i.separateIce ? ` • แยกน้ำแข็ง (+฿5)` : '';
                            const saucesText = i.selectedSauces?.length > 0 ? ` • ราดซอส: ${i.selectedSauces.map(s => typeof s === 'object' ? s.name : s).join(', ')}` : '';
                            const toppingsText = i.selectedToppings?.length > 0 ? ` • เพิ่มท็อปปิ้ง: ${i.selectedToppings.map(t => t.name).join(', ')}` : '';
                            const pearlText = i.hasFreePearl ? (i.addPearl ? ' • รับไข่มุกฟรี' : ' • ไม่รับไข่มุกฟรี') : '';
                            const sweetText = isWhipOrCreamCheeseItem(i) ? '' : ` • หวาน ${i.sweetness}`;
                            return `- ${i.qty}x ${i.name} (${blendText}${sweetText}${beanText}${teaText}${shotText}${iceText}${pearlText}${saucesText}${toppingsText})`;
                          }).join('\n') + 
                          `\n\nยอดรวม: ฿${total}\nที่อยู่: ${address}\nช่องทางชำระเงิน: ${paymentMethod === 'cash' ? 'ชำระเงินสด' : (paymentMethod === 'thaichueithai' ? 'ไทยช่วยไทยพลัส' : 'โอนพร้อมเพย์')}\nหมายเหตุ: ${note || '-'}\n\n📄 สั่งน้ำกดลิ้งค์ได้เลย: ${orderLink}`;

                        let liffSuccess = false;
                        if (window.liff && window.liff.isLoggedIn() && window.liff.isInClient()) {
                           try {
                             await window.liff.sendMessages([{
                               type: "text",
                               text: orderSummaryText
                             }]);
                             liffSuccess = true;
                           } catch (err) {
                             console.log("LIFF sendMessages Error:", err);
                           }
                        }

                        setCart([]); setSlipImage(''); setSlipStatus('idle'); setAddress(''); setNote(''); setAcceptedTerms(false);

                        setSuccessModalData({
                           orderId: orderRef.id,
                           text: orderSummaryText,
                           autoSent: liffSuccess
                        });
                      } catch (err) {
                        showAlert("เกิดข้อผิดพลาดในการบันทึก: " + (err.message || err));
                      } finally {
                        isProcessingOrder.current = false; 
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading || !acceptedTerms || (paymentMethod === 'promptpay' && !slipImage)} 
                    className={`w-full py-4.5 rounded-2xl font-bold text-base transition-all shadow-lg active:scale-97 flex justify-center items-center gap-2 ${acceptedTerms && !isLoading && !(paymentMethod === 'promptpay' && !slipImage) ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white hover:opacity-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                     {isLoading ? 'กำลังบันทึกข้อมูล...' : `ยืนยันการสั่งซื้อ • ฿${cartTotal}`}
                  </button>
                ) : (
                  <button disabled className="w-full py-4 bg-slate-300 text-slate-500 rounded-2xl font-bold text-sm cursor-not-allowed">
                     ร้านปิดรับออเดอร์ชั่วคราว
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- My Orders View --- */}
        {view === 'myOrders' && (
          <div className="p-6 space-y-6 flex-1 bg-white rounded-t-[3rem] mt-4 min-h-[85vh] shadow-2xl relative z-20 animate-in slide-in-from-bottom-6 duration-300">
             <button onClick={() => { setView('shop'); setActiveCategory('🔥 เมนูขายดี'); }} className="flex items-center gap-2 font-bold text-slate-400 text-xs hover:text-slate-800"><ChevronLeft size={18}/> กลับหน้าร้าน</button>
             
             <div className="flex justify-between items-end border-b border-slate-100 pb-3">
               <h2 className="text-2xl font-serif font-black text-slate-900">ประวัติการสั่งซื้อ</h2>
               <span className="text-xs font-extrabold text-amber-800">วัวนมอารมณ์ดี</span>
             </div>
             
             {isLoadingOrders ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 animate-in fade-in">
                   <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-amber-900 font-bold text-xs text-center">กำลังดึงประวัติการสั่งซื้อของคุณ... 🐮</p>
                </div>
             ) : (
                 <div className="space-y-4">
                   {orders.filter(o => o.userId === lineProfile.userId && !o.isDeleted).map(o => {
                     const dateStr = new Date(o.timestamp).toLocaleString('th-TH');
                     return (
                       <div key={o.id} className={`bg-white p-5 rounded-3xl shadow-sm border transition-all duration-300 ${selectedOrderId === o.id ? 'order-highlight bg-amber-50/20' : 'border-slate-200/80'}`}>
                          <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                            <div>
                               <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">บิล #{o.id.slice(0,6)}</span>
                               <p className="text-xs font-black text-amber-600 mt-0.5 uppercase">{o.status}</p>
                               <p className="text-[10px] text-slate-400 mt-0.5 font-semibold"><Clock size={11} className="inline mr-1"/>{dateStr}</p>
                            </div>
                            <div className="text-xl font-serif font-black text-slate-900">฿{o.total}</div>
                          </div>
                          
                          <div className="space-y-1">{(o.items || []).map((item, idx) => (
                              <p key={idx} className="text-xs font-semibold text-slate-600 leading-snug">
                                {item.qty}x {item.name} ({getBlendText(item)}{isWhipOrCreamCheeseItem(item) ? '' : ` • หวาน ${item.sweetness}`}{item.bean ? ` • ${item.bean}` : ''}{item.teaType ? ` • ${item.teaType}` : ''}{item.addShot ? ' • เพิ่มช็อต' : ''}{item.separateIce ? ' • แยกน้ำแข็ง' : ''})
                                {item.selectedSauces?.length > 0 && ` + ราดซอส: ${item.selectedSauces.map(s => typeof s === 'object' ? s.name : s).join(', ')}`}
                                {item.selectedToppings?.length > 0 && ` + ${item.selectedToppings.map(t=>t.name).join(', ')}`}
                              </p>
                          ))}</div>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <button 
                              onClick={() => handleShareOrderBill(o)}
                              className="w-full bg-[#06C755] hover:bg-emerald-600 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-97 transition-all"
                            >
                              <Share2 size={15}/> แชร์บิลไปที่ LINE 💬
                            </button>

                            {o.status === 'completed' && (
                              <div className="space-y-2">
                                {o.deliveryMessage && (
                                  <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60">
                                    <p className="text-[10px] font-bold text-amber-900 mb-0.5 flex items-center gap-1"><MessageSquare size={12}/> ข้อความจากร้าน:</p>
                                    <p className="text-xs text-slate-700 font-semibold">{o.deliveryMessage}</p>
                                  </div>
                                )}
                                {o.hasDeliveryImage && (
                                  <button 
                                    onClick={() => viewImage(o.id, 'delivery')} 
                                    disabled={loadingSlipId === o.id}
                                    className="w-full bg-slate-900 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-97 transition-all"
                                  >
                                     {loadingSlipId === o.id ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                     ) : <Camera size={15}/>}
                                     ดูรูปจัดส่งสินค้า
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                       </div>
                   )})}
                   {orders.filter(o => o.userId === lineProfile.userId && !o.isDeleted).length === 0 && (
                      <div className="py-20 text-center text-slate-400 font-bold text-xs opacity-60">คุณยังไม่มีประวัติการสั่งซื้อสินค้าค่ะ 🐮</div>
                   )}
                 </div>
             )}
          </div>
        )}

        {/* --- Admin View --- */}
        {view === 'admin' && (
          <div className="p-5 bg-white min-h-screen animate-in fade-in relative z-20">
            <button onClick={() => { setView('shop'); setActiveCategory('🔥 เมนูขายดี'); }} className="flex items-center gap-2 font-bold text-slate-400 text-xs mb-5 hover:text-slate-800"><ChevronLeft size={18}/> กลับหน้าร้าน</button>
            <div className="flex justify-between items-center mb-5">
               <h2 className="text-xl font-serif font-black text-slate-900">แผงควบคุมแอดมิน</h2>
               <button onClick={playNotificationSound} className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 shadow-2xs border border-blue-200/60"><BellRing size={12}/> ทดสอบเสียงเตือน</button>
            </div>
            
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6 shadow-inner border border-slate-200/50">
              {['orders', 'menus', 'dashboard', 'settings'].map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${adminTab === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 uppercase'}`}>
                  {t === 'orders' ? 'ออร์เดอร์' : t === 'menus' ? 'เมนู' : t === 'dashboard' ? 'แดชบอร์ด' : 'ตั้งค่า'}
                </button>
              ))}
            </div>

            {/* TAB: แดชบอร์ด (Recharts Analytics + Google Sheets & Visit Logs) */}
            {/* TAB: แดชบอร์ด (Recharts Analytics + Google Sheets & Visit Logs) */}
            {adminTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Interactive Analytics Section with Recharts */}
                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-5 border border-slate-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span>🥤</span> Beverage Analytics Dashboard
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">วิเคราะห์ยอดขายและสถิติด้วย Recharts</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                          <Calendar size={15} />
                        </div>
                        <input 
                          type="date" 
                          value={analyticsSelectedDate}
                          onChange={(e) => setAnalyticsSelectedDate(e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl focus:ring-amber-500 focus:border-amber-500 block w-full pl-9 pr-7 py-2 shadow-sm transition-all cursor-pointer"
                        />
                        {analyticsSelectedDate && (
                          <button 
                            onClick={() => setAnalyticsSelectedDate('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 shadow-sm w-full sm:w-auto justify-center font-bold">
                        <input 
                          type="checkbox" 
                          checked={analyticsHideCanceled} 
                          onChange={(e) => setAnalyticsHideCanceled(e.target.checked)}
                          className="rounded border-slate-600 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        ซ่อนรายการยกเลิก
                      </label>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <KpiCard 
                      title="ยอดขายรวม (Total Sales)" 
                      value={`฿${analyticsData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                      icon={<DollarSign size={20} className="text-emerald-400" />}
                    />
                    <KpiCard 
                      title="ออเดอร์ทั้งหมด (Total Orders)" 
                      value={analyticsData.totalOrders} 
                      icon={<ShoppingCart size={20} className="text-blue-400" />}
                    />
                    <KpiCard 
                      title="จำนวนสินค้า (Total Items)" 
                      value={analyticsData.totalItems} 
                      icon={<Package size={20} className="text-purple-400" />}
                    />
                    <KpiCard 
                      title="ยอดเฉลี่ยต่อบิล (Avg. Order)" 
                      value={`฿${analyticsData.avgOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                      icon={<TrendingUp size={20} className="text-amber-400" />}
                    />
                  </div>

                  {/* Hourly Sales Trend Line Chart */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm text-slate-800">
                    <h4 className="text-xs font-black mb-3 text-slate-800 flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-blue-500"/> แนวโน้มยอดขายรายชั่วโมง (Hourly Sales Trend)
                    </h4>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.hourlyData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(value) => `฿${value}`} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`฿${value}`, 'Sales']}
                          />
                          <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white'}} activeDot={{ r: 7 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Payment Method Pie Chart */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm text-slate-800">
                    <h4 className="text-xs font-black mb-3 text-slate-800 flex items-center gap-1.5">
                      <CreditCard size={16} className="text-emerald-500" /> ช่องทางชำระเงิน (Payment Methods)
                    </h4>
                    <div className="h-[190px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.paymentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Filtered Orders Table */}
                  <div className="bg-white rounded-2xl shadow-sm text-slate-800 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                      <h4 className="text-xs font-black text-slate-800">รายการออเดอร์วิเคราะห์ ({analyticsData.filtered.length} บิล)</h4>
                      <div className="relative w-full sm:w-48">
                        <input 
                          type="text" 
                          placeholder="ค้นชื่อ, รหัสบิล, ที่อยู่..." 
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          value={analyticsSearchTerm}
                          onChange={(e) => setAnalyticsSearchTerm(e.target.value)}
                        />
                        <Search size={14} className="text-slate-400 absolute left-2.5 top-2" />
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto max-h-60">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 sticky top-0 font-extrabold">
                          <tr>
                            <th className="px-3 py-2 font-bold">เวลา</th>
                            <th className="px-3 py-2 font-bold">ลูกค้า / ที่อยู่</th>
                            <th className="px-3 py-2 font-bold text-right">ยอดรวม</th>
                            <th className="px-3 py-2 font-bold text-center">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.filtered.length > 0 ? (
                            analyticsData.filtered.map((order, index) => (
                              <tr key={order.billId || index} className="border-b border-slate-100 hover:bg-slate-50/80">
                                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                                  {order.datetime?.includes(' ') ? order.datetime.split(' ')[1] : order.datetime}
                                </td>
                                <td className="px-3 py-2.5 font-bold text-slate-700">
                                  {order.customer}
                                  <div className="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                                    <MapPin size={10} /> {order.address}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 font-black text-slate-900 text-right">
                                  ฿{order.total}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    (order.status || '').includes('ยกเลิก') || (order.status || '').toLowerCase().includes('cancel')
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {(order.status || '').replace(/[🔴🟢]/g, '').trim() || 'สำเร็จ'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-xs font-bold">
                                ไม่พบข้อมูลรายการคำสั่งซื้อ
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
                
                {/* 1. Google Sheets Live Sync Control Bar */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3 border border-emerald-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                      <Database size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs flex items-center gap-1.5">
                        Google Sheets Real-time Sync
                        <span className={`w-2 h-2 rounded-full ${storeSettings?.googleSheetUrl ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                      </h4>
                      <p className="text-[10px] text-emerald-200/80 font-medium">
                        {storeSettings?.googleSheetUrl ? `เชื่อมต่อระบบคลาวด์แล้ว (${sheetStats?.totalOrdersCount || 0} บิลถาวร)` : 'ยังไม่ได้ใส่ URL Google Sheets ในหน้าตั้งค่า'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={fetchDashboardDataFromGoogleSheets} 
                      disabled={isLoadingSheetDashboard}
                      className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoadingSheetDashboard ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={14}/>}
                      {isLoadingSheetDashboard ? 'กำลังโหลด...' : 'รีเฟรช Sheets'}
                    </button>

                    <button 
                      onClick={syncAllToGoogleSheets} 
                      disabled={isSyncingAll}
                      className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSyncingAll ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={14}/>}
                      {isSyncingAll ? 'กำลังส่ง...' : 'ส่งข้อมูลทั้งหมด'}
                    </button>
                  </div>
                </div>

                {/* 2. การ์ดสรุปยอดขาย */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-500">
                    <div className="absolute -right-2 -top-2 opacity-15"><Calendar size={100}/></div>
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-100">
                        <Sparkles size={16} className="text-amber-300"/> รายรับวันนี้ (Google Sheets)
                      </span>
                      <span className="text-[9px] bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full shadow-xs">
                        {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h1 className="text-3xl font-serif font-black relative z-10 my-1 text-white">
                      ฿{(sheetStats?.todayRevenue || 0).toLocaleString()}
                    </h1>
                    <p className="text-[10px] text-emerald-100/80 font-medium relative z-10">
                      สรุปรายรับที่คำนวณสดจากตาราง Google Sheets
                    </p>
                  </div>

                  <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-800">
                    <div className="absolute -right-4 -top-4 opacity-10"><TrendingUp size={120}/></div>
                    <div className="flex justify-between items-center mb-2 opacity-80 relative z-10">
                      <span className="font-bold text-xs flex items-center gap-1"><TrendingUp size={16}/> รายรับรวมสะสมทั้งหมด</span>
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold">ข้อมูลถาวร</span>
                    </div>
                    <h1 className="text-3xl font-serif font-black relative z-10 my-1">฿{(sheetStats?.totalRevenue || 0).toLocaleString()}</h1>
                    <p className="text-[10px] opacity-70 relative z-10">* ยอดขายนี้ดึงตรงจาก Google Sheets แม้ลบออร์เดอร์ในแอป ยอดจะไม่หาย</p>
                  </div>
                </div>

                {/* 3. จำแนกช่องทางชำระเงินจาก Google Sheets */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <Banknote size={16} className="text-emerald-600"/> สัดส่วนช่องทางชำระเงิน (ข้อมูลจาก Google Sheets)
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1"><CreditCard size={12}/> โอนพร้อมเพย์</span>
                        <span className="text-slate-900">฿{(sheetStats?.promptPaySum || 0).toLocaleString()} ({Math.round(((sheetStats?.promptPaySum || 0) / (sheetStats?.grandTotal || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(((sheetStats?.promptPaySum || 0) / (sheetStats?.grandTotal || 1)) * 100, 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1"><Banknote size={12}/> เงินสด</span>
                        <span className="text-slate-900">฿{(sheetStats?.cashSum || 0).toLocaleString()} ({Math.round(((sheetStats?.cashSum || 0) / (sheetStats?.grandTotal || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(((sheetStats?.cashSum || 0) / (sheetStats?.grandTotal || 1)) * 100, 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1"><Sparkles size={12} className="text-amber-500"/> ไทยช่วยไทยพลัส</span>
                        <span className="text-slate-900">฿{(sheetStats?.thaiSum || 0).toLocaleString()} ({Math.round(((sheetStats?.thaiSum || 0) / (sheetStats?.grandTotal || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(((sheetStats?.thaiSum || 0) / (sheetStats?.grandTotal || 1)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. ตารางแสดงประวัติออร์เดอร์ถาวรจาก Google Sheets */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <ClipboardList size={16} className="text-blue-500"/> ประวัติการสั่งซื้อย้อนหลังถาวร ({filteredSheetOrders.length} / {sheetOrdersData?.length || 0} บิล)
                    </h3>
                    {(sheetFilterDay !== 'all' || sheetFilterMonth !== 'all' || sheetFilterYear !== 'all') && (
                      <button 
                        onClick={() => { setSheetFilterDay('all'); setSheetFilterMonth('all'); setSheetFilterYear('all'); }}
                        className="text-[10px] text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold px-2.5 py-1 rounded-lg transition-all"
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Filter size={14} className="text-amber-800" />
                      <span>กรองข้อมูลตาม วัน / เดือน / ปี:</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1">วัน</label>
                        <select 
                          value={sheetFilterDay} 
                          onChange={e => setSheetFilterDay(e.target.value)}
                          className="w-full p-2 rounded-xl text-xs bg-white border border-slate-200 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="all">ทุกวัน</option>
                          {[...Array(31)].map((_, i) => (
                            <option key={i + 1} value={(i + 1).toString()}>วันที่ {i + 1}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1">เดือน</label>
                        <select 
                          value={sheetFilterMonth} 
                          onChange={e => setSheetFilterMonth(e.target.value)}
                          className="w-full p-2 rounded-xl text-xs bg-white border border-slate-200 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="all">ทุกเดือน</option>
                          {THAI_MONTHS.map((m, idx) => (
                            <option key={idx + 1} value={(idx + 1).toString()}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1">ปี</label>
                        <select 
                          value={sheetFilterYear} 
                          onChange={e => setSheetFilterYear(e.target.value)}
                          className="w-full p-2 rounded-xl text-xs bg-white border border-slate-200 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="all">ทุกปี</option>
                          {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-72 overflow-y-auto hide-scrollbar">
                    {filteredSheetOrders.slice().reverse().map((o, idx) => {
                      const safeOrderId = o?.orderId ? String(o.orderId).slice(0, 6) : `ROW-${idx + 1}`;
                      const safeLineName = o?.lineName || 'ไม่ระบุชื่อ';
                      const safeTimestamp = o?.timestampStr || 'ไม่ระบุเวลา';
                      const safePayment = o?.paymentMethod || 'ไม่ระบุ';
                      const safeTotal = Number(o?.total || 0).toLocaleString();
                      const safeStatus = o?.status || 'จัดส่งสำเร็จ';

                      return (
                        <div key={o?.orderId || idx} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex justify-between items-center text-xs hover:bg-slate-100/80 transition-colors">
                          <div>
                            <span className="font-bold text-slate-800 block">#{safeOrderId} - {safeLineName}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{safeTimestamp} • {safePayment}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 block">฿{safeTotal}</span>
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{safeStatus}</span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredSheetOrders.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-8 font-bold">ไม่พบข้อมูลประวัติสั่งซื้อตามเงื่อนไข วัน/เดือน/ปี ที่เลือก</p>
                    )}
                  </div>
                </div>

                {/* 5. ประวัติการเข้าชมร้านค้า */}
                <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-xs text-indigo-900 flex items-center gap-2">
                      <Users size={16} className="text-indigo-600"/> ประวัติการเข้าชมร้านค้าและการสั่งซื้อ (50 รายการล่าสุด)
                    </h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-100">
                      รวม {visitLogs.length} Sessions
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto hide-scrollbar">
                    {visitLogs.map((log) => {
                      const isOrdered = log.hasOrdered === true;
                      return (
                        <div key={log.id} className={`p-3 rounded-2xl border flex justify-between items-center text-xs transition-all ${isOrdered ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200/60'}`}>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{log.displayName || 'ลูกค้าทั่วไป'}</span>
                              <span className="text-[9px] text-slate-400 font-mono">({String(log.userId || '').slice(0, 8)})</span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1">
                              <Clock size={10}/> เข้าชมเมื่อ: {log.visitedAtStr || 'ไม่ระบุเวลา'}
                            </p>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            {isOrdered ? (
                              <>
                                <span className="bg-emerald-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 shadow-2xs">
                                  <ShoppingCart size={10}/> สั่งซื้อสินค้าแล้ว ✨
                                </span>
                                {log.totalAmount && (
                                  <span className="text-[10px] font-bold text-emerald-800 mt-1">
                                    ฿{log.totalAmount.toLocaleString()} (#{String(log.lastOrderId || '').slice(0, 5)})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Eye size={10}/> เข้าชมอย่างเดียว
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {visitLogs.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-8 font-bold">ยังไม่มีข้อมูลประวัติการเข้าชมร้านค้า</p>
                    )}
                  </div>
                </div>

                {/* 6. สถานะออร์เดอร์ Real-time */}
                <div>
                  <h3 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-2">
                    <BellRing size={16} className="text-amber-500"/> สถานะคิวออร์เดอร์ปัจจุบัน (Firebase)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      onClick={() => setAdminTab('orders')}
                      className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-3xl text-center cursor-pointer active:scale-95 transition-all shadow-xs hover:shadow-md"
                    >
                      <p className="text-[9px] font-extrabold text-amber-700 uppercase mb-1">รอยืนยัน 🟠</p>
                      <h2 className="text-2xl font-black text-amber-700">{pendingCount}</h2>
                      <p className="text-[8px] text-amber-500 font-bold mt-1">ออร์เดอร์ใหม่</p>
                    </div>

                    <div 
                      onClick={() => setAdminTab('orders')}
                      className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-3xl text-center cursor-pointer active:scale-95 transition-all shadow-xs hover:shadow-md"
                    >
                      <p className="text-[9px] font-extrabold text-blue-700 uppercase mb-1">กำลังปรุง 👩‍🍳</p>
                      <h2 className="text-2xl font-black text-blue-700">{cookingCount}</h2>
                      <p className="text-[8px] text-blue-500 font-bold mt-1">กำลังทำเครื่องดื่ม</p>
                    </div>

                    <div 
                      onClick={() => setAdminTab('orders')}
                      className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-3xl text-center cursor-pointer active:scale-95 transition-all shadow-xs hover:shadow-md"
                    >
                      <p className="text-[9px] font-extrabold text-emerald-700 uppercase mb-1">สำเร็จแล้ว 🟢</p>
                      <h2 className="text-2xl font-black text-emerald-700">{completedCount}</h2>
                      <p className="text-[8px] text-emerald-500 font-bold mt-1">จัดส่งเสร็จสิ้น</p>
                    </div>
                  </div>
                </div>

                {/* 7. สรุปรายรับรายวัน/เดือน/ปี */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10"><TrendingUp size={120}/></div>
                  <div className="flex justify-between items-center mb-2 opacity-80 relative z-10">
                    <span className="font-bold text-xs flex items-center gap-1"><TrendingUp size={16}/> ยอดขายวันนี้ (Firebase)</span>
                    <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">{new Date().toLocaleDateString('th-TH')}</span>
                  </div>
                  <h1 className="text-4xl font-serif font-black relative z-10 my-1">฿{revData.daily.toLocaleString()}</h1>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-white/10 text-xs relative z-10">
                    <div>
                      <span className="opacity-70 text-[10px] block">เดือนนี้</span>
                      <span className="font-bold text-sm">฿{revData.monthly.toLocaleString()}</span>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                      <span className="opacity-70 text-[10px] block">ปีนี้</span>
                      <span className="font-bold text-sm">฿{revData.yearly.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 8. จำแนกช่องทางชำระเงินเดิม */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <Banknote size={16} className="text-emerald-600"/> สัดส่วนช่องทางชำระเงิน (Firebase)
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1"><CreditCard size={12}/> โอนพร้อมเพย์</span>
                        <span className="text-slate-900">฿{promptPayTotal.toLocaleString()} ({Math.round((promptPayTotal/grandTotal)*100 || 0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((promptPayTotal/grandTotal)*100, 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1"><Banknote size={12}/> เงินสด</span>
                        <span className="text-slate-900">฿{cashTotal.toLocaleString()} ({Math.round((cashTotal/grandTotal)*100 || 0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((cashTotal/grandTotal)*100, 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1"><Sparkles size={12} className="text-amber-500"/> ไทยช่วยไทยพลัส</span>
                        <span className="text-slate-900">฿{thaiChueiThaiTotal.toLocaleString()} ({Math.round((thaiChueiThaiTotal/grandTotal)*100 || 0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((thaiChueiThaiTotal/grandTotal)*100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9. สินค้าขายดี 5 อันดับแรก */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800 mb-4 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" fill="currentColor"/> 5 อันดับเมนูขายดีที่สุด (Firebase)
                  </h3>
                  
                  {topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {topProducts.map((p, idx) => (
                        <div key={p.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {idx + 1}
                              </span>
                              {p.name}
                            </span>
                            <span className="font-black text-slate-900">{p.qty} แก้ว <span className="text-slate-400 font-normal">(฿{p.revenue.toLocaleString()})</span></span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-amber-500' : 'bg-amber-800'}`} 
                              style={{ width: `${(p.qty / maxTopQty) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-6 font-bold">ยังไม่มีข้อมูลยอดขายเมนู</p>
                  )}
                </div>

                {/* 10. ช่วงเวลาขายดี */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500"/> ช่วงเวลาที่มีการสั่งซื้อเยอะที่สุด (Peak Hours)
                  </h3>
                  
                  <div className="flex items-end gap-2 h-28 pt-3 px-1">
                    {Object.entries(peakHoursData).map(([slot, count]) => {
                      const heightPercent = (count / maxPeakCount) * 100;
                      return (
                        <div key={slot} className="flex-1 flex flex-col items-center h-full justify-end gap-1 group">
                          <span className="text-[9px] font-bold text-slate-700 opacity-80">{count} บิล</span>
                          <div className="w-full bg-indigo-50 rounded-t-xl overflow-hidden flex items-end h-16">
                            <div 
                              className="w-full bg-indigo-600 rounded-t-xl transition-all duration-700 group-hover:bg-indigo-700" 
                              style={{ height: `${Math.max(heightPercent, 8)}%` }}
                            ></div>
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 truncate w-full text-center">{slot}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 11. ผู้ใช้ออนไลน์ */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs">
                   <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5">
                     <h3 className="font-bold text-xs text-emerald-700 flex items-center gap-2">
                       <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       ผู้ใช้ออนไลน์ขณะนี้ (Real-time)
                     </h3>
                     <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold">{activeUsers.length} คน</span>
                   </div>

                   {activeUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeUsers.map(u => (
                           <div key={u.id} className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                             <UserCheck size={12}/> {u.displayName}
                           </div>
                        ))}
                      </div>
                   ) : (
                      <p className="text-center text-xs text-slate-400 font-bold py-3">ยังไม่มีลูกค้าออนไลน์ในขณะนี้</p>
                   )}
                </div>

                {/* 12. สถิติผู้เข้าชม 7 วัน */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                   <h3 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-2"><Users size={16}/> สถิติผู้เข้าชมเว็บย้อนหลัง 7 วัน</h3>
                   <div className="space-y-3">
                      {recentVisits.map((v, index) => {
                         const percent = (v.count / maxVisitCount) * 100;
                         const isToday = index === 6;
                         return (
                            <div key={v.dateStr} className="space-y-1">
                               <div className="flex justify-between items-center text-xs">
                                  <span className={`font-bold ${isToday ? 'text-amber-800' : 'text-slate-500'}`}>{v.thaiDateStr} {isToday && '(วันนี้)'}</span>
                                  <span className="font-black text-slate-900">{v.count} คน</span>
                               </div>
                               <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${isToday ? 'bg-amber-600' : 'bg-slate-800'}`} style={{ width: `${percent}%` }}></div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>

                {/* 13. Storage Graph */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2"><Database size={16}/> พื้นที่เก็บรูปภาพ (Storage)</h3>
                     <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">ประมาณการ</span>
                   </div>
                   <p className="text-xs font-bold text-slate-500 mb-2">ใช้ไปประมาณ <span className="text-amber-800 font-black">{storageData.usageMB} MB</span> / 5,000 MB</p>
                   <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                     <div className={`h-2.5 rounded-full transition-all duration-1000 ${storageData.storagePercent > 80 ? 'bg-rose-500' : storageData.storagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(storageData.storagePercent, 1)}%` }}></div>
                   </div>
                </div>




              </div>
            )}
            {/* TAB: ตรวจสอบออร์เดอร์ของแอดมิน */}
            {adminTab === 'orders' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200/80 relative mb-4">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" value={adminSearchQuery} onChange={e => setAdminSearchQuery(e.target.value)} placeholder="ค้นหารหัสบิล, ชื่อ หรือที่อยู่ลูกค้า..." className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs outline-none bg-white font-bold text-slate-700"/>
                   {adminSearchQuery && <button onClick={() => setAdminSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 bg-slate-100 p-1 rounded-full"><X size={12}/></button>}
                </div>

                {filteredOrders.map((o, idx) => {
                    const dateStr = new Date(o.timestamp).toLocaleString('th-TH');
                    return (
                    <div key={o.id} className={`border p-5 rounded-3xl shadow-xs bg-white animate-in fade-in transition-all duration-300 ${selectedOrderId === o.id ? 'order-highlight bg-amber-50/20' : o.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200/80'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                           <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black">#{filteredOrders.length - idx}</span>
                           <div>
                              <span className="font-bold text-xs text-slate-800">{o.lineName}</span>
                              <p className="text-[9px] text-slate-400 font-bold"><Clock size={10} className="inline mr-1"/>{dateStr}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-800 font-black text-sm block">฿{o.total}</span>
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-tight">
                            {o.paymentMethod === 'cash' ? '💵 จ่ายสด' : (o.paymentMethod === 'thaichueithai' ? '🇹🇭 ไทยช่วยไทยพลัส' : '📱 โอนเงิน')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-600 mb-3 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium"><MapPin size={12} className="flex-shrink-0 text-amber-800"/> {o.address}</div>
                      
                      <div className="space-y-1 border-t border-slate-100 pt-3 mb-3">{(o.items || []).map((i, idx) => (
                          <div key={idx} className="text-xs text-slate-600 flex justify-between font-medium">
                            <span>{i.qty}x {i.name} ({getBlendText(i)}{isWhipOrCreamCheeseItem(i) ? '' : ` • หวาน ${i.sweetness}`}{i.bean ? ` • ${i.bean}` : ''}{i.teaType ? ` • ${i.teaType}` : ''}{i.addShot ? ' • เพิ่มช็อต' : ''}{i.separateIce ? ' • แยกน้ำแข็ง' : ''}{i.hasFreePearl && i.addPearl ? ' +มุกฟรี':''}{i.selectedSauces?.length > 0 ? ` + ราดซอส:${i.selectedSauces.map(s=>typeof s==='object'?s.name:s).join(',')}` : ''}{i.selectedToppings?.length > 0 ? ` + ${i.selectedToppings.map(t=>t.name).join(',')}` : ''})</span>
                            <span className="font-bold text-slate-800">฿{i.price * i.qty}</span>
                          </div>
                      ))}</div>

                      {(o.hasSlip || o.hasDeliveryImage) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {o.hasSlip && (
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex-1 min-w-[120px] text-center">
                              <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">📄 สลิปโอนเงิน:</p>
                              <button 
                                onClick={() => viewImage(o.id, 'slip')}
                                disabled={loadingSlipId === o.id}
                                className="w-full bg-white hover:bg-slate-100 transition-colors py-2 rounded-lg border text-[10px] font-bold text-blue-600 flex items-center justify-center gap-1 shadow-2xs"
                              >
                                {loadingSlipId === o.id ? (
                                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : <Eye size={12}/>}
                                ตรวจสอบสลิป
                              </button>
                            </div>
                          )}
                          {o.hasDeliveryImage && (
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex-1 min-w-[120px] text-center">
                              <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">🛵 รูปส่งสินค้า:</p>
                              <button 
                                onClick={() => viewImage(o.id, 'delivery')}
                                disabled={loadingSlipId === o.id}
                                className="w-full bg-white hover:bg-slate-100 transition-colors py-2 rounded-lg border text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1 shadow-2xs"
                              >
                                {loadingSlipId === o.id ? (
                                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : <Camera size={12}/>}
                                ดูรูปจัดส่ง
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 mb-2 mt-3">
                        {o.hasSlip ? (
                          <button onClick={() => viewImage(o.id, 'slip')} className="bg-blue-50 text-blue-700 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all border border-blue-200/60"><Eye size={13}/> ตรวจสลิป</button>
                        ) : <div className="hidden sm:block"></div>}
                        
                        <button 
                          onClick={() => handleShareOrderBill(o)}
                          className="bg-emerald-50 text-emerald-700 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all border border-emerald-200 hover:bg-emerald-100"
                        >
                          <Share2 size={13}/> แชร์บิล
                        </button>

                        <button 
                          type="button" 
                          onClick={() => {
                             showConfirm("ซ่อนออร์เดอร์นี้ใช่หรือไม่?", async () => {
                                try {
                                   await updateDoc(doc(db, 'orders', o.id), { isDeleted: true });
                                } catch (e) {
                                   showAlert("เกิดข้อผิดพลาด: " + e.message);
                                }
                             });
                          }} 
                          className="bg-rose-50 text-rose-600 py-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-all border border-rose-200/60"
                        >
                           <Trash2 size={15}/>
                        </button>
                      </div>

                      <div className="flex gap-2 border-t border-slate-100 pt-3 mt-2">
                        {o.status === 'pending' && <button onClick={() => handleAcceptOrder(o)} className="flex-1 bg-amber-600 text-white py-3.5 rounded-xl text-[11px] font-bold shadow-md animate-pulse active:scale-97 transition-all">กดยอมรับออเดอร์</button>}
                        
                        {o.status === 'cooking' && (
                          <button onClick={() => { setDeliveryModal(o); setDeliveryImage(''); setDeliveryLocation('room'); }} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl text-[11px] font-bold shadow-md flex items-center justify-center gap-1 active:scale-97 transition-all">
                             <Check size={14}/> จัดส่ง/ลูกค้ารับแล้ว
                          </button>
                        )}
                        
                        {o.status === 'completed' && <div className="flex-1 text-center text-[10px] font-bold text-emerald-700 py-2 border border-emerald-200 rounded-xl bg-emerald-50">สำเร็จเรียบร้อย</div>}
                      </div>
                    </div>
                )})}
                {filteredOrders.length === 0 && <div className="py-20 text-center text-slate-400 font-bold text-xs opacity-60">ไม่พบข้อมูลออร์เดอร์ 🐮</div>}
              </div>
            )}

            {/* TAB: ระบบจัดการคลังเมนู */}
            {adminTab === 'menus' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
                  <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600 mb-2.5 border border-blue-100">
                     <ClipboardList size={24} />
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 mb-0.5">ส่งออกรายการเมนู (CSV)</h3>
                  <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                     ดาวน์โหลดรายชื่อเครื่องดื่ม ราคา และสถานะทั้งหมด
                  </p>
                  <button onClick={exportMenuToCSV} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md active:scale-97 transition-all flex items-center justify-center gap-2">
                     <Download size={16} /> โหลดรายการเมนูลงเครื่อง
                  </button>
                </div>

                <div className="bg-white p-2 rounded-2xl shadow-xs border border-slate-200/80 relative">
                   <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" value={adminSearchQuery} onChange={e => setAdminSearchQuery(e.target.value)} placeholder="ค้นหาชื่อเมนู..." className="w-full pl-11 pr-10 py-3 rounded-xl text-xs outline-none bg-white font-bold text-slate-700"/>
                   {adminSearchQuery && <button onClick={() => setAdminSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 bg-slate-100 p-1 rounded-full"><X size={12}/></button>}
                </div>

                <div className="bg-slate-50/80 p-5 rounded-3xl border-2 border-dashed border-slate-200 shadow-inner relative">
                  {!showAddMenuForm ? (
                     <button onClick={() => setShowAddMenuForm(true)} className="w-full py-2 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 rounded-xl transition-all">
                        <Plus size={16}/> คลิกเพื่อเพิ่มเมนูใหม่
                     </button>
                  ) : (
                    <div className="space-y-3.5 text-center animate-in fade-in">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 mb-1">
                        <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5"><Plus size={15}/> เพิ่มเมนูใหม่</h3>
                        <button onClick={() => setShowAddMenuForm(false)} className="text-slate-400 p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={15}/></button>
                      </div>
                      <input type="text" placeholder="ชื่อเมนู" className="w-full p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-slate-200 bg-white font-bold" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} />
                      
                      <div className="flex gap-2">
                        <input type="number" placeholder="ราคาปกติ" className="w-1/2 p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-slate-200 bg-white font-bold" value={newMenu.price} onChange={e => setNewMenu({...newMenu, price: e.target.value})} />
                        
                        <select className="w-1/2 p-3.5 rounded-2xl text-xs outline-none shadow-2xs bg-white border border-slate-200 font-bold text-slate-700" value={newMenu.category} onChange={e => setNewMenu({...newMenu, category: e.target.value})}>
                          {CATEGORIES.filter(c => c !== '🔥 เมนูขายดี').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="p-3 bg-white rounded-2xl border border-slate-200 text-left">
                        <label className="text-[10px] font-bold text-slate-500 block mb-2">ระดับความหวานที่เลือกได้:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {SWEETNESS.map(level => {
                            const isSelected = (newMenu.allowedSweetness || SWEETNESS).includes(level);
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => {
                                  const current = newMenu.allowedSweetness || SWEETNESS;
                                  const updated = isSelected 
                                    ? current.filter(s => s !== level) 
                                    : [...current, level];
                                  setNewMenu({ ...newMenu, allowedSweetness: updated });
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                  isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <label className="col-span-2 flex items-center justify-center gap-1.5 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 cursor-pointer transition-all">
                          <input type="checkbox" checked={newMenu.isOnlyBlend} onChange={e => setNewMenu({...newMenu, isOnlyBlend: e.target.checked, allowBlend: e.target.checked ? true : newMenu.allowBlend})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                          <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1"><Zap size={13} className="text-blue-500" fill="currentColor"/> เป็นเมนูเฉพาะปั่นเท่านั้น (เช่น สมูทตี้)</span>
                        </label>

                        <label className={`flex items-center justify-center gap-1 p-2.5 rounded-2xl border cursor-pointer transition-all ${newMenu.isOnlyBlend ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-white border-slate-200'}`}>
                          <input type="checkbox" disabled={newMenu.isOnlyBlend} checked={newMenu.isOnlyBlend || newMenu.allowBlend !== false} onChange={e => setNewMenu({...newMenu, allowBlend: e.target.checked})} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                          <span className="text-[10px] font-bold text-slate-600">มีเมนูปั่น</span>
                        </label>

                        <label className="flex items-center justify-center gap-1 p-2.5 bg-white rounded-2xl border border-slate-200 cursor-pointer transition-all">
                          <input type="checkbox" checked={newMenu.allowTopping !== false} onChange={e => setNewMenu({...newMenu, allowTopping: e.target.checked})} className="w-4 h-4 accent-amber-700 cursor-pointer" />
                          <span className="text-[10px] font-bold text-slate-600">ท็อปปิ้งได้</span>
                        </label>

                        <label className="flex items-center justify-center gap-1 p-2.5 bg-white rounded-2xl border border-slate-200 cursor-pointer transition-all">
                          <input type="checkbox" checked={newMenu.hasFreePearl} onChange={e => setNewMenu({...newMenu, hasFreePearl: e.target.checked})} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Star size={11} className="text-amber-500" fill="currentColor"/> มุกฟรี</span>
                        </label>

                        <label className="flex items-center justify-center gap-1 p-2.5 bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition-all">
                          <input type="checkbox" checked={newMenu.isSoldOut} onChange={e => setNewMenu({...newMenu, isSoldOut: e.target.checked})} className="w-4 h-4 accent-slate-600 cursor-pointer" />
                          <span className="text-[10px] font-bold text-slate-600">ปิดขายชั่วคราว</span>
                        </label>

                        <label className="col-span-2 flex items-center justify-center gap-1.5 p-3 bg-rose-50/80 rounded-2xl border border-rose-200/80 cursor-pointer transition-all">
                          <input type="checkbox" checked={newMenu.isPromoted} onChange={e => setNewMenu({...newMenu, isPromoted: e.target.checked})} className="w-4 h-4 accent-rose-600 cursor-pointer" />
                          <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1"><Star size={13} className="text-rose-500" fill="currentColor"/> ตั้งเป็นเมนูแนะนำ</span>
                        </label>

                        {newMenu.category === 'มัทฉะ' && (
                          <label className="col-span-2 flex items-center justify-center gap-1.5 p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 cursor-pointer transition-all">
                            <input type="checkbox" checked={newMenu.hasTeaType} onChange={e => setNewMenu({...newMenu, hasTeaType: e.target.checked})} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                            <span className="text-[10px] font-bold text-emerald-800">🍵 ให้ลูกค้าเลือกผงชาได้</span>
                          </label>
                        )}
                      </div>

                      {newMenu.allowBlend !== false && newMenu.category !== 'สมูทตี้โยเกิร์ต' && newMenu.category !== 'ผลไม้และสมูทตี้' && (
                        <div className="text-left mt-1">
                          <label className="text-[10px] font-bold text-slate-400 ml-1">บวกราคาเพิ่มสำหรับปั่น (บาท)</label>
                          <input type="number" placeholder="เช่น 5" className="w-full mt-1 p-3.5 rounded-2xl text-xs outline-none shadow-2xs bg-white border border-slate-200 font-bold" value={newMenu.blendPrice} onChange={e => setNewMenu({...newMenu, blendPrice: e.target.value})} />
                        </div>
                      )}

                      <label className="cursor-pointer bg-white border border-slate-200 p-3.5 rounded-2xl text-xs font-bold block shadow-2xs text-slate-400 hover:text-amber-800 transition-all mt-2">
                        <Upload size={16} className="inline mr-2"/> {newMenu.image ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพเมนู'}
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files[0];
                          if (file) { try { setNewMenu({...newMenu, image: await compressImage(file)}); } catch(err) { console.error(err); } }
                        }} />
                      </label>
                      
                      <button onClick={handleAddNewMenu} className="w-full bg-amber-800 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md active:scale-97 transition-all flex items-center justify-center gap-2 hover:bg-amber-900"><Plus size={16}/> บันทึกเมนูใหม่</button>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50/80 p-5 rounded-3xl border-2 border-dashed border-amber-200/80 shadow-inner relative">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                      ✨ ซอสราดแต่งหน้า (สำหรับวิปครีม/ครีมชีส)
                    </h3>
                  </div>

                  {!showAddSauceForm ? (
                     <div className="space-y-2">
                       <button onClick={() => setShowAddSauceForm(true)} className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs">
                          <Plus size={16}/> เพิ่มซอสราดใหม่
                       </button>
                       {sauces.length === 0 && (
                         <button onClick={handleSeedDefaultSauces} className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl transition-all text-xs border border-amber-300 flex items-center justify-center gap-2">
                            ⚡ นำเข้าซอสเริ่มต้น
                         </button>
                       )}
                     </div>
                  ) : (
                    <div className="space-y-3 text-center animate-in fade-in bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                      <div className="flex justify-between items-center border-b border-amber-100 pb-2 mb-1">
                        <h3 className="font-bold text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1.5"><Plus size={15}/> เพิ่มซอสราดใหม่</h3>
                        <button onClick={() => setShowAddSauceForm(false)} className="text-amber-400 p-1 hover:bg-amber-100 rounded-full transition-colors"><X size={15}/></button>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="ชื่อซอส" className="w-2/3 p-3.5 rounded-2xl text-xs outline-none border border-amber-200 bg-slate-50 font-bold" value={newSauce.name} onChange={e => setNewSauce({...newSauce, name: e.target.value})} />
                        <input type="number" placeholder="ราคา" className="w-1/3 p-3.5 rounded-2xl text-xs outline-none border border-amber-200 bg-slate-50 font-bold" value={newSauce.price} onChange={e => setNewSauce({...newSauce, price: e.target.value})} />
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setShowAddSauceForm(false)} className="w-1/3 bg-slate-100 text-slate-500 py-2.5 rounded-xl font-bold text-xs">ยกเลิก</button>
                         <button onClick={handleAddSauce} className="w-2/3 bg-amber-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-97 transition-all">บันทึกซอสราด</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mt-3 text-left pt-3 border-t border-amber-200/50">
                    <p className="text-[11px] font-bold text-amber-900 mb-1">
                      รายการซอสที่มี ({sauces.length} รายการ)
                    </p>
                    {sauces.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                        <span className="text-xs font-bold text-slate-800">{s.name} <span className="text-amber-700 text-[10px] font-bold">({s.price > 0 ? `+฿${s.price}` : 'ฟรี'})</span></span>
                        <button onClick={() => handleDeleteSauce(s.id)} className="text-rose-400 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/80 p-5 rounded-3xl border-2 border-dashed border-amber-200/80 shadow-inner relative">
                  {!showAddToppingForm ? (
                     <button onClick={() => setShowAddToppingForm(true)} className="w-full py-2 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100 rounded-xl transition-all">
                        <Plus size={16}/> คลิกเพื่อเพิ่มท็อปปิ้งเสริม
                     </button>
                  ) : (
                    <div className="space-y-3 text-center animate-in fade-in">
                      <div className="flex justify-between items-center border-b border-amber-200 pb-2 mb-1">
                        <h3 className="font-bold text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1.5"><Plus size={15}/> เพิ่มท็อปปิ้งเสริม</h3>
                        <button onClick={() => setShowAddToppingForm(false)} className="text-amber-400 p-1 hover:bg-amber-100 rounded-full transition-colors"><X size={15}/></button>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="ชื่อท็อปปิ้ง" className="w-2/3 p-3.5 rounded-2xl text-xs outline-none border border-amber-200 bg-white font-bold" value={newTopping.name} onChange={e => setNewTopping({...newTopping, name: e.target.value})} />
                        <input type="number" placeholder="ราคา" className="w-1/3 p-3.5 rounded-2xl text-xs outline-none border border-amber-200 bg-white font-bold" value={newTopping.price} onChange={e => setNewTopping({...newTopping, price: e.target.value})} />
                      </div>
                      <button onClick={handleAddTopping} className="w-full bg-amber-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md active:scale-97 transition-all">บันทึกท็อปปิ้งใหม่</button>
                    </div>
                  )}

                  {toppings.length > 0 && (
                    <div className="space-y-2 mt-3 text-left pt-3 border-t border-amber-200/50">
                      <p className="text-[11px] font-bold text-amber-800 mb-1">ท็อปปิ้งในระบบ</p>
                      {toppings.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                          <span className="text-xs font-bold text-slate-800">{t.name} <span className="text-amber-600 text-[10px]">(+฿{t.price})</span></span>
                          <button onClick={() => handleDeleteTopping(t.id)} className="text-rose-400 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  {CATEGORIES.filter(c => c !== '🔥 เมนูขายดี').map(category => {
                    let itemsInCategory = menuItems
                      .filter(item => {
                         if (category === 'สมูทตี้โยเกิร์ต') return item.category === 'สมูทตี้โยเกิร์ต' || item.category === 'ผลไม้และสมูทตี้';
                         if (category === 'วิปครีมและครีมชีส') return item.category === 'วิปครีมและครีมชีส' || item.category === 'ครีมและครีมชีส' || item.category === 'เมนูพิเศษ';
                         return item.category === category;
                      })
                      .sort((a, b) => (a.sortOrder || a.createdAt || 0) - (b.sortOrder || b.createdAt || 0));

                    if (adminSearchQuery) itemsInCategory = itemsInCategory.filter(item => item.name.toLowerCase().includes(adminSearchQuery.toLowerCase()));
                    if (itemsInCategory.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2.5">
                        <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-200 pb-1.5 ml-1">{category}</h4>
                        {itemsInCategory.map((item, idx) => (
                          <div key={item.id} className="flex flex-col gap-1">
                            <div 
                              draggable={!(editingMenu && editingMenu.id === item.id)}
                              onDragStart={(e) => { dragItem.current = idx; e.currentTarget.classList.add('opacity-50', 'scale-95'); }}
                              onDragEnter={(e) => dragOverItem.current = idx}
                              onDragEnd={(e) => { e.currentTarget.classList.remove('opacity-50', 'scale-95'); handleSortDrop(itemsInCategory); }}
                              onDragOver={(e) => e.preventDefault()}
                              className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs transition-all hover:shadow-xs cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex flex-col items-center gap-0.5 z-10">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveMenu(item, 'up', itemsInCategory); }} disabled={idx === 0 || adminSearchQuery} className={`p-1 rounded-md transition-all ${idx === 0 || adminSearchQuery ? 'text-slate-200' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'}`}><ArrowUp size={13}/></button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveMenu(item, 'down', itemsInCategory); }} disabled={idx === itemsInCategory.length - 1 || adminSearchQuery} className={`p-1 rounded-md transition-all ${idx === itemsInCategory.length - 1 || adminSearchQuery ? 'text-slate-200' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'}`}><ArrowDown size={13}/></button>
                                </div>
                                <img src={item.image} className={`w-12 h-12 rounded-xl object-cover pointer-events-none ${item.isSoldOut ? 'grayscale opacity-50' : ''}`} alt="list" />
                                <div>
                                  <p className="font-bold text-xs text-slate-800 flex items-center gap-1 flex-wrap">
                                    {item.name} 
                                    {item.isPromoted && <span className="text-[8px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">แนะนำ</span>}
                                    {item.isSoldOut && <span className="text-[8px] bg-slate-500 text-white px-1.5 py-0.2 rounded-full font-bold">หมด</span>}
                                  </p>
                                  <p className="text-xs text-amber-800 font-black">฿{item.price}</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5 z-10">
                                <button type="button" onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (editingMenu && editingMenu.id === item.id) {
                                    setEditingMenu(null); 
                                  } else {
                                    setEditingMenu(item); 
                                  }
                                }} className={`p-2.5 active:scale-90 transition-all rounded-xl ${editingMenu && editingMenu.id === item.id ? 'bg-amber-800 text-white shadow-xs' : 'text-blue-600 hover:bg-blue-100 bg-blue-50'}`}>
                                  {editingMenu && editingMenu.id === item.id ? <X size={15}/> : <Edit size={15}/>}
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteMenu(item.id); }} className="p-2.5 text-rose-500 hover:bg-rose-100 active:scale-90 transition-all bg-rose-50 rounded-xl"><Trash2 size={15}/></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDownloadImage(item.image, `menu_${item.name}.jpg`); }} className="p-2.5 text-emerald-600 hover:bg-emerald-100 active:scale-90 transition-all bg-emerald-50 rounded-xl"><Download size={15}/></button>
                              </div>
                            </div>

                            {editingMenu && editingMenu.id === item.id && (
                              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-inner mt-1 mb-3 mx-1 animate-in slide-in-from-top-2 space-y-3">
                                <div className="flex justify-between items-center mb-1 border-b border-amber-200/60 pb-2">
                                   <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5"><Edit size={15}/> แก้ไขเมนู</h4>
                                </div>
                                <input type="text" placeholder="ชื่อเมนู" className="w-full p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-amber-200 bg-white font-bold" value={editingMenu.name} onChange={e => setEditingMenu({...editingMenu, name: e.target.value})} />
                                <div className="flex gap-2">
                                  <input type="number" placeholder="ราคาปกติ" className="w-1/2 p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-amber-200 bg-white font-bold" value={editingMenu.price} onChange={e => setEditingMenu({...editingMenu, price: e.target.value})} />
                                  <select className="w-1/2 p-3.5 rounded-2xl text-xs outline-none shadow-2xs bg-white border border-amber-200 font-bold text-slate-700" value={editingMenu.category} onChange={e => setEditingMenu({...editingMenu, category: e.target.value})}>
                                    {CATEGORIES.filter(c => c !== '🔥 เมนูขายดี').map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>

                                <div className="p-3 bg-white rounded-2xl border border-amber-200 text-left">
                                  <label className="text-[10px] font-bold text-amber-900 block mb-2">ระดับความหวานที่เลือกได้:</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {SWEETNESS.map(level => {
                                      const current = editingMenu.allowedSweetness || SWEETNESS;
                                      const isSelected = current.includes(level);
                                      return (
                                        <button
                                          key={level}
                                          type="button"
                                          onClick={() => {
                                            const updated = isSelected 
                                              ? current.filter(s => s !== level) 
                                              : [...current, level];
                                            setEditingMenu({ ...editingMenu, allowedSweetness: updated });
                                          }}
                                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                            isSelected ? 'bg-amber-800 text-white border-amber-800 shadow-2xs' : 'bg-slate-50 text-slate-400 border-slate-200'
                                          }`}
                                        >
                                          {level}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <label className="col-span-2 flex items-center justify-center gap-1.5 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 cursor-pointer transition-all">
                                    <input type="checkbox" checked={editingMenu.isOnlyBlend} onChange={e => setEditingMenu({...editingMenu, isOnlyBlend: e.target.checked, allowBlend: e.target.checked ? true : editingMenu.allowBlend})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                                    <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1"><Zap size={13} className="text-blue-500" fill="currentColor"/> เป็นเมนูเฉพาะปั่นเท่านั้น</span>
                                  </label>

                                  <label className={`flex items-center justify-center gap-1 p-2.5 rounded-2xl border cursor-pointer transition-all ${editingMenu.isOnlyBlend ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-white border-slate-200'}`}>
                                    <input type="checkbox" disabled={editingMenu.isOnlyBlend} checked={editingMenu.isOnlyBlend || editingMenu.allowBlend !== false} onChange={e => setEditingMenu({...editingMenu, allowBlend: e.target.checked})} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                                    <span className="text-[10px] font-bold text-slate-600">มีเมนูปั่น</span>
                                  </label>

                                  <label className="flex items-center justify-center gap-1 p-2.5 bg-white rounded-2xl border border-slate-200 cursor-pointer transition-all">
                                    <input type="checkbox" checked={editingMenu.allowTopping !== false} onChange={e => setEditingMenu({...editingMenu, allowTopping: e.target.checked})} className="w-4 h-4 accent-amber-700 cursor-pointer" />
                                    <span className="text-[10px] font-bold text-slate-600">ท็อปปิ้งได้</span>
                                  </label>

                                  <label className="flex items-center justify-center gap-1 p-2.5 bg-white rounded-2xl border border-slate-200 cursor-pointer transition-all">
                                    <input type="checkbox" checked={editingMenu.hasFreePearl} onChange={e => setEditingMenu({...editingMenu, hasFreePearl: e.target.checked})} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Star size={11} className="text-amber-500" fill="currentColor"/> มุกฟรี</span>
                                  </label>

                                  <label className="flex items-center justify-center gap-1 p-2.5 bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition-all">
                                    <input type="checkbox" checked={editingMenu.isSoldOut} onChange={e => setEditingMenu({...editingMenu, isSoldOut: e.target.checked})} className="w-4 h-4 accent-slate-600 cursor-pointer" />
                                    <span className="text-[10px] font-bold text-slate-600">ปิดขายชั่วคราว</span>
                                  </label>

                                  <label className="col-span-2 flex items-center justify-center gap-1.5 p-3 bg-rose-50/80 rounded-2xl border border-rose-200/80 cursor-pointer transition-all">
                                    <input type="checkbox" checked={editingMenu.isPromoted} onChange={e => setEditingMenu({...editingMenu, isPromoted: e.target.checked})} className="w-4 h-4 accent-rose-600 cursor-pointer" />
                                    <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1"><Star size={13} className="text-rose-500" fill="currentColor"/> ตั้งเป็นเมนูแนะนำ</span>
                                  </label>

                                  {editingMenu.category === 'มัทฉะ' && (
                                    <label className="col-span-2 flex items-center justify-center gap-1.5 p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 cursor-pointer transition-all">
                                      <input type="checkbox" checked={editingMenu.hasTeaType} onChange={e => setEditingMenu({...editingMenu, hasTeaType: e.target.checked})} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                                      <span className="text-[10px] font-bold text-emerald-800">🍵 ให้ลูกค้าเลือกผงชาได้</span>
                                    </label>
                                  )}
                                </div>

                                {editingMenu.allowBlend !== false && editingMenu.category !== 'สมูทตี้โยเกิร์ต' && editingMenu.category !== 'ผลไม้และสมูทตี้' && (
                                  <div className="mt-1 text-left">
                                    <label className="text-[10px] font-bold text-slate-400 ml-1">บวกราคาเพิ่มสำหรับปั่น (บาท)</label>
                                    <input type="number" placeholder="เช่น 5" className="w-full mt-1 p-3.5 rounded-2xl text-xs outline-none shadow-2xs bg-white border border-slate-200 font-bold" value={editingMenu.blendPrice} onChange={e => setEditingMenu({...editingMenu, blendPrice: e.target.value})} />
                                  </div>
                                )}

                                <label className="cursor-pointer bg-white border border-slate-200 p-3.5 rounded-2xl text-xs font-bold block shadow-2xs text-slate-400 hover:text-amber-800 transition-all mt-2">
                                  <Upload size={16} className="inline mr-2"/> {editingMenu.image ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพเมนู'}
                                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                                    const file = e.target.files[0];
                                    if (file) { try { setEditingMenu({...editingMenu, image: await compressImage(file)}); } catch(err) { console.error(err); } }
                                  }} />
                                </label>
                                
                                <div className="flex gap-2 pt-1">
                                  <button onClick={() => setEditingMenu(null)} className="flex-1 bg-white border border-slate-200 text-slate-500 py-3 rounded-2xl font-bold text-xs">ยกเลิก</button>
                                  <button onClick={handleUpdateMenu} className="flex-[2] bg-amber-800 text-white py-3 rounded-2xl font-bold text-xs shadow-md active:scale-97 transition-all flex items-center justify-center gap-1.5"><Save size={16}/> บันทึกการแก้ไข</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: ตั้งค่าร้าน */}
            {adminTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-slate-200 space-y-3 shadow-inner relative">
                  <h3 className="font-bold text-xs text-indigo-700 uppercase tracking-wider text-center flex items-center justify-center gap-1.5"><Palette size={15}/> เลือกธีมร้านค้า</h3>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                     {Object.entries(THEMES).map(([key, theme]) => (
                        <button key={key} onClick={() => updateTheme(key)} className={`py-3 px-2 rounded-2xl font-bold text-[10px] shadow-2xs transition-all border flex items-center justify-center gap-1 ${storeSettings.theme === key ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'}`}>
                           {theme.name}
                        </button>
                     ))}
                  </div>

                  {storeSettings.theme === 'custom' && (
                     <div className="mt-3 p-4 bg-white/90 rounded-2xl border border-indigo-100 shadow-2xs animate-in fade-in">
                        <label className="text-[10px] font-bold text-indigo-900 mb-2 block text-center">🖼️ อัปโหลดรูปพื้นหลังร้าน</label>
                        <div className="flex flex-col gap-2.5">
                           <label className="cursor-pointer bg-white border-2 border-dashed border-indigo-200 text-indigo-600 py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-2xs hover:bg-indigo-50 transition-all">
                             <Upload size={18}/> {editCustomBgImage ? 'เปลี่ยนรูปพื้นหลัง' : 'เลือกรูปภาพ'}
                             <input type="file" accept="image/*" className="hidden" onChange={async e => {
                               const file = e.target.files[0];
                               if(file) {
                                 try {
                                   const compressedImage = await compressImage(file, 1200, 1200, 0.8); 
                                   setEditCustomBgImage(compressedImage);
                                 } catch(err) { console.error(err); }
                               }
                             }} />
                           </label>
                           // [MODIFIED] Continuation of Settings Tab & Modals with High-End UX/UI Refinements

                           {editCustomBgImage && <img src={editCustomBgImage} className="w-full h-28 object-cover rounded-xl shadow-xs border border-slate-200" alt="Bg Preview" />}
                           {editCustomBgImage && (
                              <button onClick={async () => {
                                 try { 
                                    await setDoc(doc(db, 'settings', 'store'), { customBgImage: editCustomBgImage }, { merge: true }); 
                                    showAlert('บันทึกรูปพื้นหลังสำเร็จ! 🎨'); 
                                 } catch(e) { showAlert(e.message); }
                              }} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-97 transition-all">
                                 บันทึกรูปพื้นหลัง
                              </button>
                           )}
                        </div>
                     </div>
                  )}
                </div>
                
                <div className="bg-amber-50/80 p-5 rounded-3xl border-2 border-dashed border-amber-200/80 space-y-3 shadow-inner relative">
                  <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider text-center">สถานะร้าน และ วัตถุดิบ</h3>
                  <div className="flex justify-center gap-2 pt-1">
                    <button onClick={() => updateStoreStatus(true)} className={`flex-1 py-3 rounded-2xl font-bold flex justify-center items-center gap-1.5 shadow-2xs transition-all text-xs ${storeSettings.isStoreOpen !== false ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-400 border border-slate-200'}`}><CheckCircle size={16}/> เปิดร้านแล้ว</button>
                    <button onClick={() => updateStoreStatus(false)} className={`flex-1 py-3 rounded-2xl font-bold flex justify-center items-center gap-1.5 shadow-2xs transition-all text-xs ${storeSettings.isStoreOpen === false ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-400 border border-slate-200'}`}><X size={16}/> ปิดร้านแล้ว</button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-amber-200/50">
                    <label className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-2xs border border-amber-200/60 cursor-pointer transition-all">
                      <div>
                        <p className="font-bold text-xs text-slate-800 flex items-center gap-1">🚫 วันนี้ไม่มีเมนูปั่น</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ปิดรับออร์เดอร์ที่เป็นเมนูปั่นทั้งหมด</p>
                      </div>
                      <input type="checkbox" checked={storeSettings.isBlendOut || false} onChange={async (e) => {
                         try { await setDoc(doc(db, 'settings', 'store'), { isBlendOut: e.target.checked }, { merge: true }); } catch(err) { showAlert(err.message); }
                      }} className="w-4 h-4 accent-amber-600 cursor-pointer" />
                    </label>
                  </div>
                </div>

                <div className="bg-rose-50/80 p-5 rounded-3xl border-2 border-dashed border-rose-200/80 space-y-3 shadow-inner relative">
                  <h3 className="font-bold text-xs text-rose-700 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">🤖 ปิดร้านอัตโนมัติ (คิวล้น)</h3>
                  
                  <div className="mt-1">
                    <label className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-2xs border border-rose-200/60 cursor-pointer transition-all">
                      <div>
                        <p className="font-bold text-xs text-slate-800 flex items-center gap-1">🛑 ระบบปิดร้านออโต้เมื่อคิวเยอะ</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ช่วยปิดร้านแทนแอดมิน เพื่อกันลูกค้ารอนาน</p>
                      </div>
                      <input type="checkbox" checked={editAutoCloseEnabled} onChange={e => setEditAutoCloseEnabled(e.target.checked)} className="w-4 h-4 accent-rose-600 cursor-pointer" />
                    </label>
                  </div>

                  <div className={`transition-all space-y-2.5 ${editAutoCloseEnabled ? 'opacity-100 h-auto' : 'opacity-40 h-auto pointer-events-none'}`}>
                    <label className="text-[10px] text-slate-500 block font-bold">จำนวนคิวสูงสุดก่อนปิดรับออร์เดอร์</label>
                    <input type="number" placeholder="เช่น 3" className="w-full p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-rose-200 bg-white text-slate-800 font-bold" value={editMaxQueue} onChange={e => setEditMaxQueue(Number(e.target.value))} />

                    <div className="pt-1">
                      <label className="text-[10px] text-slate-500 mb-1.5 block font-bold">เลือกวันที่จะให้ระบบคิวอัตโนมัติทำงาน</label>
                      <div className="flex flex-wrap gap-1.5">
                        {THAI_DAYS.map((day, idx) => {
                          const isSelected = editAutoCloseDays.includes(idx);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setEditAutoCloseDays(prev => 
                                  prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                );
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                isSelected 
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' 
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button onClick={async () => {
                    try { 
                      await setDoc(doc(db, 'settings', 'store'), { 
                        autoCloseEnabled: editAutoCloseEnabled, 
                        maxQueue: editMaxQueue,
                        autoCloseDays: editAutoCloseDays
                      }, { merge: true }); 
                      showAlert('อัปเดตระบบปิดร้านอัตโนมัติเรียบร้อย! 🛑'); 
                    } catch(e) { showAlert("Error: " + e.message); }
                  }} className="w-full bg-rose-600 text-white py-3.5 rounded-2xl font-bold text-xs active:scale-97 transition-all shadow-md mt-2">
                    บันทึกระบบคิวอัตโนมัติ
                  </button>
                </div>

                <div className="bg-slate-50/80 p-5 rounded-3xl border-2 border-dashed border-slate-200 space-y-3 shadow-inner relative">
                  <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider text-center">ตั้งค่าช่องทางชำระเงิน</h3>
                  
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block font-bold">หมายเลขพร้อมเพย์</label>
                    <input type="text" placeholder="เช่น 0812345678" className="w-full p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-slate-200 font-bold text-slate-800" value={editPromptPay} onChange={e => setEditPromptPay(e.target.value)} />
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] text-slate-500 mb-1 block font-bold">รูป QR Code ของร้าน</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-white border border-slate-200 text-slate-500 py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-slate-50 transition-all">
                        <Upload size={15}/> {editQrCodeImage ? 'เปลี่ยนรูป QR Code' : 'เลือกรูปภาพ'}
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files[0];
                          if(file) { try { const compressedImage = await compressImage(file); setEditQrCodeImage(compressedImage); } catch(err) { console.error(err); } }
                        }} />
                      </label>
                      {editQrCodeImage && <img src={editQrCodeImage} className="w-12 h-12 rounded-xl object-cover shadow-2xs border border-slate-200 bg-white" alt="QR Preview" />}
                      {editQrCodeImage && <button onClick={() => setEditQrCodeImage('')} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>}
                    </div>
                  </div>

                  <button onClick={async () => {
                    try { await setDoc(doc(db, 'settings', 'store'), { promptPayNo: editPromptPay, qrCodeImage: editQrCodeImage }, { merge: true }); showAlert('อัปเดตการตั้งค่าร้านสำเร็จ! 🐮'); } catch(e) { showAlert("Error: " + e.message); }
                  }} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-xs active:scale-97 transition-all shadow-md mt-2">
                    บันทึกการตั้งค่าร้าน
                  </button>
                </div>

                <div className="bg-blue-50/80 p-5 rounded-3xl border-2 border-dashed border-blue-200/80 space-y-3 shadow-inner relative">
                  <h3 className="font-bold text-xs text-blue-700 uppercase tracking-wider text-center flex items-center justify-center gap-1.5"><BellRing size={15}/> แจ้งเตือนออร์เดอร์ (LINE)</h3>
                  
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block font-bold">ลิงก์เพิ่มเพื่อนร้าน (LINE Official Account)</label>
                    <input type="text" placeholder="เช่น https://lin.ee/xxxxx" className="w-full p-3.5 rounded-2xl text-xs outline-none shadow-2xs border border-blue-200 transition-all text-blue-800 font-bold bg-white" value={editShopLineUrl} onChange={e => setEditShopLineUrl(e.target.value)} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-blue-100">
                    <label className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-2xs border border-blue-100 cursor-pointer transition-all">
                      <div>
                        <p className="font-bold text-xs text-slate-800 flex items-center gap-1">🔔 เปิดแจ้งเตือนผ่าน LINE ส่วนตัว</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">บอทจะทักไปบอกทันทีที่มีออร์เดอร์</p>
                      </div>
                      <input type="checkbox" checked={editNotifyAdmin} onChange={e => setEditNotifyAdmin(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    </label>
                  </div>

                  <div className={`transition-all ${editNotifyAdmin ? 'opacity-100 h-auto' : 'opacity-40 h-auto pointer-events-none'}`}>
                    <label className="text-[10px] text-slate-500 mb-1 block font-bold">LINE User ID ของแอดมิน</label>
                    <div className="flex gap-2">
                       <input type="text" placeholder="ระบบจะดึงให้อัตโนมัติ..." className="flex-1 p-3.5 rounded-2xl text-[10px] outline-none shadow-2xs border border-blue-200 bg-white text-slate-500 font-bold" value={editAdminLineId} onChange={e => setEditAdminLineId(e.target.value)} readOnly />
                       <button onClick={() => setEditAdminLineId(lineProfile.userId)} className="bg-blue-600 text-white px-3 rounded-2xl text-[10px] font-bold shadow-2xs active:scale-95 whitespace-nowrap hover:bg-blue-700 transition-colors">ดึง ID</button>
                    </div>
                  </div>

                  <button onClick={async () => {
                    if (editNotifyAdmin && !editAdminLineId) return showAlert('กรุณากดดึง LINE ID ก่อนบันทึกครับ');
                    try { await setDoc(doc(db, 'settings', 'store'), { notifyAdmin: editNotifyAdmin, adminLineId: editAdminLineId, shopLineUrl: editShopLineUrl }, { merge: true }); showAlert('อัปเดตการแจ้งเตือนและลิงก์ร้านสำเร็จ! 🎉'); } catch(e) { showAlert("Error: " + e.message); }
                  }} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-xs active:scale-97 transition-all shadow-md mt-2">
                    บันทึกการแจ้งเตือน
                  </button>
                </div>

                <div className="bg-emerald-50/80 p-5 rounded-3xl border-2 border-dashed border-emerald-200/80 space-y-3 shadow-inner relative">
                  <h3 className="font-bold text-xs text-emerald-800 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                    <Database size={15}/> เชื่อมต่อ Google Sheets & Dashboard
                  </h3>
                  
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block font-bold">Google Apps Script Web App URL</label>
                    <input 
                      type="text" 
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec" 
                      className="w-full p-3.5 rounded-2xl text-[11px] outline-none shadow-2xs border border-emerald-200 font-mono font-bold text-emerald-900 bg-white" 
                      value={editGoogleSheetUrl} 
                      onChange={e => setEditGoogleSheetUrl(e.target.value)} 
                    />
                    <p className="text-[9px] text-emerald-600 font-bold mt-1.5 leading-normal">
                      * ระบบจะทำการบันทึกทุกๆ ออร์เดอร์และอัปเดตสถานะส่งตรงเข้า Google Sheets แบบ Real-time
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={async () => {
                        if (!editGoogleSheetUrl) return showAlert('กรุณากรอก Web App URL ก่อนกดทดสอบครับ');
                        showAlert('กำลังส่งข้อมูลทดสอบ...');
                        await sendOrderToGoogleSheets({
                          orderId: "TEST-" + Math.floor(Math.random()*1000),
                          timestamp: Date.now(),
                          lineName: "ทดสอบระบบ",
                          items: [{ name: "นมสดเย็น (ทดสอบ)", qty: 1, price: 45, sweetness: "100%" }],
                          total: 45,
                          paymentMethod: "promptpay",
                          status: "completed",
                          deliveryLocation: "room",
                          address: "ทดสอบการเชื่อมต่อ Google Sheets",
                          note: "ระบบทำงานปกติ ✨"
                        });
                        showAlert('ส่งข้อมูลทดสอบเรียบร้อยแล้วค่ะ! กรุณาเช็คในตาราง Google Sheets ของคุณ 🐮');
                      }} 
                      className="w-1/3 bg-white border border-emerald-300 text-emerald-700 py-3 rounded-2xl font-bold text-xs shadow-2xs active:scale-95 transition-all hover:bg-emerald-100"
                    >
                      🧪 ทดสอบส่ง
                    </button>

                    <button 
                      onClick={async () => {
                        try { 
                          await setDoc(doc(db, 'settings', 'store'), { googleSheetUrl: editGoogleSheetUrl }, { merge: true }); 
                          showAlert('บันทึกการเชื่อมต่อ Google Sheets สำเร็จ! 📊'); 
                        } catch(e) { showAlert("Error: " + e.message); }
                      }} 
                      className="w-2/3 bg-emerald-600 text-white py-3 rounded-2xl font-bold text-xs active:scale-97 transition-all shadow-md hover:bg-emerald-700"
                    >
                      บันทึก URL Google Sheets
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* --- Modal เลือกออปชันเมนูเครื่องดื่มตอนสั่งซื้อ --- */}
      {optionModalItem && (() => {
        const isItemBlendedInPreview = optionModalItem.isOnlyBlend || tempOptions.isBlended;
        const previewToppingsPrice = (tempOptions.selectedToppings || []).reduce((sum, t) => sum + Number(t.price), 0);
        const previewSaucesPrice = (tempOptions.selectedSauces || []).reduce((sum, s) => sum + Number(s.price || 0), 0);
        const previewShotPrice = tempOptions.addShot ? 20 : 0;
        const isWhipOrCreamCheese = isWhipOrCreamCheeseItem(optionModalItem);
        const previewIcePrice = (!isItemBlendedInPreview && !isWhipOrCreamCheese && tempOptions.separateIce) ? 5 : 0;
        const previewTotalPrice = optionModalItem.price + (isItemBlendedInPreview ? getAddedBlendPrice(optionModalItem) : 0) + previewToppingsPrice + previewSaucesPrice + previewShotPrice + previewIcePrice;

        const isWhipCreamOrSauceItem = isWhipOrCreamCheese;

        const allowedSweetnessList = (optionModalItem.allowedSweetness && optionModalItem.allowedSweetness.length > 0) 
          ? optionModalItem.allowedSweetness 
          : SWEETNESS;

        return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-xs p-3 animate-in fade-in">
          
          <div className="bg-white rounded-t-[3rem] w-full max-w-md animate-in slide-in-from-bottom-full duration-400 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
            
            <div className="w-full h-[28vh] relative flex-shrink-0 bg-slate-50">
              <img src={optionModalItem.image} alt={optionModalItem.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
            </div>

            <div className="p-6 pt-4 space-y-6 overflow-y-auto hide-scrollbar flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-black text-slate-900">{optionModalItem.name}</h3>
                  <p className="text-xs text-amber-800 font-extrabold mt-0.5">เริ่มต้น ฿{optionModalItem.price}</p>
                </div>
                <button onClick={() => setOptionModalItem(null)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><X size={18}/></button>
              </div>

              <div className="space-y-6">
                
                {!isWhipOrCreamCheese && allowedSweetnessList.length > 0 && (
                  <div>
                    <label className="text-[10px] font-black block mb-2.5 text-slate-400 uppercase tracking-wider">ระดับความหวาน</label>
                    <div className="grid grid-cols-3 gap-2">
                      {allowedSweetnessList.map(l => (
                        <button key={l} onClick={() => setTempOptions({...tempOptions, sweetness: l})} className={`py-3 rounded-2xl text-xs font-extrabold border transition-all ${tempOptions.sweetness === l ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}

                {optionModalItem.category === 'กาแฟ' && (
                  <div className="space-y-3">
                     <div>
                       <label className="text-[10px] font-black block mb-2.5 text-amber-900 uppercase tracking-wider flex items-center gap-1"><Coffee size={13} fill="currentColor"/> เลือกระดับการคั่วเมล็ดกาแฟ</label>
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setTempOptions({...tempOptions, bean: 'คั่วกลาง'})} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${tempOptions.bean === 'คั่วกลาง' ? 'bg-amber-800 text-white border-amber-800 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>คั่วกลาง<br/><span className="text-[9px] font-normal opacity-80">หอมนุ่ม ละมุน</span></button>
                         <button onClick={() => setTempOptions({...tempOptions, bean: 'คั่วเข้ม'})} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${tempOptions.bean === 'คั่วเข้ม' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>คั่วเข้ม<br/><span className="text-[9px] font-normal opacity-80">เข้มข้น ถึงใจ</span></button>
                       </div>
                     </div>

                     <label className={`flex justify-between items-center p-3.5 rounded-2xl border cursor-pointer transition-all ${tempOptions.addShot ? 'border-amber-800 bg-amber-50/60' : 'border-slate-200 bg-slate-50/60'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${tempOptions.addShot ? 'bg-amber-800 text-white' : 'bg-white border border-slate-300'}`}>
                            {tempOptions.addShot && <Check size={12} />}
                          </div>
                          <span className={`text-xs font-bold ${tempOptions.addShot ? 'text-slate-900' : 'text-slate-600'}`}>เพิ่มช็อตกาแฟ</span>
                        </div>
                        <span className="text-xs font-bold text-amber-800">+฿20</span>
                        <input type="checkbox" className="hidden" checked={tempOptions.addShot || false} onChange={(e) => setTempOptions({...tempOptions, addShot: e.target.checked})} />
                     </label>
                  </div>
                )}

                {optionModalItem.hasTeaType && (
                  <div className="space-y-3">
                     <div>
                       <label className="text-[10px] font-black block mb-2.5 text-emerald-900 uppercase tracking-wider flex items-center gap-1">🍵 เลือกรสชาติผงชา</label>
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setTempOptions({...tempOptions, teaType: 'มัทฉะ'})} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${tempOptions.teaType === 'มัทฉะ' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>มัทฉะ<br/><span className="text-[9px] font-normal opacity-80">หอมเข้มข้น ดั้งเดิม</span></button>
                         <button onClick={() => setTempOptions({...tempOptions, teaType: 'โฮจิฉะ'})} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${tempOptions.teaType === 'โฮจิฉะ' ? 'bg-amber-800 text-white border-amber-800 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>โฮจิฉะ<br/><span className="text-[9px] font-normal opacity-80">หอมคั่ว ละมุน</span></button>
                       </div>
                     </div>
                  </div>
                )}

                {isWhipCreamOrSauceItem && (
                  <div>
                    <label className="text-[10px] font-black block mb-2.5 text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      ✨ เลือกราดซอสแต่งหน้า
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sauces.map(s => {
                        const isSelected = tempOptions.selectedSauces?.some(item => typeof item === 'object' ? item.id === s.id : item === s.name);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setTempOptions(prev => {
                                const currentSauces = prev.selectedSauces || [];
                                if (isSelected) {
                                  return { ...prev, selectedSauces: currentSauces.filter(item => typeof item === 'object' ? item.id !== s.id : item !== s.name) };
                                } else {
                                  return { ...prev, selectedSauces: [...currentSauces, { id: s.id, name: s.name, price: Number(s.price || 0) }] };
                                }
                              });
                            }}
                            className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between ${isSelected ? 'bg-amber-800 text-white border-amber-800 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                          >
                            <span className="truncate">{s.name}</span>
                            {isSelected ? <Check size={14} className="text-white flex-shrink-0" /> : <Plus size={14} className="text-slate-300 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {optionModalItem.hasFreePearl && (
                  <div>
                     <label className="text-[10px] font-black block mb-2.5 text-amber-600 uppercase tracking-wider flex items-center gap-1"><Star size={11} fill="currentColor"/> แถมมุกฟรี!</label>
                     <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setTempOptions({...tempOptions, addPearl: true})} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${tempOptions.addPearl ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>รับมุก (ฟรี)</button>
                       <button onClick={() => setTempOptions({...tempOptions, addPearl: false})} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${!tempOptions.addPearl ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white text-slate-500 border-slate-200'}`}>ไม่รับมุกฟรี</button>
                     </div>
                  </div>
                )}

                {toppings.length > 0 && optionModalItem.allowTopping !== false && (
                  <div>
                    <label className="text-[10px] font-black block mb-2.5 text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      🍨 เลือกท็อปปิ้งเสริม
                    </label>
                    <div className="space-y-2">
                      {toppings.map(t => {
                        const isSelected = tempOptions.selectedToppings?.find(st => st.id === t.id);
                        return (
                          <label key={t.id} className={`flex justify-between items-center p-3 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-amber-800 bg-amber-50/60' : 'border-slate-200 bg-slate-50/60'}`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center ${isSelected ? 'bg-amber-800 text-white' : 'bg-white border border-slate-300'}`}>
                                {isSelected && <Check size={12} />}
                              </div>
                              <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{t.name}</span>
                            </div>
                            <span className="text-xs font-bold text-amber-800">+฿{t.price}</span>
                            <input type="checkbox" className="hidden" checked={!!isSelected} onChange={() => {
                              setTempOptions(prev => {
                                const currentToppings = prev.selectedToppings || [];
                                if (isSelected) return { ...prev, selectedToppings: currentToppings.filter(st => st.id !== t.id) };
                                return { ...prev, selectedToppings: [...currentToppings, t] };
                              });
                            }} />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isItemBlendedInPreview && !isWhipOrCreamCheese && (
                  <div className="space-y-2 animate-in fade-in">
                     <label className="text-[10px] font-black block mb-1 text-slate-400 uppercase tracking-wider">การเสิร์ฟ</label>
                     <label className={`flex justify-between items-center p-3.5 rounded-2xl border cursor-pointer transition-all ${tempOptions.separateIce ? 'border-amber-800 bg-amber-50/60 shadow-inner' : 'border-slate-200 bg-slate-50/60'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${tempOptions.separateIce ? 'bg-amber-800 text-white' : 'bg-white border border-slate-300'}`}>
                            {tempOptions.separateIce && <Check size={12} />}
                          </div>
                          <span className={`text-xs font-bold ${tempOptions.separateIce ? 'text-slate-900' : 'text-slate-600'}`}>แยกน้ำแข็ง (ใส่ถุงซิปล็อค)</span>
                        </div>
                        <span className="text-xs font-bold text-amber-800">+฿5</span>
                        <input type="checkbox" className="hidden" checked={tempOptions.separateIce || false} onChange={(e) => setTempOptions({...tempOptions, separateIce: e.target.checked})} />
                     </label>
                  </div>
                )}

                {!isWhipOrCreamCheese && (
                  optionModalItem.isOnlyBlend ? (
                    <div className="grid grid-cols-1 gap-3">
                       <button onClick={() => setTempOptions({...tempOptions, isBlended: true, separateIce: false})} disabled={storeSettings.isBlendOut} className={`py-5 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${storeSettings.isBlendOut ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-blue-300 bg-blue-50 text-blue-700 shadow-2xs'}`}>
                         <Zap size={24}/><span className="text-xs uppercase">เฉพาะปั่น (สมูทตี้) {getAddedBlendPrice(optionModalItem) > 0 ? `(+฿${getAddedBlendPrice(optionModalItem)})` : ''}</span>
                       </button>
                    </div>
                  ) : optionModalItem.allowBlend !== false ? (
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => setTempOptions({...tempOptions, isBlended: false})} className={`py-5 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${!tempOptions.isBlended ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-400 bg-white'}`}><Coffee size={24}/><span className="text-xs uppercase">เย็น / ปกติ</span></button>
                       <button onClick={() => !storeSettings.isBlendOut && setTempOptions({...tempOptions, isBlended: true, separateIce: false})} disabled={storeSettings.isBlendOut} className={`py-5 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${storeSettings.isBlendOut ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : (tempOptions.isBlended ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-400 bg-white')}`}><Zap size={24}/><span className="text-xs uppercase text-center">{storeSettings.isBlendOut ? 'เมนูปั่นหมด' : `ปั่น ${getAddedBlendPrice(optionModalItem) > 0 ? `(+฿${getAddedBlendPrice(optionModalItem)})` : ''}`}</span></button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                       <button onClick={() => setTempOptions({...tempOptions, isBlended: false})} className={`py-5 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all border-slate-900 bg-slate-900 text-white shadow-md`}><Coffee size={24}/><span className="text-xs uppercase">เย็น / ปกติ</span></button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button onClick={() => {
                  const toppingsPrice = (tempOptions.selectedToppings || []).reduce((sum, t) => sum + Number(t.price), 0);
                  const saucesPrice = (tempOptions.selectedSauces || []).reduce((sum, s) => sum + Number(s.price || 0), 0);
                  const shotPrice = tempOptions.addShot ? 20 : 0;
                  const isItemBlended = optionModalItem.isOnlyBlend || tempOptions.isBlended;
                  const icePrice = (!isItemBlended && !isWhipOrCreamCheese && tempOptions.separateIce) ? 5 : 0;
                  const finalP = optionModalItem.price + (isItemBlended ? getAddedBlendPrice(optionModalItem) : 0) + toppingsPrice + saucesPrice + shotPrice + icePrice;
                  
                  const toppingsStr = (tempOptions.selectedToppings || []).map(t => t.id).sort().join('-');
                  const saucesStr = (tempOptions.selectedSauces || []).map(s => typeof s === 'object' ? s.id : s).sort().join('-');
                  const beanStr = tempOptions.bean ? `-${tempOptions.bean}` : '';
                  const teaStr = tempOptions.teaType ? `-${tempOptions.teaType}` : '';
                  const shotStr = tempOptions.addShot ? `-addShot` : '';
                  const iceStr = (!isItemBlended && !isWhipOrCreamCheese && tempOptions.separateIce) ? `-separateIce` : '';
                  
                  const cartId = `${optionModalItem.id}-${isWhipOrCreamCheese ? 'nowhip' : tempOptions.sweetness}-${isItemBlended}-${tempOptions.addPearl}-${toppingsStr}-${saucesStr}${beanStr}${teaStr}${shotStr}${iceStr}`;
                  
                  setCart(prev => {
                    const ex = prev.find(i => i.cartId === cartId);
                    if (ex) return prev.map(i => i.cartId === cartId ? { ...i, qty: i.qty + 1 } : i);
                    return [...prev, { ...optionModalItem, price: finalP, cartId, ...tempOptions, isBlended: isItemBlended, qty: 1 }];
                  });
                  setOptionModalItem(null);
                }} className="w-full py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-2xl font-bold text-base active:scale-97 flex items-center justify-center gap-2 shadow-lg transition-all">
                  <Plus size={20}/> เพิ่มลงตะกร้า • ฿{previewTotalPrice}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal ถ่ายรูปยืนยันการส่งของ */}
      {deliveryModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-800">ยืนยันการจัดส่งออร์เดอร์</h3>
              <button onClick={() => setDeliveryModal(null)} className="text-slate-400 p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">จุดส่งสินค้า</label>
               <div className="grid grid-cols-3 gap-2">
                 <button onClick={() => setDeliveryLocation('room')} className={`py-3 rounded-2xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${deliveryLocation === 'room' ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs' : 'border-slate-100 text-slate-400 bg-white'}`}><Home size={18}/><span className="text-[10px]">หน้าห้อง</span></button>
                 <button onClick={() => setDeliveryLocation('building')} className={`py-3 rounded-2xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${deliveryLocation === 'building' ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs' : 'border-slate-100 text-slate-400 bg-white'}`}><Building size={18}/><span className="text-[10px]">หน้าตึก</span></button>
                 <button onClick={() => { setDeliveryLocation('pickup'); setDeliveryImage(''); }} className={`py-3 rounded-2xl border-2 font-bold flex flex-col items-center gap-1 transition-all ${deliveryLocation === 'pickup' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs' : 'border-slate-100 text-slate-400 bg-white'}`}><UserCheck size={18}/><span className="text-[10px]">รับเองที่ร้าน</span></button>
               </div>
            </div>

            {deliveryLocation !== 'pickup' && (
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center animate-in fade-in">
                   <p className="text-xs font-bold mb-2.5 text-slate-800">แนบรูปถ่ายจัดส่ง</p>
                   <label className="cursor-pointer bg-white border border-slate-200 text-slate-600 py-2.5 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all">
                      <Camera size={15}/> {deliveryImage ? 'เปลี่ยนรูปภาพ' : 'ถ่ายรูป / เลือกรูปภาพ'}
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                         const file = e.target.files[0];
                         if(file){ setDeliveryImage(await compressImage(file)); }
                      }} />
                   </label>
                   {deliveryImage && <img src={deliveryImage} className="mt-3 h-28 w-full object-cover rounded-xl shadow-xs border border-slate-200" alt="Delivery Proof"/>}
                </div>
            )}

            <button onClick={handleConfirmDelivery} disabled={isDelivering || (deliveryLocation !== 'pickup' && !deliveryImage)} className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-97 flex items-center justify-center gap-1.5 ${deliveryLocation === 'pickup' || deliveryImage ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              {isDelivering ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
              {isDelivering ? 'กำลังบันทึก...' : <><CheckCircle size={16}/> ยืนยันการจัดส่ง</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal ดูรูปภาพสลิป */}
      {selectedSlip && selectedSlip !== 'cash_payment' && selectedSlip !== 'thaichueithai_payment' && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border-2 border-white/20 animate-in zoom-in-95" alt="slip preview" />
        </div>
      )}

      {/* Modal แจ้งเตือนร้านปิด */}
      {showStoreClosedModal && (
        <div className="fixed inset-0 bg-black/80 z-[350] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-5 border-2 border-rose-500 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              <AlertCircle size={36} />
            </div>
            <h3 className="text-xl font-bold text-rose-600 leading-tight">ขณะนี้ร้านปิดให้บริการ 🐮</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              ขออภัยด้วยนะคะ ขณะนี้ทางร้านปิดรับออเดอร์ชั่วคราวค่ะ แต่สามารถเลือกชมเมนูก่อนได้นะคะ 💖
            </p>
            <button 
              onClick={() => setShowStoreClosedModal(false)}
              className="w-full bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              รับทราบ (เข้าชมเมนูเครื่องดื่ม)
            </button>
          </div>
        </div>
      )}

      {/* Modal สั่งซื้อสำเร็จ */}
      {successModalData && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-5 animate-in zoom-in-95 border-2 border-amber-800 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={28}/>
            </div>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">
              {successModalData.autoSent ? "🐮 สั่งซื้อสำเร็จแล้วค่ะ!" : "⚠️ ขั้นตอนสุดท้าย!"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {successModalData.autoSent 
                ? "ระบบได้ส่งข้อมูลบิลเข้าไปในแชต LINE ของคุณเรียบร้อยแล้วค่ะ สามารถกดแชร์บิลเพิ่มเติมได้เลยค่ะ" 
                : "รบกวนกดปุ่มสีเขียวด้านล่างเพื่อแชร์ข้อมูลบิลใบนี้ส่งตรงไปยัง LINE ของร้านนะคะ 💖"
              }
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-dashed border-slate-300 text-left max-h-32 overflow-y-auto">
              <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-sans leading-normal">{successModalData.text}</pre>
            </div>

            <div className="space-y-2">
              <button 
                onClick={async () => {
                  navigator.clipboard.writeText(successModalData.text);
                  
                  if (window.liff && window.liff.isLoggedIn() && window.liff.isApiAvailable('shareTargetPicker')) {
                    try {
                      await window.liff.shareTargetPicker([{ type: "text", text: successModalData.text }]);
                    } catch (err) {
                      window.open(`https://line.me/R/share?text=${encodeURIComponent(successModalData.text)}`, '_blank');
                    }
                  } else {
                    window.open(`https://line.me/R/share?text=${encodeURIComponent(successModalData.text)}`, '_blank');
                    if (storeSettings.shopLineUrl) {
                      setTimeout(() => { window.location.href = storeSettings.shopLineUrl; }, 1200);
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 w-full bg-[#06C755] text-white py-3.5 rounded-2xl text-xs font-bold shadow-md active:scale-95 hover:bg-emerald-600 transition-all"
              >
                <Share2 size={16}/> แชร์บิลไปที่ LINE 💬
              </button>
              <button 
                onClick={() => { setSuccessModalData(null); setView('myOrders'); }}
                className="w-full text-slate-400 py-2 text-xs font-bold hover:text-slate-600"
              >
                เสร็จสิ้น / ดูรายการคำสั่งซื้อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal สรุปผลส่งของสำเร็จ (แอดมิน) */}
      {adminDeliverySuccessData && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle size={28}/></div>
            <h3 className="text-lg font-bold text-slate-800">อัปเดตสถานะสำเร็จ! 🛵</h3>
            <p className="text-xs text-slate-500 leading-relaxed">บันทึกการส่งสำเร็จแล้ว สามารถแชร์แจ้งลูกค้าทาง LINE ได้เลยครับ</p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-dashed text-left max-h-36 overflow-y-auto">
              <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-sans leading-normal">{adminDeliverySuccessData.text}</pre>
            </div>

            <div className="space-y-2">
              <a 
                href={`https://line.me/R/share?text=${encodeURIComponent(adminDeliverySuccessData.text)}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#06C755] text-white py-3.5 rounded-2xl text-xs font-bold shadow-md active:scale-95 hover:bg-emerald-600"
              >
                <Share2 size={16}/> แชร์สถานะผ่าน LINE
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(adminDeliverySuccessData.text);
                  showAlert("คัดลอกข้อความสำเร็จ! นำไปวางในแชตลูกค้าได้เลยครับ");
                }}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold active:scale-95 hover:bg-slate-200"
              >
                คัดลอกข้อความ
              </button>
              <button onClick={() => setAdminDeliverySuccessData(null)} className="w-full text-slate-400 py-1.5 text-xs font-bold">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดาวน์โหลดรูปพรีวิว */}
      {downloadPreview && (
        <div className="fixed inset-0 bg-black/95 z-[250] flex flex-col items-center justify-center p-4 animate-in fade-in">
          <p className="text-white font-bold mb-4 bg-emerald-600/90 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-xl border border-emerald-400 text-xs text-center">
            <Download size={16}/> กดค้างที่รูปภาพเพื่อบันทึกลงเครื่อง (Save Image)
          </p>
          <img src={downloadPreview} className="max-w-full max-h-[60vh] rounded-2xl shadow-2xl border-2 border-white/20 animate-in zoom-in-95 pointer-events-auto" alt="preview to save" />
          <button onClick={() => setDownloadPreview(null)} className="mt-6 bg-white text-slate-800 px-6 py-3 rounded-2xl font-bold text-xs active:scale-95 shadow-md flex items-center gap-2">
            <X size={16}/> ปิดหน้าต่าง
          </button>
        </div>
      )}

      {/* Modal แอดมินล็อกอิน */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <h3 className="font-bold text-lg mb-6 text-slate-900">แอดมินเข้าสู่ระบบ</h3>
            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl mb-6 text-center text-2xl outline-none tracking-[0.4em] focus:border-amber-800 focus:bg-white transition-all shadow-inner font-bold text-slate-800" placeholder="••••••" />
            <div className="flex gap-3">
              <button onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-2xl hover:bg-slate-200 transition-colors">ยกเลิก</button>
              <button onClick={() => {
                if(adminPassword === '570402') { 
                  localStorage.setItem('happycow_isAdmin', 'true');
                  setView('admin'); 
                  setAdminTab('orders'); 
                  setShowAdminModal(false); 
                  setAdminPassword(''); 
                }
                else { showAlert('รหัสผ่านไม่ถูกต้องครับ!'); setAdminPassword(''); }
              }} className="flex-1 py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-95 hover:bg-slate-800">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Message Box */}
      {msgBox.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            {msgBox.type === 'confirm' ? (
              <AlertCircle size={42} className="text-amber-500 mx-auto mb-4" />
            ) : (
              <CheckCircle size={42} className="text-emerald-500 mx-auto mb-4" />
            )}

            <h3 className="font-bold text-xs text-slate-800 mb-6 whitespace-pre-line leading-relaxed">{msgBox.message}</h3>

            {msgBox.type === 'confirm' ? (
              <div className="flex gap-2.5">
                <button 
                  onClick={() => setMsgBox({ ...msgBox, isOpen: false })} 
                  className="flex-1 py-3 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={() => {
                    if (msgBox.onConfirm) msgBox.onConfirm();
                    setMsgBox({ ...msgBox, isOpen: false });
                  }} 
                  className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-opacity shadow-md"
                >
                  ตกลง
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setMsgBox({ ...msgBox, isOpen: false });
                  if (msgBox.message.includes("สำเร็จ") && window.liff && window.liff.isInClient() && msgBox.message.includes("คุณ")) {
                      window.liff.closeWindow();
                  }
                }} 
                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-opacity shadow-md"
              >
                รับทราบ
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}