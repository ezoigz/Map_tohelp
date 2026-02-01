// @ts-nocheck
import './style.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, onValue, onDisconnect, DatabaseReference } from "firebase/database"

// --- กำหนดชนิดข้อมูล ---
interface LocationData {
  lat: number;
  lng: number;
  type: 'elderly' | 'caregiver';
  time: number;
}

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

const isElderlyPage: boolean = window.location.pathname.includes('elderly.html');
const role: 'elderly' | 'caregiver' = isElderlyPage ? 'elderly' : 'caregiver';
const myId: string = `${role}_${Math.floor(Math.random() * 1000)}`;

const elderlyIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2815/2815428.png',
  iconSize: [45, 45], iconAnchor: [22, 45]
});
const caregiverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png',
  iconSize: [45, 45], iconAnchor: [22, 45]
});

const appDiv = document.querySelector<HTMLDivElement>('#app')!;
if (role === 'elderly') {
  appDiv.innerHTML = `
    <div id="map" style="height: 100vh; width: 100vw; filter: grayscale(40%);"></div>
    <div style="position: absolute; bottom: 40px; width: 100%; text-align: center; z-index: 1000;">
      <div style="background: #ff4d4d; color: white; padding: 20px 40px; border-radius: 50px; font-size: 22px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
        🔴 กำลังส่งตำแหน่ง... (ผู้สูงอายุ)
      </div>
    </div>`;
} else {
  appDiv.innerHTML = `<div id="map" style="height: 100vh; width: 100vw;"></div>`;
}

const map = L.map('map').setView([13.75, 100.5], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers: Record<string, L.Marker> = {};
let hasCentered = false;

onValue(ref(db, 'locations'), (snapshot) => {
  const data = snapshot.val() as Record<string, LocationData> | null;
  if (!data) return;

  Object.keys(data).forEach((id) => {
    const { lat, lng, type } = data[id];
    const icon = type === 'elderly' ? elderlyIcon : caregiverIcon;

    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
    } else {
      markers[id] = L.marker([lat, lng], { icon }).addTo(map)
        .bindTooltip(type === 'elderly' ? "ผู้สูงอายุ" : "ผู้ดูแล", {
          permanent: true,
          direction: 'top',
          offset: [0, -40]
        });
    }
  });
});

navigator.geolocation.watchPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  const userRef: DatabaseReference = ref(db, 'locations/' + myId);

  set(userRef, {
    lat: latitude,
    lng: longitude,
    type: role,
    time: Date.now()
  });

  onDisconnect(userRef).remove();

  if (role === 'caregiver' && !hasCentered) {
    map.setView([latitude, longitude], 16);
    hasCentered = true;
  }
}, (err) => console.error(err), { enableHighAccuracy: true });