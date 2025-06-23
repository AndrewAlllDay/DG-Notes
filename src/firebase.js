// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, doc, getDoc } from 'firebase/firestore'; // Import doc and getDoc
// Import all necessary auth functions: email/password sign-in/up, onAuthStateChanged, signOut, Google
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useEffect, useState, createContext, useContext } from 'react';

// Import the subscribeToUserProfile function from firestoreService
import { subscribeToUserProfile } from './services/firestoreService';


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
// Note: This needs to be called *before* any Firestore operations
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log('DEBUG: Firestore offline persistence enabled!');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one.
                console.warn('DEBUG: Firestore persistence failed: Multiple tabs open or another instance already enabled persistence.');
            } else if (err.code === 'unimplemented') {
                // The browser doesn't support all of the features required to enable persistence.
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
    const [user, setUser] = useState(null); // Store the full user object
    const [isAuthReady, setIsAuthReady] = useState(false); // New state to indicate auth readiness
    const [userProfile, setUserProfileState] = useState(null); // New state for user's custom profile

    useEffect(() => {
        let unsubscribeAuth;
        let unsubscribeProfile;

        const setupAuth = async () => {
            try {
                // Use __initial_auth_token provided by Canvas environment for initial sign-in
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                    console.log("DEBUG: Signed in with custom token.");
                }
                // IMPORTANT: No automatic anonymous sign-in here. User must log in via LoginPage.

                // Set up auth state change listener
                unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => { // Added async here
                    if (currentUser) {
                        console.log("DEBUG: Auth State Changed: User UID:", currentUser.uid);

                        // Subscribe to user profile for real-time updates on displayName and role
                        unsubscribeProfile = subscribeToUserProfile(currentUser.uid, (profileData) => {
                            console.log("DEBUG: subscribeToUserProfile callback. Profile Data:", profileData);
                            setUserProfileState(profileData); // Update userProfileState

                            // Combine Firebase Auth user data with Firestore profile data
                            setUser({
                                ...currentUser, // Spread existing auth user properties
                                // Override or set displayName and role from Firestore profile
                                displayName: profileData?.displayName || currentUser.displayName || null,
                                role: profileData?.role || 'user', // Default to 'user' role if not set
                                profileData: profileData // Keep the raw profile data too if needed
                            });
                        });

                    } else {
                        // User is signed out
                        setUser(null);
                        setUserProfileState(null); // Clear profile state on sign out
                        console.log("DEBUG: Auth State Changed: User signed out.");
                    }
                    setIsAuthReady(true); // Auth state has been checked at least once
                });

            } catch (error) {
                console.error("DEBUG: Firebase Auth setup error:", error);
                setIsAuthReady(true); // Still set to true so the app can attempt to proceed even on auth error
            }
        };

        setupAuth();

        // Cleanup listeners on component unmount
        return () => {
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
        };
    }, []); // Empty dependency array means this runs once on mount

    // Function to sign in with Google
    const signInWithGoogle = async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleProvider); // Capture the userCredential
            console.log("DEBUG: Signed in with Google successfully!");
            return userCredential; // RETURN the userCredential
        } catch (error) {
            console.error("DEBUG: Error signing in with Google:", error);
            throw error; // Re-throw the error for the component to handle
        }
    };


    const returnedValue = {
        db,
        auth, // Explicitly return the auth object
        user, // This is the enhanced user object with Firestore displayName and role
        userId: user ? user.uid : null, // userId remains the raw UID
        isAuthReady,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        signOut, // Export the signOut function
        signInWithGoogle // Export the new Google sign-in function
    };
    console.log("DEBUG: useFirebase hook returning:", returnedValue);
    return returnedValue;
};

// You can export db and auth directly if you prefer, but useFirebase is the recommended way to get auth state
export { db, auth };
// Also, ensure signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup are exported if needed globally

// Use the __app_id global variable if available, otherwise use a default
// IMPORTANT: This export is crucial for firestoreService.jsx
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
