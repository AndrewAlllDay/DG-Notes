import React, { useState } from 'react';
import { useFirebase } from '../firebase'; // Ensure useFirebase is correctly imported
import { setUserProfile, getUserProfile } from '../services/firestoreService'; // Import firestoreService functions
import GoogleLogoUrl from '../assets/google-logo.svg'; // Import the SVG as a URL

function LoginPage() {
    const {
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        signInWithGoogle, // Make sure this is destructured from useFirebase
        user, // Get the user object to check if logged in
        isAuthReady, // Keep this, but its direct usage for rendering "Loading authentication..." will be removed
        auth // Added auth object here for direct inspection
    } = useFirebase();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState(''); // State for display name input
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [appMessage, setAppMessage] = useState({ type: '', text: '' }); // Local state for messages

    const showAppMessage = (type, text) => {
        setAppMessage({ type, text });
        setTimeout(() => {
            setAppMessage({ type: '', text: '' });
        }, 5000); // Message disappears after 5 seconds
    };

    const isFormValid = email.trim() !== '' && password.trim() !== '';

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setAppMessage({ type: '', text: '' }); // Clear previous app messages

        if (!isFormValid || (isRegistering && displayNameInput.trim() === '')) {
            setError('Please fill in all required fields.');
            return;
        }

        console.log("DEBUG LoginPage handleAuth: Calling auth functions with:", {
            authInstance: auth,
            signInFunc: signInWithEmailAndPassword,
            createFunc: createUserWithEmailAndPassword
        });

        try {
            if (isRegistering) {
                // Register
                const userCredential = await createUserWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;
                // Set default profile data including display name and role
                await setUserProfile(uid, {
                    displayName: displayNameInput.trim(), // Use display name from input
                    email: email.trim(),
                    role: 'non-player' // Default role
                });
                showAppMessage('success', 'Registration successful! You are now logged in.');
                console.log("DEBUG LoginPage: Registered and created profile for UID:", uid);

            } else {
                // Login
                await signInWithEmailAndPassword(email, password);
                showAppMessage('success', 'Login successful!');
                console.log("DEBUG LoginPage: User logged in.");
            }
        } catch (err) {
            console.error("DEBUG LoginPage: Authentication error:", err.code, err.message, err); // Log full error object
            switch (err.code) {
                case 'auth/user-not-found':
                    setError('No user found with this email.');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address.');
                    break;
                case 'auth/email-already-in-use':
                    setError('This email is already registered.');
                    break;
                case 'auth/weak-password':
                    setError('Password should be at least 6 characters.');
                    break;
                default:
                    // This 'default' catch is where the recaptcha error would appear if uncaught specifically
                    setError(`Authentication failed: ${err.message || 'Please try again.'}`);
                    break;
            }
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setAppMessage({ type: '', text: '' });
        try {
            const userCredential = await signInWithGoogle();
            const user = userCredential.user;
            console.log("DEBUG LoginPage: Google Sign-In successful for UID:", user.uid);

            // Check if profile exists
            const existingProfile = await getUserProfile(user.uid);

            if (!existingProfile) {
                // New user via Google: create a profile
                await setUserProfile(userCredential.user.uid, {
                    displayName: userCredential.user.displayName || 'New User', // Fallback for display name
                    email: user.email,
                    role: 'non-player' // Default role for new users
                });
                console.log("DEBUG LoginPage: Created new Google user profile for UID:", user.uid);
            } else {
                // Existing Google user: update display name and email if they changed
                await setUserProfile(user.uid, {
                    displayName: user.displayName,
                    email: user.email
                });
                console.log("DEBUG LoginPage: Updated existing Google user profile for UID:", user.uid);
            }
            showAppMessage('success', 'Signed in with Google successfully!');

        } catch (err) {
            console.error("DEBUG LoginPage: Error during Google Sign-In:", err.code, err.message, err); // Log full error object
            setError('Google Sign-In failed. Please try again.');
        }
    };

    if (user && isAuthReady) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {isRegistering ? 'Register' : 'Login'}
                </h2>

                {appMessage.text && (
                    <div className={`mb-4 p-3 rounded text-center ${appMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {appMessage.text}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700  text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isRegistering && (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
                                Display Name
                            </label>
                            <input
                                type="text"
                                id="displayName"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="e.g., DiscGolfPro"
                                value={displayNameInput}
                                onChange={(e) => setDisplayNameInput(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="!bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        disabled={!isFormValid || (isRegistering && displayNameInput.trim() === '')}
                    >
                        {isRegistering ? 'Register Account' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-blue-500 hover:text-blue-800 text-sm"
                    >
                        {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                    </button>
                </div>

                <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative bg-white px-4 text-sm text-gray-500">
                        OR
                    </div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center bg-white border border-gray-300 text-gray-800 font-bold py-2 px-4 rounded w-full hover:bg-gray-100 focus:outline-none focus:shadow-outline"
                >
                    <img src={GoogleLogoUrl} alt="Google logo" className="w-5 h-5 mr-2" />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

export default LoginPage;
