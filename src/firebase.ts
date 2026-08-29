import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBw9WVCK4PG0MoYaHpNgliiuPZ20e26Ug8",
  authDomain: "maksad-68349.firebaseapp.com",
  projectId: "maksad-68349",
  storageBucket: "maksad-68349.firebasestorage.app",
  messagingSenderId: "715644365131",
  appId: "1:715644365131:web:dcdd9b39366f68d47060ce",
  measurementId: "G-PSN17QSTL1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
