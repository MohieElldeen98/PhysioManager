// @ts-ignore
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper to safely get env vars without crashing if env is undefined
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // ignore
  }
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // ignore
  }
  return undefined;
};

// Fallback values are provided to ensure the app runs even if .env injection fails
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || "AIzaSyAA10OUHUTZ_zU1l49UDbsnvA4JVh2KdSg",
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "physiomanager-73d16.firebaseapp.com",
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || "physiomanager-73d16",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "physiomanager-73d16.firebasestorage.app",
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "949932536072",
  appId: getEnv("VITE_FIREBASE_APP_ID") || "1:949932536072:web:3accb8b4380e7f5d10bcbd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);