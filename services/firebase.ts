import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAA10OUHUTZ_zU1l49UDbsnvA4JVh2KdSg",
  authDomain: "physiomanager-73d16.firebaseapp.com",
  projectId: "physiomanager-73d16",
  storageBucket: "physiomanager-73d16.firebasestorage.app",
  messagingSenderId: "949932536072",
  appId: "1:949932536072:web:3accb8b4380e7f5d10bcbd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);