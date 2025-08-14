import React, { useState, useCallback, useMemo } from 'react';
import { setUserProfile } from '../../services/firestoreService';

const AdminUserManagement = React.memo(({ currentUser, allUserProfiles }) => {
    const [roleSaveMessage, setRoleSaveMessage] = useState({ type: '', text: '' });

    const handleAutoSaveRole = useCallback(async (targetUserId, newRole) => {
        const userProfile = allUserProfiles.find(p => p.id === targetUserId);
        if (!newRole || !userProfile || (userProfile.role || 'player') === newRole) {
            return; // No changes needed
        }

        try {
            await setUserProfile(targetUserId, { role: newRole });
            setRoleSaveMessage({ type: 'success', text: `Role for ${userProfile.displayName || 'user'} updated!` });
        } catch (error) {
            setRoleSaveMessage({ type: 'error', text: `Failed to update role: ${error.message}` });
        } finally {
            setTimeout(() => setRoleSaveMessage({ type: '', text: '' }), 3000);
        }
    }, [allUserProfiles]);

    const sortedUserProfiles = useMemo(() => {
        const roleOrder = { 'admin': 0, 'player': 1, 'non-player': 2 };
        // Create a new array before sorting to avoid mutating the prop
        return [...(allUserProfiles || [])].sort((a, b) => {
            const roleA = a.role || 'player';
            const roleB = b.role || 'player';
            if (roleOrder[roleA] !== roleOrder[roleB]) {
                return roleOrder[roleA] - roleOrder[roleB];
            }
            return (a.displayName || 'Unnamed').localeCompare(b.displayName || 'Unnamed');
        });
    }, [allUserProfiles]);

    return (
        <div>
            {roleSaveMessage.text && (
                <p className={`mb-4 text-sm ${roleSaveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {roleSaveMessage.text}
                </p>
            )}
            <div className="border rounded-md bg-white dark:bg-gray-900">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedUserProfiles.map(profile => {
                        // Admins can't change their own role through this interface
                        if (profile.id === currentUser.uid) {
                            return (
                                <li key={profile.id} className="p-3 bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-blue-900 dark:text-blue-200">{profile.displayName || 'No Name'} (You)</span>
                                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 capitalize">{(profile.role || 'player').replace('-', ' ')}</span>
                                    </div>
                                </li>
                            );
                        }

                        const currentRole = profile.role || 'player';
                        return (
                            <li key={profile.id} className="p-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{profile.displayName || 'No Name'}</span>
                                    <select
                                        className="p-1 border rounded-md !bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        value={currentRole}
                                        onChange={(e) => handleAutoSaveRole(profile.id, e.target.value)}
                                    >
                                        <option value="player">Player</option>
                                        <option value="non-player">Non-Player</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
});

export default AdminUserManagement;