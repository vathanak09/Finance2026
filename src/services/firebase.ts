import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDdSd3fW5TfEus56E3L1LzAc1C5s0p9PHw",
  authDomain: "finance-record-vathanak.firebaseapp.com",
  databaseURL: "https://finance-record-vathanak-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "finance-record-vathanak",
  storageBucket: "finance-record-vathanak.firebasestorage.app",
  messagingSenderId: "355419681968",
  appId: "1:355419681968:web:d1bf2577f1aa3662eef775",
  measurementId: "G-6VNCXB5K16"
};

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
