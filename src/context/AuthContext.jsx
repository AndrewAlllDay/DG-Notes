// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase'; // Import the auth instance

// 1. Create the Auth Context
const AuthContext = createContext();

// 2. Custom hook to use the Auth Context easily throughout your app
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Auth Provider Component - this will wrap your entire application
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Authentication Functions ---

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            setLoading(true);
            setError(null);
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Error signing in with Google:", err);
            setError(err.message || "Failed to sign in with Google.");
        } finally {
            setLoading(false);
        }
    };

    const signUpWithEmail = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error("Error signing up with email:", err);
            let errorMessage = "Failed to sign up.";
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already in use. Try logging in instead.";
            } else if (err.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. It must be at least 6 characters.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            }
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error("Error signing in with email:", err);
            let errorMessage = "Failed to log in.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            }
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signOutUser = async () => {
        try {
            setLoading(true);
            setError(null);
            await signOut(auth);
            setCurrentUser(null); // Explicitly clear user on sign out
        } catch (err) {
            console.error("Error signing out:", err);
            setError(err.message || "Failed to sign out.");
        } finally {
            setLoading(false);
        }
    };

    // Effect to listen for authentication state changes from Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        error,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOutUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#6B7280' }}>
                    Loading user...
                </div>
            )}
        </AuthContext.Provider>
    );
};