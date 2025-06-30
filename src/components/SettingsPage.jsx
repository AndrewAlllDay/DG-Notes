// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase'; // Import the useFirebase hook
import { Copy, ChevronDown, ChevronUp, PlusCircle, Trash2, UserPlus, UserMinus, LogOut } from 'lucide-react'; // Import icons, including LogOut
import {
    setUserProfile,
    subscribeToAllUserProfiles,
    addTeam,
    subscribeToAllTeams,
    addTeamMember,
    removeTeamMember,
    deleteTeam
} from '../services/firestoreService'; // Import new profile functions and subscribe to all, and new team functions

// Reusable Accordion Component
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-white rounded-lg shadow-md max-w-md mx-auto mb-6">
            <button
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

export default function SettingsPage({ onSignOut }) { // Accept onSignOut as a prop
    const { user, userId, isAuthReady } = useFirebase(); // Get user, userId, and isAuthReady from the hook. User now includes 'role'.
    const [copyMessage, setCopyMessage] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' }); // { type: 'success' | 'error', text: 'message' }

    // State for Admin Role Management
    const [allUserProfiles, setAllUserProfiles] = useState([]);
    const [selectedRole, setSelectedRole] = useState({}); // Stores { userId: 'role' } for pending changes
    const [roleSaveMessage, setRoleSaveMessage] = useState({ type: '', text: '' });

    // NEW: State for Team Management
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [teamMessage, setTeamMessage] = useState({ type: '', text: '' }); // Message for team operations
    const [pendingTeamMembers, setPendingTeamMembers] = useState({}); // Stores { teamId: { userId: true/false } } for adds/removes

    // Define the application version.
    // IMPORTANT: You need to manually update this value to match the CACHE_NAME in your service-worker.js file.
    const APP_VERSION = 'v1.0.6'; // Example version, replace with your actual CACHE_NAME

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

    // NEW: Effect to subscribe to all teams for admin management
    useEffect(() => {
        let unsubscribeTeams;
        if (user?.role === 'admin' && isAuthReady) {
            console.log("DEBUG SettingsPage: Subscribing to all teams for admin view.");
            unsubscribeTeams = subscribeToAllTeams((fetchedTeams) => {
                setTeams(fetchedTeams);
            });
        } else if (unsubscribeTeams) {
            unsubscribeTeams();
            setTeams([]);
        }

        return () => {
            if (unsubscribeTeams) {
                console.log("DEBUG SettingsPage: Unsubscribing from all teams.");
                unsubscribeTeams();
            }
        };
    }, [user?.role, isAuthReady]);


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

    // NEW: Team Management Handlers
    const handleAddTeam = async () => {
        setTeamMessage({ type: '', text: '' });
        if (newTeamName.trim() === '') {
            setTeamMessage({ type: 'error', text: 'Team name cannot be empty.' });
            return;
        }
        try {
            await addTeam(newTeamName.trim());
            setNewTeamName('');
            setTeamMessage({ type: 'success', text: 'Team created successfully!' });
        } catch (error) {
            console.error("Error creating team:", error);
            setTeamMessage({ type: 'error', text: `Failed to create team: ${error.message}` });
        } finally {
            setTimeout(() => setTeamMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        setTeamMessage({ type: '', text: '' });
        if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
            try {
                await deleteTeam(teamId);
                setTeamMessage({ type: 'success', text: 'Team deleted successfully!' });
            } catch (error) {
                console.error("Error deleting team:", error);
                setTeamMessage({ type: 'error', text: `Failed to delete team: ${error.message}` });
            } finally {
                setTimeout(() => setTeamMessage({ type: '', text: '' }), 3000);
            }
        }
    };

    const handleToggleTeamMembership = async (teamId, memberUserId, isMember) => {
        setTeamMessage({ type: '', text: '' });
        try {
            if (isMember) {
                await removeTeamMember(teamId, memberUserId);
                setTeamMessage({ type: 'success', text: 'Member removed from team.' });
            } else {
                await addTeamMember(teamId, memberUserId);
                setTeamMessage({ type: 'success', text: 'Member added to team.' });
            }
        } catch (error) {
            console.error("Error updating team membership:", error);
            setTeamMessage({ type: 'error', text: `Failed to update membership: ${error.message}` });
        } finally {
            setTimeout(() => setTeamMessage({ type: '', text: '' }), 3000);
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
        <div className="max-h-screen !bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5">Settings</h2>

            {/* Your User Account Accordion */}
            <Accordion title="Your User Account" defaultOpen={false}>
                {/* Display Name Section */}
                <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Set Your Display Name:</label>
                    <input
                        type="text"
                        id="displayName"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !bg-white" // Added bg-white
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

            {/* Account Actions Accordion - NEW */}
            <Accordion title="Account Actions" defaultOpen={false}>
                {user && (
                    <button
                        onClick={onSignOut} // <-- This is the key change!
                        className="w-full flex items-center justify-center gap-2 !bg-red-600 text-white p-3 rounded-md font-semibold hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                )}
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
                                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-grow sm:flex-grow-0 !bg-white" // Added bg-white
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

            {/* NEW: Admin Team Management Section - Only visible to admin users */}
            {user.role === 'admin' && (
                <Accordion title="Team Management (Admin)" defaultOpen={false}>
                    {teamMessage.text && (
                        <p className={`mt-2 mb-4 text-sm ${teamMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {teamMessage.text}
                        </p>
                    )}
                    <div className="mb-6 border-b pb-4">
                        <h3 className="text-lg font-semibold mb-2">Create New Team</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="New team name"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                            />
                            <button
                                onClick={handleAddTeam}
                                className="p-2 !bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                            >
                                <PlusCircle size={20} />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-3">Existing Teams</h3>
                    {teams.length === 0 ? (
                        <p className="text-gray-600">No teams created yet.</p>
                    ) : (
                        <ul className="space-y-4">
                            {teams.map(team => (
                                <li key={team.id} className="border p-4 rounded-md shadow-sm bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold text-gray-800">{team.name}</p>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                            aria-label={`Delete team ${team.name}`}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">Team ID: <span className="font-mono text-xs">{team.id}</span></p>

                                    <h4 className="text-md font-medium mt-4 mb-2">Team Members:</h4>
                                    {/* Display list of users and allow adding/removing from this team */}
                                    {allUserProfiles.length > 0 ? (
                                        <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                                            {allUserProfiles.map(profile => {
                                                const isMember = team.memberIds && team.memberIds.includes(profile.id);
                                                return (
                                                    <li key={profile.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                                                        <span className="text-sm">{profile.displayName || 'Unnamed User'}</span>
                                                        <button
                                                            onClick={() => handleToggleTeamMembership(team.id, profile.id, isMember)}
                                                            className={`p-1 rounded-md transition-colors ${isMember
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                }`}
                                                            aria-label={isMember ? `Remove ${profile.displayName} from team` : `Add ${profile.displayName} to team`}
                                                        >
                                                            {isMember ? <UserMinus size={16} /> : <UserPlus size={16} />}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-600 text-sm">No users to add to teams.</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
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