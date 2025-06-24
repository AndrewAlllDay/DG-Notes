// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase'; // Import the useFirebase hook
import { Copy } from 'lucide-react'; // Import the Copy icon for clipboard functionality
import { setUserProfile, getUserProfile, subscribeToAllUserProfiles } from '../services/firestoreService'; // Import new profile functions and subscribe to all

export default function SettingsPage() {
    const { user, userId, isAuthReady } = useFirebase(); // Get user, userId, and isAuthReady from the hook. User now includes 'role'.
    const [copyMessage, setCopyMessage] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' }); // { type: 'success' | 'error', text: 'message' }

    // State for Admin Role Management
    const [allUserProfiles, setAllUserProfiles] = useState([]);
    const [selectedRole, setSelectedRole] = useState({}); // Stores { userId: 'role' } for pending changes
    const [roleSaveMessage, setRoleSaveMessage] = useState({ type: '', text: '' });

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
            // Only admins can set roles due to security rules
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
                {/* Display the role fetched from useFirebase */}
                <p className="text-gray-600 text-sm">Your Role: <span className="font-semibold capitalize">{user.role || 'non-player'}</span></p>

            </div>

            {/* Admin Role Management Section - Only visible to admin users */}
            {user.role === 'admin' && (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">User Role Management (Admin)</h3>
                    {roleSaveMessage.text && (
                        <p className={`mt-2 mb-4 text-sm ${roleSaveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {roleSaveMessage.text}
                        </p>
                    )}
                    <ul className="space-y-4">
                        {allUserProfiles.length > 0 ? (
                            allUserProfiles.map(profile => (
                                <li key={profile.id} className="border-b pb-2 last:border-b-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full"> {/* Changed to flex-col on small screens, flex-row on sm+ */}
                                        <div className="mb-2 sm:mb-0 sm:mr-4 min-w-0 flex-shrink-0"> {/* Added min-w-0 and flex-shrink-0 */}
                                            <p className="font-semibold text-gray-800 break-words">{profile.displayName || 'No Name'}</p>
                                            <p className="text-sm text-gray-500 break-all" title={profile.id}>ID: {profile.id}</p> {/* break-all for long IDs */}
                                        </div>
                                        {profile.id === user.uid ? ( // Check if this is the currently logged-in user
                                            <div className="text-gray-500 text-sm sm:text-base">
                                                Your Profile
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0 justify-end"> {/* Ensured controls are aligned to end */}
                                                <select
                                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-grow sm:flex-grow-0" // Added flex-grow
                                                    value={selectedRole[profile.id] || profile.role || 'non-player'}
                                                    onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                                >
                                                    <option value="non-player">Non-Player</option> {/* Updated option */}
                                                    <option value="admin">Admin</option>
                                                    {/* Add other roles here as needed */}
                                                </select>
                                                <button
                                                    onClick={() => handleSaveRole(profile.id)}
                                                    className="px-3 py-2 !bg-green-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" // Added flex-shrink-0
                                                    disabled={
                                                        (selectedRole[profile.id] === (profile.role || 'non-player')) || // No change
                                                        (!selectedRole[profile.id] && (profile.role === undefined || profile.role === null || profile.role === 'non-player'))
                                                    }
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Removed the "You cannot change your own role here" message as controls are now hidden */}
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-600">No other user profiles found.</p>
                        )}
                    </ul>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Data Management</h3>

                <p className="text-gray-700 mb-4">
                    Your course and hole data is securely stored in Google Firebase. Automatic backups and synchronization are handled by Firebase. You can manage your data via the Firebase Console (console.firebase.google.com).
                </p>
            </div>
        </div>
    );
}
