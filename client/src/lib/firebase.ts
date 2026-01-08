import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Using dummy config - in production this would be env vars
// For this demo, we'll gracefully handle missing config
const firebaseConfig = {
  apiKey: "AIzaSyD-placeholder-key",
  authDomain: "placeholder-app.firebaseapp.com",
  projectId: "placeholder-app",
  storageBucket: "placeholder-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
