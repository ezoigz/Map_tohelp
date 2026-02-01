import './style.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, onValue, onDisconnect } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyD8o4B6IDJvqRzSQHvEXM2ZtYHS659621s",
  authDomain: "chawalit-4a4f4.firebaseapp.com",
  databaseURL: "https://chawalit-4a4f4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chawalit-4a4f4",
  storageBucket: "chawalit-4a4f4.firebasestorage.app",
  messagingSenderId: "750026941935",
  appId: "1:1:750026941935:web:51f84010e7d4ccddf0821a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- [ ส่วนที่แก้: เช็คบทบาทจาก URL อัตโนมัติ ] ---
const urlParams = new URLSearchParams(window.location.search);
// ถ้า URL มี ?role=elderly จะเป็นผู้สูงอายุทันที ถ้าไม่มีจะเป็นผู้ดูแล
const role = urlParams.get('role') === 'elderly' ? 'elderly' : 'caregiver';
const myId = role + '_' + Math.floor(Math.random() * 1000);

// ไอคอนรูปคน
const elderlyIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2815/2815428.png',
  iconSize: [45, 45], iconAnchor: [22, 45]
});
const caregiverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png',
  iconSize: [45, 45], iconAnchor: [22, 45]
});

// UI หน้าเว็บ
document.querySelector('#app').innerHTML = `
  <div style="position: relative;">
    <div id="map" style="height: 100vh; width: 100vw;"></div>
    <div style="position: absolute; top: 10px; left: 10px; z-index: 1000; background: rgba(255,255,255,0.8); padding: 8px; border-radius: 5px; font-size: 14px;">
      สถานะ: <b>${role === 'elderly' ? '🔴 กำลังส่งตำแหน่งผู้สูงอายุ' : '🟢 โหมดผู้ดูแล'}</b>
    </div>
  </div>
`;

const map = L.map('map').setView([13.75, 100.5], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};

// ดึงตำแหน่งทุกคนมาโชว์
onValue(ref(db, 'locations'), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  for (let id in data) {
    const { lat, lng, type } = data[id];
    const iconToUse = (type === 'elderly') ? elderlyIcon : caregiverIcon;
    const labelText = (type === 'elderly') ? "ผู้ที่มีภาวะพึ่งพิง" : "ผู้ดูแล";

    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
    } else {
      markers[id] = L.marker([lat, lng], { icon: iconToUse }).addTo(map)
        .bindTooltip(labelText, { permanent: true, direction: 'top', offset: [0, -40] }).openTooltip();
    }
  }
});

// ส่งตำแหน่งอัตโนมัติ
navigator.geolocation.watchPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  const userRef = ref(db, 'locations/' + myId);
  set(userRef, { lat: latitude, lng: longitude, type: role, time: Date.now() });
  onDisconnect(userRef).remove();

  // ถ้าเป็นผู้ดูแล ให้แผนที่เลื่อนไปหาตัวเองในครั้งแรก
  if (!markers[myId] && role === 'caregiver') map.setView([latitude, longitude], 15);
}, null, { enableHighAccuracy: true });

setTimeout(() => { map.invalidateSize(); }, 500);