import './style.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, onValue } from "firebase/database"

// 1. ใส่ Config ของคุณ
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

// สุ่ม ID หรือจะตั้งเอง เช่น 'elderly'
const myId = 'user_' + Math.floor(Math.random() * 1000);

// 2. สร้างหน้าจอแผนที่
document.querySelector('#app').innerHTML = `
  <div style="position: relative;">
    <div id="map" style="height: 100vh; width: 100vw;"></div>
    <div style="position: absolute; top: 10px; left: 50px; z-index: 1000; background: white; padding: 10px; border-radius: 5px;">
      ID ของคุณ: <b>${myId}</b>
    </div>
  </div>
`;

const map = L.map('map').setView([13.75, 100.5], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};

// 3. ฟังตำแหน่ง Real-time จาก Firebase
onValue(ref(db, 'locations'), (snapshot) => {
  const data = snapshot.val();
  for (let id in data) {
    const { lat, lng } = data[id];
    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
    } else {
      markers[id] = L.marker([lat, lng]).addTo(map).bindPopup("ตำแหน่ง: " + id);
    }
  }
});

// 4. ส่งตำแหน่งตัวเองเมื่อขยับ
navigator.geolocation.watchPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  set(ref(db, 'locations/' + myId), {
    lat: latitude,
    lng: longitude,
    time: Date.now()
  });

  // ให้แผนที่เลื่อนตามเราในครั้งแรก
  if (!markers[myId]) map.setView([latitude, longitude], 15);
}, err => {
  alert("กรุณาเปิด GPS และกดยอมรับการเข้าถึงตำแหน่ง");
}, { enableHighAccuracy: true });
// ช่วยให้แผนที่คำนวณขนาดพื้นที่ใหม่เมื่อ CSS โหลดเสร็จ
setTimeout(() => {
  map.invalidateSize();
}, 100);