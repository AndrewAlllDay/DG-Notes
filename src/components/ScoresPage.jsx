// src/components/ScoresPage.jsx
import React, { useState, useEffect } from 'react'; // CORRECTED LINE
import { useFirebase } from '../firebase.js';
import { subscribeToRounds } from '../services/firestoreService.jsx';
import { format, isSameDay } from 'date-fns';
// REMOVED: import { GoogleGenerativeAI } from '@google/generative-ai'; // No longer needed directly in frontend

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

    // Define your backend function URL
    // For local testing, point to your local backend server.
    // For deployment, this will be your Google Cloud Function URL.
    const BACKEND_API_URL = 'https://us-central1-disc-golf-notes.cloudfunctions.net/gemini-score-analyzer'; // <-- UPDATED FOR LOCAL TESTING

    useEffect(() => {
        if (!isAuthReady) return;

        if (userId) {
            setIsLoading(true);
            const unsubscribe = subscribeToRounds(userId, (fetchedRounds) => {
                // --- Start of Deduplication Logic ---
                const uniqueRoundsMap = new Map(); // Key: `${courseName}-${layoutName}-${dateFormatted}`
                // Value: the round object

                fetchedRounds.forEach(round => {
                    // Ensure round.date is a Date object for isSameDay comparison
                    const roundDate = round.date?.toDate ? round.date.toDate() : null;

                    if (roundDate) {
                        // Create a unique key for each round based on course, layout, and date
                        // Use format(date, 'yyyy-MM-dd') to only consider the day, month, and year
                        const dateKey = format(roundDate, 'yyyy-MM-dd');
                        const uniqueKey = `${round.courseName || ''}-${round.layoutName || ''}-${dateKey}`;

                        // If this key hasn't been seen before, add the round to the map
                        if (!uniqueRoundsMap.has(uniqueKey)) {
                            uniqueRoundsMap.set(uniqueKey, round);
                        }
                        // Optional: If you want to keep the "latest" score for a given day/course/layout,
                        // you could add logic here to compare totalScore or timestamp and replace
                        // if the new round is "better" or more recent. For now, it keeps the first one it encounters.
                    } else {
                        // If date is missing/invalid, you might still want to add it
                        // or handle it differently. For simplicity, we'll just add unique by ID.
                        uniqueRoundsMap.set(round.id, round); // Fallback to ID uniqueness
                    }
                });

                // Convert the Map values back to an array
                const deduplicatedRounds = Array.from(uniqueRoundsMap.values());

                // Sort the deduplicated rounds (e.g., by date descending)
                deduplicatedRounds.sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate() : new Date(0); // Handle potentially missing dates
                    const dateB = b.date?.toDate ? b.date.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });

                setRounds(deduplicatedRounds);
                // --- End of Deduplication Logic ---
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

    // --- Gemini Integration Logic (Now calling your Backend) ---
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
                    rounds: rounds.map(round => ({ // Send necessary data to backend
                        courseName: round.courseName,
                        layoutName: round.layoutName,
                        date: round.date, // Send Firestore Timestamp as is, backend will convert
                        totalScore: round.totalScore,
                        scoreToPar: round.scoreToPar
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
    // --- End Gemini Integration Logic ---

    if (isLoading) {
        return <div className="text-center p-8">Loading scores...</div>;
    }

    return (
        <div className="max-h-screen bg-gray-100 dark:bg-black p-4 pb-36 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5 text-gray-800 dark:text-gray-100">My Scores</h2>

            {/* --- Gemini Integration UI (Moved to Top) --- */}
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
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
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
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

            {/* Existing Scores Display remains below */}
            {rounds.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400">You haven't imported any scores yet.</p>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    {rounds.map(round => (
                        <div key={round.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{round.courseName}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{round.layoutName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A Date'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{round.totalScore}</p>
                                    <p className={`text-lg font-semibold ${round.scoreToPar === 0 ? 'text-gray-500' : round.scoreToPar > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatScoreToPar(round.scoreToPar)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}