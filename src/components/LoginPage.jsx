// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useFirebase } from '../firebase'; // Import useFirebase hook
import { LogIn } from 'lucide-react'; // Import LogIn icon from lucide-react

export default function LoginPage() {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithGoogle, auth } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false); // To toggle between login and register forms

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
                console.log('User registered successfully!');
                alert('Registration successful! You are now logged in.');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('User logged in successfully!');
                alert('Login successful!');
            }
        } catch (err) {
            console.error("Authentication error:", err);
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
            await signInWithGoogle(); // Call the Google sign-in function from useFirebase
            console.log('Signed in with Google successfully!');
            alert('Google login successful!');
        } catch (err) {
            console.error("Google authentication error:", err);
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
                        className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full !bg-red-600 text-white p-3 rounded-md font-semibold hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center gap-2"
                    aria-label="Sign in with Google"
                >
                    {/* Updated SVG for Google Logo */}

                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
