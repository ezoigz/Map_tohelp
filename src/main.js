import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, onValue, onDisconnect } from "firebase/database"

// --- 1. CONFIGURATION (ใช้ของคุณ) ---
const firebaseConfig = {
  apiKey: "AIzaSyD8o4B6IDJvqRzSQHvEXM2ZtYHS659621s",
  authDomain: "chawalit-4a4f4.firebaseapp.com",
  databaseURL: "https://chawalit-4a4f4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chawalit-4a4f4",
  storageBucket: "chawalit-4a4f4.firebasestorage.app",
  messagingSenderId: "750026941935",
  appId: "1:750026941935:web:51f84010e7d4ccddf0821a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ถามบทบาทผู้ใช้
const role = confirm("คุณคือ 'ผู้ที่มีภาวะพึ่งพิง' (ผู้สูงอายุ) ใช่หรือไม่?\n(ตกลง = ใช่ / ยกเลิก = ผู้ดูแล)") ? 'elderly' : 'caregiver';
const myId = role + '_' + Math.floor(Math.random() * 1000);

// --- 2. MAP SETUP ---
const map = L.map('map').setView([13.75, 100.5], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// เพิ่มส่วนที่คุณต้องการ: คำนวณขนาดใหม่เมื่อ CSS โหลดเสร็จ
setTimeout(() => {
  map.invalidateSize();
}, 100);

// --- 3. CUSTOM ICONS (รูปคน แดง/เขียว) ---
const elderlyIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2815/2815428.png', // แดง
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  className: 'icon-elderly'
});

const caregiverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png', // เขียว
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  className: 'icon-caregiver'
});

const markers = {};

// --- 4. REAL-TIME LOGIC ---
onValue(ref(db, 'locations'), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  for (let id in data) {
    const { lat, lng, type } = data[id];
    const isElderly = type === 'elderly';
    const labelText = isElderly ? "ผู้ที่มีภาวะพึ่งพิง" : "ผู้ดูแล";
    const iconToUse = isElderly ? elderlyIcon : caregiverIcon;

    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
    } else {
      markers[id] = L.marker([lat, lng], { icon: iconToUse })
        .addTo(map)
        .bindTooltip(labelText, {
          permanent: true,
          direction: 'top',
          offset: [0, -40]
        }).openTooltip();
    }
  }
});

// ส่งพิกัดตัวเอง
navigator.geolocation.watchPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  const userRef = ref(db, 'locations/' + myId);

  set(userRef, {
    lat: latitude,
    lng: longitude,
    type: role,
    time: Date.now()
  });

  onDisconnect(userRef).remove();

  if (!markers[myId]) map.setView([latitude, longitude], 16);
}, err => alert("กรุณาเปิด GPS"), { enableHighAccuracy: true });