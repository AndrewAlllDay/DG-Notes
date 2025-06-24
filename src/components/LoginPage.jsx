// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useFirebase } from '../firebase'; // Import useFirebase hook
import { setUserProfile } from '../services/firestoreService'; // Import setUserProfile
import { LogIn } from 'lucide-react'; // Import LogIn icon from lucide-react

export default function LoginPage() {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithGoogle, auth } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false); // To toggle between login and register forms

    // Determine if the form is valid (both email and password have content)
    const isFormValid = email.trim() !== '' && password.trim() !== '';

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (!isFormValid) { // Use the isFormValid check
            setError('Please enter both email and password.');
            return;
        }

        try {
            if (isRegistering) {
                console.log("DEBUG LoginPage: Attempting to register user with email:", email);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('DEBUG LoginPage: User registered successfully! UserCredential:', userCredential);

                // --- NEW: Create a default user profile in Firestore ---
                if (userCredential.user) {
                    const defaultProfileData = {
                        displayName: userCredential.user.email.split('@')[0], // Default display name from email
                        role: 'non-player', // <--- CHANGED: Default role for new users is 'non-player'
                        email: userCredential.user.email // Store email for easier lookup/display
                    };
                    console.log("DEBUG LoginPage: Attempting to set user profile for UID:", userCredential.user.uid, "with data:", defaultProfileData);
                    await setUserProfile(userCredential.user.uid, defaultProfileData);
                    console.log("DEBUG LoginPage: Default user profile created in Firestore for new user.");
                }
                // --- END NEW ---

                alert('Registration successful! You are now logged in.');
            } else {
                console.log("DEBUG LoginPage: Attempting to log in user with email:", email);
                await signInWithEmailAndPassword(auth, email, password);
                console.log('DEBUG LoginPage: User logged in successfully!');
                alert('Login successful!');
            }
        } catch (err) {
            console.error("DEBUG LoginPage: Authentication error during email/password flow:", err);
            // More user-friendly error messages
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This user account has been disabled.';
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Try logging in.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
            }
            setError(errorMessage);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null); // Clear previous errors
        try {
            console.log("DEBUG LoginPage: Attempting Google sign-in.");
            const userCredential = await signInWithGoogle(); // Call the Google sign-in function from useFirebase
            console.log('DEBUG LoginPage: Signed in with Google successfully! UserCredential:', userCredential);

            // --- NEW: Create a default user profile for Google Sign-in if it doesn't exist ---
            // This is important because Google sign-in might not immediately have a profile
            // or we want to ensure our custom role/displayName is set.
            if (userCredential.user) {
                const profileDataForGoogleUser = {
                    displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
                    role: 'non-player', // <--- CHANGED: Default role for new Google users is 'non-player'
                    email: userCredential.user.email // Store email
                };
                console.log("DEBUG LoginPage: Attempting to set user profile for Google UID:", userCredential.user.uid, "with data:", profileDataForGoogleUser);
                await setUserProfile(userCredential.user.uid, profileDataForGoogleUser);
                console.log("DEBUG LoginPage: Default user profile ensured for Google user.");
            }
            // --- END NEW ---

            alert('Google login successful!');
        } catch (err) {
            console.error("DEBUG LoginPage: Google authentication error:", err);
            let errorMessage = 'Failed to sign in with Google. Please try again.';
            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Google login window closed.';
            } else if (err.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Login request was cancelled.';
            }
            setError(errorMessage);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    {isRegistering ? 'Register' : 'Login'}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        aria-label="Email"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        aria-label="Password"
                    />
                    <button
                        type="submit"
                        disabled={!isFormValid} // Disable button if form is not valid
                        className={`w-full text-white p-3 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2
                            ${isFormValid
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' // Green when valid
                                : 'bg-gray-400 cursor-not-allowed' // Gray and disabled when invalid
                            }`
                        }
                    >
                        {isRegistering ? 'Register Account' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-blue-600 hover:underline focus:outline-none"
                    >
                        {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                    </button>
                </div>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="w-full bg-red-600 text-white p-3 rounded-md font-semibold hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center gap-2"
                    aria-label="Sign in with Google"
                >
                    {/* Updated SVG for Google Logo */}
                    <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M44.5 20H24V28.9H35.4C34.3 32.5 30.7 35 26 35C20.4 35 15.8 30.5 15.8 24.9C15.8 19.3 20.4 14.8 26 14.8C29.1 14.8 31.7 16 33.6 17.7L39.4 12C35.4 8.3 30.4 6 24 6C12.7 6 3.6 15 3.6 25C3.6 35 12.7 44 24 44C34.7 44 43.1 36.6 43.1 26.6C43.1 25.1 43.1 23.6 42.9 22.1L44.5 20Z" fill="#4285F4" />
                        <path d="M24 44C30.6 44 36.1 41.5 40 37.4L33.6 30.7C31.5 32.5 28.9 33.7 26 33.7C21.4 33.7 17.5 30.4 16.1 25.7L10.3 30.2C12.2 33.8 17.7 37 24 37V44Z" fill="#34A853" />
                        <path d="M8.1 28.5L2.3 24L8.1 19.5C9.9 17.9 12.1 16.7 14.8 16.7C17.5 16.7 19.7 17.9 21.5 19.5L27.3 15C25.4 13.1 22.9 12 20 12C14.4 12 9.8 16.5 9.8 22.1C9.8 23.6 9.8 25.1 10.1 26.6L8.1 28.5Z" fill="#FBC02D" />
                        <path d="M44.5 20H24V6H20.9C14.3 6 8.8 8.5 4.9 12.6L11.3 19.3C13.4 17.5 16.1 16.3 19 16.3C23.6 16.3 27.5 19.6 28.9 24.3L34.7 28.8C36.6 25.2 40 22 40 22L44.5 20Z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
