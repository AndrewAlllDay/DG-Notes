// src/components/ScoresPage.jsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase.js';
import { subscribeToRounds } from '../services/firestoreService.jsx';
import { format, isSameDay } from 'date-fns';
import { generateText } from '../services/geminiService.jsx'; // Import Gemini service

export default function ScoresPage() {
    const { userId, isAuthReady } = useFirebase();
    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // NEW: State for AI summary and loading
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState('');

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

    // NEW: Function to generate the summary
    const handleGenerateSummary = async () => {
        if (rounds.length === 0) {
            setSummaryError("No scores available to generate a summary.");
            return;
        }

        setIsGeneratingSummary(true);
        setAiSummary('');
        setSummaryError('');

        // Construct a detailed prompt based on available rounds
        let prompt = `Analyze the following disc golf rounds and provide a concise summary (2-3 sentences) of the player's performance. Highlight any trends, strengths, or areas for improvement.
        Strictly adhere to the 2-3 sentence limit.

        Here are the rounds:
        `;

        rounds.forEach((round, index) => {
            const date = round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A';
            prompt += `\nRound ${index + 1}:
            Course: ${round.courseName}
            Layout: ${round.layoutName || 'N/A'}
            Date: ${date}
            Total Score: ${round.totalScore}
            Score to Par: ${formatScoreToPar(round.scoreToPar)}
            Hole Scores: ${round.scores ? round.scores.join(', ') : 'N/A'}
            ---`;
        });

        prompt += `\n\nBased on this data, provide a summary focusing on overall performance.`;

        try {
            const summary = await generateText(prompt);
            setAiSummary(summary);
        } catch (err) {
            console.error("Error generating AI summary:", err);
            setSummaryError("Failed to generate summary. Please try again.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading scores...</div>;
    }

    return (
        <div className="max-h-screen bg-gray-100 dark:bg-black p-4 pb-28">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5 text-gray-800 dark:text-gray-100">My Scores</h2>

            {/* NEW: AI Summary Section */}
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || rounds.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isGeneratingSummary ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Summary...
                        </>
                    ) : (
                        <>
                            Generate AI Round Summary
                        </>
                    )}
                </button>
                {aiSummary && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md text-blue-800 dark:text-blue-200 text-sm italic border border-blue-200 dark:border-blue-700">
                        <h4 className="font-semibold mb-1">AI Insights:</h4>
                        <p>{aiSummary}</p>
                    </div>
                )}
                {summaryError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-md text-red-800 dark:text-red-200 text-sm italic border border-red-200 dark:border-red-700">
                        {summaryError}
                    </div>
                )}
            </div>
            {/* End NEW: AI Summary Section */}

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