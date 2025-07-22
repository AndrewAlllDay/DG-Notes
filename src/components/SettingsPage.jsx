import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase';
import { Copy, ChevronDown, ChevronUp, PlusCircle, Trash2, UserPlus, UserMinus, LogOut } from 'lucide-react';
import { parse } from 'date-fns';
import Papa from 'papaparse';
import {
    setUserProfile,
    subscribeToAllUserProfiles,
    addTeam,
    subscribeToAllTeams,
    addTeamMember,
    removeTeamMember,
    deleteTeam,
    addCourseWithHoles,
    getUserCourses,
    updateCourse,
    addRound
} from '../services/firestoreService';
import ImportCSVModal from './ImportCSVModal';
import ConfirmationModal from './ConfirmationModal';
import SelectCourseTypeModal from './SelectCourseTypeModal';
import SelectPlayerModal from './SelectPlayerModal';

// --- HELPER FUNCTIONS FOR INDEXEDDB (Client-side) ---
function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dgnotes-shared-files', 1);
        request.onerror = event => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = event => resolve(event.target.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function getFile() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const allFilesRequest = store.getAll();
        allFilesRequest.onsuccess = () => {
            if (allFilesRequest.result && allFilesRequest.result.length > 0) {
                const sorted = allFilesRequest.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(sorted[0].file);
            } else {
                resolve(null);
            }
        };
        allFilesRequest.onerror = reject;
    });
}

