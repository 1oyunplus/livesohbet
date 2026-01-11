import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWQPl0Q8-xaZYifhhXJPRGsPxUJnbT2CY",
  authDomain: "livesohbet-765db.firebaseapp.com",
  projectId: "livesohbet-765db",
  storageBucket: "livesohbet-765db.firebasestorage.app",
  messagingSenderId: "516721211152",
  appId: "1:516721211152:web:1c75ee5545884473a1d795",
  measurementId: "G-FPNM2BEXSC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Türkçe için Google provider ayarları
googleProvider.setCustomParameters({
  prompt: 'select_account'
});