import './style.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, onValue, onDisconnect } from "firebase/database"

// 1. Firebase Config
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

// 2. ตรวจสอบบทบาท (?role=elderly หรือ ?role=caregiver)
const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role') === 'elderly' ? 'elderly' : 'caregiver';
const myId = role + '_' + Math.floor(Math.random() * 1000);

// 3. เตรียมไอคอน
const elderlyIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2815/2815428.png',
  iconSize: [45, 45], iconAnchor: [22, 45]
});
const caregiverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png',
  iconSize: [45, 45], iconAnchor: [22, 45]
});

// 4. สร้างหน้าจอ
document.querySelector('#app').innerHTML = `
  <div id="map" style="height: 100vh; width: 100vw;"></div>
  <div style="position: absolute; top: 10px; left: 10px; z-index: 1000; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <b>โหมด:</b> ${role === 'elderly' ? '<span style="color:red">ผู้สูงอายุ</span>' : '<span style="color:green">ผู้ดูแล</span>'}
  </div>
`;

// ตั้งค่าแผนที่เริ่มต้น (ที่กรุงเทพฯ ก่อน)
const map = L.map('map').setView([13.75, 100.5], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
setTimeout(() => map.invalidateSize(), 500);

const markers = {};
let hasCentered = false; // ตัวแปรคุมให้แผนที่เด้งไปหาแค่ครั้งแรก

// 5. แสดงตำแหน่งทุกคนแบบ Real-time
onValue(ref(db, 'locations'), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  for (let id in data) {
    const { lat, lng, type } = data[id];
    const icon = type === 'elderly' ? elderlyIcon : caregiverIcon;
    const label = type === 'elderly' ? "ผู้ที่มีภาวะพึ่งพิง" : "ผู้ดูแล";

    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
    } else {
      markers[id] = L.marker([lat, lng], { icon }).addTo(map)
        .bindTooltip(label, { permanent: true, direction: 'top', offset: [0, -40] }).openTooltip();
    }
  }
});

// 6. ส่งพิกัดตัวเอง และ "ดีด" แผนที่ไปหาผู้ดูแล
navigator.geolocation.watchPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  const userRef = ref(db, 'locations/' + myId);

  // ส่งไป Firebase
  set(userRef, { lat: latitude, lng: longitude, type: role, time: Date.now() });
  onDisconnect(userRef).remove();

  // --- ส่วนที่ทำให้แผนที่เด้งไปหาผู้ดูแลทันทีที่เปิดแมพ ---
  if (role === 'caregiver' && !hasCentered) {
    map.setView([latitude, longitude], 17); // ซูมเข้าไปที่ตัวเรา (สีเขียว)
    hasCentered = true; // ทำแค่ครั้งแรกครั้งเดียว
  }
}, (err) => {
  alert("กรุณาเปิด GPS");
}, { enableHighAccuracy: true, maximumAge: 0 });