async function clearFiles() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.clear();
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}
// --- END OF HELPER FUNCTIONS ---


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
                <div className="px-6 pb-6 pt-6 border-t border-gray-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function SettingsPage({ onSignOut }) {
    const { user, userId, isAuthReady } = useFirebase();
    const [copyMessage, setCopyMessage] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importMessage, setImportMessage] = useState({ type: '', text: '' });

    // State for Admin Role Management
    const [allUserProfiles, setAllUserProfiles] = useState([]);
    const [selectedRole, setSelectedRole] = useState({});
    const [roleSaveMessage, setRoleSaveMessage] = useState({ type: '', text: '' });

    // State for Team Management
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [teamMessage, setTeamMessage] = useState({ type: '', text: '' });

    // State for Modal Flow
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [selectTypeState, setSelectTypeState] = useState({ isOpen: false });
    const [selectPlayerState, setSelectPlayerState] = useState({ isOpen: false, players: [], onSelect: () => { } });
    const [pendingCourse, setPendingCourse] = useState(null);

    const APP_VERSION = 'v1.11';

    useEffect(() => {
        const processSharedFile = async () => {
            const params = new URLSearchParams(window.location.search);
            if (params.has('share-target')) {
                setImportMessage({ type: 'info', text: 'Processing shared file...' });
                try {
                    const file = await getFile();
                    if (file) {
                        Papa.parse(file, {
                            header: true,
                            skipEmptyLines: true,
                            complete: (results) => {
                                handleCourseImport(results);
                            },
                            error: () => {
                                setImportMessage({ type: 'error', text: 'Failed to parse the shared CSV file.' });
                            }
                        });
                        await clearFiles();
                    } else {
                        setImportMessage({ type: 'info', text: 'No shared file found to process.' });
                    }
                } catch (error) {
                    setImportMessage({ type: 'error', text: `Could not process shared file: ${error.message}` });
                } finally {
                    const url = new URL(window.location);
                    url.searchParams.delete('share-target');
                    window.history.replaceState({}, '', url);
                }
            }
        };

        processSharedFile();
    }, []);

    useEffect(() => {
        if (user && user.uid && isAuthReady) {
            setDisplayNameInput(user.displayName || '');
        }
    }, [user, isAuthReady]);

    useEffect(() => {
        let unsubscribe;
        if (user?.role === 'admin' && isAuthReady) {
            unsubscribe = subscribeToAllUserProfiles((profiles) => setAllUserProfiles(profiles));
        }
        return () => unsubscribe && unsubscribe();
    }, [user?.role, isAuthReady]);

    useEffect(() => {
        let unsubscribeTeams;
        if (user?.role === 'admin' && isAuthReady) {
            unsubscribeTeams = subscribeToAllTeams((fetchedTeams) => setTeams(fetchedTeams));
        }
        return () => unsubscribeTeams && unsubscribeTeams();
    }, [user?.role, isAuthReady]);

    const handleCopyUserId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId).then(() => {
                setCopyMessage('Copied!');
                setTimeout(() => setCopyMessage(''), 2000);
            });
        }
    };

    const handleSaveDisplayName = async () => {
        if (!userId) {
            setSaveMessage({ type: 'error', text: 'You must be logged in.' });
            return;
        }
        if (displayNameInput.trim() === '') {
            setSaveMessage({ type: 'error', text: 'Display Name cannot be empty.' });
            return;
        }

        try {
            await setUserProfile(userId, { displayName: displayNameInput.trim() });
            setSaveMessage({ type: 'success', text: 'Display Name saved!' });
        } catch (error) {
            setSaveMessage({ type: 'error', text: `Failed to save: ${error.message}` });
        } finally {
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        }
    };

    const saveUserRound = async (courseId, courseName, layoutName, userRow, headers) => {
        const scores = [];
        for (const header of headers) {
            const match = header.match(/^Hole(\w+)$/);
            if (match) {
                scores.push(parseInt(userRow[header]));
            }
        }

        const roundData = {
            courseId,
            courseName,
            layoutName,
            date: parse(userRow.StartDate, 'yyyy-MM-dd HHmm', new Date()),
            totalScore: parseInt(userRow.Total),
            scoreToPar: parseInt(userRow['+/-']),
            scores: scores
        };

        await addRound(userId, roundData);
        setImportMessage({ type: 'success', text: `Your scorecard for ${courseName} has been imported!` });
    };

    const proceedToScoreImport = async (course, csvResults) => {
        const playerRows = csvResults.data.filter(row => row.PlayerName !== 'Par');
        const userRow = playerRows.find(row => row.PlayerName.toLowerCase() === user.displayName.toLowerCase());

        if (userRow) {
            await saveUserRound(course.id, course.name, course.tournamentName, userRow, csvResults.meta.fields);
        } else {
            setSelectPlayerState({
                isOpen: true,
                players: playerRows.map(row => row.PlayerName),
                onSelect: (selectedPlayer) => {
                    const selectedRow = playerRows.find(row => row.PlayerName === selectedPlayer);
                    saveUserRound(course.id, course.name, course.tournamentName, selectedRow, csvResults.meta.fields);
                    setSelectPlayerState({ isOpen: false, players: [], onSelect: () => { } });
                }
            });
        }
    };

    const handleCreationConfirmed = (courseData, holesArray, csvResults) => {
        setPendingCourse({ courseData, holesArray, csvResults });
        setSelectTypeState({ isOpen: true });
        setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    };

    const handleCreateFinal = async (classification) => {
        if (!pendingCourse) return;

        const { courseData, holesArray, csvResults } = pendingCourse;
        const finalCourseData = { ...courseData, classification };

        try {
            const newCourse = await addCourseWithHoles(finalCourseData, holesArray, userId);
            setSelectTypeState({ isOpen: false });
            setPendingCourse(null);
            await proceedToScoreImport(newCourse, csvResults);
        } catch (error) {
            setImportMessage({ type: 'error', text: `Failed to create course: ${error.message}` });
            setSelectTypeState({ isOpen: false });
            setPendingCourse(null);
        }
    };

    const handleCourseImport = async (csvResults) => {
        setIsImportModalOpen(false);
        setImportMessage({ type: '', text: '' });

        try {
            const csvData = csvResults.data;
            const headers = csvResults.meta.fields;

            const parRow = csvData.find(row => row.PlayerName === 'Par');
            if (!parRow) throw new Error("Could not find 'Par' row in CSV.");

            const courseName = parRow.CourseName;
            const layoutName = parRow.LayoutName || '';
            if (!courseName) throw new Error("CSV is missing 'CourseName'.");

            const existingCourses = await getUserCourses(userId);
            const existingCourse = existingCourses.find(c => c.name.toLowerCase() === courseName.toLowerCase() && c.tournamentName.toLowerCase() === layoutName.toLowerCase());

            if (existingCourse) {
                await proceedToScoreImport(existingCourse, csvResults);
            } else {
                const holesArray = [];
                for (const header of headers) {
                    const match = header.match(/^Hole(\w+)$/);
                    if (match) {
                        holesArray.push({
                            id: `${Date.now()}-${match[1]}-${Math.random().toString(36).substring(2, 9)}`,
                            number: match[1],
                            par: parRow[header],
                            note: '',
                        });
                    }
                }

                if (holesArray.length === 0) throw new Error("No 'HoleX' columns found.");

                const courseData = { name: courseName, tournamentName: layoutName };
                setConfirmationState({
                    isOpen: true,
                    title: 'Create New Course?',
                    message: `No course named "${courseName} - ${layoutName}" found. Would you like to create it now?`,
                    onConfirm: () => handleCreationConfirmed(courseData, holesArray, csvResults)
                });
            }

        } catch (error) {
            setImportMessage({ type: 'error', text: `Import failed: ${error.message}` });
        }
    };

    const handleRoleChange = (targetUserId, role) => setSelectedRole(prev => ({ ...prev, [targetUserId]: role }));

    const handleSaveRole = async (targetUserId) => {
        const roleToSave = selectedRole[targetUserId];
        if (!roleToSave || !targetUserId) return;

        try {
            await setUserProfile(targetUserId, { role: roleToSave });
            setRoleSaveMessage({ type: 'success', text: `Role updated!` });
            setSelectedRole(prev => {
                const newState = { ...prev };
                delete newState[targetUserId];
                return newState;
            });
        } catch (error) {
            setRoleSaveMessage({ type: 'error', text: `Failed to save role: ${error.message}` });
        } finally {
            setTimeout(() => setRoleSaveMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleAddTeam = async () => {
        if (newTeamName.trim() === '') {
            setTeamMessage({ type: 'error', text: 'Team name cannot be empty.' });
            return;
        }
        try {
            await addTeam(newTeamName.trim());
            setNewTeamName('');
            setTeamMessage({ type: 'success', text: 'Team created!' });
        } catch (error) {
            setTeamMessage({ type: 'error', text: `Failed to create team: ${error.message}` });
        } finally {
            setTimeout(() => setTeamMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (window.confirm("Are you sure you want to delete this team?")) {
            try {
                await deleteTeam(teamId);
                setTeamMessage({ type: 'success', text: 'Team deleted!' });
            } catch (error) {
                setTeamMessage({ type: 'error', text: `Failed to delete team: ${error.message}` });
            } finally {
                setTimeout(() => setTeamMessage({ type: '', text: '' }), 3000);
            }
        }
    };

    const handleToggleTeamMembership = async (teamId, memberUserId, isMember) => {
        try {
            if (isMember) {
                await removeTeamMember(teamId, memberUserId);
                setTeamMessage({ type: 'success', text: 'Member removed.' });
            } else {
                await addTeamMember(teamId, memberUserId);
                setTeamMessage({ type: 'success', text: 'Member added.' });
            }
        } catch (error) {
            setTeamMessage({ type: 'error', text: `Failed to update: ${error.message}` });
        } finally {
            setTimeout(() => setTeamMessage({ type: '', text: '' }), 3000);
        }
    };

    if (!isAuthReady) return <div className="text-center p-4">Loading settings...</div>;
    if (!user) return <div className="text-center p-4">Please log in to view settings.</div>;

    return (
        <div className="max-h-screen !bg-gray-100 p-4 pb-28">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5">Settings</h2>

            <Accordion title="Your User Account">
                <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Set Your Display Name:</label>
                    <input
                        type="text"
                        id="displayName"
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g., Disc Golf Pro"
                    />
                    <button onClick={handleSaveDisplayName} className="mt-2 w-full !bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700">
                        Save Display Name
                    </button>
                    {saveMessage.text && <p className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{saveMessage.text}</p>}
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border">
                    <span className="font-medium text-gray-700 truncate mr-2">User ID: {userId || 'N/A'}</span>
                    <button onClick={handleCopyUserId} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md relative">
                        <Copy size={18} />
                        {copyMessage && <span className="absolute top-full mt-2 text-xs bg-black text-white px-2 py-1 rounded-md">{copyMessage}</span>}
                    </button>
                </div>
                {user.email && <p className="text-gray-600 text-sm mt-3">Logged in as: {user.email}</p>}
                <p className="text-gray-600 text-sm">Your Role: <span className="font-semibold capitalize">{user.role || 'player'}</span></p>
            </Accordion>

            <Accordion title="Account Actions">
                <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 !bg-red-600 text-white p-3 rounded-md font-semibold hover:bg-red-700">
                    <LogOut size={20} />
                    Logout
                </button>
            </Accordion>

            <Accordion title="Data Management">
                <h3 className="text-lg font-semibold text-gray-800">Import Courses & Scores</h3>
                <p className="text-sm text-gray-600 mb-2">Import a new course and your scorecard from a formatted CSV file.</p>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="w-full !bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                    Import from CSV
                </button>
                {importMessage.text && (
                    <p className={`mt-2 text-sm ${importMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {importMessage.text}
                    </p>
                )}
            </Accordion>

            {user.role === 'admin' && (
                <Accordion title="User Role Management (Admin)">
                    {roleSaveMessage.text && <p className={`mb-4 text-sm ${roleSaveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{roleSaveMessage.text}</p>}
                    <ul className="space-y-4">
                        {allUserProfiles.map(profile => (
                            <li key={profile.id} className="border-b pb-2 last:border-b-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
                                    <div className="mb-2 sm:mb-0"><p className="font-semibold text-gray-800 break-words">{profile.displayName || 'No Name'}</p></div>
                                    {profile.id === user.uid ? (
                                        <div className="text-gray-500">Your Profile</div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <select className="p-2 border rounded-md !bg-white" value={selectedRole[profile.id] || profile.role || 'player'} onChange={(e) => handleRoleChange(profile.id, e.target.value)}>
                                                <option value="player">Player</option>
                                                <option value="non-player">Non-Player</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button onClick={() => handleSaveRole(profile.id)} className="px-3 py-2 !bg-green-600 text-white rounded-md" disabled={!selectedRole[profile.id] || selectedRole[profile.id] === (profile.role || 'player')}>
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Accordion>
            )}

            {user.role === 'admin' && (
                <Accordion title="Team Management (Admin)">
                    {teamMessage.text && <p className={`mb-4 text-sm ${teamMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{teamMessage.text}</p>}
                    <div className="mb-6 border-b pb-4">
                        <h3 className="text-lg font-semibold mb-2">Create New Team</h3>
                        <div className="flex gap-2">
                            <input type="text" className="flex-grow p-2 border rounded-md bg-white" placeholder="New team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                            <button onClick={handleAddTeam} className="p-2 !bg-blue-600 text-white rounded-md"><PlusCircle size={20} /></button>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">Existing Teams</h3>
                    {teams.length > 0 ? (
                        <ul className="space-y-4">
                            {teams.map(team => (
                                <li key={team.id} className="border p-4 rounded-md shadow-sm bg-gray-50">
                                    <div className="flex justify-between items-center mb-2"><p className="font-semibold">{team.name}</p><button onClick={() => handleDeleteTeam(team.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={20} /></button></div>
                                    <h4 className="text-md font-medium mt-4 mb-2">Team Members:</h4>
                                    {allUserProfiles.length > 0 ? (
                                        <ul className="max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
                                            {allUserProfiles.map(profile => {
                                                const isMember = team.memberIds?.includes(profile.id);
                                                return (
                                                    <li key={profile.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                                                        <span className="text-sm">{profile.displayName || 'Unnamed'}</span>
                                                        <button onClick={() => handleToggleTeamMembership(team.id, profile.id, isMember)} className={`p-1 rounded-md ${isMember ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                            {isMember ? <UserMinus size={16} /> : <UserPlus size={16} />}
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : <p className="text-gray-600 text-sm">No users to add.</p>}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-600">No teams created yet.</p>}
                </Accordion>
            )}

            <div className="mt-8 text-center text-sm text-gray-500">
                DG Notes: {APP_VERSION}
            </div>

            <ImportCSVModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleCourseImport} />
            <ConfirmationModal isOpen={confirmationState.isOpen} onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })} onConfirm={confirmationState.onConfirm} title={confirmationState.title} message={confirmationState.message} />
            <SelectCourseTypeModal isOpen={selectTypeState.isOpen} onClose={() => setSelectTypeState({ isOpen: false })} onSubmit={handleCreateFinal} />
            <SelectPlayerModal isOpen={selectPlayerState.isOpen} onClose={() => setSelectPlayerState({ isOpen: false, players: [], onSelect: () => { } })} onSelect={selectPlayerState.onSelect} players={selectPlayerState.players} />
        </div>
    );
}