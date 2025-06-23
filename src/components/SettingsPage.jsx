// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase'; // Import the useFirebase hook
import { Copy } from 'lucide-react'; // Import the Copy icon for clipboard functionality
import { setUserProfile, getUserProfile } from '../services/firestoreService'; // Import new profile functions

export default function SettingsPage() {
    const { user, userId, isAuthReady } = useFirebase(); // Get user and userId from the hook
    const [copyMessage, setCopyMessage] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' }); // { type: 'success' | 'error', text: 'message' }

    // Effect to load the user's current display name when the component mounts or user changes
    useEffect(() => {
        if (user && user.uid && isAuthReady) {
            // The user object from useFirebase already includes the fetched displayName
            // from Firebase Auth or Firestore profile. Use that to populate the input.
            setDisplayNameInput(user.displayName || '');
        }
    }, [user, isAuthReady]); // Depend on user and auth readiness

    const handleCopyUserId = () => {
        if (userId) {
            const el = document.createElement('textarea');
            el.value = userId;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);

            setCopyMessage('Copied!');
            setTimeout(() => setCopyMessage(''), 2000);
        } else {
            setCopyMessage('No User ID to copy!');
            setTimeout(() => setCopyMessage(''), 2000);
        }
    };

    const handleSaveDisplayName = async () => {
        if (!userId) {
            setSaveMessage({ type: 'error', text: 'You must be logged in to set a display name.' });
            return;
        }
        if (displayNameInput.trim() === '') {
            setSaveMessage({ type: 'error', text: 'Display Name cannot be empty.' });
            return;
        }

        try {
            await setUserProfile(userId, { displayName: displayNameInput.trim() });
            setSaveMessage({ type: 'success', text: 'Display Name saved successfully!' });
            // Optionally, force re-fetch user in useFirebase if needed, though onAuthStateChanged
            // might already trigger it if the underlying Firebase Auth displayName changes,
            // or the useFirebase hook is already set up to check Firestore profile on auth change.
        } catch (error) {
            console.error("Failed to save display name:", error);
            setSaveMessage({ type: 'error', text: `Failed to save display name: ${error.message}` });
        } finally {
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000); // Clear message after 3 seconds
        }
    };

    // Show loading state if auth is not ready
    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl text-gray-700">
                Loading settings...
            </div>
        );
    }

    // Ensure user is logged in to show settings relevant to their account
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
                <p className="text-gray-600 text-lg">Please log in to view your settings.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5">Settings</h2>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Your User Account</h3>

                {/* Display Name Section */}
                <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Set Your Display Name:</label>
                    <input
                        type="text"
                        id="displayName"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g., Disc Golf Pro"
                        maxLength="50" // Optional: Limit length
                    />
                    <button
                        onClick={handleSaveDisplayName}
                        className="mt-2 w-full bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Save Display Name
                    </button>
                    {saveMessage.text && (
                        <p className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {saveMessage.text}
                        </p>
                    )}
                </div>

                {/* User ID Section */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200 mt-4">
                    <span className="font-medium text-gray-700 truncate mr-2">
                        User ID: {userId || 'N/A'}
                    </span>
                    <button
                        onClick={handleCopyUserId}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center justify-center transition-colors duration-200 relative"
                        aria-label="Copy User ID"
                        title="Copy User ID"
                    >
                        <Copy size={18} />
                        {copyMessage && (
                            <span className="absolute top-full mt-2 text-xs bg-black text-white px-2 py-1 rounded-md whitespace-nowrap">
                                {copyMessage}
                            </span>
                        )}
                    </button>
                </div>
                {user.email && <p className="text-gray-600 text-sm mt-3">Logged in as: {user.email}</p>}
                {/* Note: user.displayName from Auth object might not be updated instantly after saving Firestore profile,
                   but the `useFirebase` hook re-fetches it. The input will show the latest. */}
                {user.displayName && <p className="text-gray-600 text-sm">Current Auth Display Name: {user.displayName}</p>}

            </div>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Data Management</h3>

                <p className="text-gray-700 mb-4">
                    Your course and hole data is securely stored in Google Firebase. Automatic backups and synchronization are handled by Firebase. You can manage your data via the Firebase Console (console.firebase.google.com).
                </p>
            </div>

            {/* You can add more settings sections here in the future */}
        </div>
    );
}
