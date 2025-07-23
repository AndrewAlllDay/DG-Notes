import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase.js';
import { subscribeToRounds, deleteRound } from '../services/firestoreService.jsx';
import { format, isSameDay } from 'date-fns';
import { FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function ScoresPage() {
    const { userId, isAuthReady } = useFirebase();
    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Gemini Integration State ---
    const [geminiPrompt, setGeminiPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [geminiError, setGeminiError] = useState(null);
    // --- End Gemini Integration State ---

    // --- Delete Confirmation Modal State ---
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [roundToDelete, setRoundToDelete] = useState(null); // Stores the round data to be deleted
    // --- END NEW STATE ---

    // --- NEW: Watch state changes for debugging (can be removed after confirmed working) ---
    useEffect(() => {
        console.log("Modal State Changed: showDeleteConfirmModal:", showDeleteConfirmModal, "roundToDelete:", roundToDelete ? roundToDelete.id : 'null');
    }, [showDeleteConfirmModal, roundToDelete]);
    // --- END NEW ---

    // Define your backend function URL
    // THIS IS YOUR LIVE DEPLOYED GOOGLE CLOUD FUNCTION URL + THE EXPRESS ROUTE
    const BACKEND_API_URL = 'https://us-central1-disc-golf-notes.cloudfunctions.net/gemini-score-analyzer/api/gemini-insight'; // Your live URL here

    useEffect(() => {
        if (!isAuthReady) return;

        if (userId) {
            setIsLoading(true);
            const unsubscribe = subscribeToRounds(userId, (fetchedRounds) => {
                // --- Start of Deduplication Logic ---
                const uniqueRoundsMap = new Map();
                fetchedRounds.forEach(round => { // Corrected parameter usage here
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

    const formatScoreToPar = (score) => {
        if (score === 0) return 'E';
        if (score > 0) return `+${score}`;
        return score;
    };

    // --- UPDATED: Function to handle round deletion (opens custom modal) ---
    const handleDeleteRound = async (roundId, courseName, layoutName) => {
        if (!userId) {
            toast.error("You must be logged in to delete scores.");
            return;
        }
        // Store the round data and show the modal
        setRoundToDelete({ id: roundId, courseName, layoutName });
        setShowDeleteConfirmModal(true);
        // Debugging logs (you can remove these after it's working)
        console.log("handleDeleteRound called for:", roundId);
        console.log("handleDeleteRound: Setting roundToDelete to", { id: roundId, courseName, layoutName });
        console.log("handleDeleteRound: Setting showDeleteConfirmModal to true");
    };
    // --- END UPDATED FUNCTION ---

    // --- Functions to confirm/cancel deletion from modal ---
    const confirmDelete = async () => {
        // Debugging logs (can be removed after confirmed working)
        console.log("confirmDelete: Attempting to delete round:", roundToDelete ? roundToDelete.id : 'null');
        if (!roundToDelete || !userId) {
            console.error("confirmDelete: Missing roundToDelete or userId. Aborting.");
            setShowDeleteConfirmModal(false);
            setRoundToDelete(null);
            return;
        }

        setShowDeleteConfirmModal(false); // Close the modal immediately
        try {
            await deleteRound(userId, roundToDelete.id);
            toast.success(`Scorecard for ${roundToDelete.courseName} deleted successfully!`);
            setRoundToDelete(null); // Clear the pending round data
            // Debugging logs (can be removed after confirmed working)
            console.log("confirmDelete: Deletion successful, state reset.");
        } catch (error) {
            console.error("Error deleting round:", error);
            toast.error(`Failed to delete scorecard: ${error.message}`);
            // Debugging logs (can be removed after confirmed working)
            console.log("confirmDelete: Deletion failed, state reset (modal closed).");
            setRoundToDelete(null); // Clear roundToDelete even on error
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirmModal(false);
        setRoundToDelete(null);
        // Debugging logs (can be removed after confirmed working)
        console.log("cancelDelete: Modal closed, deletion cancelled. State reset.");
    };
    // --- END FUNCTIONS ---

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
                headers: {
                    'Content-Type': 'application/json',
                },
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
        <div className="max-h-screen bg-gray-100 dark:bg-black p-4 pb-36 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5 text-gray-800 dark:text-gray-100">My Scores</h2>

            {/* Existing Scores Display (remains at the top, below title) */}
            {rounds.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400">You haven't imported any scores yet.</p>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    {rounds.map(round => (
                        <div key={round.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
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
                                        onClick={() => handleDeleteRound(round.id, round.courseName, round.layoutName)}
                                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title={`Delete scorecard for ${round.courseName}`}
                                    >
                                        <FaTrash size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Gemini Integration UI (MOVED TO BOTTOM) --- */}
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
            {/* --- End Gemini Integration UI --- */}

            {/* Render the Delete Confirmation Modal */}
            {roundToDelete && ( // Only render if there's a round pending deletion
                <DeleteConfirmationModal
                    key={roundToDelete.id} // Added key to force remount of modal
                    isOpen={showDeleteConfirmModal}
                    onClose={cancelDelete}
                    onConfirm={confirmDelete}
                    message={`Are you sure you want to delete the scorecard for ${roundToDelete.courseName} (${roundToDelete.layoutName})? This cannot be undone.`}
                />
            )}
        </div>
    );
}