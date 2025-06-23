// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useEffect, useState, createContext, useContext } from 'react';


// Firebase configuration - This comes from your Firebase project settings
const defaultFirebaseConfig = {
    apiKey: "AIzaSyB66h7I1mfB2Hc3c_Isr1nGiRWM9fUVusY",
    authDomain: "dg-caddy-notes.firebaseapp.com",
    projectId: "dg-caddy-notes",
    storageBucket: "dg-caddy-notes.firebasestorage.app",
    messagingSenderId: "307990631756",
    appId: "1:307990631756:web:240ca7aeeb0f419c7e2be9",
    measurementId: "G-1TD0VQ5CT9"
};

let firebaseConfig = defaultFirebaseConfig;

// Attempt to parse __firebase_config from the Canvas environment
if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
        const parsedConfig = JSON.parse(__firebase_config);
        // Ensure the parsed config is not empty and has a projectId
        if (Object.keys(parsedConfig).length > 0 && parsedConfig.projectId) {
            firebaseConfig = parsedConfig;
            console.log("DEBUG: Using Firebase config from Canvas environment.");
        } else {
            console.warn("DEBUG: Canvas __firebase_config was empty or invalid, falling back to default config.");
        }
    } catch (e) {
        console.error("DEBUG: Failed to parse __firebase_config from Canvas, falling back to default config:", e);
    }
} else {
    console.warn("DEBUG: Canvas __firebase_config not defined or empty, falling back to default config.");
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence (optional, but good for PWAs)
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log('DEBUG: Firestore offline persistence enabled!');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('DEBUG: Firestore persistence failed: Multiple tabs open or another instance already enabled persistence.');
            } else if (err.code === 'unimplemented') {
                console.warn('DEBUG: Firestore persistence failed: Browser does not support persistence.');
            } else {
                console.error('DEBUG: Firestore persistence failed:', err);
            }
        });
} catch (error) {
    console.warn('DEBUG: Firestore persistence attempt failed (likely already initialized or not supported):', error);
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Create a context for Firebase services and user data
const FirebaseContext = createContext(null);

// Custom hook to provide Firebase services and authentication state
export const useFirebase = () => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        let unsubscribeAuth;

        const setupAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                    console.log("DEBUG: Signed in with custom token.");
                }

                unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                    if (currentUser) {
                        console.log("DEBUG: Auth State Changed: User UID:", currentUser.uid);
                    } else {
                        console.log("DEBUG: Auth State Changed: User signed out.");
                    }
                    setIsAuthReady(true);
                });

            } catch (error) {
                console.error("DEBUG: Firebase Auth setup error:", error);
                setIsAuthReady(true);
            }
        };

        setupAuth();

        return () => {
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            console.log("DEBUG: Signed in with Google successfully!");
        } catch (error) {
            console.error("DEBUG: Error signing in with Google:", error);
            throw error;
        }
    };

    const returnedValue = {
        db,
        auth,
        user,
        userId: user ? user.uid : null,
        isAuthReady,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        signOut,
        signInWithGoogle
    };
    console.log("DEBUG: useFirebase hook returning:", returnedValue);
    return returnedValue;
};

// You can export db and auth directly if you prefer, but useFirebase is the recommended way to get auth state
export { db, auth };

// Use the __app_id global variable if available, otherwise use a default
// IMPORTANT: This export is crucial for firestoreService.jsx
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
