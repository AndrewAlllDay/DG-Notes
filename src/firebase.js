// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { getUserProfile } from './services/firestoreService'; // Import getUserProfile

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

console.log("DEBUG firebase.js: Before getAuth(app) - app object:", app);
// Initialize Auth (removed 'export' here to avoid duplicate export)
const auth = getAuth(app);
console.log("DEBUG firebase.js: After getAuth(app) - auth object:", auth);


// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Custom hook to provide Firebase services and authentication state
// Now accepts onLoginSuccess and onLogoutSuccess callbacks
export const useFirebase = (onLoginSuccess, onLogoutSuccess) => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const isInitialAuthCheckDone = useRef(false); // To track if the first auth check is complete

    useEffect(() => {
        let unsubscribeAuth;

        const setupAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                    console.log("DEBUG useFirebase: Signed in with custom token.");
                }

                unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        console.log("DEBUG useFirebase: onAuthStateChanged - User UID:", currentUser.uid);

                        // Fetch user profile to get display name and other custom data
                        const profileData = await getUserProfile(currentUser.uid);
                        let displayN = currentUser.displayName;

                        if (profileData && profileData.displayName) {
                            displayN = profileData.displayName;
                            console.log("DEBUG useFirebase: Fetched custom display name from profile:", displayN);
                        } else {
                            console.log("DEBUG useFirebase: User profile not found in Firestore for UID:", currentUser.uid);
                        }

                        // Create a combined user object with auth data and custom profile data
                        setUser({
                            ...currentUser,
                            displayName: displayN,
                            role: profileData?.role || 'non-player' // Add role from profile, default to 'non-player'
                        });

                        // Trigger onLoginSuccess only if this isn't the initial auth check on app load
                        if (isInitialAuthCheckDone.current && typeof onLoginSuccess === 'function') {
                            console.log("DEBUG useFirebase: Triggering onLoginSuccess callback.");
                            onLoginSuccess(currentUser.uid);
                        }

                    } else {
                        console.log("DEBUG useFirebase: onAuthStateChanged - User signed out.");
                        setUser(null);
                        // Trigger onLogoutSuccess only if a user was previously logged in
                        // and this isn't just the initial 'null' state on first load.
                        if (isInitialAuthCheckDone.current && typeof onLogoutSuccess === 'function') {
                            console.log("DEBUG useFirebase: Triggering onLogoutSuccess callback.");
                            onLogoutSuccess();
                        }
                    }
                    setIsAuthReady(true);
                    isInitialAuthCheckDone.current = true; // Mark initial check as done
                });

            } catch (error) {
                console.error("DEBUG useFirebase: Firebase Auth setup error:", error);
                setIsAuthReady(true);
                isInitialAuthCheckDone.current = true; // Mark initial check as done even on error
            }
        };

        setupAuth();

        return () => {
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []); // Empty dependency array means this runs once on mount

    // Function to sign in with Google
    const signInWithGoogle = async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            console.log("DEBUG: Signed in with Google successfully!");
            return userCredential; // Return the userCredential for LoginPage to use
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
        signInWithEmailAndPassword: (email, password) => signInWithEmailAndPassword(auth, email, password),
        createUserWithEmailAndPassword: (email, password) => createUserWithEmailAndPassword(auth, email, password),
        signOut: () => signOut(auth),
        signInWithGoogle
    };
    console.log("DEBUG: useFirebase hook returning:", returnedValue);
    return returnedValue;
};

// Export db and auth for direct use if preferred
export { db, auth };
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
