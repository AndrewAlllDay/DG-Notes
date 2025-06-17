// src/components/AuthModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Make sure to use .jsx here
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const { signInWithGoogle, signUpWithEmail, signInWithEmail, loading, error } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const modalRef = useRef(null);

    useEffect(() => {
        setLocalError('');
        // Clear form fields when modal opens or closes, or form type changes
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    }, [isSignUp, isOpen]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!email || !password) {
            setLocalError('Email and password are required.');
            return;
        }

        if (isSignUp) {
            if (password !== confirmPassword) {
                setLocalError('Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                setLocalError('Password must be at least 6 characters long.');
                return;
            }
            try {
                await signUpWithEmail(email, password);
                onClose();
            } catch (err) {
                // Error handled by AuthContext, displayed via `error` state
            }
        } else {
            try {
                await signInWithEmail(email, password);
                onClose();
            } catch (err) {
                // Error handled by AuthContext, displayed via `error` state
            }
        }
    };

    const handleGoogleAuth = async () => {
        try {
            await signInWithGoogle();
            onClose();
        } catch (err) {
            // Error handled by AuthContext
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] backdrop-blur-sm opacity-100 transition-opacity duration-300">
            <div
                ref={modalRef}
                className="relative bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-auto animate-fade-in-up"
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>

                {error && (
                    <p className="text-red-500 text-center mb-4 text-sm">{error}</p>
                )}
                {localError && (
                    <p className="text-red-500 text-center mb-4 text-sm">{localError}</p>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isSignUp && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>

                <div className="relative flex justify-center items-center my-6">
                    <span className="absolute bg-white px-2 text-gray-500 text-sm">OR</span>
                    <div className="w-full border-t border-gray-300"></div>
                </div>

                <button
                    onClick={handleGoogleAuth}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={loading}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5 mr-2" />
                    {loading ? 'Processing...' : 'Sign In with Google'}
                </button>
            </div>
        </div>
    );
}