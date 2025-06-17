// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Import getFirestore for database access
// import { getAnalytics } from "firebase/analytics"; // Keep this if you want Analytics

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
// const analytics = getAnalytics(app); // Uncomment this line if you want to use Analytics

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db }; // Export db so you can use it in other files