// src/components/SettingsPage.jsx
import React from 'react';
import { useFirebase } from '../firebase'; // Import the useFirebase hook
import { Copy } from 'lucide-react'; // Import the Copy icon for clipboard functionality

export default function SettingsPage() {
    const { user, userId, isAuthReady } = useFirebase(); // Get user and userId from the hook
    const [copyMessage, setCopyMessage] = React.useState('');

    const handleCopyUserId = () => {
        if (userId) {
            // Use document.execCommand('copy') as navigator.clipboard.writeText() may not work in iFrames
            const el = document.createElement('textarea');
            el.value = userId;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);

            setCopyMessage('Copied!');
            setTimeout(() => setCopyMessage(''), 2000); // Clear message after 2 seconds
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
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
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
                {user.displayName && <p className="text-gray-600 text-sm">Display Name: {user.displayName}</p>}
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
