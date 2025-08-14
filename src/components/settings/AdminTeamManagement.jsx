import React, { useState, useCallback } from 'react';
import { PlusCircle, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { useAdminTeams } from '../../hooks/useAdminTeams';
import { addTeam, deleteTeam, addTeamMember, removeTeamMember } from '../../services/firestoreService';

// This sub-component handles rendering the list of members for a single team.
const TeamMemberList = React.memo(({ team, allUserProfiles }) => {

    const handleToggleMembership = useCallback(async (profileId, isMember) => {
        try {
            if (isMember) {
                await removeTeamMember(team.id, profileId);
            } else {
                await addTeamMember(team.id, profileId);
            }
        } catch (error) {
            console.error("Failed to update team membership", error);
            // In a real app, you'd show a toast notification here.
        }
    }, [team.id]);

    if (!allUserProfiles || allUserProfiles.length === 0) {
        return <p className="text-sm text-gray-500">No users available to add.</p>;
    }

    return (
        <div className="border rounded-md bg-white dark:bg-gray-900 mt-2">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {allUserProfiles.map(profile => {
                    const isMember = team.memberIds?.includes(profile.id);
                    return (
                        <li key={profile.id} className={`flex justify-between items-center p-2 transition-colors ${isMember ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{profile.displayName || 'Unnamed'}</span>
                            <button
                                onClick={() => handleToggleMembership(profile.id, isMember)}
                                className={`p-1 rounded-md ${isMember ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                aria-label={isMember ? 'Remove from team' : 'Add to team'}
                            >
                                {isMember ? <UserMinus size={16} /> : <UserPlus size={16} />}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
});

const AdminTeamManagement = React.memo(({ allUserProfiles }) => {
    // ✨ This component consumes our custom hook to get its data
    const teams = useAdminTeams();
    const [newTeamName, setNewTeamName] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleAddTeam = useCallback(async () => {
        if (!newTeamName.trim()) return;
        try {
            await addTeam(newTeamName.trim());
            setNewTeamName('');
            setMessage({ type: 'success', text: 'Team created!' });
        } catch (error) {
            setMessage({ type: 'error', text: `Failed: ${error.message}` });
        } finally {
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    }, [newTeamName]);

    const handleDeleteTeam = useCallback(async (teamId) => {
        if (window.confirm("Are you sure? Deleting a team cannot be undone.")) {
            try {
                await deleteTeam(teamId);
                setMessage({ type: 'success', text: 'Team deleted.' });
            } catch (error) {
                setMessage({ type: 'error', text: `Failed to delete: ${error.message}` });
            } finally {
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        }
    }, []);

    return (
        <div className="space-y-4">
            {message.text && <p className={`mb-4 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            <div className="border-b dark:border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Create New Team</h3>
                <div className="flex gap-2">
                    <input type="text" className="flex-grow p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600" placeholder="New team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                    <button onClick={handleAddTeam} className="p-2 !bg-blue-600 text-white rounded-md hover:!bg-blue-700"><PlusCircle size={20} /></button>
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Existing Teams</h3>
            {teams.length > 0 ? (
                <ul className="space-y-4">
                    {teams.map(team => (
                        <li key={team.id} className="border dark:border-gray-700 p-4 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</p>
                                <button onClick={() => handleDeleteTeam(team.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={20} /></button>
                            </div>
                            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Edit Members:</h4>
                            <TeamMemberList team={team} allUserProfiles={allUserProfiles} />
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500 dark:text-gray-400">No teams created yet.</p>}
        </div>
    );
});

export default AdminTeamManagement;