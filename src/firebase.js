// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- ADD THIS LINE to import Auth service

const firebaseConfig = {
    apiKey: "AIzaSyB66h7I1mfB2Hc3c_Isr1nGiRWM9fUVusY",
    authDomain: "dg-caddy-notes.firebaseapp.com",
    projectId: "dg-caddy-notes",
    storageBucket: "dg-caddy-notes.firebasestorage.app",
    messagingSenderId: "307990631756",
    appId: "1:307990631756:web:240ca7aeeb0f419c7e2be9",
    measurementId: "G-1TD0VQ5CT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// <--- ADD THIS LINE to initialize and export Auth service
export const auth = getAuth(app);

export { db };