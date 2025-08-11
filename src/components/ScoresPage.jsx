import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase.js';
// Import firestore functions to fetch course details directly
import { db, appId } from '../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeToRounds, deleteRound } from '../services/firestoreService.jsx';
import { format } from 'date-fns';
import { FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function ScoresPage() {
    const { userId, isAuthReady } = useFirebase();
    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRoundId, setExpandedRoundId] = useState(null); // Tracks the expanded round

    // --- NEW STATE for expanded round details ---
    const [courseHoles, setCourseHoles] = useState([]);
    const [isHolesLoading, setIsHolesLoading] = useState(false);

    // --- Gemini Integration State ---
    const [geminiPrompt, setGeminiPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [geminiError, setGeminiError] = useState(null);
    // --- End Gemini Integration State ---

    // --- Delete Confirmation Modal State ---
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [roundToDelete, setRoundToDelete] = useState(null);
    // --- END NEW STATE ---

    const BACKEND_API_URL = 'https://us-central1-disc-golf-notes.cloudfunctions.net/gemini-score-analyzer/api/gemini-insight';

    useEffect(() => {
        if (!isAuthReady) return;

        if (userId) {
            setIsLoading(true);
            const unsubscribe = subscribeToRounds(userId, (fetchedRounds) => {
                const uniqueRoundsMap = new Map();
                fetchedRounds.forEach(round => {
                    const roundDate = round.date?.toDate ? round.date.toDate() : null;
                    if (roundDate) {
                        const dateKey = format(roundDate, 'yyyy-MM-dd');
                        const uniqueKey = `${round.courseName || ''}-${round.layoutName || ''}-${dateKey}`;
                        if (!uniqueRoundsMap.has(uniqueKey)) {
                            uniqueRoundsMap.set(uniqueKey, round);
                        }
                    } else {
                        uniqueRoundsMap.set(round.id, round);
                    }
                });
                const deduplicatedRounds = Array.from(uniqueRoundsMap.values());

                deduplicatedRounds.sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate() : new Date(0);
                    const dateB = b.date?.toDate ? b.date.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });

                setRounds(deduplicatedRounds);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setRounds([]);
            setIsLoading(false);
        }
    }, [userId, isAuthReady]);

    // MODIFIED: Fetches course details when a round is expanded
    const handleToggleExpand = async (roundId) => {
        const currentlyExpanded = expandedRoundId;

        // Collapse if clicking the same one
        if (currentlyExpanded === roundId) {
            setExpandedRoundId(null);
            setCourseHoles([]);
            return;
        }

        // Find the round object to get the courseId
        const round = rounds.find(r => r.id === roundId);
        if (!round || !round.courseId) {
            toast.error("Could not find course data for this round.");
            return;
        }

        setIsHolesLoading(true);
        setExpandedRoundId(roundId); // Expand immediately for better UX

        try {
            const courseDocRef = doc(db, `artifacts/${appId}/users/${userId}/courses`, round.courseId);
            const courseSnap = await getDoc(courseDocRef);

            if (courseSnap.exists()) {
                const courseData = courseSnap.data();
                setCourseHoles(courseData.holes || []);
            } else {
                toast.error("Course details not found.");
                setCourseHoles([]); // Clear out old data if any
            }
        } catch (error) {
            console.error("Error fetching course details:", error);
            toast.error("Failed to load hole details.");
        } finally {
            setIsHolesLoading(false);
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
        if (difference < 0) return 'text-green-500'; // Birdie or better
        if (difference > 0) return 'text-red-500';   // Bogey or worse
        return 'text-gray-500 dark:text-gray-400';   // Par
    };

    const handleDeleteRound = (e, roundId, courseName, layoutName) => {
        e.stopPropagation(); // Prevent the card from toggling expand/collapse
        if (!userId) {
            toast.error("You must be logged in to delete scores.");
            return;
        }
        setRoundToDelete({ id: roundId, courseName, layoutName });
        setShowDeleteConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!roundToDelete || !userId) {
            setShowDeleteConfirmModal(false);
            setRoundToDelete(null);
            return;
        }

        setShowDeleteConfirmModal(false);
        try {
            await deleteRound(userId, roundToDelete.id);
            toast.success(`Scorecard for ${roundToDelete.courseName} deleted successfully!`);
            setRoundToDelete(null);
        } catch (error) {
            console.error("Error deleting round:", error);
            toast.error(`Failed to delete scorecard: ${error.message}`);
            setRoundToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirmModal(false);
        setRoundToDelete(null);
    };

    const runGeminiAnalysis = async () => {
        if (!BACKEND_API_URL || BACKEND_API_URL.includes('your-function-name')) {
            setGeminiError("Backend API URL is not configured. Please set BACKEND_API_URL in ScoresPage.jsx.");
            return;
        }
        if (!geminiPrompt.trim() && rounds.length === 0) {
            setGeminiError("Please enter a prompt or ensure you have scores to analyze.");
            return;
        }
        setIsGeminiLoading(true);
        setGeminiError(null);
        setGeminiResponse('');
        try {
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: geminiPrompt,
                    rounds: rounds.map(round => ({
                        courseName: round.courseName,
                        layoutName: round.layoutName,
                        date: round.date,
                        totalScore: round.totalScore,
                        scoreToPar: round.scoreToPar,
                        scores: round.scores
                    }))
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setGeminiResponse(data.response);
        } catch (err) {
            console.error("Error communicating with backend:", err);
            setGeminiError(`Failed to get insights from Gemini: ${err.message}. Ensure your backend server is running.`);
        } finally {
            setIsGeminiLoading(false);
        }
    };

    if (isLoading) {
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
                            const sortedHoles = round.scores ? Object.keys(round.scores).sort((a, b) => parseInt(a) - parseInt(b)) : [];

                            return (
                                <div key={round.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer transition-all duration-300"
                                    onClick={() => handleToggleExpand(round.id)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{round.courseName}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{round.layoutName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A Date'}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex flex-col items-end">
                                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{round.totalScore}</p>
                                                <p className={`text-lg font-semibold ${round.scoreToPar === 0 ? 'text-gray-500' : round.scoreToPar > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {formatScoreToPar(round.scoreToPar)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteRound(e, round.id, round.courseName, round.layoutName)}
                                                className="p-2 !bg-transparent text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 relative"
                                                title={`Delete scorecard for ${round.courseName}`}
                                            >
                                                <FaTrash size={18} />
                                            </button>

                                        </div>
                                    </div>

                                    {round.notes && (
                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{round.notes}</p>
                                        </div>
                                    )}

                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="font-semibold text-md mb-3 text-gray-700 dark:text-gray-300">Hole Breakdown</h4>
                                            {isHolesLoading ? (
                                                <p className="text-center text-gray-500">Loading hole details...</p>
                                            ) : (
                                                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2 text-center">
                                                    {sortedHoles.map(holeNumber => {
                                                        const score = round.scores[holeNumber];
                                                        const holeDetail = courseHoles.find(h => h.number == holeNumber);
                                                        const par = holeDetail ? parseInt(holeDetail.par, 10) : null;
                                                        const scoreClass = getScoreColor(score, par);

                                                        return (
                                                            <div key={holeNumber} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Hole {holeNumber}</div>
                                                                <div className={`text-xl font-bold ${scoreClass}`}>{score}</div>
                                                                {par !== null && <div className="text-xs text-gray-500 dark:text-gray-400">Par {par}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
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
                        disabled={isGeminiLoading}
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
