// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase'; // Import the useFirebase hook
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'; // Import icons for clipboard and accordion
import { setUserProfile, subscribeToAllUserProfiles } from '../services/firestoreService'; // Import new profile functions and subscribe to all

// Reusable Accordion Component
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-white rounded-lg shadow-md max-w-md mx-auto mb-6">
            <button
                // Added bg-white and rounded-lg to ensure the button itself has a white background and rounded corners
                className="w-full flex justify-between items-center p-6 text-xl font-semibold text-gray-800 focus:outline-none !bg-white rounded-lg"
                onClick={toggleAccordion}
                aria-expanded={isOpen}
            >
                {title}
                {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function SettingsPage() {
    const { user, userId, isAuthReady } = useFirebase(); // Get user, userId, and isAuthReady from the hook. User now includes 'role'.
    const [copyMessage, setCopyMessage] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' }); // { type: 'success' | 'error', text: 'message' }

    // State for Admin Role Management
    const [allUserProfiles, setAllUserProfiles] = useState([]);
    const [selectedRole, setSelectedRole] = useState({}); // Stores { userId: 'role' } for pending changes
    const [roleSaveMessage, setRoleSaveMessage] = useState({ type: '', text: '' });

    // Define the application version.
    // IMPORTANT: You need to manually update this value to match the CACHE_NAME in your service-worker.js file.
    const APP_VERSION = 'v1.0.0'; // Example version, replace with your actual CACHE_NAME

    // Effect to load the user's current display name when the component mounts or user changes
    useEffect(() => {
        if (user && user.uid && isAuthReady) {
            setDisplayNameInput(user.displayName || '');
        }
    }, [user, isAuthReady]); // Depend on user and auth readiness

    // Effect to subscribe to all user profiles for admin role management
    useEffect(() => {
        let unsubscribe;
        // Only subscribe if user is an admin and auth is ready
        if (user?.role === 'admin' && isAuthReady) {
            console.log("DEBUG SettingsPage: Subscribing to all user profiles for admin view.");
            unsubscribe = subscribeToAllUserProfiles((profiles) => {
                setAllUserProfiles(profiles);
            });
        } else if (unsubscribe) { // If user is no longer admin or logged out, unsubscribe
            unsubscribe();
            setAllUserProfiles([]);
        }

        return () => {
            if (unsubscribe) {
                console.log("DEBUG SettingsPage: Unsubscribing from all user profiles.");
                unsubscribe();
            }
        };
    }, [user?.role, isAuthReady]); // Re-subscribe when admin status or auth changes


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
        } catch (error) {
            console.error("Failed to save display name:", error);
            setSaveMessage({ type: 'error', text: `Failed to save display name: ${error.message}` });
        } finally {
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000); // Clear message after 3 seconds
        }
    };

    const handleRoleChange = (targetUserId, role) => {
        setSelectedRole(prev => ({
            ...prev,
            [targetUserId]: role
        }));
    };

    const handleSaveRole = async (targetUserId) => {
        const roleToSave = selectedRole[targetUserId];
        if (!roleToSave || !targetUserId) {
            setRoleSaveMessage({ type: 'error', text: 'Invalid role or user ID.' });
            setTimeout(() => setRoleSaveMessage({ type: '', text: '' }), 3000);
            return;
        }

        try {
            await setUserProfile(targetUserId, { role: roleToSave });
            setRoleSaveMessage({ type: 'success', text: `Role for ${targetUserId} updated to ${roleToSave}!` });
            setSelectedRole(prev => {
                const newState = { ...prev };
                delete newState[targetUserId]; // Clear pending change for this user
                return newState;
            });
        } catch (error) {
            console.error("Failed to save role:", error);
            setRoleSaveMessage({ type: 'error', text: `Failed to save role: ${error.message}. Check admin UID in Firestore rules.` });
        } finally {
            setTimeout(() => setRoleSaveMessage({ type: '', text: '' }), 3000);
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

            {/* Your User Account Accordion */}
            <Accordion title="Your User Account" defaultOpen={false}>
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
                        maxLength="50"
                    />
                    <button
                        onClick={handleSaveDisplayName}
                        className="mt-2 w-full !bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Save Display Name
                    </button>
                    {saveMessage.text && (
                        <p className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {saveMessage.text}
                        </p>
                    )}
                </div>

                {/* User ID and Role Display Section */}
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
                <p className="text-gray-600 text-sm">Your Role: <span className="font-semibold capitalize">{user.role || 'non-player'}</span></p>
            </Accordion>

            {/* Admin Role Management Section - Only visible to admin users */}
            {user.role === 'admin' && (
                <Accordion title="User Role Management (Admin)" defaultOpen={false}>
                    {roleSaveMessage.text && (
                        <p className={`mt-2 mb-4 text-sm ${roleSaveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {roleSaveMessage.text}
                        </p>
                    )}
                    <ul className="space-y-4">
                        {allUserProfiles.length > 0 ? (
                            allUserProfiles.map(profile => (
                                <li key={profile.id} className="border-b pb-2 last:border-b-0 mb-5 mt-5"> {/* Added mb-4 here */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
                                        <div className="mb-2 sm:mb-0 sm:mr-4 min-w-0 flex-shrink-0">
                                            <p className="font-semibold text-gray-800 break-words">{profile.displayName || 'No Name'}</p>
                                            <p className="text-sm text-gray-500 break-all" title={profile.id}>ID: {profile.id}</p>
                                        </div>
                                        {profile.id === user.uid ? (
                                            <div className="text-gray-500 text-sm sm:text-base">
                                                Your Profile
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0 justify-end">
                                                <select
                                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-grow sm:flex-grow-0"
                                                    value={selectedRole[profile.id] || profile.role || 'non-player'}
                                                    onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                                >
                                                    <option value="non-player">Non-Player</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => handleSaveRole(profile.id)}
                                                    className="px-3 py-2 !bg-green-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                    disabled={
                                                        (selectedRole[profile.id] === (profile.role || 'non-player')) ||
                                                        (!selectedRole[profile.id] && (profile.role === undefined || profile.role === null || profile.role === 'non-player'))
                                                    }
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-600">No other user profiles found.</p>
                        )}
                    </ul>
                </Accordion>
            )}

            {/* Data Management Accordion */}
            <Accordion title="Data Management" defaultOpen={false}>
                <p className="text-gray-700 mb-4">
                    Your course and hole data is securely stored in Google Firebase. Automatic backups and synchronization are handled by Firebase. You can manage your data via the Firebase Console (console.firebase.google.com).
                </p>
            </Accordion>

            {/* Application Version Display */}
            <div className="mt-8 text-center text-sm text-gray-500">
                DG Notes: {APP_VERSION}
            </div>
        </div>
    );
}
