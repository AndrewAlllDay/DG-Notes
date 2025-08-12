import React, { useState, useEffect } from 'react';
import { db, appId } from '../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeToRounds, deleteRound, updateRoundRating, updateRoundTournament, updateRoundNotes } from '../services/firestoreService.jsx';
import { getCache, setCache } from '../utilities/cache.js'; // 👈 Import cache utilities
import { format } from 'date-fns';
import { FaTrash, FaSave, FaTimes, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// ✨ 1. Accept `user` as a prop
export default function ScoresPage({ user }) {
    // ✨ 2. Get `userId` from the prop, remove `useFirebase` hook
    const { uid: userId } = user;

    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRoundId, setExpandedRoundId] = useState(null);
    const [courseHoles, setCourseHoles] = useState([]);
    const [isHolesLoading, setIsHolesLoading] = useState(false);
    const [editingRoundId, setEditingRoundId] = useState(null);
    const [roundFormData, setRoundFormData] = useState({});
    const [geminiPrompt, setGeminiPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [geminiError, setGeminiError] = useState(null);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [roundToDelete, setRoundToDelete] = useState(null);

    const BACKEND_API_URL = 'https://us-central1-disc-golf-notes.cloudfunctions.net/gemini-score-analyzer/api/gemini-insight';

    // ✨ 3. Implement caching for the rounds list
    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            setRounds([]);
            return;
        }

        const cacheKey = `userRounds-${userId}`;
        const cachedRounds = getCache(cacheKey);
        if (cachedRounds) {
            setRounds(cachedRounds);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        const unsubscribe = subscribeToRounds(userId, (fetchedRounds) => {
            const uniqueRoundsMap = new Map();
            fetchedRounds.forEach(round => {
                const roundDate = round.date?.toDate ? round.date.toDate() : null;
                const key = round.id || `${round.courseName}-${roundDate}`;
                if (!uniqueRoundsMap.has(key)) {
                    uniqueRoundsMap.set(key, round);
                }
            });
            const deduplicatedRounds = Array.from(uniqueRoundsMap.values());
            deduplicatedRounds.sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));

            setRounds(deduplicatedRounds);
            setCache(cacheKey, deduplicatedRounds); // Update cache
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    // ✨ 4. Implement caching for on-demand course details
    const handleToggleExpand = async (roundId) => {
        if (expandedRoundId === roundId) {
            setExpandedRoundId(null);
            setEditingRoundId(null);
            return;
        }

        const round = rounds.find(r => r.id === roundId);
        if (!round || !round.courseId) {
            toast.error("Could not find course data for this round.");
            return;
        }

        setIsHolesLoading(true);
        setExpandedRoundId(roundId);

        // Check for course details in the courses cache first
        const coursesCacheKey = `userCourses-${userId}`;
        const cachedCourses = getCache(coursesCacheKey);
        if (cachedCourses) {
            const cachedCourse = cachedCourses.find(c => c.id === round.courseId);
            if (cachedCourse) {
                setCourseHoles(cachedCourse.holes || []);
                setIsHolesLoading(false);
                return; // Found in cache, no need to fetch
            }
        }

        // If not in cache, fetch from Firestore as a fallback
        try {
            const courseDocRef = doc(db, `artifacts/${appId}/users/${userId}/courses`, round.courseId);
            const courseSnap = await getDoc(courseDocRef);
            if (courseSnap.exists()) {
                setCourseHoles(courseSnap.data().holes || []);
            } else {
                toast.error("Course details not found.");
                setCourseHoles([]);
            }
        } catch (error) {
            console.error("Error fetching course details:", error);
            toast.error("Failed to load hole details.");
        } finally {
            setIsHolesLoading(false);
        }
    };

    const handleEditClick = (e, round) => {
        e.stopPropagation();
        setEditingRoundId(round.id);
        setRoundFormData({
            tournamentName: round.tournamentName || '',
            rating: round.rating || '',
            notes: round.notes || ''
        });
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingRoundId(null);
        setRoundFormData({});
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setRoundFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e) => {
        e.stopPropagation();
        if (!editingRoundId) return;

        const originalRound = rounds.find(r => r.id === editingRoundId);
        const updatePromises = [];

        if (originalRound.tournamentName !== roundFormData.tournamentName && (originalRound.tournamentName || roundFormData.tournamentName)) {
            updatePromises.push(updateRoundTournament(userId, editingRoundId, roundFormData.tournamentName));
        }
        if (Number(originalRound.rating) !== Number(roundFormData.rating) && (originalRound.rating || roundFormData.rating)) {
            updatePromises.push(updateRoundRating(userId, editingRoundId, roundFormData.rating));
        }
        if (originalRound.notes !== roundFormData.notes && (originalRound.notes || roundFormData.notes)) {
            updatePromises.push(updateRoundNotes(userId, editingRoundId, roundFormData.notes));
        }

        if (updatePromises.length === 0) {
            toast.info("No changes were made.");
            setEditingRoundId(null);
            return;
        }

        try {
            await Promise.all(updatePromises);
            toast.success("Round details updated successfully!");
            setEditingRoundId(null);
        } catch (error) {
            toast.error(`Failed to save changes: ${error.message}`);
        }
    };

    const formatScoreToPar = (score) => {
        if (score === 0) return 'E';
        if (score > 0) return `+${score}`;
        return score;
    };

    const getScoreColor = (score, par) => {
        if (par === null || score === null) return 'text-gray-800 dark:text-gray-100';
        const difference = score - par;
        if (difference < 0) return 'text-green-500';
        if (difference > 0) return 'text-red-500';
        return 'text-gray-500 dark:text-gray-400';
    };

    const handleDeleteRound = (e, roundId, courseName, layoutName) => {
        e.stopPropagation();
        setRoundToDelete({ id: roundId, courseName, layoutName });
        setShowDeleteConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!roundToDelete || !userId) return;
        setShowDeleteConfirmModal(false);
        try {
            await deleteRound(userId, roundToDelete.id);
            toast.success(`Scorecard for ${roundToDelete.courseName} deleted successfully!`);
        } catch (error) {
            toast.error(`Failed to delete scorecard: ${error.message}`);
        }
        setRoundToDelete(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirmModal(false);
        setRoundToDelete(null);
    };

    const runGeminiAnalysis = async () => {
        // ... Gemini logic (unchanged)
    };

    // ✨ 5. The top-level loading check is simplified.
    // The component will display cached rounds immediately, so `isLoading`
    // is now mainly for the initial, first-ever load.
    if (isLoading && rounds.length === 0) {
        return <div className="text-center p-8">Loading scores...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black p-4 pb-36">
            <div className="max-h-screen overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-center pt-5 text-gray-800 dark:text-gray-100">My Scores</h2>
                <p className="text-md text-gray-600 dark:text-gray-400 text-center mb-6">Click on your scorecard for the hole breakdown.</p>
                {rounds.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400">You haven't imported any scores yet.</p>
                ) : (
                    <div className="max-w-2xl mx-auto space-y-4">
                        {rounds.map(round => {
                            const isExpanded = expandedRoundId === round.id;
                            const isEditing = editingRoundId === round.id;
                            const sortedHoles = round.scores ? Object.keys(round.scores).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)) : [];

                            return (
                                <div key={round.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 border ${isEditing ? 'border-blue-500' : 'border-transparent'}`}>
                                    <div onClick={() => handleToggleExpand(round.id)} className="cursor-pointer">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                {round.tournamentName && (
                                                    <p className="text-sm font-normal text-black dark:text-purple-400 mb-2 leading-none">{round.tournamentName}</p>
                                                )}
                                                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-none">{round.courseName}</h3>

                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A Date'}
                                                </p>
                                                {typeof round.rating === 'number' && (
                                                    <p className="text-xs font-semibold spec-sec mt-1">
                                                        {round.rating} Rated
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{round.totalScore}</p>
                                                    <p className={`text-lg font-semibold ${getScoreColor(round.scoreToPar, 0)}`}>
                                                        {formatScoreToPar(round.scoreToPar)}
                                                    </p>
                                                </div>
                                                <button onClick={(e) => handleDeleteRound(e, round.id, round.courseName, round.layoutName)}
                                                    className="p-2 self-start !bg-transparent text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 relative"
                                                    title={`Delete scorecard for ${round.courseName}`}>
                                                    <FaTrash size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            {isEditing ? (
                                                <div className="space-y-4" onClick={e => e.stopPropagation()}>
                                                    <div>
                                                        <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tournament Name</label>
                                                        <input type="text" name="tournamentName" value={roundFormData.tournamentName} onChange={handleFormChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Round Rating</label>
                                                        <input type="number" name="rating" value={roundFormData.rating} onChange={handleFormChange} placeholder="e.g., 950" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Round Notes</label>
                                                        <textarea name="notes" value={roundFormData.notes} onChange={handleFormChange} rows="4" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button onClick={handleSaveChanges} className="flex items-center gap-2 text-sm !bg-green-600 text-white px-3 py-1 rounded-md hover:!bg-green-700">
                                                            <FaSave size={14} /> Save
                                                        </button>
                                                        <button onClick={handleCancelEdit} className="flex items-center gap-2 text-sm !bg-gray-500 text-white px-3 py-1 rounded-md hover:!bg-gray-600">
                                                            <FaTimes size={14} /> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex justify-end mb-4">
                                                        <button onClick={(e) => handleEditClick(e, round)} className="flex items-center gap-2 text-sm !bg-blue-600 text-white px-3 py-1 rounded-md hover:!bg-blue-700">
                                                            <FaEdit size={14} /> Edit Details
                                                        </button>
                                                    </div>
                                                    {round.notes && (
                                                        <div className="mb-6">
                                                            <h4 className="font-semibold text-md mb-2 text-gray-700 dark:text-gray-300">Round Notes</h4>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-md">{round.notes}</p>
                                                        </div>
                                                    )}
                                                    <h4 className="font-semibold text-md text-gray-700 dark:text-gray-300">Hole Breakdown</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{round.layoutName}</p>
                                                    {isHolesLoading ? (
                                                        <p className="text-center text-gray-500">Loading hole details...</p>
                                                    ) : (
                                                        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2 text-center">
                                                            {sortedHoles.map(holeNumber => {
                                                                const score = round.scores[holeNumber];
                                                                const holeDetail = courseHoles.find(h => h.number.toString() === holeNumber);
                                                                const par = holeDetail ? parseInt(holeDetail.par, 10) : null;
                                                                return (
                                                                    <div key={holeNumber} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Hole {holeNumber}</div>
                                                                        <div className={`text-xl font-bold ${getScoreColor(score, par)}`}>{score}</div>
                                                                        {par !== null && <div className="text-xs text-gray-500 dark:text-gray-400">Par {par}</div>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="max-w-2xl mx-auto mt-8 mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Ask Gemini about your scores</h3>
                    <textarea
                        value={geminiPrompt}
                        onChange={(e) => setGeminiPrompt(e.target.value)}
                        placeholder="E.g., 'What was my best round?' or 'Summarize my performance.'"
                        rows="3"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isGeminiLoading}
                    />
                    <button
                        onClick={runGeminiAnalysis}
                        className="mt-3 w-full !bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                        disabled={isGeminiLoading || !userId}
                    >
                        {isGeminiLoading ? 'Analyzing...' : 'Get Score Insights from Gemini'}
                    </button>
                    {geminiError && (
                        <p className="text-red-500 text-sm mt-3">Error: {geminiError}</p>
                    )}
                    {geminiResponse && (
                        <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Gemini's Insights:</h4>
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{geminiResponse}</p>
                        </div>
                    )}
                </div>
                {roundToDelete && (
                    <DeleteConfirmationModal
                        key={roundToDelete.id}
                        isOpen={showDeleteConfirmModal}
                        onClose={cancelDelete}
                        onConfirm={confirmDelete}
                        message={`Are you sure you want to delete the scorecard for ${roundToDelete.courseName} (${roundToDelete.layoutName})? This cannot be undone.`}
                    />
                )}
            </div>
        </div>
    );
}