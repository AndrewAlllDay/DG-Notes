// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useFirebase } from '../firebase'; // Import useFirebase hook
import { setUserProfile, getUserProfile } from '../services/firestoreService'; // Import setUserProfile and getUserProfile
import { LogIn } from 'lucide-react'; // Import LogIn icon from lucide-react
import GoogleLogo from '../assets/google-logo.svg'; // Import your Google logo image

export default function LoginPage() {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithGoogle, auth } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false); // To toggle between login and register forms
    // New state for in-app messages
    const [appMessage, setAppMessage] = useState({ type: '', text: '' }); // type: 'success' or 'error'

    // Function to show a temporary in-app message
    const showAppMessage = (type, text) => {
        setAppMessage({ type, text });
        setTimeout(() => {
            setAppMessage({ type: '', text: '' }); // Clear message after 5 seconds
        }, 5000);
    };

    // Determine if the form is valid (both email and password have content)
    const isFormValid = email.trim() !== '' && password.trim() !== '';

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setAppMessage({ type: '', text: '' }); // Clear any previous app messages

        if (!isFormValid) { // Use the isFormValid check
            setError('Please enter both email and password.');
            return;
        }

        try {
            if (isRegistering) {
                console.log("DEBUG LoginPage: Attempting to register user with email:", email);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('DEBUG LoginPage: User registered successfully! UserCredential:', userCredential);

                // --- NEW: Create a default user profile in Firestore for NEW registrations ---
                if (userCredential.user) {
                    const defaultProfileData = {
                        displayName: userCredential.user.email.split('@')[0], // Default display name from email
                        role: 'non-player', // Default role for NEW users
                        email: userCredential.user.email // Store email
                    };
                    console.log("DEBUG LoginPage: Creating user profile for NEW user UID:", userCredential.user.uid, "with data:", defaultProfileData);
                    await setUserProfile(userCredential.user.uid, defaultProfileData);
                    console.log("DEBUG LoginPage: Default user profile created in Firestore for new user.");
                }
                showAppMessage('success', 'Registration successful! You are now logged in.'); // Replaced alert
            } else { // This is a login attempt for an EXISTING user
                console.log("DEBUG LoginPage: Attempting to log in existing user with email:", email);
                await signInWithEmailAndPassword(auth, email, password);
                // For existing users, we DO NOT set the role here. The useFirebase hook
                // will fetch their existing profile from Firestore, which includes their role.
                console.log('DEBUG LoginPage: User logged in successfully! No role overwrite on login.');
                showAppMessage('success', 'Login successful!'); // Replaced alert
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
            setError(errorMessage); // Keep old error for specific form validation errors
            showAppMessage('error', errorMessage); // Show the same error as an in-app message
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null); // Clear previous errors
        setAppMessage({ type: '', text: '' }); // Clear any previous app messages
        try {
            console.log("DEBUG LoginPage: Attempting Google sign-in.");
            const userCredential = await signInWithGoogle(); // Call the Google sign-in function from useFirebase
            console.log('DEBUG LoginPage: Signed in with Google successfully! UserCredential:', userCredential);

            // --- NEW: Check if profile exists before setting default role for Google Sign-in ---
            if (userCredential.user) {
                const existingProfile = await getUserProfile(userCredential.user.uid);
                let profileDataToSet = {
                    displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
                    email: userCredential.user.email
                };

                if (!existingProfile) {
                    // Only set default role if profile is new
                    profileDataToSet.role = 'non-player';
                    console.log("DEBUG LoginPage: Creating NEW user profile for Google UID:", userCredential.user.uid, "with data:", profileDataToSet);
                } else {
                    console.log("DEBUG LoginPage: Google user profile already exists. Preserving existing role.");
                }

                await setUserProfile(userCredential.user.uid, profileDataToSet);
                console.log("DEBUG LoginPage: Google user profile ensured (created or updated).");
            }
            showAppMessage('success', 'Google login successful!'); // Replaced alert
        } catch (err) {
            console.error("DEBUG LoginPage: Google authentication error:", err);
            let errorMessage = 'Failed to sign in with Google. Please try again.';
            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Google login window closed.';
            } else if (err.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Login request was cancelled.';
            }
            setError(errorMessage); // Keep old error for specific form validation errors
            showAppMessage('error', errorMessage); // Show the same error as an in-app message
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    {isRegistering ? 'Register' : 'Login'}
                </h2>

                {/* Display form validation errors (if any, as before) */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* New in-app message display */}
                {appMessage.text && (
                    <div className={`px-4 py-3 rounded relative mb-4
                        ${appMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}
                        role="alert">
                        <span className="block sm:inline">{appMessage.text}</span>
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
                        className={`w-full p-3 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2
                            ${isFormValid
                                ? '!bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white' // Green when valid, text-white
                                : 'bg-gray-400 cursor-not-allowed text-black' // Gray and disabled when invalid, text-black
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
                    className="w-full bg-red-600 text-black p-3 rounded-md font-semibold hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center gap-2"
                    aria-label="Sign in with Google"
                >
                    {/* Replaced SVG with img tag using imported GoogleLogo */}
                    <img src={GoogleLogo} alt="Google logo" className="w-5 h-5" />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
